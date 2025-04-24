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
  const res = await fetch(url, {
    credentials: "include",
    ...options
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
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });
    
    console.log("Response status:", res.status, "for", queryKey[0]);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log("Unauthorized but configured to return null");
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log("Response data:", data, "for", queryKey[0]);
    return data;
  };

// Event bus for app-wide events
export const appEvents = {
  listeners: new Map<string, Set<Function>>(),
  
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
  
  publish(event: string, data?: any) {
    console.log(`[AppEvents] Publishing event: ${event}`, data);
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
};

// Constants for app events
export const APP_EVENTS = {
  PREGNANCY_STAGE_UPDATED: 'pregnancy_stage_updated'
};

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
