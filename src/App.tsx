import React, { useState } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProfileExplorer } from './components/ProfileExplorer';
import { QualityAnalysisView } from './components/QualityAnalysisView';
import { DeveloperBenchmark } from './components/DeveloperBenchmark';
import { OpenSourceDiscovery } from './components/OpenSourceDiscovery';
import { QualityTrends } from './components/QualityTrends';
import { PrintReportModal } from './components/PrintReportModal';
import { TokenSettingsModal } from './components/TokenSettingsModal';
import { Footer } from './components/Footer';
import { QualityAnalysisResult } from './types/quality';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('hero');

  // Navigation context state
  const [targetUsername, setTargetUsername] = useState<string>('torvalds');
  const [targetOwner, setTargetOwner] = useState<string>('shadcn-ui');
  const [targetRepo, setTargetRepo] = useState<string>('ui');
  const [selectedAnalysis, setSelectedAnalysis] = useState<QualityAnalysisResult | null>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [reportModalAnalysis, setReportModalAnalysis] = useState<QualityAnalysisResult | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Workflow handlers
  const handleSearchUser = (username: string) => {
    setTargetUsername(username);
    setActiveTab('explorer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyzeRepo = (owner: string, repo: string) => {
    setSelectedAnalysis(null);
    setTargetOwner(owner);
    setTargetRepo(repo);
    setActiveTab('quality');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPrintReport = (analysis: QualityAnalysisResult) => {
    setReportModalAnalysis(analysis);
    setIsReportModalOpen(true);
  };

  const handleSelectHistoricalAnalysis = (analysis: QualityAnalysisResult) => {
    setSelectedAnalysis(analysis);
    const [owner, repo] = analysis.repoFullName.split('/');
    if (owner && repo) {
      setTargetOwner(owner);
      setTargetRepo(repo);
    }
    setActiveTab('quality');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecheckRepo = (owner: string, repo: string) => {
    setSelectedAnalysis(null);
    setTargetOwner(owner);
    setTargetRepo(repo);
    setActiveTab('quality');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Shared Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main View Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'hero' && (
          <Hero
            onSearchUser={handleSearchUser}
            onAnalyzeRepo={handleAnalyzeRepo}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'explorer' && (
          <ProfileExplorer
            initialUsername={targetUsername}
            onAnalyzeRepo={handleAnalyzeRepo}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'quality' && (
          <QualityAnalysisView
            initialOwner={targetOwner}
            initialRepo={targetRepo}
            initialAnalysis={selectedAnalysis}
            onOpenPrintReport={handleOpenPrintReport}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'compare' && (
          <DeveloperBenchmark onOpenSettings={() => setIsSettingsOpen(true)} />
        )}

        {activeTab === 'opensource' && (
          <OpenSourceDiscovery
            onAnalyzeRepo={handleAnalyzeRepo}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'trends' && (
          <QualityTrends
            onSelectAnalysis={handleSelectHistoricalAnalysis}
            onOpenPrintReport={handleOpenPrintReport}
            onRecheckRepo={handleRecheckRepo}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Modals */}
      <TokenSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <PrintReportModal
        analysis={reportModalAnalysis}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default App;
