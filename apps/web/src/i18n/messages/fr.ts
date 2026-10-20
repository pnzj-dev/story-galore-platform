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
  "settings.language": "Préférences de langue",
  "settings.languageDescription":
    "Choisissez les langues de contenu qui apparaissent dans votre fil de découverte. Le filtrage est appliqué côté serveur avant la pagination.",
  "settings.contentLanguageMode": "Afficher",
  "settings.showAllLanguages": "Toutes les langues",
  "settings.showSelectedLanguages": "Uniquement les langues sélectionnées",
  "settings.contentLanguagesLabel": "Langues de contenu",

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

  // Studio layout + navigation
  "studio.brand": "Studio",
  "studio.nav.dashboard": "Tableau de bord",
  "studio.nav.projects": "Projets",
  "studio.backToSite": "← Retour au site",
  "studio.backToProjects": "← Projets",
  "studio.backToProject": "← Retour au projet",

  // Studio tabs
  "studio.tab.overview": "Aperçu",
  "studio.tab.storyBible": "Bible de l'histoire",
  "studio.tab.characters": "Personnages",
  "studio.tab.world": "Monde",
  "studio.tab.assets": "Ressources",
  "studio.tab.prompts": "Invites",
  "studio.tab.ai": "IA",
  "studio.tab.drafts": "Brouillons",
  "studio.tab.editor": "Éditeur",
  "studio.tab.publications": "Publications",
  "studio.tab.analytics": "Analytique",

  // Studio common fields
  "studio.field.title": "Titre",
  "studio.field.type": "Type",
  "studio.field.format": "Format",
  "studio.field.name": "Nom",
  "studio.field.description": "Description",
  "studio.save": "Enregistrer",
  "studio.untitled": "Sans titre",
  "studio.untitledProject": "Projet sans titre",
  "studio.untitledDocument": "Document sans titre",
  "studio.comingSoon": "Cette section arrive bientôt.",

  // Media types
  "studio.type.book": "Livre",
  "studio.type.post": "Publication",
  "studio.type.video": "Vidéo",
  "studio.type.audio": "Audio",
  "studio.type.mixed": "Mixte",

  // Book formats
  "studio.format.comic": "Bande dessinée",
  "studio.format.manga": "Manga",
  "studio.format.manhwa": "Manhwa",
  "studio.format.manhua": "Manhua",
  "studio.format.bandeDessinee": "Bande dessinée",
  "studio.format.graphicNovel": "Roman graphique",
  "studio.format.webtoon": "Webtoon",
  "studio.format.novel": "Roman",
  "studio.format.lightNovel": "Light novel",
  "studio.format.nonfiction": "Non-fiction",
  "studio.format.educational": "Éducatif",

  // Studio dashboard
  "studio.dashboard.welcome": "Bon retour",
  "studio.dashboard.creator": "Créateur",
  "studio.dashboard.viewProjects": "Voir les projets",

  // Studio projects index
  "studio.projects.wip": "Vos travaux en cours.",
  "studio.projects.noProjects": "Aucun projet pour l'instant. Créez-en un depuis l'accueil du studio.",

  // Studio project detail
  "studio.newDocument": "Nouveau document",
  "studio.newDocumentDesc": "Commencez tout type de publication — une bande dessinée n'est qu'un format de livre.",
  "studio.formatBooksOnly": "Format (livres uniquement)",
  "studio.createDocument": "Créer le document",
  "studio.documents": "Documents",
  "studio.noDocuments": "Aucun document pour l'instant. Créez votre premier document ci-dessus.",

  // Story bible
  "studio.bible.desc": "Saisissez la prémisse, les thèmes et le ton qui ancrent ce projet.",
  "studio.bible.premise": "Prémisse",
  "studio.bible.themes": "Thèmes",
  "studio.bible.tone": "Ton",

  // Characters
  "studio.characters.none": "Aucun personnage pour l'instant.",
  "studio.characters.add": "Ajouter un personnage",

  // World
  "studio.world.desc": "Décrivez le cadre, les lieux et les règles de votre monde.",
  "studio.world.locations": "Lieux",
  "studio.world.rules": "Règles",

  // Assets
  "studio.assets.none": "Aucune ressource pour l'instant.",
  "studio.assets.default": "Ressource",

  // Publications
  "studio.publications.none": "Aucune publication pour l'instant.",

  // Prompts
  "studio.prompts.title": "Modèles d'invite",
  "studio.prompts.desc": "Invites réutilisables pour la génération IA, limitées à ce projet.",
  "studio.prompts.variables": "Variables",
  "studio.prompts.none": "Aucun modèle d'invite pour l'instant.",
  "studio.prompts.template": "Modèle",
  "studio.prompts.variablesField": "Variables (séparées par des virgules)",
  "studio.prompts.add": "Ajouter un modèle",

  // AI generation
  "studio.ai.desc": "Soumettez une demande de génération. L'éligibilité aux crédits est décidée côté serveur ; les exécutions BYOK et auto-hébergées ne sont jamais éligibles aux crédits.",
  "studio.ai.creditsPerGen": "crédit(s) par génération",
  "studio.ai.noProvider": "Aucun fournisseur éligible aux crédits n'est encore enregistré.",
  "studio.ai.targetType": "Type cible",
  "studio.ai.target.page": "Page",
  "studio.ai.target.panel": "Case",
  "studio.ai.target.image": "Image",
  "studio.ai.target.character": "Personnage",
  "studio.ai.target.background": "Arrière-plan",
  "studio.ai.target.dialogue": "Dialogue",
  "studio.ai.target.storyText": "Texte de l'histoire",
  "studio.ai.target.video": "Vidéo",
  "studio.ai.billingMode": "Mode de facturation",
  "studio.ai.billing.platformCredits": "Crédits StoryGalore",
  "studio.ai.billing.byok": "BYOK",
  "studio.ai.billing.userHosted": "Auto-hébergé",
  "studio.ai.execLocation": "Lieu d'exécution",
  "studio.ai.location.cloud": "Cloud",
  "studio.ai.location.userHosted": "Auto-hébergé",
  "studio.ai.prompt": "Invite",
  "studio.ai.promptTemplate": "Modèle d'invite (facultatif)",
  "studio.ai.videoOptions": "Options vidéo (pour VIDÉO)",
  "studio.ai.duration": "Durée (s)",
  "studio.ai.resolution": "Résolution",
  "studio.ai.aspect": "Format",
  "studio.ai.submit": "Soumettre la demande",
  "studio.ai.requests": "Demandes",
  "studio.ai.credits": "crédits",
  "studio.ai.ineligible": "non éligible",
  "studio.ai.none": "Aucune demande de génération pour l'instant.",

  // Creator analytics
  "studio.analytics.desc": "Vos métriques d'espace de travail, calculées en direct depuis vos projets.",
  "studio.analytics.generations": "Générations",
  "studio.analytics.creditEligible": "Générations éligibles aux crédits",
  "studio.analytics.byBilling": "Générations par mode de facturation",

  // Drafts
  "studio.drafts.desc": "Les documents de votre projet. Ouvrez un brouillon pour modifier pages et cases.",
  "studio.drafts.openEditor": "Ouvrir l'éditeur",
  "studio.drafts.none": "Aucun brouillon pour l'instant.",
  "studio.drafts.new": "Nouveau brouillon",

  // Editor
  "studio.editor.details": "Détails",
  "studio.editor.pages": "Pages",
  "studio.editor.width": "Largeur (px)",
  "studio.editor.height": "Hauteur (px)",
  "studio.editor.addPage": "Ajouter une page",
  "studio.editor.pageLabel": "Page",
  "studio.editor.defaultDims": "dimensions par défaut",
  "studio.editor.deletePage": "Supprimer la page",
  "studio.editor.setBackground": "Définir l'arrière-plan…",
  "studio.editor.set": "Définir",
  "studio.editor.panels": "Cases",
  "studio.editor.delete": "Supprimer",
  "studio.editor.updatePanel": "Mettre à jour la case",
  "studio.editor.noPanels": "Aucune case pour l'instant.",
  "studio.editor.shape": "Forme",
  "studio.editor.addPanel": "Ajouter une case",
  "studio.editor.shape.rectangle": "Rectangle",
  "studio.editor.shape.rounded": "Arrondi",
  "studio.editor.shape.circle": "Cercle",
  "studio.editor.shape.custom": "Personnalisé",
  "studio.editor.noPages": "Aucune page pour l'instant. Ajoutez votre première page ci-dessus.",
  "studio.editor.comingSoon": "L'édition de contenu pour ce type de média arrive bientôt. Vous pouvez définir le titre et le format ci-dessus.",
  "studio.editor.mediaLibrary": "Médiathèque",
  "studio.editor.mediaLibraryDesc": "Importez des images (couvertures, planches, galerie, avatars) — un seul pipeline média.",
  "studio.editor.uploadImage": "Importer une image",
  "studio.editor.noImages": "Aucune image importée pour l'instant.",
  "studio.editor.revisions": "Historique des révisions",
  "studio.editor.revisionsDesc": "Restaurez une révision précédente de ce brouillon.",
  "studio.editor.revisionLabel": "Révision",
  "studio.editor.restore": "Restaurer",
  "studio.editor.noRevisions": "Aucune révision pour l'instant — les révisions sont enregistrées lorsque le document change.",
  "studio.editor.publish": "Publier",
  "studio.editor.publishDesc": "Validez et publiez ce document en tant que publication publique.",
  "studio.editor.contentRating": "Classification",
  "studio.editor.rating.allAges": "Tout public",
  "studio.editor.rating.teen": "Adolescents",
  "studio.editor.rating.adult": "18+",
  "studio.editor.contentOrigin": "Origine du contenu",
  "studio.editor.origin.human": "Humain",
  "studio.editor.origin.aiAssisted": "Assisté par IA",
  "studio.editor.origin.aiGenerated": "Généré par IA",
  "studio.editor.origin.hybrid": "Hybride",
  "studio.editor.access": "Accès",
  "studio.editor.access.free": "Gratuit",
  "studio.editor.access.subscription": "Abonnement",
  "studio.editor.access.purchase": "Achat unique",
  "studio.editor.cover": "Image de couverture",
  "studio.editor.noCover": "Aucune couverture",

  // Document meta (autosave status)
  "studio.meta.saving": "Enregistrement…",
  "studio.meta.saved": "Enregistré",
  "studio.meta.error": "Échec de l'enregistrement — nouvelle tentative",
  "studio.meta.offline": "Hors ligne — les modifications seront synchronisées à la reconnexion",
  "studio.meta.autosave": "Enregistrement automatique pendant la saisie",
} satisfies Record<keyof typeof en, string>;

export default fr;
