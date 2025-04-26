import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  // Determine if this is an admin endpoint that needs Basic Auth
  const isAdminEndpoint = url.includes('/api/admin/');
  
  // Set up headers
  let headers: HeadersInit = {
    ...(options?.headers || {}),
  };
  
  // Add Basic Auth for admin endpoints (if not already provided)
  if (isAdminEndpoint && !headers['Authorization']) {
    const adminEmail = "sandeep@fastest.health";
    const adminPassword = "Fastest@2004";
    const basicAuthHeader = `Basic ${btoa(`${adminEmail}:${adminPassword}`)}`;
    headers["Authorization"] = basicAuthHeader;
  }
  
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers
  });

  await throwIfResNotOk(res);
  return await res.json();
}

// Legacy version for backward compatibility
export async function apiRequestLegacy(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log("Fetching:", queryKey[0]);
    const url = queryKey[0] as string;
    
    // Determine if this is an admin endpoint that needs Basic Auth
    const isAdminEndpoint = url.includes('/api/admin/');
    
    // Set up basic headers
    let headers: HeadersInit = {
      "Accept": "application/json"
    };
    
    // Add Basic Auth for admin endpoints
    if (isAdminEndpoint) {
      const adminEmail = "sandeep@fastest.health";
      const adminPassword = "Fastest@2004";
      const basicAuthHeader = `Basic ${btoa(`${adminEmail}:${adminPassword}`)}`;
      headers["Authorization"] = basicAuthHeader;
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers
    });
    
    console.log("Response status:", res.status, "for", url);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log("Unauthorized but configured to return null");
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log("Response data:", data, "for", url);
    return data;
  };

// Constants for app events
export const APP_EVENTS = {
  PREGNANCY_STAGE_UPDATED: 'pregnancy_stage_updated'
};

// Constants for localStorage keys
export const STORAGE_KEYS = {
  LAST_PREGNANCY_UPDATE: 'naumah_last_pregnancy_update',
  CURRENT_PREGNANCY_WEEK: 'naumah_current_pregnancy_week'
};

// Cross-browser/deployment safe event system using localStorage
export const appEvents = {
  listeners: new Map<string, Set<Function>>(),
  
  // Memory-based event subscription (for current session)
  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  },
  
  // Publish event both in-memory and to localStorage for cross-tab communication
  publish(event: string, data?: any) {
    console.log(`[AppEvents] Publishing event: ${event}`, data);
    
    // In-memory notification (current tab)
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
    
    // Cross-tab notification using localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Store the event data with timestamp for cross-tab communication
        const storageEvent = {
          event,
          data,
          timestamp: new Date().getTime()
        };
        
        // For pregnancy updates, also store the current week for direct access
        if (event === APP_EVENTS.PREGNANCY_STAGE_UPDATED && data?.currentWeek) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_PREGNANCY_WEEK, data.currentWeek.toString());
        }
        
        // Store the event details
        localStorage.setItem(STORAGE_KEYS.LAST_PREGNANCY_UPDATE, JSON.stringify(storageEvent));
        
        // Dispatch a storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: STORAGE_KEYS.LAST_PREGNANCY_UPDATE,
          newValue: JSON.stringify(storageEvent)
        }));
        
        // Force the query client to refetch the pregnancy data route
        queryClient.invalidateQueries({ queryKey: ["/api/pregnancy"] });
        queryClient.refetchQueries({ queryKey: ["/api/pregnancy"] });
        
        // Set a system flag to indicate an update has happened
        window.__PREGNANCY_DATA_UPDATED = true;
      }
    } catch (err) {
      console.error('Error publishing event to localStorage:', err);
    }
  },
  
  // Get the last update timestamp
  getLastUpdateTimestamp(): number {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_PREGNANCY_UPDATE);
        if (lastUpdate) {
          const parsed = JSON.parse(lastUpdate);
          return parsed.timestamp || 0;
        }
      }
    } catch (err) {
      console.error('Error reading last update timestamp:', err);
    }
    return 0;
  },
  
  // Force synchronization of all components
  forceSyncAll() {
    console.log("[AppEvents] Forcing synchronization of all components");
    // Invalidate and refetch pregnancy data
    queryClient.invalidateQueries({ queryKey: ["/api/pregnancy"] });
    queryClient.refetchQueries({ queryKey: ["/api/pregnancy"] });
    
    // Send signal to all listeners
    const lastStorageEvent = localStorage.getItem(STORAGE_KEYS.LAST_PREGNANCY_UPDATE);
    if (lastStorageEvent) {
      try {
        const event = JSON.parse(lastStorageEvent);
        this.publish(APP_EVENTS.PREGNANCY_STAGE_UPDATED, event.data);
      } catch (err) {
        console.error('Error parsing last storage event:', err);
      }
    }
  }
};

// Initialize storage event listener for cross-tab communication
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEYS.LAST_PREGNANCY_UPDATE && event.newValue) {
      try {
        const storageEvent = JSON.parse(event.newValue);
        if (storageEvent.event && appEvents.listeners.has(storageEvent.event)) {
          // Notify local listeners about the event from another tab
          appEvents.listeners.get(storageEvent.event)?.forEach(callback => {
            callback(storageEvent.data);
          });
        }
      } catch (err) {
        console.error('Error processing storage event:', err);
      }
    }
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable auto-refresh when window gets focus
      staleTime: 60000, // Consider data stale after 60 seconds
      retry: false,
    },
    mutations: {
      retry: false,
      onSuccess: (data, variables, context) => {
        console.log('Mutation success - consider invalidating related queries');
      }
    },
  }
});
