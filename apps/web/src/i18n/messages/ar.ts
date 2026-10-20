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
  "settings.language": "تفضيلات اللغة",
  "settings.languageDescription":
    "اختر لغات المحتوى التي تظهر في خلاصة الاكتشاف. يُطبَّق التصفية على الخادم قبل ترقيم الصفحات.",
  "settings.contentLanguageMode": "إظهار",
  "settings.showAllLanguages": "كل اللغات",
  "settings.showSelectedLanguages": "اللغات المحددة فقط",
  "settings.contentLanguagesLabel": "لغات المحتوى",

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

  // Studio layout + navigation
  "studio.brand": "الاستوديو",
  "studio.nav.dashboard": "لوحة التحكم",
  "studio.nav.projects": "المشاريع",
  "studio.backToSite": "← العودة إلى الموقع",
  "studio.backToProjects": "← المشاريع",
  "studio.backToProject": "← العودة إلى المشروع",

  // Studio tabs
  "studio.tab.overview": "نظرة عامة",
  "studio.tab.storyBible": "موسوعة القصة",
  "studio.tab.characters": "الشخصيات",
  "studio.tab.world": "العالم",
  "studio.tab.assets": "الأصول",
  "studio.tab.prompts": "المطالبات",
  "studio.tab.ai": "الذكاء الاصطناعي",
  "studio.tab.drafts": "المسودات",
  "studio.tab.editor": "المحرر",
  "studio.tab.publications": "المنشورات",
  "studio.tab.analytics": "التحليلات",

  // Studio common fields
  "studio.field.title": "العنوان",
  "studio.field.type": "النوع",
  "studio.field.format": "الصيغة",
  "studio.field.name": "الاسم",
  "studio.field.description": "الوصف",
  "studio.save": "حفظ",
  "studio.untitled": "بدون عنوان",
  "studio.untitledProject": "مشروع بدون عنوان",
  "studio.untitledDocument": "مستند بدون عنوان",
  "studio.comingSoon": "هذا القسم قادم قريبًا.",

  // Media types
  "studio.type.book": "كتاب",
  "studio.type.post": "منشور",
  "studio.type.video": "فيديو",
  "studio.type.audio": "صوت",
  "studio.type.mixed": "مختلط",

  // Book formats
  "studio.format.comic": "قصص مصورة",
  "studio.format.manga": "مانغا",
  "studio.format.manhwa": "مانهوا",
  "studio.format.manhua": "مانهوا",
  "studio.format.bandeDessinee": "قصص مصورة",
  "studio.format.graphicNovel": "رواية مصورة",
  "studio.format.webtoon": "ويبتون",
  "studio.format.novel": "رواية",
  "studio.format.lightNovel": "رواية خفيفة",
  "studio.format.nonfiction": "غير روائي",
  "studio.format.educational": "تعليمي",

  // Studio dashboard
  "studio.dashboard.welcome": "مرحبًا بعودتك",
  "studio.dashboard.creator": "المبدع",
  "studio.dashboard.viewProjects": "عرض المشاريع",

  // Studio projects index
  "studio.projects.wip": "أعمالك الجارية.",
  "studio.projects.noProjects": "لا توجد مشاريع بعد. أنشئ واحدًا من الصفحة الرئيسية للاستوديو.",

  // Studio project detail
  "studio.newDocument": "مستند جديد",
  "studio.newDocumentDesc": "ابدأ أي نوع من المنشورات — القصة المصورة مجرد صيغة كتاب واحدة.",
  "studio.formatBooksOnly": "الصيغة (للكتب فقط)",
  "studio.createDocument": "إنشاء المستند",
  "studio.documents": "المستندات",
  "studio.noDocuments": "لا توجد مستندات بعد. أنشئ مستندك الأول أعلاه.",

  // Story bible
  "studio.bible.desc": "سجّل الفرضية والمواضيع والنبرة التي ترسّخ هذا المشروع.",
  "studio.bible.premise": "الفرضية",
  "studio.bible.themes": "المواضيع",
  "studio.bible.tone": "النبرة",

  // Characters
  "studio.characters.none": "لا توجد شخصيات بعد.",
  "studio.characters.add": "إضافة شخصية",

  // World
  "studio.world.desc": "صِف الإطار والمواقع والقواعد في عالمك.",
  "studio.world.locations": "المواقع",
  "studio.world.rules": "القواعد",

  // Assets
  "studio.assets.none": "لا توجد أصول بعد.",
  "studio.assets.default": "أصل",

  // Publications
  "studio.publications.none": "لا توجد منشورات بعد.",

  // Prompts
  "studio.prompts.title": "قوالب المطالبات",
  "studio.prompts.desc": "مطالبات قابلة لإعادة الاستخدام لتوليد الذكاء الاصطناعي، مقتصرة على هذا المشروع.",
  "studio.prompts.variables": "المتغيرات",
  "studio.prompts.none": "لا توجد قوالب مطالبات بعد.",
  "studio.prompts.template": "القالب",
  "studio.prompts.variablesField": "المتغيرات (مفصولة بفواصل)",
  "studio.prompts.add": "إضافة قالب",

  // AI generation
  "studio.ai.desc": "قدّم طلب توليد. تُحدَّد أهلية الأرصدة من جهة الخادم؛ ولا تكون عمليات BYOK والاستضافة الذاتية مؤهلة للأرصدة أبدًا.",
  "studio.ai.creditsPerGen": "رصيد (أرصدة) لكل توليد",
  "studio.ai.noProvider": "لم يُسجَّل مزوّد مؤهل للأرصدة بعد.",
  "studio.ai.targetType": "النوع المستهدف",
  "studio.ai.target.page": "صفحة",
  "studio.ai.target.panel": "لوحة",
  "studio.ai.target.image": "صورة",
  "studio.ai.target.character": "شخصية",
  "studio.ai.target.background": "خلفية",
  "studio.ai.target.dialogue": "حوار",
  "studio.ai.target.storyText": "نص القصة",
  "studio.ai.target.video": "فيديو",
  "studio.ai.billingMode": "طريقة الفوترة",
  "studio.ai.billing.platformCredits": "أرصدة StoryGalore",
  "studio.ai.billing.byok": "BYOK",
  "studio.ai.billing.userHosted": "استضافة ذاتية",
  "studio.ai.execLocation": "موقع التنفيذ",
  "studio.ai.location.cloud": "سحابة",
  "studio.ai.location.userHosted": "استضافة ذاتية",
  "studio.ai.prompt": "المطالبة",
  "studio.ai.promptTemplate": "قالب المطالبة (اختياري)",
  "studio.ai.videoOptions": "خيارات الفيديو (للفيديو)",
  "studio.ai.duration": "المدة (ثانية)",
  "studio.ai.resolution": "الدقة",
  "studio.ai.aspect": "النسبة",
  "studio.ai.submit": "إرسال الطلب",
  "studio.ai.requests": "الطلبات",
  "studio.ai.credits": "أرصدة",
  "studio.ai.ineligible": "غير مؤهل",
  "studio.ai.none": "لا توجد طلبات توليد بعد.",

  // Creator analytics
  "studio.analytics.desc": "مقاييس مساحة عملك، محسوبة مباشرة من مشاريعك.",
  "studio.analytics.generations": "عمليات التوليد",
  "studio.analytics.creditEligible": "عمليات توليد مؤهلة للأرصدة",
  "studio.analytics.byBilling": "عمليات التوليد حسب طريقة الفوترة",

  // Drafts
  "studio.drafts.desc": "مستندات مشروعك. افتح مسودة لتعديل الصفحات واللوحات.",
  "studio.drafts.openEditor": "فتح المحرر",
  "studio.drafts.none": "لا توجد مسودات بعد.",
  "studio.drafts.new": "مسودة جديدة",

  // Editor
  "studio.editor.details": "التفاصيل",
  "studio.editor.pages": "الصفحات",
  "studio.editor.width": "العرض (بكسل)",
  "studio.editor.height": "الارتفاع (بكسل)",
  "studio.editor.addPage": "إضافة صفحة",
  "studio.editor.pageLabel": "الصفحة",
  "studio.editor.defaultDims": "الأبعاد الافتراضية",
  "studio.editor.deletePage": "حذف الصفحة",
  "studio.editor.setBackground": "تعيين الخلفية…",
  "studio.editor.set": "تعيين",
  "studio.editor.panels": "اللوحات",
  "studio.editor.delete": "حذف",
  "studio.editor.updatePanel": "تحديث اللوحة",
  "studio.editor.noPanels": "لا توجد لوحات بعد.",
  "studio.editor.shape": "الشكل",
  "studio.editor.addPanel": "إضافة لوحة",
  "studio.editor.shape.rectangle": "مستطيل",
  "studio.editor.shape.rounded": "مستدير",
  "studio.editor.shape.circle": "دائرة",
  "studio.editor.shape.custom": "مخصص",
  "studio.editor.noPages": "لا توجد صفحات بعد. أضف صفحتك الأولى أعلاه.",
  "studio.editor.comingSoon": "تحرير المحتوى لهذا النوع من الوسائط قادم قريبًا. يمكنك تعيين العنوان والصيغة أعلاه.",
  "studio.editor.mediaLibrary": "مكتبة الوسائط",
  "studio.editor.mediaLibraryDesc": "ارفع الصور (الأغلفة، فنون الصفحات، المعرض، الصور الرمزية) — خط وسائط واحد عام.",
  "studio.editor.uploadImage": "رفع صورة",
  "studio.editor.noImages": "لم تُرفَع أي صور بعد.",
  "studio.editor.revisions": "سجل المراجعات",
  "studio.editor.revisionsDesc": "استعد مراجعة سابقة لهذه المسودة.",
  "studio.editor.revisionLabel": "المراجعة",
  "studio.editor.restore": "استعادة",
  "studio.editor.noRevisions": "لا توجد مراجعات بعد — تُسجَّل المراجعات عند تغيّر المستند.",
  "studio.editor.publish": "نشر",
  "studio.editor.publishDesc": "تحقّق من هذا المستند وانشره كمنشور عام.",
  "studio.editor.contentRating": "التصنيف العمري",
  "studio.editor.rating.allAges": "لجميع الأعمار",
  "studio.editor.rating.teen": "مراهقون",
  "studio.editor.rating.adult": "18+",
  "studio.editor.contentOrigin": "أصل المحتوى",
  "studio.editor.origin.human": "بشري",
  "studio.editor.origin.aiAssisted": "بمساعدة الذكاء الاصطناعي",
  "studio.editor.origin.aiGenerated": "مولَّد بالذكاء الاصطناعي",
  "studio.editor.origin.hybrid": "هجين",
  "studio.editor.access": "الوصول",
  "studio.editor.access.free": "مجاني",
  "studio.editor.access.subscription": "اشتراك",
  "studio.editor.access.purchase": "شراء لمرة واحدة",
  "studio.editor.cover": "صورة الغلاف",
  "studio.editor.noCover": "بدون غلاف",

  // Document meta (autosave status)
  "studio.meta.saving": "جارٍ الحفظ…",
  "studio.meta.saved": "تم الحفظ",
  "studio.meta.error": "تعذّر الحفظ — ستتم إعادة المحاولة",
  "studio.meta.offline": "غير متصل — ستتم مزامنة التغييرات عند إعادة الاتصال",
  "studio.meta.autosave": "حفظ تلقائي أثناء الكتابة",
} satisfies Record<keyof typeof en, string>;

export default ar;
