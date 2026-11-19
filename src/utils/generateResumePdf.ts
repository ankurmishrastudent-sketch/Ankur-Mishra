import { jsPDF } from 'jspdf';
import { PortfolioData } from '../types/portfolio';

export function downloadPortfolioResumePdf(data: PortfolioData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  let y = 48;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 44) {
      doc.addPage();
      y = 48;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(34);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(29, 78, 216);
    doc.text(title.toUpperCase(), margin, y);
    y += 5;
    doc.setDrawColor(210, 214, 220);
    doc.setLineWidth(0.75);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
    doc.setTextColor(17, 19, 21);
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(17, 19, 21);
  doc.text(data.profile.fullName, margin, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  const taglineLines = doc.splitTextToSize(data.profile.resumeTagline, contentWidth);
  doc.text(taglineLines, margin, y);
  y += taglineLines.length * 13;

  const contactParts = [
    data.profile.location,
    data.profile.contactEmail,
    data.profile.githubUrl.replace(/^https?:\/\//, ''),
    data.profile.linkedinUrl ? data.profile.linkedinUrl.replace(/^https?:\/\//, '') : '',
  ].filter(Boolean);
  doc.setFontSize(9);
  const contactLine = doc.splitTextToSize(contactParts.join('  |  '), contentWidth);
  doc.text(contactLine, margin, y);
  y += contactLine.length * 12 + 4;

  // Executive Summary
  drawSectionHeading('Executive Summary');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(31, 41, 55);
  const bioLines = doc.splitTextToSize(data.profile.bio, contentWidth);
  doc.text(bioLines, margin, y);
  y += bioLines.length * 13 + 4;

  // Education
  drawSectionHeading('Education');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 19, 21);
  doc.text(`${data.profile.degree}`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`${data.profile.graduationYear}`, pageWidth - margin, y, { align: 'right' });
  y += 13;
  doc.setTextColor(75, 85, 99);
  doc.text(`${data.profile.university}  ·  Cumulative GPA: ${data.profile.gpa}`, margin, y);
  y += 14;

  // Experience
  if (data.experiences.length > 0) {
    drawSectionHeading('Experience & Leadership');
    for (const exp of data.experiences) {
      ensureSpace(56);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 19, 21);
      doc.text(`${exp.role} — ${exp.organization}`, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(exp.period, pageWidth - margin, y, { align: 'right' });
      y += 13;

      doc.setFontSize(8.8);
      doc.text(`${exp.type}  ·  ${exp.location}`, margin, y);
      y += 13;

      doc.setFontSize(9.2);
      doc.setTextColor(31, 41, 55);
      for (const bullet of exp.highlights) {
        const lines = doc.splitTextToSize(`•  ${bullet}`, contentWidth - 10);
        ensureSpace(lines.length * 12 + 4);
        doc.text(lines, margin + 6, y);
        y += lines.length * 12.5;
      }
      y += 5;
    }
  }

  // Selected Projects
  if (data.projects.length > 0) {
    drawSectionHeading('Selected Projects & Case Studies');
    for (const proj of data.projects) {
      ensureSpace(52);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(17, 19, 21);
      doc.text(`${proj.title}`, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(proj.period, pageWidth - margin, y, { align: 'right' });
      y += 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(29, 78, 216);
      doc.text(`${proj.category}  |  ${proj.role}  |  Outcome: ${proj.impactMetric}`, margin, y);
      y += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      doc.setTextColor(31, 41, 55);
      const summaryLines = doc.splitTextToSize(proj.summary, contentWidth);
      ensureSpace(summaryLines.length * 12 + 12);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 12.5;

      if (proj.tools.length > 0) {
        doc.setFontSize(8.5);
        doc.setTextColor(75, 85, 99);
        doc.text(`Tools: ${proj.tools.join(', ')}`, margin, y);
        y += 13;
      }
      y += 3;
    }
  }

  // Skills
  if (data.skills.length > 0) {
    drawSectionHeading('Management & Technical Competencies');
    const mgmt = data.skills.filter((s) => s.domain === 'Management');
    const tech = data.skills.filter((s) => s.domain === 'Technical');

    if (mgmt.length > 0) {
      ensureSpace(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 19, 21);
      doc.text('Management & Strategy:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      const mgmtLine = doc.splitTextToSize(
        mgmt.map((s) => `${s.name} (${s.proficiency})`).join('  ·  '),
        contentWidth - 125
      );
      doc.text(mgmtLine, margin + 125, y);
      y += mgmtLine.length * 13 + 4;
    }

    if (tech.length > 0) {
      ensureSpace(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 19, 21);
      doc.text('Technical & Analytics:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      const techLine = doc.splitTextToSize(
        tech.map((s) => `${s.name} (${s.proficiency})`).join('  ·  '),
        contentWidth - 125
      );
      doc.text(techLine, margin + 125, y);
      y += techLine.length * 13 + 4;
    }
  }

  // Achievements & Certifications
  if (data.achievements.length > 0) {
    drawSectionHeading('Academic Honors & Case Competitions');
    for (const ach of data.achievements) {
      ensureSpace(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 19, 21);
      doc.text(`${ach.title}${ach.metric ? ` (${ach.metric})` : ''}`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(ach.date, pageWidth - margin, y, { align: 'right' });
      y += 12;
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      const desc = doc.splitTextToSize(`${ach.institution} — ${ach.description}`, contentWidth);
      ensureSpace(desc.length * 12);
      doc.text(desc, margin, y);
      y += desc.length * 12 + 4;
    }
  }

  if (data.certifications.length > 0) {
    drawSectionHeading('Certifications');
    for (const cert of data.certifications) {
      ensureSpace(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.2);
      doc.setTextColor(17, 19, 21);
      doc.text(`${cert.name}`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(75, 85, 99);
      doc.text(`${cert.issuer}  ·  ${cert.issueDate}${cert.credentialId ? `  ·  ID: ${cert.credentialId}` : ''}`, pageWidth - margin, y, {
        align: 'right',
      });
      y += 14;
    }
  }

  const safeName = data.profile.fullName.replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`${safeName}_BBA_Resume.pdf`);
}
