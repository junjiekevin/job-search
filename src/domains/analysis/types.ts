import { z } from 'zod'

export const AnalysisSchema = z.object({
  primaryResponsibilities: z.array(z.string()),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  technologies: z.array(z.string()),
  experienceExpectations: z.array(z.string()),
  resumeImprovements: z.array(z.string()),
  missingQualifications: z.array(z.string()),
  strongAlignment: z.array(z.string()),
})

export const ExperienceEntrySchema = z.object({
  role: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bullets: z.array(z.string()).min(1),
})

export const EducationEntrySchema = z.object({
  degree: z.string().min(1),
  institution: z.string().min(1),
  location: z.string().optional(),
  graduationDate: z.string().optional(),
})

export const CertificationEntrySchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional(),
  date: z.string().optional(),
})

export const ProjectEntrySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
})

export const SkillGroupSchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
})

export const ResumeContentSchema = z.strictObject({
  name: z.string().min(1),
  contact: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(SkillGroupSchema).optional(),
  experience: z.array(ExperienceEntrySchema).optional(),
  projects: z.array(ProjectEntrySchema).optional(),
  education: z.array(EducationEntrySchema).optional(),
  certifications: z.array(CertificationEntrySchema).optional(),
})

export const ResumeGenerationSchema = z.strictObject({
  tailoredResume: ResumeContentSchema,
})

export const CoverLetterGenerationSchema = z.strictObject({
  coverLetter: z.string().min(1),
})

export const FeedbackGenerationSchema = z.strictObject({
  rating: z.number().int().min(0).max(100),
  rationale: z.string().min(1),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  improvements: z.array(z.string()),
  suggestions: z.array(z.string()),
})

export type Analysis = z.infer<typeof AnalysisSchema>
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>
export type EducationEntry = z.infer<typeof EducationEntrySchema>
export type CertificationEntry = z.infer<typeof CertificationEntrySchema>
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>
export type SkillGroup = z.infer<typeof SkillGroupSchema>
export type ResumeContent = z.infer<typeof ResumeContentSchema>
export type ResumeGeneration = z.infer<typeof ResumeGenerationSchema>
export type CoverLetterGeneration = z.infer<typeof CoverLetterGenerationSchema>
export type FeedbackGeneration = z.infer<typeof FeedbackGenerationSchema>
