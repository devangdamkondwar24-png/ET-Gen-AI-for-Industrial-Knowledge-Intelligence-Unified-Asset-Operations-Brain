import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { sendChatMessage, uploadDocument, type ChatMessage, type Citation } from '../api/agents';

// ── Citation chip ─────────────────────────────────────────────────────────────
const CitationPill: React.FC<{ citation: Citation }> = ({ citation }) => (
  <button className="flex items-center gap-2 px-3 py-1.5 border border-[#004D40] rounded-full bg-[#004D40]/5 hover:bg-[#004D40]/10 transition-colors group">
    <span className="material-symbols-outlined text-[14px] text-[#004D40]">description</span>
    <span className="text-[12px] text-[#004D40] font-bold" style={{fontFamily:'Inter,sans-serif'}}>
      [{citation.doc_id} p.{citation.page}]
    </span>
    <span className="material-symbols-outlined text-[14px] text-[#004D40] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
  </button>
);

// ── Chat message bubble ───────────────────────────────────────────────────────
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-2 max-w-[80%] self-end">
        <div className="bg-[#F5F5F5] text-[#212121] px-5 py-4 rounded-xl rounded-tr-none border border-[#E0E0E0]">
          <p className="text-[14px] leading-[1.5]">{message.content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3 max-w-[85%] self-start">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 bg-[#004D40] rounded flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-sm" style={{fontVariationSettings:"'FILL' 1"}}>smart_toy</span>
        </div>
        <span className="text-xs text-[#004D40] font-bold" style={{fontFamily:'JetBrains Mono, monospace'}}>Industrial Copilot</span>
      </div>
      <div className="bg-white text-[#212121] px-6 py-5 border-l-4 border-[#004D40] border border-[#E0E0E0] shadow-sm relative overflow-hidden rounded-r-lg">
        <p className="text-[16px] leading-[1.6] whitespace-pre-wrap">{message.content}</p>
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
      setMessages(p => [...p, { role: 'assistant', content: res.answer, citations: res.citations }]);
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
        // Skip hidden files or unsupported extensions if needed, but for now just upload all
        await uploadDocument(files[i]);
        successCount++;
        setUploadStatus(`Uploaded ${successCount}/${files.length}…`);
      }
      setUploadStatus(`✓ Uploaded ${successCount} file(s) successfully.`);
    } catch { 
      setUploadStatus('✗ Upload failed. Ensure the API is running.'); 
    }
    
    setTimeout(() => setUploadStatus(null), 5000);
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white" style={{fontFamily:'Inter,sans-serif'}}>
      <Sidebar />
      {/* Main content */}
      <main className="fixed top-0 right-0 w-[calc(100%-240px)] h-full flex flex-col bg-white">
        {/* Topbar */}
        <header className="h-14 w-full bg-white border-b border-[#E0E0E0] flex items-center justify-between px-[16px] z-40 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004D40]">settings_input_component</span>
              <span className="text-[#004D40] font-bold text-[13px]" style={{fontFamily:'JetBrains Mono,monospace'}}>Industrial Copilot</span>
            </div>
            {uploadStatus && (
              <div className="flex items-center gap-1.5 bg-[#004D40]/10 px-2 py-0.5 rounded border border-[#004D40]/20">
                <span className="text-[11px] text-[#004D40] font-bold" style={{fontFamily:'JetBrains Mono,monospace'}}>{uploadStatus}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <input className="bg-[#F5F5F5] border border-[#E0E0E0] rounded-full px-4 py-1.5 text-xs w-64 focus:outline-none focus:border-[#004D40] transition-all text-[#212121]" placeholder="Search asset telemetry..." type="text"/>
              <span className="material-symbols-outlined absolute right-3 top-1.5 text-[#424242] text-sm">search</span>
            </div>
            <div className="flex items-center gap-4 text-[#424242]">
              <button className="material-symbols-outlined hover:text-[#004D40] transition-colors">notifications</button>
              <button className="material-symbols-outlined hover:text-[#004D40] transition-colors">settings</button>
            </div>
          </div>
        </header>

        {/* Chat area */}
        <section className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-[24px] flex flex-col gap-8" style={{scrollbarWidth:'thin', scrollbarColor:'#E0E0E0 transparent'}}>
            <div className="flex justify-center">
              <span className="text-[10px] text-[#424242]/60 uppercase tracking-[0.2em]" style={{fontFamily:'JetBrains Mono,monospace'}}>
                Operational Stream Log // {new Date().toLocaleDateString()}
              </span>
            </div>
            {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
            {isLoading && (
              <div className="flex flex-col items-start gap-3 max-w-[85%] self-start">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-[#004D40] rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-sm animate-spin">sync</span>
                  </div>
                  <span className="text-xs text-[#004D40] font-bold" style={{fontFamily:'JetBrains Mono,monospace'}}>Industrial Copilot</span>
                </div>
                <div className="bg-white px-6 py-4 border-l-4 border-[#004D40] border border-[#E0E0E0] shadow-sm rounded-r-lg">
                  <p className="text-[14px] text-[#757575]">Searching knowledge base…</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-[16px] bg-white/80 backdrop-blur-xl border-t border-[#E0E0E0] z-20">
            <div className="max-w-4xl mx-auto relative">
              <textarea
                id="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Query asset database or request RCA analysis..."
                className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg p-4 pb-12 text-[#212121] focus:outline-none focus:border-[#004D40] transition-all resize-none h-24 shadow-sm text-[14px]"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <button id="btn-attach" onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-white border border-transparent hover:border-[#E0E0E0] rounded transition-colors text-[#424242]" title="Upload File(s)">
                  <span className="material-symbols-outlined text-lg">attach_file</span>
                </button>
                <button onClick={() => folderInputRef.current?.click()} className="p-1.5 hover:bg-white border border-transparent hover:border-[#E0E0E0] rounded transition-colors text-[#424242]" title="Upload Folder">
                  <span className="material-symbols-outlined text-lg">folder_open</span>
                </button>
                <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.xlsx,.csv,.msg,.eml,.txt,.docx"/>
                {/* @ts-ignore - webkitdirectory is standard in browsers but sometimes lacks React TS definitions */}
                <input ref={folderInputRef} type="file" multiple webkitdirectory="" directory="" onChange={handleFileUpload} className="hidden" />
              </div>
              <div className="absolute bottom-3 right-3 flex items-center gap-3">
                <span className="text-[10px] text-[#424242] uppercase hidden md:block" style={{fontFamily:'JetBrains Mono,monospace'}}>Press Enter to Transmit</span>
                <button id="btn-send" onClick={handleSend} disabled={isLoading || !input.trim()}
                  className="bg-[#004D40] text-white px-4 py-1.5 rounded font-bold text-sm active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
