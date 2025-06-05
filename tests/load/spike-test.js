import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Normal baseline
    { duration: '10s', target: 100 },  // SPIKE! Sudden 10x increase
    { duration: '1m', target: 100 },   // Sustain spike
    { duration: '10s', target: 10 },   // Quick drop back
    { duration: '30s', target: 10 },   // Recovery period
    { duration: '10s', target: 200 },  // Even bigger spike!
    { duration: '30s', target: 200 },  // Sustain bigger spike
    { duration: '1m', target: 0 },     // Ramp down completely
  ],
  thresholds: {
    http_req_duration: ['p(95)<4000'], // Reasonable threshold for spike scenarios
    http_req_failed: ['rate<0.20'],    // Allow some errors during spikes
    errors: ['rate<0.20'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const params = {
    headers: {
      'User-Agent': 'k6-spike-test/1.0',
    },
  };

  // Simulate realistic spike behavior - mix of homepage and event browsing
  const spikeEndpoints = [
    { url: '/', weight: 50 },              // Most traffic hits homepage
    { url: '/events/1', weight: 20 },      // Popular event
    { url: '/events/2', weight: 15 },      // Another popular event  
    { url: '/api/events', weight: 10 },    // API calls
    { url: '/auth/login', weight: 5 },     // Some login attempts
  ];

  // Weighted random selection to simulate real traffic patterns
  const totalWeight = spikeEndpoints.reduce((sum, ep) => sum + ep.weight, 0);
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  let selectedEndpoint = '/';

  for (const endpoint of spikeEndpoints) {
    cumulativeWeight += endpoint.weight;
    if (random <= cumulativeWeight) {
      selectedEndpoint = endpoint.url;
      break;
    }
  }

  let response = http.get(`${BASE_URL}${selectedEndpoint}`, params);
  
  let result = check(response, {
    'Spike handling - status OK': (r) => r.status === 200 || r.status === 302 || r.status === 404,
    'Spike handling - response time acceptable': (r) => r.timings.duration < 8000, // 8s max during spikes
    'Spike handling - no server errors': (r) => r.status < 500,
  });
  
  if (!result) {
    errorRate.add(1);
  }

  // Minimal sleep to create realistic spike pressure
  sleep(Math.random() * 1 + 0.3); // 0.3-1.3 seconds
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  const p99 = data.metrics.http_req_duration.values['p(99)'];
  const errorRate = data.metrics.http_req_failed.values.rate;
  const maxVUs = data.metrics.vus_max.values.max;
  const totalRequests = data.metrics.http_reqs.values.count;
  
  return {
    'tests/load/results/spike-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
⚡ Spike Test Results Summary:
===========================================
SPIKE TEST COMPLETED
Peak Spike: ${maxVUs} concurrent users (sudden load)
Total Requests: ${totalRequests}
Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(1)}s

SPIKE RESILIENCE:
- Success Rate: ${((1 - errorRate) * 100).toFixed(2)}%
- Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
- p95 Response Time: ${p95.toFixed(2)}ms
- p99 Response Time: ${p99.toFixed(2)}ms

SPIKE ANALYSIS:
${errorRate < 0.05 ? '🟢 EXCELLENT: System handles spikes gracefully' :
  errorRate < 0.15 ? '🟡 GOOD: Minor degradation during spikes' :
  '🔴 CONCERNING: Significant errors during traffic spikes'}

${p95 < 2000 ? '🟢 RESPONSE TIME: Fast even during spikes' :
  p95 < 4000 ? '🟡 RESPONSE TIME: Acceptable degradation' :
  '🔴 RESPONSE TIME: Severe slowdown during spikes'}

AUTOSCALING ASSESSMENT:
${errorRate < 0.1 && p95 < 3000 ? 
  '✅ System appears to handle spikes well - good autoscaling/capacity' :
  '⚠️  System struggles with sudden load - consider autoscaling improvements'}

RECOMMENDATIONS:
- Current spike capacity: ~${maxVUs} concurrent users
- ${p99 > 5000 ? 'Consider CDN caching for static assets' : 'Response times are acceptable'}
- ${errorRate > 0.1 ? 'Investigate rate limiting and circuit breakers' : 'Error handling is robust'}
- ${p95 > 3000 ? 'Consider implementing more aggressive caching strategies' : 'Performance is good under spikes'}

INFRASTRUCTURE INSIGHTS:
- Traffic pattern resilience: ${errorRate < 0.15 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
- Recovery speed: ${data.metrics.http_req_duration.values.med < 1000 ? 'FAST' : 'SLOW'}
- Baseline vs Spike degradation: ${(p95 / data.metrics.http_req_duration.values.avg).toFixed(1)}x slower
===========================================
    `,
  };
} 