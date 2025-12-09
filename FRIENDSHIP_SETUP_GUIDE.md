# Quick Setup Guide: Friendship System

Follow these steps to set up the friendship system in your Proof app.

## Step 1: Run the SQL Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy and paste the contents of `code/db/create_friendships_table.sql`
5. Click **"Run"** to execute the SQL

### Option B: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

### ✅ Verify Database Setup

After running the migration, verify it worked:

1. In Supabase Dashboard → **Table Editor**
2. You should see a new `friendships` table
3. Check that it has these columns:
   - id
   - requester_id
   - addressee_id
   - status
   - created_at
   - updated_at

## Step 2: Test the System

### Create Test Users

1. Log in to your app with one account (or create a new one)
2. Create a second test account (use a different email)
3. Make sure both accounts have complete profiles:
   - First name
   - Last name
   - Username

### Test the Friendship Flow

1. **Log in as User 1**
2. Navigate to Social page → "Add Friends"
3. Search for User 2 by name, username, or email
4. Click **"Add"** button to send friend request
5. Button should change to **"Requested"** (yellow)

6. **Log out and log in as User 2**
7. Go to "Add Friends" page
8. You should see User 1 in the "Friend Requests" section
9. Click **"Accept"** button
10. User 1 should now appear in "Your Friends" section

11. **Log back in as User 1**
12. Go to "Add Friends"
13. User 2 should now be in "Your Friends" section
14. Button should show **"Friends"** (green)

## Step 3: Verify WebsiteContext Integration

The friendship system is automatically integrated into WebsiteContext. When a user logs in:

1. Friends list is fetched
2. Incoming friend requests are fetched
3. Outgoing friend requests are fetched

You can verify this in your browser console (DevTools):

```
[WebsiteContext] Fetching friendships from Supabase for user: ...
[WebsiteContext] Friendships loaded: { friends: 2, incoming: 1, outgoing: 0 }
```

## Step 4: Using the Friendship System in Your Code

### Example: Show Friend Count

```typescript
import { useWebsite } from './lib/WebsiteContext'

function MyComponent() {
  const { friends, incomingRequests } = useWebsite()

  return (
    <div>
      <p>You have {friends.length} friends</p>
      <p>You have {incomingRequests.length} pending requests</p>
    </div>
  )
}
```

### Example: Send Friend Request

```typescript
import { useWebsite } from './lib/WebsiteContext'

function UserCard({ userId }: { userId: string }) {
  const { sendFriendRequest, getFriendshipStatus } = useWebsite()
  const status = getFriendshipStatus(userId)

  const handleAddFriend = async () => {
    const result = await sendFriendRequest(userId)
    if (result.error) {
      alert('Error: ' + result.error.message)
    }
  }

  if (status === 'friends') {
    return <button disabled>Already Friends</button>
  }

  if (status === 'outgoing') {
    return <button disabled>Request Sent</button>
  }

  if (status === 'incoming') {
    return <button>Accept Request</button>
  }

  return <button onClick={handleAddFriend}>Add Friend</button>
}
```

## Common Issues & Solutions

### Issue: "relation 'friendships' does not exist"

**Solution**: The SQL migration didn't run successfully. Try running it again.

### Issue: Can't see other users in search

**Solution**: Make sure the RLS policy update ran successfully. Check if this policy exists:

```sql
-- In Supabase Dashboard → Authentication → Policies
-- On the profiles table, you should see:
"Users can view all profiles" (SELECT with check: true)
```

If not, run this SQL:

```sql
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (true);
```

### Issue: "Friendship already exists" error

**Solution**: This is expected if you try to send a request to someone who already has a friendship with you. The unique constraint prevents duplicates.

### Issue: Search returns no results

**Solution**: 
1. Make sure users have usernames set in their profiles
2. Try searching with at least 2 characters
3. Check if the profiles table is populated

### Issue: Friend request sent but not showing in incoming requests

**Solution**:
1. Make sure you're logged in as the correct user (the addressee)
2. Refresh the page or refetch friendships
3. Check the database directly to see if the row was created

## Database Queries for Debugging

### Check all friendships

```sql
SELECT * FROM friendships;
```

### Check friendships for a specific user

```sql
-- Replace 'user-id-here' with actual UUID
SELECT * FROM friendships 
WHERE requester_id = 'user-id-here' 
   OR addressee_id = 'user-id-here';
```

### Check all profiles

```sql
SELECT id, username, first_name, last_name, email FROM profiles;
```

### Manually create a friendship (for testing)

```sql
-- Replace with actual user IDs
INSERT INTO friendships (requester_id, addressee_id, status)
VALUES (
  'user-id-1',
  'user-id-2', 
  'confirmed'
);
```

### Delete all friendships (reset for testing)

```sql
DELETE FROM friendships;
```

## Performance Tips

### Add indexes for faster queries (already included in migration)

The migration includes these indexes:
- `idx_friendships_requester` - Fast lookup by requester
- `idx_friendships_addressee` - Fast lookup by addressee  
- `idx_friendships_status` - Fast lookup by status
- `idx_friendships_users` - Fast lookup by user pair

### Optimize profile search

If you have many users, consider adding a full-text search index:

```sql
-- Create a search index on profiles (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_search 
ON profiles USING gin(
  to_tsvector('english', 
    coalesce(username, '') || ' ' || 
    coalesce(first_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(email, '')
  )
);
```

## Next Steps

Now that the friendship system is set up, you can:

1. **Customize the UI**: Update colors, styles in `AddFriendsPage.css`
2. **Add notifications**: Notify users when they receive friend requests
3. **Show friends' posts**: Filter posts to show only from friends
4. **Add mutual friends count**: Calculate shared friends between users
5. **Extend the system**: Add blocking, following, or other social features

## Need Help?

Check the full documentation in `FRIENDSHIP_SYSTEM_README.md` for:
- Detailed API reference
- Complete friendship flow diagrams
- Security considerations
- Future enhancement ideas

---

**Setup Time**: ~5 minutes  
**Difficulty**: Easy  
**Prerequisites**: Supabase project with profiles table
