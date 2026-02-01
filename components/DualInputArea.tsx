import React, { useRef } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import Button from './Button';

interface DualInputAreaProps {
  onSourceFileSelect: (file: File) => void;
  onTargetFileSelect: (file: File) => void;
  sourceFile: File | null;
  targetFile: File | null;
}

const DualInputArea: React.FC<DualInputAreaProps> = ({ 
  onSourceFileSelect, 
  onTargetFileSelect, 
  sourceFile, 
  targetFile 
}) => {
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const FileCard = ({ 
    file, 
    label, 
    onClick, 
    colorClass 
  }: { 
    file: File | null, 
    label: string, 
    onClick: () => void,
    colorClass: string 
  }) => (
    <div className="flex-1 bg-surface rounded-xl p-6 border border-zinc-800 flex flex-col items-center justify-center text-center transition-all hover:border-zinc-700">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{label}</h3>
      
      {file ? (
        <div className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                <FileText className={`w-6 h-6 ${colorClass}`} />
             </div>
             <div className="text-left min-w-0">
               <p className="text-sm font-medium text-zinc-200 truncate max-w-[150px]">{file.name}</p>
               <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
             </div>
          </div>
          <Button variant="ghost" className="text-xs h-8 px-2" onClick={onClick}>Change</Button>
        </div>
      ) : (
        <div 
          onClick={onClick}
          className="w-full border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-8 cursor-pointer group transition-colors"
        >
          <div className="w-12 h-12 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
            <Upload className="w-6 h-6 text-zinc-400 group-hover:text-zinc-200" />
          </div>
          <p className="text-zinc-300 font-medium">Upload SRT</p>
          <p className="text-xs text-zinc-500 mt-1">Click to browse</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <input 
        type="file" 
        accept=".srt" 
        ref={sourceInputRef} 
        className="hidden" 
        onChange={(e) => e.target.files?.[0] && onSourceFileSelect(e.target.files[0])} 
      />
      <input 
        type="file" 
        accept=".srt" 
        ref={targetInputRef} 
        className="hidden" 
        onChange={(e) => e.target.files?.[0] && onTargetFileSelect(e.target.files[0])} 
      />

      <FileCard 
        label="Original File (Source)" 
        file={sourceFile} 
        onClick={() => sourceInputRef.current?.click()} 
        colorClass="text-indigo-400"
      />
      
      <FileCard 
        label="Translated File (English)" 
        file={targetFile} 
        onClick={() => targetInputRef.current?.click()} 
        colorClass="text-purple-400"
      />
    </div>
  );
};

export default DualInputArea;