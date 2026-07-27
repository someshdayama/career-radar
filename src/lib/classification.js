export const IT_ROLES = [
  { id: 'all', label: 'All IT Jobs' },
  { id: 'software-engineer', label: 'Software Engineer' },
  { id: 'devops-engineer', label: 'DevOps / SRE' },
  { id: 'qa-engineer', label: 'QA / SDET' },
  { id: 'data-ai', label: 'Data & AI / ML' },
  { id: 'dba', label: 'DBA' },
  { id: 'architect', label: 'Architect' },
  { id: 'product-management', label: 'Product & Agile' }
];

/**
 * Checks if a job location is strictly in India or open to Global/Worldwide Remote candidates.
 * Excludes jobs restricted to other specific countries (e.g. "US Only", "EU Only", "Germany Onsite", etc.).
 * @param {string} location 
 * @returns {boolean}
 */
export function isIndiaOrStrictlyRemote(location = '') {
  if (!location) return true;
  const loc = location.toLowerCase().trim();

  // Check for India or Indian tech hubs
  const isIndia = (
    loc.includes('india') ||
    loc.includes('bengaluru') ||
    loc.includes('bangalore') ||
    loc.includes('hyderabad') ||
    loc.includes('pune') ||
    loc.includes('mumbai') ||
    loc.includes('chennai') ||
    loc.includes('delhi') ||
    loc.includes('gurugram') ||
    loc.includes('gurgaon') ||
    loc.includes('noida') ||
    loc.includes('kolkata') ||
    loc.includes('ahmedabad') ||
    loc.includes('kochi') ||
    loc.includes('trivandrum') ||
    loc.includes('indore')
  );

  if (isIndia) return true;

  // Check for Remote / Worldwide / Global / Anywhere
  const isRemote = (
    loc.includes('remote') ||
    loc.includes('worldwide') ||
    loc.includes('global') ||
    loc.includes('anywhere') ||
    loc.includes('work from anywhere') ||
    loc.includes('wfh')
  );

  if (isRemote) {
    // Exclude remote jobs explicitly restricted to non-India regions (e.g., US Only, EU Only, LATAM Only)
    const isRestrictedElsewhere = (
      loc.includes('us only') ||
      loc.includes('usa only') ||
      loc.includes('eu only') ||
      loc.includes('europe only') ||
      loc.includes('uk only') ||
      loc.includes('canada only') ||
      loc.includes('latam only') ||
      loc.includes('brazil only')
    );
    return !isRestrictedElsewhere;
  }

  return false;
}

/**
 * Classifies a job title into one of the standard IT roles.
 * @param {string} title 
 * @returns {string} One of the role IDs from IT_ROLES (excluding 'all')
 */
export function classifyJobRole(title = '') {
  const t = title.toLowerCase();

  if (
    t.includes('data engineer') ||
    t.includes('machine learning') ||
    t.includes('ml engineer') ||
    t.includes('ai engineer') ||
    t.includes('deep learning') ||
    t.includes('data scientist') ||
    t.includes('ai researcher') ||
    t.includes('nlp') ||
    t.includes('computer vision') ||
    t.includes('data analyst') ||
    t.includes('analytics engineer')
  ) {
    return 'data-ai';
  }
  
  if (
    t.includes('devops') ||
    t.includes('sre') ||
    t.includes('site reliability') ||
    t.includes('platform engineer') ||
    t.includes('infrastructure engineer') ||
    t.includes('cloud engineer') ||
    t.includes('sysadmin') ||
    t.includes('system administrator') ||
    t.includes('release engineer') ||
    t.includes('operations engineer') ||
    t.includes('platform architect')
  ) {
    return 'devops-engineer';
  }
  
  if (
    t.includes('qa') ||
    t.includes('test') ||
    t.includes('sdet') ||
    t.includes('quality assurance') ||
    t.includes('automation engineer') ||
    t.includes('testing') ||
    t.includes('validation engineer')
  ) {
    return 'qa-engineer';
  }
  
  if (
    t.includes('dba') ||
    t.includes('database') ||
    t.includes('db admin') ||
    t.includes('db engineer') ||
    t.includes('postgresql') ||
    t.includes('mysql') ||
    t.includes('oracle developer') ||
    t.includes('sql developer')
  ) {
    return 'dba';
  }
  
  if (
    t.includes('architect') ||
    t.includes('architecture')
  ) {
    return 'architect';
  }

  if (
    t.includes('product manager') ||
    t.includes('product owner') ||
    t.includes('scrum master') ||
    t.includes('agile coach') ||
    t.includes('project manager') ||
    t.includes('program manager') ||
    t.includes('product lead') ||
    t.includes('product specialist') ||
    t.includes('scrum') ||
    t.includes('agile practitioner')
  ) {
    return 'product-management';
  }
  
  if (
    t.includes('software') ||
    t.includes('developer') ||
    t.includes('frontend') ||
    t.includes('front end') ||
    t.includes('front-end') ||
    t.includes('backend') ||
    t.includes('back end') ||
    t.includes('back-end') ||
    t.includes('fullstack') ||
    t.includes('full stack') ||
    t.includes('full-stack') ||
    t.includes('programmer') ||
    t.includes('engineer') ||
    t.includes('coder') ||
    t.includes('js') ||
    t.includes('react') ||
    t.includes('node') ||
    t.includes('java') ||
    t.includes('python') ||
    t.includes('golang') ||
    t.includes('rust') ||
    t.includes('web') ||
    t.includes('mobile') ||
    t.includes('ios') ||
    t.includes('android')
  ) {
    return 'software-engineer';
  }
  
  return 'software-engineer';
}
