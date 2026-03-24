import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const pdfParse = require('pdf-parse');
import { env } from '../config/env.js';
import ApiError from './ApiError.js';
import logger from './logger.js';

import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});


/**
 * Extract text from PDF buffer
 */
export const extractTextFromPdf = async (pdfBuffer) => {
  try {
    const pdfData = await pdfParse(pdfBuffer);
    console.log('Extracted PDF text:', pdfData.text);

    return pdfData.text || '';
  } catch (error) {
    logger.error('PDF parsing error:', error);
    throw new ApiError(400, 'Failed to parse PDF file');
  }
};

/**
 * Define strict JSON schema for AI response
 */
const JSON_SCHEMA = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Full name of the person',
    },
    email: {
      type: 'string',
      description: 'Email address',
    },
    phone: {
      type: 'string',
      description: 'Phone number',
    },
    location: {
      type: 'string',
      description: 'Current location/city',
    },
    summary: {
      type: 'string',
      description: 'Professional summary or objective',
    },
    skills: {
      type: 'array',
      items: {
        type: 'string',
      },
      description: 'List of technical and professional skills',
    },
    experiences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: {
            type: 'string',
            description: 'Company name',
          },
          role: {
            type: 'string',
            description: 'Job title/role',
          },
          startDate: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format or month-year',
          },
          endDate: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format or month-year, or "present" if currently working',
          },
        },
        required: ['company', 'role', 'startDate'],
      },
      description: 'List of work experiences',
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          degree: {
            type: 'string',
            description: 'Degree name (e.g., Bachelor of Science)',
          },
          institution: {
            type: 'string',
            description: 'University or institution name',
          },
          year: {
            type: 'number',
            description: 'Graduation year',
          },
        },
        required: ['degree', 'institution', 'year'],
      },
      description: 'List of educational qualifications',
    },
    projects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Project name/title',
          },
          description: {
            type: 'string',
            description: 'Project description',
          },
        },
      },
      description: 'Notable projects',
    },
  },
  required: ['name', 'skills', 'experiences'],
};

/**
 * Extract and parse resume information using AI
 */
export const extractResumeWithAI = async (pdfText) => {
  try {
    const prompt = `
You are a resume parsing expert. Extract all relevant information from the following resume text and return it as a valid JSON object that strictly matches this schema:

${JSON.stringify(JSON_SCHEMA, null, 2)}

Important instructions:
1. Return ONLY valid JSON (no markdown, no explanation)
2. Ensure all arrays exist (use [] if empty)
3. Skills must be lowercase
4. Use "present" for current roles
5. Dates should be YYYY-MM-DD if possible

Resume:
${pdfText}
`;

    const completion = await client.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b:free", // IMPORTANT
      messages: [
        {
          role: "system",
          content: "You ONLY return valid JSON. No text, no explanation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new ApiError(500, 'Empty response from AI');
    }

    let parsedResponse;

    try {
      const jsonString = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      parsedResponse = JSON.parse(jsonString);
    } catch (err) {
      logger.error('AI returned invalid JSON:', responseText);
      throw new ApiError(500, 'Invalid JSON from AI');a
    }

    validateResumeData(parsedResponse);

    return parsedResponse;

  } catch (error) {
    logger.error('AI extraction error:', error);
    throw new ApiError(500, 'Failed to extract resume information');
  }
};

/**
 * Validate resume data structure
 */
const validateResumeData = (data) => {
  if (!data || typeof data !== 'object') {
    throw new ApiError(400, 'Invalid resume data structure');
  }

  if (!data.name || typeof data.name !== 'string') {
    throw new ApiError(400, 'Name is required in resume');
  }

  if (!data.skills || !Array.isArray(data.skills)) {
    throw new ApiError(400, 'Skills array is required');
  }

  if (!data.experiences || !Array.isArray(data.experiences)) {
    throw new ApiError(400, 'Experiences array is required');
  }
};

/**
 * Parse date string to Date object
 * Handles formats: YYYY-MM-DD, MM-YYYY, MMMM YYYY, etc.
 */
const parseDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const normalized = dateString.toLowerCase().trim();

  // If "present" or "current", return null (to use current date later)
  if (normalized === 'present' || normalized === 'current') {
    return null;
  }

  // Try YYYY-MM-DD format first
  let date = new Date(normalized);
  if (!isNaN(date)) {
    return date;
  }

  // Try MM-YYYY or M-YYYY format
  const mmYyyyMatch = normalized.match(/^(\d{1,2})-(\d{4})$/);
  if (mmYyyyMatch) {
    const [, month, year] = mmYyyyMatch;
    return new Date(`${year}-${month}-01`);
  }

  // Try "Month Year" format
  date = new Date(normalized);
  if (!isNaN(date)) {
    return date;
  }

  // If parsing fails, return null
  return null;
};

/**
 * Merge overlapping date intervals
 */
const mergeIntervals = (intervals) => {
  if (intervals.length === 0) return [];

  // Sort by start date
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);

  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    // If current interval overlaps with last interval, merge them
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
};

/**
 * Calculate experience years from experiences array
 * Merges overlapping intervals and calculates total months
 */
export const calculateExperienceYears = (experiences) => {
  if (!experiences || !Array.isArray(experiences) || experiences.length === 0) {
    return 0;
  }

  const intervals = [];

  for (const exp of experiences) {
    if (!exp.startDate) continue;

    const startDate = parseDate(exp.startDate);
    if (!startDate) continue;

    // If endDate is null/"present"/"current", use current date
    let endDate = exp.endDate ? parseDate(exp.endDate) : null;
    if (!endDate) {
      endDate = new Date();
    }

    intervals.push([startDate.getTime(), endDate.getTime()]);
  }

  if (intervals.length === 0) {
    return 0;
  }

  // Merge overlapping intervals
  const mergedIntervals = mergeIntervals(intervals);

  // Calculate total time in milliseconds
  let totalMs = 0;
  for (const [start, end] of mergedIntervals) {
    totalMs += end - start;
  }

  // Convert milliseconds to years
  const totalYears = totalMs / (1000 * 60 * 60 * 24 * 365.25);

  // Round to 1 decimal place
  return Math.round(totalYears * 10) / 10;
};

/**
 * Normalize skills (lowercase, trim, remove duplicates)
 */
export const normalizeSkillsArray = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return [
    ...new Set(
      skills
        .filter((skill) => typeof skill === 'string' && skill.trim().length > 0)
        .map((skill) => skill.toLowerCase().trim())
    ),
  ];
};

/**
 * Transform AI response to Resume model format
 */
export const transformResumeData = (AiData) => {
  const { experiences = [], skills = [], ...rest } = AiData;

  // Transform experiences to include start/endDate as Date objects
  const transformedExperiences = experiences.map((exp) => {
    const startDate = parseDate(exp.startDate);
    const endDateStr = exp.endDate;
    const endDate = endDateStr && endDateStr.toLowerCase() !== 'present' ? parseDate(endDateStr) : null;

    return {
      company: exp.company || '',
      role: exp.role || '',
      startDate: startDate || new Date(),
      endDate,
    };
  });

  // Normalize skills
  const normalizedSkills = normalizeSkillsArray(skills);

  // Calculate experience years
  const experienceYears = calculateExperienceYears(transformedExperiences);

  return {
    ...rest,
    skills: normalizedSkills,
    experiences: transformedExperiences,
    experienceYears,
    education: AiData.education || [],
    projects: AiData.projects || [],
  };
};
