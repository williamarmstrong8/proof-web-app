# Open Graph Implementation for ClubKit

This document explains the Open Graph meta tags implementation for ClubKit's multi-tenant club websites.

## Overview

ClubKit now generates rich link previews when club pages and event pages are shared on social media platforms, messaging apps, and other platforms that support Open Graph meta tags.

## Implementation Details

### 1. Club Homepage Meta Tags (`/`)

**Component**: `src/website-template/components/MetaTags.tsx`

**Generated Meta Tags**:
- `og:title` - Club name
- `og:description` - Club tagline or about blurb
- `og:image` - Club hero image (large) → hero image → logo → default OG image
- `og:url` - Full club subdomain URL
- `og:type` - "website"
- `og:site_name` - "ClubKit"
- `og:locale` - "en_US"
- `twitter:card` - "summary_large_image"
- `twitter:title` - Club name
- `twitter:description` - Club tagline or about blurb
- `twitter:image` - Same as og:image
- `twitter:site` - "@clubkit"
- `twitter:creator` - "@clubkit"

**Image Priority**:
1. `club.hero_image_large_url` (optimized large image)
2. `club.hero_image_url` (original hero image)
3. `club.logo_url` (club logo)
4. `/default-og.svg` (fallback default image)

### 2. Event Page Meta Tags (`/event/[eventId]`)

**Component**: `src/website-template/components/EventMetaTags.tsx`

**Generated Meta Tags**:
- `og:title` - Event title
- `og:description` - Event description (truncated to 160 chars) or formatted date/time/location
- `og:image` - Event image → club hero image → club logo → default event image
- `og:url` - Full event URL
- `og:type` - "article"
- `og:site_name` - "ClubKit"
- `og:locale` - "en_US"
- `article:published_time` - Event date
- `article:author` - Club name
- `article:section` - "Events"
- `article:tag` - Event title
- `twitter:card` - "summary_large_image"
- `twitter:title` - Event title
- `twitter:description` - Same as og:description
- `twitter:image` - Same as og:image
- `twitter:site` - "@clubkit"
- `twitter:creator` - "@clubkit"

**Image Priority**:
1. `event.image_large_url` (optimized large event image)
2. `event.image_url` (original event image)
3. `club.hero_image_large_url` (club hero image)
4. `club.hero_image_url` (club hero image)
5. `club.logo_url` (club logo)
6. `/default-event.svg` (fallback default image)

## Default Images

### Club Default OG Image (`/default-og.svg`)
- 1200x630 SVG with ClubKit branding
- Blue gradient background
- "ClubKit" text with "Connect • Organize • Grow" subtitle
- People icon representation

### Event Default OG Image (`/default-event.svg`)
- 1200x630 SVG with event-themed design
- Green gradient background
- Calendar icon
- "Event" text with "Join us for an amazing experience" subtitle

## Technical Implementation

### Dynamic URL Generation
- Uses `getSubdomain()` function to extract subdomain
- Constructs full URLs: `https://{subdomain}.joinclubpack.com`
- Event URLs: `https://{subdomain}.joinclubpack.com/event/{eventId}`

### Meta Tag Management
- Dynamically creates/updates meta tags using `document.createElement()`
- Handles both `property` and `name` attributes appropriately
- Includes image dimensions (1200x630) for better social media previews
- Sets image type to `image/svg+xml` for SVG fallbacks

### SEO Enhancements
- Canonical URLs for both club and event pages
- Keywords meta tags with relevant terms
- Author meta tags with club name
- Robots meta tags for indexing

## Usage Examples

### Club Homepage
```
https://happyclub.joinclubpack.com
```
Generates OG meta tags with:
- Title: "Happy Mile Run Club"
- Description: "A community running club focused on fun and connection"
- Image: Club's hero image or logo
- URL: https://happyclub.joinclubpack.com

### Event Page
```
https://happyclub.joinclubpack.com/event/spring-5k-run
```
Generates OG meta tags with:
- Title: "Spring 5K Run"
- Description: "Join us for our annual spring 5K run through the park"
- Image: Event cover image or club hero image
- URL: https://happyclub.joinclubpack.com/event/spring-5k-run

## Testing

### Social Media Testing Tools
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

### Local Testing
- Use browser developer tools to inspect meta tags
- Check that all OG meta tags are present in the `<head>` section
- Verify image URLs are accessible and properly sized

## Future Enhancements

1. **Dynamic OG Image Generation**: Create API routes to generate custom OG images with club branding
2. **Event-Specific Images**: Generate OG images that include event details, date, and location
3. **Analytics**: Track OG image impressions and click-through rates
4. **A/B Testing**: Test different OG image designs and descriptions for better engagement

## Files Modified

- `src/website-template/components/MetaTags.tsx` - Enhanced club homepage meta tags
- `src/website-template/components/EventMetaTags.tsx` - New event page meta tags component
- `src/website-template/components/events/EventView.tsx` - Added EventMetaTags component
- `public/default-og.svg` - Default club OG image
- `public/default-event.svg` - Default event OG image
