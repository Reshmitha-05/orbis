import React, { useState, useEffect } from 'react';
import { GitHubUser, GitHubRepo } from '../types/github';
import { GitHubApi, GitHubApiError } from '../services/githubApi';
import { StorageService } from '../services/storageService';
import { DEMO_USERS, DEMO_REPOSITORIES } from '../data/demoData';
import { RepoAnalytics } from './RepoAnalytics';
import {
  Search,
  Users,
  BookMarked,
  Calendar,
  MapPin,
  Building,
  Link as LinkIcon,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface ProfileExplorerProps {
  initialUsername?: string;
  onAnalyzeRepo: (owner: string, repo: string) => void;
  onOpenSettings: () => void;
}

export const ProfileExplorer: React.FC<ProfileExplorerProps> = ({
  initialUsername = 'torvalds',
  onAnalyzeRepo,
  onOpenSettings,
}) => {
  const [usernameInput, setUsernameInput] = useState(initialUsername);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);

  const fetchProfile = async (targetUser: string) => {
    const clean = targetUser.trim();
    if (!clean) return;

    setLoading(true);
    setError(null);
    setIsDemoData(false);

    try {
      // 1. Fetch user profile
      const userData = await GitHubApi.getUser(clean);
      setUser(userData);
      StorageService.addRecentSearch(clean);

      // 2. Fetch public repos
      try {
        const repoData = await GitHubApi.getUserRepos(clean, 1, 100, 'updated');
        setRepos(repoData);
      } catch (repoErr) {
        console.warn('Could not fetch repos directly, keeping user data', repoErr);
        setRepos([]);
      }
    } catch (err) {
      if (err instanceof GitHubApiError) {
        if (err.status === 404) {
          setError(`User "@${clean}" was not found on GitHub. Please check the spelling.`);
        } else if (err.status === 403) {
          // Check if we have offline demo data for this user
          if (DEMO_USERS[clean.toLowerCase()]) {
            setUser(DEMO_USERS[clean.toLowerCase()]);
            setRepos(DEMO_REPOSITORIES[clean.toLowerCase()] || []);
            setIsDemoData(true);
            setError(
              `Live rate limit reached. Displaying pre-cached demonstration dataset for @${clean}. Add a GitHub token in settings to restore live API access.`
            );
          } else {
            setError(
              `GitHub API rate limit reached (60 req/hr). Please wait for the rate limit window to reset or add a personal access token.`
            );
          }
        } else {
          setError(err.message);
        }
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUsername) {
      fetchProfile(initialUsername);
    }
  }, [initialUsername]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfile(usernameInput);
  };

  const handleReset = () => {
    setUsernameInput('');
    setUser(null);
    setRepos([]);
    setError(null);
    setIsDemoData(false);
  };

  const handleLoadDemo = (login: string) => {
    setUsernameInput(login);
    setUser(DEMO_USERS[login]);
    setRepos(DEMO_REPOSITORIES[login] || []);
    setIsDemoData(true);
    setError(null);
  };

  return (
    <div className="orbis-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Search Header */}
      <div style={{ maxWidth: '780px', margin: '0 auto 2rem auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.4rem', color: 'var(--color-navy)' }}>Profile Explorer</h2>
        <p style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
          Inspect public developer profiles, explore repository footprints, and assess technology breakdown.
        </p>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.35rem 0.5rem 0.35rem 1.15rem',
            boxShadow: 'var(--shadow-sm)',
            gap: '0.5rem',
          }}
        >
          <Search size={20} color="var(--color-teal)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Search GitHub username (e.g. torvalds, shadcn, antfu)..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              width: '100%',
              fontFamily: 'var(--font-sans)',
            }}
            aria-label="GitHub Username"
          />
          {usernameInput && (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary btn-sm"
              title="Reset search"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button type="submit" disabled={loading || !usernameInput.trim()} className="btn btn-primary">
            {loading ? 'Searching...' : 'Explore'}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
            Popular Profiles:
          </span>
          {Object.keys(DEMO_USERS).map((dev) => (
            <button
              key={dev}
              onClick={() => {
                setUsernameInput(dev);
                fetchProfile(dev);
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.15rem 0.55rem',
                fontSize: '0.75rem',
                color: 'var(--color-navy)',
                cursor: 'pointer',
              }}
            >
              @{dev}
            </button>
          ))}
        </div>
      </div>

      {/* Demo dataset warning banner if applicable */}
      {isDemoData && (
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
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles size={18} />
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              <strong>Demonstration Dataset:</strong> Displaying offline demonstration snapshot. This is pre-evaluated
              sample data, not live GitHub API data.
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            Configure Token
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && !isDemoData && (
        <div
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid #FECACA',
            color: 'var(--status-danger)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertTriangle size={20} />
            <span style={{ fontSize: '0.88rem' }}>{error}</span>
          </div>
          {error.includes('rate limit') && (
            <button
              onClick={() => handleLoadDemo('torvalds')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              Load Demo Profile
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="animate-orbit" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <RotateCcw size={36} color="var(--color-teal)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Gathering Repository Intelligence...</h3>
          <p style={{ fontSize: '0.9rem' }}>Querying GitHub API for public profile and repository manifests.</p>
        </div>
      )}

      {/* Profile Overview Card */}
      {!loading && user && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div
            className="orbis-card"
            style={{
              padding: '2rem',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '2rem',
              alignItems: 'start',
            }}
          >
            {/* Avatar & Badges */}
            <div style={{ textAlign: 'center' }}>
              <img
                src={user.avatar_url}
                alt={`${user.login} avatar`}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: 'var(--radius-full)',
                  border: '3px solid var(--color-sky)',
                  boxShadow: 'var(--shadow-sm)',
                  marginBottom: '0.75rem',
                  objectFit: 'cover',
                }}
              />
              <div>
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', gap: '0.35rem', fontSize: '0.78rem' }}
                >
                  GitHub <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Profile Content */}
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <h3 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--color-navy)' }}>
                  {user.name || user.login}
                </h3>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  @{user.login}
                </span>
                {isDemoData ? (
                  <span className="badge badge-demo">Demo Snapshot</span>
                ) : (
                  <span className="badge badge-live">Live GitHub Data</span>
                )}
              </div>

              {/* Bio */}
              <p style={{ fontSize: '0.98rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {user.bio || 'No public bio provided by this developer.'}
              </p>

              {/* Details Row: Location, Company, Blog, Created date */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1.25rem',
                }}
              >
                {user.company && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building size={14} color="var(--color-teal)" />
                    {user.company}
                  </span>
                )}
                {user.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={14} color="var(--color-teal)" />
                    {user.location}
                  </span>
                )}
                {user.blog && (
                  <a
                    href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <LinkIcon size={14} color="var(--color-teal)" />
                    {user.blog.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} color="var(--color-teal)" />
                  Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Stat Counters */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '1rem',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <BookMarked size={14} /> Public Repos
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--color-navy)' }}>
                    {user.public_repos.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <Users size={14} /> Followers
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--color-navy)' }}>
                    {user.followers.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <Users size={14} /> Following
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--color-navy)' }}>
                    {user.following.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repositories Analytics Section */}
      {!loading && user && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Public Repositories</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Select any repository to run the deterministic Repository Quality Index audit.
            </p>
          </div>
          <RepoAnalytics repos={repos} onAnalyzeRepo={onAnalyzeRepo} />
        </div>
      )}

      {/* Empty State when no user queried */}
      {!loading && !user && !error && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            padding: '4rem 2rem',
            textAlign: 'center',
            maxWidth: '620px',
            margin: '0 auto',
          }}
        >
          <BookMarked size={44} color="var(--color-teal)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No Profile Loaded</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Search for a developer above to explore their public repository portfolio, language footprint, and quality health.
          </p>
          <button onClick={() => fetchProfile('torvalds')} className="btn btn-secondary">
            Load Linus Torvalds Portfolio
          </button>
        </div>
      )}
    </div>
  );
};
