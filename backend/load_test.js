// load_test.js
const http = require('http');
const { performance } = require('perf_hooks');

const URL = 'http://localhost:3001/ehr/e8a9410e-f27f-445e-895c-e81258b71d19?doctorId=doctor1';
const TOTAL_REQUESTS = 100;
const CONCURRENCY = 10;

function makeRequest() {
  return new Promise((resolve) => {
    const start = performance.now();
    http.get(URL, (res) => {
      res.on('data', () => {}); // consume data
      res.on('end', () => {
        resolve(performance.now() - start);
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

async function runLoadTest() {
  let results = [];
  for (let i = 0; i < TOTAL_REQUESTS / CONCURRENCY; i++) {
    const batch = [];
    for (let j = 0; j < CONCURRENCY; j++) {
      batch.push(makeRequest());
    }
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    process.stdout.write('.');
  }
  results = results.filter(r => r !== null);
  console.log('\n--- Load Test Results ---');
  console.log('Total requests:', results.length);
  console.log('Min:', Math.min(...results).toFixed(2), 'ms');
  console.log('Max:', Math.max(...results).toFixed(2), 'ms');
  console.log('Avg:', (results.reduce((a, b) => a + b, 0) / results.length).toFixed(2), 'ms');
}

runLoadTest();
