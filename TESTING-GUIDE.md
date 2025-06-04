# 🧪 LocalLoop E2E Testing Guide

## Prerequisites
- Development server running on `http://localhost:3000`
- Valid environment variables configured (`.env.local`)
- Supabase project connected
- Resend API key configured for email testing

## 🚀 Quick Test Commands

### 1. **Start Development Server** (if not running)
```bash
npm run dev
```

### 2. **Test Application Health**
```bash
# Test homepage
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/

# Test event page
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/events/00000000-0000-0000-0000-000000000003

# Test API endpoints
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/google/status
```

## 📧 Email Notifications Testing

### **Test 1: Welcome Email** ✉️
```bash
# Test welcome email endpoint
curl -X POST http://localhost:3000/api/auth/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "4d705c67-97eb-4343-a700-fa4b1aea37ed",
    "user_email": "test@example.com", 
    "user_name": "Test User"
  }'
```

### **Test 2: Event Reminders** 📅
```bash
# Send 24-hour reminder to all attendees
curl -X POST http://localhost:3000/api/events/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "00000000-0000-0000-0000-000000000003",
    "reminder_type": "24h",
    "recipients": "all",
    "organizer_id": "4d705c67-97eb-4343-a700-fa4b1aea37ed"
  }'

# Send 1-hour reminder to ticket holders only
curl -X POST http://localhost:3000/api/events/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "00000000-0000-0000-0000-000000000003",
    "reminder_type": "1h",
    "recipients": "ticket_holders",
    "organizer_id": "4d705c67-97eb-4343-a700-fa4b1aea37ed"
  }'
```

### **Test 3: Event Cancellation** ❌
```bash
# Cancel event and notify all attendees
curl -X POST http://localhost:3000/api/events/cancellation \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "00000000-0000-0000-0000-000000000003",
    "organizer_id": "4d705c67-97eb-4343-a700-fa4b1aea37ed",
    "reason": "Due to unforeseen circumstances",
    "alternative_event_id": null
  }'
```

## 🎫 Stripe Checkout Testing

### **Test Payment Intent Creation**
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "00000000-0000-0000-0000-000000000003",
    "ticket_items": [
      {
        "ticket_type_id": "00000003-0001-0000-0000-000000000000",
        "quantity": 1
      }
    ],
    "customer_details": {
      "email": "test@example.com",
      "name": "Test Customer"
    }
  }'
```

## 📅 Google Calendar Integration Testing

### **Test Connection Status**
```bash
curl http://localhost:3000/api/auth/google/status
```

### **Test Calendar Event Creation**
```bash
curl -X POST http://localhost:3000/api/calendar/create-event \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "00000000-0000-0000-0000-000000000003"
  }'
```

## 🎟️ RSVP System Testing

### **Create RSVP**
```bash
curl -X POST http://localhost:3000/api/rsvps \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "00000000-0000-0000-0000-000000000003",
    "user_id": "4d705c67-97eb-4343-a700-fa4b1aea37ed",
    "attendee_count": 2,
    "attendee_names": ["John Doe", "Jane Doe"]
  }'
```

### **Cancel RSVP**
```bash
curl -X DELETE http://localhost:3000/api/rsvps/[rsvp-id]
```

## 🌐 Browser Testing Checklist

### **Homepage (http://localhost:3000)**
- [ ] Page loads without errors
- [ ] Hero section displays correctly
- [ ] Featured events section populated
- [ ] Navigation menu functional
- [ ] Mobile responsive design

### **Event Page (http://localhost:3000/events/[id])**
- [ ] Event details display correctly
- [ ] RSVP button works
- [ ] Ticket purchase flow
- [ ] Google Calendar integration
- [ ] Share functionality

### **Authentication Flow**
- [ ] Google OAuth login
- [ ] User profile creation
- [ ] Session management
- [ ] Logout functionality

### **Create Event Flow**
- [ ] Form validation
- [ ] Image upload
- [ ] Date/time picker
- [ ] Ticket type creation
- [ ] Event publishing

## 🔧 Debug Commands

### **Check Server Logs**
```bash
# View development server logs in real-time
tail -f .next/trace

# Check for specific errors
grep -i "error" .next/trace | tail -20
```

### **Database Connection Test**
```bash
curl http://localhost:3000/api/events/00000000-0000-0000-0000-000000000003
```

### **Environment Variables Check**
```bash
# Verify Resend API key (should show configured)
curl http://localhost:3000/api/auth/welcome
# Response should be 400 with validation error, not 500 server error
```

## 📊 Expected Response Examples

### **Successful Welcome Email**
```json
{
  "message": "Welcome email sent successfully",
  "messageId": "01234567-89ab-cdef-0123-456789abcdef",
  "success": true
}
```

### **Successful Payment Intent**
```json
{
  "client_secret": "pi_1234567890_secret_abcdef",
  "payment_intent_id": "pi_1234567890",
  "amount": 2500,
  "currency": "usd"
}
```

### **Google Calendar Status**
```json
{
  "connected": true,
  "healthy": true,
  "primaryCalendar": "user@example.com",
  "expiresAt": "2025-06-04T00:11:33.079+00:00"
}
```

## 🚨 Common Issues & Solutions

### **Email Not Sending**
- Check `RESEND_API_KEY` in `.env.local`
- Verify email templates compile correctly
- Check server logs for detailed error messages

### **Stripe Checkout Failing**
- Verify `STRIPE_SECRET_KEY` configuration
- Check payment amounts (should be in cents)
- Ensure test mode for development

### **Google Calendar Disconnected**
- Re-authenticate through `/auth/google/callback`
- Check token expiration in database
- Verify OAuth credentials

### **Database Connection Issues**
- Check Supabase connection string
- Verify user permissions
- Test database queries directly

## 📈 Performance Testing

### **Load Test Homepage**
```bash
# Simple load test (requires Apache Bench)
ab -n 100 -c 10 http://localhost:3000/

# Test event page performance
ab -n 50 -c 5 http://localhost:3000/events/00000000-0000-0000-0000-000000000003
```

### **API Endpoint Performance**
```bash
# Test API response times
time curl -s http://localhost:3000/api/auth/google/status > /dev/null
```

---

## 🎯 Key Test Scenarios

1. **New User Journey**: Signup → Welcome Email → Create Event → RSVP
2. **Event Organizer Flow**: Create Event → Manage RSVPs → Send Reminders → Cancel Event
3. **Attendee Experience**: Browse Events → RSVP → Receive Confirmation → Get Reminders
4. **Payment Flow**: Select Tickets → Checkout → Payment → Confirmation Email
5. **Calendar Integration**: Connect Google → Add Events → Sync Changes

---

*Happy Testing! 🚀* 