// Extracts structured resume details from uploaded files.



import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

import ApiError from './ApiError.js';
import logger from './logger.js';






// Extract text from PDF.
export const extractTextFromPdf = async (pdfBuffer) => {
  try {
    const pdfData = await pdfParse(pdfBuffer);
    return pdfData.text || '';
  } catch (error) {
    logger.error(`PDF parsing error: ${error.message}`);
    throw new ApiError(400, 'Failed to parse PDF file');
  }
};






// Handle Resume Text.
export const cleanResumeText = (rawText) => {
  return rawText.
  replace(/\r\n/g, '\n').
  replace(/\r/g, '\n').
  replace(/[ \t]{2,}/g, ' ').
  replace(/\n{3,}/g, '\n\n').
  trim();
};



// Parse date.
const parseDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;

  const normalized = dateString.toLowerCase().trim();
  if (normalized === 'present' || normalized === 'current') return null;

  let date = new Date(normalized);
  if (!isNaN(date)) return date;

  const mmYyyyMatch = normalized.match(/^(\d{1,2})-(\d{4})$/);
  if (mmYyyyMatch) {
    const [, month, year] = mmYyyyMatch;
    return new Date(`${year}-${month}-01`);
  }

  date = new Date(normalized);
  return isNaN(date) ? null : date;
};

// Merge intervals.
const mergeIntervals = (intervals) => {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  return merged;
};







// Handle Experience Years.
export const calculateExperienceYears = (experiences) => {
  if (!Array.isArray(experiences) || experiences.length === 0) return 0;

  const intervals = [];
  for (const exp of experiences) {
    if (!exp.startDate) continue;
    const startDate = parseDate(typeof exp.startDate === 'string' ? exp.startDate : exp.startDate?.toISOString?.() || '');
    const parsedStart = startDate || (exp.startDate instanceof Date ? exp.startDate : null);
    if (!parsedStart) continue;

    let endDate = exp.endDate ?
    parseDate(typeof exp.endDate === 'string' ? exp.endDate : exp.endDate?.toISOString?.() || '') :
    null;
    const parsedEnd = endDate || (exp.endDate instanceof Date ? exp.endDate : null) || new Date();

    intervals.push([
    (parsedStart instanceof Date ? parsedStart : new Date(parsedStart)).getTime(),
    (parsedEnd instanceof Date ? parsedEnd : new Date(parsedEnd)).getTime()]
    );
  }

  if (intervals.length === 0) return 0;

  const mergedIntervals = mergeIntervals(intervals);
  let totalMs = 0;
  for (const [start, end] of mergedIntervals) {
    totalMs += end - start;
  }

  return Math.round(totalMs / (1000 * 60 * 60 * 24 * 365.25) * 10) / 10;
};






// Normalize skills array.
export const normalizeSkillsArray = (skills) => {
  if (!Array.isArray(skills)) return [];
  return [
  ...new Set(
    skills.
    filter((skill) => typeof skill === 'string' && skill.trim().length > 0).
    map((skill) => skill.toLowerCase().trim())
  )];

};






// Handle Resume Data.
export const transformResumeData = (aiData) => {
  const { experiences = [], skills = [], ...rest } = aiData;

  const transformedExperiences = experiences.map((exp) => ({
    company: exp.company || '',
    role: exp.role || '',
    startDate: parseDate(exp.startDate) || new Date(),


    endDate:
    exp.endDate && exp.endDate.toLowerCase() !== 'present' ?
    parseDate(exp.endDate) :
    null
  }));

  return {
    ...rest,
    skills: normalizeSkillsArray(skills),
    experiences: transformedExperiences,
    experienceYears: calculateExperienceYears(transformedExperiences),
    education: aiData.education || [],
    projects: aiData.projects || []
  };
};