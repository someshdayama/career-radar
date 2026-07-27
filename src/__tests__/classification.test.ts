import { describe, it, expect } from 'vitest';
import { isIndiaOrStrictlyRemote, classifyJobRole, IT_ROLES } from '@/lib/classification';

describe('classification.js', () => {
  describe('isIndiaOrStrictlyRemote', () => {
    it('returns true for Indian tech hub locations', () => {
      expect(isIndiaOrStrictlyRemote('Bengaluru, India')).toBe(true);
      expect(isIndiaOrStrictlyRemote('Hyderabad, Telangana')).toBe(true);
      expect(isIndiaOrStrictlyRemote('Pune, Maharashtra')).toBe(true);
      expect(isIndiaOrStrictlyRemote('Gurugram, Haryana')).toBe(true);
      expect(isIndiaOrStrictlyRemote('Mumbai')).toBe(true);
      expect(isIndiaOrStrictlyRemote('Chennai')).toBe(true);
      expect(isIndiaOrStrictlyRemote('Delhi')).toBe(true);
    });

    it('returns true for global remote locations', () => {
      expect(isIndiaOrStrictlyRemote('Remote (Worldwide)')).toBe(true);
      expect(isIndiaOrStrictlyRemote('Remote (Global)')).toBe(true);
      expect(isIndiaOrStrictlyRemote('Work from Anywhere')).toBe(true);
      expect(isIndiaOrStrictlyRemote('Remote')).toBe(true);
    });

    it('returns false for remote locations restricted to non-India regions', () => {
      expect(isIndiaOrStrictlyRemote('Remote (US Only)')).toBe(false);
      expect(isIndiaOrStrictlyRemote('Remote (EU Only)')).toBe(false);
      expect(isIndiaOrStrictlyRemote('Canada Only')).toBe(false);
      expect(isIndiaOrStrictlyRemote('UK Only')).toBe(false);
    });

    it('returns false for non-India onsite locations', () => {
      expect(isIndiaOrStrictlyRemote('Berlin, Germany')).toBe(false);
      expect(isIndiaOrStrictlyRemote('San Francisco, CA')).toBe(false);
      expect(isIndiaOrStrictlyRemote('London, UK')).toBe(false);
    });
  });

  describe('classifyJobRole', () => {
    it('classifies Data & AI / ML roles correctly', () => {
      expect(classifyJobRole('Data Engineer')).toBe('data-ai');
      expect(classifyJobRole('Machine Learning Specialist')).toBe('data-ai');
      expect(classifyJobRole('AI Researcher')).toBe('data-ai');
    });

    it('classifies DevOps / SRE roles correctly', () => {
      expect(classifyJobRole('Site Reliability Engineer (SRE)')).toBe('devops-engineer');
      expect(classifyJobRole('DevOps Engineer')).toBe('devops-engineer');
      expect(classifyJobRole('Cloud Infrastructure Engineer')).toBe('devops-engineer');
    });

    it('classifies QA / SDET roles correctly', () => {
      expect(classifyJobRole('Senior SDET')).toBe('qa-engineer');
      expect(classifyJobRole('QA Automation Lead')).toBe('qa-engineer');
    });

    it('classifies DBA roles correctly', () => {
      expect(classifyJobRole('Database Administrator (DBA)')).toBe('dba');
      expect(classifyJobRole('PostgreSQL Engineer')).toBe('dba');
    });

    it('classifies Architect roles correctly', () => {
      expect(classifyJobRole('Enterprise Solutions Architect')).toBe('architect');
    });

    it('classifies Product & Agile roles correctly', () => {
      expect(classifyJobRole('Product Manager')).toBe('product-management');
      expect(classifyJobRole('Agile Scrum Master')).toBe('product-management');
    });

    it('defaults to software-engineer for general engineering titles', () => {
      expect(classifyJobRole('Full Stack Developer')).toBe('software-engineer');
      expect(classifyJobRole('React Frontend Engineer')).toBe('software-engineer');
    });
  });
});
