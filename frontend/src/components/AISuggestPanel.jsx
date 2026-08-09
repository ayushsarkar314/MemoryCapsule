import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const RULE_LABELS = {
  unlockAt: { icon: 'fa-solid fa-unlock-keyhole', color: '#7a545f' },
  expireAt: { icon: 'fa-solid fa-hourglass-end', color: '#b8643a' },
  destroyAfterView: { icon: 'fa-solid fa-bomb', color: '#c97878' },
  eventName: { icon: 'fa-solid fa-flag-checkered', color: '#8e44ad' },
};

/**
 * AISuggestPanel
 * Props:
 *   onUseSuggestion({ title, contentType, suggestedRule }) — called when user picks a card
 */
const AISuggestPanel = ({ onUseSuggestion }) => {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await api.post('/ai/suggest', { hint: hint.trim() });
      setSuggestions(res.data.suggestions);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not get AI suggestions. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUse = (suggestion) => {
    onUseSuggestion(suggestion);
    setOpen(false);
    toast.success('Suggestion applied! Fill in the details and seal it. ✨');
  };

  return (
    <div className="ai-suggest-wrapper">
      {/* Toggle Button */}
      <button
        className="ai-suggest-toggle"
        onClick={() => { setOpen((o) => !o); if (!open && suggestions.length === 0) fetchSuggestions(); }}
        type="button"
        id="ai-suggest-btn"
      >
        <span className="ai-sparkle">✦</span>
        <span>AI Capsule Ideas</span>
        <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '0.75rem', opacity: 0.7 }} />
      </button>

      {/* Panel */}
      {open && (
        <div className="ai-suggest-panel">
          <div className="ai-panel-header">
            <div>
              <p className="ai-panel-title">✦ Personalized Ideas</p>
              <p className="ai-panel-sub">Based on your friends, capsules &amp; history</p>
            </div>
            <button className="ai-refresh-btn" onClick={fetchSuggestions} disabled={loading} title="Refresh suggestions" type="button">
              <i className={`fa-solid fa-rotate-right ${loading ? 'fa-spin' : ''}`} />
            </button>
          </div>

          {/* Optional hint */}
          <div className="ai-hint-row">
            <input
              className="ai-hint-input"
              placeholder="Add a hint… (e.g. 'something for my best friend's birthday')"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchSuggestions(); } }}
              maxLength={200}
              type="text"
              id="ai-hint-input"
            />
            <button className="ai-hint-go" onClick={fetchSuggestions} disabled={loading} type="button">
              {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-wand-magic-sparkles" />}
            </button>
          </div>

          {/* Suggestion Cards */}
          <div className="ai-cards-list">
            {loading && suggestions.length === 0 && (
              <div className="ai-loading-state">
                <div className="ai-loading-orb" />
                <p>Reading your story…</p>
              </div>
            )}

            {!loading && suggestions.length === 0 && (
              <div className="ai-empty-state">
                <p>No ideas yet — hit refresh or add a hint above.</p>
              </div>
            )}

            {suggestions.map((s, i) => {
              const ruleStyle = RULE_LABELS[s.suggestedRule] || RULE_LABELS.unlockAt;
              return (
                <div key={i} className="ai-card" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="ai-card-top">
                    <span className="ai-card-emoji">{s.emoji || '💡'}</span>
                    <div className="ai-card-info">
                      <p className="ai-card-title">{s.title}</p>
                      <p className="ai-card-idea">{s.idea}</p>
                    </div>
                  </div>
                  <div className="ai-card-footer">
                    <span className="ai-card-meta">
                      <i className="fa-solid fa-file-signature" style={{ marginRight: 4 }} />
                      {s.contentType}
                    </span>
                    <span className="ai-card-meta" style={{ color: ruleStyle.color }}>
                      <i className={ruleStyle.icon} style={{ marginRight: 4 }} />
                      {s.suggestedRuleLabel}
                    </span>
                    <button
                      className="ai-use-btn"
                      onClick={() => handleUse(s)}
                      type="button"
                      id={`ai-use-suggestion-${i}`}
                    >
                      Use this →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AISuggestPanel;
