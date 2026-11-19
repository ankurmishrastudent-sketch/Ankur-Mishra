import React, { useState } from 'react';
import { Download, Menu, Moon, Sun, X } from 'lucide-react';

interface NavbarProps {
  brandName: string;
  activeView: 'portfolio' | 'dashboard';
  onChangeView: (view: 'portfolio' | 'dashboard') => void;
  onDownloadResume: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  brandName,
  activeView,
  onChangeView,
  onDownloadResume,
  isDark,
  onToggleTheme,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigateToSection = (sectionId: string) => {
    setMobileOpen(false);
    if (activeView !== 'portfolio') {
      onChangeView('portfolio');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openDashboard = () => {
    setMobileOpen(false);
    onChangeView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E4E4E7] dark:border-[#23272F] bg-[#F9F9F8]/92 dark:bg-[#0B0D10]/92 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            onChangeView('portfolio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-lg font-semibold tracking-tight text-[#111315] dark:text-[#F3F4F6] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
        >
          {brandName}
        </button>

        {/* Zone 2: 5 Concise Single-Line Nav Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF]"
        >
          <button
            type="button"
            onClick={() => navigateToSection('projects')}
            className="hover:text-[#111315] dark:hover:text-[#F3F4F6] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('skills')}
            className="hover:text-[#111315] dark:hover:text-[#F3F4F6] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Skills
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('experience')}
            className="hover:text-[#111315] dark:hover:text-[#F3F4F6] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Experience
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('contact')}
            className="hover:text-[#111315] dark:hover:text-[#F3F4F6] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Contact
          </button>
          <button
            type="button"
            onClick={openDashboard}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer underline-offset-4 ${
              activeView === 'dashboard'
                ? 'text-[#1D4ED8] dark:text-[#60A5FA] underline font-semibold'
                : 'hover:text-[#111315] dark:hover:text-[#F3F4F6] hover:underline'
            }`}
          >
            Dashboard
          </button>
        </nav>

        {/* Zone 3: Primary Action + Theme Switch */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1A2029] transition-colors cursor-pointer shrink-0"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onDownloadResume}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Resume PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden w-11 h-11 inline-flex items-center justify-center rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] text-[#111315] dark:text-[#F3F4F6] cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E4E4E7] dark:border-[#23272F] bg-[#F9F9F8] dark:bg-[#0B0D10] px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => navigateToSection('projects')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#111315] dark:text-[#F3F4F6] rounded-lg hover:bg-[#EFEFED] dark:hover:bg-[#161B22]"
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('skills')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#111315] dark:text-[#F3F4F6] rounded-lg hover:bg-[#EFEFED] dark:hover:bg-[#161B22]"
          >
            Skills
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('experience')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#111315] dark:text-[#F3F4F6] rounded-lg hover:bg-[#EFEFED] dark:hover:bg-[#161B22]"
          >
            Experience
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('contact')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#111315] dark:text-[#F3F4F6] rounded-lg hover:bg-[#EFEFED] dark:hover:bg-[#161B22]"
          >
            Contact
          </button>
          <button
            type="button"
            onClick={openDashboard}
            className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#1D4ED8] dark:text-[#60A5FA] rounded-lg hover:bg-[#EFEFED] dark:hover:bg-[#161B22]"
          >
            Owner Dashboard
          </button>
          <div className="pt-2 border-t border-[#E4E4E7] dark:border-[#23272F]">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onDownloadResume();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF]"
            >
              <Download className="w-4 h-4" />
              <span>Download Resume PDF</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
