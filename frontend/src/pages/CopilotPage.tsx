import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, uploadDocument, type ChatMessage, type Citation } from '../api/agents';

// ── Copilot Page ─────────────────────────────────────────────────────────────
const CopilotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: "Hello! I'm the Industrial Knowledge Copilot. Ask me anything about your assets, maintenance procedures, or operational data. I will ground my answers in your indexed documents.",
    citations: [],
    confidence_score: 1.0
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setMessages(p => [...p, { role: 'user', content: q }]);
    setInput('');
    setIsLoading(true);
    try {
      const res = await sendChatMessage(q);
      setMessages(p => [...p, { role: 'assistant', content: res.answer, citations: res.citations, confidence_score: res.confidence_score }]);
      if (res.citations && res.citations.length > 0) {
        setActiveCitations(res.citations);
      }
    } catch (e: unknown) {
      setMessages(p => [...p, { role: 'assistant', content: `⚠ Backend unavailable: ${e instanceof Error ? e.message : 'Unknown error'}`, citations: [] }]);
    } finally { setIsLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadStatus(`Uploading ${files.length} file(s)…`);
    let successCount = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadDocument(files[i]);
        successCount++;
        setUploadStatus(`Uploaded ${successCount}/${files.length}…`);
      }
      setUploadStatus(`✓ Uploaded ${successCount} file(s) successfully.`);
    } catch { 
      setUploadStatus('✗ Upload failed.'); 
    }
    
    setTimeout(() => setUploadStatus(null), 5000);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col relative grid-dot-overlay overflow-hidden h-full">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-gutter py-6 pb-48 space-y-6 hide-scrollbar" id="chat-history">
        {/* System Initializer */}
        <div className="flex justify-center">
          <span className="font-label-sm text-label-sm text-outline border border-outline-variant px-3 py-1 bg-surface-container-lowest uppercase tracking-widest">
            Session Initiated: {new Date().toISOString().split('T')[0]} // {new Date().toISOString().split('T')[1].split('.')[0]} ZULU
          </span>
        </div>

        {uploadStatus && (
          <div className="flex justify-center">
            <span className="font-label-sm text-[10px] text-primary-fixed-dim border border-primary-fixed-dim px-2 py-1 bg-primary-fixed-dim/10 uppercase">
              {uploadStatus}
            </span>
          </div>
        )}

        {messages.map((m, i) => (
          m.role === 'user' ? (
            <div key={i} className="flex flex-col items-end space-y-1 max-w-[85%] ml-auto">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-sm text-label-sm text-outline uppercase">Operator_01</span>
              </div>
              <div className="bg-surface-container-high technical-border p-4 text-on-surface font-body-md whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex flex-col items-start space-y-1 max-w-[90%]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">smart_toy</span>
                <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase">Copilot Assistant</span>
                {m.confidence_score !== undefined && (
                  <div className={`px-2 py-0.5 border text-[10px] font-label-sm flex items-center gap-1 ${
                    m.confidence_score > 0.8 ? 'border-primary-fixed-dim text-primary-fixed-dim' : 'border-error text-error'
                  }`}>
                    <span className="material-symbols-outlined text-[12px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                    {Math.round(m.confidence_score * 100)}% CONFIDENCE
                  </div>
                )}
              </div>
              <div className="bg-surface-container technical-border p-4 space-y-4 active-module-border inner-glow-primary">
                <p className="text-on-surface font-body-md leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </p>
                {m.citations && m.citations.length > 0 && (
                  <button 
                    onClick={() => { setActiveCitations(m.citations || []); setIsDrawerOpen(true); }}
                    className="flex items-center gap-2 mt-4 px-3 py-2 bg-surface-container-highest border border-outline-variant hover:bg-on-primary-fixed-variant transition-colors group">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary-fixed-dim">terminal</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-primary-fixed-dim uppercase">View Source Citations</span>
                    <span className="font-label-sm text-label-sm text-outline group-hover:text-primary-fixed-dim">[{m.citations.length}]</span>
                  </button>
                )}
              </div>
            </div>
          )
        ))}

        {isLoading && (
          <div className="flex flex-col items-start space-y-1 max-w-[90%]">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">smart_toy</span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase">Copilot Assistant</span>
            </div>
            <div className="bg-surface-container technical-border p-4 flex items-center gap-4">
              <div className="flex gap-1">
                <div className="w-1.5 h-6 bg-primary-fixed-dim animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-6 bg-primary-fixed-dim animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1.5 h-6 bg-primary-fixed-dim animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Querying Knowledge Graph...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="absolute bottom-0 left-0 w-full px-gutter pb-4 bg-gradient-to-t from-background via-background to-transparent pt-12 z-30">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-on-surface-variant hover:text-primary-fixed-dim">
                <span className="material-symbols-outlined text-[18px]">attachment</span>
                <span className="font-label-sm text-[10px] uppercase">Attach File</span>
              </button>
              <button onClick={() => folderInputRef.current?.click()} className="flex items-center gap-1 text-on-surface-variant hover:text-primary-fixed-dim">
                <span className="material-symbols-outlined text-[18px]">folder_open</span>
                <span className="font-label-sm text-[10px] uppercase">Dir Ingest</span>
              </button>
              <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.xlsx,.csv,.msg,.eml,.txt,.docx"/>
              {/* @ts-ignore */}
              <input ref={folderInputRef} type="file" multiple webkitdirectory="" directory="" onChange={handleFileUpload} className="hidden" />
            </div>
            <span className="font-label-sm text-[10px] text-outline uppercase hidden sm:inline">Input mode: Technical_Shell</span>
          </div>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed-dim font-bold">&gt;</div>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              className="w-full h-touch-target bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md pl-10 pr-16 focus:ring-0 focus:border-primary-fixed-dim transition-all placeholder:text-outline-variant uppercase" 
              placeholder="ENTER OPERATIONAL COMMAND..." 
              type="text"
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary-fixed-dim text-on-primary flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Source Drawer */}
      <div 
        className={`absolute bottom-0 left-0 w-full z-40 transition-transform duration-300 transform ${isDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`} 
        id="source-drawer"
      >
        <div className="bg-surface-container border-t-2 border-primary-fixed-dim px-gutter pt-2 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] max-h-[50vh] overflow-y-auto">
          <div className="flex justify-center mb-4 cursor-pointer" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
            <div className="w-12 h-1 bg-outline-variant rounded-full"></div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim">list_alt</span>
              <h2 className="font-label-md text-label-md text-primary-fixed-dim uppercase tracking-widest">Source Citations</h2>
            </div>
            <span className="font-label-sm text-label-sm text-outline uppercase">{activeCitations.length} Matches Identified</span>
          </div>
          <div className="space-y-3">
            {activeCitations.map((c, i) => (
              <div key={i} className="p-3 bg-surface-container-lowest technical-border border-l-4 border-l-primary-fixed-dim">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-label-sm text-[10px] text-primary-fixed-dim uppercase">{c.doc_id}</span>
                  <span className="font-label-sm text-[10px] text-outline">Page {c.page}</span>
                </div>
              </div>
            ))}
            {activeCitations.length === 0 && (
              <p className="text-on-surface-variant font-label-sm text-[11px]">No citations to display.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopilotPage;
