import { GoogleGenAI, Type } from "@google/genai";
import { SubtitleBlock, VerificationResult, VerificationItem } from "../types";

const getAiClient = () => {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in the top right settings.");
  }
  return new GoogleGenAI({ apiKey });
};

export const translateSubtitles = async (
  blocks: SubtitleBlock[],
  sourceLanguage: string = 'Auto Detect',
  targetLanguage: string = 'English'
): Promise<SubtitleBlock[]> => {
  const ai = getAiClient();

  // Use original text if available to avoid pivot translation errors when switching languages
  const textPayload = blocks.map(b => `[ID:${b.id}] ${b.originalText || b.text}`).join('\n');

  let languageInstruction = `Target Language: ${targetLanguage}.`;
  if (targetLanguage === "Hindi (Romanized)") {
    languageInstruction = "Target Language: Hindi (written in Roman script/Hinglish). Use natural conversational style.";
  }

  const prompt = `
    You are an expert subtitle translator. 
    Source Language: ${sourceLanguage}.
    ${languageInstruction}
    
    Translate the following subtitle lines into the target language.
    
    RULES:
    1. Maintain the exact number of lines.
    2. Do NOT merge lines.
    3. Do NOT change the [ID:x] prefix.
    4. Keep the translation concise to fit subtitle timing constraints where possible.
    5. Output ONLY the translated lines with their ID prefixes.
    
    Input:
    ${textPayload}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    const translatedText = response.text || '';
    
    const lines = translatedText.split('\n');
    const translationMap = new Map<number, string>();

    lines.forEach(line => {
      const match = line.match(/^\[ID:(\d+)\]\s*(.*)/);
      if (match) {
        translationMap.set(parseInt(match[1]), match[2].trim());
      }
    });

    const newBlocks = blocks.map(block => ({
      ...block,
      text: translationMap.get(block.id) || block.text
    }));

    return newBlocks;

  } catch (error) {
    console.error("Gemini Translation Error:", error);
    throw new Error("Failed to translate subtitles. Please try again.");
  }
};

export const verifySubtitleTranslation = async (
  sourceBlocks: SubtitleBlock[],
  targetBlocks: SubtitleBlock[],
  sourceLanguage: string = 'Auto Detect',
  targetLanguage: string = 'English'
): Promise<VerificationResult> => {
  const ai = getAiClient();

  // 1. Structural Comparison
  const verificationMap = new Map<number, Partial<VerificationItem>>();
  let timestampMismatchCount = 0;

  // Create map of target blocks for O(1) lookup
  const targetMap = new Map(targetBlocks.map(b => [b.id, b]));

  const comparisonData: string[] = [];

  for (const src of sourceBlocks) {
    const target = targetMap.get(src.id);
    
    // If no matching ID in target, it's a structural error (missing line)
    if (!target) {
       // We can't really verify it if it's missing, but we'll flag it implicitly by absence or custom logic
       continue; 
    }

    const timestampMismatch = (src.startTime !== target.startTime) || (src.endTime !== target.endTime);
    if (timestampMismatch) timestampMismatchCount++;

    verificationMap.set(src.id, {
      id: src.id,
      sourceText: src.text,
      translatedText: target.text,
      startTime: src.startTime, // Use Source timestamps to ensure perfect alignment in export
      endTime: src.endTime,
      timestampMismatch
    });

    // Prepare data for AI
    comparisonData.push(`ID: ${src.id}\nSource: ${src.text}\nTranslation: ${target.text}`);
  }

  let languageInstruction = `Target Language: ${targetLanguage}`;
  if (targetLanguage === "Hindi (Romanized)") {
    languageInstruction = "Target Language: Hindi (written in Roman script/Hinglish)";
  }

  // 2. AI Linguistic Evaluation
  const prompt = `
    You are a professional subtitle Quality Assurance specialist.
    Source Language: ${sourceLanguage}
    ${languageInstruction}

    Your task is to verify the translation accuracy of the following subtitle pairs.
    
    Evaluate each pair for:
    1. Meaning accuracy (does the translation convey the original meaning?).
    2. Tone and context.

    For each item, assign a status: 'correct', 'minor_issue', or 'incorrect'.
    Provide brief feedback for any issues.
    Also provide an overall score (0-100) and a brief summary of the translation quality.

    Input Pairs:
    ${comparisonData.join('\n---\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  status: { type: Type.STRING, description: "Must be one of: correct, minor_issue, incorrect" },
                  feedback: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const aiResult = JSON.parse(response.text || '{}');
    
    // Merge AI results with structural data
    const finalItems: VerificationItem[] = [];
    
    // Using the sourceBlocks to drive the order
    for (const src of sourceBlocks) {
      const structuralInfo = verificationMap.get(src.id);
      if (!structuralInfo) continue;

      const aiItem = aiResult.items?.find((i: any) => i.id === src.id);

      finalItems.push({
        id: src.id,
        sourceText: structuralInfo.sourceText || '',
        translatedText: structuralInfo.translatedText || '',
        startTime: structuralInfo.startTime || '',
        endTime: structuralInfo.endTime || '',
        timestampMismatch: structuralInfo.timestampMismatch || false,
        status: aiItem?.status || 'correct', 
        feedback: aiItem?.feedback || (structuralInfo.timestampMismatch ? 'Timestamp mismatch detected' : 'No issues found')
      });
    }

    return {
      overallScore: aiResult.overallScore || 0,
      summary: aiResult.summary || "Analysis completed.",
      items: finalItems,
      timestampMismatchCount
    };

  } catch (error) {
    console.error("Verification Error:", error);
    throw new Error("Failed to verify subtitles.");
  }
};

export const getImprovedTranslation = async (
  sourceText: string,
  currentTranslation: string,
  sourceLanguage: string,
  targetLanguage: string = 'English'
): Promise<string> => {
  const ai = getAiClient();
  
  let languageInstruction = `Target Language: ${targetLanguage}`;
  if (targetLanguage === "Hindi (Romanized)") {
    languageInstruction = "Target Language: Hindi (written in Roman script/Hinglish)";
  }

  const prompt = `
    Act as a professional subtitle translator.
    Source Language: ${sourceLanguage}
    ${languageInstruction}
    
    Original Text: "${sourceText}"
    Current Translation: "${currentTranslation}"
    
    Task: Provide a single, improved translation that is more accurate, natural, and concise. 
    It should fix any grammatical errors or awkward phrasing in the current translation.
    Only return the translated text string. Do not add quotes or explanations.
  `;
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });
    
    return response.text?.trim() || currentTranslation;
  } catch (error) {
    console.error("AI Improvement Error:", error);
    throw error;
  }
};