export async function denyAccess({ recordId, doctorId }) {
  const res = await fetch(`${API_BASE}/deny-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId, doctorId })
  });
  return res.json();
}
// API helper for backend endpoints
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

export async function fetchMetadata(recordId) {
  const res = await fetch(`${API_BASE}/metadata/${recordId}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export async function uploadEHR({ fileB64, reportName, date, recordId }) {
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileB64, reportName, date, recordId })
  });
  return res.json();
}

export async function requestAccess({ recordId, doctorId, reason }) {
  const res = await fetch(`${API_BASE}/request-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId, doctorId, reason })
  });
  return res.json();
}

export async function grantAccess({ recordId, doctorId }) {
  const res = await fetch(`${API_BASE}/grant-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId, doctorId })
  });
  return res.json();
}

export async function breakGlass({ recordId, doctorId, reason }) {
  const res = await fetch(`${API_BASE}/break-glass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId, doctorId, reason })
  });
  return res.json();
}
