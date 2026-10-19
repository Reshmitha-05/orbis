import React, { useState, useEffect } from 'react';
import { GitHubIssue, GitHubRepo } from '../types/github';
import { GitHubApi, GitHubApiError } from '../services/githubApi';
import { DEMO_ISSUES } from '../data/demoData';
import { getLanguageColor } from '../data/languageColors';
import {
  Search,
  ExternalLink,
  MessageSquare,
  Star,
  GitFork,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface OpenSourceDiscoveryProps {
  onAnalyzeRepo: (owner: string, repo: string) => void;
  onOpenSettings: () => void;
}

export const OpenSourceDiscovery: React.FC<OpenSourceDiscoveryProps> = ({
  onAnalyzeRepo,
  onOpenSettings,
}) => {
  const [activeMode, setActiveMode] = useState<'issues' | 'repos'>('issues');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [queryTerm, setQueryTerm] = useState<string>('');

  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  const languages = ['all', 'TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'C++', 'Java'];
  const topics = ['all', 'frontend', 'developer-tools', 'cli', 'ai', 'security', 'documentation'];

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    setIsDemo(false);

    try {
      const result = await GitHubApi.searchGoodFirstIssues(
        selectedLanguage,
        selectedTopic,
        queryTerm,
        1,
        15
      );
      setIssues(result.items);
    } catch (err) {
      if (err instanceof GitHubApiError && err.status === 403) {
        setIsDemo(true);
        setIssues(DEMO_ISSUES);
        setError('GitHub API search rate limit reached. Displaying verified demonstration "good first issue" dataset.');
      } else {
        // Fallback demo issues
        setIsDemo(true);
        setIssues(DEMO_ISSUES);
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    setIsDemo(false);

    const queryParts = ['stars:>100'];
    if (selectedLanguage !== 'all') {
      queryParts.push(`language:${selectedLanguage.toLowerCase()}`);
    }
    if (selectedTopic !== 'all') {
      queryParts.push(`topic:${selectedTopic.toLowerCase()}`);
    }
    if (queryTerm.trim()) {
      queryParts.push(queryTerm.trim());
    }

    try {
      const result = await GitHubApi.searchRepositories(queryParts.join(' '), 'stars', 'desc', 1, 12);
      setRepos(result.items);
    } catch (err) {
      if (err instanceof GitHubApiError && err.status === 403) {
        setError('GitHub API search rate limit reached (10 search requests/min). Add a token in settings or wait a moment.');
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'issues') {
      fetchIssues();
    } else {
      fetchRepositories();
    }
  }, [activeMode, selectedLanguage, selectedTopic]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeMode === 'issues') {
      fetchIssues();
    } else {
      fetchRepositories();
    }
  };

  return (
    <div className="orbis-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Header - Clean, professional, no 'Feature 6' label */}
      <div style={{ maxWidth: '780px', margin: '0 auto 2rem auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.4rem', color: 'var(--color-navy)' }}>Open-Source Discovery</h2>
        <p style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
          Explore curated open-source projects and discover beginner-friendly issues labeled{' '}
          <code style={{ fontFamily: 'var(--font-mono)', backgroundColor: 'var(--color-icy-blue)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.85em', color: 'var(--color-navy)' }}>good first issue</code>.
        </p>

        {/* Mode Switcher Pills */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '0.35rem',
            border: '1px solid var(--border-medium)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            onClick={() => setActiveMode('issues')}
            style={{
              background: activeMode === 'issues' ? 'var(--color-navy)' : 'transparent',
              color: activeMode === 'issues' ? 'var(--color-white)' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Good First Issues ({issues.length})
          </button>
          <button
            onClick={() => setActiveMode('repos')}
            style={{
              background: activeMode === 'repos' ? 'var(--color-navy)' : 'transparent',
              color: activeMode === 'repos' ? 'var(--color-white)' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Curated Repositories
          </button>
        </div>

        {/* Filters and Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1rem',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: '780px',
            margin: '0 auto',
          }}
        >
          {/* Query input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '200px' }}>
            <Search size={16} color="var(--color-teal)" />
            <input
              type="text"
              value={queryTerm}
              onChange={(e) => setQueryTerm(e.target.value)}
              placeholder={activeMode === 'issues' ? 'Filter issues (e.g. docs, fix, test)...' : 'Search projects...'}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.88rem',
                width: '100%',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Language filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.82rem',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
            aria-label="Filter by programming language"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {l === 'all' ? 'All Languages' : l}
              </option>
            ))}
          </select>

          {/* Topic filter */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.82rem',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
            aria-label="Filter by topic"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Topics' : `#${t}`}
              </option>
            ))}
          </select>

          <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
            {loading ? 'Searching...' : 'Apply Filters'}
          </button>
        </form>
      </div>

      {/* Demo dataset banner if fallback */}
      {isDemo && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            color: '#92400E',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles size={18} />
            <span style={{ fontSize: '0.85rem' }}>
              <strong>Pre-evaluated Demonstration Issues:</strong> Showing authentic beginner-friendly issue snapshots.
            </span>
          </div>
          <button onClick={onOpenSettings} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
            Token Settings
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && !isDemo && (
        <div
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid #FECACA',
            color: 'var(--status-danger)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <AlertTriangle size={20} />
          <span style={{ fontSize: '0.88rem' }}>{error}</span>
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="animate-orbit" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <RotateCcw size={36} color="var(--color-teal)" />
          </div>
          <p>Querying GitHub Search API for open contributions...</p>
        </div>
      ) : activeMode === 'issues' ? (
        /* Issues Grid */
        issues.length === 0 ? (
          <div className="orbis-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p>No issues found matching your filter criteria. Try selecting All Languages.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="orbis-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Repo badge & open link */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        color: 'var(--color-teal)',
                        fontWeight: 600,
                      }}
                    >
                      {issue.repo_name || 'github/repository'}
                    </span>
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      title="Open Issue on GitHub"
                    >
                      #{issue.number} <ExternalLink size={13} />
                    </a>
                  </div>

                  {/* Issue Title */}
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--color-navy)',
                      lineHeight: 1.35,
                      display: 'block',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {issue.title}
                  </a>

                  {/* Labels */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                    {issue.labels.slice(0, 4).map((lbl) => (
                      <span
                        key={lbl.id}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: `#${lbl.color}22`,
                          color: `#${lbl.color}`,
                          border: `1px solid #${lbl.color}55`,
                          fontWeight: 600,
                        }}
                      >
                        {lbl.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MessageSquare size={13} /> {issue.comments} comments
                  </span>
                  {issue.repo_name && (
                    <button
                      onClick={() => {
                        const parts = issue.repo_name?.split('/');
                        if (parts && parts.length === 2) {
                          onAnalyzeRepo(parts[0], parts[1]);
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                    >
                      Analyze Repo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Curated Repositories Grid */
        repos.length === 0 ? (
          <div className="orbis-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p>No repositories found. Try adjusting search terms.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="orbis-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: 'var(--color-navy)',
                      }}
                    >
                      {repo.full_name}
                    </a>
                    <a href={repo.html_url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
                      <ExternalLink size={15} />
                    </a>
                  </div>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      minHeight: '2.5rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {repo.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid var(--border-subtle)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {repo.language && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getLanguageColor(repo.language),
                          }}
                        />
                        {repo.language}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={13} /> {repo.stargazers_count.toLocaleString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <GitFork size={13} /> {repo.forks_count.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => onAnalyzeRepo(repo.owner.login, repo.name)}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                  >
                    Analyze Quality
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
