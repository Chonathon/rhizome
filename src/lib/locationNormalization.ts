/**
 * Location normalization utilities for clustering artists by geography.
 * Maps cities, regions, and alternative country names to standardized country codes.
 */

// Map of cities/regions to their parent country
export const CITY_TO_COUNTRY: Record<string, string> = {
  // United States cities
  'Los Angeles': 'United States',
  'New York': 'United States',
  'Chicago': 'United States',
  'Brooklyn': 'United States',
  'Portland': 'United States',
  'Seattle': 'United States',
  'Atlanta': 'United States',
  'Philadelphia': 'United States',
  'Boston': 'United States',
  'San Francisco': 'United States',
  'Austin': 'United States',
  'Nashville': 'United States',
  'Detroit': 'United States',
  'Miami': 'United States',
  'Denver': 'United States',
  'Minneapolis': 'United States',
  'Oakland': 'United States',
  'Houston': 'United States',
  'Dallas': 'United States',
  'Phoenix': 'United States',
  'San Diego': 'United States',
  'New Orleans': 'United States',
  'Washington': 'United States',
  'Baltimore': 'United States',
  'Cleveland': 'United States',
  'Pittsburgh': 'United States',
  'Memphis': 'United States',
  'Las Vegas': 'United States',
  'Richmond': 'United States',
  'Providence': 'United States',
  'Carrboro': 'United States',

  // US states/regions
  'California': 'United States',
  'Texas': 'United States',
  'New Jersey': 'United States',
  'Massachusetts': 'United States',
  'Illinois': 'United States',
  'Georgia': 'United States',
  'North Carolina': 'United States',
  'Ohio': 'United States',
  'Pennsylvania': 'United States',
  'Florida': 'United States',
  'Michigan': 'United States',
  'Washington State': 'United States',

  // United Kingdom cities
  'London': 'United Kingdom',
  'Manchester': 'United Kingdom',
  'Birmingham': 'United Kingdom',
  'Bristol': 'United Kingdom',
  'Leeds': 'United Kingdom',
  'Liverpool': 'United Kingdom',
  'Glasgow': 'United Kingdom',
  'Edinburgh': 'United Kingdom',
  'Sheffield': 'United Kingdom',
  'Newcastle': 'United Kingdom',
  'Brighton': 'United Kingdom',
  'Nottingham': 'United Kingdom',
  'Cardiff': 'United Kingdom',
  'Belfast': 'United Kingdom',

  // UK regions
  'England': 'United Kingdom',
  'Scotland': 'United Kingdom',
  'Wales': 'United Kingdom',
  'Northern Ireland': 'United Kingdom',

  // Canada cities
  'Toronto': 'Canada',
  'Vancouver': 'Canada',
  'Montréal': 'Canada',
  'Montreal': 'Canada',
  'Calgary': 'Canada',
  'Ottawa': 'Canada',
  'Edmonton': 'Canada',
  'Winnipeg': 'Canada',
  'Halifax': 'Canada',

  // Canadian provinces
  'Québec': 'Canada',
  'Quebec': 'Canada',
  'Ontario': 'Canada',
  'British Columbia': 'Canada',
  'Alberta': 'Canada',

  // Germany cities
  'Berlin': 'Germany',
  'Hamburg': 'Germany',
  'Munich': 'Germany',
  'Cologne': 'Germany',
  'Frankfurt': 'Germany',
  'Düsseldorf': 'Germany',
  'Leipzig': 'Germany',
  'Dresden': 'Germany',
  'Stuttgart': 'Germany',
  'Hannover': 'Germany',

  // France cities
  'Paris': 'France',
  'Lyon': 'France',
  'Marseille': 'France',
  'Toulouse': 'France',
  'Bordeaux': 'France',
  'Nantes': 'France',
  'Lille': 'France',
  'Dieppe': 'France',

  // Japan cities
  'Tokyo': 'Japan',
  'Osaka': 'Japan',
  'Kyoto': 'Japan',
  'Nagoya': 'Japan',
  'Yokohama': 'Japan',
  'Sapporo': 'Japan',
  'Fukuoka': 'Japan',

  // Australia cities
  'Melbourne': 'Australia',
  'Sydney': 'Australia',
  'Brisbane': 'Australia',
  'Perth': 'Australia',
  'Adelaide': 'Australia',

  // Russia cities
  'Moscow': 'Russia',
  'Sankt-Peterburg': 'Russia',
  'Saint Petersburg': 'Russia',
  'St. Petersburg': 'Russia',

  // Netherlands cities
  'Amsterdam': 'Netherlands',
  'Rotterdam': 'Netherlands',
  'The Hague': 'Netherlands',
  'Utrecht': 'Netherlands',

  // Sweden cities
  'Stockholm': 'Sweden',
  'Gothenburg': 'Sweden',
  'Malmö': 'Sweden',

  // Italy cities
  'Rome': 'Italy',
  'Milan': 'Italy',
  'Naples': 'Italy',
  'Turin': 'Italy',
  'Florence': 'Italy',
  'Bologna': 'Italy',

  // Spain cities
  'Madrid': 'Spain',
  'Barcelona': 'Spain',
  'Valencia': 'Spain',
  'Seville': 'Spain',
  'Bilbao': 'Spain',

  // Other notable cities
  'Wellington': 'New Zealand',
  'Auckland': 'New Zealand',
  'Buenos Aires': 'Argentina',
  'São Paulo': 'Brazil',
  'Rio de Janeiro': 'Brazil',
  'Athens': 'Greece',
  'Copenhagen': 'Denmark',
  'Oslo': 'Norway',
  'Helsinki': 'Finland',
  'Vienna': 'Austria',
  'Zürich': 'Switzerland',
  'Geneva': 'Switzerland',
  'Brussels': 'Belgium',
  'Dublin': 'Ireland',
  'Lisbon': 'Portugal',
  'Prague': 'Czechia',
  'Warsaw': 'Poland',
  'Kraków': 'Poland',
  'Budapest': 'Hungary',
  'Bucharest': 'Romania',
  'Sofia': 'Bulgaria',
  'Belgrade': 'Serbia',
  'Zagreb': 'Croatia',
  'Kiev': 'Ukraine',
  'Kyiv': 'Ukraine',
  'Tel Aviv': 'Israel',
  'Jerusalem': 'Israel',
  'Mazatlan': 'Mexico',
  'Mexico City': 'Mexico',
  'Bogotá': 'Colombia',
  'Medellín': 'Colombia',
  'Lima': 'Peru',
  'Santiago': 'Chile',
  'Havana': 'Cuba',
  'Seoul': 'South Korea',
  'Busan': 'South Korea',
  'Beijing': 'China',
  'Shanghai': 'China',
  'Taipei': 'Taiwan',
  'Bangkok': 'Thailand',
  'Singapore': 'Singapore',
  'Jakarta': 'Indonesia',
  'Mumbai': 'India',
  'Delhi': 'India',
  'Bangalore': 'India',
  'Cape Town': 'South Africa',
  'Johannesburg': 'South Africa',
  'Lagos': 'Nigeria',
  'Nairobi': 'Kenya',
};

