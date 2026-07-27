/**
 * Unit tests for saved-job snapshot helpers.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createJobSnapshot,
  loadSavedJobs,
  persistSavedJobs,
  toggleSavedJob,
  refreshSavedSnapshots,
  resolveSavedJobsList,
  savedJobIdSet,
  SAVED_JOBS_KEY,
  LEGACY_SAVED_IDS_KEY,
} from '@/lib/saved-jobs';

const lsStore: Record<string, string> = {};

beforeEach(() => {
  Object.keys(lsStore).forEach(k => delete lsStore[k]);
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k: string) => lsStore[k] ?? null,
      setItem: (k: string, v: string) => { lsStore[k] = v; },
      removeItem: (k: string) => { delete lsStore[k]; },
      clear: () => { Object.keys(lsStore).forEach(k => delete lsStore[k]); },
    },
    configurable: true,
  });
});

const SAMPLE_JOB = {
  id: 'ms-1',
  title: 'Senior Azure Engineer',
  company: 'Microsoft',
  location: 'Hyderabad, India',
  descriptionSnippet: 'Build cloud infra',
  applyUrl: 'https://careers.microsoft.com/job/1',
  postedDate: '2026-05-01',
  classifiedRole: 'devops-engineer',
  sourceCompany: 'microsoft',
};

describe('createJobSnapshot', () => {
  it('captures durable fields and savedAt', () => {
    const snap = createJobSnapshot(SAMPLE_JOB);
    expect(snap?.id).toBe('ms-1');
    expect(snap?.title).toBe(SAMPLE_JOB.title);
    expect(snap?.applyUrl).toBe(SAMPLE_JOB.applyUrl);
    expect(typeof snap?.savedAt).toBe('number');
  });

  it('returns null without id', () => {
    expect(createJobSnapshot({ title: 'x' } as any)).toBeNull();
  });
});

describe('toggleSavedJob', () => {
  it('adds then removes a job', () => {
    const added = toggleSavedJob({}, SAMPLE_JOB);
    expect(added['ms-1']?.title).toBe(SAMPLE_JOB.title);
    const removed = toggleSavedJob(added, SAMPLE_JOB);
    expect(removed['ms-1']).toBeUndefined();
  });
});

describe('persist + load', () => {
  it('round-trips snapshots through localStorage', () => {
    const map = toggleSavedJob({}, SAMPLE_JOB);
    persistSavedJobs(map);
    expect(JSON.parse(lsStore[SAVED_JOBS_KEY])['ms-1'].title).toBe(SAMPLE_JOB.title);
    expect(loadSavedJobs()['ms-1'].title).toBe(SAMPLE_JOB.title);
  });

  it('migrates legacy ID-only list', () => {
    lsStore[LEGACY_SAVED_IDS_KEY] = JSON.stringify(['legacy-1', 'legacy-2']);
    const loaded = loadSavedJobs();
    expect(loaded['legacy-1']?._migrated).toBe(true);
    expect(loaded['legacy-2']?.id).toBe('legacy-2');
  });
});

describe('resolveSavedJobsList', () => {
  it('prefers live jobs when available', () => {
    const map = toggleSavedJob({}, SAMPLE_JOB);
    const live = [{ ...SAMPLE_JOB, title: 'Updated Title' }];
    const list = resolveSavedJobsList(map, live);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Updated Title');
  });

  it('falls back to snapshot when job leaves live results', () => {
    const map = toggleSavedJob({}, SAMPLE_JOB);
    const list = resolveSavedJobsList(map, []);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe(SAMPLE_JOB.title);
    expect(list[0].fromSnapshot).toBe(true);
  });

  it('skips bare migrated shells not present in live set', () => {
    const list = resolveSavedJobsList(
      { 'x-1': { id: 'x-1', title: 'Saved job', _migrated: true, savedAt: 1 } },
      []
    );
    expect(list).toHaveLength(0);
  });
});

describe('refreshSavedSnapshots', () => {
  it('upgrades migrated shells from live data', () => {
    const saved = {
      'ms-1': { id: 'ms-1', title: 'Saved job', _migrated: true, savedAt: 100 },
    };
    const next = refreshSavedSnapshots(saved, [SAMPLE_JOB]);
    expect(next['ms-1'].title).toBe(SAMPLE_JOB.title);
    expect(next['ms-1']._migrated).toBeUndefined();
    expect(next['ms-1'].savedAt).toBe(100);
  });
});

describe('savedJobIdSet', () => {
  it('returns a Set of ids', () => {
    const set = savedJobIdSet({ a: { id: 'a' }, b: { id: 'b' } });
    expect(set.has('a')).toBe(true);
    expect(set.size).toBe(2);
  });
});
