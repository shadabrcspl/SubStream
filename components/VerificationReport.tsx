import React, { useState } from 'react';
import { VerificationResult, VerificationItem, SubtitleBlock } from '../types';
import { AlertCircle, CheckCircle2, Clock, Info, Download, Save, Edit2, Sparkles, X, Check, ListChecks, CheckSquare, Filter } from 'lucide-react';
import Button from './Button';
import { stringifySRT } from '../utils/srtUtils';

interface VerificationReportProps {
  result: VerificationResult;
  onUpdateItem: (id: number, newText: string) => void;
  onGetAIImprovement: (sourceText: string, currentText: string) => Promise<string | null>;
  onBulkStatusUpdate: (ids: number[], newStatus: 'correct' | 'minor_issue' | 'incorrect') => void;
}

const VerificationReport: React.FC<VerificationReportProps> = ({ result, onUpdateItem, onGetAIImprovement, onBulkStatusUpdate }) => {
  const [suggestions, setSuggestions] = useState<Record<number, string>>({});
  const [loadingSuggestionId, setLoadingSuggestionId] = useState<number | null>(null);
  
  // Bulk Edit State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'minor_issue' | 'incorrect' | 'timestamp_mismatch'>('all');

  const handleExport = () => {
    const blocks: SubtitleBlock[] = result.items.map(item => ({
      id: item.id,
      startTime: item.startTime,
      endTime: item.endTime,
      text: item.translatedText
    }));
    
    const content = stringifySRT(blocks);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrected_subtitles.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGetSuggestion = async (id: number, source: string, current: string) => {
    setLoadingSuggestionId(id);
    const suggestion = await onGetAIImprovement(source, current);
    if (suggestion) {
      setSuggestions(prev => ({ ...prev, [id]: suggestion }));
    }
    setLoadingSuggestionId(null);
  };

  const handleApplySuggestion = (id: number) => {
    if (suggestions[id]) {
      onUpdateItem(id, suggestions[id]);
      handleDismissSuggestion(id);
    }
  };

  const handleDismissSuggestion = (id: number) => {
    setSuggestions(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Filter Logic
  const filteredItems = result.items.filter(item => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'timestamp_mismatch') return item.timestampMismatch;
    if (filterStatus === 'correct') return item.status === 'correct' || item.status === 'corrected';
    return item.status === filterStatus;
  });

  // Bulk Edit Handlers
  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    // Check if all *filtered* items are currently selected
    const allFilteredSelected = filteredItems.length > 0 && filteredItems.every(item => selectedIds.has(item.id));

    if (allFilteredSelected) {
      // Deselect currently visible items
      const newSet = new Set(selectedIds);
      filteredItems.forEach(item => newSet.delete(item.id));
      setSelectedIds(newSet);
    } else {
      // Select all currently visible items
      const newSet = new Set(selectedIds);
      filteredItems.forEach(item => newSet.add(item.id));
      setSelectedIds(newSet);
    }
  };

  const applyBulkStatus = (status: 'correct' | 'minor_issue' | 'incorrect') => {
    onBulkStatusUpdate(Array.from(selectedIds), status);
    setSelectedIds(new Set());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'minor_issue': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'incorrect': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'corrected': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400 ring-green-400/30';
    if (score >= 70) return 'text-yellow-400 ring-yellow-400/30';
    return 'text-red-400 ring-red-400/30';
  };

  const FilterControls = () => (
    <div className="flex items-center bg-zinc-800 rounded-lg p-1 mr-auto md:mr-0 order-last md:order-none w-full md:w-auto overflow-x-auto">
        <button onClick={() => setFilterStatus('all')} className={`flex-shrink-0 px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap ${filterStatus === 'all' ? 'bg-zinc-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>All</button>
        <button onClick={() => setFilterStatus('incorrect')} className={`flex-shrink-0 px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap ${filterStatus === 'incorrect' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-zinc-400 hover:text-red-400'}`}>Incorrect</button>
        <button onClick={() => setFilterStatus('minor_issue')} className={`flex-shrink-0 px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap ${filterStatus === 'minor_issue' ? 'bg-yellow-500/20 text-yellow-400 shadow-sm' : 'text-zinc-400 hover:text-yellow-400'}`}>Minor Issues</button>
        <button onClick={() => setFilterStatus('timestamp_mismatch')} className={`flex-shrink-0 px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap ${filterStatus === 'timestamp_mismatch' ? 'bg-orange-500/20 text-orange-400 shadow-sm' : 'text-zinc-400 hover:text-orange-400'}`}>Time Mismatch</button>
        <button onClick={() => setFilterStatus('correct')} className={`flex-shrink-0 px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap ${filterStatus === 'correct' ? 'bg-green-500/20 text-green-400 shadow-sm' : 'text-zinc-400 hover:text-green-400'}`}>Correct</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Overview Card */}
      <div className="bg-surface rounded-xl border border-zinc-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="relative flex-shrink-0">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center ring-4 ${getScoreColor(result.overallScore)} bg-zinc-900`}>
              <div className="text-center">
                <span className="block text-4xl font-bold">{result.overallScore}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wide">Quality Score</span>
              </div>
            </div>
          </div>

          {/* Summary Text */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-xl font-bold text-zinc-100">Analysis & Correction</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Review the feedback below and edit the translations to fix any issues. 
                  Timestamps are locked to the original file to ensure perfect sync.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <Button 
                    variant={isBulkMode ? "primary" : "outline"} 
                    onClick={toggleBulkMode} 
                    className="flex-shrink-0"
                >
                    <ListChecks className="w-4 h-4" /> {isBulkMode ? 'Exit Bulk Edit' : 'Bulk Edit'}
                </Button>
                <Button onClick={handleExport} variant="primary" className="flex-shrink-0">
                    <Download className="w-4 h-4" /> Export Corrected SRT
                </Button>
              </div>
            </div>
            
            <p className="text-zinc-400 leading-relaxed mb-4 mt-2 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 italic text-sm">
              "{result.summary}"
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
               {result.timestampMismatchCount > 0 ? (
                 <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    <Clock className="w-3 h-3" /> {result.timestampMismatchCount} Timestamp Mismatches
                 </span>
               ) : (
                 <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Timestamps Synced
                 </span>
               )}
               <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                  <Info className="w-3 h-3" /> {result.items.length} Lines Analyzed
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="bg-surface rounded-xl border border-zinc-800 overflow-hidden">
        {isBulkMode ? (
            <div className="bg-zinc-800/50 border-b border-zinc-700 p-4 sticky top-0 z-10 animate-in slide-in-from-top-2">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300 font-medium select-none">
                              <input 
                                  type="checkbox"
                                  className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                                  checked={filteredItems.length > 0 && filteredItems.every(item => selectedIds.has(item.id))}
                                  onChange={handleSelectAll}
                              />
                              <span className="whitespace-nowrap">
                                {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'Select All'}
                              </span>
                          </label>
                      </div>

                      <div className="hidden md:block">
                         <FilterControls />
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                          <span className="text-xs text-zinc-500 uppercase font-bold hidden md:inline">Mark As:</span>
                          <Button 
                              variant="ghost" 
                              className="bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs h-8"
                              onClick={() => applyBulkStatus('correct')}
                              disabled={selectedIds.size === 0}
                          >
                              <CheckCircle2 className="w-3 h-3" /> Correct
                          </Button>
                          <Button 
                              variant="ghost" 
                              className="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs h-8"
                              onClick={() => applyBulkStatus('minor_issue')}
                              disabled={selectedIds.size === 0}
                          >
                              <AlertCircle className="w-3 h-3" /> Minor
                          </Button>
                          <Button 
                              variant="ghost" 
                              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs h-8"
                              onClick={() => applyBulkStatus('incorrect')}
                              disabled={selectedIds.size === 0}
                          >
                              <X className="w-3 h-3" /> Incorrect
                          </Button>
                      </div>
                  </div>
                  {/* Mobile Filter Controls Row */}
                  <div className="md:hidden">
                    <FilterControls />
                  </div>
                </div>
            </div>
        ) : (
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <h3 className="font-semibold text-zinc-200 whitespace-nowrap">Interactive Correction</h3>
                   <FilterControls />
                </div>
                <span className="text-xs text-zinc-500 hidden md:inline">Edit fields to auto-save changes</span>
            </div>
        )}

        <div className="max-h-[800px] overflow-y-auto custom-scrollbar p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
               <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 mb-4">
                  <Filter className="w-6 h-6 text-zinc-500" />
               </div>
               <p className="text-zinc-400 font-medium">No items match the current filter</p>
               <button 
                  onClick={() => setFilterStatus('all')}
                  className="text-indigo-400 text-sm hover:underline mt-2"
               >
                  Clear filter
               </button>
            </div>
          ) : (
            filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={`p-4 rounded-lg border transition-all ${
                isBulkMode && selectedIds.has(item.id)
                  ? 'bg-indigo-900/20 border-indigo-500/50'
                  : item.status === 'incorrect' || item.status === 'minor_issue'
                    ? 'bg-zinc-900/80 border-red-900/30' 
                    : item.status === 'corrected'
                        ? 'bg-indigo-900/10 border-indigo-500/30'
                        : 'bg-transparent border-zinc-800 hover:bg-zinc-800/30'
              }`}
            >
              <div className="flex items-start gap-4">
                {isBulkMode && (
                   <div className="pt-1 flex-shrink-0">
                        <input 
                            type="checkbox"
                            className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelection(item.id)}
                        />
                   </div>
                )}
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">#{item.id}</span>
                        <span className="text-xs font-mono text-zinc-400">{item.startTime} {'-->'} {item.endTime}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                        </span>
                        {item.timestampMismatch && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border text-red-400 bg-red-400/10 border-red-400/20">
                            Time Mismatch
                        </span>
                        )}
                    </div>
              
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {/* Source Column (Locked) */}
                        <div className="bg-black/20 p-3 rounded border border-zinc-800/50">
                            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Original</p>
                            <p className="text-sm text-zinc-300">{item.sourceText}</p>
                        </div>
                        
                        {/* Translation Column (Editable) */}
                        <div className="bg-black/20 p-3 rounded border border-zinc-800/50 relative group focus-within:ring-1 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Translation (Editable)</p>
                                {!isBulkMode && (
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleGetSuggestion(item.id, item.sourceText, item.translatedText)}
                                            disabled={loadingSuggestionId === item.id}
                                            className="flex items-center gap-1 text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                            title="Get AI Suggestion"
                                        >
                                            {loadingSuggestionId === item.id ? (
                                            <span className="animate-spin w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full"></span>
                                            ) : (
                                            <Sparkles className="w-3 h-3" />
                                            )}
                                            AI Fix
                                        </button>
                                        <Edit2 className="w-3 h-3 text-zinc-600 group-focus-within:text-indigo-400" />
                                    </div>
                                )}
                            </div>
                            <textarea
                                className="w-full bg-transparent text-sm text-zinc-100 focus:outline-none resize-none min-h-[60px]"
                                value={item.translatedText}
                                onChange={(e) => onUpdateItem(item.id, e.target.value)}
                                disabled={isBulkMode} // Disable editing text in bulk mode to focus on selection
                            />
                            
                            {/* Suggestion Popover */}
                            {suggestions[item.id] && !isBulkMode && (
                                <div className="mt-2 p-2 bg-indigo-900/20 border border-indigo-500/30 rounded text-sm animate-in slide-in-from-top-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> AI Suggestion
                                    </span>
                                    <div className="flex gap-1">
                                    <button onClick={() => handleApplySuggestion(item.id)} className="p-1 hover:bg-indigo-500/20 rounded text-green-400" title="Apply">
                                        <Check className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => handleDismissSuggestion(item.id)} className="p-1 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400" title="Dismiss">
                                        <X className="w-3 h-3" />
                                    </button>
                                    </div>
                                </div>
                                <p className="text-indigo-100">{suggestions[item.id]}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {(item.feedback || item.timestampMismatch) && (
                        <div className="flex items-start gap-2 text-sm text-zinc-400 bg-zinc-800/50 p-2 rounded mt-2">
                        <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.status === 'incorrect' ? 'text-red-400' : 'text-indigo-400'}`} />
                        <p>
                            {item.timestampMismatch ? "Original timestamps preserved to fix mismatch. " : ""}
                            {item.feedback}
                        </p>
                        </div>
                    )}
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationReport;