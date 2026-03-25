import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const loginRes = http.post('http://localhost:3000/api/auth/login', JSON.stringify({
    email: 'test@test.com',
    password: 'password123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  const token = loginRes.json('access_token');

  const invoicesRes = http.get('http://localhost:3000/api/finance/invoices', {
    headers: { Authorization: Bearer  },
  });

  check(invoicesRes, {
    'invoices status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
