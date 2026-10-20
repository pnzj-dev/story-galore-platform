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
  "settings.language": "Language preferences",
  "settings.languageDescription":
    "Choose which content languages appear in your discovery feed. Filtering is enforced server-side before results are paged.",
  "settings.contentLanguageMode": "Show",
  "settings.showAllLanguages": "All languages",
  "settings.showSelectedLanguages": "Only selected languages",
  "settings.contentLanguagesLabel": "Content languages",

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

  // Admin overview
  "admin.overviewDesc": "How is the platform doing?",
  "admin.kpi.activePaid": "Active paid subscribers",
  "admin.kpi.mrr": "MRR",
  "admin.kpi.newSubs": "New subscribers (30d)",
  "admin.kpi.churned": "Churned (30d)",
  "admin.kpi.revenue": "Revenue (30d)",
  "admin.kpi.activeReaders": "Active readers (30d)",
  "admin.kpi.published": "Published content",
  "admin.kpi.aiJobs": "AI jobs (30d)",
  "admin.chart.revenue": "Revenue trend (30d)",
  "admin.chart.revenueDesc": "Captured payment revenue per day.",
  "admin.chart.newSubs": "New subscribers (30d)",
  "admin.chart.newSubsDesc": "New subscriptions per day.",
  "admin.chart.churn": "Churn (30d)",
  "admin.chart.churnDesc": "Cancellations per day.",
  "admin.noAnalytics": "No analytics available.",

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

  // Studio layout + navigation
  "studio.brand": "Studio",
  "studio.nav.dashboard": "Dashboard",
  "studio.nav.projects": "Projects",
  "studio.backToSite": "← Back to site",
  "studio.backToProjects": "← Projects",
  "studio.backToProject": "← Back to project",

  // Studio tabs
  "studio.tab.overview": "Overview",
  "studio.tab.storyBible": "Story Bible",
  "studio.tab.characters": "Characters",
  "studio.tab.world": "World",
  "studio.tab.assets": "Assets",
  "studio.tab.prompts": "Prompts",
  "studio.tab.ai": "AI",
  "studio.tab.drafts": "Drafts",
  "studio.tab.editor": "Editor",
  "studio.tab.publications": "Publications",
  "studio.tab.analytics": "Analytics",

  // Studio common fields
  "studio.field.title": "Title",
  "studio.field.type": "Type",
  "studio.field.format": "Format",
  "studio.field.name": "Name",
  "studio.field.description": "Description",
  "studio.save": "Save",
  "studio.untitled": "Untitled",
  "studio.untitledProject": "Untitled project",
  "studio.untitledDocument": "Untitled document",
  "studio.comingSoon": "This section is coming soon.",

  // Media types
  "studio.type.book": "Book",
  "studio.type.post": "Post",
  "studio.type.video": "Video",
  "studio.type.audio": "Audio",
  "studio.type.mixed": "Mixed",

  // Book formats
  "studio.format.comic": "Comic",
  "studio.format.manga": "Manga",
  "studio.format.manhwa": "Manhwa",
  "studio.format.manhua": "Manhua",
  "studio.format.bandeDessinee": "Bande dessinée",
  "studio.format.graphicNovel": "Graphic novel",
  "studio.format.webtoon": "Webtoon",
  "studio.format.novel": "Novel",
  "studio.format.lightNovel": "Light novel",
  "studio.format.nonfiction": "Nonfiction",
  "studio.format.educational": "Educational",

  // Studio dashboard
  "studio.dashboard.welcome": "Welcome back",
  "studio.dashboard.creator": "Creator",
  "studio.dashboard.viewProjects": "View projects",

  // Studio projects index
  "studio.projects.wip": "Your works-in-progress.",
  "studio.projects.noProjects": "No projects yet. Create one from the studio home.",

  // Studio project detail
  "studio.newDocument": "New document",
  "studio.newDocumentDesc": "Start any kind of publication — a comic is just one book format.",
  "studio.formatBooksOnly": "Format (books only)",
  "studio.createDocument": "Create document",
  "studio.documents": "Documents",
  "studio.noDocuments": "No documents yet. Create your first document above.",

  // Story bible
  "studio.bible.desc": "Capture the premise, themes, and tone that anchor this project.",
  "studio.bible.premise": "Premise",
  "studio.bible.themes": "Themes",
  "studio.bible.tone": "Tone",

  // Characters
  "studio.characters.none": "No characters yet.",
  "studio.characters.add": "Add character",

  // World
  "studio.world.desc": "Describe the setting, locations, and rules of your world.",
  "studio.world.locations": "Locations",
  "studio.world.rules": "Rules",

  // Assets
  "studio.assets.none": "No assets yet.",
  "studio.assets.default": "Asset",

  // Publications
  "studio.publications.none": "No publications yet.",

  // Prompts
  "studio.prompts.title": "Prompt templates",
  "studio.prompts.desc": "Reusable prompts for AI generation, scoped to this project.",
  "studio.prompts.variables": "Variables",
  "studio.prompts.none": "No prompt templates yet.",
  "studio.prompts.template": "Template",
  "studio.prompts.variablesField": "Variables (comma-separated)",
  "studio.prompts.add": "Add template",

  // AI generation
  "studio.ai.desc": "Submit a generation request. Credit eligibility is decided server-side; BYOK and user-hosted runs are never credit-eligible.",
  "studio.ai.creditsPerGen": "credit(s) per generation",
  "studio.ai.noProvider": "No credit-eligible provider registered yet.",
  "studio.ai.targetType": "Target type",
  "studio.ai.target.page": "Page",
  "studio.ai.target.panel": "Panel",
  "studio.ai.target.image": "Image",
  "studio.ai.target.character": "Character",
  "studio.ai.target.background": "Background",
  "studio.ai.target.dialogue": "Dialogue",
  "studio.ai.target.storyText": "Story text",
  "studio.ai.target.video": "Video",
  "studio.ai.billingMode": "Billing mode",
  "studio.ai.billing.platformCredits": "StoryGalore credits",
  "studio.ai.billing.byok": "BYOK",
  "studio.ai.billing.userHosted": "User-hosted",
  "studio.ai.execLocation": "Execution location",
  "studio.ai.location.cloud": "Cloud",
  "studio.ai.location.userHosted": "User-hosted",
  "studio.ai.prompt": "Prompt",
  "studio.ai.promptTemplate": "Prompt template (optional)",
  "studio.ai.videoOptions": "Video options (for VIDEO)",
  "studio.ai.duration": "Duration (s)",
  "studio.ai.resolution": "Resolution",
  "studio.ai.aspect": "Aspect",
  "studio.ai.submit": "Submit request",
  "studio.ai.requests": "Requests",
  "studio.ai.credits": "credits",
  "studio.ai.ineligible": "ineligible",
  "studio.ai.none": "No generation requests yet.",

  // Creator analytics
  "studio.analytics.desc": "Your workspace metrics, computed live from your projects.",
  "studio.analytics.generations": "Generations",
  "studio.analytics.creditEligible": "Credit-eligible generations",
  "studio.analytics.byBilling": "Generations by billing mode",

  // Drafts
  "studio.drafts.desc": "Your project's documents. Open a draft to edit pages and panels.",
  "studio.drafts.openEditor": "Open editor",
  "studio.drafts.none": "No drafts yet.",
  "studio.drafts.new": "New draft",

  // Editor
  "studio.editor.details": "Details",
  "studio.editor.pages": "Pages",
  "studio.editor.width": "Width (px)",
  "studio.editor.height": "Height (px)",
  "studio.editor.addPage": "Add page",
  "studio.editor.pageLabel": "Page",
  "studio.editor.defaultDims": "default dimensions",
  "studio.editor.deletePage": "Delete page",
  "studio.editor.setBackground": "Set background…",
  "studio.editor.set": "Set",
  "studio.editor.panels": "Panels",
  "studio.editor.delete": "Delete",
  "studio.editor.updatePanel": "Update panel",
  "studio.editor.noPanels": "No panels yet.",
  "studio.editor.shape": "Shape",
  "studio.editor.addPanel": "Add panel",
  "studio.editor.shape.rectangle": "Rectangle",
  "studio.editor.shape.rounded": "Rounded",
  "studio.editor.shape.circle": "Circle",
  "studio.editor.shape.custom": "Custom",
  "studio.editor.noPages": "No pages yet. Add your first page above.",
  "studio.editor.comingSoon": "Content editing for this media type is coming soon. You can set the title and format above.",
  "studio.editor.mediaLibrary": "Media library",
  "studio.editor.mediaLibraryDesc": "Upload images (covers, page art, gallery, avatars) — one general media pipeline.",
  "studio.editor.uploadImage": "Upload image",
  "studio.editor.noImages": "No images uploaded yet.",
  "studio.editor.revisions": "Revision history",
  "studio.editor.revisionsDesc": "Restore a previous revision of this draft.",
  "studio.editor.revisionLabel": "Revision",
  "studio.editor.restore": "Restore",
  "studio.editor.noRevisions": "No revisions yet — revisions are recorded when the document changes.",
  "studio.editor.publish": "Publish",
  "studio.editor.publishDesc": "Validate and publish this document as a public publication.",
  "studio.editor.contentRating": "Content rating",
  "studio.editor.rating.allAges": "All ages",
  "studio.editor.rating.teen": "Teen",
  "studio.editor.rating.adult": "18+",
  "studio.editor.contentOrigin": "Content origin",
  "studio.editor.origin.human": "Human",
  "studio.editor.origin.aiAssisted": "AI-assisted",
  "studio.editor.origin.aiGenerated": "AI-generated",
  "studio.editor.origin.hybrid": "Hybrid",
  "studio.editor.access": "Access",
  "studio.editor.access.free": "Free",
  "studio.editor.access.subscription": "Subscription",
  "studio.editor.access.purchase": "One-time purchase",
  "studio.editor.cover": "Cover image",
  "studio.editor.noCover": "No cover",

  // Document meta (autosave status)
  "studio.meta.saving": "Saving…",
  "studio.meta.saved": "Saved",
  "studio.meta.error": "Could not save — will retry",
  "studio.meta.offline": "Offline — changes will sync when you reconnect",
  "studio.meta.autosave": "Autosaves as you type",
} as const;
