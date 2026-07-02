import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Search,
  MapPin,
  Clock,
  Loader2,
  ArrowUpRight,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import Gauge from './components/Gauge';
import ChatConsole from './components/ChatConsole';
import type { NewsArticle, AnalysisResult, AnalysisState, SessionEntry } from './types';
import './App.css';

const API_BASE = 'http://localhost:3001';
const SCAN_STAGES = ['Reading the article', 'Modeling tone', 'Scoring bias'];

const TIMEFRAME_LABELS: Record<string, string> = {
  '1h': 'past hour',
  '1d': 'past 24 hours',
  '7d': 'past week',
  '1y': 'past year',
};

function ScanningLabel() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setStage((current) => (current + 1) % SCAN_STAGES.length);
    }, 900);
    return () => window.clearInterval(id);
  }, []);
  return <span className="scan-label">{SCAN_STAGES[stage]}…</span>;
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function readingTime(length?: number) {
  if (!length || length <= 0) return null;
  const words = length / 5.2;
  return Math.max(1, Math.round(words / 200));
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url.slice(0, 40);
  }
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (window.localStorage.getItem('newzy-theme') as 'dark' | 'light') || 'dark';
  });

  const [activeView, setActiveView] = useState<'search' | 'direct'>('search');
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('');
  const [timeframe, setTimeframe] = useState('1d');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [directInput, setDirectInput] = useState('');
  const [directInputType, setDirectInputType] = useState<'url' | 'text'>('url');

  const [analysisMap, setAnalysisMap] = useState<Record<string, AnalysisState>>({});

  const [sessionLog, setSessionLog] = useState<SessionEntry[]>(() => {
    try {
      const raw = window.localStorage.getItem('insightstream-session-log');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showLog, setShowLog] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  const topicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('newzy-theme', theme);
  }, [theme]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('insightstream-session-log', JSON.stringify(sessionLog));
    } catch {}
  }, [sessionLog]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2400);
  }

  const handleSearch = async () => {
    setLoadingSearch(true);
    setSearchError(null);
    try {
      const { data } = await axios.get<NewsArticle[]>(`${API_BASE}/api/news/search`, {
        params: { topic, location, timeframe },
      });
      setArticles(data);
    } catch (err: any) {
      setSearchError(err.response?.data?.error || err.message || 'Search failed — check your connection and try again.');
      setArticles([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAnalyze = async (url: string, isText = false, meta?: { title?: string; source?: string }) => {
    if (analysisMap[url]?.loading) return;

    setAnalysisMap((prev) => ({
      ...prev,
      [url]: { loading: true, error: undefined, chatHistory: [], chatInput: '', chatLoading: false },
    }));

    try {
      const endpoint = isText ? '/api/analyze/text' : '/api/analyze/url';
      const payload = isText ? { text: url } : { url };
      const { data } = await axios.post<AnalysisResult>(`${API_BASE}${endpoint}`, payload);

      setAnalysisMap((prev) => ({ ...prev, [url]: { ...prev[url], data, loading: false } }));

      const title = meta?.title || (isText ? data.summary.slice(0, 72) : safeHostname(url));
      const sourceLabel = meta?.source || (isText ? 'Pasted text' : safeHostname(url));

      setSessionLog((prev) => [
        {
          key: url,
          title,
          sourceLabel,
          politicalLabel: data.politicalBias.label,
          politicalScore: data.politicalBias.score,
          emotionalLabel: data.emotionalBias.label,
          emotionalScore: data.emotionalBias.score,
          timestamp: Date.now(),
        },
        ...prev.filter((entry) => entry.key !== url),
      ].slice(0, 20));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Analysis failed';
      setAnalysisMap((prev) => ({ ...prev, [url]: { ...prev[url], loading: false, error: errorMessage } }));
    }
  };

  const handleChat = async (url: string) => {
    const state = analysisMap[url];
    if (!state?.data?.extractedText || !state.chatInput.trim() || state.chatLoading) return;

    const userMessage = state.chatInput.trim();
    const updatedHistory = [
      ...state.chatHistory,
      { role: 'user' as const, parts: [{ text: userMessage }], ts: Date.now() },
    ];

    setAnalysisMap((prev) => ({
      ...prev,
      [url]: { ...prev[url], chatHistory: updatedHistory, chatInput: '', chatLoading: true },
    }));

    try {
      const { data } = await axios.post<{ answer: string }>(`${API_BASE}/api/chat`, {
        articleText: state.data.extractedText,
        question: userMessage,
        history: state.chatHistory,
      });

      setAnalysisMap((prev) => ({
        ...prev,
        [url]: {
          ...prev[url],
          chatHistory: [...updatedHistory, { role: 'model' as const, parts: [{ text: data.answer }], ts: Date.now() }],
          chatLoading: false,
        },
      }));
    } catch {
      setAnalysisMap((prev) => ({
        ...prev,
        [url]: { ...prev[url], chatLoading: false, error: 'Failed to get AI response' },
      }));
    }
  };

  async function copySummary(url: string) {
    const state = analysisMap[url];
    if (!state?.data) return;
    const lines = [
      state.data.summary,
      '',
      `Political lean: ${state.data.politicalBias.label}`,
      `Emotional charge: ${state.data.emotionalBias.label}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast('Summary copied to clipboard');
    } catch {
      showToast('Could not copy — try selecting the text manually');
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        if (activeView === 'search') topicInputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && activeView === 'direct' && directInput.trim()) {
        handleAnalyze(directInput, directInputType === 'text');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, directInput, directInputType]);

  function renderAnalysis(url: string) {
    const state = analysisMap[url];
    if (!state) return null;

    return (
      <div className="result-panel">
        {state.loading && (
          <div className="scan">
            <div className="scan-beam" />
            <ScanningLabel />
          </div>
        )}

        {state.error && (
          <p className="result-error">
            <AlertCircle size={14} /> {state.error}
          </p>
        )}

        {state.data && (
          <>
            <div className="summary-row">
              <p className="summary">{state.data.summary}</p>
              <button className="btn-ghost btn-copy" onClick={() => copySummary(url)}>
                <Copy size={14} /> Copy
              </button>
            </div>

            {readingTime(state.data.originalLength) && (
              <p className="reading-meta">~{readingTime(state.data.originalLength)} min read in the original</p>
            )}

            <div className="gauge-row">
              <div className="gauge-block">
                <Gauge
                  value={(state.data.politicalBias.score + 1) / 2}
                  readout={
                    state.data.politicalBias.score >= 0
                      ? `+${state.data.politicalBias.score.toFixed(2)}`
                      : state.data.politicalBias.score.toFixed(2)
                  }
                  label={state.data.politicalBias.label}
                  leftCaption="Left"
                  rightCaption="Right"
                  colorFrom="var(--crimson)"
                  colorMid="var(--mid)"
                  colorTo="var(--azure)"
                />
                <p className="gauge-desc">{state.data.politicalBias.explanation}</p>
              </div>
              <div className="gauge-block">
                <Gauge
                  value={state.data.emotionalBias.score}
                  readout={`${Math.round(state.data.emotionalBias.score * 100)}%`}
                  label={state.data.emotionalBias.label}
                  leftCaption="Calm"
                  rightCaption="Charged"
                  colorFrom="var(--teal)"
                  colorMid="var(--mid)"
                  colorTo="var(--crimson)"
                />
                <p className="gauge-desc">{state.data.emotionalBias.explanation}</p>
              </div>
            </div>

            <ChatConsole
              messages={state.chatHistory}
              inputValue={state.chatInput}
              loading={state.chatLoading}
              onInputChange={(value) =>
                setAnalysisMap((prev) => ({ ...prev, [url]: { ...prev[url], chatInput: value } }))
              }
              onSend={() => handleChat(url)}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead-row">
          <div className="status-chip">
            <span className="pulse-block" />
            <span>Live System</span>
            <span className="status-time">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <div className="masthead-controls">
            <button 
              className="btn-icon" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="log-toggle" onClick={() => setShowLog((v) => !v)}>
              Log
              <span className="log-count">{sessionLog.length}</span>
              {showLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
        <h1 className="wordmark">NEWZY</h1>
        <p className="tagline">Tracking bias in the news, article by article</p>
      </header>

      {showLog && (
        <section className="log-panel">
          {sessionLog.length === 0 ? (
            <p className="log-empty">
              System empty. Run analysis to populate log sequence.
            </p>
          ) : (
            <>
              <div className="log-list">
                {sessionLog.map((entry) => (
                  <div key={entry.key} className="log-entry">
                    <span
                      className="log-block"
                      style={{
                        background:
                          entry.politicalScore < -0.15
                            ? 'var(--crimson)'
                            : entry.politicalScore > 0.15
                            ? 'var(--azure)'
                            : 'var(--mid)',
                      }}
                    />
                    <div className="log-entry-body">
                      <span className="log-entry-title">{entry.title}</span>
                      <span className="log-entry-meta">
                        {entry.sourceLabel} // {entry.politicalLabel} // {entry.emotionalLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="log-clear" onClick={() => setSessionLog([])}>
                Purge Log
              </button>
            </>
          )}
        </section>
      )}

      <nav className="segmented" aria-label="View selector">
        <button className={activeView === 'search' ? 'active' : ''} onClick={() => setActiveView('search')}>
          Discover Engine
        </button>
        <button className={activeView === 'direct' ? 'active' : ''} onClick={() => setActiveView('direct')}>
          Direct Input
        </button>
      </nav>

      {activeView === 'search' ? (
        <div className="search-view">
          <section className="search-panel">
            <div className="panel-frame">
              <div className="field">
                <label>Topic</label>
                <div className="field-control">
                  <Search size={16} className="field-icon" />
                  <input
                    ref={topicInputRef}
                    type="text"
                    placeholder="Elections, climate..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>Location</label>
                <div className="field-control">
                  <MapPin size={16} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Region..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>Window</label>
                <div className="field-control">
                  <Clock size={16} className="field-icon" />
                  <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                    <option value="1h">Past 1H</option>
                    <option value="1d">Past 24H</option>
                    <option value="7d">Past 7D</option>
                    <option value="1y">Past 1Y</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary" onClick={handleSearch} disabled={loadingSearch}>
                {loadingSearch ? <Loader2 size={16} className="spin" /> : 'Run'}
              </button>
            </div>
            <p className="hint">
              Press <kbd>/</kbd> to jump to topic input
            </p>
          </section>

          {searchError && (
            <div className="error-banner">
              <AlertCircle size={16} /> {searchError}
            </div>
          )}

          <div className="article-list">
            {articles.map((article) => (
              <article key={article.link} className="article-card">
                <div className="article-body">
                  <div className="article-top">
                    <span className="stamp">{article.source}</span>
                    <span className="time-readout">{formatRelativeTime(article.pubDate)}</span>
                  </div>
                  <h3 className="article-title">{article.title}</h3>
                  <div className="article-actions">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                      Source <ArrowUpRight size={14} />
                    </a>
                    <button
                      className="btn-primary"
                      onClick={() =>
                        handleAnalyze(article.link, false, { title: article.title, source: article.source })
                      }
                      disabled={analysisMap[article.link]?.loading}
                    >
                      {analysisMap[article.link]?.loading ? <Loader2 size={16} className="spin" /> : 'Analyze'}
                    </button>
                  </div>
                </div>
                {renderAnalysis(article.link)}
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="direct-view">
          <section className="direct-panel">
            <div className="direct-card">
              <div className="direct-tabs">
                <button className={directInputType === 'url' ? 'active' : ''} onClick={() => setDirectInputType('url')}>
                  Remote URL
                </button>
                <button className={directInputType === 'text' ? 'active' : ''} onClick={() => setDirectInputType('text')}>
                  Raw Text
                </button>
              </div>
              <div className="direct-body">
                {directInputType === 'url' ? (
                  <input
                    type="text"
                    className="direct-input"
                    placeholder="https://example.com/news-article"
                    value={directInput}
                    onChange={(e) => setDirectInput(e.target.value)}
                  />
                ) : (
                  <textarea
                    className="direct-textarea"
                    placeholder="Paste the full article text here…"
                    value={directInput}
                    onChange={(e) => setDirectInput(e.target.value)}
                  />
                )}
                <button
                  className="btn-primary btn-block"
                  onClick={() => handleAnalyze(directInput, directInputType === 'text')}
                  disabled={!directInput.trim() || analysisMap[directInput]?.loading}
                >
                  {analysisMap[directInput]?.loading ? <Loader2 size={16} className="spin" /> : 'Execute Sequence'}
                </button>
                <p className="hint">
                  Press <kbd>⌘</kbd> + <kbd>Enter</kbd> to run
                </p>
              </div>
            </div>
            {directInput.trim() && renderAnalysis(directInput)}
          </section>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;