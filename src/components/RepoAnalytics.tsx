import React, { useState, useMemo } from 'react';
import { GitHubRepo } from '../types/github';
import { getLanguageColor } from '../data/languageColors';
import {
  Star,
  GitFork,
  AlertCircle,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface RepoAnalyticsProps {
  repos: GitHubRepo[];
  onAnalyzeRepo: (owner: string, repo: string) => void;
  isLoading?: boolean;
}

export const RepoAnalytics: React.FC<RepoAnalyticsProps> = ({ repos, onAnalyzeRepo, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'forks' | 'name'>('updated');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Compute Language Distribution
  const languageStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalWithLanguage = 0;

    repos.forEach((r) => {
      if (r.language) {
        counts[r.language] = (counts[r.language] || 0) + 1;
        totalWithLanguage++;
      }
    });

    const sortedLangs = Object.entries(counts)
      .map(([lang, count]) => ({
        language: lang,
        count,
        percentage: totalWithLanguage > 0 ? Math.round((count / totalWithLanguage) * 100) : 0,
        color: getLanguageColor(lang),
      }))
      .sort((a, b) => b.count - a.count);

    return { stats: sortedLangs, totalWithLanguage };
  }, [repos]);

  // Unique languages for filter dropdown
  const uniqueLanguages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((r) => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [repos]);

  // Filtered and Sorted Repositories
  const filteredRepos = useMemo(() => {
    return repos
      .filter((repo) => {
        const matchesSearch =
          repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesLang = selectedLanguage === 'all' || repo.language === selectedLanguage;
        return matchesSearch && matchesLang;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
        if (sortBy === 'forks') return b.forks_count - a.forks_count;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // default updated
        return new Date(b.pushed_at || b.updated_at).getTime() - new Date(a.pushed_at || a.updated_at).getTime();
      });
  }, [repos, searchTerm, selectedLanguage, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRepos.length / pageSize));
  const paginatedRepos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRepos.slice(start, start + pageSize);
  }, [filteredRepos, currentPage, pageSize]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: 'updated' | 'stars' | 'forks' | 'name') => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div className="animate-orbit" style={{ display: 'inline-block', marginBottom: '1rem' }}>
          <ShieldCheck size={36} color="var(--color-teal)" />
        </div>
        <p>Analyzing repository metadata...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Language Distribution Bar & Breakdown */}
      {languageStats.stats.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-navy)' }}>
              Language Ecosystem Distribution
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {repos.length} Repositories Analyzed
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div
            style={{
              height: '10px',
              display: 'flex',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              backgroundColor: 'var(--border-subtle)',
              marginBottom: '0.85rem',
            }}
          >
            {languageStats.stats.map((item) => (
              <div
                key={item.language}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                  height: '100%',
                }}
                title={`${item.language}: ${item.count} repo(s) (${item.percentage}%)`}
              />
            ))}
          </div>

          {/* Language Legends */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
            {languageStats.stats.slice(0, 6).map((item) => (
              <button
                key={item.language}
                onClick={() => handleLanguageChange(selectedLanguage === item.language ? 'all' : item.language)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  color: selectedLanguage === item.language ? 'var(--color-navy)' : 'var(--text-secondary)',
                  fontWeight: selectedLanguage === item.language ? 700 : 500,
                  padding: '0.2rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedLanguage === item.language ? 'var(--color-sky-soft)' : 'transparent',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    display: 'inline-block',
                  }}
                />
                <span>{item.language}</span>
                <span style={{ color: 'var(--text-muted)' }}>{item.percentage}%</span>
              </button>
            ))}
            {selectedLanguage !== 'all' && (
              <button
                onClick={() => handleLanguageChange('all')}
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-teal)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Controls Bar: Search, Language Filter, Sort */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.75rem',
            width: '100%',
            maxWidth: '320px',
          }}
        >
          <Search size={16} color="var(--color-teal)" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Filter repositories by name..."
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

        {/* Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Language dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
              aria-label="Filter by programming language"
            >
              <option value="all">All Languages ({repos.length})</option>
              {uniqueLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Sort dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowUpDown size={14} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as 'updated' | 'stars' | 'forks' | 'name')}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
              aria-label="Sort repositories"
            >
              <option value="updated">Recently Pushed</option>
              <option value="stars">Most Stars</option>
              <option value="forks">Most Forks</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Repositories Grid */}
      {paginatedRepos.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={32} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ marginBottom: '0.25rem' }}>No Repositories Matched</h4>
          <p style={{ fontSize: '0.88rem' }}>Try clearing your search terms or language filter.</p>
          {(searchTerm || selectedLanguage !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedLanguage('all');
              }}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          {paginatedRepos.map((repo) => (
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
                {/* Header: Title and external link */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--color-navy)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {repo.name}
                  </a>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    title="View on GitHub"
                    style={{ color: 'var(--text-muted)', padding: '0.2rem' }}
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '1rem',
                    minHeight: '2.6rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {repo.description || 'No description provided by repository maintainer.'}
                </p>
              </div>

              <div>
                {/* Meta Tags: Language, Stars, Forks */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    marginBottom: '0.85rem',
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
                    <Star size={13} />
                    {repo.stargazers_count.toLocaleString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <GitFork size={13} />
                    {repo.forks_count.toLocaleString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
                    <Clock size={12} />
                    {new Date(repo.pushed_at || repo.updated_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Action button: Analyze Quality */}
                <button
                  onClick={() => onAnalyzeRepo(repo.owner.login, repo.name)}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', gap: '0.4rem' }}
                >
                  <ShieldCheck size={14} /> Analyze Quality Index
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            paddingTop: '1rem',
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary btn-sm"
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredRepos.length} items)
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary btn-sm"
            aria-label="Next Page"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
