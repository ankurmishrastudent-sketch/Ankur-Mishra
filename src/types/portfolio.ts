export type ProjectCategory = 'Strategy' | 'Analytics' | 'Operations' | 'Finance';
export type ExperienceType = 'Internship' | 'Leadership' | 'Consulting' | 'Research';
export type AchievementCategory = 'Academic Honor' | 'Case Competition' | 'Scholarship' | 'Publication';
export type SkillDomain = 'Management' | 'Technical';
export type SkillProficiency = 'Advanced' | 'Proficient' | 'Intermediate';
export type InquiryStatus = 'new' | 'reviewed' | 'archived';

export const ADMIN_EMAIL = 'ankurmishrastudent@gmail.com';

// Verbatim boundaries synchronized with firebase-blueprint.json & firestore.rules
export const FIELD_LIMITS = {
  idMax: 128,
  profile: {
    fullName: { min: 2, max: 100 },
    degree: { min: 2, max: 120 },
    university: { min: 2, max: 140 },
    graduationYear: { min: 4, max: 20 },
    gpa: { min: 1, max: 30 },
    location: { min: 2, max: 100 },
    headline: { min: 5, max: 180 },
    bio: { min: 10, max: 1500 },
    githubUrl: { min: 0, max: 300 },
    linkedinUrl: { min: 0, max: 300 },
    contactEmail: { min: 5, max: 150 },
    availability: { min: 2, max: 120 },
    portraitUrl: { min: 0, max: 500 },
    resumeTagline: { min: 2, max: 200 },
  },
  project: {
    title: { min: 2, max: 120 },
    summary: { min: 10, max: 1200 },
    impactMetric: { min: 2, max: 120 },
    role: { min: 2, max: 100 },
    period: { min: 2, max: 60 },
    toolsMaxCount: 10,
    toolMaxLength: 60,
    imageUrl: { min: 0, max: 500 },
    repoUrl: { min: 0, max: 300 },
    caseStudyUrl: { min: 0, max: 300 },
  },
  experience: {
    role: { min: 2, max: 120 },
    organization: { min: 2, max: 140 },
    location: { min: 2, max: 100 },
    period: { min: 2, max: 60 },
    highlightsMaxCount: 8,
    highlightMaxLength: 350,
  },
  achievement: {
    title: { min: 2, max: 140 },
    institution: { min: 2, max: 140 },
    date: { min: 2, max: 40 },
    description: { min: 5, max: 800 },
    metric: { min: 0, max: 80 },
  },
  skill: {
    name: { min: 1, max: 80 },
    context: { min: 2, max: 200 },
  },
  certification: {
    name: { min: 2, max: 140 },
    issuer: { min: 2, max: 120 },
    issueDate: { min: 2, max: 40 },
    credentialId: { min: 0, max: 80 },
    credentialUrl: { min: 0, max: 300 },
    category: { min: 2, max: 60 },
  },
  inquiry: {
    senderName: { min: 2, max: 100 },
    senderEmail: { min: 5, max: 150 },
    organization: { min: 0, max: 120 },
    subject: { min: 2, max: 150 },
    message: { min: 10, max: 2000 },
  },
} as const;

export interface PortfolioProfile {
  fullName: string;
  degree: string;
  university: string;
  graduationYear: string;
  gpa: string;
  location: string;
  headline: string;
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
  contactEmail: string;
  availability: string;
  portraitUrl: string;
  resumeTagline: string;
  updatedAt?: unknown;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: ProjectCategory;
  summary: string;
  impactMetric: string;
  role: string;
  period: string;
  tools: string[];
  imageUrl: string;
  repoUrl: string;
  caseStudyUrl: string;
  featured: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  location: string;
  period: string;
  type: ExperienceType;
  highlights: string[];
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AchievementItem {
  id: string;
  title: string;
  institution: string;
  date: string;
  category: AchievementCategory;
  description: string;
  metric: string;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SkillItem {
  id: string;
  name: string;
  domain: SkillDomain;
  proficiency: SkillProficiency;
  context: string;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  credentialId: string;
  credentialUrl: string;
  category: string;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface InquiryItem {
  id: string;
  senderName: string;
  senderEmail: string;
  organization: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  createdAt?: unknown;
}

export interface PortfolioData {
  profile: PortfolioProfile;
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  achievements: AchievementItem[];
  skills: SkillItem[];
  certifications: CertificationItem[];
}
