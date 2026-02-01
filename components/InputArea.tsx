import React, { useRef, useState } from 'react';
import { Upload, Youtube, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Button from './Button';
import { getYouTubeVideoId } from '../utils/srtUtils';

interface InputAreaProps {
  onFileSelect: (file: File) => void;
  onUrlChange: (url: string) => void;
  videoUrl: string;
  selectedFile: File | null;
}

const InputArea: React.FC<InputAreaProps> = ({ onFileSelect, onUrlChange, videoUrl, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [urlError, setUrlError] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.srt')) {
        onFileSelect(file);
      } else {
        alert("Please upload a valid .srt file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onUrlChange(val);
    if (val && !getYouTubeVideoId(val)) {
      setUrlError('Invalid YouTube URL');
    } else {
      setUrlError('');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* YouTube URL Input */}
      <div className="bg-surface rounded-xl p-6 border border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Youtube className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="font-semibold text-zinc-100">Video Source</h2>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Paste YouTube URL here..."
            value={videoUrl}
            onChange={handleUrlInput}
            className={`w-full bg-zinc-900 border ${urlError ? 'border-red-500/50' : 'border-zinc-700'} text-zinc-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-zinc-500`}
          />
          {urlError && <p className="absolute -bottom-6 left-0 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12}/> {urlError}</p>}
        </div>
        <p className="text-xs text-zinc-500 mt-6">
          Paste a YouTube link to visualize the subtitles alongside the video.
        </p>
      </div>

      {/* File Upload */}
      <div 
        className={`bg-surface rounded-xl p-6 border transition-all duration-200 ${dragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-800'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Upload className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="font-semibold text-zinc-100">Subtitle File</h2>
        </div>
        
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".srt" 
          onChange={handleFileChange} 
          className="hidden" 
        />

        {selectedFile ? (
          <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="w-8 h-8 text-indigo-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{selectedFile.name}</p>
                <p className="text-xs text-zinc-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button variant="ghost" className="text-xs" onClick={() => fileInputRef.current?.click()}>
              Change
            </Button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/50 rounded-lg p-6 text-center cursor-pointer transition-colors group"
          >
            <div className="w-10 h-10 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
              <Upload className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400" />
            </div>
            <p className="text-sm text-zinc-300 font-medium">Click to upload or drag & drop</p>
            <p className="text-xs text-zinc-500 mt-1">SRT files only</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputArea;