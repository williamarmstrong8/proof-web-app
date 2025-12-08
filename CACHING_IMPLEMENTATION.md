# Navbar Navigation Caching Implementation

## Overview

The navbar in the website template now implements caching for club settings to avoid refetching data on every page navigation. This optimization is similar to how the logged-in member is cached.

## Implementation Details

### Cache Key
- **Key**: `cached_club_settings`
- **Storage**: localStorage
- **Structure**: JSON object containing club settings and clubId

### Cache Structure
```json
{
  "clubId": "club-uuid",
  "showEventCalendar": false,
  "showContactPage": true
}
```

### How It Works

1. **Initial Load**: When the component first loads, it checks localStorage for cached settings
2. **Cache Hit**: If cached data exists and matches the current clubId, it uses the cached data immediately
3. **Cache Miss**: If no cached data exists, it fetches from the database and caches the result
4. **Club Change**: When the clubId changes, the cache is cleared and new data is fetched
5. **Error Handling**: If there's an error fetching data, the cache is cleared

### Benefits

- **Performance**: Eliminates unnecessary database calls on page navigation
- **User Experience**: Faster page loads and smoother navigation
- **Consistency**: Same caching pattern as membership data

### Cache Invalidation

The cache is automatically invalidated when:
- The clubId changes (different club)
- An error occurs during fetch
- The cache data is corrupted

### Manual Cache Clearing

The hook now returns a `clearCache` function that can be used to manually clear the cache if needed:

```typescript
const { showContactPage, clearCache } = useClubSettingsPublic(club?.id);

// Clear cache manually if needed
clearCache();
```

## Files Modified

- `src/shared/hooks/useClubSettingsPublic.ts` - Added caching logic
- `src/website-template/components/ui/navbar.tsx` - Uses the cached settings (no changes needed)

## Testing

To test the caching:
1. Navigate to a club website
2. Open browser dev tools and check network tab
3. Navigate between pages (About, Events, Contact)
4. Verify that settings are only fetched once and cached data is used on subsequent navigations 