import React, { useState, useEffect } from 'react';
import { QualityAnalysisResult } from '../types/quality';
import { OrbitalLogo } from './OrbitalLogo';
import { Printer, Copy, Check, X, ShieldCheck } from 'lucide-react';

interface PrintReportModalProps {
  analysis: QualityAnalysisResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  analysis,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !analysis) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const md = [
      `# ORBIS Quality Intelligence Audit Report`,
      `**Target Repository:** ${analysis.repoFullName}`,
      `**Assessment Timestamp:** ${new Date(analysis.assessedAt).toUTCString()}`,
      `**Deterministic Score:** ${analysis.overallScore} / 100 (Grade ${analysis.grade})`,
      `**Evaluation Verdict:** ${analysis.gradeDescription}`,
      '',
      `## Category Scores:`,
      ...analysis.categories.map((c) => `- **${c.title}:** ${c.earnedScore}/${c.maxWeight} pts (${c.percentage}%)`),
      '',
      `## Detailed Checks & Evidence:`,
      ...analysis.checks.map(
        (chk) =>
          `### [${chk.status.toUpperCase()}] ${chk.title} (${chk.earnedPoints}/${chk.weight} pts)\n- **Evidence:** ${chk.evidence}\n- **Why it matters:** ${chk.explanation}\n- **Actionable Recommendation:** ${chk.recommendation}`
      ),
      '',
      `---`,
      `*Report created via ORBIS — GitHub Repository Intelligence Platform*`,
    ].join('\n\n');

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="modal-dialog"
        style={{
          maxWidth: '850px',
          padding: '2.5rem',
        }}
      >
        {/* Top Control Bar (Hidden during print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.75rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-medium)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--color-teal)" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-navy)' }}>
              Print & PDF Report Preview
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button onClick={handlePrint} className="btn btn-primary btn-sm">
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button onClick={handleCopySummary} className="btn btn-secondary btn-sm">
              {copied ? <Check size={15} color="var(--status-success)" /> : <Copy size={15} />}
              {copied ? 'Copied Markdown!' : 'Copy Summary'}
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              aria-label="Close report modal"
              style={{ padding: '0.4rem' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="printable-report" style={{ color: '#1F2D3D' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '1.5rem',
              borderBottom: '2px solid var(--color-navy)',
              marginBottom: '2rem',
            }}
          >
            <div>
              <OrbitalLogo size="sm" showWordmark={true} showDescriptor={true} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Official Architecture Audit Document
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Audit Timestamp</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                {new Date(analysis.assessedAt).toUTCString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Methodology: Deterministic Matrix v1.0
              </div>
            </div>
          </div>

          {/* Repo Title & Score Hero Box */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '1.5rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem 2rem',
              marginBottom: '2rem',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-teal)',
                }}
              >
                Target Repository
              </span>
              <h2 id="report-modal-title" style={{ fontSize: '1.8rem', margin: '0.25rem 0', color: 'var(--color-navy)' }}>
                {analysis.repoFullName}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {analysis.gradeDescription}
              </p>
            </div>

            {/* Score & Grade Stamp */}
            <div
              style={{
                textAlign: 'center',
                padding: '1rem 1.5rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-navy)',
              }}
            >
              <div
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--color-navy)',
                  lineHeight: 1,
                }}
              >
                {analysis.overallScore}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>OUT OF 100</div>
              <div
                style={{
                  marginTop: '0.4rem',
                  padding: '0.15rem 0.5rem',
                  backgroundColor: 'var(--color-sky-soft)',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  color: 'var(--color-navy)',
                }}
              >
                Grade {analysis.grade}
              </div>
            </div>
          </div>

          {/* Categories Table */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.85rem' }}>Category Score Breakdown</h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
                border: '1px solid var(--border-medium)',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'var(--color-sky-soft)', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-medium)' }}>Category</th>
                  <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-medium)' }}>Max Weight</th>
                  <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-medium)' }}>Earned Score</th>
                  <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-medium)' }}>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {analysis.categories.map((c, i) => (
                  <tr
                    key={c.category}
                    style={{
                      backgroundColor: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                    }}
                  >
                    <td style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                      {c.title}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      {c.maxWeight} pts
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700 }}>
                      {c.earnedScore} pts
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      {c.percentage}% ({c.passedCount}/{c.checkCount} checks)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Evidence and Action Items */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.85rem' }}>Individual Evidence & Remediation Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analysis.checks.map((chk) => (
                <div
                  key={chk.id}
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    breakInside: 'avoid',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>
                      [{chk.status.toUpperCase()}] {chk.title}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-teal)' }}>
                      {chk.earnedPoints} / {chk.weight} pts
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    <strong>Evidence:</strong> {chk.evidence}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Improvement:</strong> {chk.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Methodology notice */}
          <div
            style={{
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-medium)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            <strong>Legal & Analytical Disclaimer:</strong> ORBIS generates deterministic quality scores based solely on
            publicly exposed repository metadata, structural trees, and commit records. This assessment constitutes an
            architectural heuristic and does not represent an endorsement, formal security audit, or warranty of code safety.
          </div>
        </div>
      </div>
    </div>
  );
};
