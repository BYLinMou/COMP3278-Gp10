function getApiBase() {
  const configuredBase = import.meta.env.VITE_API_BASE_URL;
  if (configuredBase) {
    return configuredBase;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return "http://127.0.0.1:8000";
}

const API_BASE = getApiBase();

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? "Request failed");
  }

  return response.json();
}

export async function requestWithoutJson(path, options = {}, fallbackMessage = "Request failed") {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? fallbackMessage);
  }

  return response;
}

export function buildApiUrl(path) {
  return `${API_BASE}${path}`;
}