// Alternative country names/spellings to standardized names
const COUNTRY_ALIASES: Record<string, string> = {
  'Türkiye': 'Turkey',
  'Czech Republic': 'Czechia',
  'The Netherlands': 'Netherlands',
  'Korea': 'South Korea',
  'Republic of Korea': 'South Korea',
  'UK': 'United Kingdom',
  'USA': 'United States',
  'US': 'United States',
  'America': 'United States',
  'Great Britain': 'United Kingdom',
  'Britain': 'United Kingdom',
  'Deutschland': 'Germany',
  'Nippon': 'Japan',
  'Brasil': 'Brazil',
  'Россия': 'Russia',
  'España': 'Spain',
  'Italia': 'Italy',
  'République française': 'France',
  '中国': 'China',
  '日本': 'Japan',
  '한국': 'South Korea',
};

// Geographic regions for broader similarity matching
export const GEOGRAPHIC_REGIONS: Record<string, string[]> = {
  'North America': ['United States', 'Canada', 'Mexico'],
  'Central America & Caribbean': ['Puerto Rico', 'Jamaica', 'Cuba', 'Dominican Republic', 'Haiti', 'Trinidad and Tobago'],
  'South America': ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Ecuador', 'Bolivia', 'Uruguay', 'Paraguay'],
  'Western Europe': ['United Kingdom', 'France', 'Germany', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Ireland'],
  'Northern Europe': ['Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland', 'Estonia', 'Latvia', 'Lithuania'],
  'Southern Europe': ['Italy', 'Spain', 'Portugal', 'Greece', 'Malta', 'Cyprus'],
  'Eastern Europe': ['Russia', 'Poland', 'Czechia', 'Hungary', 'Romania', 'Bulgaria', 'Ukraine', 'Belarus', 'Slovakia', 'Serbia', 'Croatia', 'Slovenia'],
  'East Asia': ['Japan', 'South Korea', 'China', 'Taiwan', 'Hong Kong'],
  'Southeast Asia': ['Thailand', 'Indonesia', 'Philippines', 'Malaysia', 'Singapore', 'Vietnam'],
  'South Asia': ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal'],
  'Middle East': ['Israel', 'Iran', 'Turkey', 'Lebanon', 'Saudi Arabia', 'United Arab Emirates'],
  'Oceania': ['Australia', 'New Zealand'],
  'Africa': ['South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Morocco', 'Ethiopia', 'Ghana'],
};

// Build reverse lookup: country -> region
const COUNTRY_TO_REGION: Map<string, string> = new Map();
Object.entries(GEOGRAPHIC_REGIONS).forEach(([region, countries]) => {
  countries.forEach(country => {
    COUNTRY_TO_REGION.set(country, region);
  });
});

/**
 * Normalizes a location string to a standardized country name.
 * Returns null if location cannot be normalized.
 */
export function normalizeLocation(location: string | null | undefined): string | null {
  if (!location || location.trim() === '') {
    return null;
  }

  const trimmed = location.trim();

  // Check if it's a city/region that maps to a country
  if (CITY_TO_COUNTRY[trimmed]) {
    return CITY_TO_COUNTRY[trimmed];
  }

  // Check if it's an alternative country name
  if (COUNTRY_ALIASES[trimmed]) {
    return COUNTRY_ALIASES[trimmed];
  }

  // Check if it's already a known country in our regions
  if (COUNTRY_TO_REGION.has(trimmed)) {
    return trimmed;
  }

  // Return as-is if we can't normalize (might be a valid country we don't have mapped)
  return trimmed;
}

/**
 * Gets the geographic region for a normalized country.
 */
export function getRegion(country: string | null): string | null {
  if (!country) return null;
  return COUNTRY_TO_REGION.get(country) ?? null;
}

/**
 * Calculates location similarity between two artists.
 * Returns a value between 0 and 1:
 * - 1.0: Same country
 * - 0.5: Same geographic region
 * - 0.0: Different regions or unknown
 */
export function calculateLocationSimilarity(
  locationA: string | null | undefined,
  locationB: string | null | undefined
): number {
  const countryA = normalizeLocation(locationA);
  const countryB = normalizeLocation(locationB);

  // If either location is unknown, return 0
  if (!countryA || !countryB) {
    return 0;
  }

  // Same country = full similarity
  if (countryA === countryB) {
    return 1.0;
  }

  // Check if same region
  const regionA = getRegion(countryA);
  const regionB = getRegion(countryB);

  if (regionA && regionB && regionA === regionB) {
    return 0.5;
  }

  // Different regions
  return 0;
}

/**
 * Pre-computes normalized locations for a set of artists.
 * Returns a Map of artistId -> normalized country name.
 */
export function buildNormalizedLocationMap(
  artists: Array<{ id: string; location?: string | null }>
): Map<string, string | null> {
  const locationMap = new Map<string, string | null>();

  artists.forEach(artist => {
    locationMap.set(artist.id, normalizeLocation(artist.location));
  });

  return locationMap;
}
