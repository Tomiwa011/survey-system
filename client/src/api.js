const API = import.meta.env.VITE_API_URL;

export async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method: options.method || 'GET',
      credentials: 'include',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Please check your connection and try again.');
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error((data && data.error) || 'Something went wrong');
    error.status = res.status;
    throw error;
  }
  return data;
}