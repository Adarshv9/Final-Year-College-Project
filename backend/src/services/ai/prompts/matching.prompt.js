// Build application scoring messages.








export const buildApplicationScoringMessages = (job, resumeSnapshot) => [
{
  role: 'system',
  content: 'You ONLY return valid JSON. No text, no explanation.'
},
{
  role: 'user',
  content: `You are an AI hiring assistant.
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
      location: job.location
    },
    null,
    2
  )}

Candidate resume snapshot:
${JSON.stringify(resumeSnapshot, null, 2)}`
}];








// Build job ranking messages.
export const buildJobRankingMessages = (resumeSkills, jobs) => {
  const rankingSchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        matchScore: { type: 'number' },
        reason: { type: 'string' }
      },
      required: ['jobId', 'matchScore', 'reason']
    }
  };

  return [
  {
    role: 'system',
    content: 'You ONLY return valid JSON. No text, no explanation.'
  },
  {
    role: 'user',
    content: `You are a job matching assistant.
Given the resume skills and jobs below, rank each job for the candidate.

Return only valid JSON matching this schema:
${JSON.stringify(rankingSchema, null, 2)}

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
        location: job.location
      })),
      null,
      2
    )}`
  }];

};