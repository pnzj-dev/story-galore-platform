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
} as const;
