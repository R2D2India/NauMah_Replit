/**
 * Production-grade localStorage data layer 
 * This serves as a fallback when session-based data persistence isn't reliable
 */

// Key constants
const STORAGE_PREFIX = 'naumah_';
const KEYS = {
  PREGNANCY_DATA: STORAGE_PREFIX + 'pregnancy_data',
  USER_PREGNANCY_DATA: STORAGE_PREFIX + 'user_pregnancy_data', // User-specified values that take precedence
  BABY_DEVELOPMENT: STORAGE_PREFIX + 'baby_development_',
  LAST_UPDATE: STORAGE_PREFIX + 'last_update',
  PREVENT_OVERWRITE: STORAGE_PREFIX + 'prevent_overwrite',
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
 * Get pregnancy data from localStorage with user data prioritization
 */
export function getLocalPregnancyData(): PregnancyData | null {
  if (!isStorageAvailable()) return null;
  
  try {
    // Check for user-specified data which takes highest precedence
    const userData = localStorage.getItem(KEYS.USER_PREGNANCY_DATA);
    
    // Check for API-provided data as a fallback
    const apiData = localStorage.getItem(KEYS.PREGNANCY_DATA);
    
    // If we have both, compare them
    if (userData && apiData) {
      const parsedUserData = JSON.parse(userData);
      const parsedApiData = JSON.parse(apiData);
      
      // If user data has explicit _userSpecified flag, it takes precedence
      if (parsedUserData._userSpecified === true) {
        console.log("Using user-specified pregnancy data with explicit priority:", parsedUserData);
        return parsedUserData;
      }
      
      // Compare timestamps if available to use the newest data
      const userTimestamp = parsedUserData._timestamp || 0;
      const apiTimestamp = parsedApiData._serverTimestamp || 0;
      
      if (userTimestamp > apiTimestamp) {
        console.log(`Using user data (timestamp: ${userTimestamp}) which is newer than API data (timestamp: ${apiTimestamp})`);
        return parsedUserData;
      } else {
        console.log(`Using API data (timestamp: ${apiTimestamp}) which is newer than user data (timestamp: ${userTimestamp})`);
        return parsedApiData;
      }
    }
    
    // If we only have user data
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      console.log("Using user-specified pregnancy data only:", parsedUserData);
      return parsedUserData;
    }
    
    // If we only have API data
    if (apiData) {
      const parsedApiData = JSON.parse(apiData);
      console.log("Using API-provided pregnancy data:", parsedApiData);
      return parsedApiData;
    }
    
    // No data available
    return null;
  } catch (e) {
    console.error('Error retrieving pregnancy data from localStorage:', e);
    return null;
  }
}

/**
 * Save pregnancy data from API to localStorage
 */
export function saveLocalPregnancyData(data: PregnancyData): boolean {
  if (!isStorageAvailable()) return false;
  
  try {
    // Check if overwrite prevention is enabled
    const preventOverwrite = localStorage.getItem(KEYS.PREVENT_OVERWRITE) === 'true';
    const userData = localStorage.getItem(KEYS.USER_PREGNANCY_DATA);
    
    if (preventOverwrite && userData) {
      // Don't overwrite user data with API data
      console.log("Skip saving API data due to overwrite prevention");
      return false;
    }
    
    localStorage.setItem(KEYS.PREGNANCY_DATA, JSON.stringify(data));
    localStorage.setItem(KEYS.LAST_UPDATE, new Date().toISOString());
    return true;
  } catch (e) {
    console.error('Error saving pregnancy data to localStorage:', e);
    return false;
  }
}

/**
 * Save user-specified pregnancy data to localStorage
 * This takes precedence over API-provided data
 */
export function saveUserPregnancyData(data: PregnancyData): boolean {
  if (!isStorageAvailable()) return false;
  
  try {
    // Get current time for consistent timestamps
    const now = new Date();
    const timestamp = now.getTime();
    const isoString = now.toISOString();
    
    // Add metadata flags for tracking and priority
    const enhancedData = {
      ...data,
      _userSpecified: true,
      _timestamp: timestamp,
      _lastUpdated: isoString,
      _source: 'user',
      _priority: 100 // Highest priority for user data
    };
    
    // Log what we're storing
    console.log("Saving user-specified pregnancy data:", enhancedData);
    
    // Save to user data storage
    localStorage.setItem(KEYS.USER_PREGNANCY_DATA, JSON.stringify(enhancedData));
    localStorage.setItem(KEYS.LAST_UPDATE, isoString);
    
    // Set the prevent overwrite flag to block API data overwrites
    localStorage.setItem(KEYS.PREVENT_OVERWRITE, 'true');
    
    // Dispatch a storage event for other tabs to detect changes
    try {
      // Create a custom event with the updated data
      const event = new CustomEvent('storage', {
        detail: {
          key: KEYS.USER_PREGNANCY_DATA,
          newValue: JSON.stringify(enhancedData)
        }
      });
      window.dispatchEvent(event);
    } catch (eventError) {
      console.warn("Could not dispatch custom event:", eventError);
    }
    
    return true;
  } catch (e) {
    console.error('Error saving user pregnancy data to localStorage:', e);
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