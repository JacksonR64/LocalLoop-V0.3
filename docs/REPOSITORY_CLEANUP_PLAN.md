# Repository Cleanup Plan

## 📋 Overview
Comprehensive cleanup and organization plan for LocalLoop repository to improve maintainability and remove development artifacts.

## 🗂️ Files to Move/Reorganize

### 1. Documentation Files (Move to `docs/`)
- `DEPLOYMENT_TASKS.md` → `docs/deployment-tasks.md`
- `TESTING-GUIDE.md` → `docs/testing-guide.md`
- `LocalLoop-Application-Architecture.md` → `docs/application-architecture.md`
- `HANDOVER-SUMMARY.md` → `docs/handover-summary.md`
- `DEPLOYMENT.md` → `docs/deployment.md`

### 2. Test Scripts (Move to `scripts/test/`)
- `test-refund-workflow.js` → `scripts/test/refund-workflow.js`
- `test-stripe-checkout.js` → `scripts/test/stripe-checkout.js`
- `test-ticket-confirmation.js` → `scripts/test/ticket-confirmation.js`
- `test-email.js` → `scripts/test/email.js`

### 3. Utility Scripts (Move to `scripts/utils/`)
- `fix-database.js` → `scripts/utils/fix-database.js`

## 🗑️ Files to Remove/Ignore

### 1. Build Artifacts (Add to .gitignore)
- `.next/` (already ignored)
- `test-results/`
- `playwright-report/`
- `reports/`
- `coverage/`
- `tsconfig.tsbuildinfo`

### 2. System Files (Add to .gitignore)
- `.DS_Store`
- `.swc/`
- `.vercel/`

### 3. IDE/Editor Files (Add to .gitignore)
- `.windsurfrules` (Windsurf IDE specific)
- `.roomodes` (Roo IDE specific)
- `.roo/` (Roo IDE directory)

### 4. Temporary Directories
- `copy/` (appears to be temporary)
- `backup-scripts/` (if no longer needed)

## 📦 Dependencies Review

### Keep (Essential Dependencies)
- `@tailwindcss/*` - Used for styling
- `eslint*` - Code quality
- `jest*` - Testing framework
- `postcss` - CSS processing
- `tailwindcss` - Styling framework

### Investigate Further
- Check if all dependencies in package.json are actually used
- Review devDependencies for any truly unused packages

## 🔧 Configuration Files

### Keep in Root
- `package.json`, `package-lock.json`
- `tsconfig.json`, `next-env.d.ts`
- `next.config.ts`
- `middleware.ts`
- `jest.config.js`, `jest.setup.js`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `commitlint.config.js`
- `playwright.config.ts`, `playwright.ci.config.ts`
- `lighthouserc.js`
- `.audit-ci.json`
- `.taskmasterconfig`
- `.gitignore`
- `vercel.json`
- `README.md`

### Environment Files
- `.env.example` (keep)
- `.env.local` (already ignored)

## 📁 Directory Structure (Target)

```
LocalLoop/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utilities and configurations
├── public/                 # Static assets
├── tests/                  # Test files
├── e2e/                    # E2E tests
├── docs/                   # All documentation
│   ├── deployment-tasks.md
│   ├── testing-guide.md
│   ├── application-architecture.md
│   ├── handover-summary.md
│   └── deployment.md
├── scripts/                # Build/utility scripts
│   ├── test/              # Test scripts
│   └── utils/             # Utility scripts
├── .github/                # GitHub workflows
├── memory-bank/            # TaskMaster memory
├── tasks/                  # TaskMaster tasks
└── [config files]         # Root config files
```

## ✅ Implementation Steps

1. **Phase 1**: Update .gitignore and remove tracked temporary files
2. **Phase 2**: Move documentation files to docs/
3. **Phase 3**: Move test scripts to scripts/test/
4. **Phase 4**: Move utility scripts to scripts/utils/
5. **Phase 5**: Update all import paths and references
6. **Phase 6**: Test functionality after each phase
7. **Phase 7**: Clean up any remaining artifacts

## 🧪 Testing Strategy

- Run full test suite after each phase
- Verify build process works
- Check that all imports resolve correctly
- Ensure CI/CD pipeline still works
- Manual testing of key functionality

---

*Created: 2025-06-06*
*Branch: feature/repository-cleanup* 