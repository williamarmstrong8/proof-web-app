# Friendship System Documentation

A simple friendship system for the Proof app that allows users to send friend requests, accept them, and manage their friendships.

## 📋 Overview

The friendship system consists of:
- **Database**: A `friendships` table with Row Level Security (RLS)
- **TypeScript helpers**: Reusable functions for friendship operations
- **React integration**: WebsiteContext provides friendship state and actions
- **UI**: AddFriendsPage for searching users and managing friendships

## 🗄️ Database Setup

### 1. Run the SQL Migration

Execute the SQL migration to create the friendships table and RLS policies:

```bash
# Connect to your Supabase database and run:
code/db/create_friendships_table.sql
```

This creates:
- `friendships` table with unique constraints
- Indexes for fast lookups
- Row Level Security (RLS) policies
- Updated profile policies to allow friend search

### Table Schema

```sql
CREATE TABLE friendships (
  id BIGSERIAL PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  addressee_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('requested', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_friendship UNIQUE (
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  )
);
```

### Row Level Security (RLS) Policies

The table has the following RLS policies:

1. **Insert**: Users can only create friendship rows where they are the requester
2. **Select**: Users can view friendships where they are either the requester or addressee
3. **Update**: Users can update friendships where they are involved (to accept requests)
4. **Delete**: Users can delete friendships where they are involved (to unfriend/cancel)

## 🔧 TypeScript API

### Importing Functions

```typescript
import {
  sendFriendRequest,
  acceptFriendRequest,
  unfriendOrCancel,
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  searchUsers,
} from './lib/friendships'
```

### Available Functions

#### `sendFriendRequest(currentUserId, targetUserId)`
Sends a friend request from the current user to the target user.

```typescript
const result = await sendFriendRequest('user-id-1', 'user-id-2')
if (result.error) {
  console.error('Error:', result.error)
} else {
  console.log('Request sent:', result.data)
}
```

#### `acceptFriendRequest(currentUserId, requesterId)`
Accepts an incoming friend request.

```typescript
const result = await acceptFriendRequest('user-id-1', 'user-id-2')
if (result.error) {
  console.error('Error:', result.error)
} else {
  console.log('Request accepted!')
}
```

#### `unfriendOrCancel(currentUserId, otherUserId)`
Unfriends a user or cancels a pending request.

```typescript
const result = await unfriendOrCancel('user-id-1', 'user-id-2')
if (result.error) {
  console.error('Error:', result.error)
} else {
  console.log('Friendship ended')
}
```

#### `getFriends(currentUserId)`
Gets all confirmed friends with their profile information.

```typescript
const result = await getFriends('user-id-1')
if (result.data) {
  console.log('Friends:', result.data)
  // Each friend includes: { id, requester_id, addressee_id, status, profile }
}
```

#### `getIncomingRequests(currentUserId)`
Gets all pending friend requests where the current user is the addressee.

```typescript
const result = await getIncomingRequests('user-id-1')
if (result.data) {
  console.log('Incoming requests:', result.data)
}
```

#### `getOutgoingRequests(currentUserId)`
Gets all pending friend requests sent by the current user.

```typescript
const result = await getOutgoingRequests('user-id-1')
if (result.data) {
  console.log('Outgoing requests:', result.data)
}
```

#### `searchUsers(searchQuery, currentUserId, limit?)`
Searches for users by username, name, or email.

```typescript
const result = await searchUsers('john', 'current-user-id', 20)
if (result.data) {
  console.log('Search results:', result.data)
}
```

## ⚛️ React Integration (WebsiteContext)

The friendship system is integrated into WebsiteContext, which provides:

### State

```typescript
const {
  friends,              // Array of confirmed friendships with profiles
  incomingRequests,     // Array of incoming friend requests
  outgoingRequests,     // Array of outgoing friend requests
  // ... other state
} = useWebsite()
```

### Actions

```typescript
const {
  sendFriendRequest,      // (targetUserId) => Promise<{error}>
  acceptFriendRequest,    // (requesterId) => Promise<{error}>
  unfriendOrCancel,       // (otherUserId) => Promise<{error}>
  searchUsers,            // (searchQuery) => Promise<{error, data}>
  getFriendshipStatus,    // (otherUserId) => 'none' | 'outgoing' | 'incoming' | 'friends'
  refetchFriendships,     // () => Promise<void>
} = useWebsite()
```

### Example Usage in a Component

