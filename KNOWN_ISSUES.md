# Known Issues & Limitations

## Current Limitations

### Testing
- ⚠️ No automated tests yet (smoke tests in progress)
- ⚠️ No e2e tests for critical paths
- ✅ TypeScript provides compile-time safety

### Performance
- ℹ️ Large result sets (1000+) may cause UI lag
- ℹ️ Virtualization helps but not optimized for huge datasets
- 💡 Future: Implement server-side pagination

### Accessibility
- ⚠️ Not fully WCAG 2.1 compliant
- ⚠️ Screen reader support needs testing
- 💡 Future: Full accessibility audit

### Browser Support
- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ❌ IE11 not supported (by design)
- ⚠️ Mobile browsers not extensively tested

## Future Enhancements

### High Priority
- [ ] Add comprehensive test suite
- [ ] Implement error monitoring (Sentry)
- [ ] Add loading spinners for slow operations

### Medium Priority
- [ ] Export search results as CSV
- [ ] Save search queries as bookmarks
- [ ] Add keyboard shortcuts guide

### Low Priority
- [ ] Add analytics/usage tracking
- [ ] Implement PWA features
- [ ] Add offline mode support

## Won't Fix

- IE11 support (modern browsers only)
- Server-side rendering (SPA by design)
