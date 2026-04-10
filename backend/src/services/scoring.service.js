// ── Hybrid Scoring Engine ──
// Deterministic scoring weighted: 50% skills, 30% experience, 20% AI semantic
import normalizeSkills from '../utils/normalizeSkills.js';

/**
 * Compute hybrid match score for a candidate against a job.
 *
 * @param {Object} params
 * @param {string[]} params.jobSkills        - Required skills from the job posting
 * @param {number}  params.minExp            - Minimum years of experience required
 * @param {string[]} params.candidateSkills  - Candidate's skills (already normalized)
 * @param {number}  params.candidateExp      - Candidate's total years of experience
 * @param {number}  params.aiScore           - AI semantic score 0–100
 * @returns {{ hybridScore: number, breakdown: Object }}
 */
export const computeHybridScore = ({
  jobSkills = [],
  minExp = 0,
  candidateSkills = [],
  candidateExp = 0,
  aiScore = 0,
}) => {
  // Normalize all skill arrays before comparison
  const normalizedJobSkills = normalizeSkills(jobSkills);
  const normalizedCandidateSkills = normalizeSkills(candidateSkills);

  // ── Skill match (0–1) ──────────────────────────────────────────────────────
  const matchingSkills = normalizedCandidateSkills.filter((s) =>
    normalizedJobSkills.includes(s)
  );
  const skillScore =
    normalizedJobSkills.length > 0 ? matchingSkills.length / normalizedJobSkills.length : 1;

  // ── Experience match (0–1, capped at 1) ───────────────────────────────────
  const expDenominator = Math.max(minExp, 0.5); // avoid division by zero
  const expScore = Math.min(candidateExp / expDenominator, 1);

  // ── AI score normalised to 0–1 ────────────────────────────────────────────
  const aiNormalized = Math.max(0, Math.min(100, Number(aiScore) || 0)) / 100;

  // ── Weighted hybrid ───────────────────────────────────────────────────────
  // The deterministic parts carry more weight than the model score so noisy
  // AI output cannot completely overpower obvious skill or experience gaps.
  const hybridRaw = 0.5 * skillScore + 0.3 * expScore + 0.2 * aiNormalized;

  // Scale back to 0–100 for consistency with aiScore
  const hybridScore = Math.round(hybridRaw * 100);

  return {
    hybridScore,
    breakdown: {
      skillScore: Math.round(skillScore * 100),
      expScore: Math.round(expScore * 100),
      aiScore: Math.round(aiNormalized * 100),
      matchingSkills,
    },
  };
};
