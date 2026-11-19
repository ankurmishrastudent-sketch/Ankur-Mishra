import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { DEFAULT_PORTFOLIO_DATA } from '../data/defaultPortfolio';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AchievementItem,
  ExperienceItem,
  FIELD_LIMITS,
  InquiryItem,
  InquiryStatus,
  PortfolioData,
  PortfolioProfile,
  ProjectItem,
  SkillItem,
  CertificationItem,
} from '../types/portfolio';

function clampString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

export function generateSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '');
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${cleanPrefix}-${stamp}-${rand}`.slice(0, FIELD_LIMITS.idMax);
}

export function sanitizeProfile(profile: PortfolioProfile) {
  const L = FIELD_LIMITS.profile;
  return {
    fullName: clampString(profile.fullName, L.fullName.max),
    degree: clampString(profile.degree, L.degree.max),
    university: clampString(profile.university, L.university.max),
    graduationYear: clampString(profile.graduationYear, L.graduationYear.max),
    gpa: clampString(profile.gpa, L.gpa.max),
    location: clampString(profile.location, L.location.max),
    headline: clampString(profile.headline, L.headline.max),
    bio: clampString(profile.bio, L.bio.max),
    githubUrl: clampString(profile.githubUrl, L.githubUrl.max),
    linkedinUrl: clampString(profile.linkedinUrl, L.linkedinUrl.max),
    contactEmail: clampString(profile.contactEmail, L.contactEmail.max),
    availability: clampString(profile.availability, L.availability.max),
    portraitUrl: clampString(profile.portraitUrl, L.portraitUrl.max),
    resumeTagline: clampString(profile.resumeTagline, L.resumeTagline.max),
  };
}

export function sanitizeProject(project: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const L = FIELD_LIMITS.project;
  return {
    title: clampString(project.title, L.title.max),
    category: project.category,
    summary: clampString(project.summary, L.summary.max),
    impactMetric: clampString(project.impactMetric, L.impactMetric.max),
    role: clampString(project.role, L.role.max),
    period: clampString(project.period, L.period.max),
    tools: project.tools
      .map((t) => clampString(t, L.toolMaxLength))
      .filter(Boolean)
      .slice(0, L.toolsMaxCount),
    imageUrl: clampString(project.imageUrl, L.imageUrl.max),
    repoUrl: clampString(project.repoUrl, L.repoUrl.max),
    caseStudyUrl: clampString(project.caseStudyUrl, L.caseStudyUrl.max),
    featured: Boolean(project.featured),
    order: Number.isFinite(project.order) ? project.order : 0,
  };
}

export function sanitizeExperience(exp: Omit<ExperienceItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const L = FIELD_LIMITS.experience;
  return {
    role: clampString(exp.role, L.role.max),
    organization: clampString(exp.organization, L.organization.max),
    location: clampString(exp.location, L.location.max),
    period: clampString(exp.period, L.period.max),
    type: exp.type,
    highlights: exp.highlights
      .map((h) => clampString(h, L.highlightMaxLength))
      .filter(Boolean)
      .slice(0, L.highlightsMaxCount),
    order: Number.isFinite(exp.order) ? exp.order : 0,
  };
}

export function sanitizeAchievement(ach: Omit<AchievementItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const L = FIELD_LIMITS.achievement;
  return {
    title: clampString(ach.title, L.title.max),
    institution: clampString(ach.institution, L.institution.max),
    date: clampString(ach.date, L.date.max),
    category: ach.category,
    description: clampString(ach.description, L.description.max),
    metric: clampString(ach.metric, L.metric.max),
    order: Number.isFinite(ach.order) ? ach.order : 0,
  };
}

export function sanitizeSkill(skill: Omit<SkillItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const L = FIELD_LIMITS.skill;
  return {
    name: clampString(skill.name, L.name.max),
    domain: skill.domain,
    proficiency: skill.proficiency,
    context: clampString(skill.context, L.context.max),
    order: Number.isFinite(skill.order) ? skill.order : 0,
  };
}

export function sanitizeCertification(cert: Omit<CertificationItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const L = FIELD_LIMITS.certification;
  return {
    name: clampString(cert.name, L.name.max),
    issuer: clampString(cert.issuer, L.issuer.max),
    issueDate: clampString(cert.issueDate, L.issueDate.max),
    credentialId: clampString(cert.credentialId, L.credentialId.max),
    credentialUrl: clampString(cert.credentialUrl, L.credentialUrl.max),
    category: clampString(cert.category, L.category.max),
    order: Number.isFinite(cert.order) ? cert.order : 0,
  };
}

export function subscribePortfolio(
  onUpdate: (partial: Partial<PortfolioData>, cloudInitialized: boolean) => void
): Unsubscribe {
  let profileDocExists = false;

  const unsubProfile = onSnapshot(
    doc(db, 'portfolio', 'main'),
    (snap) => {
      profileDocExists = snap.exists();
      if (snap.exists()) {
        onUpdate({ profile: snap.data() as PortfolioProfile }, true);
      } else {
        onUpdate({}, false);
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, 'portfolio/main')
  );

  const unsubProjects = onSnapshot(
    query(collection(db, 'projects'), orderBy('order', 'asc')),
    (snap) => {
      if (!snap.empty || profileDocExists) {
        const projects = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProjectItem, 'id'>) }));
        onUpdate({ projects }, profileDocExists);
      }
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'projects')
  );

  const unsubExperiences = onSnapshot(
    query(collection(db, 'experiences'), orderBy('order', 'asc')),
    (snap) => {
      if (!snap.empty || profileDocExists) {
        const experiences = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ExperienceItem, 'id'>) }));
        onUpdate({ experiences }, profileDocExists);
      }
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'experiences')
  );

  const unsubAchievements = onSnapshot(
    query(collection(db, 'achievements'), orderBy('order', 'asc')),
    (snap) => {
      if (!snap.empty || profileDocExists) {
        const achievements = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AchievementItem, 'id'>) }));
        onUpdate({ achievements }, profileDocExists);
      }
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'achievements')
  );

  const unsubSkills = onSnapshot(
    query(collection(db, 'skills'), orderBy('order', 'asc')),
    (snap) => {
      if (!snap.empty || profileDocExists) {
        const skills = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SkillItem, 'id'>) }));
        onUpdate({ skills }, profileDocExists);
      }
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'skills')
  );

  const unsubCertifications = onSnapshot(
    query(collection(db, 'certifications'), orderBy('order', 'asc')),
    (snap) => {
      if (!snap.empty || profileDocExists) {
        const certifications = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CertificationItem, 'id'>) }));
        onUpdate({ certifications }, profileDocExists);
      }
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'certifications')
  );

  return () => {
    unsubProfile();
    unsubProjects();
    unsubExperiences();
    unsubAchievements();
    unsubSkills();
    unsubCertifications();
  };
}

export function subscribeInquiries(onUpdate: (inquiries: InquiryItem[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InquiryItem, 'id'>) }));
      onUpdate(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'inquiries')
  );
}

export async function ensureCloudSeeded(forceReset = false): Promise<boolean> {
  const profileRef = doc(db, 'portfolio', 'main');
  try {
    const existing = await getDoc(profileRef);
    if (existing.exists() && !forceReset) {
      return false;
    }

    const batch = writeBatch(db);
    batch.set(profileRef, {
      ...sanitizeProfile(DEFAULT_PORTFOLIO_DATA.profile),
      updatedAt: serverTimestamp(),
    });

    for (const proj of DEFAULT_PORTFOLIO_DATA.projects) {
      batch.set(doc(db, 'projects', proj.id), {
        ...sanitizeProject(proj),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const exp of DEFAULT_PORTFOLIO_DATA.experiences) {
      batch.set(doc(db, 'experiences', exp.id), {
        ...sanitizeExperience(exp),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const ach of DEFAULT_PORTFOLIO_DATA.achievements) {
      batch.set(doc(db, 'achievements', ach.id), {
        ...sanitizeAchievement(ach),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const skill of DEFAULT_PORTFOLIO_DATA.skills) {
      batch.set(doc(db, 'skills', skill.id), {
        ...sanitizeSkill(skill),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const cert of DEFAULT_PORTFOLIO_DATA.certifications) {
      batch.set(doc(db, 'certifications', cert.id), {
        ...sanitizeCertification(cert),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'portfolio/main');
  }
}

export async function saveProfile(profile: PortfolioProfile): Promise<void> {
  const ref = doc(db, 'portfolio', 'main');
  try {
    const existing = await getDoc(ref);
    const payload = {
      ...sanitizeProfile(profile),
      updatedAt: serverTimestamp(),
    };
    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'portfolio/main');
  }
}

export async function upsertProject(
  id: string | null,
  data: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const docId = id || generateSafeId('proj');
  const path = `projects/${docId}`;
  try {
    const sanitized = sanitizeProject(data);
    if (id) {
      const ref = doc(db, 'projects', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { ...sanitized, updatedAt: serverTimestamp() });
        return;
      }
    }
    await setDoc(doc(db, 'projects', docId), {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeProject(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
  }
}

export async function upsertExperience(
  id: string | null,
  data: Omit<ExperienceItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const docId = id || generateSafeId('exp');
  const path = `experiences/${docId}`;
  try {
    const sanitized = sanitizeExperience(data);
    if (id) {
      const ref = doc(db, 'experiences', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { ...sanitized, updatedAt: serverTimestamp() });
        return;
      }
    }
    await setDoc(doc(db, 'experiences', docId), {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeExperience(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'experiences', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `experiences/${id}`);
  }
}

export async function upsertAchievement(
  id: string | null,
  data: Omit<AchievementItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const docId = id || generateSafeId('ach');
  const path = `achievements/${docId}`;
  try {
    const sanitized = sanitizeAchievement(data);
    if (id) {
      const ref = doc(db, 'achievements', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { ...sanitized, updatedAt: serverTimestamp() });
        return;
      }
    }
    await setDoc(doc(db, 'achievements', docId), {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeAchievement(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'achievements', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `achievements/${id}`);
  }
}

export async function upsertSkill(
  id: string | null,
  data: Omit<SkillItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const docId = id || generateSafeId('skill');
  const path = `skills/${docId}`;
  try {
    const sanitized = sanitizeSkill(data);
    if (id) {
      const ref = doc(db, 'skills', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { ...sanitized, updatedAt: serverTimestamp() });
        return;
      }
    }
    await setDoc(doc(db, 'skills', docId), {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeSkill(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'skills', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `skills/${id}`);
  }
}

export async function upsertCertification(
  id: string | null,
  data: Omit<CertificationItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const docId = id || generateSafeId('cert');
  const path = `certifications/${docId}`;
  try {
    const sanitized = sanitizeCertification(data);
    if (id) {
      const ref = doc(db, 'certifications', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { ...sanitized, updatedAt: serverTimestamp() });
        return;
      }
    }
    await setDoc(doc(db, 'certifications', docId), {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeCertification(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'certifications', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `certifications/${id}`);
  }
}

export async function submitInquiry(payload: {
  senderName: string;
  senderEmail: string;
  organization: string;
  subject: string;
  message: string;
}): Promise<void> {
  const L = FIELD_LIMITS.inquiry;
  const docId = generateSafeId('inq');
  const path = `inquiries/${docId}`;
  try {
    await setDoc(doc(db, 'inquiries', docId), {
      senderName: clampString(payload.senderName, L.senderName.max),
      senderEmail: clampString(payload.senderEmail, L.senderEmail.max),
      organization: clampString(payload.organization, L.organization.max),
      subject: clampString(payload.subject, L.subject.max),
      message: clampString(payload.message, L.message.max),
      status: 'new',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'inquiries', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `inquiries/${id}`);
  }
}

export async function removeInquiry(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'inquiries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `inquiries/${id}`);
  }
}
