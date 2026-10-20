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

  // Auth
  "auth.welcomeBack": "Bon retour",
  "auth.signInPrompt": "Connectez-vous pour reprendre là où vous vous étiez arrêté.",
  "auth.email": "E-mail",
  "auth.password": "Mot de passe",
  "auth.name": "Nom",
  "auth.createAccount": "Créer un compte",
  "auth.newHere": "Nouveau ici ?",
  "auth.alreadyHaveAccount": "Vous avez déjà un compte ?",
  "auth.createYourAccount": "Créez votre compte",
  "auth.startReading": "Commencez à lire, regarder et écouter.",
  "auth.resetPassword": "Réinitialiser le mot de passe",
  "auth.enterEmail": "Saisissez votre e-mail et nous vous enverrons un lien de réinitialisation.",
  "auth.sendResetLink": "Envoyer le lien",
  "auth.resetLinkSent": "Si un compte existe pour cet e-mail, un lien de réinitialisation est en route.",
  "auth.backToSignIn": "Retour à la connexion",
  "auth.setNewPassword": "Définir un nouveau mot de passe",
  "auth.passwordUpdated": "Mot de passe mis à jour.",
  "auth.signInNewPassword": "avec votre nouveau mot de passe.",
  "auth.newPassword": "Nouveau mot de passe",
  "auth.updatePassword": "Mettre à jour le mot de passe",

  // Settings
  "settings.adultContent": "Contenu adulte",
  "settings.adultContentDescription":
    "Vérifiez votre âge et optez pour l'affichage du contenu 18+. Votre âge est calculé côté serveur ; ce réglage n'est jamais fiable depuis le client.",
  "settings.dateOfBirth": "Date de naissance",
  "settings.enableAdult": "Activer le contenu 18+",
  "settings.no": "Non",
  "settings.yes": "Oui",
  "settings.save": "Enregistrer",

  // Admin navigation
  "admin.label": "Admin",
  "admin.overview": "Vue d'ensemble",
  "admin.analytics": "Analyses",
  "admin.users": "Utilisateurs",
  "admin.creators": "Créateurs",
  "admin.content": "Contenu",
  "admin.moderation": "Modération",
  "admin.payments": "Paiements",
  "admin.subscriptions": "Abonnements",
  "admin.ads": "Publicité",
  "admin.comingSoon": "Bientôt",
  "admin.aiOperations": "Opérations IA",
  "admin.storage": "Stockage",
  "admin.messaging": "Messagerie",
  "admin.system": "Système",
  "admin.settings": "Paramètres",

  // Admin overview
  "admin.overviewDesc": "Comment se porte la plateforme ?",
  "admin.kpi.activePaid": "Abonnés payants actifs",
  "admin.kpi.mrr": "MRR",
  "admin.kpi.newSubs": "Nouveaux abonnés (30 j)",
  "admin.kpi.churned": "Désabonnés (30 j)",
  "admin.kpi.revenue": "Revenus (30 j)",
  "admin.kpi.activeReaders": "Lecteurs actifs (30 j)",
  "admin.kpi.published": "Contenu publié",
  "admin.kpi.aiJobs": "Tâches IA (30 j)",
  "admin.chart.revenue": "Tendance des revenus (30 j)",
  "admin.chart.revenueDesc": "Revenus de paiement encaissés par jour.",
  "admin.chart.newSubs": "Nouveaux abonnés (30 j)",
  "admin.chart.newSubsDesc": "Nouveaux abonnements par jour.",
  "admin.chart.churn": "Attrition (30 j)",
  "admin.chart.churnDesc": "Annulations par jour.",
  "admin.noAnalytics": "Aucune analyse disponible.",

  // Studio
  "studio.title": "Studio créateur",
  "studio.profileImage": "Image de profil",
  "studio.avatar": "Avatar",
  "studio.none": "— aucun —",
  "studio.setAvatar": "Définir l'avatar",
  "studio.newProject": "Nouveau projet",
  "studio.name": "Nom",
  "studio.description": "Description",
  "studio.createProject": "Créer le projet",
  "studio.yourProjects": "Vos projets",
  "studio.noProjects": "Aucun projet pour le moment.",
  "studio.becomeCreator": "Devenir créateur",
  "studio.becomeCreatorDesc": "Créez votre profil de créateur pour commencer à publier des histoires.",
  "studio.handle": "Identifiant",
  "studio.displayName": "Nom d'affichage",
  "studio.bio": "Bio",
} satisfies Record<keyof typeof en, string>;

export default fr;
