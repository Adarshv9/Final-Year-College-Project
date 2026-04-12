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
        .flatMap((skill) =>
          String(skill)
            .split(/[,;\n]+/)
            .map((part) => part.trim().toLowerCase())
        )
        .filter(Boolean)
    ),
  ];
};

export default normalizeSkills;
