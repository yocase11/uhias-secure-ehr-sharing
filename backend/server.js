const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

// POST /deny-access: patient denies doctor access
app.post('/deny-access', async (req, res) => {
  try {
    const { recordId, doctorId } = req.body;
    if (!recordId || !doctorId) return res.status(400).json({ status: 'error', message: 'Missing fields' });
    const metaPath = path.join(__dirname, 'local_ehr', `${recordId}.json`);
    console.log('[deny-access] Looking for file:', metaPath);
    let meta;
    try {
      const exists = fs.existsSync(metaPath);
      console.log('[deny-access] File exists:', exists);
      if (!exists) return res.status(404).json({ status: 'error', message: 'Record not found' });
      const raw = fs.readFileSync(metaPath, 'utf8');
      try {
        meta = JSON.parse(raw);
      } catch (parseErr) {
        console.error('[deny-access] JSON parse error:', parseErr, raw);
        return res.status(500).json({ status: 'error', message: 'Invalid metadata format' });
      }
    } catch (err) {
      console.error('[deny-access] Error reading file:', err);
      return res.status(404).json({ status: 'error', message: 'Record not found' });
    }
    // Update pendingAccessRequests for this doctor to denied
    if (Array.isArray(meta.pendingAccessRequests)) {
      meta.pendingAccessRequests = meta.pendingAccessRequests.map(req =>
        req.doctorId === doctorId && req.status === 'pending' ? { ...req, status: 'denied' } : req
      );
    }
    try {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    } catch (e) {
      return res.status(500).json({ status: 'error', message: 'Failed to update metadata' });
    }
    res.json({ status: 'denied', message: 'Access denied for doctor.', recordId, doctorId });
  } catch (e) {
    console.error('[deny-access] Unexpected error:', e);
    res.status(500).json({ status: 'error', message: e.message });
  }
});

require('dotenv').config();
// ...existing code...


// Diagnostic: List all files in Supabase bucket as seen by backend
app.get('/admin/list-supabase-files', async (req, res) => {
  try {
    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .list('');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ files: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Doctor: download/view EHR data if access is granted
app.get('/ehr/:recordId', async (req, res) => {
  const start = Date.now();
  try {
    const { recordId } = req.params;
    const doctorId = req.query.doctorId;
    if (!doctorId) return res.status(400).json({ error: 'Missing doctorId' });
    // Always use local metadata file for access control
    const metaPath = path.join(LOCAL_EHR_DIR, `${recordId}.json`);
    if (!fs.existsSync(metaPath)) return res.status(404).json({ error: 'Metadata file not found locally' });
    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8').replace(/^\uFEFF/, '').trim());
    } catch (e) {
      return res.status(500).json({ error: 'Local metadata is invalid JSON' });
    }
    if (!meta.accessGranted || !meta.accessGranted.includes(doctorId)) {
      return res.status(403).json({ error: 'Access not granted' });
    }
    // Stream the EHR file from local storage
    const ehrPath = path.join(LOCAL_EHR_DIR, `${recordId}.ehr`);
    if (!fs.existsSync(ehrPath)) return res.status(404).json({ error: 'EHR file not found' });
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${recordId}.ehr"`);
    const stream = fs.createReadStream(ehrPath);
    stream.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read EHR file' });
      }
    });
    stream.pipe(res);
    stream.on('close', () => {
      const duration = Date.now() - start;
      console.log(`[PERF] /ehr/${recordId} served to doctorId=${doctorId} in ${duration} ms`);
    });
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
});

// Admin: forcibly delete a metadata file from Supabase Storage by UID
app.delete('/admin/force-delete/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .remove([`${recordId}.json`]);
    if (error) {
      console.error('[force-delete] Error:', error, 'recordId:', recordId);
      return res.status(500).json({ error: error.message });
    }
    res.json({ status: 'deleted', recordId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.use(express.json({ limit: '50mb' }));
const cors = require('cors');
app.use(cors());

const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'metadata';
let supabase;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    // Test Supabase connection at startup
    supabase
      .storage
      .from(SUPABASE_BUCKET)
      .list('')
      .then(({ data, error }) => {
        if (error) console.error('Supabase test error:', error.message);
        else console.log('Supabase test success:', data);
      });
  } catch (e) {
    console.error('[startup] Supabase client init failed:', e.message);
    // Fallback to local-only stub
    supabase = null;
  }
} else {
  console.warn('[startup] SUPABASE not configured - running in local-only mode');
  // Provide a minimal stub so code calling supabase.storage.from(...) won't crash
  supabase = {
    storage: {
      from: () => ({
        list: async () => ({ data: [], error: null }),
        download: async () => ({ data: null, error: { message: 'Supabase disabled' } }),
        upload: async () => ({ error: null }),
        remove: async () => ({ error: null })
      })
    }
  };
}

// Fetch a single metadata record from Supabase Storage
app.get('/metadata/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const metaPath = path.join(__dirname, 'local_ehr', `${recordId}.json`);
    if (!fs.existsSync(metaPath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      res.json(meta);
    } catch (parseErr) {
      console.error('Error parsing JSON for', recordId, parseErr);
      res.status(500).json({ error: 'Invalid metadata format' });
    }
  } catch (e) {
    console.error('Error in /metadata/:recordId', e);
    res.status(404).json({ error: 'Not found' });
  }
});

