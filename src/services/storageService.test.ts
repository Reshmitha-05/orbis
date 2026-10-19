import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { StorageService } from './storageService';
import { QualityAnalysisResult } from '../types/quality';

// Mock localStorage for Node test runner
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('StorageService', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  const mockAnalysis: QualityAnalysisResult = {
    repoFullName: 'test/repo',
    repoName: 'repo',
    owner: 'test',
    assessedAt: new Date().toISOString(),
    overallScore: 88,
    grade: 'A',
    gradeDescription: 'High quality codebase',
    categories: [],
    checks: [],
    summary: {
      passedChecks: 8,
      failedChecks: 2,
      unverifiableChecks: 0,
      totalChecks: 10,
    },
    repoMetadata: {
      description: 'A mock repository',
      stars: 120,
      forks: 15,
      openIssues: 1,
      language: 'TypeScript',
      defaultBranch: 'main',
      licenseName: 'MIT License',
      lastPushed: new Date().toISOString(),
      isArchived: false,
    },
  };

  it('saves and retrieves quality assessment snapshots', () => {
    expect(StorageService.getSnapshots()).toHaveLength(0);

    const saved = StorageService.saveSnapshot(mockAnalysis, 'Initial benchmark');
    expect(saved.id).toBeDefined();
    expect(saved.score).toBe(88);
    expect(saved.grade).toBe('A');

    const list = StorageService.getSnapshots();
    expect(list).toHaveLength(1);
    expect(list[0].repoFullName).toBe('test/repo');
    expect(list[0].notes).toBe('Initial benchmark');
  });

  it('deletes an individual snapshot by ID', () => {
    const s1 = StorageService.saveSnapshot(mockAnalysis);
    expect(StorageService.getSnapshots()).toHaveLength(1);

    StorageService.deleteSnapshot(s1.id);
    expect(StorageService.getSnapshots()).toHaveLength(0);
  });

  it('clears all snapshots with clearAllSnapshots', () => {
    StorageService.saveSnapshot(mockAnalysis);
    StorageService.saveSnapshot({ ...mockAnalysis, repoFullName: 'test/repo2' });
    expect(StorageService.getSnapshots()).toHaveLength(2);

    StorageService.clearAllSnapshots();
    expect(StorageService.getSnapshots()).toHaveLength(0);
  });

  it('manages GitHub Personal Access Token without leak', () => {
    expect(StorageService.getGithubToken()).toBe('');

    StorageService.setGithubToken('ghp_mocktesttoken123');
    expect(StorageService.getGithubToken()).toBe('ghp_mocktesttoken123');

    StorageService.removeGithubToken();
    expect(StorageService.getGithubToken()).toBe('');
  });
});
