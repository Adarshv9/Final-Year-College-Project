import OpenAI from 'openai';
import ApiError from './ApiError.js';

const parseAIResponse = (text) => {
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanedText);
};

export const scoreApplicationWithAI = async ({ job, resumeSnapshot }) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new ApiError(503, 'OpenRouter API key is not configured');
  }

  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const prompt = `
You are an AI hiring assistant.
Evaluate how well this candidate matches the job and return only valid JSON.

Required JSON shape:
{
  "matchScore": 0,
  "reason": "short explanation"
}

Rules:
- matchScore must be an integer from 0 to 100
- reason must be concise and practical
- Use the candidate resume snapshot exactly as provided
- Consider skill overlap, experience level, and education relevance

Job:
${JSON.stringify(
    {
      title: job.title,
      companyName: job.companyName,
      description: job.description,
      requiredSkills: job.requiredSkills,
      minExperience: job.minExperience,
      jobType: job.jobType,
      location: job.location,
    },
    null,
    2
  )}

Candidate resume snapshot:
${JSON.stringify(resumeSnapshot, null, 2)}
`;

  const completion = await client.chat.completions.create({
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    messages: [
      {
        role: 'system',
        content: 'You ONLY return valid JSON. No text, no explanation.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    throw new ApiError(502, 'Empty response from AI');
  }

  let parsed;
  try {
    parsed = parseAIResponse(responseText);
  } catch (error) {
    throw new ApiError(502, 'Invalid recommendation response from AI');
  }

  return {
    matchScore: Math.max(0, Math.min(100, Math.round(Number(parsed.matchScore) || 0))),
    reason: String(parsed.reason || '').trim(),
  };
};
