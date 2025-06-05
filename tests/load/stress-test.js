import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Warm up
    { duration: '2m', target: 50 },   // Moderate load
    { duration: '3m', target: 100 },  // High load
    { duration: '2m', target: 150 },  // Very high load
    { duration: '2m', target: 200 },  // Stress level
    { duration: '1m', target: 250 },  // Breaking point test
    { duration: '2m', target: 0 },    // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Higher threshold for stress test
    http_req_failed: ['rate<0.25'],    // Allow higher error rate under stress
    errors: ['rate<0.25'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const params = {
    headers: {
      'User-Agent': 'k6-stress-test/1.0',
    },
  };

  // Focus on core endpoints under stress
  const endpoints = [
    '/',
    '/events/1',
    '/events/2', 
    '/api/events',
    '/auth/login',
  ];

  // Random endpoint selection to simulate realistic traffic
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  let response = http.get(`${BASE_URL}${endpoint}`, params);
  
  let result = check(response, {
    'Status is acceptable under stress': (r) => r.status === 200 || r.status === 302 || r.status === 404,
    'Response time under stress threshold': (r) => r.timings.duration < 10000, // 10s max under stress
  });
  
  if (!result) {
    errorRate.add(1);
  }

  // Shorter sleep times to create more stress
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  const errorRate = data.metrics.http_req_failed.values.rate;
  const maxVUs = data.metrics.vus_max.values.max;
  
  return {
    'tests/load/results/stress-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
🔥 Stress Test Results Summary:
===========================================
STRESS TEST COMPLETED
Peak Load: ${maxVUs} concurrent users
Total Requests: ${data.metrics.http_reqs.values.count}
Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(1)}s

PERFORMANCE UNDER STRESS:
- Success Rate: ${((1 - errorRate) * 100).toFixed(2)}%
- Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
- p95 Response Time: ${p95.toFixed(2)}ms
- p99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms

STRESS ANALYSIS:
${p95 < 2000 ? '🟢 EXCELLENT: System handles stress very well' : 
  p95 < 5000 ? '🟡 GOOD: System degrades gracefully under stress' : 
  '🔴 POOR: System struggles under high load'}

${errorRate < 0.05 ? '🟢 ERROR RATE: Very low errors under stress' :
  errorRate < 0.15 ? '🟡 ERROR RATE: Acceptable errors under stress' :
  '🔴 ERROR RATE: High error rate indicates system breaking point'}

BREAKING POINT ANALYSIS:
- At ${maxVUs} users: ${errorRate > 0.5 ? 'System reached breaking point' : 'System still stable'}
- Recommended max load: ~${Math.floor(maxVUs * 0.7)} concurrent users

RECOMMENDATIONS:
${p95 > 3000 ? '⚠️  Consider horizontal scaling or caching improvements' : '✅ Performance is acceptable under stress'}
${errorRate > 0.2 ? '⚠️  High error rate - investigate bottlenecks' : '✅ Error handling is robust'}
===========================================
    `,
  };
} 