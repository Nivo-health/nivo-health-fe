# PWA Maintenance Guide

## 🔄 Service Worker Updates

When you deploy a new version, the service worker will automatically update for users:

1. **Build new version:**
   ```bash
   npm run build
   ```

2. **Deploy to production:**
   - The new service worker will be generated
   - Users will get the update automatically (due to `registerType: 'autoUpdate'`)

3. **User experience:**
   - Users will see the new version on next page load
   - No manual update required

## 📱 Monitoring PWA Usage

### Check Install Statistics

**Chrome/Edge:**
- Users who install your PWA will show up in analytics
- Look for "standalone" display mode in analytics

**iOS:**
- Users who add to home screen will use the app in standalone mode
- Track via analytics or server logs

### Browser DevTools

Check PWA status:
1. Open your deployed app
2. DevTools → Application tab
3. Check:
   - Service Workers (should be active)
   - Manifest (should show all icons)
   - Cache Storage (should show cached files)

## 🐛 Troubleshooting Production Issues

### Service Worker Not Updating

If users aren't getting updates:
1. Check service worker is registered
2. Verify `registerType: 'autoUpdate'` in `vite.config.ts`
3. Clear cache and test

### Icons Not Showing

1. Verify icon files are in `public/` folder
2. Check manifest includes all icons
3. Ensure icons are accessible (not blocked by CORS)

### Offline Not Working

1. Check service worker is active
2. Verify files are being cached
3. Test in offline mode (DevTools → Network → Offline)

## 🔧 Updating Icons

If you need to change app icons:

```bash
# 1. Replace public/icon-source.svg
# 2. Regenerate icons
npm run generate-icons
# 3. Rebuild and deploy
npm run build
# 4. Deploy to production
```

## 📊 Best Practices

1. **Version Updates:**
   - Service worker auto-updates are enabled
   - Users get new versions automatically
   - No action needed for updates

2. **Cache Management:**
   - Current strategy: Cache all static assets
   - API calls use network-first (if you add real API)
   - Adjust in `vite.config.ts` → `workbox.runtimeCaching`

3. **Performance:**
   - Icons are optimized automatically
   - Service worker caches assets for fast loading
   - First load may be slower, subsequent loads are instant

4. **Testing:**
   - Test on real devices regularly
   - Verify offline functionality
   - Check install prompts work

## 🚀 Future Enhancements

Consider adding:

1. **Push Notifications:**
   - Notify users of new visits
   - Remind about follow-ups

2. **Background Sync:**
   - Sync data when connection is restored
   - Queue actions when offline

3. **Share Target:**
   - Allow sharing data to your app
   - Receive data from other apps

4. **File System Access:**
   - Save prescriptions locally
   - Export data to device

## 📝 Notes

- Service worker updates automatically
- Users don't need to manually update
- Offline mode works for cached resources
- Install prompt appears after user engagement

---

**Your PWA is live and working! 🎉**
