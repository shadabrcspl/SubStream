import React, { useState } from 'react';
import { Sparkles, MessageSquare, Globe, ArrowRight, Youtube, CheckCircle, ShieldCheck } from 'lucide-react';
import InputArea from './components/InputArea';
import DualInputArea from './components/DualInputArea';
import VideoPreview from './components/VideoPreview';
import SubtitleViewer from './components/SubtitleViewer';
import VerificationReport from './components/VerificationReport';
import Button from './components/Button';
import ApiKeyConfig from './components/ApiKeyConfig';
import { SrtFile, TranslationState, VerificationResult } from './types';
import { parseSRT } from './utils/srtUtils';
import { translateSubtitles, verifySubtitleTranslation, getImprovedTranslation } from './services/geminiService';

type AppMode = 'translate' | 'verify';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('translate');
  
  // Translate Mode State
  const [videoUrl, setVideoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<SrtFile | null>(null);
  
  // Verify Mode State
  const [verifySourceFile, setVerifySourceFile] = useState<File | null>(null);
  const [verifyTargetFile, setVerifyTargetFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Shared State
  const [processingState, setProcessingState] = useState<TranslationState>({ status: 'idle', progress: 0 });
  const [sourceLang, setSourceLang] = useState('Auto Detect');
  const [targetLang, setTargetLang] = useState('English');

  // Handle Translate Mode File Selection
  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setProcessingState({ status: 'parsing', progress: 0 });
    try {
      const text = await selectedFile.text();
      const blocks = parseSRT(text);
      setParsedData({
        name: selectedFile.name,
        content: text,
        blocks: blocks
      });
      setProcessingState({ status: 'idle', progress: 0 });
    } catch (err) {
      console.error(err);
      setProcessingState({ status: 'error', progress: 0, error: 'Failed to parse SRT file' });
    }
  };

  const handleTranslate = async () => {
    if (!parsedData) return;

    setProcessingState({ status: 'translating', progress: 0 });
    
    try {
      const progressInterval = setInterval(() => {
        setProcessingState(prev => ({ 
          ...prev, 
          progress: Math.min(prev.progress + 10, 90) 
        }));
      }, 500);

      const translatedBlocks = await translateSubtitles(parsedData.blocks, sourceLang, targetLang);
      
      clearInterval(progressInterval);
      
      setParsedData(prev => prev ? {
        ...prev,
        blocks: translatedBlocks
      } : null);

      setProcessingState({ status: 'completed', progress: 100 });
    } catch (error) {
      setProcessingState({ 
        status: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : "Translation failed" 
      });
    }
  };

  const handleVerify = async () => {
    if (!verifySourceFile || !verifyTargetFile) return;

    setProcessingState({ status: 'translating', progress: 0 }); // Reusing status for loading UI

    try {
      const sourceText = await verifySourceFile.text();
      const targetText = await verifyTargetFile.text();
      
      const sourceBlocks = parseSRT(sourceText);
      const targetBlocks = parseSRT(targetText);

      // Simple validation before sending to AI
      if (sourceBlocks.length === 0 || targetBlocks.length === 0) {
        throw new Error("One or both files appear to be empty or invalid.");
      }

      const result = await verifySubtitleTranslation(sourceBlocks, targetBlocks, sourceLang, targetLang);
      
      setVerificationResult(result);
      setProcessingState({ status: 'completed', progress: 100 });
    } catch (error) {
      setProcessingState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : "Verification failed"
      });
    }
  };

  const handleVerificationItemUpdate = (id: number, newText: string) => {
    setVerificationResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === id 
            ? { ...item, translatedText: newText, status: 'corrected' }
            : item
        )
      };
    });
  };

  const handleBulkStatusUpdate = (ids: number[], newStatus: 'correct' | 'minor_issue' | 'incorrect') => {
    setVerificationResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          ids.includes(item.id)
            ? { ...item, status: newStatus }
            : item
        )
      };
    });
  };

  const handleGetSuggestion = async (sourceText: string, currentText: string) => {
    try {
      const suggestion = await getImprovedTranslation(sourceText, currentText, sourceLang, targetLang);
      return suggestion;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const LanguageSelector = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string, 
    value: string, 
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void 
  }) => (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-zinc-900 rounded-lg p-1 flex items-center border border-zinc-700">
         <div className="px-3 py-2 border-r border-zinc-700 flex items-center gap-2 text-zinc-400 min-w-[100px]">
            <Globe className="w-4 h-4" />
            <span className="text-sm">{label}</span>
         </div>
         <select 
           className="bg-transparent text-zinc-200 text-sm font-medium px-4 py-2 focus:outline-none cursor-pointer w-full min-w-[140px]"
           value={value}
           onChange={onChange}
         >
           {label === 'Source' && <option value="Auto Detect">Auto Detect</option>}
           <option value="English">English</option>
           <option value="Spanish">Spanish</option>
           <option value="French">French</option>
           <option value="German">German</option>
           <option value="Hindi">Hindi</option>
           <option value="Hindi (Romanized)">Hindi (Romanized)</option>
           <option value="Punjabi">Punjabi</option>
           <option value="Chinese">Chinese</option>
           <option value="Japanese">Japanese</option>
           <option value="Korean">Korean</option>
           <option value="Russian">Russian</option>
           <option value="Portuguese">Portuguese</option>
           <option value="Italian">Italian</option>
         </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SubStream</h1>
          </div>
          <ApiKeyConfig />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Mode Toggles */}
        <div className="flex justify-center mb-10">
          <div className="bg-surface border border-zinc-800 p-1 rounded-xl inline-flex">
            <button
              onClick={() => { setMode('translate'); setProcessingState({status:'idle', progress:0}); }}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                mode === 'translate' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Globe className="w-4 h-4" /> Translator
            </button>
            <button
              onClick={() => { setMode('verify'); setProcessingState({status:'idle', progress:0}); }}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                mode === 'verify' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Quality Check
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            {mode === 'translate' ? 'Translate Subtitles Instantly' : 'Validate Translation Accuracy'}
          </h2>
          <p className="text-zinc-400 text-lg">
            {mode === 'translate' 
              ? "Upload your SRT file and select languages. We'll perfectly time-align and translate your subtitles."
              : "Upload both original and translated subtitles. We'll verify time-sync accuracy and evaluate translation quality."}
          </p>
        </div>

        {/* Main Content Area based on Mode */}
        {mode === 'translate' ? (
          <>
            <InputArea 
              onFileSelect={handleFileSelect} 
              onUrlChange={setVideoUrl} 
              videoUrl={videoUrl}
              selectedFile={file}
            />

            {/* Action Bar */}
            <div className="flex flex-col xl:flex-row items-center justify-center gap-4 mb-12">
               <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                  <LanguageSelector 
                    label="Source" 
                    value={sourceLang} 
                    onChange={(e) => setSourceLang(e.target.value)} 
                  />
                  <div className="hidden sm:flex items-center justify-center text-zinc-600">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <LanguageSelector 
                    label="Target" 
                    value={targetLang} 
                    onChange={(e) => setTargetLang(e.target.value)} 
                  />
               </div>
               
               <Button 
                variant="primary" 
                size="lg"
                className="w-full xl:w-auto px-8 py-3 text-lg shadow-xl shadow-indigo-900/20 whitespace-nowrap"
                disabled={!parsedData || processingState.status === 'translating'}
                isLoading={processingState.status === 'translating'}
                onClick={handleTranslate}
               >
                 {processingState.status === 'completed' ? 'Translate Again' : 'Start Translation'}
               </Button>
            </div>

            {processingState.error && (
              <div className="mb-8 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-center">
                {processingState.error}
              </div>
            )}

            {parsedData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-2 text-zinc-400 mb-1">
                     <Youtube className="w-4 h-4" />
                     <span className="text-sm font-medium uppercase tracking-wider">Video Preview</span>
                   </div>
                   {videoUrl ? (
                     <VideoPreview url={videoUrl} />
                   ) : (
                     <div className="w-full pt-[56.25%] bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center justify-center relative">
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                          <Youtube className="w-12 h-12 mb-2 opacity-50" />
                          <p>No video URL provided</p>
                       </div>
                     </div>
                   )}
                   
                   <div className="bg-surface border border-zinc-800 rounded-xl p-5 mt-2">
                     <h3 className="text-zinc-100 font-semibold mb-3 flex items-center gap-2">
                       <MessageSquare className="w-4 h-4 text-secondary" /> 
                       Statistics
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="bg-zinc-900/50 p-3 rounded-lg">
                         <p className="text-xs text-zinc-500 mb-1">Total Subtitles</p>
                         <p className="text-xl font-mono text-zinc-200">{parsedData.blocks.length}</p>
                       </div>
                       <div className="bg-zinc-900/50 p-3 rounded-lg">
                         <p className="text-xs text-zinc-500 mb-1">Duration</p>
                         <p className="text-xl font-mono text-zinc-200">
                            {parsedData.blocks.length > 0 ? parsedData.blocks[parsedData.blocks.length-1].endTime.split(',')[0] : '00:00:00'}
                         </p>
                       </div>
                     </div>
                   </div>
                </div>

                <div className="h-[600px] flex flex-col">
                  <div className="flex items-center gap-2 text-zinc-400 mb-4">
                     <Globe className="w-4 h-4" />
                     <span className="text-sm font-medium uppercase tracking-wider">
                        {processingState.status === 'completed' ? 'Translated Result' : 'Source Preview'}
                     </span>
                   </div>
                  <SubtitleViewer 
                    blocks={parsedData.blocks} 
                    isTranslated={processingState.status === 'completed'}
                    fileName={parsedData.name}
                    targetLanguage={targetLang}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Verify Mode */
          <>
            <DualInputArea 
              sourceFile={verifySourceFile}
              targetFile={verifyTargetFile}
              onSourceFileSelect={setVerifySourceFile}
              onTargetFileSelect={setVerifyTargetFile}
            />

            <div className="flex flex-col items-center gap-6 mb-12">
               <div className="flex flex-col sm:flex-row gap-4">
                  <LanguageSelector 
                    label="Source" 
                    value={sourceLang} 
                    onChange={(e) => setSourceLang(e.target.value)} 
                  />
                  <div className="hidden sm:flex items-center justify-center text-zinc-600">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <LanguageSelector 
                    label="Target" 
                    value={targetLang} 
                    onChange={(e) => setTargetLang(e.target.value)} 
                  />
               </div>

               <Button 
                variant="primary" 
                size="lg"
                className="px-8 py-3 text-lg shadow-xl shadow-indigo-900/20 min-w-[200px]"
                disabled={!verifySourceFile || !verifyTargetFile || processingState.status === 'translating'}
                isLoading={processingState.status === 'translating'}
                onClick={handleVerify}
               >
                 Run Analysis
               </Button>
            </div>

            {processingState.error && (
              <div className="mb-8 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-center">
                {processingState.error}
              </div>
            )}

            {verificationResult && (
              <VerificationReport 
                result={verificationResult} 
                onUpdateItem={handleVerificationItemUpdate}
                onGetAIImprovement={handleGetSuggestion}
                onBulkStatusUpdate={handleBulkStatusUpdate}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-zinc-800 py-8 mt-12 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} SubStream. Powered by Gemini Flash.</p>
      </footer>
    </div>
  );
};

export default App;