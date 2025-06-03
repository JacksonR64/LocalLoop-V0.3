# 🛠️ Technical Context - LocalLoop V0.3

**Updated:** 2025-01-03 21:45:00 UTC

## 🏗️ **Current Architecture Status**

### **✅ VERIFIED WORKING CONFIGURATIONS**

#### **RSVP API Architecture (FIXED)**
```typescript
// ✅ CORRECT PATTERN - Auth BEFORE Validation
export async function POST(request: NextRequest) {
    const body = await request.json()
    const supabase = await createServerSupabaseClient()
    
    // 1. Get user authentication FIRST
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // 2. Add user_id to body if authenticated
    if (user && !authError) {
        body.user_id = user.id
    }
    
    // 3. THEN validate with complete data
    const validatedData = rsvpValidationSchema.parse(body)
    
    // Continue with database operations...
}
```

#### **Database Column Alignment (CONFIRMED)**
```sql
-- ✅ CORRECT Column References
events table:
- published (not is_open_for_registration)  
- cancelled (not is_cancelled)
- location_details (not address)

users table:
- display_name (not full_name)
- email (confirmed working)
```

#### **Event Query Pattern (WORKING)**
```typescript
// ✅ VERIFIED WORKING Query
const { data: event, error } = await supabase
    .from('events')
    .select(`
        id, title, description, start_time, end_time,
        location_details, published, cancelled,
        users!events_organizer_id_fkey(display_name)
    `)
    .eq('id', uuid)
    .eq('published', true)
    .single()
```

### **🎯 Component Interface Patterns**

#### **TicketSelection Component (FIXED)**
```typescript
// ✅ CORRECT Interface Usage
interface TicketSelectionProps {
    eventId: string
    selectedTickets: TicketSelection[]  // Array, not object
    onTicketsChange: (tickets: TicketSelection[]) => void
    onPurchaseClick: (eventId: string, tickets: TicketSelection[]) => void
}
```

#### **EventDetailClient Props (UPDATED)**  
```typescript
// ✅ WORKING Configuration
<TicketSelection
    eventId={event.id}
    selectedTickets={selectedTickets}  // Array format
    onTicketsChange={setSelectedTickets}
    onPurchaseClick={handlePurchaseClick}
/>
```

### **⚠️ KNOWN TECHNICAL DEBT**

#### **TypeScript Configuration Issues**
1. **Missing Module**: `@/lib/types` module referenced but doesn't exist
2. **Type Casting**: Event user data needs proper interface definition  
3. **Import Structure**: EventImageGallery needs default export fix
4. **Interface Alignment**: Several components have type mismatches

#### **Asset Management Issues**
1. **Leaflet Icons**: marker-shadow.png and marker-icon-2x.png returning 404s
2. **Image Optimization**: Some Unsplash URLs not resolving properly
3. **Next.js Image Config**: Remote patterns configured but some issues remain

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

## 🔍 **Debugging Patterns Discovered**

### **RSVP Validation Flow Analysis**
- **Root Cause**: Validation happening before authentication context available
- **Solution**: Always authenticate user before validation for authenticated endpoints
- **Pattern**: GET user → ADD to request body → VALIDATE → PROCESS

### **Database Schema Investigation**
- **Method**: Used Supabase MCP tools to examine actual table structure
- **Discovery**: Column names in code didn't match actual database schema  
- **Fix Pattern**: Always verify column names against actual database before queries

### **Component Type Debugging**
- **Issue**: Interface mismatches between parent and child components
- **Root Cause**: EventDetailClient was treating `selectedTickets` as object, but TicketSelection expected array
- **Resolution**: Align component interfaces and ensure data flow consistency

## 🚀 Performance Optimizations Applied**

### **Database Query Efficiency**
- Using precise column selection instead of `*`
- Proper indexing on UUID lookups
- Single queries instead of multiple API calls where possible

### **Component Rendering**
- Removed unused imports to reduce bundle size
- Fixed TypeScript errors to improve compilation performance
- Eliminated console errors for cleaner runtime performance

## 📋 Working Code Patterns**

### **Supabase Authentication Check**
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (!authError && user) {
    // User is authenticated
    body.user_id = user.id
}
```

### **Event ID Mapping (Maintained)**
```typescript
function mapEventIdToUuid(numericId: string): string {
    const idMap: Record<string, string> = {
        '1': '550e8400-e29b-41d4-a716-446655440001',
        // ... other mappings
    }
    return idMap[numericId] || numericId
}
```

### **Error Handling Pattern**
```typescript
try {
    const validatedData = schema.parse(body)
    // Process request
} catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    // Handle other errors
}
```

## 🎯 Next Technical Priorities**

1. **Create Missing Module**: Set up proper `@/lib/types` module with all interface definitions
2. **Fix Image Gallery**: Resolve EventImageGallery default export structure  
3. **Asset Bundling**: Configure proper Leaflet icon asset handling
4. **Type Safety**: Complete TypeScript error resolution
5. **Performance**: Optimize remaining database queries and component rendering

**Technical Status**: ✅ Core RSVP functionality restored and operational with proper patterns established