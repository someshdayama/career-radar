export const IT_ROLES = [
  { id: 'all', label: 'All IT Jobs' },
  { id: 'software-engineer', label: 'Software Engineer' },
  { id: 'devops-engineer', label: 'DevOps / SRE' },
  { id: 'qa-engineer', label: 'QA / SDET' },
  { id: 'dba', label: 'DBA' },
  { id: 'architect', label: 'Architect' },
  { id: 'product-management', label: 'Product & Agile' }
];

/**
 * Classifies a job title into one of the standard IT roles.
 * @param {string} title 
 * @returns {string} One of the role IDs from IT_ROLES (excluding 'all')
 */
export function classifyJobRole(title = '') {
  const t = title.toLowerCase();
  
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
    t.includes(' scrum') ||
    t.includes('agile practitioner')
  ) {
    return 'product-management';
  }
  
  if (
    t.includes('software') ||
    t.includes('developer') ||
    t.includes('frontend') ||
    t.includes('backend') ||
    t.includes('fullstack') ||
    t.includes('programmer') ||
    t.includes('engineer') ||
    t.includes('coder') ||
    t.includes('js') ||
    t.includes('java') ||
    t.includes('python') ||
    t.includes('golang') ||
    t.includes('web')
  ) {
    return 'software-engineer';
  }
  
  // Default fallback
  return 'software-engineer';
}
