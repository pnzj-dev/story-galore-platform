import type en from "./en";

/** French message catalog. */
const fr = {
  // Navigation
  "nav.home": "Accueil",
  "nav.videos": "Vidéos",
  "nav.shorts": "Courts",
  "nav.books": "Livres",
  "nav.images": "Images",
  "nav.audio": "Audio",
  "nav.search": "Rechercher…",
  "nav.signIn": "Se connecter",
  "nav.getStarted": "Commencer",

  // Mobile navigation
  "mobile.search": "Recherche",
  "mobile.profile": "Profil",

  // Footer
  "footer.help": "Aide",
  "footer.support": "Assistance",

  // User menu
  "menu.account": "Compte",
  "menu.library": "Bibliothèque",
  "menu.settings": "Paramètres",
  "menu.billing": "Facturation",
  "menu.creatorStudio": "Studio créateur",
  "menu.signOut": "Se déconnecter",

  // Notifications
  "notif.title": "Notifications",
  "notif.markAllRead": "Tout marquer comme lu",
  "notif.all": "Toutes",
  "notif.unread": "Non lues",
  "notif.noNotifications": "Aucune notification.",
  "notif.preferences": "Préférences de notification →",

  // Home
  "home.continueWatching": "Continuer le visionnage",
  "home.trendingMovies": "Films tendance",
  "home.trendingBooks": "Livres tendance",
  "home.shorts": "Courts — frais du jour",
  "home.seeAll": "Tout voir →",
  "home.featuredFilm": "Film à l'affiche",
  "home.featuredStory": "Histoire à l'affiche",
  "home.play": "Lire",
  "home.myList": "Ma liste",
  "home.sponsored": "Sponsorisé",

  // Errors
  "error.notFound": "Introuvable",
  "error.forbidden": "Accès refusé",
  "error.serverError": "Erreur serveur",
  "error.backHome": "Retour à l'accueil",
  "error.notFoundBody": "Cette page est introuvable.",
  "error.forbiddenBody": "Vous n'avez pas l'autorisation d'accéder à cette page.",
  "error.serverErrorBody": "Une erreur inattendue s'est produite. Veuillez réessayer.",

  // Support
  "support.title": "Assistance",
  "support.here": "Nous sommes là pour vous aider.",
  "support.intro":
    "Pour toute question de facturation, de compte ou de contenu, commencez par le",
  "support.helpCenter": "centre d'aide",
  "support.introAfter":
    "Si vous avez encore besoin d'aide, écrivez-nous avec l'adresse e-mail de votre compte et une brève description du problème.",
  "support.email": "Assistance par e-mail",
  "support.reply":
    "Nous répondons généralement sous un jour ouvré. Les tickets d'assistance sont suivis dans StoryGalore ; les escalades techniques sont suivies dans les tickets GitHub.",
} satisfies Record<keyof typeof en, string>;

export default fr;
