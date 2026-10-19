import React, { useState, useEffect } from 'react';
import { OrbitalLogo } from './OrbitalLogo';
import { getCurrentRateLimit, subscribeRateLimit } from '../services/githubApi';
import { GitHubRateLimit } from '../types/github';
import { Activity, Settings, Menu, X } from 'lucide-react';

export type NavTab = 'hero' | 'explorer' | 'quality' | 'compare' | 'opensource' | 'trends';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onOpenSettings }) => {
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit>(getCurrentRateLimit());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeRateLimit(setRateLimit);
    return () => unsub();
  }, []);

  const navItems: Array<{ id: NavTab; label: string }> = [
    { id: 'hero', label: 'Overview' },
    { id: 'quality', label: 'Quality Index' },
    { id: 'compare', label: 'Devs Benchmarking' },
    { id: 'opensource', label: 'Open-Source Discovery' },
    { id: 'explorer', label: 'Profile Explorer' },
    { id: 'trends', label: 'Trends & Reports' }
  ];

  return (
    <header
      className="no-print"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--color-navy)',
        borderBottom: '1px solid rgba(216, 225, 234, 0.18)',
        boxShadow: '0 2px 10px rgba(18, 29, 41, 0.15)',
        paddingTop: '0.65rem',
        paddingBottom: '0.65rem',
      }}
    >
      <div
        className="orbis-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo with inverse light wordmark */}
        <button
          onClick={() => onSelectTab('hero')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
          aria-label="ORBIS Home"
        >
          <OrbitalLogo size="sm" showWordmark={true} showDescriptor={true} inverse={true} />
        </button>

        {/* Desktop Navigation Links */}
        <nav
          style={{ display: 'none', alignItems: 'center', gap: '0.15rem', whiteSpace: 'nowrap' }}
          className="desktop-nav"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  background: isActive ? 'rgba(232, 242, 250, 0.18)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#D0DFEE',
                  border: isActive ? '1px solid rgba(232, 242, 250, 0.32)' : '1px solid transparent',
                  padding: '0.4rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(232, 242, 250, 0.09)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#D0DFEE';
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Rate Limit & Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Rate limit badge */}
          <button
            onClick={onOpenSettings}
            title="GitHub REST API Rate Limit — Click to configure"
            style={{
              cursor: 'pointer',
              backgroundColor: 'rgba(232, 242, 250, 0.12)',
              border: '1px solid rgba(232, 242, 250, 0.22)',
              borderRadius: 'var(--radius-full)',
              color: '#FFFFFF',
              padding: '0.3rem 0.55rem',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(232, 242, 250, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(232, 242, 250, 0.12)';
            }}
          >
            <Activity size={13} color="var(--color-teal-light)" />
            <span>
              API: <strong>{rateLimit.remaining}</strong>/{rateLimit.limit}
            </span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            aria-label="Configure GitHub API Token"
            style={{
              background: 'rgba(232, 242, 250, 0.1)',
              border: '1px solid rgba(232, 242, 250, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem',
              cursor: 'pointer',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(232, 242, 250, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(232, 242, 250, 0.1)';
            }}
          >
            <Settings size={18} />
          </button>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-nav-toggle"
            aria-label="Toggle navigation menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#FFFFFF',
              padding: '0.4rem',
            }}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--color-navy-dark)',
            borderTop: '1px solid rgba(216, 225, 234, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          className="mobile-nav-menu"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  background: isActive ? 'var(--color-teal)' : 'transparent',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  fontSize: '0.92rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Responsive media query styling */}
      <style>{`
        @media (min-width: 990px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-nav-toggle {
            display: none !important;
          }
          .mobile-nav-menu {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