// Admin: delete a metadata record and its EHR file
app.delete('/admin/delete-record/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    // Delete metadata from Supabase Storage
    const { error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .remove([`${recordId}.json`]);
    if (error) throw error;
    // Delete EHR file locally
    const ehrPath = path.join(LOCAL_EHR_DIR, `${recordId}.ehr`);
    if (fs.existsSync(ehrPath)) fs.unlinkSync(ehrPath);
    res.json({ status: 'deleted', recordId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: view logs (returns access/emergency logs from all metadata in Supabase Storage)
app.get('/admin/logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .list('', { limit: 1000 });
    if (error) throw error;
    const files = data.filter(f => f.name.endsWith('.json') && !f.name.startsWith('policy_'));
    const logs = [];
    for (const f of files) {
      try {
        const { data: fileData, error: fileError } = await supabase
          .storage
          .from(SUPABASE_BUCKET)
          .download(f.name);
        if (fileError || !fileData) continue;
        let body = '';
        for await (const chunk of fileData.stream()) {
          body += chunk;
        }
        const meta = JSON.parse(body);
        if (meta.accessRequests) logs.push(...meta.accessRequests.map(r => ({ recordId: meta.recordId, ...r })));
        if (meta.emergencyAccess) logs.push(...meta.emergencyAccess.map(r => ({ recordId: meta.recordId, ...r, emergency: true })));
      } catch {}
    }
    res.json({ logs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: manage users (placeholder, returns static list)
app.get('/admin/users', (req, res) => {
  res.json({ users: [
    { id: 'doctor1', role: 'doctor' },
    { id: 'patient1', role: 'patient' },
    { id: 'admin', role: 'admin' }
  ] });
});

// Admin endpoint: list all metadata records
app.get('/admin/list-metadata', async (req, res) => {
  try {
    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .list('', { limit: 1000 });
    if (error) throw error;
    const files = data.filter(f => f.name.endsWith('.json') && !f.name.startsWith('policy_'));
    const records = [];
    for (const f of files) {
      try {
        const { data: fileData, error: fileError } = await supabase
          .storage
          .from(SUPABASE_BUCKET)
          .download(f.name);
        if (fileError || !fileData) {
          console.error('Error downloading file', f.name, fileError);
          continue;
        }
        // Buffer the stream, then convert to string
        const chunks = [];
        for await (const chunk of fileData.stream()) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const body = Buffer.concat(chunks).toString('utf8');
        try {
          records.push(JSON.parse(body));
        } catch (parseErr) {
          console.error('Error parsing JSON for', f.name, parseErr, body);
        }
      } catch (err) {
        console.error('Error processing file', f.name, err);
      }
    }
    res.json({ records });
  } catch (e) {
    console.error('Error in /admin/list-metadata:', e);
    res.status(500).json({ error: e.message });
  }
});


const { aesEncrypt, sha256 } = require('./crypto_utils');
const { v4: uuidv4 } = require('uuid');

const LOCAL_EHR_DIR = path.join(__dirname, 'local_ehr');
if (!fs.existsSync(LOCAL_EHR_DIR)) fs.mkdirSync(LOCAL_EHR_DIR);

app.post('/upload', async (req, res) => {
  try {
    const { fileB64, reportName, date, recordId } = req.body;
    if (!fileB64 || !reportName || !date) return res.status(400).json({ error: 'Missing fields' });
    let uid = recordId;
    if (!uid) {
      uid = uuidv4();
    }
    // Check for duplicate UID
    const { data: existing, error: checkError } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .download(`${uid}.json`);
    if (existing && !checkError) {
      // Try to read a chunk to see if the file is real
      try {
        let found = false;
        for await (const _ of existing.stream()) {
          found = true;
          break;
        }
        if (found) {
          return res.status(400).json({ error: 'duplicate UID: record already exists for this UID' });
        }
      } catch {}
    }
    // Accept both YYYY-MM-DD and DD-MM-YYYY, normalize to YYYY-MM-DD
    let normDate = date;
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      // Convert DD-MM-YYYY to YYYY-MM-DD
      const [d, m, y] = date.split('-');
      normDate = `${y}-${m}-${d}`;
    }
    // else assume already YYYY-MM-DD
    const buffer = Buffer.from(fileB64, 'base64');
    const { encrypted, key, iv, tag } = aesEncrypt(buffer);
    const ehrPath = path.join(LOCAL_EHR_DIR, `${uid}.ehr`);
    fs.writeFileSync(ehrPath, encrypted);
    const fileHash = sha256(encrypted);
    // Only store UID, reportName, and date in metadata
    const metaObj = {
      recordId: uid,
      reportName,
      date: normDate
    };
    // Upload metadata to Supabase Storage
    const { error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .upload(`${uid}.json`, JSON.stringify(metaObj), { contentType: 'application/json', upsert: true });
    if (error) {
      console.error('Supabase upload error:', error.message, error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ status: 'ok', recordId: uid, fileHash });
  } catch (e) {
    console.error('Upload endpoint error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/policy', async (req, res) => {
  try {
    const { policyId, patientId, policy } = req.body;
    if (!policyId || !patientId || !policy) return res.status(400).json({ error: 'Missing fields' });
    // Store policy in Supabase Storage
    const policyObj = { policyId, patientId, policy, created: new Date().toISOString() };
    const { error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .upload(`policy_${policyId}.json`, JSON.stringify(policyObj, null, 2), { contentType: 'application/json', upsert: true });
    if (error) throw error;
    res.json({ status: 'ok', policyId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/request-access', async (req, res) => {
  try {
    const { recordId, doctorId, reason } = req.body;
    if (!recordId || !doctorId || !reason) return res.status(400).json({ error: 'Missing fields' });
    const metaPath = path.join(__dirname, 'local_ehr', `${recordId}.json`);
    let meta;
    try {
      const exists = fs.existsSync(metaPath);
      if (!exists) return res.status(404).json({ error: 'Record not found' });
      const raw = fs.readFileSync(metaPath, 'utf8');
      meta = JSON.parse(raw);
    } catch (err) {
      return res.status(404).json({ error: 'Record not found' });
    }
    if (meta.accessGranted && meta.accessGranted.includes(doctorId)) {
      return res.json({ status: 'granted', message: 'Access already granted.' });
    }
    meta.pendingAccessRequests = meta.pendingAccessRequests || [];
    // Only add if not already pending for this doctor
    if (!meta.pendingAccessRequests.some(req => req.doctorId === doctorId && req.status === 'pending')) {
      meta.pendingAccessRequests.push({ doctorId, reason, requested: new Date().toISOString(), status: 'pending' });
    }
    // Also add to accessRequests for legacy support
    let requests = meta.accessRequests || [];
    requests.push({ doctorId, reason, requested: new Date().toISOString() });
    meta.accessRequests = requests;
    try {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    } catch (e) {
      return res.status(500).json({ error: 'Failed to update local metadata', details: e.message });
    }
    res.json({ status: 'pending', message: 'Access request logged, waiting for patient approval.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/grant-access', async (req, res) => {
  try {
    const { recordId, doctorId } = req.body;
    if (!recordId || !doctorId) return res.status(400).json({ status: 'error', message: 'Missing fields' });
    const metaPath = path.join(__dirname, 'local_ehr', `${recordId}.json`);
    let meta;
    try {
      const exists = fs.existsSync(metaPath);
      if (!exists) return res.status(404).json({ status: 'error', message: 'Record not found' });
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (err) {
      return res.status(404).json({ status: 'error', message: 'Record not found' });
    }
    meta.accessGranted = meta.accessGranted || [];
    if (!meta.accessGranted.includes(doctorId)) meta.accessGranted.push(doctorId);
    if (Array.isArray(meta.pendingAccessRequests)) {
      meta.pendingAccessRequests = meta.pendingAccessRequests.map(req =>
        req.doctorId === doctorId ? { ...req, status: 'approved' } : req
      );
    }
    try {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    } catch (e) {
      return res.status(500).json({ status: 'error', message: 'Failed to update metadata' });
    }
    res.json({ status: 'granted', message: 'Access granted to doctor.', recordId, doctorId });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.post('/break-glass', async (req, res) => {
  try {
    const { recordId, doctorId, reason } = req.body;
    if (!recordId || !doctorId || !reason) return res.status(400).json({ error: 'Missing fields' });
    let meta;
    try {
      const { data, error } = await supabase
        .storage
        .from(SUPABASE_BUCKET)
        .download(`${recordId}.json`);
      if (error || !data) return res.status(404).json({ error: 'Record not found' });
      let body = '';
      for await (const chunk of data.stream()) {
        body += chunk;
      }
      meta = JSON.parse(body);
    } catch {
      return res.status(404).json({ error: 'Record not found' });
    }
    meta.emergencyAccess = meta.emergencyAccess || [];
    meta.emergencyAccess.push({ doctorId, reason, time: new Date().toISOString() });
    meta.accessGranted = meta.accessGranted || [];
    if (!meta.accessGranted.includes(doctorId)) meta.accessGranted.push(doctorId);
    const { error: putError } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .upload(`${recordId}.json`, JSON.stringify(meta, null, 2), { contentType: 'application/json', upsert: true });
    if (putError) throw putError;
    res.json({ status: 'emergency-granted', recordId, doctorId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
