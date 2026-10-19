import { GitHubUser, GitHubRepo, GitHubIssue, GitHubRateLimit } from '../types/github';
import { StorageService } from './storageService';

const GITHUB_API_BASE = 'https://api.github.com';

// Cache structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

// Global Rate Limit Store
let currentRateLimit: GitHubRateLimit = {
  limit: 60,
  remaining: 60,
  reset: Math.floor(Date.now() / 1000) + 3600,
  used: 0,
};

type RateLimitListener = (rateLimit: GitHubRateLimit) => void;
const rateLimitListeners = new Set<RateLimitListener>();

export function subscribeRateLimit(listener: RateLimitListener): () => void {
  rateLimitListeners.add(listener);
  listener(currentRateLimit);
  return () => {
    rateLimitListeners.delete(listener);
  };
}

export function getCurrentRateLimit(): GitHubRateLimit {
  return currentRateLimit;
}

function updateRateLimitFromHeaders(headers: Headers): void {
  const limitHeader = headers.get('x-ratelimit-limit');
  const remainingHeader = headers.get('x-ratelimit-remaining');
  const resetHeader = headers.get('x-ratelimit-reset');
  const usedHeader = headers.get('x-ratelimit-used');

  if (limitHeader && remainingHeader && resetHeader) {
    const limit = parseInt(limitHeader, 10);
    const remaining = parseInt(remainingHeader, 10);
    const reset = parseInt(resetHeader, 10);
    const used = usedHeader ? parseInt(usedHeader, 10) : limit - remaining;

    currentRateLimit = { limit, remaining, reset, used };
    rateLimitListeners.forEach((listener) => {
      try {
        listener(currentRateLimit);
      } catch (e) {
        console.error('Rate limit listener failed', e);
      }
    });
  }
}

export class GitHubApiError extends Error {
  status: number;
  rateLimitReset?: number;
  documentationUrl?: string;

  constructor(message: string, status: number, rateLimitReset?: number, documentationUrl?: string) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.rateLimitReset = rateLimitReset;
    this.documentationUrl = documentationUrl;
  }
}

async function fetchFromGitHub<T>(
  endpoint: string,
  options: { headers?: Record<string, string>; skipCache?: boolean } = {}
): Promise<T> {
  const cacheKey = endpoint;
  const now = Date.now();

  if (!options.skipCache) {
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  const token = StorageService.getGithubToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Orbis-Intelligence-Platform',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, { headers });
  } catch (err) {
    throw new GitHubApiError(
      `Network connection failed while reaching GitHub API. Check your internet connection. (${(err as Error).message})`,
      0
    );
  }

  updateRateLimitFromHeaders(response.headers);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    const resetHeader = response.headers.get('x-ratelimit-reset');
    const resetTime = resetHeader ? parseInt(resetHeader, 10) : undefined;

    if (response.status === 404) {
      throw new GitHubApiError(`Resource not found at ${endpoint}`, 404);
    } else if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
      const minutesLeft = resetTime ? Math.max(1, Math.round((resetTime * 1000 - Date.now()) / 60000)) : 60;
      throw new GitHubApiError(
        `GitHub API rate limit exceeded (60 req/hr unauthenticated). Resets in ~${minutesLeft} min. You can add a personal read-only GitHub token in settings to unlock 5,000 requests/hr.`,
        403,
        resetTime,
        errorBody.documentation_url
      );
    } else if (response.status === 401) {
      throw new GitHubApiError('Invalid GitHub Personal Access Token. Please verify or remove your token in settings.', 401);
    } else {
      throw new GitHubApiError(
        errorBody.message || `GitHub API request failed with status ${response.status}`,
        response.status,
        resetTime,
        errorBody.documentation_url
      );
    }
  }

  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: now });
  return data as T;
}

