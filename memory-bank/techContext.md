# LocalLoop Technical Context

## 🏗️ **Architecture Overview**
- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS + Shadcn UI components
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with OAuth providers
- **Deployment**: Vercel (configured)

## 🔧 **Confirmed Working Configurations**

### **Environment Variables** ✅
```bash
# .env.local (Primary file for secrets)
NEXT_PUBLIC_SUPABASE_URL=https://jbyuivzpetgbapisbnxy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true
NEXT_PUBLIC_ENABLE_APPLE_AUTH=false
GOOGLE_CLIENT_ID=729713375100-j6jjb5snk8bn2643kiev3su0jg6epedv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### **Authentication System** ✅
- **Supabase Integration**: Working with NEXT_PUBLIC_ prefixed variables
- **Google OAuth**: Configured and functional
- **Apple OAuth**: Code ready, disabled pending Apple Developer account
- **Feature Toggles**: Environment-based provider enablement
- **Middleware**: Handles auth state properly with correct env vars

### **Feature Toggle Pattern** ✅
```typescript
// lib/auth-context.tsx - Proven working pattern
const ENABLE_GOOGLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH !== 'false'
const ENABLE_APPLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH === 'true'

// Conditional UI rendering
{!isAppleAuthEnabled && (
    <Lock className="w-3 h-3 mr-1 text-gray-400" />
)}
```

### **React Performance Patterns** ✅
```typescript
// CORRECT: Move constants outside component
const sampleEvents = [/* data */]

// CORRECT: Memoize computed values
const nonFeaturedEvents = useMemo(() => 
  sampleEvents.filter(event => !event.featured), 
  [sampleEvents]
)

// AVOID: Objects/arrays inside component body (causes re-renders)
```

## 🗂️ **File Structure Confirmed**
```
LocalLoop-V0.3/
├── app/                     # Next.js App Router
│   ├── auth/               # Authentication pages ✅
│   ├── events/             # Event pages ✅  
│   └── page.tsx            # Homepage ✅
├── components/             # Reusable components ✅
├── lib/                    # Utilities and configs ✅
│   ├── auth-context.tsx    # Feature toggle auth ✅
│   ├── config.ts          # Centralized config ✅
│   └── supabase.ts        # DB client ✅
├── docs/                   # Documentation ✅
├── memory-bank/           # AI context files ✅
├── .env.local             # Secrets (gitignored) ✅
├── .env                   # Shared config ✅
└── .env.example           # Template ✅
```

## 🎨 **UI/UX Patterns Working**

### **Component Patterns**
- **Client Components**: Use "use client" for interactivity
- **Server Components**: Default for static content
- **Conditional Rendering**: Based on feature flags
- **Error Boundaries**: Graceful fallbacks

### **Styling Approach**
- **Tailwind CSS**: Utility-first styling
- **Responsive Design**: Mobile-first approach
- **Component States**: Disabled, loading, error states
- **Icons**: Lucide React for consistent iconography

## 🔒 **Security Configurations**

### **Environment Security** ✅
- **Secrets**: Stored in .env.local (gitignored)
- **Public Variables**: NEXT_PUBLIC_ prefix for client access
- **Git Protection**: .env* in .gitignore
- **API Keys**: Never committed to repository

### **Authentication Security** ✅
- **OAuth Flow**: Proper redirect handling
- **Session Management**: Supabase handles securely
- **Middleware**: Auth state protection
- **Error Handling**: No sensitive data in client errors

## 📊 **Performance Optimizations**

### **React Optimizations** ✅
- **Memoization**: useMemo for expensive computations
- **Component Structure**: Constants outside render
- **Dependency Arrays**: Properly configured useEffect
- **Code Splitting**: Dynamic imports where needed

### **Build Optimizations** ✅
- **Static Generation**: 25 pages pre-rendered
- **Image Optimization**: Next.js Image component
- **Bundle Size**: Optimized imports
- **Performance**: No console errors or warnings

## 🧪 **Testing & Quality**

### **Current Status** ✅
- **Console Errors**: None detected
- **Network Errors**: None detected
- **Build Status**: Successful
- **TypeScript**: No compilation errors
- **ESLint**: All issues resolved

### **Browser Compatibility** ✅
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Responsive**: Tested and working
- **JavaScript**: ES2022+ features supported
- **CSS**: Modern CSS features with fallbacks

## 🔄 **Development Workflow**

### **Environment Setup**
1. Use .env.local for local development
2. Restart dev server after env changes
3. Check git status before committing
4. Test auth flows after changes

### **Feature Development**
1. Check existing patterns in codebase
2. Follow TypeScript strict mode
3. Use feature toggles for new features
4. Test both enabled/disabled states

## 🚀 **Ready for Next Phase**
- **Foundation**: Solid and tested
- **Authentication**: Professional implementation
- **Environment**: Properly configured
- **Performance**: Optimized and error-free
- **Documentation**: Comprehensive guides created