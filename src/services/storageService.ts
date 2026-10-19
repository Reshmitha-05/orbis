import { QualitySnapshot, QualityAnalysisResult } from '../types/quality';

const STORAGE_KEYS = {
  SNAPSHOTS: 'orbis_quality_history',
  GH_TOKEN: 'orbis_gh_token',
  SEARCH_HISTORY: 'orbis_search_history',
};

export const StorageService = {
  // Quality Snapshots
  getSnapshots(): QualitySnapshot[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse quality snapshots from localStorage', e);
      return [];
    }
  },

  saveSnapshot(analysis: QualityAnalysisResult, notes?: string): QualitySnapshot {
    const snapshots = this.getSnapshots();
    const newSnapshot: QualitySnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      repoFullName: analysis.repoFullName,
      score: analysis.overallScore,
      grade: analysis.grade,
      passedCount: analysis.summary.passedChecks,
      totalChecks: analysis.summary.totalChecks,
      analysis,
      notes,
    };

    // Prepend new snapshot (latest first)
    const updated = [newSnapshot, ...snapshots.filter((s) => s.id !== newSnapshot.id)].slice(0, 50);
    try {
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save snapshot to localStorage', e);
    }
    return newSnapshot;
  },

  deleteSnapshot(id: string): void {
    const snapshots = this.getSnapshots();
    const updated = snapshots.filter((s) => s.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete snapshot from localStorage', e);
    }
  },

  clearAllSnapshots(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS);
    } catch (e) {
      console.error('Failed to clear snapshots from localStorage', e);
    }
  },

  // GitHub Personal Access Token (Read-Only)
  getGithubToken(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.GH_TOKEN) || '';
    } catch {
      return '';
    }
  },

  setGithubToken(token: string): void {
    try {
      const clean = token.trim();
      if (!clean) {
        localStorage.removeItem(STORAGE_KEYS.GH_TOKEN);
      } else {
        localStorage.setItem(STORAGE_KEYS.GH_TOKEN, clean);
      }
    } catch (e) {
      console.error('Failed to set GitHub token in localStorage', e);
    }
  },

  removeGithubToken(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.GH_TOKEN);
    } catch (e) {
      console.error('Failed to remove GitHub token from localStorage', e);
    }
  },

  // Recent searches
  getRecentSearches(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      return raw ? JSON.parse(raw) : ['torvalds', 'shadcn', 'antfu'];
    } catch {
      return ['torvalds', 'shadcn', 'antfu'];
    }
  },

  addRecentSearch(username: string): void {
    try {
      const term = username.trim().toLowerCase();
      if (!term) return;
      const current = this.getRecentSearches().filter((u) => u.toLowerCase() !== term);
      const updated = [term, ...current].slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },
};
