import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { DashboardTab, DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { PortfolioView } from './components/PortfolioView';
import { DEFAULT_PORTFOLIO_DATA } from './data/defaultPortfolio';
import { auth } from './firebase';
import { subscribePortfolio } from './services/portfolioService';
import { PortfolioData } from './types/portfolio';
import { downloadPortfolioResumePdf } from './utils/generateResumePdf';

const THEME_STORAGE_KEY = 'bba-portfolio-theme';

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(getInitialDarkMode);
  const [activeView, setActiveView] = useState<'portfolio' | 'dashboard'>('portfolio');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('profile');
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(DEFAULT_PORTFOLIO_DATA);
  const [cloudInitialized, setCloudInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Sync Tailwind v4 .dark class on document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [isDark]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Live Firestore Portfolio Subscription (falls back cleanly to starter data before first cloud seed)
  useEffect(() => {
    const unsub = subscribePortfolio((partial, isCloudReady) => {
      setCloudInitialized((prev) => prev || isCloudReady);
      setPortfolioData((prev) => ({
        profile: partial.profile ?? prev.profile,
        projects: partial.projects ?? prev.projects,
        experiences: partial.experiences ?? prev.experiences,
        achievements: partial.achievements ?? prev.achievements,
        skills: partial.skills ?? prev.skills,
        certifications: partial.certifications ?? prev.certifications,
      }));
    });
    return () => unsub();
  }, []);

  const handleDownloadResume = () => {
    downloadPortfolioResumePdf(portfolioData);
  };

  const openDashboardTab = (tab: DashboardTab) => {
    setDashboardTab(tab);
    setActiveView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F9F9F8] dark:bg-[#0B0D10] text-[#111315] dark:text-[#F3F4F6] transition-colors duration-150">
        <Navbar
          brandName={portfolioData.profile.fullName}
          activeView={activeView}
          onChangeView={(view) => {
            if (view === 'dashboard') {
              setDashboardTab('profile');
            }
            setActiveView(view);
          }}
          onDownloadResume={handleDownloadResume}
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
        />

        {activeView === 'portfolio' ? (
          <PortfolioView
            data={portfolioData}
            onDownloadResume={handleDownloadResume}
            onOpenDashboard={() => openDashboardTab('profile')}
            onOpenContactInbox={() => openDashboardTab('inquiries')}
          />
        ) : (
          <DashboardView
            data={portfolioData}
            user={user}
            authReady={authReady}
            cloudInitialized={cloudInitialized}
            initialTab={dashboardTab}
            onExitDashboard={() => {
              setActiveView('portfolio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDownloadResume={handleDownloadResume}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
