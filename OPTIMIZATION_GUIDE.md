# Performance Optimization Guide

This guide explains the optimizations implemented to improve your application's performance and reduce bundle size.

## 🚀 Bundle Size Optimizations

### 1. Code Splitting
- **Lazy Loading**: All major route components are now lazy-loaded using `React.lazy()` and `Suspense`
- **Manual Chunk Splitting**: Vendor libraries are split into separate chunks:
  - `react-vendor`: React and React DOM
  - `router-vendor`: React Router
  - `supabase-vendor`: Supabase client libraries
  - `ui-vendor`: All Radix UI components
  - `form-vendor`: Form handling libraries
  - `utils-vendor`: Utility libraries
  - `charts-vendor`: Charting libraries
  - Feature-specific chunks for admin, staff, landing, and website components

### 2. Build Optimizations
- **Source Maps Disabled**: Removed source maps in production for smaller bundles
- **Increased Warning Limit**: Set to 1MB to reduce noise from large chunks
- **Optimized Chunk Naming**: Better file naming for caching

## 🖼️ Image Optimizations

### 1. Image Compression Script
Run the image optimization script to compress your blog images:

```bash
npm run optimize-images
```

This script will:
- Compress all images in `public/blog/images/`
- Create multiple sizes (300px, 600px, 1200px, 1800px)
- Generate WebP versions for better compression
- Save optimized images to `public/blog/images/optimized/`

### 2. OptimizedImage Component
Use the new `OptimizedImage` component for better image loading:

```tsx
import OptimizedImage from '@/shared/components/OptimizedImage';

<OptimizedImage
  src="/blog/images/your-image.jpg"
  alt="Description"
  className="w-full h-64 object-cover"
  priority={true} // For above-the-fold images
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

Features:
- **Lazy Loading**: Images load only when they enter the viewport
- **Responsive Images**: Automatically serves the right size based on screen
- **WebP Support**: Modern format with fallback to JPEG
- **Blur Placeholder**: Optional blur effect while loading
- **Error Handling**: Graceful fallback for failed images

## 📊 Bundle Analysis

Analyze your bundle size to identify optimization opportunities:

```bash
npm run analyze
```

This will show you:
- Which chunks are the largest
- What dependencies are taking up space
- Opportunities for further optimization

## 🎯 Expected Improvements

### Before Optimization:
- **JavaScript Bundle**: ~2.4MB
- **Image Sizes**: 1-5MB per image
- **Initial Load**: Slow due to large bundle

### After Optimization:
- **JavaScript Bundle**: Split into multiple smaller chunks (~200-500KB initial)
- **Image Sizes**: 80-90% smaller with WebP
- **Initial Load**: Much faster with lazy loading

## 🔧 Implementation Steps

1. **Run Image Optimization**:
   ```bash
   npm run optimize-images
   ```

2. **Update Blog Components**:
   Replace regular `<img>` tags with `<OptimizedImage>` in your blog components.

3. **Test Performance**:
   ```bash
   npm run build
   npm run analyze
   ```

4. **Monitor Results**:
   - Check bundle size in build output
   - Test loading performance in browser
   - Verify image loading works correctly

## 📈 Additional Optimizations

### 1. Tree Shaking
Ensure you're only importing what you need:
```tsx
// ❌ Bad - imports entire library
import * as Icons from 'lucide-react';

// ✅ Good - imports only what you need
import { Home, User } from 'lucide-react';
```

### 2. Dynamic Imports
For heavy components that aren't immediately needed:
```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### 3. Preloading Critical Resources
Add preload links for critical resources:
```html
<link rel="preload" href="/critical-image.jpg" as="image">
<link rel="preload" href="/critical-font.woff2" as="font" crossorigin>
```

## 🐛 Troubleshooting

### Image Optimization Issues
- Ensure `sharp` is installed: `npm install sharp`
- Check file permissions for the images directory
- Verify image formats are supported (jpg, png, webp)

### Bundle Size Still Large
- Run `npm run analyze` to identify large dependencies
- Consider replacing heavy libraries with lighter alternatives
- Implement more aggressive code splitting

### Lazy Loading Not Working
- Check that components are properly wrapped in `Suspense`
- Verify the loading spinner is visible during load
- Ensure error boundaries are in place

## 📚 Resources

- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [React Lazy Loading](https://react.dev/reference/react/lazy)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
- [WebP Format](https://developers.google.com/speed/webp) 