

import React, { useState } from 'react';
import { grantAccess, fetchMetadata, denyAccess } from './api';

export default function PatientPortal() {
  const [recordId, setRecordId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [msg, setMsg] = useState('');
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGrant = async (doctorIdToGrant) => {
    setLoading(true);
    try {
      const res = await grantAccess({ recordId, doctorId: doctorIdToGrant });
      if (res.status === 'error' && res.message && res.message.includes('Record not found')) {
        setMsg('Record not found. It may have been deleted.');
        setMeta(null);
      } else {
        setMsg((res.status || 'error') + ': ' + (res.message || res.error || 'No message'));
        // Refresh metadata to update notifications
        const m = await fetchMetadata(recordId);
        setMeta(m);
      }
    } catch (e) {
      setMsg('error: ' + (e.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const handleDeny = async (doctorIdToDeny) => {
    setLoading(true);
    try {
      const res = await denyAccess({ recordId, doctorId: doctorIdToDeny });
      if (res.status === 'error' && res.message && res.message.includes('Record not found')) {
        setMsg('Record not found. It may have been deleted.');
        setMeta(null);
      } else {
        setMsg((res.status || 'error') + ': ' + (res.message || res.error || 'No message'));
        // Refresh metadata to update notifications
        const m = await fetchMetadata(recordId);
        setMeta(m);
      }
    } catch (e) {
      setMsg('error: ' + (e.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const handleFetch = async () => {
    setLoading(true);
    try {
      const m = await fetchMetadata(recordId);
      setMeta(m);
      setMsg('');
    } catch {
      setMeta(null);
      setMsg('Not found');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Patient Portal</h2>
      <div>
        <input value={recordId} onChange={e => setRecordId(e.target.value)} placeholder="Unified Health ID" />
        <button onClick={handleFetch} disabled={loading}>View My Metadata</button>
      </div>
      {meta && (
        <>
          <pre>{JSON.stringify(meta, null, 2)}</pre>
          {/* Notification for pending access requests */}
          {Array.isArray(meta.pendingAccessRequests) && meta.pendingAccessRequests.some(r => r.status === 'pending') && (
            <div style={{border: '1px solid orange', padding: 10, margin: 10}}>
              <b>Pending Access Requests:</b>
              <ul>
                {meta.pendingAccessRequests.filter(r => r.status === 'pending').map((r, i) => (
                  <li key={i}>
                    Doctor <b>{r.doctorId}</b> requests access (Reason: {r.reason || 'N/A'})
                    <button style={{marginLeft: 10}} disabled={loading} onClick={() => handleGrant(r.doctorId)}>Approve</button>
                    <button style={{marginLeft: 10}} disabled={loading} onClick={() => handleDeny(r.doctorId)}>Deny</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <div>{msg}</div>
    </div>
  );
}
