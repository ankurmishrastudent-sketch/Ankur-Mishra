import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Briefcase, Github, X } from 'lucide-react';
import { ProjectItem } from '../types/portfolio';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] text-[#111315] dark:text-[#F3F4F6]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-[#E4E4E7] dark:border-[#23272F] bg-white/95 dark:bg-[#12161C]/95 backdrop-blur-sm">
          <div className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-2 min-w-0 truncate">
            <span>{project.category}</span>
            <span aria-hidden="true">·</span>
            <span>{project.role}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{project.period}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111315] dark:hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {project.imageUrl && !imgError ? (
            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#E4E4E7] dark:border-[#23272F] bg-[#F3F4F6] dark:bg-[#181D25]">
              <img
                src={project.imageUrl}
                alt={project.title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] w-full rounded-xl border border-[#E4E4E7] dark:border-[#23272F] bg-gradient-to-br from-[#EFEFED] to-[#E4E4E7] dark:from-[#161B22] dark:to-[#1E2530] flex flex-col items-center justify-center p-6 text-center">
              <Briefcase className="w-8 h-8 text-[#6B7280] dark:text-[#9CA3AF] mb-2" />
              <span className="font-display text-lg font-medium text-[#374151] dark:text-[#D1D5DB]">
                {project.title}
              </span>
            </div>
          )}

          <div>
            <h2
              id="project-modal-title"
              className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#111315] dark:text-[#F3F4F6] mb-3"
            >
              {project.title}
            </h2>
            <p className="text-sm font-semibold text-[#1D4ED8] dark:text-[#60A5FA] font-mono-tabular mb-4">
              Measured Outcome: {project.impactMetric}
            </p>
            <p className="text-base leading-relaxed text-[#374151] dark:text-[#D1D5DB]">
              {project.summary}
            </p>
          </div>

          {project.tools.length > 0 && (
            <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#23272F]">
              <h3 className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                Frameworks & Technical Stack
              </h3>
              <p className="text-sm text-[#111315] dark:text-[#F3F4F6] leading-relaxed">
                {project.tools.join('  ·  ')}
              </p>
            </div>
          )}

          {(project.repoUrl || project.caseStudyUrl) && (
            <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#23272F] flex flex-wrap items-center gap-3">
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#111315] text-white dark:bg-[#F3F4F6] dark:text-[#111315] hover:opacity-90 transition-opacity"
                >
                  <Github className="w-4 h-4" />
                  <span>View Repository</span>
                </a>
              )}
              {project.caseStudyUrl && (
                <a
                  href={project.caseStudyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] dark:border-[#23272F] text-[#111315] dark:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1A2029] transition-colors"
                >
                  <span>Read Case Study</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
