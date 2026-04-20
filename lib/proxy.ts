// lib/proxy.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/login';
      }
      return null;
    }

    return response;
  } catch (err) {
    // Network error — backend is unreachable
    console.warn(`[API] Network error for ${endpoint}:`, err);
    return null;
  }
}