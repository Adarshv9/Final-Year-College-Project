// Implements business logic for scoring workflows.


import normalizeSkills from '../utils/normalizeSkills.js';












// Compute hybrid score.
export const computeHybridScore = ({
  jobSkills = [],
  minExp = 0,
  candidateSkills = [],
  candidateExp = 0,
  aiScore = 0
}) => {

  const normalizedJobSkills = normalizeSkills(jobSkills);
  const normalizedCandidateSkills = normalizeSkills(candidateSkills);


  const matchingSkills = normalizedCandidateSkills.filter((s) =>
  normalizedJobSkills.includes(s)
  );
  const missingSkills = normalizedJobSkills.filter((s) =>
  !normalizedCandidateSkills.includes(s)
  );
  const skillScore =
  normalizedJobSkills.length > 0 ? matchingSkills.length / normalizedJobSkills.length : 1;


  const expDenominator = Math.max(minExp, 0.5);
  const expScore = Math.min(candidateExp / expDenominator, 1);


  const aiNormalized = Math.max(0, Math.min(100, Number(aiScore) || 0)) / 100;




  const hybridRaw = 0.5 * skillScore + 0.3 * expScore + 0.2 * aiNormalized;


  const hybridScore = Math.round(hybridRaw * 100);

  return {
    hybridScore,
    breakdown: {
      skillScore: Math.round(skillScore * 100),
      expScore: Math.round(expScore * 100),
      aiScore: Math.round(aiNormalized * 100),
      matchingSkills,
      missingSkills
    }
  };
};