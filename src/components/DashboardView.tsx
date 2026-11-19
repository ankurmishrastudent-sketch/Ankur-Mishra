import React, { useEffect, useState } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Check,
  Download,
  FolderKanban,
  Inbox,
  LogIn,
  LogOut,
  Mail,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { GENERATED_IMAGES } from '../data/defaultPortfolio';
import { auth, googleProvider } from '../firebase';
import {
  ensureCloudSeeded,
  removeAchievement,
  removeCertification,
  removeExperience,
  removeInquiry,
  removeProject,
  removeSkill,
  saveProfile,
  subscribeInquiries,
  updateInquiryStatus,
  upsertAchievement,
  upsertCertification,
  upsertExperience,
  upsertProject,
  upsertSkill,
} from '../services/portfolioService';
import {
  AchievementCategory,
  AchievementItem,
  ADMIN_EMAIL,
  CertificationItem,
  ExperienceItem,
  ExperienceType,
  FIELD_LIMITS,
  InquiryItem,
  InquiryStatus,
  PortfolioData,
  PortfolioProfile,
  ProjectCategory,
  ProjectItem,
  SkillDomain,
  SkillItem,
  SkillProficiency,
} from '../types/portfolio';

export type DashboardTab =
  | 'profile'
  | 'projects'
  | 'experience'
  | 'achievements'
  | 'skills'
  | 'certifications'
  | 'inquiries';

interface DashboardViewProps {
  data: PortfolioData;
  user: User | null;
  authReady: boolean;
  cloudInitialized: boolean;
  initialTab?: DashboardTab;
  onExitDashboard: () => void;
  onDownloadResume: () => void;
}

const TAB_ITEMS: Array<{ id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'profile', label: 'Profile & Bio', icon: UserCheck },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'achievements', label: 'Achievements', icon: BookOpen },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'inquiries', label: 'Contact Inbox', icon: Inbox },
];

