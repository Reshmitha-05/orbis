import React from 'react';
import { OrbitalLogo } from './OrbitalLogo';
import { NavTab } from './Navbar';
import { KeyRound, Shield, Heart } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onOpenSettings }) => {
  return (
    <footer
      className="no-print"
      style={{
        backgroundColor: 'var(--color-navy)',
        color: 'var(--text-inverse)',
        paddingTop: '3.5rem',
        paddingBottom: '2.5rem',
        borderTop: '1px solid var(--border-medium)',
      }}
    >
      <div className="orbis-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid rgba(200, 217, 230, 0.15)',
          }}
        >
          {/* Brand info */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <OrbitalLogo size="sm" showWordmark={true} showDescriptor={false} inverse={true} />
            </div>
            <p
              style={{
                fontFamily: "var(--font-serif, 'Playfair Display', serif)",
                fontStyle: 'italic',
                fontSize: '1.05rem',
                color: 'var(--color-icy-blue)',
                marginBottom: '0.75rem',
              }}
            >
              “See beyond the repository.”
            </p>

          </div>

          {/* Platform Navigation */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-icy-blue)',
                marginBottom: '1rem',
              }}
            >
              Platform Capabilities
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0 }}>
              <li>
                <button
                  onClick={() => onSelectTab('hero')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-inverse-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#FFF')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-inverse-muted)')}
                >
                  Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('quality')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-inverse-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#FFF')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-inverse-muted)')}
                >
                  Repository Quality
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('trends')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-inverse-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#FFF')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-inverse-muted)')}
                >
                  Quality Trends & Audit History
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('compare')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-inverse-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#FFF')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-inverse-muted)')}
                >
                  Developer Benchmarking
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('opensource')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-inverse-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#FFF')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-inverse-muted)')}
                >
                  Open-Source Discovery
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('explorer')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-inverse-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#FFF')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-inverse-muted)')}
                >
                  Profile Explorer
                </button>
              </li>
            </ul>
          </div>

          {/* Transparency & Security */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-sky)',
                marginBottom: '1rem',
              }}
            >
              BUILT FOR DEVELOPERS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.82rem', color: 'var(--text-inverse-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={14} color="var(--color-sky)" /> Transparent analysis
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeyRound size={14} color="var(--color-sky)" /> Public GitHub data
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeyRound size={14} color="var(--color-sky)" /> Privacy-conscious by design
              </div>
              <button
                onClick={onOpenSettings}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: '1px solid var(--color-teal)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.25rem 0.6rem',
                  color: 'var(--color-sky)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                Configure GitHub Access Token
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.78rem',
            color: 'var(--text-inverse-muted)',
          }}
        >
          <div>
            © {new Date().getFullYear()} ORBIS — GitHub Repository Intelligence Platform. Crafted with deterministic
            care.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          </div>
        </div>
      </div>
    </footer>
  );
};
