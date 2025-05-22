const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error('Login failed');
  }
  return await res.json();
}

export async function fetchContacts(token) {
  const res = await fetch(`${API_BASE}/contacts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch contacts');
  }
  return await res.json();
}
