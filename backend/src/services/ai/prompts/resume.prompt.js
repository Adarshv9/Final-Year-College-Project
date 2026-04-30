// Stores the prompt template used for resume extraction.


const JSON_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Full name of the person' },
    email: { type: 'string', description: 'Email address' },
    phone: { type: 'string', description: 'Phone number' },
    location: { type: 'string', description: 'Current location/city' },
    summary: { type: 'string', description: 'Professional summary or objective' },
    skills: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of technical and professional skills'
    },
    experiences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string', description: 'Company name' },
          role: { type: 'string', description: 'Job title/role' },
          startDate: { type: 'string', description: 'Start date in YYYY-MM-DD or month-year' },
          endDate: {
            type: 'string',
            description: 'End date in YYYY-MM-DD or "present" if currently working'
          }
        },
        required: ['company', 'role', 'startDate']
      },
      description: 'List of work experiences'
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          degree: { type: 'string', description: 'Degree name' },
          institution: { type: 'string', description: 'University or institution name' },
          year: { type: 'number', description: 'Graduation year' }
        },
        required: ['degree', 'institution', 'year']
      },
      description: 'List of educational qualifications'
    },
    projects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Project name/title' },
          description: { type: 'string', description: 'Project description' }
        }
      },
      description: 'Notable projects'
    }
  },
  required: ['name', 'skills', 'experiences']
};






// Build resume parse messages.
export const buildResumeParseMessages = (rawText) => [
{
  role: 'system',
  content: 'You ONLY return valid JSON. No text, no explanation.'
},
{
  role: 'user',
  content: `You are a resume parsing expert. Extract all relevant information from the following resume text and return it as a valid JSON object that strictly matches this schema:\n\n${JSON.stringify(JSON_SCHEMA, null, 2)}\n\nImportant instructions:\n1. Return ONLY valid JSON (no markdown, no explanation)\n2. Ensure all arrays exist (use [] if empty)\n3. Skills must be lowercase\n4. Use "present" for current roles\n5. Dates should be YYYY-MM-DD if possible\n6. Standardize common technology names (e.g., use "express" instead of "express.js" or "expressjs", "mongoose" instead of "mongoose odm")\n\nResume:\n${rawText}`
}];


export { JSON_SCHEMA };