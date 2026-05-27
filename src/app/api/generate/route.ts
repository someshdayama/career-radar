import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export const maxDuration = 60;

import { SOMESH_PROFILE } from '@/data/someshProfile';

const resumeSchema = {
  type: "OBJECT",
  properties: {
    personalInfo: {
      type: "OBJECT",
      properties: {
        fullName: { type: "STRING" },
        email: { type: "STRING" },
        phone: { type: "STRING" },
        location: { type: "STRING" },
        linkedinUrl: { type: "STRING" }
      },
      required: ["fullName", "email"]
    },
    summary: { type: "STRING" },
    experience: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          company: { type: "STRING" },
          position: { type: "STRING" },
          startDate: { type: "STRING" },
          endDate: { type: "STRING" },
          description: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["company", "position", "description"]
      }
    },

    education: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          institution: { type: "STRING" },
          degree: { type: "STRING" },
          startDate: { type: "STRING" },
          endDate: { type: "STRING" }
        },
        required: ["institution", "degree"]
      }
    },
    skills: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  },
  required: ["personalInfo", "summary", "experience", "education", "skills"]
};

function cleanAndParseJSON(text: string) {
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();
  }
  return JSON.parse(cleanText);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, jobContext } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    let finalPrompt: string;
    let systemInstruction: string;

    if (jobContext) {
      // JOB-TAILORED MODE: very specific instructions per role
      const expJson = JSON.stringify(SOMESH_PROFILE.experience.map(e => ({
        company: e.company,
        position: e.position,
        startDate: e.startDate,
        endDate: e.endDate,
        allBullets: e.description,
      })));

      finalPrompt = `
TARGET JOB:
Title: ${jobContext.title}
Company: ${jobContext.company}
Location: ${jobContext.location || 'India'}
Job Description / Context: ${jobContext.description || 'Not provided'}

CANDIDATE DATA (factual, do not invent anything beyond this):
${JSON.stringify(SOMESH_PROFILE.personalInfo)}

Work Experience (choose and rewrite the most relevant bullets per role):
${expJson}

All Available Skills: ${SOMESH_PROFILE.skills.join(', ')}

Education: ${JSON.stringify(SOMESH_PROFILE.education)}
`.trim();

      systemInstruction = `
You are an expert resume writer. Your job is to produce a TAILORED resume JSON for the candidate applying to the specific TARGET JOB above.

MANDATORY RULES — follow each one precisely:

1. SUMMARY: Write a 2-3 sentence professional summary that:
   - Mentions the company name "${jobContext.company}" and target role "${jobContext.title}" explicitly.
   - Highlights only the experience most relevant to this specific role.
   - Uses keywords from the job title and description.

2. EXPERIENCE BULLETS: For EACH work experience entry, you MUST:
   - Select only the 2-3 bullet points most relevant to "${jobContext.title}" role.
   - Rewrite them to front-load keywords from the job description.
   - If the job is cloud-heavy: emphasise GCP/AWS/Azure, Terraform, Kubernetes.
   - If the job is SRE/reliability: emphasise MTTR, incident management, availability, monitoring.
   - If the job is CI/CD/DevOps: emphasise Jenkins, Helm, Ansible, pipeline speed.
   - If the job is release/program management: emphasise release coordination, squad management, stakeholder communication.
   - NEVER fabricate new bullet points — only select and reword from the provided bullets.

3. SKILLS: Reorder the skills array so the most relevant skills to "${jobContext.title}" appear first.

4. Do NOT change any dates, company names, or personal info.
      `.trim();

    } else {
      // GENERIC MODE: parse raw text prompt into structured resume
      finalPrompt = prompt;
      systemInstruction = `
You are an expert resume parser and writer.
The user will provide raw, unstructured text containing their work history, education, skills, and personal details.
Structure this data into a clean, professional JSON format matching the schema.

Write a compelling 2-3 sentence professional summary if one is not given.
Make bullet points action-oriented with quantified outcomes where possible.
      `.trim();
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: resumeSchema,
      },
    });

    const outputText = response.text;

    if (!outputText) {
      throw new Error('No output generated from Gemini');
    }

    const parsedData = cleanAndParseJSON(outputText);

    return NextResponse.json({ data: parsedData });
  } catch (error) {
    console.error('Error generating resume data:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume data.' },
      { status: 500 }
    );
  }
}
