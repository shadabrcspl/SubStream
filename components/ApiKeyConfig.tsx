import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import Button from './Button';

const ApiKeyConfig: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="text-zinc-400 hover:text-white flex items-center gap-2"
        title="Set API Key"
      >
        <Key className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">API Key</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-sm font-semibold text-zinc-100 mb-3">Gemini API Key</h3>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API Key"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-500"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="!text-xs !h-8 !px-3" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" className="!text-xs !h-8 !px-3" onClick={handleSave}>
              Save
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-3 border-t border-zinc-800 pt-2">
            Key is stored locally in your browser. Leave empty to use default env key if available.
          </p>
        </div>
      )}
    </div>
  );
};

export default ApiKeyConfig;
