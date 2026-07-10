import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { sendChatMessage, uploadDocument, type ChatMessage, type Citation } from '../api/agents';

const CitationChip: React.FC<{ citation: Citation }> = ({ citation }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 border border-primary/50 text-primary bg-primary-container/40 rounded-full text-[11px] font-mono cursor-pointer hover:bg-primary-container transition-colors"
    title={citation.text_preview}
  >
    <span className="material-symbols-outlined text-[11px]">article</span>
    {citation.doc_id} p.{citation.page}
  </span>
);

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-surface px-4 py-3 rounded-2xl rounded-tr-sm border border-border-muted">
          <p className="text-sm text-on-surface">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 mt-1">
        <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
      </div>
      <div className="max-w-[75%] space-y-2">
        <div className="bg-white border-l-4 border-primary px-4 py-3 rounded-r-2xl border border-border-muted">
          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-1">
            <span className="text-[11px] text-text-muted mr-1">Sources:</span>
            {message.citations.map((c, i) => (
              <CitationChip key={i} citation={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CopilotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m the Industrial Knowledge Copilot. Ask me anything about your assets, maintenance procedures, or operational data. I will ground my answers in your indexed documents.',
      citations: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await sendChatMessage(query);
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: Could not reach the backend. Please ensure the API is running.\n\n${errorMessage}`,
        citations: [],
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus(`Uploading ${file.name}...`);
    try {
      const res = await uploadDocument(file);
      setUploadStatus(`✓ Uploaded successfully. Job ID: ${res.job_id}`);
    } catch {
      setUploadStatus('✗ Upload failed. Ensure the API is running.');
    }
    setTimeout(() => setUploadStatus(null), 5000);
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <Topbar title="Industrial Copilot" />
        <main className="flex-1 pt-12 flex flex-col overflow-hidden">
          {/* Upload Status Banner */}
          {uploadStatus && (
            <div className="mx-6 mt-4 px-4 py-2 bg-primary-container border border-primary/30 rounded-lg text-sm text-primary">
              {uploadStatus}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.map((message, i) => (
              <MessageBubble key={i} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm animate-spin">sync</span>
                </div>
                <div className="bg-white border-l-4 border-primary px-4 py-3 rounded-r-2xl border border-border-muted">
                  <p className="text-sm text-text-muted">Searching knowledge base...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="px-6 pb-6">
            <div className="bg-surface border border-border-muted rounded-2xl p-3 flex items-end gap-3">
              <button
                id="btn-upload-doc"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl hover:bg-primary-container text-text-muted hover:text-primary transition-colors flex-shrink-0"
                title="Upload Document"
              >
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.xlsx,.csv,.msg,.eml,.txt,.docx"
              />
              <textarea
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about pump P-101, SOP compliance, or failure analysis..."
                className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-text-muted resize-none outline-none max-h-32 leading-relaxed"
                rows={1}
              />
              <button
                id="btn-send-chat"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <p className="text-center text-[11px] text-text-muted mt-2">
              Answers are grounded in indexed documents. Press Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CopilotPage;