```typescript
import { useWebsite } from '../lib/WebsiteContext'

function MyComponent() {
  const { 
    friends, 
    incomingRequests,
    sendFriendRequest,
    getFriendshipStatus 
  } = useWebsite()

  const handleAddFriend = async (userId: string) => {
    const result = await sendFriendRequest(userId)
    if (result.error) {
      alert('Error: ' + result.error.message)
    }
  }

  return (
    <div>
      <h2>You have {friends.length} friends</h2>
      <h3>{incomingRequests.length} pending requests</h3>
    </div>
  )
}
```

## 🎨 UI Components

### AddFriendsPage

The main UI for the friendship system includes:

#### Features:
1. **Search**: Search for users by name, username, or email
2. **Friend Requests**: View and accept incoming friend requests
3. **Friend List**: View all current friends
4. **Dynamic Button States**:
   - **Add** (gray) - Send friend request
   - **Requested** (yellow) - Cancel outgoing request
   - **Accept** (blue) - Accept incoming request
   - **Friends** (green) - View friend / Unfriend option

#### Button States

The page automatically shows the correct button based on friendship status:

```typescript
type FriendshipStatus = 'none' | 'outgoing' | 'incoming' | 'friends'

// Button logic:
- 'none'     → "Add" button (send request)
- 'outgoing' → "Requested" button (cancel request)
- 'incoming' → "Accept" button (accept request)
- 'friends'  → "Friends" button (unfriend option)
```

## 🔄 Friendship Flow

### 1. Sending a Friend Request

```
User A → searches for User B
User A → clicks "Add" button
System → creates friendship row with status='requested'
User A → sees "Requested" button
User B → sees User A in their "Friend Requests" section
```

### 2. Accepting a Friend Request

```
User B → views "Friend Requests" section
User B → clicks "Accept" button on User A's request
System → updates friendship status to 'confirmed'
Both users → see each other in their friends list
```

### 3. Unfriending or Canceling

```
Either User → clicks on "Friends" or "Requested" button
System → shows confirmation dialog
User → confirms
System → deletes friendship row
Both users → no longer see friendship connection
```

## 🔒 Security

### RLS Policies Ensure:
- Users can only create requests they send themselves
- Users can only view friendships they're involved in
- Users can only modify friendships they're part of
- Users can only delete friendships they're involved in

### Unique Constraints:
- No duplicate friendships between the same two users
- Users cannot friend themselves
- Only one friendship row exists per user pair (regardless of direction)

## 🚀 Testing the System

### 1. Create Test Users

Create 2-3 test users in Supabase Auth:
- user1@test.com
- user2@test.com
- user3@test.com

### 2. Set Up Profiles

Make sure each test user has a profile with:
- username
- first_name
- last_name
- email

### 3. Test the Flow

1. Log in as User 1
2. Search for User 2
3. Send friend request
4. Log out, log in as User 2
5. View friend requests
6. Accept request
7. Both users should see each other in friends list

## 📝 Notes

### Optimistic Updates
The UI updates immediately when actions are taken, then refetches data from the server to ensure consistency.

### Error Handling
All functions return `{ error, data }` objects. Always check for errors:

```typescript
const result = await sendFriendRequest(userId)
if (result.error) {
  // Handle error
  console.error(result.error)
} else {
  // Success!
}
```

### Debouncing
User search includes a 300ms debounce to avoid excessive API calls while typing.

### Avatar Fallbacks
If a user doesn't have an avatar, the system uses `ui-avatars.com` API to generate initials-based avatars.

## 🔮 Future Enhancements

Potential additions (not included in this implementation):

- [ ] Blocking users
- [ ] Following/followers (asymmetric relationships)
- [ ] Friend suggestions based on mutual friends
- [ ] Friend request messages
- [ ] Friendship notifications
- [ ] Search filters (by location, interests, etc.)
- [ ] Bulk friend operations

## 🐛 Troubleshooting

### "Users can view all profiles" policy conflict

If you get an RLS policy error, you may need to drop the old restrictive profile policy:

```sql
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
```

### Friendship not creating

Check:
1. Both user IDs exist in the auth.users table
2. The users are not the same person
3. A friendship doesn't already exist between them

### Search not returning results

Check:
1. The profiles table has data for the users
2. The username/name/email fields are populated
3. The RLS policy allows viewing all profiles

## 📚 Files Changed

- `code/db/create_friendships_table.sql` - Database migration
- `code/src/lib/friendships.ts` - TypeScript helper functions
- `code/src/lib/WebsiteContext.tsx` - Context integration
- `code/src/pages/AddFriendsPage.tsx` - UI component
- `code/src/pages/AddFriendsPage.css` - Styles

---

**Created**: December 2025  
**Version**: 1.0.0
