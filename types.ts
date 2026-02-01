export interface SubtitleBlock {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  originalText?: string;
}

export interface TranslationState {
  status: 'idle' | 'parsing' | 'translating' | 'completed' | 'error';
  progress: number; // 0 to 100
  error?: string;
}

export interface SrtFile {
  name: string;
  content: string;
  blocks: SubtitleBlock[];
}

export interface VerificationItem {
  id: number;
  status: 'correct' | 'minor_issue' | 'incorrect' | 'corrected';
  feedback: string;
  sourceText: string;
  translatedText: string;
  startTime: string;
  endTime: string;
  timestampMismatch: boolean;
}

export interface VerificationResult {
  overallScore: number;
  summary: string;
  items: VerificationItem[];
  timestampMismatchCount: number;
}
