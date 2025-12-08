# Blog System Implementation

This document describes the blog system implementation for the ClubKit landing page, which allows you to create and manage blog posts using MDX files.

## Overview

The blog system includes:
- MDX file support for blog posts
- Blog listing page with filtering and pagination
- Individual blog post pages with navigation
- Responsive design with modern UI components

## File Structure

```
content/
  blog/
    *.mdx                    # Blog post files
src/
  landing/
    components/
      blog/
        blog-header.tsx      # Blog post header component
        blog-layout.tsx      # Blog post layout wrapper
        blog-navigation.tsx  # Previous/next post navigation
        blog-posts.tsx       # Blog listing grid component
        mdx-components.tsx   # MDX component styling
        mdx-renderer.tsx     # MDX content renderer
    lib/
      blog-utils.ts          # Blog utilities and data loading
    pages/
      Blog.tsx              # Blog listing page
      BlogPost.tsx          # Individual blog post page
```

## Creating Blog Posts

### 1. Create MDX Files

Create `.mdx` files in the `content/blog/` directory. Each file should follow this structure:

```mdx
export const metadata = {
  title: 'Your Blog Post Title',
  description: 'A brief description of your blog post',
  date: '2024-03-15',
  author: 'Author Name',
  category: 'Category Name',
  keywords: ['keyword1', 'keyword2'],
  readingTime: 8,
  coverImage: 'https://example.com/image.jpg'
};

## Your Blog Post Content

Write your blog post content using Markdown syntax. You can use:

- **Headers** (`##`, `###`)
- **Bold text** (`**text**`)
- **Lists** (`- item` or `* item`)
- **Paragraphs** (regular text)

### 2. Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Blog post title |
| `description` | string | Yes | Brief description |
| `date` | string | No | Publication date (YYYY-MM-DD) |
| `author` | string | No | Author name |
| `category` | string | No | Post category |
| `keywords` | string[] | No | SEO keywords |
| `readingTime` | number | No | Estimated reading time in minutes |
| `coverImage` | string | No | Cover image URL |

### 3. Categories

The blog system supports these categories:
- Event Planning
- Growth
- Leadership
- Marketing
- Community

## Features

### Blog Listing Page (`/blog`)

- **Grid Layout**: Responsive card-based layout
- **Category Filtering**: Filter posts by category
- **Pagination**: 6 posts per page with navigation
- **Search**: Built-in search functionality
- **Cover Images**: Display cover images for each post
- **Reading Time**: Show estimated reading time
- **Author Info**: Display author and publication date

### Individual Blog Post Page (`/blog/:slug`)

- **Full Content**: Renders the complete MDX content
- **Navigation**: Previous/next post navigation
- **Metadata**: Displays author, date, reading time
- **Cover Image**: Large cover image display
- **Responsive Design**: Mobile-friendly layout

### MDX Rendering

The system includes a custom MDX renderer that supports:
- Headers (H1, H2, H3)
- Paragraphs
- Lists (ordered and unordered)
- Bold text
- Links
- Tables (basic support)

## Routing

The blog system uses React Router with these routes:

- `/blog` - Blog listing page
- `/blog/:slug` - Individual blog post page

## Styling

The blog uses Tailwind CSS with:
- **Typography**: Custom prose classes for content
- **Components**: Shadcn/ui components for UI elements
- **Responsive**: Mobile-first responsive design
- **Dark Mode**: Support for dark/light themes

## Adding New Posts

1. Create a new `.mdx` file in `content/blog/`
2. Add the required metadata export
3. Write your content using Markdown syntax
4. The post will automatically appear in the blog listing

## Customization

### Styling

You can customize the blog appearance by modifying:
- `src/landing/components/blog/mdx-components.tsx` - MDX component styles
- `src/landing/components/blog/blog-posts.tsx` - Blog listing styles
- `src/landing/components/blog/blog-header.tsx` - Blog post header styles

### Categories

To add new categories:
1. Update the categories array in `blog-posts.tsx`
2. Add the category icon and name
3. Update the category filter logic if needed

### Layout

The blog layout can be customized in:
- `src/landing/components/blog/blog-layout.tsx` - Main layout wrapper
- `src/landing/pages/Blog.tsx` - Blog listing page layout
- `src/landing/pages/BlogPost.tsx` - Individual post page layout

## Dependencies

The blog system requires these dependencies:
- `@mdx-js/react` - MDX rendering
- `@mdx-js/loader` - MDX file loading
- `gray-matter` - Frontmatter parsing

## Future Enhancements

Potential improvements for the blog system:
- Full MDX component support
- Syntax highlighting for code blocks
- Image optimization
- SEO meta tags
- Social sharing buttons
- Comments system
- Related posts
- Search functionality
- RSS feed generation

## Troubleshooting

### Common Issues

1. **Posts not appearing**: Check that the MDX file has the correct metadata export
2. **Styling issues**: Ensure Tailwind CSS is properly configured
3. **Routing problems**: Verify that the routes are correctly defined in `main.tsx`

### Development

To run the blog system in development:
```bash
npm run dev
```

Visit `http://localhost:5173/blog` to see the blog listing page.

## Example Blog Post

Here's an example of a complete blog post:

```mdx
export const metadata = {
  title: '10 Event Ideas That Will Transform Your Club Culture',
  description: 'From themed mixers to skill-building workshops, discover events that create lasting memories and stronger communities.',
  date: '2024-03-15',
  author: 'Sarah Chen',
  category: 'Event Planning',
  keywords: ['event ideas', 'club culture', 'community building'],
  readingTime: 8,
  coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop'
};

## 10 Event Ideas That Will Transform Your Club Culture

Building a vibrant club culture isn't just about having regular meetings—it's about creating memorable experiences that bring people together and foster genuine connections.

### 1. Themed Mixer Nights

**Why it works:** Themed mixers break the ice and create instant conversation starters.

**Implementation tips:**
- Choose themes that resonate with your club's interests
- Provide simple props or accessories to help people get into character
- Include interactive elements like themed trivia or games

### 2. Skill-Building Workshops

**Why it works:** Workshops that teach practical skills benefit individual members and create a culture of learning.

**Popular workshop ideas:**
- Public speaking and presentation skills
- Resume writing and interview preparation
- Digital tools and software training
- Creative skills like photography or graphic design

## Getting Started

Don't try to implement all these ideas at once. Start with 2-3 events that align with your club's current interests and resources.
```

This blog system provides a solid foundation for creating and managing blog content for your ClubKit landing page. 