export const GitHubApi = {
  // 1. Profile Explorer
  async getUser(username: string): Promise<GitHubUser> {
    const cleanUser = username.trim();
    if (!cleanUser) throw new Error('Username cannot be empty');
    return fetchFromGitHub<GitHubUser>(`/users/${encodeURIComponent(cleanUser)}`);
  },

  // 2. Repositories
  async getUserRepos(
    username: string,
    page: number = 1,
    perPage: number = 100,
    sort: 'updated' | 'stars' | 'pushed' | 'full_name' = 'updated'
  ): Promise<GitHubRepo[]> {
    const cleanUser = username.trim();
    return fetchFromGitHub<GitHubRepo[]>(
      `/users/${encodeURIComponent(cleanUser)}/repos?page=${page}&per_page=${perPage}&sort=${sort}`
    );
  },

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return fetchFromGitHub<GitHubRepo>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  },

  // 3. Repository Contents & Tree Inspection
  async getRepoContents(
    owner: string,
    repo: string,
    path: string = ''
  ): Promise<Array<{ name: string; path: string; type: 'file' | 'dir'; size: number; download_url: string | null }>> {
    try {
      const cleanPath = path ? `/${encodeURIComponent(path)}` : '';
      return await fetchFromGitHub<Array<{ name: string; path: string; type: 'file' | 'dir'; size: number; download_url: string | null }>>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents${cleanPath}`
      );
    } catch (e) {
      if ((e as GitHubApiError).status === 404) {
        return [];
      }
      throw e;
    }
  },

  async getRepoReadme(owner: string, repo: string): Promise<{ name: string; size: number; content?: string } | null> {
    try {
      const res = await fetchFromGitHub<{ name: string; size: number; content?: string }>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`
      );
      return res;
    } catch {
      return null;
    }
  },

  async getLatestCommit(owner: string, repo: string): Promise<{ commit: { committer: { date: string }; message: string } } | null> {
    try {
      const commits = await fetchFromGitHub<Array<{ commit: { committer: { date: string }; message: string } }>>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=1`
      );
      return commits.length > 0 ? commits[0] : null;
    } catch {
      return null;
    }
  },

  async getLatestRelease(owner: string, repo: string): Promise<{ tag_name: string; published_at: string; name: string } | null> {
    try {
      return await fetchFromGitHub<{ tag_name: string; published_at: string; name: string }>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`
      );
    } catch {
      return null;
    }
  },

  // 4. Open-Source Discovery via GitHub Search API
  async searchRepositories(
    query: string,
    sort: 'stars' | 'forks' | 'updated' = 'stars',
    order: 'desc' | 'asc' = 'desc',
    page: number = 1,
    perPage: number = 20
  ): Promise<{ total_count: number; items: GitHubRepo[] }> {
    const q = encodeURIComponent(query);
    return fetchFromGitHub<{ total_count: number; items: GitHubRepo[] }>(
      `/search/repositories?q=${q}&sort=${sort}&order=${order}&page=${page}&per_page=${perPage}`
    );
  },

  async searchGoodFirstIssues(
    language?: string,
    topic?: string,
    searchTerm: string = '',
    page: number = 1,
    perPage: number = 20
  ): Promise<{ total_count: number; items: GitHubIssue[] }> {
    const parts: string[] = ['is:issue', 'state:open', 'label:"good first issue"'];
    if (language && language !== 'all') {
      parts.push(`language:${language.toLowerCase()}`);
    }
    if (topic && topic !== 'all') {
      parts.push(`topic:${topic.toLowerCase()}`);
    }
    if (searchTerm.trim()) {
      parts.push(searchTerm.trim());
    }

    const q = encodeURIComponent(parts.join(' '));
    const result = await fetchFromGitHub<{ total_count: number; items: GitHubIssue[] }>(
      `/search/issues?q=${q}&sort=updated&order=desc&page=${page}&per_page=${perPage}`
    );

    // Annotate issue with repo_name and repo_owner from repository_url
    const items = result.items.map((issue) => {
      const parts = issue.repository_url.split('/');
      const repoName = parts.slice(-2).join('/');
      const repoOwner = parts[parts.length - 2];
      return {
        ...issue,
        repo_name: repoName,
        repo_owner: repoOwner,
      };
    });

    return { total_count: result.total_count, items };
  },

  // 5. Rate limit status directly
  async checkRateLimit(): Promise<GitHubRateLimit> {
    try {
      const res = await fetchFromGitHub<{ resources: { core: GitHubRateLimit } }>('/rate_limit', { skipCache: true });
      if (res?.resources?.core) {
        currentRateLimit = res.resources.core;
        rateLimitListeners.forEach((l) => l(currentRateLimit));
        return currentRateLimit;
      }
    } catch {
      // fallback
    }
    return currentRateLimit;
  },

  clearCache(): void {
    cache.clear();
  },
};
