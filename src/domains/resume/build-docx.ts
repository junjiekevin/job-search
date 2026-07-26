import { Document, Packer, Paragraph, TextRun, AlignmentType, convertInchesToTwip } from 'docx'

import type { ResumeContent, ExperienceEntry, SkillGroup, EducationEntry, CertificationEntry, ProjectEntry } from '@/domains/analysis/types'

const FONT = 'Calibri'
const PAGE_WIDTH = convertInchesToTwip(8.5)
const PAGE_HEIGHT = convertInchesToTwip(11)
const MARGIN = convertInchesToTwip(0.7)
const NAME_STYLE = 'ResumeName'
const CONTACT_STYLE = 'ResumeContact'
const SECTION_STYLE = 'ResumeSection'
const BODY_STYLE = 'ResumeBody'
const BULLET_STYLE = 'ResumeBullet'

function maxLen(s: string | null | undefined, n: number): string | null {
  if (!s) return null
  return s.length <= n ? s : s.slice(0, n) + '…'
}

function capBullets(bullets: string[], max: number): string[] {
  return bullets.slice(0, max).map(b => maxLen(b, 300) ?? b)
}

function heading(text: string): Paragraph {
  return new Paragraph({
    style: SECTION_STYLE,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: '333333' })],
  })
}

function bodyLine(text: string | null | undefined, opts?: { center?: boolean; style?: string }): Paragraph | null {
  if (!text) return null
  return new Paragraph({
    style: opts?.style ?? BODY_STYLE,
    alignment: opts?.center ? AlignmentType.CENTER : undefined,
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text, font: FONT, size: 20 })],
  })
}

function bulletLine(text: string): Paragraph {
  return new Paragraph({
    style: BULLET_STYLE,
    spacing: { before: 0, after: 40 },
    bullet: { level: 0 },
    children: [new TextRun({ text, font: FONT, size: 20 })],
  })
}

function indentBlock(): Paragraph {
  return new Paragraph({
    style: BODY_STYLE,
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: '', font: FONT, size: 20 })],
  })
}

function roleHeading(role: string, company: string, location: string | null | undefined, startDate: string | null | undefined, endDate: string | null | undefined): Paragraph {
  const parts: TextRun[] = [new TextRun({ text: role, font: FONT, size: 21, bold: true })]
  if (company) {
    parts.push(new TextRun({ text: `, ${company}`, font: FONT, size: 21 }))
  }
  const dateStr = [startDate, endDate].filter(Boolean).join(' – ') || null
  return new Paragraph({
    style: BODY_STYLE,
    spacing: { before: 120, after: 40 },
    children: [
      ...parts,
      ...(location || dateStr
        ? [new TextRun({ text: '', font: FONT, size: 21, break: 1 }),
           new TextRun({ text: [location, dateStr].filter(Boolean).join(' | '), font: FONT, size: 19, color: '555555' })]
        : []),
    ],
  })
}

function renderSkills(skills: SkillGroup[] | null | undefined): Paragraph[] {
  if (!skills?.length) return []
  const lines: string[] = skills.map(g => `${g.category}: ${g.items.join(', ')}`)
  return lines.map(l => bodyLine(l)).filter((p): p is Paragraph => p !== null)
}

function renderExperience(experience: ExperienceEntry[] | null | undefined): Paragraph[] {
  if (!experience?.length) return []
  const result: Paragraph[] = []
  for (const entry of experience) {
    result.push(roleHeading(entry.role, entry.company, entry.location, entry.startDate, entry.endDate))
    for (const b of capBullets(entry.bullets, 5)) {
      result.push(bulletLine(b))
    }
  }
  return result
}

function renderEducation(education: EducationEntry[] | null | undefined): Paragraph[] {
  if (!education?.length) return []
  const result: Paragraph[] = []
  for (const entry of education) {
    const line = [entry.degree, entry.institution].filter(Boolean).join(', ')
    const date = entry.graduationDate || ''
    result.push(new Paragraph({
      style: BODY_STYLE,
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({ text: line, font: FONT, size: 20 }),
        ...(date ? [new TextRun({ text: ` (${date})`, font: FONT, size: 19, color: '555555' })] : []),
      ],
    }))
  }
  return result
}

