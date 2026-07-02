import { useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../types';

interface ChatConsoleProps {
  messages: ChatMessage[];
  inputValue: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

function formatTime(ts?: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatConsole({ messages, inputValue, loading, onInputChange, onSend }: ChatConsoleProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="console">
      <div className="console-header">
        <span className="console-dot" />
        <span>Ask the model about this article</span>
      </div>

      <div className="console-feed" ref={feedRef}>
        {messages.length === 0 && !loading && (
          <p className="console-empty">
            No questions yet. Try asking what's missing from the coverage, or who benefits from the framing.
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`console-line ${msg.role}`}>
            <span className="console-prompt">{msg.role === 'user' ? '›' : 'AI'}</span>
            <div className="console-bubble">
              <p>{msg.parts[0].text}</p>
              {msg.ts && <span className="console-time">{formatTime(msg.ts)}</span>}
            </div>
          </div>
        ))}

        {loading && (
          <div className="console-line model">
            <span className="console-prompt">AI</span>
            <div className="console-bubble console-bubble-loading">
              <Loader2 size={14} className="spin" />
            </div>
          </div>
        )}
      </div>

      <div className="console-input-row">
        <span className="console-caret">›</span>
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="Ask a question about this article…"
        />
        <button className="console-send" onClick={onSend} disabled={!inputValue.trim() || loading} aria-label="Send question">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}