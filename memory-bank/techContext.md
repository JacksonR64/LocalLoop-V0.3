# 🛠️ Technical Context - LocalLoop V0.3

## 🏗️ **Current Architecture Status**

### **✅ Production-Ready Tech Stack**
- **Frontend**: Next.js 15 with App Router, TypeScript 5.0, Tailwind CSS 4.0
- **Backend**: Supabase (PostgreSQL + Auth + Storage), Stripe payments
- **Integrations**: Google Calendar API (OAuth 2.0), Resend emails
- **Deployment**: Vercel with GitHub Actions CI/CD
- **Development**: ESLint, TypeScript strict mode, responsive design

---

## 🖼️ **Recent Technical Fixes - Image Loading & Next.js Deprecation**

### **🐛 Image Loading Error Resolution - CRITICAL LEARNING**
*From farmers-market image debugging session*

#### **❌ PROBLEM: Non-Existent Image References**
```typescript
// NEVER hardcode paths to non-existent images
const sampleGalleryImages = [
  { id: 1, src: '/images/farmers-market-1.jpg' }, // 404!
  { id: 2, src: '/images/farmers-market-2.jpg' }  // Returns HTML instead
];
```

#### **✅ SOLUTION: Placeholder or Conditional Rendering**
```typescript
// CORRECT - Use placeholders or conditional rendering
{sampleGalleryImages.length > 0 ? (
  <EventImageGallery images={sampleGalleryImages} />
) : (
  <div className="bg-gray-100 p-8 rounded-lg text-center">
    <p className="text-gray-600">Event images will be displayed here</p>
  </div>
)}
```

#### **🔑 Key Rules for Image Management**
1. **Validate image paths** before hardcoding in components
2. **Use placeholder content** when images aren't available
3. **Implement proper error handling** for missing or broken images
4. **Clean up unused imports** when removing functionality

---

### **⚠️ Next.js Deprecation Updates - API COMPLIANCE**
*From onLoadingComplete deprecation warnings*

#### **❌ DEPRECATED: onLoadingComplete API**
```typescript
// DEPRECATED in Next.js - generates warnings
<Image
  src={image.src}
  alt={image.alt}
  onLoadingComplete={() => setImageLoaded(true)} // ❌ Deprecated
  className="object-cover"
/>
```

#### **✅ CURRENT: onLoad API**
```typescript
// CORRECT - Current Next.js Image API
<Image
  src={image.src}
  alt={image.alt}
  onLoad={() => setImageLoaded(true)} // ✅ Current API
  className="object-cover"
/>
```

#### **🔑 Key Rules for Next.js Compliance**
1. **Stay current with API changes** - replace deprecated properties
2. **Monitor console warnings** - proactively fix deprecation warnings
3. **Clear build cache** when making API changes (delete `.next` directory)
4. **Verify fixes** with fresh browser reload and console check

---

### **🎨 CSS Class Validation - STYLE FIXES**
*From Tailwind CSS class typo debugging*

#### **❌ TYPO: Duplicate Prefix**
```typescript
// INCORRECT - Duplicate prefix causing invalid styling
className="bg-opacity-opacity-20 backdrop-blur-sm" // ❌ Double prefix
```

#### **✅ CORRECT: Single Prefix**
```typescript
// CORRECT - Proper Tailwind CSS class syntax
className="bg-opacity-20 backdrop-blur-sm" // ✅ Single prefix
```

#### **🔑 Key Rules for CSS Class Management**
1. **Double-check Tailwind syntax** - avoid duplicate prefixes
2. **Use IDE autocomplete** to prevent typos
3. **Validate classes** with browser inspector tools
4. **Maintain consistent spacing** and organization in class lists

---

## 🔧 **Previous Technical Debugging Learnings**

### **🐛 React useEffect Patterns - CRITICAL LEARNING**
*From RSVP API infinite loop debugging session*

#### **❌ ANTI-PATTERN: Dependency Cycle**
```typescript
// NEVER DO THIS - Creates infinite loop
const checkExistingRSVP = useCallback(async () => {
  // API call logic
}, [user, eventId]);

useEffect(() => {
  // ... initialization
  checkExistingRSVP(); // Called in useEffect
}, [checkExistingRSVP]); // Depends on useCallback function
// This creates new function on every user/eventId change
```

#### **✅ CORRECT PATTERN: Separated Effects**
```typescript
// CORRECT - Separate initialization from user-triggered actions
useEffect(() => {
  // One-time initialization per eventId
  if (eventId) {
    initializeComponent();
  }
}, [eventId]); // Only depends on eventId

useEffect(() => {
  // User-specific actions when user changes
  if (user) {
    checkExistingRSVP();
  }
}, [user]); // Only depends on user
```

#### **🔑 Key Rules for useEffect**
1. **Avoid useCallback in useEffect dependencies** - creates new functions on every render
2. **Separate concerns** - initialization vs. user actions vs. data changes
3. **Remove redundant calls** - don't call functions both inside and outside useEffect
4. **Use minimal dependencies** - only include what actually triggers the effect

---

### **🎨 PWA Manifest Best Practices**
*From apple-touch-icon 404 debugging session*

#### **❌ PROBLEM: Missing Icon References**
```json
// NEVER reference non-existent files
{
  "icons": [
    {"src": "/icon-192.png", "sizes": "192x192"}, // 404!
    {"src": "/apple-touch-icon.png", "sizes": "180x180"} // 404!
  ]
}
```

#### **✅ SOLUTION: Clean Manifest**
```json
// CORRECT - Only include essential metadata without missing files
{
  "name": "LocalLoop - Community Events Platform",
  "short_name": "LocalLoop",
  "description": "Discover and join local community events",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb"
  // NO icons array if files don't exist
}
```

