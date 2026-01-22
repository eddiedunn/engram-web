# Engram Web - Issues Found During Manual Testing

## Test Summary
- **Date**: 2026-01-21
- **Total Tests**: 28
- **Passed**: 28
- **Failed**: 0 (after fixes to tests)

## Issues Found

### 1. [UX] Theme Toggle - First Click Has No Visible Effect
**Severity**: Low
**Category**: User Experience

**Description**:
When the theme is set to 'system' (default), and the user's system preference is 'light', the first click on the theme toggle button changes the internal state from 'system' to 'light' but has no visible effect on the UI. The user needs to click twice to see the theme change to dark mode.

**Steps to Reproduce**:
1. Load the application with default settings
2. Click the theme toggle button once
3. Observe no visible change
4. Click again to see the theme change to dark

**Expected Behavior**:
First click should produce a visible change (e.g., go directly to dark mode)

**Current Behavior**:
Theme cycle: system (shows light) → light (still shows light) → dark → system

**Suggested Fix**:
Consider a simpler toggle: light ↔ dark, or skip the 'light' state when coming from 'system' if they're visually identical.

**File**: `src/App.tsx` lines 34-43, `src/lib/theme-provider.tsx`

---

### 2. [Minor] Duplicate Theme Toggle Buttons in DOM
**Severity**: Very Low
**Category**: Accessibility / Code Quality

**Description**:
There are two theme toggle buttons in the navigation - one for desktop (visible on sm+ screens) and one for mobile. Both have the same `aria-label="Toggle theme"` which can cause issues for screen readers and automated testing.

**Current Implementation**:
- Desktop button: visible on `sm:` and above
- Mobile button: visible on `sm:hidden`

**Suggested Fix**:
This is technically working as intended for responsive design, but consider using unique IDs or more specific aria attributes for each button.

**File**: `src/App.tsx` lines 74-87 and 92-105

---

### 3. [Minor] Duplicate Navigation Links
**Severity**: Very Low
**Category**: Code Quality

**Description**:
On mobile viewport, there are hidden desktop navigation links (inside the tablist) and visible mobile navigation links. While this works correctly due to CSS hiding, it means the DOM has duplicate links to the same routes.

**Current Implementation**:
- Desktop tabs: Links to "/" and "/browse" inside tablist (hidden on mobile via `hidden sm:flex`)
- Mobile menu: Links to "/" and "/browse" (visible when menu is open)

**Impact**: None for users, minor complexity for automated testing requiring specific selectors.

**File**: `src/App.tsx`

---

### 4. [Note] API Error Handling
**Severity**: N/A (Working as Expected)
**Category**: Feature Verification

**Description**:
The application correctly handles API unavailability:
- Search page shows appropriate error state when search fails
- Browse page shows empty state when content fetch fails
- Content page shows "Content Not Found" when content ID is invalid

All error handling appears to work correctly when the Engram backend API is unavailable.

---

### 5. [Note] Responsive Design
**Severity**: N/A (Working as Expected)
**Category**: Feature Verification

**Description**:
Responsive design is working correctly across tested viewports:
- **Mobile (375px)**: Mobile menu button visible, desktop tabs hidden, all interactive elements have min-height of 44px
- **Tablet (768px)**: Desktop navigation visible, search form responsive
- **Desktop (1920px)**: Full layout displays correctly

---

## Test Coverage

### Search Functionality
- [x] Search page loads correctly
- [x] Empty search handling (button disabled)
- [x] Search mode toggles (Hybrid/Semantic/Full-text)
- [x] Type filter dropdown
- [x] Results count selector (10/25/50/100)
- [x] Clear filters button
- [x] API error handling

### Content Viewer
- [x] 404 handling for invalid content ID
- [x] Back button navigation
- [x] Go to Search link

### Browse Page
- [x] Page loads correctly
- [x] Content type filter
- [x] Sort options
- [x] API error handling

### Navigation
- [x] Tab navigation works
- [x] Logo links to home

### Responsive Design
- [x] Mobile viewport (375px)
- [x] Mobile menu opens and navigates
- [x] Tablet viewport (768px)
- [x] Desktop viewport (1920px)

### Dark Mode
- [x] Theme toggle button exists
- [x] Theme toggle changes mode (with UX note)
- [x] Theme persists across page reload

### Keyboard Navigation
- [x] Ctrl+K focuses search
- [x] Enter key submits search

### 404 Page
- [x] Random URL shows 404
- [x] 404 page has navigation links

---

## Recommendations

1. **Consider simplifying theme toggle logic** - The 3-state cycle (system/light/dark) can be confusing when system preference matches one of the explicit modes.

2. **All critical functionality is working** - The application handles errors gracefully and provides good feedback to users.

3. **Test with live API** - Full search functionality, content viewing with transcripts, and pagination should be tested with the Engram backend running.
