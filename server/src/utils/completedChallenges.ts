/**
 * Bug 09 — Repeatable Challenges Filter
 *
 * Checks a UserCompletedChallenges table to filter out POIs
 * the user has already completed before serving new ones.
 *
 * This module works with any data source that implements the
 * CompletedChallengesStore interface (in-memory, Supabase, etc.).
 */

export interface CompletedChallengeRecord {
  userId: string;
  poiId: string;
  completedAt: number; // timestamp
}

export interface CompletedChallengesStore {
  getCompletedByUser(userId: string): Promise<CompletedChallengeRecord[]>;
  markCompleted(userId: string, poiId: string): Promise<void>;
}

// ── In-Memory Store (swap for Supabase when ready) ──────────────

const store: CompletedChallengeRecord[] = [];

export const inMemoryStore: CompletedChallengesStore = {
  async getCompletedByUser(userId: string) {
    return store.filter((r) => r.userId === userId);
  },
  async markCompleted(userId: string, poiId: string) {
    // Prevent duplicate entries
    const exists = store.some((r) => r.userId === userId && r.poiId === poiId);
    if (!exists) {
      store.push({ userId, poiId, completedAt: Date.now() });
    }
  },
};

// ── Filter Logic ────────────────────────────────────────────────

interface POILike {
  id: string;
  [key: string]: unknown;
}

/**
 * Filters out POIs that the user has already completed.
 * Returns only POIs the user hasn't visited yet.
 */
export async function filterUncompletedPOIs<T extends POILike>(
  userId: string,
  pois: T[],
  challengeStore: CompletedChallengesStore = inMemoryStore,
): Promise<T[]> {
  const completed = await challengeStore.getCompletedByUser(userId);
  const completedIds = new Set(completed.map((r) => r.poiId));

  return pois.filter((poi) => !completedIds.has(poi.id));
}
