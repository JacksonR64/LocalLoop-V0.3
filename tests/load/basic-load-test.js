import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 20 }, // Ramp up to 20 users  
    { duration: '2m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],
  },
};

// Base URL - adjust for your environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const params = {
    headers: {
      'User-Agent': 'k6-load-test/1.0',
    },
  };

  // Test 1: Homepage load
  let response = http.get(`${BASE_URL}/`, params);
  let result = check(response, {
    'Homepage loads successfully': (r) => r.status === 200,
    'Homepage loads in reasonable time': (r) => r.timings.duration < 3000,
    'Homepage contains events': (r) => r.body.includes('event') || r.body.includes('Event'),
  });
  errorRate.add(!result);

  sleep(1);

  // Test 2: Event listing API
  response = http.get(`${BASE_URL}/api/events`, params);
  result = check(response, {
    'Events API responds': (r) => r.status === 200 || r.status === 401, // 401 might be expected for non-auth
    'Events API response time OK': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!result);

  sleep(1);

  // Test 3: Random event detail page (simulate user browsing)
  // First try to get event listings to find a real event
  const eventsResponse = http.get(`${BASE_URL}/api/events`, params);
  if (eventsResponse.status === 200) {
    try {
      const events = JSON.parse(eventsResponse.body);
      if (events && events.length > 0) {
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        if (randomEvent && randomEvent.id) {
          response = http.get(`${BASE_URL}/events/${randomEvent.id}`, params);
          result = check(response, {
            'Event detail page loads': (r) => r.status === 200,
            'Event detail loads in time': (r) => r.timings.duration < 3000,
          });
          errorRate.add(!result);
        }
      }
    } catch (e) {
      // If parsing fails, just test a mock event ID
      response = http.get(`${BASE_URL}/events/1`, params);
      check(response, {
        'Event detail accessible': (r) => r.status === 200 || r.status === 404,
      });
    }
  }

  sleep(2);

  // Test 4: Authentication endpoints
  response = http.get(`${BASE_URL}/auth/login`, params);
  result = check(response, {
    'Login page loads': (r) => r.status === 200,
    'Login page loads quickly': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!result);

  sleep(1);

  // Test 5: Staff dashboard (should redirect or show login)
  response = http.get(`${BASE_URL}/staff/dashboard`, params);
  result = check(response, {
    'Staff dashboard accessible': (r) => r.status === 200 || r.status === 302 || r.status === 401,
    'Staff dashboard responds quickly': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!result);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'tests/load/results/basic-load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
📊 Basic Load Test Results Summary:
===========================================
Duration: ${data.metrics.iteration_duration.values.avg.toFixed(2)}ms avg
Requests: ${data.metrics.http_reqs.values.count} total
Success Rate: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%
Response Time p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
VUs Peak: ${data.metrics.vus_max.values.max}

Thresholds:
- http_req_duration p95 < 2000ms: ${data.metrics.http_req_duration.values['p(95)'] < 2000 ? '✅ PASS' : '❌ FAIL'}
- http_req_failed rate < 10%: ${data.metrics.http_req_failed.values.rate < 0.1 ? '✅ PASS' : '❌ FAIL'}
- error rate < 10%: ${data.metrics.errors?.values.rate < 0.1 ? '✅ PASS' : '❌ FAIL'}
===========================================
    `,
  };
} 