
import React, { useState } from 'react';
import { uploadEHR } from './api';

export default function AdminPage() {
  const [records, setRecords] = useState([]);
  const [msg, setMsg] = useState('');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch all metadata files from the backend cloud_metadata folder
  const fetchAllMetadata = async () => {
    setMsg('Loading...');
    try {
      const res = await fetch('http://localhost:3001/admin/list-metadata');
      const data = await res.json();
      setRecords(data.records || []);
      setMsg('');
    } catch (e) {
      setMsg('Failed to fetch metadata');
    }
  };

  // Delete a record
  const deleteRecord = async (recordId) => {
    if (!window.confirm('Delete record ' + recordId + '?')) return;
    setMsg('Deleting...');
    try {
      await fetch(`http://localhost:3001/admin/delete-record/${recordId}`, { method: 'DELETE' });
      setMsg('Deleted ' + recordId);
      setRecords(records.filter(r => r.recordId !== recordId));
    } catch (e) {
      setMsg('Failed to delete');
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    setMsg('Loading logs...');
    try {
      const res = await fetch('http://localhost:3001/admin/logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setMsg('');
    } catch (e) {
      setMsg('Failed to fetch logs');
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setMsg('Loading users...');
    try {
      const res = await fetch('http://localhost:3001/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
      setMsg('');
    } catch (e) {
      setMsg('Failed to fetch users');
    }
  };

  // Admin upload state
  const [file, setFile] = useState(null);
  const [reportName, setReportName] = useState('');
  const [date, setDate] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');
  const [uid, setUID] = useState('');
  const [lastUID, setLastUID] = useState('');
  function generateUID() {
    // Simple UUID v4 generator (client-side, for demo; backend will also check for duplicates)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const handleUpload = async () => {
    let finalUID = uid;
    if (!finalUID) {
      finalUID = generateUID();
      setUID(finalUID);
    }
    if (!file || !reportName || !date || !finalUID) {
      setUploadMsg('All fields required: UID, report/scan name, date, and file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async e => {
      const fileB64 = e.target.result.split(',')[1];
      const res = await uploadEHR({ fileB64, reportName, date, recordId: finalUID });
      if (res.status === 'ok' && res.recordId) {
        setLastUID(res.recordId);
        setUploadMsg(`Uploaded! Unified Health ID: ${res.recordId}`);
      } else if (res.error && res.error.includes('duplicate')) {
        setUploadMsg('This UID already exists. Please use a different UID.');
      } else {
        setUploadMsg(res.error || 'Upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2>Admin Page</h2>
      <div style={{border: '1px solid #ccc', padding: 10, marginBottom: 20}}>
        <h3>Upload EHR Data</h3>
        <input value={uid} onChange={e => setUID(e.target.value)} placeholder="Unified Health ID (leave blank to auto-generate)" />
        <button type="button" onClick={() => setUID(generateUID())}>Generate UID</button>
        <br />
        <input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="Report/Scan Name" />
        <input value={date} onChange={e => setDate(e.target.value)} placeholder="Date" type="date" />
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleUpload}>Upload</button>
        {uploadMsg && <div>{uploadMsg}</div>}
        {lastUID && (
          <div style={{marginTop:10, color:'green'}}>
            <b>Notify Patient:</b> Their Unified Health ID is <code>{lastUID}</code>. Please share this ID securely with the patient.
          </div>
        )}
      </div>
      <button onClick={fetchAllMetadata}>List All Metadata Records</button>
      <button onClick={fetchLogs}>View Logs</button>
      <button onClick={fetchUsers}>Manage Users</button>
      {msg && <div>{msg}</div>}
      <h3>Metadata Records</h3>
      <ul>
        {records.map((rec, i) => (
          <li key={i}>
            <pre>{JSON.stringify(rec, null, 2)}</pre>
            <button onClick={() => deleteRecord(rec.recordId)}>Delete</button>
          </li>
        ))}
      </ul>
      <h3>Logs</h3>
      <ul>
        {logs.map((log, i) => (
          <li key={i}><pre>{JSON.stringify(log, null, 2)}</pre></li>
        ))}
      </ul>
      <h3>Users</h3>
      <ul>
        {users.map((user, i) => (
          <li key={i}><pre>{JSON.stringify(user, null, 2)}</pre></li>
        ))}
      </ul>
    </div>
  );
}
