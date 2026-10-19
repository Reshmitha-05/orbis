import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { GitHubApi, getCurrentRateLimit, subscribeRateLimit } from '../services/githubApi';
import { GitHubRateLimit } from '../types/github';
import { KeyRound, ShieldCheck, X, Check, Trash2, RefreshCw } from 'lucide-react';

interface TokenSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TokenSettingsModal: React.FC<TokenSettingsModalProps> = ({ isOpen, onClose }) => {
  const [token, setToken] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit>(getCurrentRateLimit());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setToken(StorageService.getGithubToken());
      const unsubscribe = subscribeRateLimit(setRateLimit);
      return () => unsubscribe();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    StorageService.setGithubToken(token);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    // Refresh rate limit
    GitHubApi.checkRateLimit();
  };

  const handleRemove = () => {
    StorageService.removeGithubToken();
    setToken('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    GitHubApi.checkRateLimit();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await GitHubApi.checkRateLimit();
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetMinutes = Math.max(1, Math.round((rateLimit.reset * 1000 - Date.now()) / 60000));
  const percentRemaining = Math.round((rateLimit.remaining / rateLimit.limit) * 100);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="token-modal-title"
    >
      <div className="modal-dialog">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-sky-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-navy)',
              }}
            >
              <KeyRound size={22} />
            </div>
            <div>
              <h3 id="token-modal-title" style={{ fontSize: '1.25rem', margin: 0 }}>API & Rate Limit Settings</h3>
              <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>
                Configure rate-limit capacity & client-side personal access token
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Rate Limit Status Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-navy)' }}>
              Current GitHub REST Rate Limit
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-orbit' : ''} />
              Check Live Status
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--color-navy)' }}>
              {rateLimit.remaining}
            </span>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              / {rateLimit.limit} requests available
            </span>
            <span
              className="badge"
              style={{
                marginLeft: 'auto',
                backgroundColor: percentRemaining > 20 ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                color: percentRemaining > 20 ? 'var(--status-success)' : 'var(--status-danger)',
              }}
            >
              {percentRemaining}% left
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: '8px',
              backgroundColor: 'var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              marginBottom: '0.65rem',
            }}
          >
            <div
              style={{
                width: `${percentRemaining}%`,
                height: '100%',
                backgroundColor: percentRemaining > 20 ? 'var(--color-teal)' : 'var(--status-danger)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Resets in approximately <strong>{resetMinutes} minute(s)</strong>.
          </p>
        </div>

        {/* Token Input Form */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="gh-token-input"
            style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '0.4rem' }}
          >
            Personal Access Token (Classic or Fine-grained)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              id="gh-token-input"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}
            >
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>
            {savedSuccess ? (
              <>
                <Check size={16} /> Saved Successfully
              </>
            ) : (
              'Save Token'
            )}
          </button>
          {StorageService.getGithubToken() && (
            <button
              onClick={handleRemove}
              className="btn btn-secondary"
              title="Remove stored token"
              style={{ color: 'var(--status-danger)' }}
            >
              <Trash2 size={16} /> Remove
            </button>
          )}
        </div>

        {/* Security & Zero Leak Guarantee */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.25rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
        >
          <ShieldCheck size={20} color="var(--color-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong>Zero Leak Guarantee:</strong> ORBIS has no backend or telemetry servers. Your token is stored
            strictly in your browser’s local storage and dispatched directly to <code>https://api.github.com</code>.
            Only read-only permissions (<code>public_repo</code>) are recommended.
          </div>
        </div>
      </div>
    </div>
  );
};
