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

export const GenerationSchema = z.object({
  analysis: AnalysisSchema,
  tailoredResume: z.string().min(1),
  coverLetter: z.string().min(1),
})

export type Analysis = z.infer<typeof AnalysisSchema>
export type Generation = z.infer<typeof GenerationSchema>
