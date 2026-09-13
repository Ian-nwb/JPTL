import staticCountries from '../data/countries.json';

const API_URL = 'https://countriesnow.space/api/v0.1/countries/codes';
const CACHE_KEY = 'jptl_cached_countries_v1';

// Priority countries shown at the top of selection lists
const PRIORITY_CODES = ['PH', 'US', 'CA', 'GB', 'SG', 'AU', 'JP', 'AE', 'IN', 'DE', 'FR', 'KR'];

/**
 * Converts 2-letter ISO country code (e.g. 'PH') to its Unicode flag emoji
 */
export function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Formats a raw API country object into standardized JPTL Country model
 */
function formatCountry(item) {
  const code = item.code || item.iso2 || '';
  const dialCode = item.dial_code ? item.dial_code.replace(/\s+/g, '') : (item.dialCode || '');
  return {
    name: item.name || '',
    code: code.toUpperCase(),
    dialCode: dialCode.startsWith('+') ? dialCode : `+${dialCode}`,
    flag: item.flag || getFlagEmoji(code),
  };
}

/**
 * Orders countries placing priority countries first, then alphabetical by name
 */
export function sortCountries(countries) {
  return [...countries].sort((a, b) => {
    const aPriority = PRIORITY_CODES.indexOf(a.code);
    const bPriority = PRIORITY_CODES.indexOf(b.code);

    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;

    return a.name.localeCompare(b.name);
  });
}

/**
 * Fetches countries from cache or live API, falling back to static bundled dataset
 */
export async function getCountries() {
  // 1. Check in-memory/sessionStorage cache
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sortCountries(parsed);
      }
    }
  } catch (_err) {
    // SessionStorage may be disabled in private browsing; ignore
  }

  // 2. Attempt fetching from public CountriesNow API
  try {
    const response = await fetch(API_URL, { signal: AbortSignal.timeout(4000) });
    if (response.ok) {
      const result = await response.json();
      if (result && Array.isArray(result.data) && result.data.length > 0) {
        const mapped = result.data
          .map(formatCountry)
          .filter((c) => c.dialCode && c.dialCode !== '+');

        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
        } catch (_err) {
          // ignore cache write error
        }

        return sortCountries(mapped);
      }
    }
  } catch (err) {
    console.warn('Live country API fetch failed or timed out, using bundled dataset:', err.message);
  }

  // 3. Fallback to bundled dataset
  return sortCountries(staticCountries);
}

/**
 * Filter countries by search query (matches name, ISO code, or dial code)
 */
export function filterCountries(countries, query) {
  if (!query || !query.trim()) return countries;
  const q = query.trim().toLowerCase();
  return countries.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dialCode.toLowerCase().includes(q)
  );
}
