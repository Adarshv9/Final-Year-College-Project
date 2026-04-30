// Coordinates AI-powered resume analysis and matching tasks.



import logger from '../../utils/logger.js';
import ApiError from '../../utils/ApiError.js';
import { chatCompletion } from './providers/openrouter.provider.js';
import { buildResumeParseMessages } from './prompts/resume.prompt.js';
import { buildApplicationScoringMessages, buildJobRankingMessages } from './prompts/matching.prompt.js';



// Parse json response.
const parseJsonResponse = (text) => {

  const cleaned = text.
  replace(/```json/g, '').
  replace(/```/g, '').
  trim();
  return JSON.parse(cleaned);
};








// Parse resume text.
export const parseResumeText = async (rawText) => {
  const start = Date.now();
  try {
    const messages = buildResumeParseMessages(rawText);
    const responseText = await chatCompletion(messages);

    let parsed;
    try {
      parsed = parseJsonResponse(responseText);
    } catch {
      logger.error('AI returned invalid JSON for resume parsing');
      throw new ApiError(500, 'Invalid JSON from AI', [], false);
    }


    if (!parsed || typeof parsed !== 'object') {
      throw new ApiError(400, 'Invalid resume data structure from AI', [], false);
    }
    if (!parsed.name || typeof parsed.name !== 'string') {
      throw new ApiError(400, 'Name is required in resume', [], false);
    }
    if (!Array.isArray(parsed.skills)) parsed.skills = [];
    if (!Array.isArray(parsed.experiences)) parsed.experiences = [];
    if (!Array.isArray(parsed.education)) parsed.education = [];
    if (!Array.isArray(parsed.projects)) parsed.projects = [];

    logger.info(`[METRIC] AI resume parse completed in ${Date.now() - start}ms`);
    return parsed;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`AI resume parse error: ${error.message}`);
    throw new ApiError(500, 'Failed to extract resume information via AI', [], false);
  }
};







// Score application.
export const scoreApplication = async (job, resumeSnapshot) => {
  const start = Date.now();
  try {
    const messages = buildApplicationScoringMessages(job, resumeSnapshot);
    const responseText = await chatCompletion(messages);

    let parsed;
    try {
      parsed = parseJsonResponse(responseText);
    } catch {
      throw new ApiError(502, 'Invalid recommendation response from AI', [], false);
    }

    logger.info(`[METRIC] AI application scoring completed in ${Date.now() - start}ms`);

    return {
      matchScore: Math.max(0, Math.min(100, Math.round(Number(parsed.matchScore) || 0))),
      reason: String(parsed.reason || '').trim()
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`AI scoring error: ${error.message}`);
    throw new ApiError(502, 'AI scoring failed', [], false);
  }
};







// Handle Jobs.
export const rankJobs = async (resumeSkills, jobs) => {
  if (!Array.isArray(jobs) || jobs.length === 0) return [];

  const start = Date.now();
  try {
    const messages = buildJobRankingMessages(resumeSkills, jobs);
    const responseText = await chatCompletion(messages);

    let parsed;
    try {
      parsed = parseJsonResponse(responseText);
    } catch {
      throw new ApiError(502, 'Invalid recommendation response from AI', [], false);
    }

    if (!Array.isArray(parsed)) {
      throw new ApiError(502, 'Unexpected recommendation response format', [], false);
    }

    logger.info(`[METRIC] AI job ranking completed in ${Date.now() - start}ms`);



    const jobMap = new Map(jobs.map((job) => [String(job._id), job]));

    return parsed.


    filter((item) => jobMap.has(String(item.jobId))).
    map((item) => {
      const job = jobMap.get(String(item.jobId));
      return {
        jobId: String(job._id),
        title: job.title,
        companyName: job.companyName,
        jobType: job.jobType,
        matchScore: Math.max(0, Math.min(100, Math.round(Number(item.matchScore) || 0))),
        reason: String(item.reason || '').trim()
      };
    }).
    sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`AI job ranking error: ${error.message}`);
    throw new ApiError(502, 'AI job ranking failed', [], false);
  }
};