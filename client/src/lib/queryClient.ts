import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    // Using omit for credentials if not strictly needed can avoid some CORS/302 issues on mobile
    // If sessions/cookies are added later, this can be changed back to 'include'
    credentials: "omit", 
  });

  if (!res.ok) {
    const text = await res.text();
    let errorMessage = `Server error (${res.status})`;
    try {
      const json = JSON.parse(text);
      errorMessage = json.error || json.message || errorMessage;
    } catch (e) {
      errorMessage = text || res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("Failed to parse response as JSON:", text.slice(0, 200));
    throw new Error("Received invalid response from server. This may be due to a network redirect.");
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
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
