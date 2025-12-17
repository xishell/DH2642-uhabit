# Notification System - Frontend Integration Guide

## API Endpoints

### Notifications

```typescript
// List notifications (paginated)
GET /api/notifications?page=1&limit=20&unread=true

// Response:
{
  data: Notification[],
  pagination: { page, limit, total, totalPages, hasMore }
}

// Get unread count
GET /api/notifications/unread-count
// Response: { count: number }

// Mark single notification as read
PATCH /api/notifications/[id]
// Body: { read: true }

// Mark all as read
PATCH /api/notifications/mark-all-read

// Delete notification
DELETE /api/notifications/[id]
```

### Push Subscriptions

```typescript
// Get VAPID public key (needed for push subscription)
GET /api/push/vapid-public-key
// Response: { publicKey: string }

// Subscribe to push notifications
POST /api/push/subscribe
// Body: { endpoint: string, keys: { p256dh: string, auth: string } }

// Unsubscribe
DELETE /api/push/subscribe
// Body: { endpoint: string }
```

### Holidays

```typescript
// Get holidays for user's country
GET /api/holidays?from=2025-01-01&to=2025-01-31

// Response:
{
  countryCode: string,
  from: string,
  to: string,
  holidays: Array<{ date, name, localName, isPublic }>
}
```

## Types

Import from `$lib/types/notification`:

```typescript
import type {
  Notification,
  NotificationType,       // 'habit_reminder' | 'streak_milestone' | 'goal_progress' | 'holiday_reschedule'
  NotificationMetadata,
  NotificationPreferences,
  PushSubscriptionKeys
} from '$lib/types/notification';
```

Import from `$lib/types/holiday`:

```typescript
import type { Holiday, HolidayConflict } from '$lib/types/holiday';
```

## Example Usage

See `examples.ts` in this directory for copy-paste code snippets.
