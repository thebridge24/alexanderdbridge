import { NotificationItem } from "@/alexanderdbridge/app/notifications/PushNotifications";

 // Dynamic notification list state (can later be fetched via API/Supabase/Sockets)
 export  const FirstNotifications: NotificationItem[] =[
    {
      id: "1",
      title: "New Like on Comment",
      body: "Goodwill liked your comment in Mar 24 - Walking in Divine Purpose",
      timestamp: "10m ago",
      read: false,
      type: "like",
    },
    {
      id: "2",
      title: "Reply to Comment",
      body: "Christabel replied to your comment under Mar 23",
      timestamp: "1h ago",
      read: false,
      type: "reply",
    },
    {
      id: "3",
      title: "Reply to Comment",
      body: "Christabel replied to your comment under Mar 23",
      timestamp: "1h ago",
      read: false,
      type: "reply",
    },
    {
      id: "4",
      title: "Reply to Comment",
      body: "Christabel replied to your comment under Mar 23",
      timestamp: "1h ago",
      read: false,
      type: "reply",
    },
    {
      id: "5",
      title: "Daily Devotional Reminder",
      body: "Your morning word for today is ready. Take a moment to read and build your streak!",
      timestamp: "5h ago",
      read: true,
      type: "reminder",
    },
  ];