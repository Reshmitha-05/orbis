import React, { useState, useEffect } from 'react';
import { QualitySnapshot, QualityAnalysisResult } from '../types/quality';
import { StorageService } from '../services/storageService';
import { QualityEngine } from '../services/qualityEngine';
import { GitHubApiError } from '../services/githubApi';
import { DEMO_PRE_EVALUATED_ANALYSIS } from '../data/demoData';
import {
  Clock,
  Trash2,
  GitCompare,
  ArrowRight,
  Printer,
  Sparkles,
  Search,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from 'lucide-react';

interface QualityTrendsProps {
  onSelectAnalysis: (analysis: QualityAnalysisResult) => void;
  onOpenPrintReport: (analysis: QualityAnalysisResult) => void;
  onRecheckRepo?: (owner: string, repo: string) => void;
}

export const QualityTrends: React.FC<QualityTrendsProps> = ({
  onSelectAnalysis,
  onOpenPrintReport,
  onRecheckRepo: _onRecheckRepo,
}) => {
  const [snapshots, setSnapshots] = useState<QualitySnapshot[]>([]);
  const [repoInput, setRepoInput] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [compareAId, setCompareAId] = useState<string>('');
  const [compareBId, setCompareBId] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);

  const loadSnapshots = () => {
    const list = StorageService.getSnapshots();
    setSnapshots(list);
    if (list.length >= 2) {
      setCompareAId(list[0].id);
      setCompareBId(list[1].id);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  // Run real analysis and save snapshot
  const handleRunAudit = async (targetRepoString: string) => {
    const clean = targetRepoString.trim();
    if (!clean || !clean.includes('/')) {
      setAuditMessage({
        type: 'error',
        text: 'Please enter a repository in "owner/repo" format (e.g. shadcn-ui/ui or torvalds/linux).',
      });
      return;
    }

    const [owner, repo] = clean.split('/');
    if (!owner || !repo) return;

    setIsAuditing(true);
    setAuditMessage(null);

    const fullKey = `${owner}/${repo}`;

    try {
      const result = await QualityEngine.evaluateRepository(owner, repo);
      const saved = StorageService.saveSnapshot(result);
      loadSnapshots();
      setRepoInput('');
      setAuditMessage({
        type: 'success',
        text: `Audited ${saved.repoFullName}: Score ${saved.score}/100 (Grade ${saved.grade}) saved to audit history.`,
      });
    } catch (err) {
      if (err instanceof GitHubApiError) {
        if (err.status === 404) {
          setAuditMessage({ type: 'error', text: `Repository "${fullKey}" was not found on GitHub.` });
        } else if (err.status === 403) {
          if (DEMO_PRE_EVALUATED_ANALYSIS[fullKey]) {
            const demoResult = DEMO_PRE_EVALUATED_ANALYSIS[fullKey];
            const saved = StorageService.saveSnapshot(demoResult, 'Demo dataset fallback snapshot');
            loadSnapshots();
            setAuditMessage({
              type: 'success',
              text: `API rate limit reached. Saved pre-evaluated audit snapshot for ${saved.repoFullName} (Score: ${saved.score}/100).`,
            });
          } else {
            setAuditMessage({
              type: 'error',
              text: 'GitHub API rate limit exceeded. Please configure a personal access token in settings for live audits.',
            });
          }
        } else {
          setAuditMessage({ type: 'error', text: err.message });
        }
      } else {
        if (DEMO_PRE_EVALUATED_ANALYSIS[fullKey]) {
          const demoResult = DEMO_PRE_EVALUATED_ANALYSIS[fullKey];
          const saved = StorageService.saveSnapshot(demoResult);
          loadSnapshots();
          setAuditMessage({
            type: 'success',
            text: `Saved demo audit snapshot for ${saved.repoFullName} (Score: ${saved.score}/100).`,
          });
        } else {
          setAuditMessage({ type: 'error', text: (err as Error).message });
        }
      }
    } finally {
      setIsAuditing(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRunAudit(repoInput);
  };

  const handleDeleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.deleteSnapshot(id);
    loadSnapshots();
  };

  const handleClearAll = () => {
    StorageService.clearAllSnapshots();
    setSnapshots([]);
    setShowClearConfirm(false);
    setIsComparing(false);
  };

  // Helper to compute score delta relative to the previous snapshot of the same repo
  const getScoreDeltaForSnapshot = (currentIndex: number): { delta: number | null; previousScore: number | null } => {
    const current = snapshots[currentIndex];
    if (!current) return { delta: null, previousScore: null };

    // Snapshots are stored newest first. Look for older snapshot of same repo
    for (let i = currentIndex + 1; i < snapshots.length; i++) {
      if (snapshots[i].repoFullName.toLowerCase() === current.repoFullName.toLowerCase()) {
        return {
          delta: current.score - snapshots[i].score,
          previousScore: snapshots[i].score,
        };
      }
    }

    return { delta: null, previousScore: null };
  };

  const snapA = snapshots.find((s) => s.id === compareAId);
  const snapB = snapshots.find((s) => s.id === compareBId);

  return (
    <div className="orbis-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Header - Clean professional title without "Feature 7" */}
      <div style={{ maxWidth: '780px', margin: '0 auto 2rem auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.4rem', color: 'var(--color-navy)' }}>
          Quality Trends & Audit History
        </h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Track repository quality over time, compare snapshot deltas, and review past audits.
        </p>

        {/* Audit Input Form */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.35rem 0.5rem 0.35rem 1.15rem',
            boxShadow: 'var(--shadow-sm)',
            gap: '0.5rem',
            maxWidth: '620px',
            margin: '0 auto 0.75rem auto',
          }}
        >
          <Search size={18} color="var(--color-teal)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="Enter repository to audit & save snapshot (e.g. shadcn-ui/ui)..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.94rem',
              color: 'var(--text-primary)',
              width: '100%',
              fontFamily: 'var(--font-sans)',
            }}
            aria-label="Repository identifier"
          />
          <button
            type="submit"
            disabled={isAuditing || !repoInput.trim()}
            className="btn btn-primary btn-sm"
            style={{ padding: '0.55rem 1.15rem' }}
          >
            {isAuditing ? 'Auditing...' : 'Run Audit'}
          </button>
        </form>

        {/* Quick Audits suggestions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
            Quick Audits:
          </span>
          <button
            onClick={() => handleRunAudit('shadcn-ui/ui')}
            disabled={isAuditing}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '0.15rem 0.6rem',
              fontSize: '0.75rem',
              color: 'var(--color-navy)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-icy-blue)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
          >
            shadcn-ui/ui
          </button>
          <button
            onClick={() => handleRunAudit('torvalds/linux')}
            disabled={isAuditing}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '0.15rem 0.6rem',
              fontSize: '0.75rem',
              color: 'var(--color-navy)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-icy-blue)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
          >
            torvalds/linux
          </button>
        </div>

        {/* Alert / Feedback message */}
        {auditMessage && (
          <div
            style={{
              backgroundColor: auditMessage.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
              border: `1px solid ${auditMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              color: auditMessage.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1rem',
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              maxWidth: '620px',
              textAlign: 'left',
              marginBottom: '1rem',
            }}
          >
            {auditMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{auditMessage.text}</span>
          </div>
        )}

        {/* History Action Toolbar */}
        {snapshots.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', marginTop: '0.5rem' }}>
            {snapshots.length >= 2 && (
              <button
                onClick={() => setIsComparing(!isComparing)}
                className="btn btn-secondary btn-sm"
              >
                <GitCompare size={14} />
                {isComparing ? 'Close Comparison' : 'Compare Two Snapshots'}
              </button>
            )}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--status-danger)' }}
            >
              <Trash2 size={14} /> Clear History
            </button>
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Clear All Audit History?</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              This will permanently remove all saved quality index assessment snapshots from your browser’s local
              storage. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button onClick={() => setShowClearConfirm(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Comparison Panel */}
      {isComparing && snapA && snapB && (
        <div
          className="orbis-card"
          style={{
            marginBottom: '2rem',
            padding: '1.75rem',
            border: '2px solid var(--color-teal)',
            backgroundColor: 'var(--color-icy-blue)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--color-navy)' }}>
              Historical Snapshot Delta Comparison
            </h3>
            <button onClick={() => setIsComparing(false)} className="btn btn-secondary btn-sm">
              Done
            </button>
          </div>

          {/* Selectors */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: 'var(--color-navy)' }}>
                Baseline Snapshot (A)
              </label>
              <select
                value={compareAId}
                onChange={(e) => setCompareAId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface)',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                }}
              >
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.repoFullName} — {new Date(s.timestamp).toLocaleDateString()} (Score: {s.score})
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight size={18} color="var(--color-teal)" style={{ alignSelf: 'flex-end', marginBottom: '0.5rem' }} />

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: 'var(--color-navy)' }}>
                Comparison Snapshot (B)
              </label>
              <select
                value={compareBId}
                onChange={(e) => setCompareBId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface)',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                }}
              >
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.repoFullName} — {new Date(s.timestamp).toLocaleDateString()} (Score: {s.score})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Delta Stat Box */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem 1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '1rem',
              textAlign: 'center',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score Delta</div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-serif)',
                  color:
                    snapB.score >= snapA.score ? 'var(--status-success)' : 'var(--status-danger)',
                }}
              >
                {snapB.score >= snapA.score ? `+${snapB.score - snapA.score}` : `${snapB.score - snapA.score}`}{' '}
                pts
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Baseline Grade</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                {snapA.grade} ({snapA.score}/100)
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>New Grade</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                {snapB.grade} ({snapB.score}/100)
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Checks Delta</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {snapB.passedCount - snapA.passedCount >= 0
                  ? `+${snapB.passedCount - snapA.passedCount}`
                  : `${snapB.passedCount - snapA.passedCount}`}{' '}
                passed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snapshots List or Clear Empty State */}
      {snapshots.length === 0 ? (
        <div
          className="orbis-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 2rem',
            maxWidth: '560px',
            margin: '0 auto',
            border: '1px dashed var(--border-medium)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <Clock size={40} color="var(--color-teal)" style={{ marginBottom: '0.85rem' }} />
          <h3 style={{ marginBottom: '0.4rem', color: 'var(--color-navy)' }}>No Assessment Snapshots Saved</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Audit any GitHub repository to persist its deterministic quality score, category breakdown, and timestamp for longitudinal tracking.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleRunAudit('shadcn-ui/ui')}
              disabled={isAuditing}
              className="btn btn-primary"
            >
              <Sparkles size={15} />
              {isAuditing ? 'Auditing...' : 'Run Your First Audit (shadcn-ui/ui)'}
            </button>
            <button
              onClick={() => handleRunAudit('torvalds/linux')}
              disabled={isAuditing}
              className="btn btn-secondary"
            >
              Audit torvalds/linux
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-navy)' }}>
              Saved Snapshots ({snapshots.length})
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Ordered by most recent audit
            </span>
          </div>

          {snapshots.map((snap, idx) => {
            const { delta, previousScore } = getScoreDeltaForSnapshot(idx);

            return (
              <div
                key={snap.id}
                className="orbis-card"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  padding: '1.15rem 1.5rem',
                }}
              >
                {/* Left Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
                  {/* Score badge */}
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-navy)',
                      color: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 800,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '1.15rem' }}>{snap.score}</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--color-icy-blue)', marginTop: '2px' }}>
                      {snap.grade}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--color-navy)' }}>
                        {snap.repoFullName}
                      </h4>

                      {/* Score Delta Badge */}
                      {delta !== null ? (
                        <span
                          className="badge"
                          title={`Compared to previous audit (${previousScore} pts)`}
                          style={{
                            fontSize: '0.72rem',
                            backgroundColor:
                              delta > 0
                                ? 'var(--status-success-bg)'
                                : delta < 0
                                ? 'var(--status-danger-bg)'
                                : 'var(--color-icy-blue)',
                            color:
                              delta > 0
                                ? 'var(--status-success)'
                                : delta < 0
                                ? 'var(--status-danger)'
                                : 'var(--color-navy)',
                            border: `1px solid ${
                              delta > 0 ? '#A7F3D0' : delta < 0 ? '#FECACA' : 'var(--border-subtle)'
                            }`,
                          }}
                        >
                          {delta > 0 ? (
                            <>
                              <TrendingUp size={12} /> +{delta} pts
                            </>
                          ) : delta < 0 ? (
                            <>
                              <TrendingDown size={12} /> {delta} pts
                            </>
                          ) : (
                            <>
                              <Minus size={12} /> ±0 pts
                            </>
                          )}
                        </span>
                      ) : (
                        <span
                          className="badge badge-icy"
                          style={{ fontSize: '0.7rem' }}
                        >
                          Initial Snapshot
                        </span>
                      )}

                      {snap.analysis.isDemoData && (
                        <span className="badge badge-demo" style={{ fontSize: '0.68rem' }}>
                          Demo Snapshot
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Audited on {new Date(snap.timestamp).toLocaleString()} • {snap.passedCount} / {snap.totalChecks}{' '}
                      checks passed
                      {snap.notes && <span style={{ marginLeft: '0.5rem', color: 'var(--color-teal)' }}>• {snap.notes}</span>}
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onSelectAnalysis(snap.analysis)}
                    className="btn btn-secondary btn-sm"
                    title="View full audit details in Repository Quality"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => {
                      const [o, r] = snap.repoFullName.split('/');
                      if (o && r) handleRunAudit(`${o}/${r}`);
                    }}
                    disabled={isAuditing}
                    className="btn btn-primary btn-sm"
                    title="Run fresh audit and save new snapshot"
                  >
                    <RefreshCw size={13} /> Recheck
                  </button>

                  <button
                    onClick={() => onOpenPrintReport(snap.analysis)}
                    className="btn btn-secondary btn-sm"
                    title="Export / Print report"
                  >
                    <Printer size={13} /> Report
                  </button>

                  <button
                    onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--status-danger)', padding: '0.4rem 0.55rem' }}
                    title="Delete snapshot"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

