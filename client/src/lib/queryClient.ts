import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://0.0.0.0:5000'; // Updated to use 0.0.0.0 instead of localhost

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = API_BASE_URL + endpoint; // Updated to use API_BASE_URL
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
  endpoint: string,
  data?: unknown | undefined,
): Promise<Response> {
  const url = API_BASE_URL + endpoint; // Updated to use API_BASE_URL
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
    const url = API_BASE_URL + (queryKey[0] as string); // Updated to use API_BASE_URL
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});