/**
 * Builds an Overpass QL query for amenity=bar, shop=craft, historic=memorial
 * within a bounding box (south, west, north, east).
 */
export function buildOverpassQuery(
  south: number,
  west: number,
  north: number,
  east: number,
): string {
  const bbox = `${south},${west},${north},${east}`;

  return `[out:json][timeout:25];
(
  node["amenity"="bar"](${bbox});
  way["amenity"="bar"](${bbox});
  node["shop"="craft"](${bbox});
  way["shop"="craft"](${bbox});
  node["historic"="memorial"](${bbox});
  way["historic"="memorial"](${bbox});
);
out center body;
>;
out skel qt;`;
}

/**
 * Fetches POIs from Overpass API using the built query.
 */
export async function fetchOverpassPOIs(
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<OverpassElement[]> {
  const query = buildOverpassQuery(south, west, north, east);

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = (await response.json()) as OverpassResponse;
  return data.elements;
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}
