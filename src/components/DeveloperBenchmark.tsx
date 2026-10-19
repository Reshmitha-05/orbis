import React, { useState, useEffect } from 'react';
import { GitHubUser, GitHubRepo } from '../types/github';
import { GitHubApi, GitHubApiError } from '../services/githubApi';
import { DEMO_USERS, DEMO_REPOSITORIES } from '../data/demoData';
import { getLanguageColor } from '../data/languageColors';
import {
  Star,
  GitFork,
  BookMarked,
  Users,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface DeveloperBenchmarkProps {
  onOpenSettings: () => void;
}

interface DevData {
  user: GitHubUser;
  repos: GitHubRepo[];
  totalStars: number;
  totalForks: number;
  topLanguages: Array<{ language: string; count: number; percentage: number }>;
}

export const DeveloperBenchmark: React.FC<DeveloperBenchmarkProps> = ({ onOpenSettings }) => {
  const [userAInput, setUserAInput] = useState('torvalds');
  const [userBInput, setUserBInput] = useState('antfu');

  const [devA, setDevA] = useState<DevData | null>(null);
  const [devB, setDevB] = useState<DevData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const processDeveloperData = (user: GitHubUser, repos: GitHubRepo[]): DevData => {
    let totalStars = 0;
    let totalForks = 0;
    const langCounts: Record<string, number> = {};
    let totalWithLang = 0;

    repos.forEach((r) => {
      totalStars += r.stargazers_count;
      totalForks += r.forks_count;
      if (r.language) {
        langCounts[r.language] = (langCounts[r.language] || 0) + 1;
        totalWithLang++;
      }
    });

    const topLanguages = Object.entries(langCounts)
      .map(([lang, count]) => ({
        language: lang,
        count,
        percentage: totalWithLang > 0 ? Math.round((count / totalWithLang) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { user, repos, totalStars, totalForks, topLanguages };
  };

  const runBenchmark = async (userA: string, userB: string) => {
    const cleanA = userA.trim();
    const cleanB = userB.trim();
    if (!cleanA || !cleanB) return;

    setLoading(true);
    setError(null);
    setIsDemo(false);

    try {
      // Fetch both in parallel
      const [userARes, userBRes] = await Promise.all([
        GitHubApi.getUser(cleanA),
        GitHubApi.getUser(cleanB),
      ]);

      const [reposARes, reposBRes] = await Promise.all([
        GitHubApi.getUserRepos(cleanA, 1, 100, 'updated').catch(() => []),
        GitHubApi.getUserRepos(cleanB, 1, 100, 'updated').catch(() => []),
      ]);

      setDevA(processDeveloperData(userARes, reposARes));
      setDevB(processDeveloperData(userBRes, reposBRes));
    } catch (err) {
      if (err instanceof GitHubApiError && err.status === 403) {
        // Fallback to demo profiles if rate limited
        if (DEMO_USERS[cleanA.toLowerCase()] && DEMO_USERS[cleanB.toLowerCase()]) {
          setDevA(
            processDeveloperData(
              DEMO_USERS[cleanA.toLowerCase()],
              DEMO_REPOSITORIES[cleanA.toLowerCase()] || []
            )
          );
          setDevB(
            processDeveloperData(
              DEMO_USERS[cleanB.toLowerCase()],
              DEMO_REPOSITORIES[cleanB.toLowerCase()] || []
            )
          );
          setIsDemo(true);
          setError(
            'API rate limit reached. Displaying pre-cached demonstration benchmarking data. Add a GitHub token for live comparisons.'
          );
        } else {
          setError(err.message);
        }
      } else {
        // Check if demo users match
        if (DEMO_USERS[cleanA.toLowerCase()] && DEMO_USERS[cleanB.toLowerCase()]) {
          setDevA(
            processDeveloperData(
              DEMO_USERS[cleanA.toLowerCase()],
              DEMO_REPOSITORIES[cleanA.toLowerCase()] || []
            )
          );
          setDevB(
            processDeveloperData(
              DEMO_USERS[cleanB.toLowerCase()],
              DEMO_REPOSITORIES[cleanB.toLowerCase()] || []
            )
          );
          setIsDemo(true);
        } else {
          setError((err as Error).message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBenchmark(userAInput, userBInput);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runBenchmark(userAInput, userBInput);
  };

  return (
    <div className="orbis-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Header - Clean, professional, no 'Feature 5' label */}
      <div style={{ maxWidth: '780px', margin: '0 auto 2rem auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.4rem', color: 'var(--color-navy)' }}>Developer Benchmarking</h2>
        <p style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
          Compare public ecosystem footprints, open-source reach, and technology stacks side-by-side with objective metrics.
        </p>

        {/* Inputs Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1rem',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: '680px',
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '180px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-navy)' }}>Dev A:</span>
            <input
              type="text"
              value={userAInput}
              onChange={(e) => setUserAInput(e.target.value)}
              placeholder="Username A..."
              style={{
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '0.4rem 0.6rem',
                fontSize: '0.88rem',
                width: '100%',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <span style={{ fontWeight: 800, color: 'var(--color-teal)' }}>VS</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '180px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-teal)' }}>Dev B:</span>
            <input
              type="text"
              value={userBInput}
              onChange={(e) => setUserBInput(e.target.value)}
              placeholder="Username B..."
              style={{
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '0.4rem 0.6rem',
                fontSize: '0.88rem',
                width: '100%',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-sm" style={{ padding: '0.55rem 1.25rem' }}>
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </form>

        {/* Quick presets */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.85rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
          <button
            onClick={() => {
              setUserAInput('torvalds');
              setUserBInput('antfu');
              runBenchmark('torvalds', 'antfu');
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
            torvalds vs antfu
          </button>
          <button
            onClick={() => {
              setUserAInput('shadcn');
              setUserBInput('antfu');
              runBenchmark('shadcn', 'antfu');
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
            shadcn vs antfu
          </button>
        </div>
      </div>

      {/* Demo Warning */}
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
              <strong>Demonstration Benchmark:</strong> Displaying offline demonstration snapshot data.
            </span>
          </div>
          <button onClick={onOpenSettings} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
            Token Settings
          </button>
        </div>
      )}

      {/* Error Message */}
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

      {/* Ethical Benchmarking Disclaimer */}
      <div
        style={{
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          marginBottom: '2rem',
        }}
      >
        <Info size={18} color="var(--color-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>Ethical Benchmarking Notice:</strong> ORBIS compares public GitHub metrics (repository count, stars,
          forks, and primary languages). Popularity metrics do not define engineering quality, system design capability,
          or personal seniority. No developer is declared &quot;better&quot; based solely on star counts.
        </div>
      </div>

      {/* Comparison Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="animate-orbit" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <RotateCcw size={36} color="var(--color-teal)" />
          </div>
          <p>Analyzing developer profiles and aggregating repository metrics...</p>
        </div>
      ) : devA && devB ? (
        <div>
          {/* Side by side Developer Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            {/* Dev A Card */}
            <div className="orbis-card" style={{ borderTop: '4px solid var(--color-navy)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <img
                  src={devA.user.avatar_url}
                  alt={devA.user.login}
                  style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid var(--color-sky)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--color-navy)' }}>
                    {devA.user.name || devA.user.login}
                  </h3>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    @{devA.user.login}
                  </div>
                  {devA.user.company && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{devA.user.company}</div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', minHeight: '2.5rem' }}>
                {devA.user.bio || 'No public bio provided.'}
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Joined {new Date(devA.user.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Dev B Card */}
            <div className="orbis-card" style={{ borderTop: '4px solid var(--color-teal)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <img
                  src={devB.user.avatar_url}
                  alt={devB.user.login}
                  style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid var(--color-sky)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--color-teal)' }}>
                    {devB.user.name || devB.user.login}
                  </h3>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    @{devB.user.login}
                  </div>
                  {devB.user.company && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{devB.user.company}</div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', minHeight: '2.5rem' }}>
                {devB.user.bio || 'No public bio provided.'}
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Joined {new Date(devB.user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Comparative Metrics Table & Bar Charts */}
          <div className="orbis-card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Footprint & Engagement Comparison</h3>

            {/* Metric Rows */}
            {[
              {
                label: 'Public Repositories',
                valA: devA.user.public_repos,
                valB: devB.user.public_repos,
                icon: <BookMarked size={16} />,
              },
              {
                label: 'Total Stars (Audited Repos)',
                valA: devA.totalStars,
                valB: devB.totalStars,
                icon: <Star size={16} />,
              },
              {
                label: 'Total Forks (Audited Repos)',
                valA: devA.totalForks,
                valB: devB.totalForks,
                icon: <GitFork size={16} />,
              },
              {
                label: 'Followers',
                valA: devA.user.followers,
                valB: devB.user.followers,
                icon: <Users size={16} />,
              },
            ].map((metric) => {
              const total = (metric.valA || 0) + (metric.valB || 0);
              const pctA = total > 0 ? Math.round(((metric.valA || 0) / total) * 100) : 50;
              const pctB = 100 - pctA;

              return (
                <div key={metric.label} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-navy)' }}>
                      {(metric.valA || 0).toLocaleString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {metric.icon} {metric.label}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--color-teal)' }}>
                      {(metric.valB || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Dual Bar */}
                  <div
                    style={{
                      height: '8px',
                      display: 'flex',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--border-subtle)',
                    }}
                  >
                    <div style={{ width: `${pctA}%`, backgroundColor: 'var(--color-navy)', height: '100%' }} />
                    <div style={{ width: `${pctB}%`, backgroundColor: 'var(--color-teal)', height: '100%' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Language Breakdown Comparison */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Dev A Top Languages */}
            <div className="orbis-card">
              <h4 style={{ marginBottom: '0.85rem', color: 'var(--color-navy)' }}>
                @{devA.user.login} Tech Stack
              </h4>
              {devA.topLanguages.length === 0 ? (
                <p style={{ fontSize: '0.85rem' }}>No language data available.</p>
              ) : (
                devA.topLanguages.map((l) => (
                  <div key={l.language} style={{ marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getLanguageColor(l.language),
                          }}
                        />
                        {l.language}
                      </span>
                      <span>{l.count} repo(s) ({l.percentage}%)</span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${l.percentage}%`, height: '100%', backgroundColor: getLanguageColor(l.language) }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dev B Top Languages */}
            <div className="orbis-card">
              <h4 style={{ marginBottom: '0.85rem', color: 'var(--color-teal)' }}>
                @{devB.user.login} Tech Stack
              </h4>
              {devB.topLanguages.length === 0 ? (
                <p style={{ fontSize: '0.85rem' }}>No language data available.</p>
              ) : (
                devB.topLanguages.map((l) => (
                  <div key={l.language} style={{ marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getLanguageColor(l.language),
                          }}
                        />
                        {l.language}
                      </span>
                      <span>{l.count} repo(s) ({l.percentage}%)</span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${l.percentage}%`, height: '100%', backgroundColor: getLanguageColor(l.language) }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
