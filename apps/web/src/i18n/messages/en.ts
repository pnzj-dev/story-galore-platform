/**
 * English message catalog — the source of truth for message keys.
 * fr.ts and ar.ts must mirror these keys exactly (typed via satisfies).
 */
export default {
  // Navigation
  "nav.home": "Home",
  "nav.videos": "Videos",
  "nav.shorts": "Shorts",
  "nav.books": "Books",
  "nav.images": "Images",
  "nav.audio": "Audio",
  "nav.search": "Search…",
  "nav.signIn": "Sign in",
  "nav.getStarted": "Get started",

  // Mobile navigation
  "mobile.search": "Search",
  "mobile.profile": "Profile",

  // Footer
  "footer.help": "Help",
  "footer.support": "Support",

  // User menu
  "menu.account": "Account",
  "menu.library": "Library",
  "menu.settings": "Settings",
  "menu.billing": "Billing",
  "menu.creatorStudio": "Creator Studio",
  "menu.signOut": "Sign out",

  // Notifications
  "notif.title": "Notifications",
  "notif.markAllRead": "Mark all as read",
  "notif.all": "All",
  "notif.unread": "Unread",
  "notif.noNotifications": "No notifications.",
  "notif.preferences": "Notification preferences →",

  // Home
  "home.continueWatching": "Continue Watching",
  "home.trendingMovies": "Trending in Movies",
  "home.trendingBooks": "Trending in Books",
  "home.shorts": "Shorts — Fresh Today",
  "home.seeAll": "See all →",
  "home.featuredFilm": "Featured Film",
  "home.featuredStory": "Featured Story",
  "home.play": "Play",
  "home.myList": "My List",
  "home.sponsored": "Sponsored",

  // Errors
  "error.notFound": "Not found",
  "error.forbidden": "Forbidden",
  "error.serverError": "Server error",
  "error.backHome": "Back home",
  "error.notFoundBody": "This page could not be found.",
  "error.forbiddenBody": "You don't have permission to access this page.",
  "error.serverErrorBody": "An unexpected error occurred. Please try again.",

  // Support
  "support.title": "Support",
  "support.here": "We're here to help.",
  "support.intro": "For billing, account, or content questions, start with the",
  "support.helpCenter": "Help Center",
  "support.introAfter":
    "If you still need help, email us with your account email and a short description of the issue.",
  "support.email": "Email support",
  "support.reply":
    "We typically reply within one business day. Support tickets are tracked in StoryGalore; engineering escalations map to GitHub issues.",

  // Auth
  "auth.welcomeBack": "Welcome back",
  "auth.signInPrompt": "Sign in to pick up where you left off.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.name": "Name",
  "auth.createAccount": "Create account",
  "auth.newHere": "New here?",
  "auth.alreadyHaveAccount": "Already have an account?",
  "auth.createYourAccount": "Create your account",
  "auth.startReading": "Start reading, watching and listening.",
  "auth.resetPassword": "Reset password",
  "auth.enterEmail": "Enter your email and we'll send a reset link.",
  "auth.sendResetLink": "Send reset link",
  "auth.resetLinkSent": "If an account exists for that email, a reset link is on its way.",
  "auth.backToSignIn": "Back to sign in",
  "auth.setNewPassword": "Set a new password",
  "auth.passwordUpdated": "Password updated.",
  "auth.signInNewPassword": "with your new password.",
  "auth.newPassword": "New password",
  "auth.updatePassword": "Update password",

  // Settings
  "settings.adultContent": "Adult content",
  "settings.adultContentDescription":
    "Verify your age and opt in to view 18+ content. Your age is computed server-side; this setting is never trusted from the client.",
  "settings.dateOfBirth": "Date of birth",
  "settings.enableAdult": "Enable 18+ content",
  "settings.no": "No",
  "settings.yes": "Yes",
  "settings.save": "Save",

  // Admin navigation
  "admin.label": "Admin",
  "admin.overview": "Overview",
  "admin.analytics": "Analytics",
  "admin.users": "Users",
  "admin.creators": "Creators",
  "admin.content": "Content",
  "admin.moderation": "Moderation",
  "admin.payments": "Payments",
  "admin.subscriptions": "Subscriptions",
  "admin.ads": "Ads & Monetization",
  "admin.comingSoon": "Coming soon",
  "admin.aiOperations": "AI Operations",
  "admin.storage": "Storage",
  "admin.messaging": "Messaging",
  "admin.system": "System",
  "admin.settings": "Settings",

  // Studio
  "studio.title": "Creator Studio",
  "studio.profileImage": "Profile image",
  "studio.avatar": "Avatar",
  "studio.none": "— none —",
  "studio.setAvatar": "Set avatar",
  "studio.newProject": "New project",
  "studio.name": "Name",
  "studio.description": "Description",
  "studio.createProject": "Create project",
  "studio.yourProjects": "Your projects",
  "studio.noProjects": "No projects yet.",
  "studio.becomeCreator": "Become a creator",
  "studio.becomeCreatorDesc": "Create your creator profile to start publishing stories.",
  "studio.handle": "Handle",
  "studio.displayName": "Display name",
  "studio.bio": "Bio",
} as const;
