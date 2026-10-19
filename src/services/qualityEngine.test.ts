import { describe, it, expect } from 'vitest';
import { QualityEngine } from './qualityEngine';
import { GitHubRepo } from '../types/github';

describe('QualityEngine deterministic scoring formula', () => {
  const mockRepo: GitHubRepo = {
    id: 12345,
    name: 'test-project',
    full_name: 'acme/test-project',
    private: false,
    html_url: 'https://github.com/acme/test-project',
    description: 'A robust open-source engine for repository analysis',
    fork: false,
    url: 'https://api.github.com/repos/acme/test-project',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
    pushed_at: new Date().toISOString(), // recent
    git_url: '',
    ssh_url: '',
    clone_url: '',
    homepage: null,
    size: 2048,
    stargazers_count: 500,
    watchers_count: 500,
    language: 'TypeScript',
    has_issues: true,
    has_projects: true,
    has_downloads: true,
    has_wiki: true,
    has_pages: false,
    forks_count: 50,
    archived: false,
    disabled: false,
    open_issues_count: 5,
    license: {
      key: 'mit',
      name: 'MIT License',
      spdx_id: 'MIT',
      url: 'https://api.github.com/licenses/mit',
    },
    topics: ['intelligence', 'analytics', 'typescript'],
    default_branch: 'main',
    owner: {
      login: 'acme',
      avatar_url: 'https://github.com/acme.png',
      html_url: 'https://github.com/acme',
    },
  };

  it('awards 100 points and A+ grade for complete repository hygiene', () => {
    const inspection = {
      rootFiles: [
        'readme.md',
        'license',
        'package.json',
        'pnpm-lock.yaml',
        'vitest.config.ts',
        'contributing.md',
        'code_of_conduct.md',
      ],
      githubFiles: ['workflows', 'contributing.md'],
      readmeText: '## Getting Started\nRun `npm install` and `npm run test` to start development. Extensive documentation.',
      readmeSize: 12000,
      hasGithubWorkflows: true,
      canInspectContents: true,
    };

    const checks = QualityEngine.runDeterministicChecks(mockRepo, inspection);
    const result = QualityEngine.aggregateResults(mockRepo, checks);

    expect(result.overallScore).toBe(100);
    expect(result.grade).toBe('A+');
    expect(result.summary.passedChecks).toBe(checks.length);
    expect(result.summary.failedChecks).toBe(0);
  });

  it('correctly docks points when license, CI, or tests are missing', () => {
    const bareRepo: GitHubRepo = {
      ...mockRepo,
      license: null,
      description: null,
      topics: [],
      has_issues: false,
      pushed_at: '2020-01-01T00:00:00Z', // 4+ years ago
    };

    const bareInspection = {
      rootFiles: ['main.py'],
      githubFiles: [],
      readmeText: null,
      readmeSize: 0,
      hasGithubWorkflows: false,
      canInspectContents: true,
    };

    const checks = QualityEngine.runDeterministicChecks(bareRepo, bareInspection);
    const result = QualityEngine.aggregateResults(bareRepo, checks);

    expect(result.overallScore).toBeLessThan(30);
    expect(result.grade).toBe('D');
    expect(result.summary.failedChecks).toBeGreaterThan(5);
  });

  it('marks checks as unverifiable if contents API is blocked', () => {
    const inspection = {
      rootFiles: [],
      githubFiles: [],
      readmeText: null,
      readmeSize: 0,
      hasGithubWorkflows: false,
      canInspectContents: false,
    };

    const checks = QualityEngine.runDeterministicChecks(mockRepo, inspection);
    const unverifiable = checks.filter((c) => c.status === 'unverifiable');
    expect(unverifiable.length).toBeGreaterThan(0);
  });
});
