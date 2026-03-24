import OpenAI from 'openai';
import ApiError from './ApiError.js';

const recommendationSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      jobId: {
        type: 'string',
      },
      matchScore: {
        type: 'number',
      },
      reason: {
        type: 'string',
      },
    },
    required: ['jobId', 'matchScore', 'reason'],
  },
};

const parseRecommendationResponse = (text) => {
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanedText);
};

export const rankJobsWithAI = async ({ resumeSkills, jobs }) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new ApiError(503, 'OpenRouter API key is not configured');
  }

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return [];
  }

  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const prompt = `
You are a job matching assistant.
Given the resume skills and jobs below, rank each job for the candidate.

Return only valid JSON matching this schema:
${JSON.stringify(recommendationSchema, null, 2)}

Rules:
- Return one result for every provided job
- matchScore must be an integer from 0 to 100
- reason must be concise and practical
- Base the score mainly on skill overlap, job type fit, and experience fit

Resume skills:
${JSON.stringify(resumeSkills)}

Jobs:
${JSON.stringify(
    jobs.map((job) => ({
      jobId: String(job._id),
      title: job.title,
      companyName: job.companyName,
      description: job.description,
      requiredSkills: job.requiredSkills,
      minExperience: job.minExperience,
      jobType: job.jobType,
      location: job.location,
    })),
    null,
    2
  )}
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
  console.log('Raw AI response:', responseText);

  if (!responseText) {
    throw new ApiError(502, 'Empty response from AI');
  }

  let parsed;
  try {
    parsed = parseRecommendationResponse(responseText);
  } catch (error) {
    throw new ApiError(502, 'Invalid recommendation response from AI');
  }

  if (!Array.isArray(parsed)) {
    throw new ApiError(502, 'Unexpected recommendation response format');
  }

  const jobMap = new Map(jobs.map((job) => [String(job._id), job]));

  return parsed
    .filter((item) => jobMap.has(String(item.jobId)))
    .map((item) => {
      const job = jobMap.get(String(item.jobId));

      return {
        jobId: String(job._id),
        title: job.title,
        companyName: job.companyName,
        jobType: job.jobType,
        matchScore: Math.max(0, Math.min(100, Math.round(Number(item.matchScore) || 0))),
        reason: String(item.reason || '').trim(),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};