#### **🔑 Key Rules for PWA Manifests**
1. **Remove references to missing files** rather than creating placeholder files
2. **Validate all icon paths** before adding to manifest
3. **Use HTML meta tags sparingly** - only for files that actually exist
4. **Clean console errors** improve developer experience and user trust

---

## 🔍 **Debugging Methodology Established**

### **Sequential Thinking Process**
1. **Problem Analysis**: Identify symptoms and potential root causes
2. **Code Investigation**: Use tools like grep_search and read_file systematically  
3. **Root Cause Identification**: Find the actual source, not just symptoms
4. **Solution Implementation**: Fix with targeted edits and verify results
5. **Documentation**: Update memory bank with learnings for future reference

### **Browser Tools Integration**
- **Terminal curl testing**: Quick API endpoint verification
- **Console monitoring**: Identify 404s, infinite loops, and errors
- **Network tab analysis**: Spot excessive requests and performance issues

---

## 🚀 **Current System Status**

### **✅ Working Components**
- **Authentication**: Supabase Auth with Google OAuth, email/password
- **Database**: PostgreSQL with RLS policies, proper schema applied
- **RSVP System**: Free events with email confirmations (Resend + React Email)
- **Payment System**: Stripe integration with webhooks and guest checkout
- **Event Pages**: Discovery, filtering, search, detail pages with maps
- **Google Calendar**: OAuth setup and "Add to Calendar" for RSVP users

### **🔧 Component Architecture**
- **RSVPTicketSection**: ✅ Fixed infinite loop, proper lifecycle management
- **EventImageGallery**: ✅ Lightbox with keyboard navigation
- **FilterComponents**: ✅ Real-time filtering with URL persistence
- **AuthProvider**: ✅ Context with session management
- **Layout Components**: ✅ Responsive navigation with auth states

### **📦 Key Dependencies**
```json
{
  "next": "^15.0.0",
  "react": "^18.0.0", 
  "typescript": "^5.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "stripe": "^14.0.0",
  "resend": "^3.0.0",
  "@react-email/components": "^0.0.0",
  "leaflet": "^1.9.0",
  "react-leaflet": "^4.0.0"
}
```

---

## 🐛 **Resolved Technical Challenges**

### **Database Schema Issues**
- **Problem**: Generated columns with `now()` function causing migration errors
- **Solution**: Replaced with database views for computed status fields
- **Pattern**: Use views for complex computed fields instead of generated columns

### **useEffect Infinite Loops**
- **Problem**: React dependency cycles causing constant API requests
- **Solution**: Separate effects by concern, avoid useCallback in dependencies
- **Pattern**: Minimal dependency arrays, separate initialization from user actions

### **PWA Manifest Errors**
- **Problem**: 404 errors for non-existent icon files
- **Solution**: Remove missing file references, keep essential metadata only
- **Pattern**: Validate all asset references before including in manifests

### **Build Configuration**
- **Problem**: TypeScript strict mode and ESLint errors
- **Solution**: Proper typing, unused parameter handling, import organization
- **Pattern**: Maintain zero-error build policy for production readiness

---

## 📊 **Performance Optimizations Applied**

### **Bundle Size Management**
- **Code Splitting**: Dynamic imports for map components and heavy libraries
- **Image Optimization**: Next.js Image with WebP conversion and lazy loading
- **Font Optimization**: Display swap for faster loading

### **API Performance**
- **Eliminated Polling**: Fixed infinite RSVP API requests
- **Proper Caching**: Browser cache headers and static generation
- **Error Handling**: Graceful degradation and retry logic

### **Database Performance**
- **Indexes**: Strategic indexing for common queries
- **RLS Policies**: Efficient row-level security without performance impact
- **Computed Columns**: Database-level calculations for real-time data

---

## 🔐 **Security Implementation**

### **Authentication Security**
- **OAuth 2.0**: Proper state parameter for CSRF protection
- **JWT Tokens**: Supabase-managed with automatic refresh
- **Session Management**: Secure cookie handling and expiration

### **Database Security**
- **Row-Level Security**: Complete data isolation between users
- **Input Validation**: Zod schemas for all API endpoints
- **SQL Injection Prevention**: Parameterized queries only

### **API Security**
- **CORS Configuration**: Proper origin restrictions
- **Rate Limiting**: Protection against abuse
- **Error Handling**: No sensitive data exposure in error messages

---

## 🎯 **Next Technical Priorities**

### **Task 10: Google Calendar for Paid Events**
- **OAuth Scope**: Calendar write permissions for ticket purchasers
- **Event Creation**: Automated calendar entries after payment
- **Error Handling**: Fallback for calendar API failures

### **Technical Debt**
- **Automated Testing**: Unit tests for critical components
- **Performance Monitoring**: Real user metrics and error tracking
- **Accessibility**: WCAG 2.1 AA compliance audit and fixes

---

## 🧠 **Developer Experience Improvements**

### **Debugging Tools**
- **Sequential Thinking**: Systematic problem-solving methodology
- **Memory Bank**: Comprehensive technical documentation
- **Browser Tools**: Terminal integration for quick testing

### **Code Quality**
- **TypeScript Strict**: Zero compilation errors maintained
- **ESLint Clean**: Consistent code standards enforced
- **Build Validation**: All checks passing before commits

### **Documentation Standards**
- **Technical Context**: Architecture and patterns documented
- **Debugging History**: Problem resolution patterns captured
- **Future Reference**: Searchable technical knowledge base

---

**Last Updated**: Current debugging session - RSVP infinite loop and PWA manifest fixes
**Status**: ✅ All core systems operational and optimized
**Next Focus**: Google Calendar integration for paid events (Task 10)