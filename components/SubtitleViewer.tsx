import React, { useEffect, useRef } from 'react';
import { SubtitleBlock } from '../types';
import { Download, Copy, Check } from 'lucide-react';
import Button from './Button';
import { stringifySRT } from '../utils/srtUtils';

interface SubtitleViewerProps {
  blocks: SubtitleBlock[];
  isTranslated: boolean;
  fileName: string;
  targetLanguage?: string;
}

const SubtitleViewer: React.FC<SubtitleViewerProps> = ({ blocks, isTranslated, fileName, targetLanguage = 'English' }) => {
  const [copied, setCopied] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const content = stringifySRT(blocks);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_${fileName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const content = stringifySRT(blocks);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl border border-zinc-800 overflow-hidden shadow-lg">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <h3 className="font-semibold text-zinc-200">
          {isTranslated ? `${targetLanguage} Translation` : 'Original Subtitles'}
        </h3>
        {isTranslated && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleCopy} className="p-2 h-8 w-8 !px-0" title="Copy to clipboard">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="primary" onClick={handleDownload} className="text-xs px-3 py-1.5 h-8">
              <Download className="w-3 h-3" /> Download SRT
            </Button>
          </div>
        )}
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {blocks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <p>No subtitle content to display</p>
          </div>
        ) : (
          blocks.map((block) => (
            <div key={block.id} className="group hover:bg-zinc-800/50 p-3 rounded-lg transition-colors border border-transparent hover:border-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-zinc-500">#{block.id}</span>
                <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  {block.startTime}
                </span>
              </div>
              
              {isTranslated && block.originalText && (
                <p className="text-sm text-zinc-500 mb-1 line-through opacity-50">{block.originalText}</p>
              )}
              
              <p className={`text-sm ${isTranslated ? 'text-zinc-100 font-medium' : 'text-zinc-300'}`}>
                {block.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SubtitleViewer;