import type en from "./en";

/** Arabic message catalog (RTL). */
const ar = {
  // Navigation
  "nav.home": "الرئيسية",
  "nav.videos": "فيديو",
  "nav.shorts": "مقاطع قصيرة",
  "nav.books": "كتب",
  "nav.images": "صور",
  "nav.audio": "صوت",
  "nav.search": "بحث…",
  "nav.signIn": "تسجيل الدخول",
  "nav.getStarted": "ابدأ الآن",

  // Mobile navigation
  "mobile.search": "بحث",
  "mobile.profile": "الملف الشخصي",

  // Footer
  "footer.help": "مساعدة",
  "footer.support": "الدعم",

  // User menu
  "menu.account": "الحساب",
  "menu.library": "المكتبة",
  "menu.settings": "الإعدادات",
  "menu.billing": "الفوترة",
  "menu.creatorStudio": "استوديو المبدعين",
  "menu.signOut": "تسجيل الخروج",

  // Notifications
  "notif.title": "الإشعارات",
  "notif.markAllRead": "تعليم الكل كمقروء",
  "notif.all": "الكل",
  "notif.unread": "غير مقروء",
  "notif.noNotifications": "لا توجد إشعارات.",
  "notif.preferences": "تفضيلات الإشعارات ←",

  // Home
  "home.continueWatching": "متابعة المشاهدة",
  "home.trendingMovies": "الأفلام الرائجة",
  "home.trendingBooks": "الكتب الرائجة",
  "home.shorts": "مقاطع قصيرة — جديدة اليوم",
  "home.seeAll": "عرض الكل ←",
  "home.featuredFilm": "فيلم مميز",
  "home.featuredStory": "قصة مميزة",
  "home.play": "تشغيل",
  "home.myList": "قائمتي",
  "home.sponsored": "مُموّل",

  // Errors
  "error.notFound": "غير موجود",
  "error.forbidden": "غير مصرّح",
  "error.serverError": "خطأ في الخادم",
  "error.backHome": "العودة إلى الرئيسية",
  "error.notFoundBody": "تعذّر العثور على هذه الصفحة.",
  "error.forbiddenBody": "ليست لديك صلاحية للوصول إلى هذه الصفحة.",
  "error.serverErrorBody": "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",

  // Support
  "support.title": "الدعم",
  "support.here": "نحن هنا للمساعدة.",
  "support.intro": "لأي أسئلة حول الفوترة أو الحساب أو المحتوى، ابدأ بـ",
  "support.helpCenter": "مركز المساعدة",
  "support.introAfter":
    "إذا كنت لا تزال بحاجة إلى المساعدة، راسلنا مع البريد الإلكتروني لحسابك ووصف موجز للمشكلة.",
  "support.email": "الدعم عبر البريد الإلكتروني",
  "support.reply":
    "نرد عادةً خلال يوم عمل واحد. تُتابَع تذاكر الدعم في StoryGalore؛ وتُحال التصعيدات الهندسية إلى تذاكر GitHub.",

  // Auth
  "auth.welcomeBack": "مرحبًا بعودتك",
  "auth.signInPrompt": "سجّل الدخول للمتابعة من حيث توقفت.",
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة المرور",
  "auth.name": "الاسم",
  "auth.createAccount": "إنشاء حساب",
  "auth.newHere": "جديد هنا؟",
  "auth.alreadyHaveAccount": "لديك حساب بالفعل؟",
  "auth.createYourAccount": "أنشئ حسابك",
  "auth.startReading": "ابدأ القراءة والمشاهدة والاستماع.",
  "auth.resetPassword": "إعادة تعيين كلمة المرور",
  "auth.enterEmail": "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.",
  "auth.sendResetLink": "إرسال الرابط",
  "auth.resetLinkSent": "إذا كان هناك حساب لهذا البريد الإلكتروني، فسيصلك رابط إعادة التعيين.",
  "auth.backToSignIn": "العودة إلى تسجيل الدخول",
  "auth.setNewPassword": "تعيين كلمة مرور جديدة",
  "auth.passwordUpdated": "تم تحديث كلمة المرور.",
  "auth.signInNewPassword": "بكلمة مرورك الجديدة.",
  "auth.newPassword": "كلمة المرور الجديدة",
  "auth.updatePassword": "تحديث كلمة المرور",

  // Settings
  "settings.adultContent": "المحتوى للبالغين",
  "settings.adultContentDescription":
    "تحقق من عمرك واختر عرض محتوى 18+. يُحسب عمرك على الخادم؛ ولا يُعتمد على هذا الإعداد من جهة العميل أبدًا.",
  "settings.dateOfBirth": "تاريخ الميلاد",
  "settings.enableAdult": "تفعيل محتوى 18+",
  "settings.no": "لا",
  "settings.yes": "نعم",
  "settings.save": "حفظ",

  // Admin navigation
  "admin.label": "الإدارة",
  "admin.overview": "نظرة عامة",
  "admin.analytics": "التحليلات",
  "admin.users": "المستخدمون",
  "admin.creators": "المبدعون",
  "admin.content": "المحتوى",
  "admin.moderation": "الإشراف",
  "admin.payments": "المدفوعات",
  "admin.subscriptions": "الاشتراكات",
  "admin.ads": "الإعلانات",
  "admin.comingSoon": "قريبًا",
  "admin.aiOperations": "عمليات الذكاء الاصطناعي",
  "admin.storage": "التخزين",
  "admin.messaging": "المراسلة",
  "admin.system": "النظام",
  "admin.settings": "الإعدادات",

  // Admin overview
  "admin.overviewDesc": "كيف تسير المنصة؟",
  "admin.kpi.activePaid": "المشتركون المدفوعون النشطون",
  "admin.kpi.mrr": "الإيراد المتكرر الشهري",
  "admin.kpi.newSubs": "مشتركون جدد (30 يومًا)",
  "admin.kpi.churned": "المُلغَون (30 يومًا)",
  "admin.kpi.revenue": "الإيرادات (30 يومًا)",
  "admin.kpi.activeReaders": "قرّاء نشطون (30 يومًا)",
  "admin.kpi.published": "محتوى منشور",
  "admin.kpi.aiJobs": "مهام الذكاء الاصطناعي (30 يومًا)",
  "admin.chart.revenue": "اتجاه الإيرادات (30 يومًا)",
  "admin.chart.revenueDesc": "إيرادات المدفوعات المحصّلة يوميًا.",
  "admin.chart.newSubs": "مشتركون جدد (30 يومًا)",
  "admin.chart.newSubsDesc": "اشتراكات جديدة يوميًا.",
  "admin.chart.churn": "الإلغاء (30 يومًا)",
  "admin.chart.churnDesc": "عمليات الإلغاء يوميًا.",
  "admin.noAnalytics": "لا توجد تحليلات متاحة.",

  // Studio
  "studio.title": "استوديو المبدعين",
  "studio.profileImage": "صورة الملف الشخصي",
  "studio.avatar": "الصورة الرمزية",
  "studio.none": "— بلا —",
  "studio.setAvatar": "تعيين الصورة الرمزية",
  "studio.newProject": "مشروع جديد",
  "studio.name": "الاسم",
  "studio.description": "الوصف",
  "studio.createProject": "إنشاء المشروع",
  "studio.yourProjects": "مشاريعك",
  "studio.noProjects": "لا توجد مشاريع بعد.",
  "studio.becomeCreator": "كن مبدعًا",
  "studio.becomeCreatorDesc": "أنشئ ملفك الشخصي كمبدع لبدء نشر القصص.",
  "studio.handle": "المعرّف",
  "studio.displayName": "اسم العرض",
  "studio.bio": "نبذة",
} satisfies Record<keyof typeof en, string>;

export default ar;
