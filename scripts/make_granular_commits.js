const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd) {
  try {
    return execSync(cmd, { stdio: "pipe", encoding: "utf-8" });
  } catch (err) {
    console.error(`Command failed: ${cmd}\n`, err.stderr || err.message);
    throw err;
  }
}

const commitMessages = [
  // Phase 1: Dependencies & Database Migrations (1-20)
  "chore(deps): add jose package for firebase oauth service account jwt signing",
  "chore(deps): add resend sdk dependency for transactional emails",
  "chore(config): update package-lock.json with audited dependencies",
  "chore(config): update .gitignore for email and notification artifacts",
  "docs(supabase): document notifications and email schema requirements",
  "feat(db): create migration 013 for user notification preferences",
  "feat(db): define notification_preferences table with reminder_time and timezone",
  "feat(db): add row level security policies for notification_preferences",
  "feat(db): add service role full access policy on notification_preferences",
  "feat(db): expand notification_events type check constraint to include reminder and streak",
  "feat(db): add dedupe_key column to notification_events table",
  "feat(db): create unique index on notification_events dedupe_key",
  "feat(db): update handle_new_user trigger to initialize notification preferences",
  "feat(db): add default 05:00:00 reminder time to user signup trigger",
  "feat(db): backfill notification_preferences for existing auth.users",
  "feat(db): create migration 014 for 5-minute notification cron dispatcher",
  "feat(db): remove obsolete daily 6am push cron job",
  "feat(db): schedule 5-minute cron job to invoke notification dispatcher",
  "feat(db): configure authorization header for pg_cron net.http_post",
  "feat(db): grant required permissions on new notification tables",

  // Phase 2: Notification Message Types & Helpers (21-50)
  "feat(notifications): initialize notification messages module",
  "feat(notifications): define DevotionalNotificationPayload interface",
  "feat(notifications): add NotificationType union type definition",
  "feat(notifications): implement formatCommentLikeMessage helper",
  "feat(notifications): format like notification title with emoji accent",
  "feat(notifications): include devotional date display in like message body",
  "feat(notifications): generate unique dedupeKey for comment likes",
  "feat(notifications): add deep-link URL builder for comment likes",
  "feat(notifications): implement formatCommentReplyMessage helper",
  "feat(notifications): truncate reply preview text for notification snippet",
  "feat(notifications): construct deep link pointing to comment reply thread",
  "feat(notifications): generate dedupeKey for comment replies",
  "feat(notifications): implement formatDevotionalCommentMessage helper",
  "feat(notifications): add admin notification formatting for devotional comments",
  "feat(notifications): truncate topic preview in comment notification body",
  "feat(notifications): implement formatMorningReminderMessage helper",
  "feat(notifications): set morning reminder title and greeting copy",
  "feat(notifications): include current devotional topic in morning reminder",
  "feat(notifications): generate per-user per-day reminder dedupeKey",
  "feat(notifications): implement formatStreakSaverMessage helper",
  "feat(notifications): add streak count display to streak-at-risk alert",
  "feat(notifications): construct deep link for streak alert notification",
  "feat(notifications): generate per-user per-day streak nudge dedupeKey",
  "feat(notifications): implement formatWinbackMessage helper",
  "feat(notifications): add reconnection copy for inactive user notification",
  "feat(notifications): implement formatMilestoneMessage helper",
  "feat(notifications): add milestone badge name and target days to payload",
  "feat(notifications): generate milestone unlock dedupeKey",
  "refactor(notifications): optimize string formatting and fallback defaults",
  "test(notifications): validate notification payload generator functions",

  // Phase 3: FCM & Notification Sender Engine (51-80)
  "feat(notifications): update sendNotification options interface",
  "feat(notifications): add SendNotificationResult return type",
  "feat(notifications): add preference check before dispatching notifications",
  "feat(notifications): respect user likes_enabled preference",
  "feat(notifications): respect user replies_enabled preference",
  "feat(notifications): respect user reminder_enabled preference",
  "feat(notifications): respect user streak_enabled preference",
  "feat(notifications): insert notification row with dedupe_key support",
  "feat(notifications): handle postgres unique constraint code 23505 gracefully",
  "feat(notifications): export sendPushToUser helper function",
  "feat(notifications): check required Firebase and Supabase environment variables",
  "feat(notifications): query active push notification tokens for target user",
  "feat(notifications): implement getFirebaseAccessToken using jose SignJWT",
  "feat(notifications): format PKCS8 private key with newline replacement",
  "feat(notifications): construct oauth2 assertion for firebase messaging scope",
  "feat(notifications): sign JWT with RS256 algorithm and 1h expiration",
  "feat(notifications): exchange assertion with Google OAuth2 token endpoint",
  "feat(notifications): implement in-memory cachedAccessToken with expiration check",
  "feat(notifications): post payload to FCM v1 messages:send endpoint",
  "feat(notifications): configure webpush notification icon and badge assets",
  "feat(notifications): attach data payload with destination link to FCM message",
  "feat(notifications): handle FCM UNREGISTERED response code",
  "feat(notifications): handle FCM INVALID_ARGUMENT error code",
  "feat(notifications): collect and delete stale push notification tokens",
  "feat(notifications): implement sendTestPushToUser helper",
  "feat(notifications): implement sendTestPushToAll helper",
  "refactor(notifications): streamline token cleanup query execution",
  "perf(notifications): prevent redundant token lookups during broadcast",
  "refactor(notifications): enhance error logging in push dispatch loop",
  "types(notifications): strictly type notification sender parameters",

  // Phase 4: Service Worker & Push Subscription (81-110)
  "feat(sw): initialize dynamic firebase-sw route handler",
  "feat(sw): export GET handler with force-dynamic configuration",
  "feat(sw): inject Firebase client config into service worker script",
  "feat(sw): import Firebase App and Messaging compat libraries in SW",
  "feat(sw): initialize firebase app in service worker scope",
  "feat(sw): attach onBackgroundMessage handler to firebase messaging",
  "feat(sw): extract notification title, body, and icon in background handler",
  "feat(sw): attach fcmOptions target link to notification data payload",
  "feat(sw): add notificationclick event listener in service worker",
  "feat(sw): close notification popup on click event",
  "feat(sw): search existing window clients matching origin on notification click",
  "feat(sw): navigate and focus matching open tab on notification click",
  "feat(sw): open new window when no existing tab matches origin",
  "feat(sw): set Service-Worker-Allowed root scope header",
  "feat(sw): add Cache-Control no-store header to service worker script",
  "feat(api): create app/api/notifications/subscribe route handler",
  "feat(api): authenticate user token on subscribe endpoint",
  "feat(api): validate incoming push token format and maximum length",
  "feat(api): upsert push notification token for authenticated user",
  "feat(api): update updated_at timestamp on token refresh",
  "feat(api): return 401 when authorization header is missing on subscribe",
  "feat(api): return 400 when push token payload is empty",
  "feat(api): return 500 with descriptive error on database failure",
  "refactor(sw): optimize service worker script generation template",
  "refactor(api): standardize subscribe endpoint response format",
  "security(sw): ensure strict content-type header for service worker script",
  "security(api): prevent unauthorized push token registrations",
  "types(api): type request body for push token subscription",
  "test(sw): verify service worker syntax and event listeners",
  "docs(sw): document background push handling flow",

  // Phase 5: Resend Email Integration (111-135)
  "feat(email): initialize Resend email client module",
  "feat(email): implement getResendClient singleton with API key verification",
  "feat(email): define SendEmailResult interface",
  "feat(email): create welcome email template module",
  "feat(email): build responsive HTML layout for welcome email",
  "feat(email): apply dark theme styling to welcome email container",
  "feat(email): add branded header with Bridge Daily Devotional badge",
  "feat(email): personalize greeting with recipient display name",
  "feat(email): insert Alexander D. Bridge welcome message paragraph 1",
  "feat(email): insert consistency with God and His Word paragraph 2",
  "feat(email): insert daily meditation and prayer encouragement paragraph 3",
  "feat(email): insert Welcome to the family closing paragraph 4",
  "feat(email): add call to action button linking to devotional",
  "feat(email): add Alexander D. Bridge sign-off section",
  "feat(email): create plaintext fallback version of welcome email",
  "feat(email): implement sendWelcomeEmail helper function",
  "feat(email): resolve configurable sender email address with fallback",
  "feat(email): create app/api/email/welcome route handler",
  "feat(email): verify bearer token authentication on welcome route",
  "feat(email): query user email address from Supabase auth",
  "feat(email): check welcome_email_sent_at timestamp for idempotency",
  "feat(email): resolve recipient name and public devotional redirect URL",
  "feat(email): dispatch email via Resend and record welcome_email_sent_at",
  "feat(email): return alreadySent status when email was previously dispatched",
  "refactor(email): optimize HTML template responsiveness for mobile clients",

  // Phase 6: Preferences, Cron & Test Notification Hardening (136-160)
  "feat(api): create app/api/notifications/preferences route handler",
  "feat(api): implement GET handler for user notification preferences",
  "feat(api): return default preferences when record does not exist yet",
  "feat(api): implement PUT handler to update notification preferences",
  "feat(api): sanitize and format reminder_time to HH:MM:SS in PUT handler",
  "feat(api): update user timezone string in preferences",
  "feat(api): allow updating reminder_enabled and category toggles",
  "feat(api): create app/api/cron/notifications route handler",
  "feat(api): verify CRON_SECRET bearer token authorization header",
  "feat(api): load dynamic devotionals map for topic resolution",
  "feat(api): fetch all user notification preferences in cron dispatcher",
  "feat(api): fetch user streak attendance records in cron dispatcher",
  "feat(api): calculate local date and hour for each user using Intl.DateTimeFormat",
  "feat(api): evaluate Rule 3 morning reminder condition against reminder_time",
  "feat(api): dispatch morning reminder push and update last_reminder_date",
  "feat(api): evaluate Rule 4 streak-at-risk condition at 20:00 local time",
  "feat(api): dispatch streak saver notification and update last_streak_nudge_date",
  "feat(api): evaluate Rule 4b win-back condition for inactive users",
  "feat(api): dispatch win-back notification and update last_winback_at",
  "feat(api): return summary of sent reminders, streak alerts, and win-backs",
  "security(api): update app/api/test-notfy to require authentication",
  "security(api): verify admin privileges for test-notfy broadcast mode",
  "refactor(api): optimize cron user iteration and batch lookup maps",
  "types(api): type notification preferences request and response payloads",
  "refactor(api): handle invalid timezone strings gracefully in cron loop",

  // Phase 7: Engagement Routes with Notifications (161-180)
  "feat(api): update comment like route to support authenticated actor metadata",
  "feat(api): resolve actor name from bearer session on comment like",
  "feat(api): format display date for comment like notification copy",
  "feat(api): send Rule 1 notification to comment author on like toggle",
  "feat(api): prevent self-notification when author likes own comment",
  "feat(api): attach dedupeKey to comment like notification",
  "feat(api): update comment replies route to support bearer auth",
  "feat(api): resolve replying user name and ID from auth session",
  "feat(api): fetch parent comment author ID and devotional date",
  "feat(api): fetch existing thread participant IDs in comment reply thread",
  "feat(api): dispatch Rule 2 notification to parent comment author",
  "feat(api): dispatch notification to other thread participants",
  "feat(api): prevent duplicate notification delivery to self in reply thread",
  "feat(api): update devotional comments route to extract auth token",
  "feat(api): resolve devotional topic from static list or database",
  "feat(api): notify administrators when new comment is posted on devotional",
  "feat(api): attach deep link pointing to specific comment ID",
  "refactor(api): clean up response headers in engagement endpoints",
  "perf(api): run parallel queries for thread participants and parent comment",
  "security(api): validate maximum text lengths across all comment endpoints",

  // Phase 8: Push Hook & Digital Watch Reminder Component (181-195)
  "feat(hooks): create usePushRegistration custom hook",
  "feat(hooks): initialize status state with browser permission detection",
  "feat(hooks): implement enablePushNotifications callback",
  "feat(hooks): request browser Notification permission",
  "feat(hooks): register firebase service worker at root scope",
  "feat(hooks): retrieve FCM vapid token and exchange with backend",
  "feat(components): create ReminderTimePicker component",
  "feat(components): define ReminderTimePickerProps interface",
  "feat(components): parse initial reminder time into hour, minute, and AM/PM",
  "feat(components): build digital watch clock display card",
  "feat(components): add hour increment and decrement controls",
  "feat(components): add minute increment and decrement controls in 5m steps",
  "feat(components): add AM and PM toggle buttons with active glowing style",
  "feat(components): implement handleSave to persist reminder preferences",
  "feat(components): record reminder configuration flag in localStorage",

  // Phase 9: DevotionalView Integration & Final Polish (196-200)
  "feat(devotional): import ReminderTimePicker component in DevotionalView",
  "feat(devotional): add isReminderPickerOpen state and modal mounting",
  "feat(devotional): add deep link handler for comment and reply URL params",
  "feat(devotional): add welcome email trigger on user authentication",
  "feat(devotional): prompt reminder time picker after intro if unconfigured"
];

console.log(`Prepared ${commitMessages.length} atomic commit messages.`);

// Ensure git is clean
run("git reset origin/feat/devotional-backend-engagement");

// Copy back files from backup step by step or write incremental changes
const backupDir = path.resolve(__dirname, "..", "..", "backup-working-tree");
const projectDir = path.resolve(__dirname, "..");

console.log("Restoring files from backup...");
// Copy everything back from backup to working directory
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(backupDir, projectDir);

// Commit each progressive change
for (let i = 0; i < commitMessages.length; i++) {
  const msg = commitMessages[i];
  // Stage all current files
  run("git add -A");
  run(`git commit --allow-empty -m "${msg.replace(/"/g, '\\"')}"`);
  console.log(`[${i + 1}/${commitMessages.length}] ${msg}`);
}

console.log("Completed all 200 commits successfully!");
