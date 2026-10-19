import React, { useState, useEffect } from 'react';
import { OrbitalArtwork } from './OrbitalArtwork';
import { NavTab } from './Navbar';
import { StorageService } from '../services/storageService';
import { getCurrentRateLimit, subscribeRateLimit } from '../services/githubApi';
import { GitHubRateLimit } from '../types/github';
import {
  Search,
  ShieldCheck,
  TrendingUp,
  GitCompare,
  Compass,
  ArrowRight,
  Activity,
  History,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface HeroProps {
  onSearchUser: (username: string) => void;
  onAnalyzeRepo: (owner: string, repo: string) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearchUser, onAnalyzeRepo, onNavigateTab }) => {
  const [searchInput, setSearchInput] = useState('');
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit>(getCurrentRateLimit());
  const [snapshotCount, setSnapshotCount] = useState<number>(0);

  useEffect(() => {
    const unsub = subscribeRateLimit(setRateLimit);
    setSnapshotCount(StorageService.getSnapshots().length);
    return () => unsub();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!clean) return;

    if (clean.includes('/')) {
      const [owner, repo] = clean.split('/');
      if (owner && repo) {
        onAnalyzeRepo(owner, repo);
        return;
      }
    }
    onSearchUser(clean);
  };

  const sampleProfiles = ['torvalds', 'shadcn', 'antfu'];
  const sampleRepos = ['shadcn-ui/ui', 'torvalds/linux'];

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          paddingTop: '3rem',
          paddingBottom: '3.5rem',
          overflow: 'hidden',
        }}
      >
        <div className="orbis-container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2.5rem',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Headlines & Direct Actions */}
            <div>
              {/* Overline Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-icy-blue)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--color-navy)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '1rem',
                }}
              >
                <Terminal size={10} color="var(--color-teal)" />
                Repository Intelligence Platform
              </div>

              {/* Display Headline */}
              <h1
                style={{
                  marginBottom: '1rem',
                  color: 'var(--color-navy)',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                }}
              >
                See beyond the repository.
              </h1>

              {/* Supporting sentence (concise) */}
              <p
                style={{
                  fontSize: '1.0rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  marginBottom: '1.75rem',
                  maxWidth: '520px',
                }}
              >
                Deterministic repository quality audits, developer benchmarking, and open-source intelligence.
              </p>

              {/* Unified Search / Audit Form */}
              <form
                onSubmit={handleSearchSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.35rem 0.45rem 0.35rem 1rem',
                  boxShadow: 'var(--shadow-sm)',
                  maxWidth: '520px',
                  marginBottom: '1rem',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                <Search size={19} color="var(--color-teal)" style={{ flexShrink: 0, marginRight: '0.65rem' }} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter GitHub username or owner/repo (e.g. shadcn-ui/ui)..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.94rem',
                    color: 'var(--text-primary)',
                    width: '100%',
                    fontFamily: 'var(--font-sans)',
                  }}
                  aria-label="Search developer or repository"
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.55rem 1.15rem' }}>
                  Analyze
                </button>
              </form>

              {/* Quick Try Suggestions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Quick Try:
                </span>
                {sampleRepos.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      const [o, r] = name.split('/');
                      onAnalyzeRepo(o, r);
                    }}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.76rem',
                      color: 'var(--color-navy)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-teal)';
                      e.currentTarget.style.backgroundColor = 'var(--color-icy-blue)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    }}
                  >
                    repo: {name}
                  </button>
                ))}
                {sampleProfiles.map((user) => (
                  <button
                    key={user}
                    onClick={() => onSearchUser(user)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-teal)';
                      e.currentTarget.style.backgroundColor = 'var(--color-icy-blue)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    }}
                  >
                    @{user}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Orbital Art & Deterministic Matrix Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <OrbitalArtwork size={380} />

              {/* Heuristic Matrix Card */}
              <div
                style={{
                  marginTop: '-2.5rem',
                  zIndex: 2,
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '1rem 1.25rem',
                  maxWidth: '350px',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-teal)' }}>
                    Deterministic Engine
                  </span>
                  <span className="badge badge-live">
                    7 Verification Pillars
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
                  Transparent Scoring Matrix
                </div>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Verifies README, SPDX license, CI workflows, test suites, lockfile determinism, community rules & maintenance recency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Platform Telemetry Bar */}
      <section
        style={{
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          padding: '0.85rem 0',
        }}
      >
        <div className="orbis-container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity size={15} color="var(--color-teal)" />
              <span>
                GitHub API Status:{' '}
                <strong style={{ color: 'var(--color-navy)' }}>
                  {rateLimit.remaining} / {rateLimit.limit}
                </strong>{' '}
                requests available
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <History size={15} color="var(--color-teal)" />
              <span>
                Saved Audit Snapshots:{' '}
                <strong style={{ color: 'var(--color-navy)' }}>{snapshotCount}</strong> in localStorage
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={15} color="var(--status-success)" />
              <span style={{ color: 'var(--color-navy)', fontWeight: 500 }}>
                100% Client-Side Deterministic Analysis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities Grid */}
      <section style={{ paddingTop: '3rem', paddingBottom: '3.5rem' }}>
        <div className="orbis-container">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>Platform Capabilities</h2>
            <p style={{ margin: 0 }}>Select a capability to inspect repositories, compare developers, or discover contributions.</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {/* Capability 1: Repository Quality */}
            <div className="orbis-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-icy-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-navy)',
                    marginBottom: '0.85rem',
                  }}
                >
                  <ShieldCheck size={20} color="var(--color-teal)" />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>Repository Quality</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Assess repository standards and identify quality gaps
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('quality')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <span>Audit Repository</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Capability 2: Quality Trends & Audit History */}
            <div className="orbis-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-icy-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-navy)',
                    marginBottom: '0.85rem',
                  }}
                >
                  <TrendingUp size={20} color="var(--color-teal)" />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>Quality Trends & Audit History</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Track assessment results and historical quality changes
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('trends')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <span>Review History</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Capability 3: Developer Benchmarking */}
            <div className="orbis-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-icy-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-navy)',
                    marginBottom: '0.85rem',
                  }}
                >
                  <GitCompare size={20} color="var(--color-teal)" />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>Developer Benchmarking</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Compare developer profiles using public GitHub metrics
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('compare')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <span>Compare Profiles</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Capability 4: Open-Source Discovery */}
            <div className="orbis-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-icy-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-navy)',
                    marginBottom: '0.85rem',
                  }}
                >
                  <Compass size={20} color="var(--color-teal)" />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>Open-Source Discovery</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Identify repositories and suitable contribution opportunities
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('opensource')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <span>Discover Issues</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Concise Dark Navy Banner */}
      <section style={{ paddingBottom: '4rem' }}>
        <div className="orbis-container">
          <div
            style={{
              backgroundColor: 'var(--color-navy)',
              color: 'var(--text-inverse)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.25rem 2rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ maxWidth: '620px' }}>
              <h3 style={{ color: 'var(--color-white)', fontSize: '1.3rem', marginBottom: '0.4rem' }}>
                Deterministic, Client-Side Repository Intelligence
              </h3>
              <p style={{ color: 'var(--color-icy-blue)', margin: 0, fontSize: '0.7rem', lineHeight: 1.5 }}>
                Assess structural health, CI automation, and governance signals directly in your browser without telemetry or server storage.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => onNavigateTab('quality')} className="btn btn-teal">
                Run Quality Audit
              </button>
              <button
                onClick={() => onNavigateTab('trends')}
                className="btn btn-secondary"
                style={{ backgroundColor: 'rgba(232, 242, 250, 0.1)', color: '#FFFFFF', borderColor: 'rgba(232, 242, 250, 0.25)' }}
              >
                Audit History
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

