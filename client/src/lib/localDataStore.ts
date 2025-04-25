/**
 * Production-grade localStorage data layer 
 * This serves as a fallback when session-based data persistence isn't reliable
 */

// Key constants
const STORAGE_PREFIX = 'naumah_';
const KEYS = {
  PREGNANCY_DATA: STORAGE_PREFIX + 'pregnancy_data',
  BABY_DEVELOPMENT: STORAGE_PREFIX + 'baby_development_',
  LAST_UPDATE: STORAGE_PREFIX + 'last_update',
};

// Types
interface PregnancyData {
  currentWeek: number;
  dueDate?: string;
  userId?: number;
  [key: string]: any;
}

interface BabyDevelopmentData {
  description: string;
  keyDevelopments: string[];
  funFact?: string;
  size?: string;
  imageDescription?: string;
  week: number;
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '_test_';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.error('localStorage not available:', e);
    return false;
  }
}

/**
 * Get pregnancy data from localStorage
 */
export function getLocalPregnancyData(): PregnancyData | null {
  if (!isStorageAvailable()) return null;
  
  try {
    const data = localStorage.getItem(KEYS.PREGNANCY_DATA);
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (e) {
    console.error('Error retrieving pregnancy data from localStorage:', e);
    return null;
  }
}

/**
 * Save pregnancy data to localStorage
 */
export function saveLocalPregnancyData(data: PregnancyData): boolean {
  if (!isStorageAvailable()) return false;
  
  try {
    localStorage.setItem(KEYS.PREGNANCY_DATA, JSON.stringify(data));
    localStorage.setItem(KEYS.LAST_UPDATE, new Date().toISOString());
    return true;
  } catch (e) {
    console.error('Error saving pregnancy data to localStorage:', e);
    return false;
  }
}

/**
 * Get baby development data for a specific week
 */
export function getLocalBabyDevelopmentData(week: number): BabyDevelopmentData | null {
  if (!isStorageAvailable()) return null;
  
  try {
    const data = localStorage.getItem(KEYS.BABY_DEVELOPMENT + week);
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error retrieving baby development data for week ${week} from localStorage:`, e);
    return null;
  }
}

/**
 * Save baby development data to localStorage
 */
export function saveLocalBabyDevelopmentData(week: number, data: BabyDevelopmentData): boolean {
  if (!isStorageAvailable()) return false;
  
  try {
    // Add the week to the data
    const dataWithWeek = { ...data, week };
    localStorage.setItem(KEYS.BABY_DEVELOPMENT + week, JSON.stringify(dataWithWeek));
    return true;
  } catch (e) {
    console.error(`Error saving baby development data for week ${week} to localStorage:`, e);
    return false;
  }
}

/**
 * Get timestamp of last update
 */
export function getLastUpdateTimestamp(): string | null {
  if (!isStorageAvailable()) return null;
  
  try {
    return localStorage.getItem(KEYS.LAST_UPDATE);
  } catch (e) {
    console.error('Error retrieving last update timestamp from localStorage:', e);
    return null;
  }
}

/**
 * Clear all stored data (for testing/logout)
 */
export function clearAllLocalData(): boolean {
  if (!isStorageAvailable()) return false;
  
  try {
    // Only clear our own keys
    Object.values(KEYS).forEach(key => {
      // Handle baby development keys which include the week number
      if (key.includes(KEYS.BABY_DEVELOPMENT)) {
        // Get all keys that start with the baby development prefix
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey && storageKey.startsWith(KEYS.BABY_DEVELOPMENT)) {
            localStorage.removeItem(storageKey);
          }
        }
      } else {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (e) {
    console.error('Error clearing local data:', e);
    return false;
  }
}