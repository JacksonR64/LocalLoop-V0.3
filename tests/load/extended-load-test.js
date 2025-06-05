import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const rsvpAttempts = new Counter('rsvp_attempts');
const ticketPurchaseAttempts = new Counter('ticket_purchase_attempts');

export const options = {
  stages: [
    { duration: '1m', target: 5 },   // Warm up
    { duration: '3m', target: 15 },  // Normal load
    { duration: '2m', target: 25 },  // Peak load
    { duration: '2m', target: 15 },  // Scale down
    { duration: '1m', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // Slightly higher threshold for complex flows
    http_req_failed: ['rate<0.15'],
    errors: ['rate<0.15'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// User journey scenarios
const scenarios = ['browser', 'rsvp_user', 'ticket_buyer', 'staff_user'];

export default function () {
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  const params = {
    headers: {
      'User-Agent': 'k6-extended-test/1.0',
      'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  };

  switch (scenario) {
    case 'browser':
      browserJourney(params);
      break;
    case 'rsvp_user':
      rsvpUserJourney(params);
      break;
    case 'ticket_buyer':
      ticketBuyerJourney(params);
      break;
    case 'staff_user':
      staffUserJourney(params);
      break;
  }
}

function browserJourney(params) {
  // Casual browser - just browsing events
  
  // Homepage
  let response = http.get(`${BASE_URL}/`, params);
  check(response, {
    'Homepage loads': (r) => r.status === 200,
  });
  sleep(3); // User reads homepage
  
  // Browse events with filters
  response = http.get(`${BASE_URL}/?category=workshop&search=local`, params);
  check(response, {
    'Filtered events load': (r) => r.status === 200,
  });
  sleep(2);
  
  // View event details (simulate clicking on multiple events)
  for (let i = 1; i <= 3; i++) {
    response = http.get(`${BASE_URL}/events/${i}`, params);
    check(response, {
      'Event detail loads': (r) => r.status === 200 || r.status === 404,
    });
    sleep(4); // User reads event details
  }
  
  // Check about page
  response = http.get(`${BASE_URL}/about`, params);
  check(response, {
    'About page loads': (r) => r.status === 200,
  });
  sleep(1);
}

function rsvpUserJourney(params) {
  // User who wants to RSVP to free events
  
  // Start at homepage
  let response = http.get(`${BASE_URL}/`, params);
  check(response, {
    'Homepage loads for RSVP user': (r) => r.status === 200,
  });
  sleep(2);
  
  // Find a free event
  response = http.get(`${BASE_URL}/events/1`, params); // Assume event 1 is free
  check(response, {
    'Free event detail loads': (r) => r.status === 200,
  });
  sleep(3);
  
  // Attempt RSVP (guest user)
  const guestEmail = `loadtest+${randomString(8)}@example.com`;
  const rsvpData = {
    eventId: 1,
    email: guestEmail,
    firstName: 'LoadTest',
    lastName: 'User',
    dietaryRestrictions: 'None',
  };
  
  response = http.post(`${BASE_URL}/api/rsvps`, JSON.stringify(rsvpData), {
    headers: {
      ...params.headers,
      'Content-Type': 'application/json',
    },
  });
  
  rsvpAttempts.add(1);
  const rsvpSuccess = check(response, {
    'RSVP submission succeeds': (r) => r.status === 200 || r.status === 201,
    'RSVP response time OK': (r) => r.timings.duration < 2000,
  });
  
  if (!rsvpSuccess) {
    errorRate.add(1);
  }
  
  sleep(2);
  
  // Try to view my events (should redirect to login)
  response = http.get(`${BASE_URL}/my-events`, params);
  check(response, {
    'My events page accessible': (r) => r.status === 200 || r.status === 302,
  });
  sleep(1);
}

function ticketBuyerJourney(params) {
  // User who wants to buy tickets to paid events
  
  // Homepage
  let response = http.get(`${BASE_URL}/`, params);
  check(response, {
    'Homepage loads for ticket buyer': (r) => r.status === 200,
  });
  sleep(2);
  
  // Look for paid events
  response = http.get(`${BASE_URL}/events/2`, params); // Assume event 2 has tickets
  check(response, {
    'Paid event detail loads': (r) => r.status === 200,
  });
  sleep(4); // User considers purchase
  
  // Check ticket types
  response = http.get(`${BASE_URL}/api/ticket-types/2`, params);
  check(response, {
    'Ticket types load': (r) => r.status === 200 || r.status === 404,
  });
  sleep(2);
  
  // Attempt to start checkout
  const checkoutData = {
    eventId: 2,
    ticketTypeId: 1,
    quantity: 1,
    email: `buyer+${randomString(8)}@example.com`,
    firstName: 'LoadTest',
    lastName: 'Buyer',
  };
  
  response = http.post(`${BASE_URL}/api/checkout`, JSON.stringify(checkoutData), {
    headers: {
      ...params.headers,
      'Content-Type': 'application/json',
    },
  });
  
  ticketPurchaseAttempts.add(1);
  const checkoutSuccess = check(response, {
    'Checkout initiation responds': (r) => r.status === 200 || r.status === 400 || r.status === 401,
    'Checkout response time OK': (r) => r.timings.duration < 3000,
  });
  
  if (!checkoutSuccess) {
    errorRate.add(1);
  }
  
  sleep(3);
}

function staffUserJourney(params) {
  // Staff member managing events
  
  // Try to access staff dashboard
  let response = http.get(`${BASE_URL}/staff/dashboard`, params);
  check(response, {
    'Staff dashboard accessible': (r) => r.status === 200 || r.status === 302 || r.status === 401,
  });
  sleep(2);
  
  // Try to access event creation (should require auth)
  response = http.get(`${BASE_URL}/staff/events/create`, params);
  check(response, {
    'Event creation page accessible': (r) => r.status === 200 || r.status === 302 || r.status === 401,
  });
  sleep(2);
  
  // Check analytics endpoints
  response = http.get(`${BASE_URL}/api/staff/analytics`, params);
  check(response, {
    'Analytics API accessible': (r) => r.status === 200 || r.status === 401 || r.status === 403,
  });
  sleep(1);
  
  // Try attendee management
  response = http.get(`${BASE_URL}/api/staff/attendees/1`, params);
  check(response, {
    'Attendee management accessible': (r) => r.status === 200 || r.status === 401 || r.status === 404,
  });
  sleep(2);
}

export function handleSummary(data) {
  return {
    'tests/load/results/extended-load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
📊 Extended Load Test Results Summary:
===========================================
Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(1)}s
Total Requests: ${data.metrics.http_reqs.values.count}
Success Rate: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%
Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
p95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
Max VUs: ${data.metrics.vus_max.values.max}

User Journey Metrics:
- RSVP Attempts: ${data.metrics.rsvp_attempts ? data.metrics.rsvp_attempts.values.count : 0}
- Ticket Purchase Attempts: ${data.metrics.ticket_purchase_attempts ? data.metrics.ticket_purchase_attempts.values.count : 0}

Performance Thresholds:
- p95 Response Time < 3000ms: ${data.metrics.http_req_duration.values['p(95)'] < 3000 ? '✅ PASS' : '❌ FAIL'}
- Error Rate < 15%: ${data.metrics.http_req_failed.values.rate < 0.15 ? '✅ PASS' : '❌ FAIL'}

Recommendations:
${data.metrics.http_req_duration.values['p(95)'] > 2000 ? '⚠️  Consider optimizing slow endpoints' : '✅ Response times are healthy'}
${data.metrics.http_req_failed.values.rate > 0.05 ? '⚠️  Error rate is elevated - check logs' : '✅ Error rate is acceptable'}
===========================================
    `,
  };
} 