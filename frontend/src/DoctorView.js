import React, { useState } from 'react';
import { fetchMetadata, requestAccess, breakGlass } from './api';

export default function DoctorView() {
  const [recordId, setRecordId] = useState('');
  const [meta, setMeta] = useState(null);
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const [canDownload, setCanDownload] = useState(false);

  const handleFetch = async () => {
    try {
      const m = await fetchMetadata(recordId);
      setMeta(m);
      setMsg('');
    } catch {
      setMeta(null);
      setMsg('Not found');
    }
  };

  const handleRequest = async () => {
    try {
      const res = await requestAccess({ recordId, doctorId, reason });
      setMsg((res.status || 'error') + ': ' + (res.message || res.error || 'No message'));
      setCanDownload(res.status === 'granted');
    } catch (e) {
      setMsg('error: ' + (e.message || 'Unknown error'));
      setCanDownload(false);
    }
  };

  const handleBreakGlass = async () => {
    try {
      const res = await breakGlass({ recordId, doctorId, reason });
      setMsg((res.status || 'error') + ': ' + (res.message || res.error || 'No message'));
      setCanDownload(res.status === 'emergency-granted' || res.status === 'granted');
    } catch (e) {
      setMsg('error: ' + (e.message || 'Unknown error'));
      setCanDownload(false);
    }
  };

  const handleDownload = () => {
    // Download EHR file as a blob and trigger download
    const url = `http://localhost:3001/ehr/${recordId}?doctorId=${doctorId}`;
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Failed to download EHR file');
        return response.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${recordId}.ehr`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(err => {
        setMsg('Download error: ' + (err.message || 'Unknown error'));
      });
  };

  return (
    <div>
      <h2>Doctor: View Patient Metadata</h2>
      <input value={recordId} onChange={e => setRecordId(e.target.value)} placeholder="Record ID" />
      <button onClick={handleFetch}>Fetch Metadata</button>
      {meta && <pre>{JSON.stringify(meta, null, 2)}</pre>}
      <h3>Request Full Access</h3>
      <input value={doctorId} onChange={e => setDoctorId(e.target.value)} placeholder="Doctor ID" />
      <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason" />
      <button onClick={handleRequest}>Request Access</button>
      <button onClick={handleBreakGlass}>Break Glass (Emergency)</button>
      <button onClick={handleDownload} disabled={!canDownload}>Download EHR File</button>
      <div>{msg}</div>
    </div>
  );
}