function formatInquiryDate(createdAt: unknown): string {
  if (!createdAt || typeof createdAt !== 'object') return 'Just now';
  const maybeTs = createdAt as { toDate?: () => Date };
  if (typeof maybeTs.toDate === 'function') {
    return maybeTs.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return 'Recent';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  user,
  authReady,
  cloudInitialized,
  initialTab = 'profile',
  onExitDashboard,
  onDownloadResume,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<'all' | InquiryStatus>('all');
  const [inquirySearch, setInquirySearch] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const isOwner = Boolean(user && user.emailVerified && user.email === ADMIN_EMAIL);

  // Auto-seed Firestore on first verified owner login if profile doesn't exist yet
  useEffect(() => {
    if (!isOwner || cloudInitialized) return;
    let active = true;
    ensureCloudSeeded(false)
      .then((seeded) => {
        if (seeded && active) {
          setStatusMessage('Cloud portfolio initialized with starter data.');
        }
      })
      .catch((err) => {
        if (active) setErrorMessage(err instanceof Error ? err.message : 'Failed to initialize cloud data.');
      });
    return () => {
      active = false;
    };
  }, [isOwner, cloudInitialized]);

  // Subscribe to private recruiter inquiries ONLY when verified owner is signed in
  useEffect(() => {
    if (!isOwner) {
      setInquiries([]);
      return;
    }
    const unsub = subscribeInquiries(setInquiries);
    return () => unsub();
  }, [isOwner]);

  const notify = (msg: string) => {
    setErrorMessage(null);
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  // --- Profile Form State ---
  const [profileForm, setProfileForm] = useState<PortfolioProfile>(data.profile);
  useEffect(() => {
    setProfileForm(data.profile);
  }, [data.profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    try {
      await saveProfile(profileForm);
      notify('Profile and resume header saved.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setBusy(false);
    }
  };

  // --- Project Editor State ---
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectCategory, setProjectCategory] = useState<ProjectCategory>('Strategy');
  const [projectRole, setProjectRole] = useState('');
  const [projectPeriod, setProjectPeriod] = useState('');
  const [projectImpact, setProjectImpact] = useState('');
  const [projectSummary, setProjectSummary] = useState('');
  const [projectToolsText, setProjectToolsText] = useState('');
  const [projectImageUrl, setProjectImageUrl] = useState('');
  const [projectRepoUrl, setProjectRepoUrl] = useState('');
  const [projectCaseUrl, setProjectCaseUrl] = useState('');
  const [projectFeatured, setProjectFeatured] = useState(false);
  const [projectOrder, setProjectOrder] = useState(1);

  const openProjectEditor = (proj?: ProjectItem) => {
    if (proj) {
      setEditingProjectId(proj.id);
      setProjectTitle(proj.title);
      setProjectCategory(proj.category);
      setProjectRole(proj.role);
      setProjectPeriod(proj.period);
      setProjectImpact(proj.impactMetric);
      setProjectSummary(proj.summary);
      setProjectToolsText(proj.tools.join(', '));
      setProjectImageUrl(proj.imageUrl);
      setProjectRepoUrl(proj.repoUrl);
      setProjectCaseUrl(proj.caseStudyUrl);
      setProjectFeatured(proj.featured);
      setProjectOrder(proj.order);
    } else {
      setEditingProjectId(null);
      setProjectTitle('');
      setProjectCategory('Strategy');
      setProjectRole('');
      setProjectPeriod('');
      setProjectImpact('');
      setProjectSummary('');
      setProjectToolsText('');
      setProjectImageUrl(GENERATED_IMAGES.supplyChain);
      setProjectRepoUrl('');
      setProjectCaseUrl('');
      setProjectFeatured(false);
      setProjectOrder(data.projects.length + 1);
    }
    setProjectFormOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    try {
      await upsertProject(editingProjectId, {
        title: projectTitle,
        category: projectCategory,
        role: projectRole,
        period: projectPeriod,
        impactMetric: projectImpact,
        summary: projectSummary,
        tools: projectToolsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        imageUrl: projectImageUrl,
        repoUrl: projectRepoUrl,
        caseStudyUrl: projectCaseUrl,
        featured: projectFeatured,
        order: Number(projectOrder) || 0,
      });
      setProjectFormOpen(false);
      notify(editingProjectId ? 'Project updated.' : 'Project added to portfolio.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setBusy(false);
    }
  };

  // --- Experience Editor State ---
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expFormOpen, setExpFormOpen] = useState(false);
  const [expRole, setExpRole] = useState('');
  const [expOrg, setExpOrg] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expPeriod, setExpPeriod] = useState('');
  const [expType, setExpType] = useState<ExperienceType>('Internship');
  const [expHighlightsText, setExpHighlightsText] = useState('');
  const [expOrder, setExpOrder] = useState(1);

  const openExpEditor = (exp?: ExperienceItem) => {
    if (exp) {
      setEditingExpId(exp.id);
      setExpRole(exp.role);
      setExpOrg(exp.organization);
      setExpLocation(exp.location);
      setExpPeriod(exp.period);
      setExpType(exp.type);
      setExpHighlightsText(exp.highlights.join('\n'));
      setExpOrder(exp.order);
    } else {
      setEditingExpId(null);
      setExpRole('');
      setExpOrg('');
      setExpLocation('');
      setExpPeriod('');
      setExpType('Internship');
      setExpHighlightsText('');
      setExpOrder(data.experiences.length + 1);
    }
    setExpFormOpen(true);
  };

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    try {
      await upsertExperience(editingExpId, {
        role: expRole,
        organization: expOrg,
        location: expLocation,
        period: expPeriod,
        type: expType,
        highlights: expHighlightsText
          .split('\n')
          .map((h) => h.trim())
          .filter(Boolean),
        order: Number(expOrder) || 0,
      });
      setExpFormOpen(false);
      notify(editingExpId ? 'Experience updated.' : 'Experience added.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save experience.');
    } finally {
      setBusy(false);
    }
  };

  // --- Achievement Editor State ---
  const [editingAchId, setEditingAchId] = useState<string | null>(null);
  const [achFormOpen, setAchFormOpen] = useState(false);
  const [achTitle, setAchTitle] = useState('');
  const [achInst, setAchInst] = useState('');
  const [achDate, setAchDate] = useState('');
  const [achCategory, setAchCategory] = useState<AchievementCategory>('Academic Honor');
  const [achMetric, setAchMetric] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achOrder, setAchOrder] = useState(1);

  const openAchEditor = (ach?: AchievementItem) => {
    if (ach) {
      setEditingAchId(ach.id);
      setAchTitle(ach.title);
      setAchInst(ach.institution);
      setAchDate(ach.date);
      setAchCategory(ach.category);
      setAchMetric(ach.metric);
      setAchDesc(ach.description);
      setAchOrder(ach.order);
    } else {
      setEditingAchId(null);
      setAchTitle('');
      setAchInst('');
      setAchDate('');
      setAchCategory('Academic Honor');
      setAchMetric('');
      setAchDesc('');
      setAchOrder(data.achievements.length + 1);
    }
    setAchFormOpen(true);
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    try {
      await upsertAchievement(editingAchId, {
        title: achTitle,
        institution: achInst,
        date: achDate,
        category: achCategory,
        metric: achMetric,
        description: achDesc,
        order: Number(achOrder) || 0,
      });
      setAchFormOpen(false);
      notify(editingAchId ? 'Achievement updated.' : 'Academic achievement added.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save achievement.');
    } finally {
      setBusy(false);
    }
  };

  // --- Skill Editor State ---
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillFormOpen, setSkillFormOpen] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillDomain, setSkillDomain] = useState<SkillDomain>('Management');
  const [skillProf, setSkillProf] = useState<SkillProficiency>('Advanced');
  const [skillContext, setSkillContext] = useState('');
  const [skillOrder, setSkillOrder] = useState(1);

  const openSkillEditor = (skill?: SkillItem) => {
    if (skill) {
      setEditingSkillId(skill.id);
      setSkillName(skill.name);
      setSkillDomain(skill.domain);
      setSkillProf(skill.proficiency);
      setSkillContext(skill.context);
      setSkillOrder(skill.order);
    } else {
      setEditingSkillId(null);
      setSkillName('');
      setSkillDomain('Management');
      setSkillProf('Advanced');
      setSkillContext('');
      setSkillOrder(data.skills.length + 1);
    }
    setSkillFormOpen(true);
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    try {
      await upsertSkill(editingSkillId, {
        name: skillName,
        domain: skillDomain,
        proficiency: skillProf,
        context: skillContext,
        order: Number(skillOrder) || 0,
      });
      setSkillFormOpen(false);
      notify(editingSkillId ? 'Skill updated.' : 'Skill added.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save skill.');
    } finally {
      setBusy(false);
    }
  };

  // --- Certification Editor State ---
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [certFormOpen, setCertFormOpen] = useState(false);
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certCredId, setCertCredId] = useState('');
  const [certCredUrl, setCertCredUrl] = useState('');
  const [certCategory, setCertCategory] = useState('');
  const [certOrder, setCertOrder] = useState(1);

  const openCertEditor = (cert?: CertificationItem) => {
    if (cert) {
      setEditingCertId(cert.id);
      setCertName(cert.name);
      setCertIssuer(cert.issuer);
      setCertDate(cert.issueDate);
      setCertCredId(cert.credentialId);
      setCertCredUrl(cert.credentialUrl);
      setCertCategory(cert.category);
      setCertOrder(cert.order);
    } else {
      setEditingCertId(null);
      setCertName('');
      setCertIssuer('');
      setCertDate('');
      setCertCredId('');
      setCertCredUrl('');
      setCertCategory('Management & Analytics');
      setCertOrder(data.certifications.length + 1);
    }
    setCertFormOpen(true);
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    try {
      await upsertCertification(editingCertId, {
        name: certName,
        issuer: certIssuer,
        issueDate: certDate,
        credentialId: certCredId,
        credentialUrl: certCredUrl,
        category: certCategory,
        order: Number(certOrder) || 0,
      });
      setCertFormOpen(false);
      notify(editingCertId ? 'Certification updated.' : 'Certification added.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save certification.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetToStarter = async () => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await ensureCloudSeeded(true);
      notify('Starter portfolio template restored to cloud.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setBusy(false);
    }
  };

  // Auth Gate Screen
  if (!authReady) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F9F9F8] dark:bg-[#0B0D10]">
        <div className="max-w-md w-full rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
              Portfolio Management Console
            </p>
            <h1 className="font-display text-2xl font-semibold text-[#111315] dark:text-[#F3F4F6]">
              Owner Sign In Required
            </h1>
            <p className="text-sm leading-relaxed text-[#4B5563] dark:text-[#9CA3AF]">
              Sign in with your verified Google account ({ADMIN_EMAIL}) to customize projects, academic honors, skills, certifications, experience, and view recruiter inquiries.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
              {authError}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSignIn}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>

            <button
              type="button"
              onClick={onExitDashboard}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1A2029] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Portfolio</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!isOwner) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F9F9F8] dark:bg-[#0B0D10]">
        <div className="max-w-md w-full rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-8 space-y-5">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h1 className="font-display text-xl font-semibold text-[#111315] dark:text-[#F3F4F6]">
              Owner Account Required
            </h1>
          </div>
          <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed">
            You are currently signed in as <span className="font-medium text-[#111315] dark:text-[#F3F4F6]">{user.email}</span>. Only the verified portfolio owner ({ADMIN_EMAIL}) has write permissions.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-[#111315] text-white dark:bg-[#F3F4F6] dark:text-[#111315] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
            <button
              type="button"
              onClick={onExitDashboard}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-[#374151] dark:text-[#D1D5DB] cursor-pointer"
            >
              <span>Back to Portfolio</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  const inputClass =
    'w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-[#F9F9F8] dark:bg-[#0B0D10] text-[#111315] dark:text-[#F3F4F6] focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA]';
  const labelClass = 'block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1.5';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F9F9F8] dark:bg-[#0B0D10] text-[#111315] dark:text-[#F3F4F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Top Dashboard Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E4E4E7] dark:border-[#23272F]">
          <div>
            <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Dashboard / {TAB_ITEMS.find((t) => t.id === activeTab)?.label}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
              Portfolio Customization Console
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onDownloadResume}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] hover:bg-[#F3F4F6] dark:hover:bg-[#1A2029] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Test Resume PDF</span>
            </button>

            <button
              type="button"
              onClick={onExitDashboard}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>View Live Site</span>
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {statusMessage && (
          <div
            role="status"
            className="mb-6 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 px-4 py-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-xs font-medium text-red-700 dark:text-red-300"
          >
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-4">
            <nav
              aria-label="Dashboard sections"
              className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0"
            >
              {TAB_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                const badgeCount =
                  item.id === 'inquiries'
                    ? inquiries.filter((inq) => inq.status === 'new').length
                    : undefined;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#111315] text-white dark:bg-[#F3F4F6] dark:text-[#111315]'
                        : 'text-[#4B5563] dark:text-[#9CA3AF] hover:bg-white dark:hover:bg-[#12161C] hover:text-[#111315] dark:hover:text-[#F3F4F6]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {badgeCount !== undefined && badgeCount > 0 && (
                      <span className="font-mono-tabular text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="hidden lg:block pt-4 border-t border-[#E4E4E7] dark:border-[#23272F] space-y-2.5">
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">
                Signed in: {user.email}
              </div>
              <button
                type="button"
                onClick={handleResetToStarter}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] hover:bg-[#F3F4F6] dark:hover:bg-[#1A2029] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Starter Template</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111315] dark:hover:text-white cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Main Editor Workspace */}
          <div className="lg:col-span-9">
            {/* TAB 1: PROFILE & RESUME HEADER */}
            {activeTab === 'profile' && (
              <form
                onSubmit={handleSaveProfile}
                className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7] dark:border-[#23272F]">
                  <div>
                    <h2 className="font-display text-xl font-semibold">Profile & Resume Header</h2>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                      Changes update your public hero section and generated PDF resume immediately.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.profile.fullName.max}
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Degree Program</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.profile.degree.max}
                      value={profileForm.degree}
                      onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>University / Business School</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.profile.university.max}
                      value={profileForm.university}
                      onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Graduation Year</label>
                      <input
                        type="text"
                        required
                        maxLength={FIELD_LIMITS.profile.graduationYear.max}
                        value={profileForm.graduationYear}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, graduationYear: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>GPA</label>
                      <input
                        type="text"
                        required
                        maxLength={FIELD_LIMITS.profile.gpa.max}
                        value={profileForm.gpa}
                        onChange={(e) => setProfileForm({ ...profileForm, gpa: e.target.value })}
                        className={`${inputClass} font-mono-tabular`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Location</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.profile.location.max}
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Public Contact Email</label>
                    <input
                      type="email"
                      required
                      maxLength={FIELD_LIMITS.profile.contactEmail.max}
                      value={profileForm.contactEmail}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, contactEmail: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>GitHub Profile URL</label>
                    <input
                      type="url"
                      maxLength={FIELD_LIMITS.profile.githubUrl.max}
                      value={profileForm.githubUrl}
                      onChange={(e) => setProfileForm({ ...profileForm, githubUrl: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>LinkedIn Profile URL</label>
                    <input
                      type="url"
                      maxLength={FIELD_LIMITS.profile.linkedinUrl.max}
                      value={profileForm.linkedinUrl}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, linkedinUrl: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Hero Display Headline</label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.profile.headline.max}
                    value={profileForm.headline}
                    onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Executive Bio</label>
                  <textarea
                    rows={4}
                    required
                    maxLength={FIELD_LIMITS.profile.bio.max}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Recruiter Availability Line</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.profile.availability.max}
                      value={profileForm.availability}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, availability: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Resume PDF Tagline</label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.profile.resumeTagline.max}
                      value={profileForm.resumeTagline}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, resumeTagline: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#23272F] flex justify-end">
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] disabled:opacity-60 cursor-pointer"
                  >
                    {busy ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold">Projects</h2>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                      Manage management case studies, operations models, and technical repos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openProjectEditor()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Project</span>
                  </button>
                </div>

                {projectFormOpen && (
                  <form
                    onSubmit={handleSaveProject}
                    className="rounded-2xl border border-[#1D4ED8]/40 bg-white dark:bg-[#12161C] p-6 space-y-4"
                  >
                    <h3 className="font-display text-lg font-semibold">
                      {editingProjectId ? 'Edit Project' : 'New Project'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Project Title</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.project.title.max}
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Category</label>
                        <select
                          value={projectCategory}
                          onChange={(e) => setProjectCategory(e.target.value as ProjectCategory)}
                          className={inputClass}
                        >
                          <option value="Strategy">Strategy</option>
                          <option value="Analytics">Analytics</option>
                          <option value="Operations">Operations</option>
                          <option value="Finance">Finance</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Your Role</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.project.role.max}
                          value={projectRole}
                          onChange={(e) => setProjectRole(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Period</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.project.period.max}
                          value={projectPeriod}
                          onChange={(e) => setProjectPeriod(e.target.value)}
                          placeholder="Jan 2026 – Apr 2026"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Quantified Impact Metric</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.project.impactMetric.max}
                          value={projectImpact}
                          onChange={(e) => setProjectImpact(e.target.value)}
                          placeholder="-18.4% carrying cost"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Display Order</label>
                        <input
                          type="number"
                          value={projectOrder}
                          onChange={(e) => setProjectOrder(Number(e.target.value))}
                          className={`${inputClass} font-mono-tabular`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Executive Summary</label>
                      <textarea
                        rows={3}
                        required
                        maxLength={FIELD_LIMITS.project.summary.max}
                        value={projectSummary}
                        onChange={(e) => setProjectSummary(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Tools & Methods (comma-separated, max 10)</label>
                        <input
                          type="text"
                          value={projectToolsText}
                          onChange={(e) => setProjectToolsText(e.target.value)}
                          placeholder="Python, SQL, Power BI"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Cover Visual Preset</label>
                        <select
                          value={projectImageUrl}
                          onChange={(e) => setProjectImageUrl(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Clean Typographic Card (No Photo)</option>
                          <option value={GENERATED_IMAGES.supplyChain}>Supply Chain Analytics Studio</option>
                          <option value={GENERATED_IMAGES.fintech}>Financial Valuation Ledger</option>
                          <option value={GENERATED_IMAGES.marketExpansion}>Corporate Strategy Boardroom</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>GitHub Repository URL</label>
                        <input
                          type="url"
                          maxLength={FIELD_LIMITS.project.repoUrl.max}
                          value={projectRepoUrl}
                          onChange={(e) => setProjectRepoUrl(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Case Study / Demo URL</label>
                        <input
                          type="url"
                          maxLength={FIELD_LIMITS.project.caseStudyUrl.max}
                          value={projectCaseUrl}
                          onChange={(e) => setProjectCaseUrl(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setProjectFormOpen(false)}
                        className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer"
                      >
                        {busy ? 'Saving...' : 'Save Project'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] divide-y divide-[#E4E4E7] dark:divide-[#23272F]">
                  {data.projects.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                      No projects added yet.
                    </div>
                  ) : (
                    data.projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                            {proj.category} · {proj.role} · <span className="font-mono-tabular">{proj.period}</span>
                          </div>
                          <div className="font-semibold text-sm text-[#111315] dark:text-[#F3F4F6] truncate">
                            {proj.title}
                          </div>
                          <div className="text-xs font-mono-tabular text-[#1D4ED8] dark:text-[#60A5FA]">
                            {proj.impactMetric}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openProjectEditor(proj)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] hover:bg-[#F3F4F6] dark:hover:bg-[#1A2029] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await removeProject(proj.id);
                              notify('Project deleted.');
                            }}
                            aria-label={`Delete ${proj.title}`}
                            className="p-2 text-xs rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: EXPERIENCE */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold">Professional Experience</h2>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                      Internships, campus leadership, consulting cells, and research fellowships.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openExpEditor()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Experience</span>
                  </button>
                </div>

                {expFormOpen && (
                  <form
                    onSubmit={handleSaveExperience}
                    className="rounded-2xl border border-[#1D4ED8]/40 bg-white dark:bg-[#12161C] p-6 space-y-4"
                  >
                    <h3 className="font-display text-lg font-semibold">
                      {editingExpId ? 'Edit Experience' : 'New Experience'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Role / Title</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.experience.role.max}
                          value={expRole}
                          onChange={(e) => setExpRole(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Organization</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.experience.organization.max}
                          value={expOrg}
                          onChange={(e) => setExpOrg(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Type</label>
                        <select
                          value={expType}
                          onChange={(e) => setExpType(e.target.value as ExperienceType)}
                          className={inputClass}
                        >
                          <option value="Internship">Internship</option>
                          <option value="Leadership">Leadership</option>
                          <option value="Consulting">Consulting</option>
                          <option value="Research">Research</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Period</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.experience.period.max}
                          value={expPeriod}
                          onChange={(e) => setExpPeriod(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Location</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.experience.location.max}
                          value={expLocation}
                          onChange={(e) => setExpLocation(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Order</label>
                        <input
                          type="number"
                          value={expOrder}
                          onChange={(e) => setExpOrder(Number(e.target.value))}
                          className={`${inputClass} font-mono-tabular`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Quantified Highlights (one bullet per line, max 8)</label>
                      <textarea
                        rows={4}
                        required
                        value={expHighlightsText}
                        onChange={(e) => setExpHighlightsText(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setExpFormOpen(false)}
                        className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer"
                      >
                        {busy ? 'Saving...' : 'Save Experience'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] divide-y divide-[#E4E4E7] dark:divide-[#23272F]">
                  {data.experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                          {exp.type} · {exp.organization} · <span className="font-mono-tabular">{exp.period}</span>
                        </div>
                        <div className="font-semibold text-sm">{exp.role}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openExpEditor(exp)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeExperience(exp.id);
                            notify('Experience deleted.');
                          }}
                          className="p-2 rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-red-600 dark:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: ACADEMIC ACHIEVEMENTS */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold">Academic Achievements</h2>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                      Dean&apos;s list honors, case competitions, scholarships, and publications.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAchEditor()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Achievement</span>
                  </button>
                </div>

                {achFormOpen && (
                  <form
                    onSubmit={handleSaveAchievement}
                    className="rounded-2xl border border-[#1D4ED8]/40 bg-white dark:bg-[#12161C] p-6 space-y-4"
                  >
                    <h3 className="font-display text-lg font-semibold">
                      {editingAchId ? 'Edit Achievement' : 'New Achievement'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Title</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.achievement.title.max}
                          value={achTitle}
                          onChange={(e) => setAchTitle(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Category</label>
                        <select
                          value={achCategory}
                          onChange={(e) => setAchCategory(e.target.value as AchievementCategory)}
                          className={inputClass}
                        >
                          <option value="Academic Honor">Academic Honor</option>
                          <option value="Case Competition">Case Competition</option>
                          <option value="Scholarship">Scholarship</option>
                          <option value="Publication">Publication</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Institution / Organizer</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.achievement.institution.max}
                          value={achInst}
                          onChange={(e) => setAchInst(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Date</label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.achievement.date.max}
                            value={achDate}
                            onChange={(e) => setAchDate(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Metric / Rank</label>
                          <input
                            type="text"
                            maxLength={FIELD_LIMITS.achievement.metric.max}
                            value={achMetric}
                            onChange={(e) => setAchMetric(e.target.value)}
                            placeholder="1st of 84 Teams"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea
                        rows={3}
                        required
                        maxLength={FIELD_LIMITS.achievement.description.max}
                        value={achDesc}
                        onChange={(e) => setAchDesc(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setAchFormOpen(false)}
                        className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white cursor-pointer"
                      >
                        {busy ? 'Saving...' : 'Save Achievement'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] divide-y divide-[#E4E4E7] dark:divide-[#23272F]">
                  {data.achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                          {ach.category} · {ach.institution} · <span className="font-mono-tabular">{ach.date}</span>
                        </div>
                        <div className="font-semibold text-sm">{ach.title}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openAchEditor(ach)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeAchievement(ach.id);
                            notify('Achievement deleted.');
                          }}
                          className="p-2 rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-red-600 dark:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SKILLS */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold">Management & Technical Skills</h2>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                      Organize strategic management frameworks and technical analytics tools.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSkillEditor()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Skill</span>
                  </button>
                </div>

                {skillFormOpen && (
                  <form
                    onSubmit={handleSaveSkill}
                    className="rounded-2xl border border-[#1D4ED8]/40 bg-white dark:bg-[#12161C] p-6 space-y-4"
                  >
                    <h3 className="font-display text-lg font-semibold">
                      {editingSkillId ? 'Edit Skill' : 'New Skill'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Skill Name</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.skill.name.max}
                          value={skillName}
                          onChange={(e) => setSkillName(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Domain</label>
                        <select
                          value={skillDomain}
                          onChange={(e) => setSkillDomain(e.target.value as SkillDomain)}
                          className={inputClass}
                        >
                          <option value="Management">Management</option>
                          <option value="Technical">Technical</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Proficiency</label>
                        <select
                          value={skillProf}
                          onChange={(e) => setSkillProf(e.target.value as SkillProficiency)}
                          className={inputClass}
                        >
                          <option value="Advanced">Advanced</option>
                          <option value="Proficient">Proficient</option>
                          <option value="Intermediate">Intermediate</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Order</label>
                        <input
                          type="number"
                          value={skillOrder}
                          onChange={(e) => setSkillOrder(Number(e.target.value))}
                          className={`${inputClass} font-mono-tabular`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Applied Context</label>
                      <input
                        type="text"
                        required
                        maxLength={FIELD_LIMITS.skill.context.max}
                        value={skillContext}
                        onChange={(e) => setSkillContext(e.target.value)}
                        placeholder="e.g., EOQ modeling, SLA governance, lean process mapping"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSkillFormOpen(false)}
                        className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white cursor-pointer"
                      >
                        {busy ? 'Saving...' : 'Save Skill'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] divide-y divide-[#E4E4E7] dark:divide-[#23272F]">
                  {data.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                          {skill.domain} · {skill.proficiency}
                        </div>
                        <div className="font-semibold text-sm">{skill.name}</div>
                        <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                          {skill.context}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openSkillEditor(skill)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeSkill(skill.id);
                            notify('Skill deleted.');
                          }}
                          className="p-2 rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-red-600 dark:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: CERTIFICATIONS */}
            {activeTab === 'certifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold">Certifications</h2>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                      Add verified management, finance, or technical credentials.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCertEditor()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Certification</span>
                  </button>
                </div>

                {certFormOpen && (
                  <form
                    onSubmit={handleSaveCert}
                    className="rounded-2xl border border-[#1D4ED8]/40 bg-white dark:bg-[#12161C] p-6 space-y-4"
                  >
                    <h3 className="font-display text-lg font-semibold">
                      {editingCertId ? 'Edit Certification' : 'New Certification'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Certification Name</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.certification.name.max}
                          value={certName}
                          onChange={(e) => setCertName(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Issuing Organization</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.certification.issuer.max}
                          value={certIssuer}
                          onChange={(e) => setCertIssuer(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Issue Date</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.certification.issueDate.max}
                          value={certDate}
                          onChange={(e) => setCertDate(e.target.value)}
                          placeholder="Mar 2026"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Category</label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.certification.category.max}
                          value={certCategory}
                          onChange={(e) => setCertCategory(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Credential ID</label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.certification.credentialId.max}
                          value={certCredId}
                          onChange={(e) => setCertCredId(e.target.value)}
                          className={`${inputClass} font-mono-tabular`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Verification URL</label>
                        <input
                          type="url"
                          maxLength={FIELD_LIMITS.certification.credentialUrl.max}
                          value={certCredUrl}
                          onChange={(e) => setCertCredUrl(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setCertFormOpen(false)}
                        className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white cursor-pointer"
                      >
                        {busy ? 'Saving...' : 'Save Certification'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] divide-y divide-[#E4E4E7] dark:divide-[#23272F]">
                  {data.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                          {cert.issuer} · {cert.category} · <span className="font-mono-tabular">{cert.issueDate}</span>
                        </div>
                        <div className="font-semibold text-sm">{cert.name}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openCertEditor(cert)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeCertification(cert.id);
                            notify('Certification deleted.');
                          }}
                          className="p-2 rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-red-600 dark:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: CONTACT INBOX DASHBOARD */}
            {activeTab === 'inquiries' && (() => {
              const newCount = inquiries.filter((i) => i.status === 'new').length;
              const reviewedCount = inquiries.filter((i) => i.status === 'reviewed').length;
              const term = inquirySearch.trim().toLowerCase();
              const filteredInquiries = inquiries.filter((inq) => {
                const matchesStatus = inquiryFilter === 'all' || inq.status === inquiryFilter;
                const matchesSearch =
                  !term ||
                  inq.senderName.toLowerCase().includes(term) ||
                  inq.senderEmail.toLowerCase().includes(term) ||
                  inq.subject.toLowerCase().includes(term) ||
                  (inq.organization || '').toLowerCase().includes(term);
                return matchesStatus && matchesSearch;
              });

              return (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold">Contact Inbox</h2>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                      Review, filter, and reply to messages submitted through your Contact form.
                    </p>
                  </div>

                  {/* 3-Column Summary Strip */}
                  <div className="grid grid-cols-3 border border-[#E4E4E7] dark:border-[#23272F] rounded-2xl bg-white dark:bg-[#12161C] divide-x divide-[#E4E4E7] dark:divide-[#23272F]">
                    <div className="p-4 sm:p-5">
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Total Messages</div>
                      <div className="mt-1 font-mono-tabular text-xl font-semibold">
                        {inquiries.length}
                      </div>
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Unread / New</div>
                      <div className="mt-1 font-mono-tabular text-xl font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
                        {newCount}
                      </div>
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Reviewed</div>
                      <div className="mt-1 font-mono-tabular text-xl font-semibold">
                        {reviewedCount}
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs & Search */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] self-start">
                      {(['all', 'new', 'reviewed', 'archived'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setInquiryFilter(status)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            inquiryFilter === status
                              ? 'bg-[#111315] text-white dark:bg-[#F3F4F6] dark:text-[#111315]'
                              : 'text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111315] dark:hover:text-[#F3F4F6]'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="search"
                        value={inquirySearch}
                        onChange={(e) => setInquirySearch(e.target.value)}
                        placeholder="Search sender or subject..."
                        aria-label="Search contact messages"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] text-[#111315] dark:text-[#F3F4F6] focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA]"
                      />
                    </div>
                  </div>

                  {filteredInquiries.length === 0 ? (
                    <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-12 text-center space-y-2">
                      <Sparkles className="w-6 h-6 mx-auto text-[#6B7280] dark:text-[#9CA3AF]" />
                      <p className="text-sm font-medium">
                        {inquiries.length === 0 ? 'No contact messages yet' : 'No matching messages'}
                      </p>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                        {inquiries.length === 0
                          ? 'Messages submitted on your public Contact form appear here in real time.'
                          : 'Try clearing your search query or switching the status filter.'}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] divide-y divide-[#E4E4E7] dark:divide-[#23272F]">
                      {filteredInquiries.map((inq) => (
                        <div key={inq.id} className="p-6 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] flex flex-wrap items-center gap-2">
                                <span
                                  className={`font-semibold uppercase tracking-wide ${
                                    inq.status === 'new'
                                      ? 'text-[#1D4ED8] dark:text-[#60A5FA]'
                                      : 'text-[#6B7280] dark:text-[#9CA3AF]'
                                  }`}
                                >
                                  {inq.status}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono-tabular">
                                  {formatInquiryDate(inq.createdAt)}
                                </span>
                              </div>
                              <div className="text-base font-semibold text-[#111315] dark:text-[#F3F4F6]">
                                {inq.subject}
                              </div>
                              <div className="text-xs text-[#4B5563] dark:text-[#9CA3AF]">
                                {inq.senderName}
                                {inq.organization ? ` · ${inq.organization}` : ''} · {inq.senderEmail}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <a
                                href={`mailto:${inq.senderEmail}?subject=${encodeURIComponent(`Re: ${inq.subject}`)}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors whitespace-nowrap shrink-0"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Reply</span>
                              </a>
                              {inq.status === 'new' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await updateInquiryStatus(inq.id, 'reviewed');
                                    notify('Marked as reviewed.');
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] hover:bg-[#F3F4F6] dark:hover:bg-[#1A2029] cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark Read</span>
                                </button>
                              )}
                              <select
                                value={inq.status}
                                onChange={async (e) => {
                                  await updateInquiryStatus(inq.id, e.target.value as InquiryStatus);
                                  notify('Inquiry status updated.');
                                }}
                                aria-label="Inquiry status"
                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-[#F9F9F8] dark:bg-[#0B0D10]"
                              >
                                <option value="new">New</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="archived">Archived</option>
                              </select>
                              <button
                                type="button"
                                onClick={async () => {
                                  await removeInquiry(inq.id);
                                  notify('Inquiry removed.');
                                }}
                                aria-label={`Delete message from ${inq.senderName}`}
                                className="p-2 rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-[#374151] dark:text-[#D1D5DB] leading-relaxed whitespace-pre-line">
                            {inq.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