function renderCertifications(certifications: CertificationEntry[] | null | undefined): Paragraph[] {
  if (!certifications?.length) return []
  const result: Paragraph[] = []
  for (const entry of certifications) {
    const line = [entry.name, entry.issuer].filter(Boolean).join(' — ')
    const date = entry.date || ''
    result.push(new Paragraph({
      style: BODY_STYLE,
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({ text: line, font: FONT, size: 20 }),
        ...(date ? [new TextRun({ text: ` (${date})`, font: FONT, size: 19, color: '555555' })] : []),
      ],
    }))
  }
  return result
}

function renderProjects(projects: ProjectEntry[] | null | undefined): Paragraph[] {
  if (!projects?.length) return []
  const result: Paragraph[] = []
  for (const entry of projects) {
    result.push(new Paragraph({
      style: BODY_STYLE,
      spacing: { before: 80, after: 40 },
      children: [
        new TextRun({ text: entry.name, font: FONT, size: 21, bold: true }),
        ...(entry.description ? [new TextRun({ text: ` — ${entry.description}`, font: FONT, size: 20 })] : []),
      ],
    }))
    if (entry.technologies?.length) {
      result.push(new Paragraph({
        style: BODY_STYLE,
        spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: `Technologies: ${entry.technologies.join(', ')}`, font: FONT, size: 19, italics: true, color: '555555' })],
      }))
    }
  }
  return result
}

export async function buildDocx(content: ResumeContent): Promise<Buffer> {
  const children: Paragraph[] = []

  children.push(new Paragraph({
    style: NAME_STYLE,
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 40 },
    children: [new TextRun({ text: content.name, font: FONT, size: 40, bold: true })],
  }))

  const contactLine = bodyLine(content.contact, { center: true, style: CONTACT_STYLE })
  if (contactLine) {
    children.push(contactLine)
    children.push(indentBlock())
  }

  if (content.summary) {
    children.push(heading('Summary'))
    const summaryLine = bodyLine(maxLen(content.summary, 600))
    if (summaryLine) children.push(summaryLine)
  }

  if (content.skills?.length) {
    children.push(heading('Skills'))
    children.push(...renderSkills(content.skills))
  }

  if (content.experience?.length) {
    children.push(heading('Experience'))
    children.push(...renderExperience(content.experience))
  }

  if (content.projects?.length) {
    children.push(heading('Projects'))
    children.push(...renderProjects(content.projects))
  }

  if (content.education?.length) {
    children.push(heading('Education'))
    children.push(...renderEducation(content.education))
  }

  if (content.certifications?.length) {
    children.push(heading('Certifications'))
    children.push(...renderCertifications(content.certifications))
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        { id: SECTION_STYLE, name: SECTION_STYLE, paragraph: { spacing: { before: 200, after: 80 } }, run: { size: 22, bold: true, font: FONT, color: '333333' } },
        { id: NAME_STYLE, name: NAME_STYLE, paragraph: { spacing: { before: 0, after: 40 }, alignment: AlignmentType.CENTER }, run: { size: 40, bold: true, font: FONT } },
        { id: CONTACT_STYLE, name: CONTACT_STYLE, paragraph: { spacing: { before: 0, after: 60 }, alignment: AlignmentType.CENTER }, run: { size: 20, font: FONT } },
        { id: BODY_STYLE, name: BODY_STYLE, paragraph: { spacing: { before: 0, after: 60 } }, run: { size: 20, font: FONT } },
        { id: BULLET_STYLE, name: BULLET_STYLE, paragraph: { spacing: { before: 0, after: 40 }, indent: { left: 360, hanging: 180 } }, run: { size: 20, font: FONT } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      children,
    }],
  })

  return Packer.toBuffer(doc)
}
