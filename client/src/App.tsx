import { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, Clock, Loader2 } from 'lucide-react';
import './App.css';

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

interface AnalysisResult {
  summary: string;
  politicalBias: { score: number; label: string; explanation: string };
  emotionalBias: { score: number; label: string; explanation: string };
  originalLength: number;
}

function App() {
  const [activeView, setActiveView] = useState<'search' | 'direct'>('search');
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('');
  const [timeframe, setTimeframe] = useState('1d');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  // Direct input states
  const [directInput, setDirectInput] = useState('');
  const [directInputType, setDirectInputType] = useState<'url' | 'text'>('url');

  // Analysis state (mapped by article link)
  const [analysisMap, setAnalysisMap] = useState<Record<string, { data?: AnalysisResult; loading: boolean; error?: string }>>({});

  const handleSearch = async () => {
    setLoadingSearch(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/news/search`, {
        params: { topic, location, timeframe }
      });
      setArticles(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const API_BASE = 'http://localhost:3001';

  const handleAnalyze = async (url: string, isText = false) => {
    console.log(`[UI] handleAnalyze called for: ${url.substring(0, 50)}...`);
    
    if (analysisMap[url]?.loading) {
      console.log(`[UI] Already loading this article, skipping.`);
      return;
    }

    setAnalysisMap(prev => ({ ...prev, [url]: { loading: true, error: undefined } }));

    try {
      const endpoint = isText ? '/api/analyze/text' : '/api/analyze/url';
      const payload = isText ? { text: url } : { url };
      
      console.log(`[API] POST ${API_BASE}${endpoint}`);
      const { data } = await axios.post(`${API_BASE}${endpoint}`, payload);
      
      console.log(`[API] Success!`, data);
      setAnalysisMap(prev => ({ 
        ...prev, 
        [url]: { data, loading: false } 
      }));
    } catch (err: any) {
      console.error('[API] Error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Analysis failed';
      setAnalysisMap(prev => ({ 
        ...prev, 
        [url]: { loading: false, error: errorMessage } 
      }));
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>📰 InsightStream</h1>
        <p>Localized news aggregator with AI-powered bias detection.</p>
      </header>

      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeView === 'search' ? 'active' : ''}`}
          onClick={() => setActiveView('search')}
        >
          Discover News
        </button>
        <button 
          className={`nav-tab ${activeView === 'direct' ? 'active' : ''}`}
          onClick={() => setActiveView('direct')}
        >
          Direct Analysis
        </button>
      </div>

      {activeView === 'search' ? (
        <div className="search-view">
          <div className="search-card">
            <div className="search-grid">
              <div>
                <label className="input-label">Topic</label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="e.g. Technology, Elections..." 
                    style={{ paddingLeft: '40px' }}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="City, State, or Country" 
                    style={{ paddingLeft: '40px' }}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Timeframe</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select 
                    style={{ paddingLeft: '40px', width: '100%', height: '42px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                  >
                    <option value="1h">Past Hour</option>
                    <option value="1d">Past 24 Hours</option>
                    <option value="7d">Past Week</option>
                    <option value="1y">Past Year</option>
                  </select>
                </div>
              </div>
              <button className="btn" style={{ height: '42px' }} onClick={handleSearch} disabled={loadingSearch}>
                {loadingSearch ? <Loader2 className="loader-icon" /> : 'Search'}
              </button>
            </div>
          </div>

          <div className="article-list">
            {articles.map((article, index) => (
              <div key={index} className="article-card">
                <div className="article-content">
                  <div className="article-header">
                    <span className="article-source">{article.source}</span>
                    <span className="article-date">{new Date(article.pubDate).toLocaleDateString()}</span>
                  </div>
                  <h3 className="article-title">{article.title}</h3>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                      Read Article
                    </a>
                    <button 
                      className="btn" 
                      onClick={() => handleAnalyze(article.link)}
                      disabled={analysisMap[article.link]?.loading}
                    >
                      {analysisMap[article.link]?.loading ? <Loader2 className="loader-icon" /> : 'Analyze Bias & Summary'}
                    </button>
                  </div>
                </div>

                {analysisMap[article.link] && (
                  <div className="analysis-results">
                    {analysisMap[article.link].loading && <p>Analyzing article content...</p>}
                    {analysisMap[article.link].error && <p className="error-msg" style={{ color: 'red' }}>{analysisMap[article.link].error}</p>}
                    {analysisMap[article.link].data && (
                      <>
                        <div className="summary-text">
                          <strong>Summary:</strong> {analysisMap[article.link].data?.summary}
                        </div>
                        <div className="bias-row">
                          <div className="bias-box">
                            <div className="bias-label">
                              <span>Political Bias</span>
                              <span style={{ color: 'var(--primary)' }}>{analysisMap[article.link].data?.politicalBias.label}</span>
                            </div>
                            <div className="bias-track">
                              <div 
                                className="bias-marker" 
                                style={{ left: `${((analysisMap[article.link].data!.politicalBias.score + 1) / 2) * 100}%` }}
                              ></div>
                            </div>
                            <p className="bias-desc">{analysisMap[article.link].data?.politicalBias.explanation}</p>
                          </div>
                          <div className="bias-box">
                            <div className="bias-label">
                              <span>Emotional Bias</span>
                              <span style={{ color: 'var(--primary)' }}>{analysisMap[article.link].data?.emotionalBias.label}</span>
                            </div>
                            <div className="bias-track">
                              <div 
                                className="bias-marker" 
                                style={{ left: `${analysisMap[article.link].data!.emotionalBias.score * 100}%` }}
                              ></div>
                            </div>
                            <p className="bias-desc">{analysisMap[article.link].data?.emotionalBias.explanation}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {articles.length === 0 && !loadingSearch && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Search size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>Search for a topic and location to see news.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="direct-view">
          <div className="search-card">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button 
                className={`tab ${directInputType === 'url' ? 'active' : ''}`}
                onClick={() => setDirectInputType('url')}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: directInputType === 'url' ? '#eff6ff' : 'white' }}
              >
                URL
              </button>
              <button 
                className={`tab ${directInputType === 'text' ? 'active' : ''}`}
                onClick={() => setDirectInputType('text')}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: directInputType === 'text' ? '#eff6ff' : 'white' }}
              >
                Raw Text
              </button>
            </div>
            {directInputType === 'url' ? (
              <input 
                type="text" 
                placeholder="Paste news article URL here..." 
                value={directInput}
                onChange={(e) => setDirectInput(e.target.value)}
              />
            ) : (
              <textarea 
                placeholder="Paste full article text here..." 
                style={{ width: '100%', minHeight: '200px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '0.5rem' }}
                value={directInput}
                onChange={(e) => setDirectInput(e.target.value)}
              />
            )}
            <button 
              className="btn" 
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={() => handleAnalyze(directInput, directInputType === 'text')}
              disabled={!directInput.trim() || analysisMap[directInput]?.loading}
            >
              {analysisMap[directInput]?.loading ? <Loader2 className="loader-icon" /> : 'Analyze Content'}
            </button>
          </div>

          {analysisMap[directInput]?.data && (
            <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ marginTop: 0 }}>Analysis Result</h3>
              <p className="summary-text">{analysisMap[directInput].data?.summary}</p>
              <div className="bias-row">
                 <div className="bias-box">
                  <div className="bias-label">
                    <span>Political Bias</span>
                    <span>{analysisMap[directInput].data?.politicalBias.label}</span>
                  </div>
                  <div className="bias-track">
                    <div className="bias-marker" style={{ left: `${((analysisMap[directInput].data!.politicalBias.score + 1) / 2) * 100}%` }}></div>
                  </div>
                </div>
                <div className="bias-box">
                  <div className="bias-label">
                    <span>Emotional Bias</span>
                    <span>{analysisMap[directInput].data?.emotionalBias.label}</span>
                  </div>
                  <div className="bias-track">
                    <div className="bias-marker" style={{ left: `${analysisMap[directInput].data!.emotionalBias.score * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
