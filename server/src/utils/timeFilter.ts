/**
 * Bug 05 — Timing Filters
 *
 * Filters POIs by comparing their `opening_hours` string against the current
 * server time. Supports common OSM opening_hours formats:
 *   - "Mo-Fr 09:00-18:00"
 *   - "Mo-Su 08:00-22:00"
 *   - "24/7"
 *   - "Mo-Fr 09:00-13:00,14:00-18:00" (split shifts)
 *   - "Sa-Su 10:00-16:00"
 *
 * POIs without opening_hours are assumed always open.
 */

interface POIWithHours {
  opening_hours?: string;
  [key: string]: unknown;
}

const DAY_MAP: Record<string, number> = {
  Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0,
};

const DAY_ABBREVS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Returns only POIs that are currently open based on their opening_hours.
 */
export function filterOpenPOIs<T extends POIWithHours>(pois: T[], now?: Date): T[] {
  const currentTime = now ?? new Date();
  return pois.filter((poi) => isOpenNow(poi.opening_hours, currentTime));
}

/**
 * Checks if a single opening_hours string indicates the place is currently open.
 */
export function isOpenNow(openingHours: string | undefined, now?: Date): boolean {
  const currentTime = now ?? new Date();

  // No hours listed → assume always open
  if (!openingHours || openingHours.trim() === '') return true;

  const normalized = openingHours.trim();

  // 24/7 is always open
  if (normalized === '24/7') return true;

  const currentDay = currentTime.getDay(); // 0=Sun, 1=Mon, ...6=Sat
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Split semicolons for multiple rules: "Mo-Fr 09:00-18:00; Sa 10:00-14:00"
  const rules = normalized.split(';').map((r) => r.trim());

  for (const rule of rules) {
    if (matchesRule(rule, currentDay, currentMinutes)) {
      return true;
    }
  }

  return false;
}

function matchesRule(rule: string, currentDay: number, currentMinutes: number): boolean {
  // Split into day-part and time-part(s)
  // e.g. "Mo-Fr 09:00-18:00" → ["Mo-Fr", "09:00-18:00"]
  // e.g. "09:00-18:00" (no day prefix → every day)
  const parts = rule.split(/\s+/);

  let dayPart: string | null = null;
  let timeParts: string[];

  if (parts.length >= 2 && /^[A-Z]/.test(parts[0])) {
    dayPart = parts[0];
    timeParts = parts.slice(1).join(' ').split(',');
  } else {
    // No day prefix — applies every day
    timeParts = parts.join(' ').split(',');
  }

  // Check if current day matches
  if (dayPart && !isDayInRange(dayPart, currentDay)) {
    return false;
  }

  // Check if current time falls in any time range
  for (const tp of timeParts) {
    const trimmed = tp.trim();
    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    if (!timeMatch) continue;

    const startMin = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
    const endMin = parseInt(timeMatch[3]) * 60 + parseInt(timeMatch[4]);

    // Handle overnight ranges (e.g. 22:00-02:00)
    if (endMin <= startMin) {
      if (currentMinutes >= startMin || currentMinutes < endMin) return true;
    } else {
      if (currentMinutes >= startMin && currentMinutes < endMin) return true;
    }
  }

  return false;
}

function isDayInRange(dayPart: string, currentDay: number): boolean {
  // Handle comma-separated days: "Mo,We,Fr"
  const dayGroups = dayPart.split(',');

  for (const group of dayGroups) {
    const rangeParts = group.trim().split('-');

    if (rangeParts.length === 2) {
      // Range: "Mo-Fr"
      const start = DAY_MAP[rangeParts[0]];
      const end = DAY_MAP[rangeParts[1]];
      if (start === undefined || end === undefined) continue;

      if (start <= end) {
        if (currentDay >= start && currentDay <= end) return true;
      } else {
        // Wrap around: "Fr-Mo" means Fr, Sa, Su, Mo
        if (currentDay >= start || currentDay <= end) return true;
      }
    } else {
      // Single day: "Sa"
      const day = DAY_MAP[rangeParts[0].trim()];
      if (day !== undefined && day === currentDay) return true;
    }
  }

  return false;
}
