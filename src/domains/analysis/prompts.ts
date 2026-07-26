import type { Job } from '@/domains/jobs/types'

const GENERATION_SYSTEM_PROMPT = `
You are a senior recruiter and resume editor - British English.

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

function jobAndResumePrompt(resumeText: string, job: Job): string {
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
`.trim()
}

export function tailoredResumePrompt(resumeText: string, job: Job): string {
  return `
${jobAndResumePrompt(resumeText, job)}

Task:
Generate only a truthful tailored resume as structured JSON.

Rules:
- Do not include cover letter text, analysis, scores, or commentary.
- Preserve facts — never invent dates, metrics, employers, or credentials.
- Keep bullets concise, natural, ATS-friendly, and recruiter-friendly.
- Experience entries ordered newest-first when dates are known.
- Bullets are content-only strings — no formatting or style instructions.
- Omit empty optional arrays.

Return JSON exactly in this shape:

{
  "tailoredResume": {
    "name": string,
    "contact"?: string,
    "summary"?: string,
    "skills"?: [{ "category": string, "items": string[] }],
    "experience"?: [{ "role": string, "company": string, "location"?: string, "startDate"?: string, "endDate"?: string, "bullets": string[] }],
    "projects"?: [{ "name": string, "description"?: string, "technologies"?: string[] }],
    "education"?: [{ "degree": string, "institution": string, "location"?: string, "graduationDate"?: string }],
    "certifications"?: [{ "name": string, "issuer"?: string, "date"?: string }]
  }
}
`.trim()
}

export function coverLetterPrompt(resumeText: string, job: Job): string {
  return `
${jobAndResumePrompt(resumeText, job)}

Task:
Generate only a truthful cover letter for this role.

Rules:
- Do not include a resume, analysis, scores, or commentary.
- Only use job description + resume as reference.
- Keep the tone natural, enthusiastic, driven, charismatic, creative, well balanced, and specific to the role.
- Vary sentence length. Use simple, clear language. No corporate fluff.
- No hyphens anywhere.
- Do not sound like AI. No generic phrasing. No repetitive sentence openings.
- End with a confident, human closing line that does not beg.

Return JSON exactly in this shape:

{
  "coverLetter": string
}
`.trim()
}

export function feedbackPrompt(resumeText: string, job: Job): string {
  return `
${jobAndResumePrompt(resumeText, job)}

Task:
Analyze fit only. Return a concise rating and detailed feedback ONLY.

Rules:
- Rating must be an integer from 0 to 100.
- Rationale must be concise and factual.
- Strengths, gaps, and improvements must be concise bullet-ready strings.
- Rewrite specific bullet points to better match the job requirements as suggestions, use XYZ method: Accomplished [X] as measured by [Y] by doing [Z].
- Suggestions <= 30 words per bullet with strong impact.
- Reorder/Override bullets within roles to prioritize relevance.
- Use clear, recruiter-friendly language (no buzzword stuffing).
- CRITICAL: ALL suggestions must be ATS AND Recruiter friendly, AND NOT sound like AI-Generated content. 
- Do not include generated resume text or cover letter text.
- Do NOT fabricate experience, tools, or metrics

Return JSON exactly in this shape:

{
  "rating": number,
  "rationale": string,
  "strengths": string[],
  "gaps": string[],
  "improvements": string[],
  "suggestions": string[]
}
`.trim()
}

export { GENERATION_SYSTEM_PROMPT }
