/**
 * Normalize skills array: trim whitespace, lowercase, remove duplicates.
 * Used as a Mongoose schema setter for skill fields.
 * @param {Array} skills - Array of skill strings
 * @returns {Array} Normalized skills
 */
const normalizeSkills = (skills = []) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  // Remove duplicates using Set and normalize each skill
  return [
    ...new Set(
      skills
        .filter(Boolean)
        .map((skill) => String(skill).trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
};

export default normalizeSkills;
