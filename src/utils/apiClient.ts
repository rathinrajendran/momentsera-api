let memoizedAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  memoizedAccessToken = token;
};

export const getAccessToken = () => memoizedAccessToken;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function apiClient(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean } = {},
) {
  const { skipAuth = false, headers, ...customConfig } = options;

  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const token = getAccessToken();

  if (token && !skipAuth) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const request: RequestInit = {
    ...customConfig,
    credentials: "include",
    headers: requestHeaders,
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, request);

  if (response.status === 401 && !skipAuth) {
    const refreshedToken = await attemptTokenRefresh();

    if (!refreshedToken) {
      setAccessToken(null);

      if (typeof window !== "undefined") {
        window.location.replace("/account/login?error=session_expired");
      }

      throw new Error("Session expired");
    }

    const retryHeaders = new Headers(requestHeaders);
    retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...request,
      headers: retryHeaders,
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(error.message ?? error.error ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function attemptTokenRefresh(): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data?.accessToken) {
      return null;
    }

    setAccessToken(data.accessToken);

    return data.accessToken;
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    setAccessToken(null);

    if (typeof window !== "undefined") {
      sessionStorage.clear();
      window.location.replace("/account/login");
    }
  }
}
