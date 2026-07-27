/**
 * Client-side saved-job snapshots.
 *
 * Stores full job objects (not just IDs) so bookmarks survive scrape refresh,
 * cache churn, and jobs dropping out of the live result set.
 *
 * Storage keys:
 *   career-radar-saved-jobs  — map of id → snapshot
 *   career-radar-saved       — legacy ID array (migrated on read, then cleared)
 */

export const SAVED_JOBS_KEY = 'career-radar-saved-jobs';
export const LEGACY_SAVED_IDS_KEY = 'career-radar-saved';

const SNAPSHOT_FIELDS = [
  'id',
  'title',
  'company',
  'location',
  'descriptionSnippet',
  'applyUrl',
  'postedDate',
  'classifiedRole',
  'sourceCompany',
];

/**
 * Build a durable snapshot from a live job object.
 * @param {object} job
 * @returns {object|null}
 */
export function createJobSnapshot(job) {
  if (!job?.id) return null;
  const snapshot = {};
  for (const key of SNAPSHOT_FIELDS) {
    if (job[key] !== undefined && job[key] !== null) {
      snapshot[key] = job[key];
    }
  }
  snapshot.savedAt = Date.now();
  return snapshot;
}

/**
 * Read saved job snapshots from localStorage (with legacy ID migration).
 * @returns {Record<string, object>}
 */
export function loadSavedJobs() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(SAVED_JOBS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fall through to legacy migration
  }

  // Migrate legacy ID-only list into empty shell snapshots so IDs are preserved
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_SAVED_IDS_KEY) || '[]');
    if (Array.isArray(legacy) && legacy.length > 0) {
      const migrated = {};
      for (const id of legacy) {
        if (id) {
          migrated[id] = { id, title: 'Saved job', company: '', location: '', savedAt: Date.now(), _migrated: true };
        }
      }
      persistSavedJobs(migrated);
      try { localStorage.removeItem(LEGACY_SAVED_IDS_KEY); } catch {}
      return migrated;
    }
  } catch {}

  return {};
}

/**
 * Persist saved job map to localStorage.
 * @param {Record<string, object>} savedJobs
 */
export function persistSavedJobs(savedJobs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(savedJobs || {}));
    // Keep legacy key in sync as ID list for any external readers
    localStorage.setItem(LEGACY_SAVED_IDS_KEY, JSON.stringify(Object.keys(savedJobs || {})));
  } catch {}
}

/**
 * Toggle a job in the saved map. Returns the next map.
 * @param {Record<string, object>} current
 * @param {object} job
 * @returns {Record<string, object>}
 */
export function toggleSavedJob(current, job) {
  if (!job?.id) return current || {};
  const next = { ...(current || {}) };
  if (next[job.id]) {
    delete next[job.id];
    return next;
  }
  const snapshot = createJobSnapshot(job);
  if (snapshot) next[job.id] = snapshot;
  return next;
}

/**
 * Merge live jobs into existing snapshots (refresh stale fields, keep savedAt).
 * Only updates jobs that are already saved.
 * @param {Record<string, object>} savedJobs
 * @param {object[]} liveJobs
 * @returns {Record<string, object>}
 */
export function refreshSavedSnapshots(savedJobs, liveJobs) {
  if (!savedJobs || !liveJobs?.length) return savedJobs || {};
  let changed = false;
  const next = { ...savedJobs };

  for (const job of liveJobs) {
    if (!job?.id || !next[job.id]) continue;
    const prev = next[job.id];
    const refreshed = createJobSnapshot(job);
    if (!refreshed) continue;
    refreshed.savedAt = prev.savedAt || refreshed.savedAt;
    // Only rewrite if meaningful fields changed
    if (
      prev.title !== refreshed.title ||
      prev.company !== refreshed.company ||
      prev.location !== refreshed.location ||
      prev.applyUrl !== refreshed.applyUrl ||
      prev.descriptionSnippet !== refreshed.descriptionSnippet ||
      prev._migrated
    ) {
      next[job.id] = refreshed;
      changed = true;
    }
  }

  return changed ? next : savedJobs;
}

/**
 * Build the list of saved jobs for display.
 * Prefer live job objects when present; otherwise use the stored snapshot.
 * @param {Record<string, object>} savedJobs
 * @param {object[]} liveJobs
 * @returns {object[]}
 */
export function resolveSavedJobsList(savedJobs, liveJobs = []) {
  const liveById = new Map((liveJobs || []).map(j => [j.id, j]));
  const list = [];

  for (const [id, snapshot] of Object.entries(savedJobs || {})) {
    const live = liveById.get(id);
    if (live) {
      list.push({ ...live, savedAt: snapshot.savedAt });
    } else if (snapshot && !snapshot._migrated) {
      list.push({ ...snapshot, fromSnapshot: true });
    } else if (snapshot?._migrated) {
      // Legacy ID without a full snapshot and not in live set — skip empty shells
      continue;
    }
  }

  // Newest saves first
  list.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  return list;
}

/**
 * @param {Record<string, object>} savedJobs
 * @returns {Set<string>}
 */
export function savedJobIdSet(savedJobs) {
  return new Set(Object.keys(savedJobs || {}));
}
