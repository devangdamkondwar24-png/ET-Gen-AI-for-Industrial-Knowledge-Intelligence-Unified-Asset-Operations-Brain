import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { sendChatMessage, uploadDocument, type ChatMessage, type Citation } from '../api/agents';
import { useAppContext } from '../context/AppContext';

// ── Citation chip ─────────────────────────────────────────────────────────────
const CitationPill: React.FC<{ citation: Citation }> = ({ citation }) => (
  <button className="flex items-center gap-2 px-3 py-1.5 border border-[#00f0ff] rounded-full bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 transition-colors group">
    <span className="material-symbols-outlined text-[14px] text-[#00f0ff]">description</span>
    <span className="text-[12px] text-[#00f0ff] font-bold" style={{fontFamily:'Inter,sans-serif'}}>
      [{citation.doc_id} p.{citation.page}]
    </span>
    <span className="material-symbols-outlined text-[14px] text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
  </button>
);

// ── Chat message bubble ───────────────────────────────────────────────────────
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { isTechMode } = useAppContext();
  
  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-2 max-w-[80%] self-end">
        <div className="bg-[#121416] text-[#e2e2e5] px-5 py-3 rounded-xl rounded-tr-none border border-[#333537]">
          <p className={`${isTechMode ? 'text-[12px]' : 'text-[14px]'} leading-[1.5]`}>{message.content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3 max-w-[90%] md:max-w-[85%] self-start">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 bg-[#00f0ff] rounded flex items-center justify-center">
          <span className="material-symbols-outlined text-[#002022] text-sm" style={{fontVariationSettings:"'FILL' 1"}}>smart_toy</span>
        </div>
        <span className="text-xs text-[#00f0ff] font-bold" style={{fontFamily:'JetBrains Mono, monospace'}}>Industrial Copilot</span>
        {message.confidence_score !== undefined && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${message.confidence_score > 0.8 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#ED6C02]'}`}>
            {Math.round(message.confidence_score * 100)}% CONF
          </span>
        )}
      </div>
      <div className="bg-[#1a1c1e] text-[#e2e2e5] px-4 py-3 md:px-6 md:py-5 border-l-4 border-[#00f0ff] border border-[#333537] shadow-sm relative overflow-hidden rounded-r-lg">
        <p className={`${isTechMode ? 'text-[14px]' : 'text-[16px]'} leading-[1.6] whitespace-pre-wrap`}>{message.content}</p>
        {message.citations && message.citations.length > 0 && (
          <div className="pt-3 flex flex-wrap gap-2 mt-2">
            {message.citations.map((c, i) => <CitationPill key={i} citation={c} />)}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Copilot Page ─────────────────────────────────────────────────────────────
const CopilotPage: React.FC = () => {
  const { isTechMode } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: "Hello! I'm the Industrial Knowledge Copilot. Ask me anything about your assets, maintenance procedures, or operational data. I will ground my answers in your indexed documents.",
    citations: [],
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
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
    <div className="flex h-screen overflow-hidden bg-[#1a1c1e]" style={{fontFamily:'Inter,sans-serif'}}>
      <Sidebar />
      {/* Main content */}
      <main className={`fixed top-0 right-0 w-full ${isTechMode ? 'md:w-[calc(100%-80px)]' : 'md:w-[calc(100%-240px)]'} h-full flex flex-col bg-[#1a1c1e] transition-all duration-300 pb-16 md:pb-0`}>
        {/* Topbar */}
        <header className="h-14 w-full bg-[#1a1c1e] border-b border-[#333537] flex items-center justify-between px-[16px] z-40 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00f0ff]">settings_input_component</span>
              <span className="text-[#00f0ff] font-bold text-[13px] hidden md:inline" style={{fontFamily:'JetBrains Mono,monospace'}}>Industrial Copilot</span>
            </div>
            {uploadStatus && (
              <div className="flex items-center gap-1.5 bg-[#00f0ff]/20 px-2 py-0.5 rounded border border-[#00f0ff]/20">
                <span className="text-[11px] text-[#00f0ff] font-bold" style={{fontFamily:'JetBrains Mono,monospace'}}>{uploadStatus}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <input className="bg-[#121416] border border-[#333537] rounded-full px-4 py-1.5 text-xs w-64 focus:outline-none focus:border-[#00f0ff] transition-all text-[#e2e2e5]" placeholder="Search asset telemetry..." type="text"/>
              <span className="material-symbols-outlined absolute right-3 top-1.5 text-[#b9cacb] text-sm">search</span>
            </div>
            <div className="flex items-center gap-4 text-[#b9cacb]">
              <button className="material-symbols-outlined hover:text-[#00f0ff] transition-colors">notifications</button>
              <button className="material-symbols-outlined hover:text-[#00f0ff] transition-colors">settings</button>
            </div>
          </div>
        </header>

        {/* Chat area */}
        <section className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-[24px] flex flex-col gap-8" style={{scrollbarWidth:'thin', scrollbarColor:'#E0E0E0 transparent'}}>
            <div className="flex justify-center">
              <span className="text-[10px] text-[#b9cacb]/60 uppercase tracking-[0.2em]" style={{fontFamily:'JetBrains Mono,monospace'}}>
                Operational Stream Log // {new Date().toLocaleDateString()}
              </span>
            </div>
            {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
            {isLoading && (
              <div className="flex flex-col items-start gap-3 max-w-[85%] self-start">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-[#00f0ff] rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#002022] text-sm animate-spin">sync</span>
                  </div>
                  <span className="text-xs text-[#00f0ff] font-bold" style={{fontFamily:'JetBrains Mono,monospace'}}>Industrial Copilot</span>
                </div>
                <div className="bg-[#1a1c1e] px-6 py-4 border-l-4 border-[#00f0ff] border border-[#333537] shadow-sm rounded-r-lg">
                  <p className="text-[14px] text-[#849495]">Searching knowledge base…</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-[16px] bg-[#1a1c1e]/80 backdrop-blur-xl border-t border-[#333537] z-20">
            <div className="max-w-4xl mx-auto relative">
              <textarea
                id="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Query asset database or request RCA analysis..."
                className="w-full bg-[#121416] border border-[#333537] rounded-lg p-4 pb-12 text-[#e2e2e5] focus:outline-none focus:border-[#00f0ff] transition-all resize-none h-24 shadow-sm text-[14px]"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <button id="btn-attach" onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-[#1a1c1e] border border-transparent hover:border-[#333537] rounded transition-colors text-[#b9cacb]" title="Upload File(s)">
                  <span className="material-symbols-outlined text-lg">attach_file</span>
                </button>
                <button onClick={() => folderInputRef.current?.click()} className="p-1.5 hover:bg-[#1a1c1e] border border-transparent hover:border-[#333537] rounded transition-colors text-[#b9cacb]" title="Upload Folder">
                  <span className="material-symbols-outlined text-lg">folder_open</span>
                </button>
                <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.xlsx,.csv,.msg,.eml,.txt,.docx"/>
                {/* @ts-ignore - webkitdirectory is standard in browsers but sometimes lacks React TS definitions */}
                <input ref={folderInputRef} type="file" multiple webkitdirectory="" directory="" onChange={handleFileUpload} className="hidden" />
              </div>
              <div className="absolute bottom-3 right-3 flex items-center gap-3">
                <span className="text-[10px] text-[#b9cacb] uppercase hidden md:block" style={{fontFamily:'JetBrains Mono,monospace'}}>Press Enter to Transmit</span>
                <button id="btn-send" onClick={handleSend} disabled={isLoading || !input.trim()}
                  className="bg-[#00f0ff] text-[#002022] px-4 py-1.5 rounded font-bold text-sm active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{fontFamily:'JetBrains Mono,monospace'}}>
                  <span>SEND</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CopilotPage;
