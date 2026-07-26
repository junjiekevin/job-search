import type { Job } from '@/domains/jobs/types'

export const TAILORING_SYSTEM_PROMPT = `
You are a senior recruiter and resume editor.

Tailor the resume to the job while staying strictly truthful.

Rules:
- Use only facts from the resume and provided job description.
- Never invent skills, tools, credentials, dates, employers, metrics, or achievements.
- Do not over-tailor or keyword-stuff.
- Do not suggest changes unless they improve relevance.
- Keep bullets concise, natural, ATS-friendly, and recruiter-friendly.
- Preserve the candidate's seniority level.
- Mark unsupported job requirements as gaps.
- Return valid JSON only.
`.trim()

export function tailoringPrompt(resumeText: string, job: Job): string {
  return `
Job:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location ?? 'Not provided'}
Employment type: ${job.employmentType ?? 'Not provided'}
Description:
${job.description ?? 'Not provided'}

Resume:
${resumeText}

Task:
Analyze the job and résumé, then generate a truthful tailored resume and cover letter.

Return JSON exactly in this shape:

{
  "analysis": {
    "primaryResponsibilities": string[],
    "requiredSkills": string[],
    "preferredSkills": string[],
    "technologies": string[],
    "experienceExpectations": string[],
    "resumeImprovements": string[],
    "missingQualifications": string[],
    "strongAlignment": string[]
  },
  "tailoredResume": string,
  "coverLetter": string
}
`.trim()
}
