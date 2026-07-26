import { describe, expect, it } from 'vitest'
import { buildDocx } from './build-docx'
import type { ResumeContent } from '@/domains/analysis/types'

const sampleResume: ResumeContent = {
  name: 'Jane Smith',
  contact: 'jane@example.com | (555) 123-4567 | linkedin.com/in/janesmith',
  summary: 'Experienced software engineer with 8+ years building scalable web applications. Proficient in TypeScript, React, and Node.js.',
  skills: [
    { category: 'Languages', items: ['TypeScript', 'Python', 'Go'] },
    { category: 'Frameworks', items: ['React', 'Next.js', 'Express'] },
  ],
  experience: [
    {
      role: 'Senior Software Engineer',
      company: 'Acme Corp',
      location: 'New York, NY',
      startDate: '2020-01',
      endDate: 'Present',
      bullets: [
        'Led migration from monolith to microservices, reducing deployment time by 60%',
        'Mentored 4 junior engineers through structured code review program',
        'Designed and implemented real-time analytics dashboard serving 10k+ daily users',
        'Reduced API latency 35% by rewriting hot-path queries and adding targeted indexes',
        'Established CI/CD pipeline with automated testing, cutting release cycle from weeks to days',
      ],
    },
    {
      role: 'Software Engineer',
      company: 'TechStart Inc',
      location: 'San Francisco, CA',
      startDate: '2017-03',
      endDate: '2019-12',
      bullets: [
        'Built RESTful API layer handling 1M+ requests/day with 99.9% uptime',
        'Implemented GraphQL gateway unifying 3 legacy services',
      ],
    },
  ],
  education: [
    { degree: 'B.S. Computer Science', institution: 'MIT', graduationDate: '2014' },
  ],
}

async function getXml(filename: string): Promise<string | null> {
  const buf = await buildDocx(sampleResume)
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(buf)
  const file = zip.file(filename)
  return file ? file.async('text') : null
}

async function requireXml(filename: string, content: ResumeContent = sampleResume): Promise<string> {
  const buf = await buildDocx(content)
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(buf)
  const file = zip.file(filename)

  expect(file).toBeTruthy()
  if (!file) throw new Error(`Missing ${filename} in generated DOCX`)

  return file.async('text')
}

describe('buildDocx', () => {
  it('produces a non-empty DOCX buffer', async () => {
    const buf = await buildDocx(sampleResume)
    expect(buf.length).toBeGreaterThan(1000)
  })

  it('renders candidate name in document.xml', async () => {
    const xml = await getXml('word/document.xml')
    expect(xml).toContain('Jane Smith')
  })

  it('includes summary section heading', async () => {
    const xml = await getXml('word/document.xml')
    expect(xml).toContain('Summary')
  })

  it('includes skills with category labels', async () => {
    const xml = await getXml('word/document.xml')
    expect(xml).toContain('Languages')
    expect(xml).toContain('Frameworks')
  })

  it('includes company names from experience', async () => {
    const xml = await getXml('word/document.xml')
    expect(xml).toContain('Acme Corp')
    expect(xml).toContain('TechStart Inc')
  })

  it('includes education entries', async () => {
    const xml = await getXml('word/document.xml')
    expect(xml).toContain('MIT')
    expect(xml).toContain('B.S. Computer Science')
  })

  it('uses Word bullet numbering for experience bullets', async () => {
    const xml = await getXml('word/document.xml')
    expect(xml).toContain('w:numPr')
    expect(xml).toContain('w:ilvl')
    expect(xml).toContain('w:numId')
  })

  it('sets US Letter page size (12240 x 15840 twips)', async () => {
    const xml = await getXml('word/document.xml')
    expect(xml).toContain('w:pgSz')
    expect(xml).toContain('w:w="12240"')
    expect(xml).toContain('w:h="15840"')
  })

  it('sets 0.7in margins (1008 twips)', async () => {
    const xml = await getXml('word/document.xml')
    expect(xml).toContain('w:top="1008"')
    expect(xml).toContain('w:right="1008"')
    expect(xml).toContain('w:bottom="1008"')
    expect(xml).toContain('w:left="1008"')
  })

  it('contains no tables, drawings, textboxes, or images', async () => {
    const xml = await getXml('word/document.xml')
    expect(xml).not.toContain('w:tbl')
    expect(xml).not.toContain('w:drawing')
    expect(xml).not.toContain('w:textbox')
    expect(xml).not.toContain('a:blip')
  })

  it('defines stable paragraph style names in styles.xml', async () => {
    const xml = await requireXml('word/styles.xml')
    expect(xml).toContain('w:styleId="ResumeName"')
    expect(xml).toContain('w:styleId="ResumeContact"')
    expect(xml).toContain('w:styleId="ResumeSection"')
    expect(xml).toContain('w:styleId="ResumeBody"')
    expect(xml).toContain('w:styleId="ResumeBullet"')
  })

  it('applies named paragraph styles in document.xml', async () => {
    const xml = await requireXml('word/document.xml')
    expect(xml).toContain('w:pStyle w:val="ResumeName"')
    expect(xml).toContain('w:pStyle w:val="ResumeContact"')
    expect(xml).toContain('w:pStyle w:val="ResumeSection"')
    expect(xml).toContain('w:pStyle w:val="ResumeBody"')
    expect(xml).toContain('w:pStyle w:val="ResumeBullet"')
  })

  it('caps experience bullets at 5 per role', async () => {
    const manyBullets: ResumeContent = {
      ...sampleResume,
      experience: [
        {
          ...sampleResume.experience![0],
          bullets: ['Bullet 1', 'Bullet 2', 'Bullet 3', 'Bullet 4', 'Bullet 5', 'Bullet 6', 'Bullet 7'],
        },
      ],
      skills: [],
      education: [],
    }
    const xml = await requireXml('word/document.xml', manyBullets)
    expect(xml).toContain('Bullet 1')
    expect(xml).toContain('Bullet 5')
    expect(xml).not.toContain('Bullet 6')
  })

  it('omits empty optional sections', async () => {
    const minimal: ResumeContent = {
      name: 'John Doe',
      experience: [{ role: 'Dev', company: 'Co', bullets: ['Worked'] }],
    }
    const minXml = await requireXml('word/document.xml', minimal)
    expect(minXml).not.toContain('Summary')
    expect(minXml).not.toContain('Skills')
    expect(minXml).not.toContain('Projects')
    expect(minXml).not.toContain('Education')
    expect(minXml).not.toContain('Certifications')
  })
})
