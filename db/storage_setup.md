# Supabase Storage Setup for Task Photos

This guide walks you through setting up the Supabase Storage bucket for task completion photos.

## Overview

Task completion photos are stored in a public Supabase Storage bucket called `task-photos`. The bucket is public-readable (so posts can be viewed) but only authenticated users can upload/delete their own photos.

## Step-by-Step Setup

### 1. Create the Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `task-photos`
   - **Public bucket**: ✅ **Enable** (so photos are publicly readable)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/*` (only allow images)
5. Click **Create bucket**

### 2. Configure Storage Policies

After creating the bucket, you need to set up policies for access control.

#### Policy 1: Public Read Access

**Purpose**: Anyone can view photos (needed for public feeds)

1. Click on the `task-photos` bucket
2. Go to **Policies** tab
3. Click **New policy**
4. Choose **Custom policy**
5. Configure:
   - **Policy name**: `Public read access`
   - **Allowed operations**: ✅ SELECT
   - **Target roles**: `public` (or leave empty for all)
   - **Policy definition** (SQL):
     ```sql
     (bucket_id = 'task-photos'::text)
     ```
6. Click **Save**

#### Policy 2: Authenticated Users Can Upload

**Purpose**: Logged-in users can upload photos

1. Click **New policy** again
2. Choose **Custom policy**
3. Configure:
   - **Policy name**: `Authenticated users can upload`
   - **Allowed operations**: ✅ INSERT
   - **Target roles**: `authenticated`
   - **Policy definition** (SQL):
     ```sql
     (bucket_id = 'task-photos'::text AND auth.role() = 'authenticated'::text)
     ```
4. Click **Save**

#### Policy 3: Users Can Manage Their Own Photos

**Purpose**: Users can update/delete their own photos only

1. Click **New policy** again
2. Choose **Custom policy**
3. Configure:
   - **Policy name**: `Users can manage their own photos`
   - **Allowed operations**: ✅ UPDATE, ✅ DELETE
   - **Target roles**: `authenticated`
   - **Policy definition** (SQL):
     ```sql
     (
       bucket_id = 'task-photos'::text 
       AND auth.uid()::text = (storage.foldername(name))[1]
     )
     ```
4. Click **Save**

### 3. Verify Setup

Test your setup with a simple upload:

```typescript
import { supabase } from './lib/supabase'

// Test upload
async function testUpload() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('Not authenticated')
    return
  }

  const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
  const filePath = `${user.id}/test_${Date.now()}.jpg`

  const { data, error } = await supabase.storage
    .from('task-photos')
    .upload(filePath, testFile)

  if (error) {
    console.error('Upload failed:', error)
  } else {
    console.log('Upload successful:', data)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('task-photos')
      .getPublicUrl(data.path)
    
    console.log('Public URL:', urlData.publicUrl)
  }
}
```

## File Path Structure

Photos are organized by user ID:

```
task-photos/
├── {user_id_1}/
│   ├── 1702000000000_abc123.jpg
│   ├── 1702000001000_def456.jpg
│   └── ...
├── {user_id_2}/
│   ├── 1702000000000_ghi789.jpg
│   └── ...
└── ...
```

**Format**: `{user_id}/{timestamp}_{random}.{extension}`

**Example**: `task-photos/abc-123-def/1702000000000_xyz.jpg`

This structure:
- Keeps files organized by user
- Prevents filename collisions with timestamp + random string
- Makes it easy to enforce "users can only delete their own photos" policy

## File Upload Flow

The `completeTask` function in `WebsiteContext.tsx` handles uploads:

1. User selects a photo file
2. Frontend generates unique filename: `{timestamp}_{random}.{ext}`
3. Upload to path: `{user_id}/{filename}`
4. Get public URL from Supabase
5. Store URL in `task_completions.photo_url`
6. If completion is deleted, photo is also deleted from storage

## Storage Limits

Supabase Free Tier includes:
- **1 GB** storage
- **2 GB** bandwidth per month

**Recommendations**:
- Set max file size to 5 MB per photo
- Compress images before upload (consider using a library like `browser-image-compression`)
- Monitor usage in Supabase dashboard

### Optional: Image Compression

Add compression before upload:

```bash
npm install browser-image-compression
```

```typescript
import imageCompression from 'browser-image-compression'

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,          // Max file size 1MB
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true,
  }
  
  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Compression failed:', error)
    return file // Return original if compression fails
  }
}

// Use in completeTask:
const compressedPhoto = await compressImage(photo)
// Then upload compressedPhoto...
```

## Troubleshooting

### "new row violates row-level security policy"

**Solution**: Make sure you're authenticated and the policies are set up correctly.

```sql
-- Check your policies
SELECT * FROM storage.policies WHERE bucket_id = 'task-photos';
```

### "Permission denied for bucket"

**Solution**: Verify:
1. Bucket exists and is named exactly `task-photos`
2. Bucket is marked as public
3. All three policies are created and enabled

### Photos not loading in feed

**Solution**: 
1. Check that the bucket is marked as **Public**
2. Verify the public read policy exists
3. Check that `photo_url` in database is a valid URL
4. Open the URL directly in browser to test

### "Bucket not found"

**Solution**: The bucket name must be exactly `task-photos` (lowercase, with hyphen).

Check with:
```typescript
const { data, error } = await supabase.storage.listBuckets()
console.log('Available buckets:', data)
```

## Security Considerations

1. **Public URLs**: Photos are publicly accessible via URL. Don't upload sensitive content.
2. **User Isolation**: The policy ensures users can only delete their own photos (based on folder structure).
3. **File Type Validation**: Configure bucket to only accept images.
4. **File Size Limits**: Set appropriate limits to prevent abuse.

## Future Enhancements

- Add image processing (resize, optimize) with Supabase Functions
- Add CDN integration for faster global delivery
- Implement photo moderation/reporting system
- Add photo editing before upload (crop, filters)

## Monitoring

Monitor storage usage:
1. Go to **Settings > Usage** in Supabase dashboard
2. Check **Storage** metrics
3. Set up alerts if approaching limits

## Backup Strategy

Photos are stored in Supabase Storage, which is backed up automatically. However:

1. **Export URLs**: Task completion records include `photo_url` - these are backed up with database
2. **Download Archive**: Periodically download photos for local backup
3. **Storage Policies**: Keep policies in version control (copy from dashboard)

## API Reference

### Upload Photo

```typescript
const { data, error } = await supabase.storage
  .from('task-photos')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  })
```

### Get Public URL

```typescript
const { data } = supabase.storage
  .from('task-photos')
  .getPublicUrl(filePath)

console.log(data.publicUrl)
```

### Delete Photo

```typescript
const { error } = await supabase.storage
  .from('task-photos')
  .remove([filePath])
```

### List User's Photos

```typescript
const { data, error } = await supabase.storage
  .from('task-photos')
  .list(userId, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  })
```

## Complete Example

Full flow in `WebsiteContext.tsx`:

```typescript
const completeTask = async (taskId: string, photo: File, caption?: string) => {
  // 1. Generate unique filename
  const timestamp = Date.now()
  const ext = photo.name.split('.').pop()
  const filename = `${timestamp}_${Math.random().toString(36).substring(7)}.${ext}`
  const filePath = `${user.id}/${filename}`

  // 2. Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('task-photos')
    .upload(filePath, photo)

  if (uploadError) throw uploadError

  // 3. Get public URL
  const { data: urlData } = supabase.storage
    .from('task-photos')
    .getPublicUrl(uploadData.path)

  // 4. Save completion to database
  await supabase
    .from('task_completions')
    .insert({
      task_id: taskId,
      user_id: user.id,
      photo_url: urlData.publicUrl,
      caption: caption,
      completed_on: new Date().toISOString().split('T')[0]
    })
}
```

---

**Setup Complete!** Your storage bucket is now ready to store task completion photos.

