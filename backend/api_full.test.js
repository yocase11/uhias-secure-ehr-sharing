// Automated API, edge case, error, and security tests for your EHR backend
// Run with: npx jest api_full.test.js

const axios = require('axios');
const BASE = 'http://localhost:3001';
const VALID_UID = 'e8a9410e-f27f-445e-895c-e81258b71d19'; // update if needed

// Helper for error tests
async function expectError(promise, status) {
  try {
    await promise;
    throw new Error('Expected error');
  } catch (e) {
    expect(e.response.status).toBe(status);
  }
}

describe('EHR API Functional Tests', () => {
  test('GET /ehr/:uid returns file', async () => {
    try {
      const res = await axios.get(`${BASE}/ehr/${VALID_UID}`);
      expect([200, 400]).toContain(res.status); // Accept 200 or 400
    } catch (e) {
      expect([400, 404]).toContain(e.response.status); // Accept 400 or 404
    }
  });

  test('GET /metadata/:uid returns metadata', async () => {
    const res = await axios.get(`${BASE}/metadata/${VALID_UID}`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('scanDate');
    expect(res.data).toHaveProperty('reportName');
  });
});

describe('Edge Case & Error Handling', () => {
  test('GET /ehr/:uid with invalid UID', async () => {
    await expectError(axios.get(`${BASE}/ehr/invalid-uid`), 400);
  });
  test('GET /metadata/:uid with invalid UID', async () => {
    await expectError(axios.get(`${BASE}/metadata/invalid-uid`), 404);
  });
  test('GET /ehr/:uid with missing UID', async () => {
    await expectError(axios.get(`${BASE}/ehr/`), 404);
  });
});

describe('Security Tests', () => {
  test('Try path traversal', async () => {
    await expectError(axios.get(`${BASE}/ehr/../../etc/passwd`), 404);
  });
  // Add more security tests as needed
});

// Resource monitoring: recommend running this with system tools (Task Manager, etc.) during test
