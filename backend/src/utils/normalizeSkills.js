// Normalizes skill lists before scoring or storage.
const skillSynonyms = {
  'express.js': 'express',
  'expressjs': 'express',
  'mongoose odm': 'mongoose',
  'react.js': 'react',
  'reactjs': 'react',
  'node.js': 'nodejs',
  'node': 'nodejs',
  'vue.js': 'vue',
  'vuejs': 'vue',
  'next.js': 'nextjs',
  'next': 'nextjs',
  'angular.js': 'angular',
  'angularjs': 'angular',
  'ts': 'typescript',
  'js': 'javascript',
  'postgres': 'postgresql',
  'mongo': 'mongodb'
};








// Normalize skills.
const normalizeSkills = (skills = []) => {
  if (!Array.isArray(skills)) {
    return [];
  }


  return [
  ...new Set(
    skills.
    filter(Boolean).
    flatMap((skill) =>
    String(skill).
    split(/[,;\n]+/).
    map((part) => {
      const normalized = part.trim().toLowerCase();
      return skillSynonyms[normalized] || normalized;
    })
    ).
    filter(Boolean)
  )];

};

export default normalizeSkills;