import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '10s', target: 10 }, // ramp up to 10 users
    { duration: '30s', target: 10 }, // stay at 10 users
    { duration: '10s', target: 0 },  // ramp down
  ],
};

export default function () {
  let res = http.get('http://localhost:3001/ehr/e8a9410e-f27f-445e-895c-e81258b71d19?doctorId=doctor1');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'not empty': (r) => r.body.length > 0,
  });
  sleep(1);
}