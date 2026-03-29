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
  node["amenity"="cafe"](${bbox});
  way["amenity"="cafe"](${bbox});
  node["amenity"="restaurant"](${bbox});
  way["amenity"="restaurant"](${bbox});
  node["amenity"="pub"](${bbox});
  way["amenity"="pub"](${bbox});
  node["amenity"="place_of_worship"](${bbox});
  way["amenity"="place_of_worship"](${bbox});
  node["tourism"="museum"](${bbox});
  way["tourism"="museum"](${bbox});
  node["tourism"="artwork"](${bbox});
  node["tourism"="attraction"](${bbox});
  way["tourism"="attraction"](${bbox});
  node["historic"](${bbox});
  way["historic"](${bbox});
  node["leisure"="park"](${bbox});
  way["leisure"="park"](${bbox});
  node["leisure"="garden"](${bbox});
  way["leisure"="garden"](${bbox});
  node["shop"="craft"](${bbox});
  way["shop"="craft"](${bbox});
  node["shop"="bakery"](${bbox});
  way["shop"="bakery"](${bbox});
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
