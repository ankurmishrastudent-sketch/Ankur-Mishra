import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  Briefcase,
  CheckCircle2,
  Download,
  ExternalLink,
  Github,
  Inbox,
  Linkedin,
  Mail,
  Send,
} from 'lucide-react';
import { submitInquiry } from '../services/portfolioService';
import { FIELD_LIMITS, PortfolioData, ProjectCategory, ProjectItem } from '../types/portfolio';
import { ProjectModal } from './ProjectModal';

interface PortfolioViewProps {
  data: PortfolioData;
  onDownloadResume: () => void;
  onOpenDashboard: () => void;
  onOpenContactInbox: () => void;
}

const PROJECT_FILTERS: Array<'All' | ProjectCategory> = [
  'All',
  'Strategy',
  'Analytics',
  'Operations',
  'Finance',
];

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  data,
  onDownloadResume,
  onOpenDashboard,
  onOpenContactInbox,
}) => {
  const [projectFilter, setProjectFilter] = useState<'All' | ProjectCategory>('All');
  const [skillFilter, setSkillFilter] = useState<'All' | 'Management' | 'Technical'>('All');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [portraitError, setPortraitError] = useState(false);
  const [brokenProjectImages, setBrokenProjectImages] = useState<Record<string, boolean>>({});

  // Contact Form State
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    if (projectFilter === 'All') return data.projects;
    return data.projects.filter((p) => p.category === projectFilter);
  }, [data.projects, projectFilter]);

  const managementSkills = useMemo(
    () => data.skills.filter((s) => s.domain === 'Management'),
    [data.skills]
  );

  const technicalSkills = useMemo(
    () => data.skills.filter((s) => s.domain === 'Technical'),
    [data.skills]
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const L = FIELD_LIMITS.inquiry;
    if (senderName.trim().length < L.senderName.min) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      setSubmitError('Please provide a valid email address.');
      return;
    }
    if (subject.trim().length < L.subject.min) {
      setSubmitError('Please include a concise subject.');
      return;
    }
    if (message.trim().length < L.message.min) {
      setSubmitError('Please write a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await submitInquiry({
        senderName,
        senderEmail,
        organization,
        subject,
        message,
      });
      setSubmitSuccess(true);
      setSenderName('');
      setSenderEmail('');
      setOrganization('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to send message right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-[#F9F9F8] dark:bg-[#0B0D10] text-[#111315] dark:text-[#F3F4F6]">
      {/* Hero Split Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <p className="text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF]">
                {data.profile.degree} · {data.profile.graduationYear} · {data.profile.location}
              </p>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.35rem] font-semibold tracking-tight leading-[1.08] text-[#111315] dark:text-[#F3F4F6] [text-wrap:balance]">
                {data.profile.headline}
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-[#374151] dark:text-[#D1D5DB] max-w-2xl">
                {data.profile.bio}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onDownloadResume}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Resume PDF</span>
                </button>

                {data.profile.githubUrl && (
                  <a
                    href={data.profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] text-[#111315] dark:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1A2029] transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub Profile</span>
                  </a>
                )}

                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111315] dark:hover:text-white transition-colors"
                >
                  <span>Contact</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                {data.profile.university} · {data.profile.availability}
              </p>
            </div>
          </div>

          {/* Right Column: Matching-Height Editorial Portrait */}
          <div className="lg:col-span-5">
            <div className="h-80 sm:h-96 lg:h-full min-h-[380px] rounded-2xl overflow-hidden border border-[#E4E4E7] dark:border-[#23272F] bg-[#EFEFED] dark:bg-[#12161C]">
              {data.profile.portraitUrl && !portraitError ? (
                <img
                  src={data.profile.portraitUrl}
                  alt={`${data.profile.fullName} — BBA Management Student Portrait`}
                  referrerPolicy="no-referrer"
                  onError={() => setPortraitError(true)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#EFEFED] to-[#E4E4E7] dark:from-[#12161C] dark:to-[#1B222C]">
                  <span className="font-display text-3xl font-semibold text-[#111315] dark:text-[#F3F4F6]">
                    {data.profile.fullName}
                  </span>
                  <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-2">
                    {data.profile.degree}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Academic & Portfolio Metric Strip */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 border border-[#E4E4E7] dark:border-[#23272F] rounded-2xl bg-white dark:bg-[#12161C] divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7] dark:divide-[#23272F]">
          <div className="p-5 sm:p-6">
            <div className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              Cumulative GPA
            </div>
            <div className="mt-1.5 font-mono-tabular text-2xl font-semibold text-[#111315] dark:text-[#F3F4F6]">
              {data.profile.gpa}
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              Applied Projects
            </div>
            <div className="mt-1.5 font-mono-tabular text-2xl font-semibold text-[#111315] dark:text-[#F3F4F6]">
              {String(data.projects.length).padStart(2, '0')}
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              Academic Honors
            </div>
            <div className="mt-1.5 font-mono-tabular text-2xl font-semibold text-[#111315] dark:text-[#F3F4F6]">
              {String(data.achievements.length).padStart(2, '0')}
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              Verified Certifications
            </div>
            <div className="mt-1.5 font-mono-tabular text-2xl font-semibold text-[#111315] dark:text-[#F3F4F6]">
              {String(data.certifications.length).padStart(2, '0')}
            </div>
          </div>
        </div>
      </section>

      {/* Section 01: Selected Projects & Case Studies */}
      <section
        id="projects"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-[#E4E4E7] dark:border-[#23272F]"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] mb-2">
              01. Applied Portfolio
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111315] dark:text-[#F3F4F6]">
              Management & Technical Projects
            </h2>
          </div>

          {/* Interactive Category Filter Control */}
          <div
            role="tablist"
            aria-label="Filter projects by discipline"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C]"
          >
            {PROJECT_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={projectFilter === cat}
                onClick={() => setProjectFilter(cat)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  projectFilter === cat
                    ? 'bg-[#111315] text-white dark:bg-[#F3F4F6] dark:text-[#111315]'
                    : 'text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111315] dark:hover:text-[#F3F4F6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-12 text-center">
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              No projects match the {projectFilter} filter yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project, idx) => {
              const isHeroTile = projectFilter === 'All' && idx === 0 && filteredProjects.length >= 3;
              const imgFailed = brokenProjectImages[project.id];
              return (
                <article
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`group rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] overflow-hidden hover:border-[#1D4ED8]/60 dark:hover:border-[#60A5FA]/60 transition-colors cursor-pointer flex flex-col ${
                    isHeroTile ? 'md:col-span-2 lg:grid lg:grid-cols-12' : ''
                  }`}
                >
                  <div
                    className={`overflow-hidden bg-[#EFEFED] dark:bg-[#161B22] ${
                      isHeroTile ? 'lg:col-span-6 aspect-[4/3] lg:aspect-auto lg:h-full' : 'aspect-[4/3]'
                    }`}
                  >
                    {project.imageUrl && !imgFailed ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenProjectImages((prev) => ({ ...prev, [project.id]: true }))
                        }
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] dark:from-[#161B22] dark:to-[#1F2733]">
                        <Briefcase className="w-7 h-7 text-[#6B7280] dark:text-[#9CA3AF] mb-2" />
                        <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                          {project.category} Case Study
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`p-6 sm:p-8 flex flex-col justify-between space-y-5 ${
                      isHeroTile ? 'lg:col-span-6' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] flex flex-wrap items-center gap-2">
                        <span>{project.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.role}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{project.period}</span>
                      </div>

                      <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#111315] dark:text-[#F3F4F6] group-hover:text-[#1D4ED8] dark:group-hover:text-[#60A5FA] transition-colors">
                        {project.title}
                      </h3>

                      <p className="text-sm leading-relaxed text-[#4B5563] dark:text-[#9CA3AF] line-clamp-3">
                        {project.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#23272F] flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                          Outcome
                        </div>
                        <div className="text-sm font-semibold font-mono-tabular text-[#1D4ED8] dark:text-[#60A5FA]">
                          {project.impactMetric}
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#111315] dark:text-[#F3F4F6] whitespace-nowrap shrink-0">
                        <span>Inspect Brief</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 02: Dual Competency Matrix (Management & Technical Skills) */}
      <section
        id="skills"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-[#E4E4E7] dark:border-[#23272F]"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] mb-2">
              02. Capability Matrix
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111315] dark:text-[#F3F4F6]">
              Management & Technical Skills
            </h2>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] self-start md:self-auto">
            {(['All', 'Management', 'Technical'] as const).map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setSkillFilter(domain)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  skillFilter === domain
                    ? 'bg-[#111315] text-white dark:bg-[#F3F4F6] dark:text-[#111315]'
                    : 'text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111315] dark:hover:text-[#F3F4F6]'
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`grid grid-cols-1 ${
            skillFilter === 'All' ? 'lg:grid-cols-2' : ''
          } gap-8`}
        >
          {(skillFilter === 'All' || skillFilter === 'Management') && (
            <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-6 sm:p-8">
              <div className="flex items-baseline justify-between pb-4 mb-2 border-b border-[#E4E4E7] dark:border-[#23272F]">
                <h3 className="font-display text-xl font-semibold text-[#111315] dark:text-[#F3F4F6]">
                  Management & Strategy
                </h3>
                <span className="text-xs font-mono-tabular text-[#6B7280] dark:text-[#9CA3AF]">
                  {managementSkills.length} competencies
                </span>
              </div>

              <div className="divide-y divide-[#E4E4E7] dark:divide-[#23272F]">
                {managementSkills.map((skill) => (
                  <div key={skill.id} className="py-4 first:pt-3 last:pb-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-semibold text-[#111315] dark:text-[#F3F4F6]">
                        {skill.name}
                      </span>
                      <span className="text-xs font-mono-tabular font-medium text-[#1D4ED8] dark:text-[#60A5FA] shrink-0">
                        {skill.proficiency}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#6B7280] dark:text-[#9CA3AF]">
                      {skill.context}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(skillFilter === 'All' || skillFilter === 'Technical') && (
            <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-6 sm:p-8">
              <div className="flex items-baseline justify-between pb-4 mb-2 border-b border-[#E4E4E7] dark:border-[#23272F]">
                <h3 className="font-display text-xl font-semibold text-[#111315] dark:text-[#F3F4F6]">
                  Technical & Analytical Stack
                </h3>
                <span className="text-xs font-mono-tabular text-[#6B7280] dark:text-[#9CA3AF]">
                  {technicalSkills.length} competencies
                </span>
              </div>

              <div className="divide-y divide-[#E4E4E7] dark:divide-[#23272F]">
                {technicalSkills.map((skill) => (
                  <div key={skill.id} className="py-4 first:pt-3 last:pb-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-semibold text-[#111315] dark:text-[#F3F4F6]">
                        {skill.name}
                      </span>
                      <span className="text-xs font-mono-tabular font-medium text-[#1D4ED8] dark:text-[#60A5FA] shrink-0">
                        {skill.proficiency}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#6B7280] dark:text-[#9CA3AF]">
                      {skill.context}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 03: Experience, Academic Honors & Certifications */}
      <section
        id="experience"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-[#E4E4E7] dark:border-[#23272F]"
      >
        <div className="mb-12">
          <p className="text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] mb-2">
            03. Track Record & Credentials
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111315] dark:text-[#F3F4F6]">
            Experience, Honors & Certifications
          </h2>
        </div>

        {/* Experience List */}
        <div className="space-y-6 mb-14">
          <h3 className="text-sm font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
            Professional & Leadership Experience
          </h3>
          <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] divide-y divide-[#E4E4E7] dark:divide-[#23272F]">
            {data.experiences.map((exp) => (
              <div key={exp.id} className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4 space-y-1">
                  <div className="text-xs font-mono-tabular text-[#6B7280] dark:text-[#9CA3AF]">
                    {exp.period}
                  </div>
                  <div className="text-sm font-semibold text-[#111315] dark:text-[#F3F4F6]">
                    {exp.organization}
                  </div>
                  <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    {exp.type} · {exp.location}
                  </div>
                </div>

                <div className="md:col-span-8 space-y-3">
                  <h4 className="font-display text-xl font-semibold text-[#111315] dark:text-[#F3F4F6]">
                    {exp.role}
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed text-[#374151] dark:text-[#D1D5DB]">
                    {exp.highlights.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#1D4ED8] dark:bg-[#60A5FA] shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Achievements Grid */}
        <div className="space-y-6 mb-14">
          <h3 className="text-sm font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
            Academic Honors & Case Competitions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.achievements.map((ach) => (
              <div
                key={ach.id}
                className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] flex items-center justify-between gap-2">
                    <span>{ach.category}</span>
                    <span className="font-mono-tabular">{ach.date}</span>
                  </div>
                  <h4 className="font-display text-lg font-semibold text-[#111315] dark:text-[#F3F4F6]">
                    {ach.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-[#4B5563] dark:text-[#9CA3AF]">
                    {ach.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#23272F] flex items-center justify-between gap-3">
                  <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">
                    {ach.institution}
                  </span>
                  {ach.metric && (
                    <span className="text-xs font-mono-tabular font-semibold text-[#1D4ED8] dark:text-[#60A5FA] shrink-0">
                      {ach.metric}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Certifications Table */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#4B5563] dark:text-[#9CA3AF]">
            Verified Certifications
          </h3>
          <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E4E4E7] dark:border-[#23272F] text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                  <th className="py-3.5 px-6">Certification</th>
                  <th className="py-3.5 px-6">Issuer & Track</th>
                  <th className="py-3.5 px-6">Issued</th>
                  <th className="py-3.5 px-6">Credential ID</th>
                  <th className="py-3.5 px-6 text-right">Verify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#23272F] text-sm">
                {data.certifications.map((cert) => (
                  <tr
                    key={cert.id}
                    className="hover:bg-[#F9F9F8] dark:hover:bg-[#161B22] transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-[#111315] dark:text-[#F3F4F6]">
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" />
                        <span>{cert.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#4B5563] dark:text-[#9CA3AF]">
                      {cert.issuer} · {cert.category}
                    </td>
                    <td className="py-4 px-6 font-mono-tabular text-xs text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">
                      {cert.issueDate}
                    </td>
                    <td className="py-4 px-6 font-mono-tabular text-xs text-[#4B5563] dark:text-[#9CA3AF] whitespace-nowrap">
                      {cert.credentialId || '—'}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {cert.credentialUrl ? (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#1D4ED8] dark:text-[#60A5FA] hover:underline"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">On file</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 04: Recruiter Contact & Resume Export */}
      <section
        id="contact"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-[#E4E4E7] dark:border-[#23272F]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] mb-2">
                04. Recruiter & Collaboration Desk
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#111315] dark:text-[#F3F4F6]">
                Get in touch
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#4B5563] dark:text-[#9CA3AF]">
                Open to management trainee programs, strategy analyst internships, and collaborative analytics research.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" />
                <a
                  href={`mailto:${data.profile.contactEmail}`}
                  className="text-[#111315] dark:text-[#F3F4F6] hover:underline truncate"
                >
                  {data.profile.contactEmail}
                </a>
              </div>

              {data.profile.githubUrl && (
                <div className="flex items-center gap-3 text-sm">
                  <Github className="w-4 h-4 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" />
                  <a
                    href={data.profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#111315] dark:text-[#F3F4F6] hover:underline truncate"
                  >
                    {data.profile.githubUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              {data.profile.linkedinUrl && (
                <div className="flex items-center gap-3 text-sm">
                  <Linkedin className="w-4 h-4 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" />
                  <a
                    href={data.profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#111315] dark:text-[#F3F4F6] hover:underline truncate"
                  >
                    {data.profile.linkedinUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#23272F] space-y-2.5">
                <button
                  type="button"
                  onClick={onDownloadResume}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg bg-[#111315] text-white dark:bg-[#F3F4F6] dark:text-[#111315] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Recruiter PDF Resume</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenContactInbox}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1A2029] transition-colors cursor-pointer"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Owner: Open Contact Inbox Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleContactSubmit}
              className="rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-6 sm:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1.5"
                  >
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.inquiry.senderName.max}
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Priya Nair"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-[#F9F9F8] dark:bg-[#0B0D10] text-[#111315] dark:text-[#F3F4F6] focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    maxLength={FIELD_LIMITS.inquiry.senderEmail.max}
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="priya@company.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-[#F9F9F8] dark:bg-[#0B0D10] text-[#111315] dark:text-[#F3F4F6] focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="contact-org"
                    className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1.5"
                  >
                    Company / Organization (Optional)
                  </label>
                  <input
                    id="contact-org"
                    type="text"
                    maxLength={FIELD_LIMITS.inquiry.organization.max}
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="McKinsey & Company"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-[#F9F9F8] dark:bg-[#0B0D10] text-[#111315] dark:text-[#F3F4F6] focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1.5"
                  >
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.inquiry.subject.max}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Summer Analyst Interview Opportunity"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-[#F9F9F8] dark:bg-[#0B0D10] text-[#111315] dark:text-[#F3F4F6] focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  maxLength={FIELD_LIMITS.inquiry.message.max}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share role details, interview timeline, or project collaboration notes..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E4E4E7] dark:border-[#23272F] bg-[#F9F9F8] dark:bg-[#0B0D10] text-[#111315] dark:text-[#F3F4F6] focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA] resize-y"
                />
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-xs font-medium text-red-700 dark:text-red-300"
                >
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div
                  role="status"
                  className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Thank you — your message has been delivered to Ankur&apos;s dashboard inbox.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] disabled:opacity-60 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Sending...' : 'Send Inquiry'}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="border-t border-[#E4E4E7] dark:border-[#23272F] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <div>
            © {new Date().getFullYear()} {data.profile.fullName} · {data.profile.degree}
          </div>
          <div className="flex items-center gap-6">
            {data.profile.githubUrl && (
              <a
                href={data.profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#111315] dark:hover:text-white transition-colors"
              >
                GitHub
              </a>
            )}
            <button
              type="button"
              onClick={onDownloadResume}
              className="hover:text-[#111315] dark:hover:text-white transition-colors cursor-pointer"
            >
              Download Resume
            </button>
            <button
              type="button"
              onClick={onOpenDashboard}
              className="hover:text-[#111315] dark:hover:text-white transition-colors cursor-pointer"
            >
              Customize in Dashboard
            </button>
          </div>
        </div>
      </footer>

      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </main>
  );
};
