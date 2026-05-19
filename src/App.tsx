import {
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import {
  ArrowUpDown,
  BadgeCheck,
  Banknote,
  Bug,
  Building2,
  Cake,
  Bell,
  Camera,
  CarFront,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  CircleHelp,
  CircleX,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Flag,
  FolderArchive,
  GraduationCap,
  Heart,
  HelpCircle,
  Home,
  ImagePlus,
  IdCard,
  Languages,
  MapPin,
  MapPinned,
  Maximize2,
  MessageCircle,
  MessagesSquare,
  Mic,
  Moon,
  Navigation,
  PackagePlus,
  Pencil,
  Phone,
  Plus,
  QrCode,
  Route,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Share2,
  Star,
  Store,
  Square,
  Sun,
  ThumbsUp,
  Trash2,
  Upload,
  UserCircle,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  appUser,
  campusCategories,
  campusLocations,
  busScheduleDocuments,
  busScheduleRoutes,
  chatChannels,
  externalDrives,
  faculties,
  marketplaceFilters,
  marketplaceCategories,
} from "./data";
import {
  isSupabaseConfigured,
  loadSupabaseState,
  saveSupabaseState,
  supabase,
} from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import type {
  AppSettings,
  CampusLocation,
  ChatMessage,
  LanguageCode,
  MarketplaceItem,
  ModuleKey,
  NavItem,
  NotificationItem,
  PastPaper,
  Profile,
  ProfileReview,
  PaymentMethod,
  Question,
  ServiceRequest,
} from "./types";

const navItems: NavItem[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "marketplace", label: "Marketplace", icon: Store },
  { key: "map", label: "Campus Map", icon: MapPinned },
  { key: "community", label: "Chats", icon: MessagesSquare },
  { key: "qa", label: "Q&A", icon: CircleHelp },
  { key: "papers", label: "Past Papers", icon: FolderArchive },
  { key: "requests", label: "Transportation", icon: CarFront },
  { key: "bus", label: "Bus Schedule", icon: CalendarClock },
  { key: "profile", label: "Profile", icon: UserCircle },
  { key: "settings", label: "Settings", icon: Settings },
];

const defaultSettings: AppSettings = {
  theme: "light",
  language: "en",
};

const listingConditions: MarketplaceItem["condition"][] = [
  "New",
  "Fresh",
  "Slightly Used",
  "Good",
  "Barely holding on",
];

const paymentPreferences: PaymentMethod[] = [
  "DuitNow QR",
  "TnG wallet",
  "Bank Transfer",
  "Cash",
];

const reactionChoices = ["❤️", "😂", "😮", "😢", "😡", "👍"];

const transportPlaceFilters = [
  "All",
  "PSZ Library",
  "Dewan Sultan Iskandar",
  "Kolej 9 and Kolej 10",
  "Kolej Perdana",
  "Kolej Tun Dr Ismail",
  "Faculty of Computing",
  "Senai Airport",
  "Paradigm Mall Johor Bahru",
  "Mid Valley Southkey",
  "JB Sentral",
];

const paperSemesterOptions = [
  "Foundation",
  "Bridging",
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

const paperTestOptions = ["Test 1", "Test 2", "Final", "Assignment"];

const marketplaceSortOptions = [
  "Date posted",
  "Price low to high",
  "Price high to low",
] as const;

const questionSortOptions = [
  "Date posted",
  "Most likes/upvotes",
  "Least likes/upvotes",
] as const;

const regularBusTimes = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "20:00",
  "22:00",
  "23:00",
];

const weekendBusTimes = [
  "07:30",
  "08:00",
  "09:00",
  "09:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "15:00",
  "15:30",
  "17:00",
  "17:30",
];

const bdrBusTimes = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
];

const facultyAliases: Record<string, string> = {
  Computing: "Faculty of Computing",
  Engineering: "Faculty of Mechanical Engineering",
  Science: "Faculty of Science",
  "Built Environment": "Faculty of Built Environment and Surveying",
  Management: "Faculty of Management",
  "Faculty of Artificial Intelligence": "Faculty of Artificial Intelligence (FAI)",
  "Faculty of Educational Sciences and Technology":
    "Faculty of Educational Sciences and Technology (FEST)",
};

const uiText: Record<LanguageCode, Record<string, string>> = {
  en: {
    searchPlaceholder: "Search UTM listings, places, chats, papers",
    noSearchMatch: "No matching section found",
    markRead: "Mark read",
    notifications: "Notifications",
    homeEyebrow: "UTM in one place",
    homeTitle: "Campus command center",
    openMarketplace: "Open marketplace",
    requestDriver: "Request transport",
    listingsLive: "Listings live",
    campusPlaces: "Campus places",
    openRequests: "Open requests",
    savedFavourites: "Saved favourites",
    marketplaceTitle: "UTM marketplace",
    createListing: "Create listing",
    publishListing: "Publish listing",
    addToFavourites: "Add to favourites",
    removeFromFavourites: "Remove from favourites",
    buy: "Buy",
    payNow: "Pay now",
    paymentMethod: "Payment method",
    privateChat: "Private chat",
    campusChats: "Campus chats",
    send: "Send",
    qaTitle: "UTM Q&A",
    askQuestion: "Ask a question",
    postQuestion: "Post question",
    answer: "Answer",
    helpful: "Helpful",
    papersTitle: "Past papers",
    busScheduleTitle: "UTM bus schedule",
    uploadPaper: "Upload paper",
    submitReview: "Submit for review",
    ownerReview: "Owner review queue",
    profileTitle: "Profile",
    saveProfile: "Save profile",
    settingsTitle: "Settings",
    appearance: "Appearance",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    language: "Language",
    privacySafety: "Privacy & safety",
    terms: "Terms & conditions",
    helpCenter: "Help center",
    reportBug: "Report bug",
    deleteAccount: "Delete account",
    deleteWarning: "This clears your local profile, messages, listings, papers, favourites, and settings on this device.",
    edit: "Edit",
    delete: "Delete",
    react: "React",
    save: "Save",
    cancel: "Cancel",
  },
  ms: {
    searchPlaceholder: "Cari senarai, tempat, sembang, kertas UTM",
    noSearchMatch: "Tiada bahagian yang sepadan",
    markRead: "Tanda dibaca",
    notifications: "Notifikasi",
    homeEyebrow: "UTM dalam satu tempat",
    homeTitle: "Pusat kampus",
    openMarketplace: "Buka pasaran",
    requestDriver: "Minta pengangkutan",
    listingsLive: "Senarai aktif",
    campusPlaces: "Tempat kampus",
    openRequests: "Permintaan terbuka",
    savedFavourites: "Kegemaran disimpan",
    marketplaceTitle: "Pasaran UTM",
    createListing: "Cipta senarai",
    publishListing: "Terbitkan senarai",
    addToFavourites: "Tambah kegemaran",
    removeFromFavourites: "Buang kegemaran",
    buy: "Beli",
    payNow: "Bayar sekarang",
    paymentMethod: "Kaedah bayaran",
    privateChat: "Sembang peribadi",
    campusChats: "Sembang kampus",
    send: "Hantar",
    qaTitle: "Soal jawab UTM",
    askQuestion: "Tanya soalan",
    postQuestion: "Hantar soalan",
    answer: "Jawab",
    helpful: "Berguna",
    papersTitle: "Kertas lepas",
    busScheduleTitle: "Jadual bas UTM",
    uploadPaper: "Muat naik kertas",
    submitReview: "Hantar untuk semakan",
    ownerReview: "Giliran semakan pemilik",
    profileTitle: "Profil",
    saveProfile: "Simpan profil",
    settingsTitle: "Tetapan",
    appearance: "Paparan",
    lightMode: "Mod cerah",
    darkMode: "Mod gelap",
    language: "Bahasa",
    privacySafety: "Privasi & keselamatan",
    terms: "Terma & syarat",
    helpCenter: "Pusat bantuan",
    reportBug: "Lapor pepijat",
    deleteAccount: "Padam akaun",
    deleteWarning: "Ini memadam data tempatan pada peranti ini.",
    edit: "Edit",
    delete: "Padam",
    react: "Reaksi",
    save: "Simpan",
    cancel: "Batal",
  },
  ar: {
    searchPlaceholder: "ابحث في قوائم UTM والأماكن والمحادثات والملفات",
    noSearchMatch: "لا توجد نتيجة مطابقة",
    markRead: "تمييز كمقروء",
    notifications: "الإشعارات",
    homeEyebrow: "UTM في مكان واحد",
    homeTitle: "مركز الحرم الجامعي",
    openMarketplace: "افتح السوق",
    requestDriver: "اطلب وسيلة نقل",
    listingsLive: "القوائم النشطة",
    campusPlaces: "أماكن الحرم",
    openRequests: "الطلبات المفتوحة",
    savedFavourites: "المفضلة المحفوظة",
    marketplaceTitle: "سوق UTM",
    createListing: "إنشاء قائمة",
    publishListing: "نشر القائمة",
    addToFavourites: "أضف إلى المفضلة",
    removeFromFavourites: "إزالة من المفضلة",
    buy: "شراء",
    payNow: "ادفع الآن",
    paymentMethod: "طريقة الدفع",
    privateChat: "محادثة خاصة",
    campusChats: "محادثات الحرم",
    send: "إرسال",
    qaTitle: "أسئلة وأجوبة UTM",
    askQuestion: "اطرح سؤالاً",
    postQuestion: "نشر السؤال",
    answer: "إجابة",
    helpful: "مفيد",
    papersTitle: "اختبارات سابقة",
    busScheduleTitle: "جدول حافلات UTM",
    uploadPaper: "رفع ملف",
    submitReview: "إرسال للمراجعة",
    ownerReview: "قائمة مراجعة المالك",
    profileTitle: "الملف الشخصي",
    saveProfile: "حفظ الملف",
    settingsTitle: "الإعدادات",
    appearance: "المظهر",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    language: "اللغة",
    privacySafety: "الخصوصية والسلامة",
    terms: "الشروط والأحكام",
    helpCenter: "مركز المساعدة",
    reportBug: "الإبلاغ عن خطأ",
    deleteAccount: "حذف الحساب",
    deleteWarning: "سيؤدي ذلك إلى حذف بياناتك المحلية من هذا الجهاز.",
    edit: "تعديل",
    delete: "حذف",
    react: "تفاعل",
    save: "حفظ",
    cancel: "إلغاء",
  },
  zh: {
    searchPlaceholder: "搜索 UTM 商品、地点、聊天、试卷",
    noSearchMatch: "没有匹配的结果",
    markRead: "标记已读",
    notifications: "通知",
    homeEyebrow: "UTM 一站式服务",
    homeTitle: "校园中心",
    openMarketplace: "打开市场",
    requestDriver: "请求交通",
    listingsLive: "在线商品",
    campusPlaces: "校园地点",
    openRequests: "开放请求",
    savedFavourites: "已收藏",
    marketplaceTitle: "UTM 市场",
    createListing: "创建商品",
    publishListing: "发布商品",
    addToFavourites: "加入收藏",
    removeFromFavourites: "取消收藏",
    buy: "购买",
    payNow: "立即付款",
    paymentMethod: "付款方式",
    privateChat: "私聊",
    campusChats: "校园聊天",
    send: "发送",
    qaTitle: "UTM 问答",
    askQuestion: "提问",
    postQuestion: "发布问题",
    answer: "回答",
    helpful: "有帮助",
    papersTitle: "历年试卷",
    busScheduleTitle: "UTM 巴士时间表",
    uploadPaper: "上传试卷",
    submitReview: "提交审核",
    ownerReview: "管理员审核",
    profileTitle: "个人资料",
    saveProfile: "保存资料",
    settingsTitle: "设置",
    appearance: "外观",
    lightMode: "浅色模式",
    darkMode: "深色模式",
    language: "语言",
    privacySafety: "隐私与安全",
    terms: "条款与条件",
    helpCenter: "帮助中心",
    reportBug: "报告问题",
    deleteAccount: "删除账号",
    deleteWarning: "这会清除本设备上的本地数据。",
    edit: "编辑",
    delete: "删除",
    react: "反应",
    save: "保存",
    cancel: "取消",
  },
};

const seedNotifications: NotificationItem[] = [];

const demoDataIds = {
  marketplace: new Set(["mkt-1", "mkt-2", "mkt-3", "mkt-4", "mkt-5", "mkt-6"]),
  messages: new Set(["msg-1", "msg-2", "msg-3", "msg-4"]),
  questions: new Set(["q-1", "q-2"]),
  papers: new Set(["paper-1", "paper-2"]),
  requests: new Set(["req-1", "req-2", "req-3"]),
  notifications: new Set(["notif-1", "notif-2"]),
  reviews: new Set(["review-1", "review-2"]),
};

const demoProfileMatricNumbers = new Set([
  "A23CS0123",
  "A22CS0456",
  "A23BE0101",
  "A21EE0299",
  "A23CS0777",
]);

const demoNames = new Set([
  "Aina",
  "Aina Rahman",
  "Aqil",
  "Amir",
  "Daniel",
  "Dapur Kolej",
  "Farah",
  "Hafiz",
  "Hasan Ahmad",
  "Jia",
  "Kumar",
  "Mei Lin",
  "Nabil",
  "Nora",
  "Sara",
  "Yusuf",
]);

const languageNames: Record<LanguageCode, string> = {
  en: "English",
  ms: "Malay",
  ar: "Arabic",
  zh: "Chinese",
};

const localizedNavLabels: Record<LanguageCode, Partial<Record<ModuleKey, string>>> = {
  en: {},
  ms: {
    home: "Laman",
    marketplace: "Pasaran",
    map: "Peta Kampus",
    community: "Sembang",
    qa: "Soal Jawab",
    papers: "Kertas Lepas",
    requests: "Pengangkutan",
    bus: "Jadual Bas",
    profile: "Profil",
    settings: "Tetapan",
  },
  ar: {
    home: "الرئيسية",
    marketplace: "السوق",
    map: "خريطة الحرم",
    community: "المحادثات",
    qa: "أسئلة",
    papers: "نماذج سابقة",
    requests: "النقل",
    bus: "جدول الحافلات",
    profile: "الملف",
    settings: "الإعدادات",
  },
  zh: {
    home: "首页",
    marketplace: "市场",
    map: "校园地图",
    community: "聊天",
    qa: "问答",
    papers: "历年试卷",
    requests: "交通",
    bus: "巴士时间表",
    profile: "个人资料",
    settings: "设置",
  },
};

function toDateTimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

const dayOfWeekOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function currentDayName(date = new Date()) {
  return new Intl.DateTimeFormat("en-MY", { weekday: "long" }).format(date);
}

function currentTimeValue(date = new Date()) {
  return date.toTimeString().slice(0, 5);
}

function dayIndex(day: string) {
  return dayOfWeekOptions.indexOf(day);
}

function availableTransportDays(date = new Date()) {
  const today = currentDayName(date);
  const start = Math.max(0, dayIndex(today));
  return dayOfWeekOptions.slice(start);
}

function compareTimeValues(left: string, right: string) {
  return left.localeCompare(right);
}

function toTwelveHourTime(time: string) {
  const [hourPart, minute = "00"] = time.split(":");
  const hour = Number(hourPart);
  if (!Number.isFinite(hour)) {
    return time;
  }
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${minute.padStart(2, "0")} ${suffix}`;
}

const initialListing = {
  title: "",
  category: "Books",
  price: "Free",
  seller: appUser.name,
  location: "PSZ Library",
  fulfillment: "Pickup" as MarketplaceItem["fulfillment"],
  condition: "Good" as MarketplaceItem["condition"],
  paymentPreference: "DuitNow QR" as PaymentMethod,
  description: "",
  tags: "",
};

const initialQuestion = {
  title: "",
  body: "",
  tags: "",
};

const initialPaper = {
  code: "",
  title: "",
  faculty: "Faculty of Computing",
  year: "2026",
  semester: "Semester 2",
  type: "Test 1",
};

const initialRequest = {
  type: "Ride" as ServiceRequest["type"],
  title: "",
  pickup: "Kolej 9 and Kolej 10",
  dropoff: "Paradigm Mall Johor Bahru",
  pickupLat: null as number | null,
  pickupLng: null as number | null,
  pickupMapUrl: "",
  dropoffLat: null as number | null,
  dropoffLng: null as number | null,
  dropoffMapUrl: "",
  scheduleDay: currentDayName(),
  scheduleTime: currentTimeValue(),
  schedule: "",
  budget: "",
  paymentPreference: "DuitNow QR" as PaymentMethod,
  notes: "",
};

type SearchResult = {
  id: string;
  module: ModuleKey;
  title: string;
  detail: string;
  action: () => void;
};

const currency = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});

const dateTime = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "medium",
  timeStyle: "short",
});

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function formatMoney(amount: number) {
  return currency.format(amount);
}

function formatListingPrice(amount: number) {
  if (amount <= 0) {
    return "Free";
  }
  const value = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${value} RM`;
}

function parsePriceInput(value: string) {
  if (!value.trim() || value.trim().toLowerCase() === "free") {
    return 0;
  }
  return Number(value.replace(/[^\d.]/g, "")) || 0;
}

function formatDate(value: string) {
  return dateTime.format(new Date(value));
}

function formatSchedule(value: string) {
  const dayTime = value.match(
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) at (\d{2}:\d{2})$/,
  );
  if (dayTime) {
    return `${dayTime[1]} at ${toTwelveHourTime(dayTime[2])}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateTime.format(date);
}

function formatTransportSchedule(day: string, time: string) {
  if (!time) {
    return `${day} at ASAP`;
  }
  return `${day} at ${time}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function compactTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function canonicalFacultyName(value: string) {
  return facultyAliases[value] ?? value;
}

function formatRequestBudget(amount: number, type: ServiceRequest["type"]) {
  if (amount > 0) {
    return formatMoney(amount);
  }
  return type === "Delivery" ? "Free delivery" : "Ride along for free";
}

function parseBudgetInput(value: string) {
  if (!value.trim()) {
    return 0;
  }
  return Math.min(99, Number(value.replace(/\D/g, "")) || 0);
}

function budgetInputLabel(type: ServiceRequest["type"]) {
  return type === "Delivery" ? "Free delivery" : "Ride along for free";
}

function sanitizeBudgetInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  return String(Math.min(99, Number(digits)));
}

function isDigitalPayment(method?: PaymentMethod) {
  return method !== "Cash";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

async function imageToShareFile(imageUrl: string, fileName: string) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) {
      return null;
    }
    return new File([blob], fileName, { type: blob.type || "image/png" });
  } catch {
    return null;
  }
}

function listingShareUrl(itemId: string) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("listing", itemId);
  return url.toString();
}

function listingShareText(item: MarketplaceItem) {
  return [
    `EverythingUTM Marketplace`,
    `${item.title}`,
    `${formatListingPrice(item.price)} · ${item.condition} · ${item.fulfillment ?? "Pickup"}`,
    item.sold ? "Status: Sold" : "Status: Available",
    `Pickup/area: ${item.location}`,
    `Seller: ${item.seller}`,
    item.description,
    `Open in app: ${listingShareUrl(item.id)}`,
  ].join("\n");
}

function googleMapsUrlFor(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query.trim() || "Universiti Teknologi Malaysia Skudai Johor Bahru",
  )}`;
}

const busStopTimeOverrides: Record<string, Record<string, string[]>> = {
  "regular-1": {
    kp: ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "12:00", "12:40", "13:20", "14:00", "14:40", "16:50", "17:30", "18:10", "19:45", "20:15"],
    cp: ["07:45", "08:15", "08:45", "09:15", "09:45", "10:15", "12:20", "13:00", "13:40", "14:20", "15:00", "16:30", "17:10", "17:50", "20:00", "22:00", "23:00"],
  },
  "regular-2": {
    kp: ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "11:35", "12:15", "12:55", "13:35", "14:15", "16:20", "17:00", "17:40"],
    cluster: ["07:15", "07:45", "08:15", "08:45", "09:15", "09:45", "11:15", "11:55", "12:35", "13:15", "13:55", "14:35", "16:00", "16:40", "17:20", "18:00"],
  },
  "regular-3": {
    kp: ["07:10", "07:40", "08:10", "08:40", "09:10", "09:40", "11:45", "12:25", "13:05", "13:45", "14:25", "16:30", "17:10", "17:50"],
    cluster: ["07:25", "07:55", "08:25", "08:55", "09:25", "09:55", "11:25", "12:05", "12:45", "13:25", "14:05", "14:45", "16:10", "16:50", "17:30", "18:10"],
  },
  "regular-4": {
    kp: ["07:20", "07:50", "08:20", "08:50", "09:20", "09:50", "12:00", "12:40", "13:20", "14:00", "14:40", "16:45", "17:25", "18:05"],
    cluster: ["07:35", "08:05", "08:35", "09:05", "09:35", "10:05", "11:40", "12:20", "13:00", "13:40", "14:20", "15:00", "16:25", "17:05", "17:45", "18:25"],
  },
  "regular-5": {
    k910: ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "11:35", "12:15", "12:55", "13:35", "14:15", "16:20", "17:00", "17:40", "18:20"],
    cp: ["07:15", "07:45", "08:15", "08:45", "09:15", "09:45", "11:15", "11:55", "12:35", "13:15", "13:55", "14:35", "16:00", "16:40", "17:20", "18:00", "18:40"],
  },
  "regular-6": {
    k910: ["07:10", "07:40", "08:10", "08:40", "09:10", "09:40", "11:45", "12:25", "13:05", "13:45", "14:25", "16:30", "17:10", "17:50", "19:45", "20:15"],
    cp: ["07:25", "07:55", "08:25", "08:55", "09:25", "09:55", "11:25", "12:05", "12:45", "13:25", "14:05", "14:45", "16:10", "16:50", "17:30", "20:00", "22:00", "23:00"],
  },
  "regular-7": {
    k910: ["07:20", "07:50", "08:20", "08:50", "09:20", "09:50", "12:00", "12:40", "13:20", "14:00", "14:40", "16:45", "17:25", "18:05", "18:40"],
    cp: ["07:35", "08:05", "08:35", "09:05", "09:35", "10:05", "11:40", "12:20", "13:00", "13:40", "14:20", "15:00", "16:25", "17:05", "17:45", "18:25", "19:00"],
  },
  "regular-8": {
    cp: ["07:15", "07:45", "08:15", "08:45", "09:15", "09:45", "11:45", "12:15", "12:45", "13:45", "14:15", "16:15", "16:45", "17:15", "17:45"],
    fkt: ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "11:30", "12:00", "12:30", "13:00", "14:00", "14:30", "16:00", "16:30", "17:00", "17:30", "18:00"],
  },
  "regular-9": {
    kdoj: ["07:00", "08:00", "09:00", "11:00", "12:00", "13:00", "14:00", "16:30", "17:30"],
    cluster: ["07:30", "08:30", "09:30", "11:30", "12:30", "13:30", "14:30", "16:00", "17:00", "18:00"],
  },
  "regular-10": {
    kdoj: ["07:15", "08:15", "09:15", "11:15", "12:15", "13:15", "14:15", "16:45", "17:45"],
    cluster: ["07:45", "08:45", "09:45", "11:45", "12:45", "13:45", "14:45", "16:15", "17:15", "18:15"],
  },
  "regular-11": {
    kdoj: ["07:30", "08:30", "09:30", "11:30", "12:30", "13:30", "14:30", "17:00", "18:00"],
    cluster: ["08:00", "09:00", "10:00", "12:00", "13:00", "14:00", "15:00", "16:30", "17:30", "18:30"],
  },
  "regular-12": {
    kdoj: ["07:45", "08:45", "09:45", "11:45", "12:45", "13:45", "14:45", "17:15", "18:15"],
    cluster: ["08:15", "09:15", "10:15", "12:15", "13:15", "14:15", "15:15", "16:45", "17:45", "18:45"],
  },
  "regular-13": {
    kdoj: ["07:00", "08:00", "10:00", "11:00", "15:15", "16:15", "17:30"],
    cluster: ["07:30", "08:30", "10:30", "11:30", "15:45", "17:00", "18:00"],
  },
  "regular-14": {
    kdoj: ["07:00", "08:00", "10:30", "15:00", "16:00", "17:30", "19:45", "20:15"],
    cluster: ["07:30", "08:30", "10:00", "11:00", "15:30", "17:00", "18:00"],
    cp: ["20:00", "22:00", "23:00"],
  },
  "regular-15": {
    ktr: ["07:05", "07:35", "08:05", "08:35", "09:05", "09:35", "11:35", "12:15", "12:55", "13:35", "14:15", "16:25", "17:05", "17:45", "18:25"],
    fke: ["07:20", "07:50", "08:20", "08:50", "09:20", "09:50", "11:15", "11:55", "12:35", "13:15", "13:55", "14:35", "16:05", "16:45", "17:25", "18:05", "18:45"],
  },
  "regular-16": {
    ktr: ["07:15", "07:45", "08:15", "08:45", "09:15", "09:45", "11:45", "12:25", "13:05", "13:45", "14:25", "16:35", "17:15", "17:55", "19:45", "20:15"],
    fke: ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "11:25", "12:05", "12:45", "13:25", "14:05", "14:45", "16:15", "16:55", "17:35", "20:00", "22:00", "23:00"],
  },
  "regular-17": {
    ktr: ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "11:40", "12:20", "13:00", "13:40", "14:20", "16:20", "17:00", "17:40", "18:20"],
    fkt: ["07:15", "07:45", "08:15", "08:45", "09:15", "09:45", "11:20", "12:00", "12:40", "13:20", "14:00", "14:40", "16:00", "16:40", "17:20", "18:00", "18:40"],
  },
  "regular-18": {
    ktr: ["07:15", "07:45", "08:15", "08:45", "09:15", "09:45", "11:50", "12:30", "13:10", "13:50", "14:30", "16:30", "17:10", "17:50", "18:30"],
    fkt: ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "11:30", "12:10", "12:50", "13:30", "14:10", "14:50", "16:10", "16:50", "17:30", "18:10", "18:50"],
  },
  "regular-19": {
    cp: ["07:15", "07:45", "08:15", "08:45", "09:15", "09:45", "11:20", "12:00", "12:40", "13:20", "14:00", "16:00", "16:40", "17:20", "18:00"],
    v01: ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "11:40", "12:20", "13:00", "13:40", "14:20", "16:20", "17:00", "17:40", "18:20"],
  },
  "regular-20": {
    cp: ["14:30", "15:00", "16:30", "17:00", "17:30", "18:15", "18:45"],
    stadium: ["14:45", "15:15", "16:45", "17:15", "18:00", "18:30", "19:00"],
  },
  "regular-21": {
    kdoj: ["07:30", "09:00", "11:00", "13:00", "15:00", "17:00"],
    k910: ["08:00", "09:30", "11:30", "13:30", "15:30", "17:30"],
  },
  "regular-22": {
    kdoj: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
    k910: ["08:30", "10:30", "12:30", "14:30", "16:30", "18:30"],
  },
  "bdr-1": {
    kp: ["07:00", "08:00", "09:00", "12:00", "13:00", "14:00", "17:00", "18:00"],
    cp: ["07:30", "08:30", "09:30", "12:30", "13:30", "14:30", "17:30", "18:30"],
  },
  "bdr-2": {
    kp: ["07:00", "08:00", "09:00", "12:00", "13:00", "14:00", "17:00", "18:00"],
    cluster: ["07:30", "08:30", "09:30", "12:30", "13:30", "14:30", "17:30", "18:00"],
  },
  "bdr-3": {
    k910: ["07:00", "08:00", "09:00", "12:00", "13:00", "14:00", "17:00", "18:00"],
    cp: ["07:30", "08:30", "09:30", "12:30", "13:30", "14:30", "17:30", "18:30"],
  },
  "bdr-4": {
    cp: ["07:00", "08:00", "09:00", "12:00", "13:00", "14:00", "17:00", "18:00"],
    fkt: ["07:30", "08:30", "09:30", "12:30", "13:30", "14:30", "17:30", "18:30"],
  },
  "bdr-5": {
    kdoj: ["07:00", "08:00", "09:00", "11:45", "12:45", "13:45", "16:45", "17:45"],
    cluster: ["07:30", "08:30", "09:30", "12:15", "13:15", "14:15", "17:15", "18:15"],
  },
  "bdr-6": {
    kdoj: ["07:15", "08:15", "09:15", "12:00", "13:00", "14:00", "17:00", "18:00"],
    cluster: ["07:45", "08:45", "09:45", "12:30", "13:30", "14:30", "17:30", "18:30"],
  },
  "bdr-7": {
    kdoj: ["07:30", "08:30", "09:30", "12:15", "13:15", "14:15", "17:15", "18:15"],
    cluster: ["08:00", "09:00", "10:00", "12:45", "13:45", "14:45", "17:45", "18:45"],
  },
  "bdr-8": {
    ktr: ["07:00", "08:00", "09:00", "12:00", "13:00", "14:00", "17:00", "18:00"],
    fke: ["07:30", "08:30", "09:30", "12:30", "13:30", "14:30", "17:30", "18:30"],
  },
  "bdr-9": {
    ktr: ["07:00", "08:00", "09:00", "12:00", "13:00", "14:00", "17:00", "18:00"],
    fkt: ["07:30", "08:30", "09:30", "12:30", "13:30", "14:30", "17:30", "18:30"],
  },
  "bdr-10": {
    cp: ["07:30", "08:30", "11:30", "12:30", "13:30", "16:30", "17:30"],
    v01: ["08:00", "09:00", "12:00", "13:00", "14:00", "17:00", "18:00"],
  },
};

function normalizeBusStop(stop: string) {
  const normalized = stop
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/centre/g, "center")
    .replace(/point/g, "point")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (
    normalized.includes("center point") ||
    normalized.includes("centerpoint") ||
    normalized === "cp"
  ) {
    return "cp";
  }
  if (normalized.includes("kolej perdana") || normalized === "kp") return "kp";
  if (normalized.includes("kolej 9") || normalized.includes("k9 10")) return "k910";
  if (normalized.includes("cluster") || normalized.includes("t02") || normalized.includes("t08")) return "cluster";
  if (normalized.includes("kdoj")) return "kdoj";
  if (normalized.includes("ktr")) return "ktr";
  if (normalized.includes("fkt") || normalized.includes("n29")) return "fkt";
  if (normalized.includes("fke") || normalized.includes("p19")) return "fke";
  if (normalized.includes("v01")) return "v01";
  if (normalized.includes("stadium")) return "stadium";
  return normalized;
}

function uniqueBusStops(route: { directions: string[] }) {
  const seen = new Set<string>();
  return route.directions.filter((stop) => {
    const key = normalizeBusStop(stop);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(
    wrapped % 60,
  ).padStart(2, "0")}`;
}

function inferredStopOffset(route: { directions: string[] }, stop?: string) {
  if (!stop) {
    return 0;
  }
  const stops = uniqueBusStops(route);
  const selectedIndex = stops.findIndex(
    (entry) => normalizeBusStop(entry) === normalizeBusStop(stop),
  );
  return Math.max(0, selectedIndex) * 8;
}

function isFridayBreakTime(time: string) {
  return time >= "12:40" && time < "14:00";
}

function busTimesForRoute(
  route: { id?: string; code: string; documentId: string; directions?: string[] },
  stop?: string,
  now = new Date(),
) {
  const stopKey = stop ? normalizeBusStop(stop) : "";
  const exactTimes = route.id ? busStopTimeOverrides[route.id]?.[stopKey] : undefined;
  const baseTimes = (() => {
    if (exactTimes) {
      return exactTimes;
    }
    if (route.documentId === "bdr-tuesday-thursday-2026") {
      return bdrBusTimes;
    }
    if (route.code.includes("Weekend")) {
      return weekendBusTimes;
    }
    return regularBusTimes;
  })();
  const times = exactTimes
    ? baseTimes
    : baseTimes.map((time) =>
        addMinutesToTime(time, inferredStopOffset({ directions: route.directions ?? [] }, stop)),
      );
  const day = currentDayName(now);
  const dayScopedTimes =
    route.id === "regular-20" && day !== "Tuesday"
      ? times.filter((time) => !["14:30", "14:45", "15:00", "15:15"].includes(time))
      : times;
  if (
    route.documentId === "regular-2025-2026" &&
    day === "Friday"
  ) {
    return dayScopedTimes.filter((time) => !isFridayBreakTime(time));
  }
  return dayScopedTimes;
}

function busRunsOnDay(
  route: { code: string; documentId: string; id?: string },
  date: Date,
) {
  const day = currentDayName(date);
  if (route.id === "regular-20") {
    return day !== "Saturday" && day !== "Sunday";
  }
  if (route.documentId === "bdr-tuesday-thursday-2026") {
    return day === "Tuesday" || day === "Thursday";
  }
  if (route.code.includes("Weekend")) {
    return day === "Saturday" || day === "Sunday";
  }
  return day !== "Saturday" && day !== "Sunday";
}

function minutesUntilTime(time: string, now = new Date()) {
  const [hours, minutes] = time.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 60_000);
}

function busAvailability(
  route: { id?: string; code: string; documentId: string; directions?: string[] },
  stop?: string,
  now = new Date(),
) {
  const stopLabel = stop ? `${stop}: ` : "";
  if (!busRunsOnDay(route, now)) {
    return {
      label: `${stopLabel}No bus today`,
      minutes: null as number | null,
      isSoon: false,
    };
  }
  const nextMinutes =
    busTimesForRoute(route, stop, now)
      .map((time) => minutesUntilTime(time, now))
      .find((minutes) => minutes >= 0) ?? null;
  if (nextMinutes === null) {
    return { label: `${stopLabel}No more buses today`, minutes: null, isSoon: false };
  }
  if (nextMinutes === 0) {
    return { label: `${stopLabel}Next bus now`, minutes: 0, isSoon: true };
  }
  if (nextMinutes < 60) {
    return {
      label: `${stopLabel}Next bus in ${nextMinutes} min`,
      minutes: nextMinutes,
      isSoon: true,
    };
  }
  const hours = Math.floor(nextMinutes / 60);
  const minutes = nextMinutes % 60;
  return {
    label: `${stopLabel}Next bus in ${hours}h${minutes ? ` ${minutes}m` : ""}`,
    minutes: nextMinutes,
    isSoon: false,
  };
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    );
    if (!response.ok) {
      return "";
    }
    const data = (await response.json()) as {
      name?: string;
      display_name?: string;
      address?: Record<string, string>;
    };
    return (
      data.name ||
      data.address?.amenity ||
      data.address?.building ||
      data.address?.road ||
      data.display_name ||
      ""
    );
  } catch {
    return "";
  }
}

function requestSuggestion(type: ServiceRequest["type"]) {
  return type === "Ride"
    ? {
        title: "Ride to Paradigm Mall",
        pickup: "Kolej 9 and Kolej 10",
        dropoff: "Paradigm Mall Johor Bahru",
        notes: "Passenger count, pickup point, luggage, and preferred route",
      }
    : {
        title: "Delivery from PSZ",
        pickup: "Perpustakaan Sultanah Zanariah",
        dropoff: "Kolej Tun Dr Ismail",
        notes: "Item size, counter details, recipient contact, and drop-off notes",
      };
}

function normalizeBudgetForType(
  value: string,
  type: ServiceRequest["type"],
) {
  return sanitizeBudgetInput(value);
}

async function translateToEnglish(text: string) {
  if (!text.trim()) {
    return "";
  }
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(
      text,
    )}`,
  );
  if (!response.ok) {
    throw new Error("Translation failed");
  }
  const data = (await response.json()) as Array<Array<Array<string>>>;
  return data[0]?.map((part) => part[0]).join("") || text;
}

const developerSupportUrl =
  import.meta.env.VITE_BUY_ME_COFFEE_URL ||
  "https://www.buymeacoffee.com/blazinsan";
const ownerEmail = String(
  import.meta.env.VITE_OWNER_EMAIL || "hammau05@gmail.com",
).toLowerCase();
const ownerMatricNumber = String(import.meta.env.VITE_OWNER_MATRIC_NUMBER || "");

function emptyProfile(overrides: Partial<Profile> = {}): Profile {
  return { ...appUser, ...overrides };
}

function profileStorageKey(userId: string) {
  return `everything-utm:user-profile:${userId}`;
}

function isDemoName(value?: string) {
  return Boolean(value && demoNames.has(value.trim()));
}

function isDemoProfile(value: Partial<Profile>) {
  return (
    isDemoName(value.name) ||
    Boolean(value.matricNumber && demoProfileMatricNumbers.has(value.matricNumber))
  );
}

function hasAnyText(value: unknown, snippets: string[]) {
  const haystack = JSON.stringify(value ?? "").toLowerCase();
  return snippets.some((snippet) => haystack.includes(snippet.toLowerCase()));
}

function sameStoredState(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function itemId(value: unknown) {
  return typeof value === "object" && value !== null && "id" in value
    ? String((value as { id?: unknown }).id ?? "")
    : "";
}

function sanitizeStoredState<T>(key: string, value: T): T {
  if (key === "everything-utm:profile") {
    return isDemoProfile(value as Partial<Profile>)
      ? (emptyProfile() as T)
      : value;
  }
  if (!Array.isArray(value)) {
    return value;
  }
  if (key === "everything-utm:marketplace") {
    return value.filter(
      (item: MarketplaceItem) =>
        !demoDataIds.marketplace.has(item.id) &&
        !isDemoName(item.seller) &&
        !hasAnyText(item, [
          "Calculus textbook bundle",
          "Mini fridge for hostel",
          "Arduino starter kit",
          "Foldable bicycle",
          "Meal prep nasi ayam set",
        ]),
    ) as T;
  }
  if (key === "everything-utm:messages") {
    return value.filter(
      (message: ChatMessage) =>
        !demoDataIds.messages.has(message.id) &&
        !isDemoName(message.author) &&
        !hasAnyText(message, [
          "Anyone going to DSI tonight",
          "Found a black bottle near PSZ",
          "SECI2143 group wants one more member",
          "Arked Cengal ayam penyet queue",
        ]),
    ) as T;
  }
  if (key === "everything-utm:questions") {
    return value.filter(
      (question: Question) =>
        !demoDataIds.questions.has(question.id) &&
        !isDemoName(question.author) &&
        !hasAnyText(question, [
          "Best quiet study spots after 8 PM",
          "How early should I book a driver to Senai Airport",
        ]),
    ) as T;
  }
  if (key === "everything-utm:papers") {
    return value.filter(
      (paper: PastPaper) =>
        !demoDataIds.papers.has(paper.id) &&
        !isDemoName(paper.uploader) &&
        !hasAnyText(paper, [
          "SECJ1013-final-2025",
          "SECI2143-midterm-2024",
          "Thermodynamics Past Year Questions",
        ]),
    ) as T;
  }
  if (key === "everything-utm:requests") {
    return value.filter(
      (request: ServiceRequest) =>
        !demoDataIds.requests.has(request.id) &&
        !isDemoName(request.requester) &&
        !isDemoName(request.driver) &&
        !hasAnyText(request, [
          "Ride to Paradigm Mall",
          "Collect printing from PSZ",
          "Two passengers with one small bag",
          "Paid printout at counter",
        ]),
    ) as T;
  }
  if (key === "everything-utm:notifications") {
    return value.filter(
      (notification: NotificationItem) =>
        !demoDataIds.notifications.has(notification.id),
    ) as T;
  }
  if (key === "everything-utm:profile-reviews") {
    return value.filter(
      (review: ProfileReview) =>
        !demoDataIds.reviews.has(review.id) &&
        !isDemoName(review.profileName) &&
        !isDemoName(review.reviewer),
    ) as T;
  }
  return value;
}

function mergeOnlineAndLocalState<T>(key: string, onlineValue: T, localValue: T) {
  const online = sanitizeStoredState(key, onlineValue);
  const local = sanitizeStoredState(key, localValue);
  if (Array.isArray(online) && Array.isArray(local)) {
    const merged = new Map<string, unknown>();
    online.forEach((item) => {
      const id = itemId(item);
      if (id) {
        merged.set(id, item);
      }
    });
    local.forEach((item) => {
      const id = itemId(item);
      if (id && !merged.has(id)) {
        merged.set(id, item);
      }
    });
    return Array.from(merged.values()) as T;
  }
  return online ?? local;
}

function questionEngagementScore(question: Question) {
  return (
    question.votes +
    question.answers.reduce(
      (total, answer) =>
        total + Math.max(answer.helpful, answer.helpfulBy?.length ?? 0),
      0,
    )
  );
}

function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  options: { syncOnline?: boolean; reloadKey?: unknown; pollMs?: number } = {},
) {
  const syncOnline = options.syncOnline ?? false;
  const [supabaseLoaded, setSupabaseLoaded] = useState(
    !syncOnline || !isSupabaseConfigured,
  );
  const [state, setState] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? sanitizeStoredState(key, JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!syncOnline || !isSupabaseConfigured) {
      setSupabaseLoaded(true);
      return;
    }

    let cancelled = false;
    setSupabaseLoaded(false);
    loadSupabaseState<T>(key)
      .then((stored) => {
        if (cancelled) {
          return;
        }
        const localState = sanitizeStoredState(key, stateRef.current);
        if (stored !== null) {
          const onlineState = sanitizeStoredState(key, stored);
          const mergedState = mergeOnlineAndLocalState(
            key,
            onlineState,
            localState,
          );
          setState(mergedState);
          if (!sameStoredState(mergedState, onlineState)) {
            saveSupabaseState(key, mergedState).catch(() => undefined);
          }
        } else {
          saveSupabaseState(key, localState).catch(() => undefined);
        }
        setSupabaseLoaded(true);
      })
      .catch(() => setSupabaseLoaded(true));

    return () => {
      cancelled = true;
    };
  }, [key, options.reloadKey, syncOnline]);

  useEffect(() => {
    if (!syncOnline || !isSupabaseConfigured || !supabaseLoaded) {
      return;
    }

    let cancelled = false;
    const refreshOnlineState = async () => {
      const stored = await loadSupabaseState<T>(key).catch(() => null);
      if (cancelled || stored === null) {
        return;
      }
      setState((current) =>
        mergeOnlineAndLocalState(key, stored, sanitizeStoredState(key, current)),
      );
    };

    window.addEventListener("focus", refreshOnlineState);
    const timer = window.setInterval(
      refreshOnlineState,
      options.pollMs ?? 30_000,
    );
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshOnlineState);
      window.clearInterval(timer);
    };
  }, [key, options.pollMs, options.reloadKey, supabaseLoaded, syncOnline]);

  useEffect(() => {
    const cleanState = sanitizeStoredState(key, state);
    try {
      window.localStorage.setItem(key, JSON.stringify(cleanState));
    } catch {
      // Local storage can fail in private windows or if file uploads are very large.
    }

    if (syncOnline && supabaseLoaded) {
      saveSupabaseState(key, cleanState).catch(() => {
        // Keep the app usable offline or before Supabase policies are configured.
      });
    }
  }, [key, state, supabaseLoaded, syncOnline]);

  return [state, setState] as const;
}

function campusMarkerIcon(category: string, selected: boolean) {
  const colors: Record<string, string> = {
    Gate: "#9d2235",
    Academic: "#2364aa",
    "Student life": "#00856f",
    Food: "#b7791f",
    Residential: "#6d5dfc",
    Sports: "#cc4b37",
    Services: "#425466",
  };
  const label = category
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return L.divIcon({
    className: "campus-marker-shell",
    html: `<span class="campus-marker ${selected ? "is-selected" : ""}" style="--pin-color:${colors[category] ?? "#9d2235"}">${label}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -18],
  });
}

function MapFocus({ location }: { location: CampusLocation }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([location.lat, location.lng], 16, { duration: 0.7 });
  }, [location, map]);

  return null;
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Search;
  title: string;
  body: string;
}) {
  return (
    <div className="empty-state">
      <Icon size={28} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function PersonAvatar({
  name,
  image,
  size = 36,
}: {
  name: string;
  image?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="person-avatar" style={{ width: size, height: size }}>
      {image ? <img src={image} alt="" /> : <span>{initials || "UT"}</span>}
    </span>
  );
}

export default function App() {
  const [activeModule, setActiveModuleState] = useState<ModuleKey>("home");
  const [pageDirection, setPageDirection] = useState<"forward" | "back">(
    "forward",
  );
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [guestMode, setGuestMode] = useLocalStorageState(
    "everything-utm:guest-mode",
    false,
  );
  const [localIdentity] = useLocalStorageState(
    "everything-utm:local-identity",
    uid("local"),
  );
  const onlineReloadKey = authSession?.user.id ?? "public";
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    name: "",
    sex: "Prefer not to say",
  });
  const [resetEmailSentAt, setResetEmailSentAt] = useState(0);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useLocalStorageState<Profile>(
    "everything-utm:profile",
    appUser,
  );
  const [settings, setSettings] = useLocalStorageState<AppSettings>(
    "everything-utm:settings",
    defaultSettings,
  );
  const [notifications, setNotifications] = useLocalStorageState<
    NotificationItem[]
  >("everything-utm:notifications", seedNotifications);
  const [profileReviews, setProfileReviews] = useLocalStorageState<
    ProfileReview[]
  >("everything-utm:profile-reviews", [], {
    reloadKey: onlineReloadKey,
    syncOnline: true,
  });
  const [marketplace, setMarketplace] = useLocalStorageState<MarketplaceItem[]>(
    "everything-utm:marketplace",
    [],
    { reloadKey: onlineReloadKey, syncOnline: true },
  );
  const [favourites, setFavourites] = useLocalStorageState<string[]>(
    "everything-utm:favourites",
    [],
  );
  const [messages, setMessages] = useLocalStorageState<ChatMessage[]>(
    "everything-utm:messages",
    [],
    { reloadKey: onlineReloadKey, syncOnline: true },
  );
  const [questions, setQuestions] = useLocalStorageState<Question[]>(
    "everything-utm:questions",
    [],
    { reloadKey: onlineReloadKey, syncOnline: true },
  );
  const [papers, setPapers] = useLocalStorageState<PastPaper[]>(
    "everything-utm:papers",
    [],
    { reloadKey: onlineReloadKey, syncOnline: true },
  );
  const [requests, setRequests] = useLocalStorageState<ServiceRequest[]>(
    "everything-utm:requests",
    [],
    { reloadKey: onlineReloadKey, syncOnline: true },
  );

  const [marketCategory, setMarketCategory] = useState("All");
  const [marketSort, setMarketSort] =
    useState<(typeof marketplaceSortOptions)[number]>("Date posted");
  const [listingDraft, setListingDraft] = useState(initialListing);
  const [listingImages, setListingImages] = useState<string[]>([]);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [listingEditDraft, setListingEditDraft] = useState(initialListing);
  const [listingEditImages, setListingEditImages] = useState<string[]>([]);
  const [mapCategory, setMapCategory] = useState("All");
  const [selectedLocationId, setSelectedLocationId] = useState(
    campusLocations[0].id,
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeChannel, setActiveChannel] = useState(chatChannels[0]);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageImage, setMessageImage] = useState("");
  const [messageVoice, setMessageVoice] = useState("");
  const [messageVoiceDuration, setMessageVoiceDuration] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [questionDraft, setQuestionDraft] = useState(initialQuestion);
  const [questionSort, setQuestionSort] =
    useState<(typeof questionSortOptions)[number]>("Date posted");
  const [questionImage, setQuestionImage] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [paperDraft, setPaperDraft] = useState(initialPaper);
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [paperFaculty, setPaperFaculty] = useState("All");
  const [requestDraft, setRequestDraft] = useState(initialRequest);
  const [pickupMapLocationId, setPickupMapLocationId] = useState("");
  const [dropoffMapLocationId, setDropoffMapLocationId] = useState("");
  const [requestPlaceFilter, setRequestPlaceFilter] = useState("All");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [imageViewerListingId, setImageViewerListingId] = useState<string | null>(
    null,
  );
  const [viewerImageIndex, setViewerImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [messageActionId, setMessageActionId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [messageEditDraft, setMessageEditDraft] = useState("");
  const [questionActionId, setQuestionActionId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionEditDraft, setQuestionEditDraft] = useState(initialQuestion);
  const [answerActionId, setAnswerActionId] = useState<string | null>(null);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [translatedItems, setTranslatedItems] = useState<Record<string, string>>({});
  const [selectedBusDocumentId, setSelectedBusDocumentId] = useState(
    busScheduleDocuments[0].id,
  );
  const [selectedBusRouteId, setSelectedBusRouteId] = useState(
    busScheduleRoutes[0].id,
  );
  const [selectedBusStop, setSelectedBusStop] = useState(
    uniqueBusStops(busScheduleRoutes[0])[0] ?? "",
  );
  const [busSearch, setBusSearch] = useState("");
  const [profileDraft, setProfileDraft] = useState<Profile>({
    ...appUser,
    ...profile,
  });
  const [selectedProfileName, setSelectedProfileName] = useState(profile.name);
  const [reviewDraft, setReviewDraft] = useState({ rating: "5", body: "" });
  const [deleteAccountArmed, setDeleteAccountArmed] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [bugReportDraft, setBugReportDraft] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const longPressTimers = useRef<Record<string, number>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);
  const lastProfileSetupUserIdRef = useRef<string | null>(null);

  const profileData: Profile = { ...appUser, ...profile };
  const currentUserId = authSession?.user.id ?? localIdentity;
  const currentDisplayName =
    profileData.name.trim() || "New UTM user";
  const appSettings: AppSettings = {
    ...defaultSettings,
    ...settings,
  };
  const isSignedIn = Boolean(authSession);
  const canUseApp = isSignedIn || !isSupabaseConfigured;
  const t = (key: string) =>
    uiText[appSettings.language]?.[key] ?? uiText.en[key] ?? key;
  const search = normalize(query);
  const unreadCount = notifications.filter((item) => !item.read).length;
  const isOwner = Boolean(
    (ownerEmail && authSession?.user.email?.toLowerCase() === ownerEmail) ||
      (ownerMatricNumber && profileData.matricNumber === ownerMatricNumber),
  );
  const activeModuleIndex = navItems.findIndex((item) => item.key === activeModule);
  const profileDirectory = useMemo(() => {
    const directory = new Map<string, Profile>();
    if (profileData.name.trim()) {
      directory.set(profileData.name, profileData);
    }
    return directory;
  }, [profileData]);
  const getProfile = (name: string) =>
    profileDirectory.get(name) ?? {
      ...appUser,
      name,
      profilePicture: "",
    };
  const isCurrentUserEntity = (entityId?: string, entityName?: string) =>
    Boolean(
      (entityId &&
        (entityId === currentUserId ||
          (!!profileData.matricNumber && entityId === profileData.matricNumber))) ||
        (!entityId &&
          !!entityName &&
          !!profileData.name.trim() &&
          entityName === profileData.name),
    );
  const selectedProfile = getProfile(selectedProfileName || profileData.name);
  const selectedProfileReviews = profileReviews.filter(
    (review) => review.profileName === selectedProfile.name,
  );
  const selectedProfileListings = marketplace.filter(
    (item) => item.seller === selectedProfile.name,
  );
  const selectedProfileQuestions = questions.filter(
    (question) => question.author === selectedProfile.name,
  );
  const viewingOwnProfile =
    !selectedProfileName ||
    (!!selectedProfile.name.trim() &&
      selectedProfile.name === profileData.name) ||
    (!!selectedProfile.matricNumber &&
      selectedProfile.matricNumber === profileData.matricNumber);
  const hasUnsavedProfileChanges = useMemo(
    () => JSON.stringify(profileDraft) !== JSON.stringify(profileData),
    [profileDraft, profileData],
  );
  const shouldGuardProfileDraft =
    activeModule === "profile" && viewingOwnProfile && hasUnsavedProfileChanges;

  function showNotice(message: string, tone: "success" | "error" = "success") {
    setNoticeTone(tone);
    setNotice(message);
  }

  useEffect(() => {
    document.documentElement.dataset.theme = appSettings.theme;
    document.documentElement.lang = appSettings.language;
    document.documentElement.dir =
      appSettings.language === "ar" ? "rtl" : "ltr";
  }, [appSettings.language, appSettings.theme]);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setAuthSession(data.session);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      if (session) {
        setGuestMode(false);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setGuestMode]);

  useEffect(() => {
    if (!supabase || !authSession?.user) {
      return;
    }
    const supabaseClient = supabase;
    let cancelled = false;
    const loadProfile = async () => {
      let storedProfile: Partial<Profile> | null = null;
      const { data, error } = await supabaseClient
        .from("user_profiles")
        .select("profile,name,sex,email")
        .eq("id", authSession.user.id)
        .maybeSingle<{
          profile: Partial<Profile> | null;
          name: string | null;
          sex: string | null;
          email: string | null;
        }>();
      if (!error) {
        storedProfile = data?.profile ?? null;
      }
      if (!storedProfile) {
        storedProfile = await loadSupabaseState<Partial<Profile>>(
          profileStorageKey(authSession.user.id),
        ).catch(() => null);
      }
      if (cancelled) {
        return;
      }
      const nextProfile = isDemoProfile(storedProfile ?? {})
        ? emptyProfile()
        : {
            ...emptyProfile(),
            ...(storedProfile ?? {}),
          };
      setProfile(nextProfile);
      setProfileDraft(nextProfile);
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [authSession, setProfile]);

  useEffect(() => {
    setProfileDraft({ ...appUser, ...profile });
  }, [profile]);

  useEffect(() => {
    const userId = authSession?.user.id ?? null;
    if (!userId) {
      lastProfileSetupUserIdRef.current = null;
      return;
    }
    if (lastProfileSetupUserIdRef.current === userId) {
      return;
    }
    lastProfileSetupUserIdRef.current = userId;
    setSelectedProfileName(profileData.name);
    setProfileDraft({ ...profileData });
    navigateToModule("profile", { skipProfileGuard: true });
  }, [authSession?.user.id]);

  useEffect(() => {
    setProfile((current) =>
      demoProfileMatricNumbers.has(current.matricNumber) ||
      demoNames.has(current.name)
        ? emptyProfile()
        : current,
    );
    setMarketplace((current) =>
      current.filter(
        (item) =>
          !demoDataIds.marketplace.has(item.id) && !demoNames.has(item.seller),
      ),
    );
    setMessages((current) =>
      current.filter(
        (message) =>
          !demoDataIds.messages.has(message.id) && !demoNames.has(message.author),
      ),
    );
    setQuestions((current) =>
      current.filter(
        (question) =>
          !demoDataIds.questions.has(question.id) &&
          !demoNames.has(question.author),
      ),
    );
    setPapers((current) =>
      current.filter(
        (paper) =>
          !demoDataIds.papers.has(paper.id) && !demoNames.has(paper.uploader),
      ),
    );
    setRequests((current) =>
      current.filter(
        (request) =>
          !demoDataIds.requests.has(request.id) &&
          !demoNames.has(request.requester) &&
          !demoNames.has(request.driver ?? ""),
      ),
    );
    setNotifications((current) =>
      current.filter((notification) => !demoDataIds.notifications.has(notification.id)),
    );
    setProfileReviews((current) =>
      current.filter(
        (review) =>
          !demoDataIds.reviews.has(review.id) &&
          !demoNames.has(review.profileName) &&
          !demoNames.has(review.reviewer),
      ),
    );
  }, [
    setMarketplace,
    setMessages,
    setNotifications,
    setPapers,
    setProfile,
    setProfileReviews,
    setQuestions,
    setRequests,
  ]);

  useEffect(() => {
    const listingId = new URLSearchParams(window.location.search).get("listing");
    if (listingId && marketplace.some((item) => item.id === listingId)) {
      setSelectedListingId(listingId);
      navigateToModule("marketplace");
    }
  }, []);

  useEffect(() => {
    setProfile((current) => {
      const faculty = canonicalFacultyName(current.faculty);
      return faculty === current.faculty ? current : { ...current, faculty };
    });
    setPapers((current) => {
      let changed = false;
      const next = current.map((paper) => {
        const faculty = canonicalFacultyName(paper.faculty);
        if (faculty === paper.faculty) {
          return paper;
        }
        changed = true;
        return { ...paper, faculty };
      });
      return changed ? next : current;
    });
    setPaperDraft((current) => ({
      ...current,
      faculty: canonicalFacultyName(current.faculty),
    }));
    setPaperFaculty((current) => canonicalFacultyName(current));
  }, [setPapers, setProfile]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => {
      setNotice("");
      setNoticeTone("success");
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!shouldGuardProfileDraft) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldGuardProfileDraft]);

  const favouriteItems = useMemo(
    () =>
      favourites
        .map((itemId) => marketplace.find((listing) => listing.id === itemId))
        .filter((item): item is MarketplaceItem => Boolean(item)),
    [favourites, marketplace],
  );

  const listingLocationSuggestions = useMemo(() => {
    const input = normalize(listingDraft.location);
    const uniqueLocations = Array.from(
      new Set([
        ...campusLocations.map((location) => location.name),
        ...transportPlaceFilters.filter((place) => place !== "All"),
      ]),
    );
    return uniqueLocations
      .filter((location) => !input || normalize(location).includes(input))
      .slice(0, 12);
  }, [listingDraft.location]);

  const visibleMarketplace = useMemo(() => {
    const filtered = marketplace.filter((item) => {
      const inCategory =
        marketCategory === "All" ||
        (marketCategory === "Free" && item.price <= 0) ||
        (marketCategory === "Favourites" && favourites.includes(item.id)) ||
        item.category === marketCategory;
      const inSearch =
        !search ||
        [item.title, item.seller, item.location, item.description, ...item.tags]
          .join(" ")
          .toLowerCase()
          .includes(search);
      return inCategory && inSearch;
    });
    return [...filtered].sort((a, b) => {
      if (marketSort === "Price low to high") {
        return a.price - b.price;
      }
      if (marketSort === "Price high to low") {
        return b.price - a.price;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [favourites, marketCategory, marketSort, marketplace, search]);

  const visibleLocations = useMemo(() => {
    return campusLocations.filter((location) => {
      const inCategory =
        mapCategory === "All" || location.category === mapCategory;
      const inSearch =
        !search ||
        [
          location.name,
          location.category,
          location.area,
          location.blurb,
          ...location.bestFor,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      return inCategory && inSearch;
    });
  }, [mapCategory, search]);

  const selectedLocation =
    campusLocations.find((location) => location.id === selectedLocationId) ??
    campusLocations[0];

  const directChannels = useMemo(
    () =>
      Array.from(
        new Set(
          messages
            .map((message) => message.channel)
            .filter((channel) => channel.startsWith(`${t("privateChat")}:`)),
        ),
      ),
    [messages, appSettings.language],
  );
  const allChatChannels = useMemo(
    () => [...chatChannels, ...directChannels],
    [directChannels],
  );

  const channelMessages = useMemo(
    () =>
      messages
        .filter((message) => message.channel === activeChannel)
        .filter(
          (message) =>
            !search ||
            [message.author, message.content].join(" ").toLowerCase().includes(search),
        ),
    [activeChannel, messages, search],
  );

  const visibleQuestions = useMemo(() => {
    const filtered = questions.filter((question) => {
      return (
        !search ||
        [
          question.title,
          question.body,
          question.author,
          question.tags.join(" "),
          question.answers.map((answer) => answer.body).join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    });
    return [...filtered].sort((a, b) => {
      if (questionSort === "Most likes/upvotes") {
        return (
          questionEngagementScore(b) - questionEngagementScore(a) ||
          new Date(b.createdAt ?? "1970-01-01").getTime() -
            new Date(a.createdAt ?? "1970-01-01").getTime()
        );
      }
      if (questionSort === "Least likes/upvotes") {
        return (
          questionEngagementScore(a) - questionEngagementScore(b) ||
          new Date(b.createdAt ?? "1970-01-01").getTime() -
            new Date(a.createdAt ?? "1970-01-01").getTime()
        );
      }
      return (
        new Date(b.createdAt ?? "1970-01-01").getTime() -
        new Date(a.createdAt ?? "1970-01-01").getTime()
      );
    });
  }, [questionSort, questions, search]);

  const visiblePapers = useMemo(() => {
    return papers.filter((paper) => {
      const approved = (paper.status ?? "Approved") === "Approved";
      const inFaculty = paperFaculty === "All" || paper.faculty === paperFaculty;
      const inSearch =
        !search ||
        [paper.code, paper.title, paper.faculty, paper.year, paper.type]
          .join(" ")
          .toLowerCase()
          .includes(search);
      return approved && inFaculty && inSearch;
    });
  }, [paperFaculty, papers, search]);

  const pendingPapers = useMemo(
    () => papers.filter((paper) => paper.status === "Pending Review"),
    [papers],
  );

  const selectedListing = selectedListingId
    ? marketplace.find((item) => item.id === selectedListingId) ?? null
    : null;
  const viewerListing = imageViewerListingId
    ? marketplace.find((item) => item.id === imageViewerListingId) ?? null
    : null;
  const viewerImages = viewerListing
    ? viewerListing.images?.length
      ? viewerListing.images
      : [viewerListing.image]
    : [];
  const selectedListingImages = selectedListing
    ? selectedListing.images?.length
      ? selectedListing.images
      : [selectedListing.image]
    : [];

  const visibleRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesPlace =
        requestPlaceFilter === "All" ||
        [request.pickup, request.dropoff]
          .join(" ")
          .toLowerCase()
          .includes(requestPlaceFilter.toLowerCase());
      if (!matchesPlace) {
        return false;
      }
      return (
        !search ||
        [
          request.type,
          request.title,
          request.requester,
          request.pickup,
          request.dropoff,
          request.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [requestPlaceFilter, requests, search]);

  const openRequestCount = requests.filter(
    (request) => request.status === "Open",
  ).length;
  const visibleBusRoutes = useMemo(() => {
    const normalizedBusSearch = normalize(busSearch);
    return busScheduleRoutes.filter((route) => {
      const matchesDocument = route.documentId === selectedBusDocumentId;
      const matchesSearch =
        !normalizedBusSearch ||
        [route.code, route.route, route.service, ...route.directions, ...route.notes]
          .join(" ")
          .toLowerCase()
          .includes(normalizedBusSearch);
      return matchesDocument && matchesSearch;
    });
  }, [busSearch, selectedBusDocumentId]);
  const selectedBusRoute =
    busScheduleRoutes.find((route) => route.id === selectedBusRouteId) ??
    visibleBusRoutes[0] ??
    busScheduleRoutes[0];
  const selectedBusDocument =
    busScheduleDocuments.find(
      (document) => document.id === selectedBusRoute.documentId,
    ) ?? busScheduleDocuments[0];
  const selectedBusStops = useMemo(
    () => uniqueBusStops(selectedBusRoute),
    [selectedBusRoute],
  );
  const activeBusStop = selectedBusStops.includes(selectedBusStop)
    ? selectedBusStop
    : selectedBusStops[0] ?? "";
  const selectedBusAvailability = busAvailability(
    selectedBusRoute,
    activeBusStop,
  );

  useEffect(() => {
    if (!selectedBusStops.length) {
      return;
    }
    if (!selectedBusStops.includes(selectedBusStop)) {
      setSelectedBusStop(selectedBusStops[0]);
    }
  }, [selectedBusRoute.id, selectedBusStop, selectedBusStops]);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!search) {
      return [];
    }

    const results: SearchResult[] = [];
    marketplace.forEach((item) => {
      const haystack = [
        item.title,
        item.seller,
        item.location,
        item.description,
        item.category,
        ...item.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(search)) {
        results.push({
          id: item.id,
          module: "marketplace",
          title: item.title,
          detail: `Marketplace · ${item.location}`,
          action: () => {
            setMarketCategory(item.category);
            navigateToModule("marketplace");
          },
        });
      }
    });

    campusLocations.forEach((location) => {
      const haystack = [
        location.name,
        location.category,
        location.area,
        location.blurb,
        ...location.bestFor,
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(search)) {
        results.push({
          id: location.id,
          module: "map",
          title: location.name,
          detail: `Map · ${location.area}`,
          action: () => {
            setMapCategory(location.category);
            setSelectedLocationId(location.id);
            navigateToModule("map");
          },
        });
      }
    });

    messages.forEach((message) => {
      const haystack = [message.channel, message.author, message.content]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(search)) {
        results.push({
          id: message.id,
          module: "community",
          title: message.content,
          detail: `Chat · ${message.channel}`,
          action: () => {
            setActiveChannel(message.channel);
            navigateToModule("community");
          },
        });
      }
    });

    questions.forEach((question) => {
      const haystack = [
        question.title,
        question.body,
        question.author,
        ...question.tags,
        ...question.answers.map((answer) => answer.body),
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(search)) {
        results.push({
          id: question.id,
          module: "qa",
          title: question.title,
          detail: `Q&A · ${question.answers.length} answers`,
          action: () => navigateToModule("qa"),
        });
      }
    });

    papers.forEach((paper) => {
      const haystack = [
        paper.code,
        paper.title,
        paper.faculty,
        paper.year,
        paper.type,
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(search)) {
        results.push({
          id: paper.id,
          module: "papers",
          title: `${paper.code}: ${paper.title}`,
          detail: `Past papers · ${paper.faculty}`,
          action: () => {
            setPaperFaculty(paper.faculty);
            navigateToModule("papers");
          },
        });
      }
    });

    busScheduleDocuments.forEach((schedule) => {
      const haystack = [
        schedule.title,
        schedule.sourceName,
        schedule.effective,
        schedule.appliesTo,
        schedule.summary,
        ...schedule.notes,
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(search)) {
        results.push({
          id: schedule.id,
          module: "bus",
          title: schedule.title,
          detail: `Bus schedule · ${schedule.effective}`,
          action: () => navigateToModule("bus"),
        });
      }
    });

    busScheduleRoutes.forEach((route) => {
      const availability = busAvailability(route, uniqueBusStops(route)[0]);
      const haystack = [
        "bus",
        "shuttle",
        "available now",
        "next bus",
        route.code,
        route.route,
        route.service,
        availability.label,
        ...route.directions,
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(search)) {
        results.push({
          id: route.id,
          module: "bus",
          title: `${route.code} - ${route.route}`,
          detail: `Bus schedule · ${availability.label}`,
          action: () => {
            setSelectedBusDocumentId(route.documentId);
            setSelectedBusRouteId(route.id);
            navigateToModule("bus");
          },
        });
      }
    });

    requests.forEach((request) => {
      const haystack = [
        request.type,
        request.title,
        request.requester,
        request.pickup,
        request.dropoff,
        request.status,
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(search)) {
        results.push({
          id: request.id,
          module: "requests",
          title: request.title,
          detail: `${request.type} · ${request.status}`,
          action: () => {
            setRequestPlaceFilter("All");
            navigateToModule("requests");
          },
        });
      }
    });

    return results
      .sort((a, b) => {
        const aTitleMatch = a.title.toLowerCase().includes(search) ? 0 : 1;
        const bTitleMatch = b.title.toLowerCase().includes(search) ? 0 : 1;
        return aTitleMatch - bTitleMatch;
      })
      .slice(0, 8);
  }, [marketplace, messages, papers, questions, requests, search]);

  function addNotification(
    title: string,
    body: string,
    module: ModuleKey = activeModule,
  ) {
    const item: NotificationItem = {
      id: uid("notif"),
      title,
      body,
      module,
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications((current) => [item, ...current].slice(0, 40));
  }

  function confirmDiscardProfileDraft() {
    if (!shouldGuardProfileDraft) {
      return true;
    }
    return window.confirm("Discard unsaved profile details?");
  }

  function navigateToModule(
    module: ModuleKey,
    options: { skipProfileGuard?: boolean } = {},
  ) {
    if (!options.skipProfileGuard && !confirmDiscardProfileDraft()) {
      return;
    }
    const nextIndex = navItems.findIndex((item) => item.key === module);
    setPageDirection(
      nextIndex >= activeModuleIndex || nextIndex === -1 ? "forward" : "back",
    );
    setActiveModuleState(module);
  }

  function switchAuthMode(mode: "signin" | "signup") {
    setAuthMode(mode);
    setAuthForm({
      email: "",
      password: "",
      name: "",
      sex: "Prefer not to say",
    });
  }

  async function saveProfileForUserId(
    userId: string | undefined,
    nextProfile: Profile,
    email?: string,
  ) {
    if (!supabase || !userId) {
      return;
    }
    const { error } = await supabase.from("user_profiles").upsert({
      id: userId,
      email,
      name: nextProfile.name,
      sex: nextProfile.sex,
      profile: nextProfile,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      await saveSupabaseState(profileStorageKey(userId), nextProfile);
    }
  }

  async function syncProfileToSupabase(nextProfile: Profile, email?: string) {
    await saveProfileForUserId(
      authSession?.user.id,
      nextProfile,
      email ?? authSession?.user.email,
    );
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setGuestMode(false);
      showNotice("Supabase is not configured yet", "error");
      return;
    }
    if (!authForm.email.trim() || !authForm.password.trim()) {
      showNotice("Email and password are required", "error");
      return;
    }

    if (authMode === "signup") {
      if (!authForm.name.trim()) {
        showNotice("Name is required to create an account", "error");
        return;
      }
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", authForm.email.trim().toLowerCase())
        .maybeSingle();
      if (existingProfile) {
        showNotice("This email already has an EverythingUTM account", "error");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: authForm.email.trim(),
        password: authForm.password,
        options: {
          data: {
            name: authForm.name.trim(),
            sex: authForm.sex,
          },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        showNotice(
          error.message.toLowerCase().includes("rate limit")
            ? "Email sending is busy. Try Google sign-in or wait before requesting another email."
            : error.message,
          "error",
        );
        return;
      }
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        showNotice("This email already has an EverythingUTM account", "error");
        return;
      }
      const nextProfile = emptyProfile();
      setProfile(nextProfile);
      setProfileDraft(nextProfile);
      if (data.session) {
        setAuthSession(data.session);
      } else {
        setGuestMode(false);
      }
      await saveProfileForUserId(
        data.user?.id,
        nextProfile,
        authForm.email.trim().toLowerCase(),
      );
      showNotice(
        data.session
          ? "Account created. Finish your profile setup."
          : "Account created. Check your email, then sign in to finish your profile setup.",
      );
      if (data.session) {
        openOwnProfile();
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authForm.email.trim(),
      password: authForm.password,
    });
    if (error) {
      showNotice(error.message, "error");
      return;
    }
    setAuthSession(data.session);
    setGuestMode(false);
    showNotice("Signed in");
    openOwnProfile();
  }

  async function signInWithGoogle() {
    if (!supabase) {
      showNotice("Supabase is not configured yet", "error");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      showNotice(error.message, "error");
    }
  }

  async function resetPassword() {
    if (!supabase) {
      showNotice("Supabase is not configured yet", "error");
      return;
    }
    if (!authForm.email.trim()) {
      showNotice("Enter your email first", "error");
      return;
    }
    if (Date.now() - resetEmailSentAt < 60_000) {
      showNotice("Please wait before requesting another reset email", "error");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(authForm.email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) {
      showNotice(
        error.message.toLowerCase().includes("rate limit")
          ? "Password email is rate limited. Try again later or use Google sign-in."
          : error.message,
        "error",
      );
      return;
    }
    setResetEmailSentAt(Date.now());
    showNotice("Password reset email sent");
  }

  async function signOut() {
    if (!window.confirm("Sign out of EverythingUTM?")) {
      return;
    }
    setAuthSession(null);
    setGuestMode(false);
    setProfile(emptyProfile());
    setProfileDraft(emptyProfile());
    setSelectedProfileName("");
    showNotice("Signed out");
    navigateToModule("home", { skipProfileGuard: true });
    if (supabase) {
      await supabase.auth.signOut().catch(() => undefined);
    }
  }

  function browseAsGuest() {
    setGuestMode(false);
    setProfile(emptyProfile());
    setProfileDraft(emptyProfile());
    setSelectedProfileName("");
    navigateToModule("home", { skipProfileGuard: true });
  }

  function openNotification(item: NotificationItem) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === item.id ? { ...notification, read: true } : notification,
      ),
    );
    navigateToModule(
      navItems.some((navItem) => navItem.key === item.module)
        ? item.module
        : "home",
    );
    setNotificationsOpen(false);
  }

  function markAllNotificationsRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }

  function runSearch(result = searchResults[0]) {
    if (!result) {
      showNotice("No matching UTM result found", "error");
      return;
    }
    result.action();
    setSearchFocused(false);
  }

  function startLongPress(key: string, action: () => void) {
    window.clearTimeout(longPressTimers.current[key]);
    longPressTimers.current[key] = window.setTimeout(action, 520);
  }

  function cancelLongPress(key: string) {
    window.clearTimeout(longPressTimers.current[key]);
  }

  function clearActionFocus() {
    setMessageActionId(null);
    setQuestionActionId(null);
    setAnswerActionId(null);
    setRequestActionId(null);
  }

  async function toggleTranslation(key: string, text: string) {
    if (translatedItems[key]) {
      setTranslatedItems((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      return;
    }
    setTranslatedItems((current) => ({
      ...current,
      [key]: "Translating to English...",
    }));
    try {
      const translated = await translateToEnglish(text);
      setTranslatedItems((current) => ({
        ...current,
        [key]: `English: ${translated}`,
      }));
    } catch {
      setTranslatedItems((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      showNotice("Translation service is unavailable right now", "error");
    }
  }

  function toggleFavourite(itemId: string) {
    setFavourites((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
    showNotice(
      favourites.includes(itemId) ? "Removed from favourites" : "Added to favourites",
    );
  }

  async function updateListingImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const images = await Promise.all(files.slice(0, 6).map(readFileAsDataUrl));
    setListingImages(images);
    if (images.length) {
      showNotice(`${images.length} listing photo${images.length === 1 ? "" : "s"} ready`);
    }
  }

  async function updateListingEditImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const images = await Promise.all(files.slice(0, 6).map(readFileAsDataUrl));
    setListingEditImages(images);
    if (images.length) {
      showNotice(`${images.length} updated photo${images.length === 1 ? "" : "s"} ready`);
    }
  }

  async function updateMessageImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessageImage(file ? await readFileAsDataUrl(file) : "");
  }

  async function toggleVoiceRecording() {
    if (isRecordingVoice) {
      mediaRecorderRef.current?.requestData();
      mediaRecorderRef.current?.stop();
      setIsRecordingVoice(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showNotice("Voice recording is not available in this browser", "error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());
        if (!blob.size) {
          showNotice("Voice recording was empty. Try recording again.", "error");
          setIsRecordingVoice(false);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setMessageVoice(String(reader.result));
          setMessageVoiceDuration(
            Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000)),
          );
          setIsRecordingVoice(false);
          showNotice("Voice message ready to send");
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVoice(true);
      showNotice("Recording voice message");
    } catch {
      showNotice("Microphone permission was not granted", "error");
    }
  }

  function clearVoiceMessage() {
    setMessageVoice("");
    setMessageVoiceDuration(0);
  }

  async function updateQuestionImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setQuestionImage(file ? await readFileAsDataUrl(file) : "");
  }

  function openProfile(name: string) {
    if (!confirmDiscardProfileDraft()) {
      return;
    }
    setSelectedProfileName(name);
    setProfileDraft({ ...getProfile(name) });
    navigateToModule("profile", { skipProfileGuard: true });
  }

  function openOwnProfile() {
    if (!confirmDiscardProfileDraft()) {
      return;
    }
    setSelectedProfileName(profileData.name);
    setProfileDraft({ ...profileData });
    navigateToModule("profile", { skipProfileGuard: true });
  }

  function buyListing(item: MarketplaceItem) {
    if (item.sold) {
      showNotice("This listing is already marked as sold", "error");
      return;
    }
    if (isCurrentUserEntity(item.sellerId, item.seller)) {
      showNotice("You cannot buy your own listing", "error");
      return;
    }
    const channel = `${t("privateChat")}: ${item.seller}`;
    const content = `Hi ${item.seller}, I would like to buy "${item.title}". Please send me your preferred payment QR or account number.`;
    const message: ChatMessage = {
      id: uid("msg"),
      channel,
      author: currentDisplayName,
      authorId: currentUserId,
      authorAvatar: profileData.profilePicture,
      content,
      time: new Date().toISOString(),
    };
    setMessages((current) => [...current, message]);
    setActiveChannel(channel);
    setSelectedListingId(null);
    setImageViewerListingId(null);
    navigateToModule("community");
    addNotification("Private chat started", `Purchase request sent to ${item.seller}.`, "community");
  }

  function handleListingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listingDraft.title.trim() || !listingDraft.description.trim()) {
      showNotice("Listing needs a title and description", "error");
      return;
    }
    if (!listingImages.length) {
      showNotice("Listing needs at least one picture", "error");
      return;
    }

    const item: MarketplaceItem = {
      id: uid("mkt"),
      title: listingDraft.title.trim(),
      category: listingDraft.category,
      price: parsePriceInput(listingDraft.price),
      seller: currentDisplayName,
      sellerId: currentUserId,
      sellerAvatar: profileData.profilePicture,
      location: listingDraft.location.trim() || "UTM Johor Bahru",
      fulfillment: listingDraft.fulfillment,
      condition: listingDraft.condition,
      paymentPreference: listingDraft.paymentPreference,
      description: listingDraft.description.trim(),
      image: listingImages[0],
      images: listingImages,
      tags: compactTags(listingDraft.tags),
      createdAt: new Date().toISOString(),
      sold: false,
    };

    setMarketplace((current) => [item, ...current]);
    setListingDraft(initialListing);
    setListingImages([]);
    showNotice("Listing published");
    addNotification("Listing published", `${item.title} is now live in Marketplace.`, "marketplace");
  }

  function beginEditListing(item: MarketplaceItem) {
    if (!isCurrentUserEntity(item.sellerId, item.seller)) {
      showNotice("Only the listing author can edit this post", "error");
      return;
    }
    setEditingListingId(item.id);
    setListingEditDraft({
      title: item.title,
      category: item.category,
      price: item.price <= 0 ? "Free" : String(item.price),
      seller: item.seller,
      location: item.location,
      fulfillment: item.fulfillment ?? "Pickup",
      condition: item.condition,
      paymentPreference: item.paymentPreference ?? "Cash",
      description: item.description,
      tags: item.tags.join(", "),
    });
    setListingEditImages(item.images?.length ? item.images : [item.image]);
  }

  function saveListingEdit(itemId: string) {
    const listing = marketplace.find((item) => item.id === itemId);
    if (!listing || !isCurrentUserEntity(listing.sellerId, listing.seller)) {
      showNotice("Only the listing author can save changes", "error");
      return;
    }
    if (!listingEditDraft.title.trim() || !listingEditDraft.description.trim()) {
      showNotice("Listing needs a title and description", "error");
      return;
    }
    setMarketplace((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              title: listingEditDraft.title.trim(),
              category: listingEditDraft.category,
              price: parsePriceInput(listingEditDraft.price),
              location: listingEditDraft.location.trim() || item.location,
              fulfillment: listingEditDraft.fulfillment,
              condition: listingEditDraft.condition,
              paymentPreference: listingEditDraft.paymentPreference,
              description: listingEditDraft.description.trim(),
              tags: compactTags(listingEditDraft.tags),
              image: listingEditImages[0] ?? item.image,
              images: listingEditImages.length ? listingEditImages : item.images,
            }
          : item,
      ),
    );
    setEditingListingId(null);
    showNotice("Listing updated");
  }

  function deleteListing(itemId: string) {
    const listing = marketplace.find((item) => item.id === itemId);
    if (!listing || !isCurrentUserEntity(listing.sellerId, listing.seller)) {
      showNotice("Only the listing author can delete this post", "error");
      return;
    }
    setMarketplace((current) => current.filter((item) => item.id !== itemId));
    setFavourites((current) => current.filter((id) => id !== itemId));
    setSelectedListingId(null);
    setImageViewerListingId(null);
    showNotice("Listing deleted");
  }

  function toggleListingSold(itemId: string) {
    const listing = marketplace.find((item) => item.id === itemId);
    if (!listing || !isCurrentUserEntity(listing.sellerId, listing.seller)) {
      showNotice("Only the listing author can update sold status", "error");
      return;
    }
    setMarketplace((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              sold: !item.sold,
              soldAt: !item.sold ? new Date().toISOString() : undefined,
            }
          : item,
      ),
    );
    showNotice(listing.sold ? "Listing marked available" : "Listing marked sold");
  }

  async function shareListing(item: MarketplaceItem) {
    const text = listingShareText(item);
    const url = listingShareUrl(item.id);
    try {
      if (navigator.share) {
        const shareData: ShareData = {
          title: `${item.title} on EverythingUTM`,
          text,
          url,
        };
        const imageFile = await imageToShareFile(
          item.images?.[0] ?? item.image,
          `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "listing"}.png`,
        );
        if (
          imageFile &&
          navigator.canShare?.({ files: [imageFile], text, title: shareData.title, url })
        ) {
          await navigator.share({
            ...shareData,
            files: [imageFile],
          });
        } else {
          await navigator.share(shareData);
        }
      } else {
        await navigator.clipboard?.writeText(text);
        showNotice("Listing summary and app link copied");
      }
    } catch {
      await navigator.clipboard?.writeText(text).catch(() => undefined);
      showNotice("Listing summary ready to share");
    }
  }

  function reportListing(item: MarketplaceItem) {
    showNotice(`Report sent for ${item.title}`);
    addNotification("Product report received", `${item.title} was flagged for review.`, "marketplace");
  }

  function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!messageDraft.trim() && !messageImage && !messageVoice) {
      showNotice("Message needs text, a picture, or a voice recording", "error");
      return;
    }
    const message: ChatMessage = {
      id: uid("msg"),
      channel: activeChannel,
      author: currentDisplayName,
      authorId: currentUserId,
      authorAvatar: profileData.profilePicture,
      content: messageDraft.trim(),
      image: messageImage || undefined,
      voiceUrl: messageVoice || undefined,
      voiceDuration: messageVoice ? messageVoiceDuration : undefined,
      time: new Date().toISOString(),
    };
    setMessages((current) => [...current, message]);
    setMessageDraft("");
    setMessageImage("");
    clearVoiceMessage();
    addNotification("Message sent", `Posted to ${activeChannel}.`, "community");
  }

  function toggleMessageHeart(messageId: string) {
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId) return message;
        const likedBy = message.likedBy ?? [];
        const liked = likedBy.includes(currentUserId);
        return {
          ...message,
          likedBy: liked
            ? likedBy.filter((id) => id !== currentUserId)
            : [...likedBy, currentUserId],
        };
      }),
    );
  }

  function reactToMessage(messageId: string, reaction: string) {
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId) return message;
        const reactions = Object.fromEntries(
          Object.entries(message.reactions ?? {}).map(([key, users]) => [
            key,
            users.filter((id) => id !== currentUserId),
          ]),
        );
        const users = reactions[reaction] ?? [];
        const hadReaction = (message.reactions?.[reaction] ?? []).includes(
          currentUserId,
        );
        return {
          ...message,
          likedBy: (message.likedBy ?? []).filter((id) => id !== currentUserId),
          reactions: {
            ...reactions,
            [reaction]: hadReaction ? users : [...users, currentUserId],
          },
        };
      }),
    );
    setMessageActionId(null);
  }

  function beginEditMessage(message: ChatMessage) {
    if (!isCurrentUserEntity(message.authorId, message.author)) {
      showNotice("Only the message author can edit this message", "error");
      return;
    }
    setEditingMessageId(message.id);
    setMessageEditDraft(message.content);
    setMessageActionId(null);
  }

  function saveMessageEdit(messageId: string) {
    const message = messages.find((entry) => entry.id === messageId);
    if (!message || !isCurrentUserEntity(message.authorId, message.author)) {
      showNotice("Only the message author can save changes", "error");
      return;
    }
    if (!messageEditDraft.trim()) return;
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: messageEditDraft.trim(),
              editedAt: new Date().toISOString(),
            }
          : message,
      ),
    );
    setEditingMessageId(null);
    setMessageEditDraft("");
  }

  function deleteMessage(messageId: string) {
    const message = messages.find((entry) => entry.id === messageId);
    if (!message || !isCurrentUserEntity(message.authorId, message.author)) {
      showNotice("Only the message author can delete this message", "error");
      return;
    }
    if (!window.confirm("Delete this message?")) {
      return;
    }
    setMessages((current) => current.filter((message) => message.id !== messageId));
    setMessageActionId(null);
  }

  function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!questionDraft.title.trim() || !questionDraft.body.trim()) {
      showNotice("Question needs a title and details", "error");
      return;
    }

    const question: Question = {
      id: uid("q"),
      title: questionDraft.title.trim(),
      body: questionDraft.body.trim(),
      author: currentDisplayName,
      authorId: currentUserId,
      authorAvatar: profileData.profilePicture,
      image: questionImage,
      tags: compactTags(questionDraft.tags),
      votes: 0,
      resolved: false,
      createdAt: new Date().toISOString(),
      answers: [],
    };

    setQuestions((current) => [question, ...current]);
    setQuestionDraft(initialQuestion);
    setQuestionImage("");
    showNotice("Question posted");
    addNotification("Question posted", question.title, "qa");
  }

  function addAnswer(questionId: string) {
    const question = questions.find((entry) => entry.id === questionId);
    if (question?.resolved) {
      showNotice("This question is resolved and locked", "error");
      return;
    }
    const body = answerDrafts[questionId]?.trim();
    if (!body) {
      return;
    }

    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              answers: [
                ...question.answers,
                {
                  id: uid("a"),
                  author: currentDisplayName,
                  authorId: currentUserId,
                  authorAvatar: profileData.profilePicture,
                  body,
                  helpful: 0,
                  time: new Date().toISOString(),
                },
              ],
            }
          : question,
      ),
    );
    setAnswerDrafts((current) => ({ ...current, [questionId]: "" }));
    addNotification("Answer added", "Your Q&A answer has been posted.", "qa");
  }

  function voteQuestion(questionId: string, amount: 1 | -1) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, votes: question.votes + amount }
          : question,
      ),
    );
  }

  function markQuestionResolved(questionId: string) {
    const targetQuestion = questions.find((question) => question.id === questionId);
    if (!targetQuestion || !isCurrentUserEntity(targetQuestion.authorId, targetQuestion.author)) {
      showNotice("Only the question author can change resolved status", "error");
      return;
    }
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, resolved: !question.resolved }
          : question,
      ),
    );
  }

  function beginEditQuestion(question: Question) {
    if (!isCurrentUserEntity(question.authorId, question.author)) {
      showNotice("Only the question author can edit this question", "error");
      return;
    }
    setEditingQuestionId(question.id);
    setQuestionEditDraft({
      title: question.title,
      body: question.body,
      tags: question.tags.join(", "),
    });
    setQuestionActionId(null);
  }

  function saveQuestionEdit(questionId: string) {
    const targetQuestion = questions.find((question) => question.id === questionId);
    if (!targetQuestion || !isCurrentUserEntity(targetQuestion.authorId, targetQuestion.author)) {
      showNotice("Only the question author can save changes", "error");
      return;
    }
    if (!questionEditDraft.title.trim() || !questionEditDraft.body.trim()) {
      showNotice("Question needs a title and details", "error");
      return;
    }
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              title: questionEditDraft.title.trim(),
              body: questionEditDraft.body.trim(),
              tags: compactTags(questionEditDraft.tags),
              editedAt: new Date().toISOString(),
            }
          : question,
      ),
    );
    setEditingQuestionId(null);
    setQuestionEditDraft(initialQuestion);
  }

  function deleteQuestion(questionId: string) {
    const targetQuestion = questions.find((question) => question.id === questionId);
    if (!targetQuestion || !isCurrentUserEntity(targetQuestion.authorId, targetQuestion.author)) {
      showNotice("Only the question author can delete this question", "error");
      return;
    }
    if (!window.confirm("Delete this question and its answers?")) {
      return;
    }
    setQuestions((current) =>
      current.filter((question) => question.id !== questionId),
    );
    setQuestionActionId(null);
  }

  function markAnswerHelpful(questionId: string, answerId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              answers: question.answers.map((answer) =>
                answer.id === answerId
                  ? (() => {
                      const helpedBy = answer.helpfulBy ?? [];
                      const alreadyHelpful = helpedBy.includes(currentUserId);
                      return {
                        ...answer,
                        helpful: Math.max(
                          0,
                          answer.helpful + (alreadyHelpful ? -1 : 1),
                        ),
                        helpfulBy: alreadyHelpful
                          ? helpedBy.filter((id) => id !== currentUserId)
                          : [...helpedBy, currentUserId],
                      };
                    })()
                  : answer,
              ),
            }
          : question,
      ),
    );
  }

  function handlePaperUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paperDraft.code.trim() || !paperDraft.title.trim()) {
      showNotice("Paper needs a course code and title", "error");
      return;
    }

    const finishUpload = (dataUrl?: string) => {
      const paper: PastPaper = {
        id: uid("paper"),
        code: paperDraft.code.trim().toUpperCase(),
        title: paperDraft.title.trim(),
        faculty: paperDraft.faculty,
        year: paperDraft.year,
        semester: paperDraft.semester,
        type: paperDraft.type,
        uploader: currentDisplayName,
        fileName: paperFile?.name ?? `${paperDraft.code.trim().toUpperCase()}.txt`,
        fileSize: paperFile
          ? `${(paperFile.size / 1024 / 1024).toFixed(2)} MB`
          : "Text entry",
        dataUrl,
        status: "Pending Review",
        downloads: 0,
      };
      setPapers((current) => [paper, ...current]);
      setPaperDraft(initialPaper);
      setPaperFile(null);
      showNotice("Past paper submitted for owner review");
      addNotification(
        "Past paper pending review",
        `${paper.code} was sent to the owner before publishing.`,
        "papers",
      );
    };

    if (paperFile) {
      const reader = new FileReader();
      reader.onload = () => finishUpload(String(reader.result));
      reader.readAsDataURL(paperFile);
      return;
    }

    finishUpload();
  }

  function registerDownload(paperId: string) {
    setPapers((current) =>
      current.map((paper) =>
        paper.id === paperId ? { ...paper, downloads: paper.downloads + 1 } : paper,
      ),
    );
  }

  function approvePaper(paperId: string) {
    setPapers((current) =>
      current.map((paper) =>
        paper.id === paperId ? { ...paper, status: "Approved" } : paper,
      ),
    );
    addNotification("Paper approved", "A submitted paper is now visible.", "papers");
  }

  function rejectPaper(paperId: string) {
    setPapers((current) =>
      current.map((paper) =>
        paper.id === paperId ? { ...paper, status: "Rejected" } : paper,
      ),
    );
    addNotification("Paper rejected", "A submitted paper was kept hidden.", "papers");
  }

  function updateRequestType(type: ServiceRequest["type"]) {
    const suggestion = requestSuggestion(type);
    setRequestDraft((draft) => ({
      ...draft,
      type,
      title: suggestion.title,
      pickup: suggestion.pickup,
      dropoff: suggestion.dropoff,
      pickupLat: null,
      pickupLng: null,
      pickupMapUrl: "",
      dropoffLat: null,
      dropoffLng: null,
      dropoffMapUrl: "",
      budget: normalizeBudgetForType(draft.budget, type),
      notes: suggestion.notes,
    }));
    setPickupMapLocationId("");
    setDropoffMapLocationId("");
  }

  function applyRequestMapLocation(
    field: "pickup" | "dropoff",
    value: string,
  ) {
    const location = campusLocations.find(
      (entry) => entry.id === value || entry.name === value,
    );
    if (!location) {
      if (field === "pickup") {
        setPickupMapLocationId("");
        setRequestDraft((draft) => ({
          ...draft,
          pickup: value,
          pickupLat: null,
          pickupLng: null,
          pickupMapUrl: "",
        }));
        return;
      }
      setDropoffMapLocationId("");
      setRequestDraft((draft) => ({
        ...draft,
        dropoff: value,
        dropoffLat: null,
        dropoffLng: null,
        dropoffMapUrl: "",
      }));
      return;
    }
    if (field === "pickup") {
      setPickupMapLocationId(location.id);
      setRequestDraft((draft) => ({
        ...draft,
        pickup: location.name,
        pickupLat: location.lat,
        pickupLng: location.lng,
        pickupMapUrl: googleMapsUrlFor(location.lat, location.lng),
      }));
      return;
    }
    setDropoffMapLocationId(location.id);
    setRequestDraft((draft) => ({
      ...draft,
      dropoff: location.name,
      dropoffLat: location.lat,
      dropoffLng: location.lng,
      dropoffMapUrl: googleMapsUrlFor(location.lat, location.lng),
    }));
  }

  function locateMeForRequest() {
    if (!navigator.geolocation) {
      showNotice("Location access is not available in this browser", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const placeName =
          (await reverseGeocode(lat, lng)) || `Google Maps location near UTM`;
        setPickupMapLocationId("");
        setRequestDraft((draft) => ({
          ...draft,
          pickup: placeName,
          pickupLat: lat,
          pickupLng: lng,
          pickupMapUrl: googleMapsUrlFor(lat, lng),
        }));
        showNotice("Pickup set to your Google Maps location");
      },
      () => showNotice("Unable to access your location", "error"),
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  function draftTransportToLocation(location: CampusLocation) {
    setRequestDraft((draft) => ({
      ...draft,
      type: "Ride",
      title: `Ride to ${location.name}`,
      pickup: profileData.faculty || "My location",
      dropoff: location.name,
      pickupLat: null,
      pickupLng: null,
      pickupMapUrl: "",
      dropoffLat: location.lat,
      dropoffLng: location.lng,
      dropoffMapUrl: googleMapsUrlFor(location.lat, location.lng),
      scheduleDay: currentDayName(),
      scheduleTime: currentTimeValue(),
      budget: "",
      notes: `I want to get to ${location.name}.`,
    }));
    setPickupMapLocationId("");
    setDropoffMapLocationId(location.id);
    setRequestPlaceFilter("All");
    navigateToModule("requests");
  }

  function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requestDraft.title.trim()) {
      showNotice("Request needs a title", "error");
      return;
    }
    const allowedDays = availableTransportDays();
    if (!allowedDays.includes(requestDraft.scheduleDay)) {
      showNotice("Choose today or an upcoming day", "error");
      return;
    }
    if (
      requestDraft.scheduleDay === currentDayName() &&
      compareTimeValues(requestDraft.scheduleTime, currentTimeValue()) < 0
    ) {
      showNotice("Choose a future time for today", "error");
      return;
    }

    const request: ServiceRequest = {
      id: uid("req"),
      type: requestDraft.type,
      title: requestDraft.title.trim(),
      requester: currentDisplayName,
      requesterId: currentUserId,
      requesterAvatar: profileData.profilePicture,
      pickup: requestDraft.pickup.trim() || "UTM Johor Bahru",
      pickupLat: requestDraft.pickupLat ?? undefined,
      pickupLng: requestDraft.pickupLng ?? undefined,
      pickupMapUrl: requestDraft.pickupMapUrl || undefined,
      dropoff: requestDraft.dropoff.trim() || "UTM Johor Bahru",
      dropoffLat: requestDraft.dropoffLat ?? undefined,
      dropoffLng: requestDraft.dropoffLng ?? undefined,
      dropoffMapUrl: requestDraft.dropoffMapUrl || undefined,
      schedule: formatTransportSchedule(
        requestDraft.scheduleDay,
        requestDraft.scheduleTime,
      ),
      budget: parseBudgetInput(requestDraft.budget),
      paymentPreference: requestDraft.paymentPreference,
      notes: requestDraft.notes.trim(),
      status: "Open",
    };

    setRequests((current) => [request, ...current]);
    setRequestDraft(initialRequest);
    setPickupMapLocationId("");
    setDropoffMapLocationId("");
    showNotice(`${request.type} request posted`);
    addNotification("Request posted", request.title, "requests");
  }

  function matchRequest(requestId: string) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "Matched",
              driver: currentDisplayName,
              driverId: currentUserId,
              driverAvatar: profileData.profilePicture,
            }
          : request,
      ),
    );
    showNotice("Request matched");
    addNotification("Request matched", "A driver/delivery match was assigned.", "requests");
  }

  function requestTransportPayment(request: ServiceRequest) {
    const channel = `${t("privateChat")}: ${request.requester}`;
    const content =
      request.paymentPreference === "Cash"
        ? `Hi ${request.requester}, your "${request.title}" ${request.type.toLowerCase()} is matched. We can settle by cash at pickup.`
        : `Hi ${request.requester}, your "${request.title}" ${request.type.toLowerCase()} is matched. Please send me your preferred payment QR or account number.`;
    const message: ChatMessage = {
      id: uid("msg"),
      channel,
      author: currentDisplayName,
      authorId: currentUserId,
      authorAvatar: profileData.profilePicture,
      content,
      time: new Date().toISOString(),
    };
    setMessages((current) => [...current, message]);
    setActiveChannel(channel);
    navigateToModule("community");
    showNotice("Payment request sent in private chat");
    addNotification("Private chat started", `Payment request sent to ${request.requester}.`, "community");
  }

  function completeRequest(requestId: string) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, status: "Completed" } : request,
      ),
    );
    addNotification("Request completed", "The request was marked complete.", "requests");
  }

  function updatePaperFile(event: ChangeEvent<HTMLInputElement>) {
    setPaperFile(event.target.files?.[0] ?? null);
  }

  function updateProfilePicture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfileDraft((current) => ({
        ...current,
        profilePicture: String(reader.result),
      }));
      showNotice("Profile picture ready to save");
    };
    reader.readAsDataURL(file);
  }

  function saveProfile() {
    const nextProfile = { ...profileDraft };
    setMarketplace((current) =>
      current.map((item) =>
        isCurrentUserEntity(item.sellerId, item.seller)
          ? {
              ...item,
              seller: nextProfile.name,
              sellerId: currentUserId,
              sellerAvatar: nextProfile.profilePicture,
            }
          : item,
      ),
    );
    setMessages((current) =>
      current.map((message) =>
        isCurrentUserEntity(message.authorId, message.author)
          ? {
              ...message,
              author: nextProfile.name,
              authorId: currentUserId,
              authorAvatar: nextProfile.profilePicture,
            }
          : message,
      ),
    );
    setQuestions((current) =>
      current.map((question) => ({
        ...question,
        author:
          isCurrentUserEntity(question.authorId, question.author)
            ? nextProfile.name
            : question.author,
        authorId:
          isCurrentUserEntity(question.authorId, question.author)
            ? currentUserId
            : question.authorId,
        authorAvatar:
          isCurrentUserEntity(question.authorId, question.author)
            ? nextProfile.profilePicture
            : question.authorAvatar,
        answers: question.answers.map((answer) =>
          isCurrentUserEntity(answer.authorId, answer.author)
            ? {
                ...answer,
                author: nextProfile.name,
                authorId: currentUserId,
                authorAvatar: nextProfile.profilePicture,
              }
            : answer,
        ),
      })),
    );
    setRequests((current) =>
      current.map((request) => ({
        ...request,
        requester:
          isCurrentUserEntity(request.requesterId, request.requester)
            ? nextProfile.name
            : request.requester,
        requesterId:
          isCurrentUserEntity(request.requesterId, request.requester)
            ? currentUserId
            : request.requesterId,
        requesterAvatar:
          isCurrentUserEntity(request.requesterId, request.requester)
            ? nextProfile.profilePicture
            : request.requesterAvatar,
        driver:
          isCurrentUserEntity(request.driverId, request.driver)
            ? nextProfile.name
            : request.driver,
        driverId:
          isCurrentUserEntity(request.driverId, request.driver)
            ? currentUserId
            : request.driverId,
        driverAvatar:
          isCurrentUserEntity(request.driverId, request.driver)
            ? nextProfile.profilePicture
            : request.driverAvatar,
      })),
    );
    setProfile(nextProfile);
    syncProfileToSupabase(nextProfile).catch(() => undefined);
    setSelectedProfileName(nextProfile.name);
    showNotice("Profile saved");
    addNotification("Profile saved", "Your student profile was updated.", "profile");
  }

  function submitProfileReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewDraft.body.trim()) {
      showNotice("Review needs a short comment", "error");
      return;
    }
    const review: ProfileReview = {
      id: uid("review"),
      profileName: selectedProfile.name,
      reviewer: currentDisplayName,
      reviewerAvatar: profileData.profilePicture,
      rating: Number(reviewDraft.rating) || 5,
      body: reviewDraft.body.trim(),
      createdAt: new Date().toISOString(),
    };
    setProfileReviews((current) => [review, ...current]);
    setReviewDraft({ rating: "5", body: "" });
    showNotice("Review posted");
  }

  async function deleteAccountOnline() {
    if (!supabase || !authSession) {
      throw new Error("Sign in before deleting your online account");
    }

    const edgeResult = await supabase.functions
      .invoke("delete-account")
      .catch((error: unknown) => ({ data: null, error }));
    if (!edgeResult.error && edgeResult.data?.ok === true) {
      return;
    }

    const response = await fetch("/.netlify/functions/delete-account", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authSession.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }).catch(() => null);
    if (!response) {
      throw new Error(
        edgeResult.error instanceof Error
          ? edgeResult.error.message
          : "Online account deletion service is unavailable",
      );
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok !== true) {
      throw new Error(
        payload?.reason ||
          (edgeResult.error instanceof Error ? edgeResult.error.message : "") ||
          "Online account deletion failed",
      );
    }
  }

  async function deleteLocalAccount() {
    if (!deleteAccountArmed) {
      setDeleteAccountArmed(true);
      showNotice("Press delete again to confirm", "error");
      return;
    }
    if (deleteConfirmText !== "DELETE") {
      showNotice('Type DELETE to confirm account deletion', "error");
      return;
    }
    try {
      await deleteAccountOnline();
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Online account deletion failed",
        "error",
      );
      return;
    }
    await supabase?.auth.signOut().catch(() => undefined);
    window.localStorage.clear();
    setDeleteAccountArmed(false);
    setDeleteConfirmText("");
    setAuthSession(null);
    setGuestMode(false);
    setProfile(emptyProfile());
    setProfileDraft(emptyProfile());
    setSelectedProfileName("");
    navigateToModule("home", { skipProfileGuard: true });
    setAuthMode("signin");
    showNotice("Account deleted online.");
  }

  async function submitBugReport() {
    if (!bugReportDraft.trim()) {
      showNotice("Bug report needs details", "error");
      return;
    }
    const payload = {
      userName: isSignedIn ? currentDisplayName : "Not signed in",
      userEmail: authSession?.user.email ?? "not signed in",
      dateTime: new Date().toISOString(),
      details: bugReportDraft.trim(),
    };
    if (!supabase) {
      showNotice("Bug report email needs Supabase configuration", "error");
      return;
    }
    const supabaseClient = supabase;
    const storeBugReportFallback = async (emailError: string) => {
      const report = {
        id: uid("bug"),
        userName: payload.userName,
        userEmail: payload.userEmail,
        dateTime: payload.dateTime,
        details: payload.details,
        emailed: false,
        emailError,
      };
      const { error: tableError } = await supabaseClient.from("bug_reports").insert({
        user_name: report.userName,
        user_email: report.userEmail,
        details: report.details,
        reported_at: report.dateTime,
        emailed: false,
        email_error: emailError,
      });
      if (!tableError) {
        return true;
      }
      const currentReports = await loadSupabaseState<Array<typeof report>>(
        "everything-utm:bug-reports",
      ).catch(() => []);
      await saveSupabaseState("everything-utm:bug-reports", [
        report,
        ...((currentReports ?? []) as Array<typeof report>),
      ].slice(0, 200));
      return true;
    };
    const sendBugReportEmail = async () => {
      const edgeResult = await supabaseClient.functions
        .invoke("report-bug", { body: payload })
        .catch((invokeError: unknown) => ({ data: null, error: invokeError }));
      if (!edgeResult.error && edgeResult.data?.ok === true) {
        return;
      }

      const response = await fetch("/.netlify/functions/report-bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);
      if (!response) {
        throw new Error(
          edgeResult.error instanceof Error
            ? edgeResult.error.message
            : "Bug report email service is unavailable",
        );
      }
      const responsePayload = await response.json().catch(() => ({}));
      if (!response.ok || responsePayload?.ok !== true) {
        throw new Error(
          responsePayload?.reason ||
            (edgeResult.error instanceof Error ? edgeResult.error.message : "") ||
            "Bug report email failed",
        );
      }
    };

    try {
      await sendBugReportEmail();
    } catch (error) {
      try {
        await storeBugReportFallback(
          error instanceof Error
            ? error.message
            : "Bug report email function unavailable",
        );
      } catch {
        showNotice("Bug report could not be saved", "error");
        return;
      }
      showNotice(
        "Bug report saved, but email delivery is not configured on the server yet",
        "error",
      );
      return;
    }
    setBugReportDraft("");
    showNotice("Bug report emailed successfully");
    addNotification("Bug report received", "Thanks for the report.", "settings");
  }

  if (!authReady) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <div className="brand auth-brand">
            <div className="brand-mark" aria-hidden="true">
              <img src="/everythingutm-icon.png" alt="" />
            </div>
            <div>
              <p>EverythingUTM</p>
              <span>Loading campus hub</span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!canUseApp) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <div className="brand auth-brand">
            <div className="brand-mark" aria-hidden="true">
              <img src="/everythingutm-icon.png" alt="" />
            </div>
            <div>
              <p>EverythingUTM</p>
              <span>UTM Skudai in one place</span>
            </div>
          </div>
          <div>
            <p className="eyebrow">Welcome</p>
            <h1>{authMode === "signup" ? "Create account" : "Sign in"}</h1>
            <p className="muted">
              Browse listings, chats, transport, maps, papers, and bus schedules
              from one student hub.
            </p>
          </div>
          <div className="segmented-control">
            <button
              className={authMode === "signin" ? "is-active" : ""}
              type="button"
              onClick={() => switchAuthMode("signin")}
            >
              Sign in
            </button>
            <button
              className={authMode === "signup" ? "is-active" : ""}
              type="button"
              onClick={() => switchAuthMode("signup")}
            >
              Sign up
            </button>
          </div>
          <form className="stacked-form" onSubmit={handleAuthSubmit}>
            {authMode === "signup" && (
              <div className="two-col">
                <label>
                  <span>Name</span>
                  <input
                    value={authForm.name}
                    onChange={(event) =>
                      setAuthForm((form) => ({
                        ...form,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Sex</span>
                  <select
                    value={authForm.sex}
                    onChange={(event) =>
                      setAuthForm((form) => ({ ...form, sex: event.target.value }))
                    }
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Prefer not to say</option>
                  </select>
                </label>
              </div>
            )}
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm((form) => ({ ...form, email: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete={
                  authMode === "signup" ? "new-password" : "current-password"
                }
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((form) => ({
                    ...form,
                    password: event.target.value,
                  }))
                }
              />
            </label>
            <button className="primary-button full-width" type="submit">
              <UserCircle size={17} aria-hidden="true" />
              {authMode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
          <button
            className="secondary-button full-width"
            type="button"
            onClick={signInWithGoogle}
          >
            <BadgeCheck size={17} aria-hidden="true" />
            Continue with Google
          </button>
          {authMode === "signin" && (
            <button
              className="ghost-button full-width"
              type="button"
              onClick={resetPassword}
            >
              Reset password
            </button>
          )}
          <p className="fine-print">
            Create an account to access EverythingUTM and sync your campus data online.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="EverythingUTM navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <img src="/everythingutm-icon.png" alt="" />
          </div>
          <div>
            <p>EverythingUTM</p>
            <span>Skudai campus hub</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.key;
            const itemLabel =
              localizedNavLabels[appSettings.language][item.key] ?? item.label;
            return (
              <button
                className={`nav-item ${active ? "is-active" : ""}`}
                key={item.key}
                type="button"
                onClick={() => {
                  if (item.key === "profile") {
                    openOwnProfile();
                    return;
                  }
                  navigateToModule(item.key);
                }}
                title={itemLabel}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{itemLabel}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main
        className="main-content"
        data-page-direction={pageDirection}
        onPointerDownCapture={(event) => {
          const target = event.target as HTMLElement;
          if (
            !target.closest(
              ".message-bubble, .question-card, .answer-row, .request-card, .message-actions",
            )
          ) {
            clearActionFocus();
          }
        }}
      >
        <header className="topbar">
          <form
            className="search-wrapper"
            onSubmit={(event) => {
              event.preventDefault();
              runSearch();
            }}
          >
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input
                value={query}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    runSearch();
                  }
                }}
                placeholder={t("searchPlaceholder")}
              />
            </label>
            {searchFocused && query.trim() && (
              <div className="search-results-panel">
                {searchResults.length === 0 ? (
                  <div className="search-result-empty">{t("noSearchMatch")}</div>
                ) : (
                  searchResults.map((result) => (
                    <button
                      className="search-result-row"
                      key={`${result.module}-${result.id}`}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        runSearch(result);
                      }}
                    >
                      <span>{result.detail}</span>
                      <strong>{result.title}</strong>
                    </button>
                  ))
                )}
              </div>
            )}
          </form>
          <div className="topbar-actions">
            <button
              className="icon-button notification-button"
              type="button"
              title="Campus alerts"
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <Bell size={18} aria-hidden="true" />
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </button>
            {notificationsOpen && (
              <section className="notifications-popover">
                <div className="panel-heading">
                  <h2>{t("notifications")}</h2>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={markAllNotificationsRead}
                  >
                    {t("markRead")}
                  </button>
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <p className="muted">No notifications yet.</p>
                  ) : (
                    notifications.slice(0, 8).map((notification) => (
                      <button
                        className={`notification-row ${
                          notification.read ? "" : "is-unread"
                        }`}
                        key={notification.id}
                        type="button"
                        onClick={() => openNotification(notification)}
                      >
                        <strong>{notification.title}</strong>
                        <span>{notification.body}</span>
                        <small>{formatDate(notification.timestamp)}</small>
                      </button>
                    ))
                  )}
                </div>
              </section>
            )}
            <button
              className="profile-chip"
              type="button"
              onClick={openOwnProfile}
            >
              <PersonAvatar
                image={profileData.profilePicture}
                name={currentDisplayName}
                size={34}
              />
              <span>{currentDisplayName}</span>
              <small>{profileData.faculty || "Profile not set"}</small>
            </button>
          </div>
        </header>

        {notice && (
          <div className={`notice ${noticeTone === "error" ? "is-error" : ""}`} role="status">
            {noticeTone === "error" ? (
              <CircleX size={18} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={18} aria-hidden="true" />
            )}
            <span>{notice}</span>
          </div>
        )}

        {activeModule === "home" && (
          <section className="module">
            <div className="module-heading">
              <div>
                <p className="eyebrow">{t("homeEyebrow")}</p>
                <h1>{t("homeTitle")}</h1>
              </div>
              <div className="heading-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => navigateToModule("marketplace")}
                >
                  <ShoppingBag size={17} aria-hidden="true" />
                  {t("openMarketplace")}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => navigateToModule("requests")}
                >
                  <CarFront size={17} aria-hidden="true" />
                  {t("requestDriver")}
                </button>
              </div>
            </div>

            <div className="metric-grid">
              <article className="metric-card">
                <Store size={20} aria-hidden="true" />
                <span>{t("listingsLive")}</span>
                <strong>{marketplace.length}</strong>
                <small>Marketplace posts</small>
              </article>
              <article className="metric-card">
                <MapPinned size={20} aria-hidden="true" />
                <span>{t("campusPlaces")}</span>
                <strong>{campusLocations.length}</strong>
                <small>{campusCategories.length - 1} categories</small>
              </article>
              <article className="metric-card">
                <Route size={20} aria-hidden="true" />
                <span>{t("openRequests")}</span>
                <strong>{openRequestCount}</strong>
                <small>Rides and delivery</small>
              </article>
              <button
                className="metric-card metric-button"
                type="button"
                onClick={() => {
                  setMarketCategory("Favourites");
                  navigateToModule("marketplace");
                }}
              >
                <Heart size={20} aria-hidden="true" />
                <span>{t("savedFavourites")}</span>
                <strong>{favouriteItems.length}</strong>
                <small>Marketplace items</small>
              </button>
            </div>

            <div className="home-grid">
              <section className="panel activity-panel">
                <div className="panel-heading">
                  <h2>Live chat</h2>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => navigateToModule("community")}
                  >
                    <MessagesSquare size={16} aria-hidden="true" />
                    Chats
                  </button>
                </div>
                <div className="feed-list">
                  {messages.slice(-5).map((message) => (
                    <button
                      className="feed-item"
                      key={message.id}
                      type="button"
                      onClick={() => {
                        setActiveChannel(message.channel);
                        navigateToModule("community");
                      }}
                    >
                      <PersonAvatar
                        image={message.authorAvatar || getProfile(message.author).profilePicture}
                        name={message.author}
                        size={30}
                      />
                      <div>
                        <strong>{message.author}</strong>
                        <p>{message.content}</p>
                        <span>{message.channel}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel route-panel">
                <div className="panel-heading">
                  <h2>Popular places</h2>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => navigateToModule("map")}
                  >
                    <MapPin size={16} aria-hidden="true" />
                    Map
                  </button>
                </div>
                <div className="quick-place-grid">
                  {campusLocations.slice(0, 6).map((location) => (
                    <button
                      className="quick-place"
                      key={location.id}
                      type="button"
                      onClick={() => {
                        setSelectedLocationId(location.id);
                        navigateToModule("map");
                      }}
                    >
                      <span>{location.category}</span>
                      <strong>{location.name}</strong>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel request-panel">
                <div className="panel-heading">
                  <h2>Requests moving now</h2>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => navigateToModule("requests")}
                  >
                    <Route size={16} aria-hidden="true" />
                    Orders
                  </button>
                </div>
                <div className="compact-list">
                  {requests.slice(0, 4).map((request) => (
                    <article className="compact-row" key={request.id}>
                      <div>
                        <strong>{request.title} </strong>
                        <span>
                          {request.pickup} {"->"} {request.dropoff}
                        </span>
                      </div>
                      <b>{formatRequestBudget(request.budget, request.type)}</b>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}

        {activeModule === "marketplace" && (
          <section className="module">
            <div className="module-heading">
              <div>
                <p className="eyebrow">Buy, sell, borrow</p>
                <h1>{t("marketplaceTitle")}</h1>
              </div>
              <div className="filter-row">
                {marketplaceFilters.map((category) => (
                  <button
                    className={`chip ${marketCategory === category ? "is-active" : ""}`}
                    key={category}
                    type="button"
                    onClick={() => setMarketCategory(category)}
                  >
                    {category}
                  </button>
                ))}
                <label className="sort-control">
                  <ArrowUpDown size={16} aria-hidden="true" />
                  <span>Sort</span>
                  <select
                    value={marketSort}
                    onChange={(event) =>
                      setMarketSort(
                        event.target.value as (typeof marketplaceSortOptions)[number],
                      )
                    }
                  >
                    {marketplaceSortOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="market-layout">
              <section className="panel listing-form-panel">
                <div className="panel-heading">
                  <h2>{t("createListing")}</h2>
                  <PackagePlus size={18} aria-hidden="true" />
                </div>
                <form className="stacked-form" onSubmit={handleListingSubmit}>
                  <label>
                    <span>Title</span>
                    <input
                      value={listingDraft.title}
                      onChange={(event) =>
                        setListingDraft((draft) => ({
                          ...draft,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Graphing calculator"
                    />
                  </label>
                  <div className="two-col">
                    <label>
                      <span>Category</span>
                      <select
                        value={listingDraft.category}
                        onChange={(event) =>
                          setListingDraft((draft) => ({
                            ...draft,
                            category: event.target.value,
                          }))
                        }
                      >
                        {marketplaceCategories
                          .filter((category) => category !== "All")
                          .map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                      </select>
                    </label>
                    <label>
                      <span>Price</span>
                      <div className="price-field">
                        <input
                          value={listingDraft.price}
                          onChange={(event) =>
                            setListingDraft((draft) => ({
                              ...draft,
                              price: event.target.value,
                            }))
                          }
                          placeholder="Free"
                        />
                        {listingDraft.price.trim().toLowerCase() !== "free" && (
                          <span>RM</span>
                        )}
                      </div>
                    </label>
                  </div>
                  <div className="two-col">
                    <label>
                      <span>Fulfillment</span>
                      <select
                        value={listingDraft.fulfillment}
                        onChange={(event) =>
                          setListingDraft((draft) => ({
                            ...draft,
                            fulfillment: event.target
                              .value as MarketplaceItem["fulfillment"],
                          }))
                        }
                      >
                        <option>Pickup</option>
                        <option>Delivery</option>
                      </select>
                    </label>
                    <label>
                      <span>Condition</span>
                      <select
                        value={listingDraft.condition}
                        onChange={(event) =>
                          setListingDraft((draft) => ({
                            ...draft,
                            condition: event.target
                              .value as MarketplaceItem["condition"],
                          }))
                        }
                      >
                        {listingConditions.map((condition) => (
                          <option key={condition}>{condition}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    <span>Pickup or delivery area</span>
                    <input
                      list="listing-location-suggestions"
                      value={listingDraft.location}
                      onChange={(event) =>
                        setListingDraft((draft) => ({
                          ...draft,
                          location: event.target.value,
                        }))
                      }
                    />
                    <datalist id="listing-location-suggestions">
                      {listingLocationSuggestions.map((location) => (
                        <option key={location} value={location} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    <span>Payment</span>
                    <select
                      value={listingDraft.paymentPreference}
                      onChange={(event) =>
                        setListingDraft((draft) => ({
                          ...draft,
                          paymentPreference: event.target.value as PaymentMethod,
                        }))
                      }
                    >
                      {paymentPreferences.map((preference) => (
                        <option key={preference}>{preference}</option>
                      ))}
                    </select>
                  </label>
                  <label className="file-input">
                    <ImagePlus size={18} aria-hidden="true" />
                    <span>
                      {listingImages.length
                        ? `${listingImages.length} photo${listingImages.length === 1 ? "" : "s"} selected`
                        : "Add product photos"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={updateListingImages}
                    />
                  </label>
                  <label>
                    <span>Description</span>
                    <textarea
                      rows={3}
                      value={listingDraft.description}
                      onChange={(event) =>
                        setListingDraft((draft) => ({
                          ...draft,
                          description: event.target.value,
                        }))
                      }
                      placeholder="What should buyers know?"
                    />
                  </label>
                  <label>
                    <span>Tags</span>
                    <input
                      value={listingDraft.tags}
                      onChange={(event) =>
                        setListingDraft((draft) => ({
                          ...draft,
                          tags: event.target.value,
                        }))
                      }
                      placeholder="calculator, exam, pickup"
                    />
                  </label>
                  <button className="primary-button full-width" type="submit">
                    <Plus size={17} aria-hidden="true" />
                    {t("publishListing")}
                  </button>
                </form>
              </section>

              <section className="market-products">
                <div className="panel favourites-panel">
                  <div className="panel-heading">
                    <h2>Favourites</h2>
                    <Heart size={18} aria-hidden="true" />
                  </div>
                  {favouriteItems.length === 0 ? (
                    <p className="muted">Favourite products will appear here.</p>
                  ) : (
                    <div className="favourites-list">
                      {favouriteItems.map((item) => (
                        <button
                          className="favourite-row"
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedListingId(item.id)}
                        >
                          <img src={item.image} alt="" />
                          <span>{item.title}</span>
                          <strong>{formatListingPrice(item.price)}</strong>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {visibleMarketplace.length === 0 ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title="No listings found"
                    body="Try another category or search term."
                  />
                ) : (
                  <div className="product-grid">
                    {visibleMarketplace.map((item) => (
                      <article
                        className={`product-card clickable-card ${item.sold ? "is-sold" : ""}`}
                        key={item.id}
                        onClick={() => setSelectedListingId(item.id)}
                      >
                        <img src={item.image} alt="" loading="lazy" />
                        <div className="product-body">
                          <div className="card-title-row">
                            <span className="pill">{item.category}</span>
                            <strong>{formatListingPrice(item.price)}</strong>
                          </div>
                          {item.sold && <span className="status-pill sold-pill">Sold</span>}
                          <h2>{item.title}</h2>
                          <p>{item.description}</p>
                          <button
                            className="seller-inline"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openProfile(item.seller);
                            }}
                          >
                            <PersonAvatar
                              image={item.sellerAvatar || getProfile(item.seller).profilePicture}
                              name={item.seller}
                              size={28}
                            />
                            <span>{item.seller}</span>
                          </button>
                          <div className="meta-row">
                            <span>{item.fulfillment ?? "Pickup"}</span>
                            <span>{item.condition}</span>
                            <span>{item.location}</span>
                            <span>{item.paymentPreference ?? "Cash"}</span>
                            <span>Posted {formatDate(item.createdAt)}</span>
                          </div>
                          <div className="tag-row">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span key={tag}>#{tag}</span>
                            ))}
                          </div>
                          <div className="card-actions compact-actions">
                            <button
                              className="ghost-button mini-button"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                shareListing(item);
                              }}
                            >
                              <Share2 size={14} aria-hidden="true" />
                              Share
                            </button>
                            <button
                              className="ghost-button mini-button"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                reportListing(item);
                              }}
                            >
                              <Flag size={14} aria-hidden="true" />
                              Report
                            </button>
                          </div>
                          <div className="listing-action-row">
                            <button
                              className={`secondary-button ${
                                favourites.includes(item.id) ? "is-selected" : ""
                              }`}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleFavourite(item.id);
                              }}
                            >
                              <Heart size={17} aria-hidden="true" />
                              {favourites.includes(item.id)
                                ? t("removeFromFavourites")
                                : t("addToFavourites")}
                            </button>
                            <button
                              className="primary-button"
                              type="button"
                              disabled={
                                Boolean(item.sold) ||
                                isCurrentUserEntity(item.sellerId, item.seller)
                              }
                              onClick={(event) => {
                                event.stopPropagation();
                                buyListing(item);
                              }}
                            >
                              <ShoppingBag size={17} aria-hidden="true" />
                              {item.sold ? "Sold" : t("buy")}
                            </button>
                          </div>
                          {isCurrentUserEntity(item.sellerId, item.seller) && (
                            <div className="card-actions compact-actions">
                              <button
                                className="secondary-button mini-button"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleListingSold(item.id);
                                }}
                              >
                                <Check size={14} aria-hidden="true" />
                                {item.sold ? "Available" : "Mark sold"}
                              </button>
                              <button
                                className="secondary-button mini-button"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedListingId(item.id);
                                  beginEditListing(item);
                                }}
                              >
                                <Pencil size={14} aria-hidden="true" />
                                Manage
                              </button>
                              <button
                                className="secondary-button mini-button danger-text"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteListing(item.id);
                                }}
                              >
                                <Trash2 size={14} aria-hidden="true" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        )}

        {selectedListing && (
          <div
            className="modal-backdrop"
            role="presentation"
            onClick={() => setSelectedListingId(null)}
          >
            <section
              className={`detail-modal listing-detail-modal ${
                selectedListing.sold ? "is-sold" : ""
              }`}
              role="dialog"
              aria-modal="true"
              aria-label={selectedListing.title}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="icon-button modal-close"
                type="button"
                title="Close"
                onClick={() => setSelectedListingId(null)}
              >
                <X size={17} aria-hidden="true" />
              </button>
              <button
                className="listing-modal-image"
                type="button"
                onClick={() => {
                  setViewerImageIndex(0);
                  setImageViewerListingId(selectedListing.id);
                }}
              >
                <img src={selectedListingImages[0]} alt="" />
                <span>
                  <Maximize2 size={16} aria-hidden="true" />
                  View {selectedListingImages.length} photo
                  {selectedListingImages.length === 1 ? "" : "s"}
                </span>
              </button>
              <div className="detail-modal-body">
                <div className="card-actions compact-actions">
                  <span className="pill">{selectedListing.category}</span>
                  {selectedListing.sold && (
                    <span className="status-pill sold-pill">Sold</span>
                  )}
                </div>
                <h2>{selectedListing.title}</h2>
                <strong className="modal-price">
                  {formatListingPrice(selectedListing.price)}
                </strong>
                <p>{selectedListing.description}</p>
                <div className="meta-row">
                  <span>{selectedListing.fulfillment ?? "Pickup"}</span>
                  <span>{selectedListing.condition}</span>
                  <span>{selectedListing.location}</span>
                  <span>{selectedListing.paymentPreference ?? "Cash"}</span>
                  <span>Posted {formatDate(selectedListing.createdAt)}</span>
                </div>
                <button
                  className="seller-card"
                  type="button"
                  onClick={() => {
                    setSelectedListingId(null);
                    openProfile(selectedListing.seller);
                  }}
                >
                  <div className="seller-avatar">
                    {selectedListing.sellerAvatar ? (
                      <img src={selectedListing.sellerAvatar} alt="" />
                    ) : (
                      <span>{selectedListing.seller.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <span>Seller</span>
                    <strong>{selectedListing.seller}</strong>
                  </div>
                </button>
                <div className="card-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => shareListing(selectedListing)}
                  >
                    <Share2 size={16} aria-hidden="true" />
                    Share
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => reportListing(selectedListing)}
                  >
                    <Flag size={16} aria-hidden="true" />
                    Report
                  </button>
                </div>
                <div className="listing-action-row">
                  <button
                    className={`secondary-button ${
                      favourites.includes(selectedListing.id) ? "is-selected" : ""
                    }`}
                    type="button"
                    onClick={() => toggleFavourite(selectedListing.id)}
                  >
                    <Heart size={17} aria-hidden="true" />
                    {favourites.includes(selectedListing.id)
                      ? t("removeFromFavourites")
                      : t("addToFavourites")}
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={
                      Boolean(selectedListing.sold) ||
                      isCurrentUserEntity(
                        selectedListing.sellerId,
                        selectedListing.seller,
                      )
                    }
                    onClick={() => buyListing(selectedListing)}
                  >
                    <ShoppingBag size={17} aria-hidden="true" />
                    {selectedListing.sold ? "Sold" : t("buy")}
                  </button>
                </div>
                {isCurrentUserEntity(
                  selectedListing.sellerId,
                  selectedListing.seller,
                ) && (
                  <div className="card-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => toggleListingSold(selectedListing.id)}
                    >
                      <Check size={16} aria-hidden="true" />
                      {selectedListing.sold ? "Mark available" : "Mark sold"}
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => beginEditListing(selectedListing)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Edit listing
                    </button>
                    <button
                      className="secondary-button danger-text"
                      type="button"
                      onClick={() => deleteListing(selectedListing.id)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Delete listing
                    </button>
                  </div>
                )}
                {editingListingId === selectedListing.id && (
                  <div className="listing-edit-panel">
                    <h3>Edit listing</h3>
                    <div className="stacked-form">
                      <input
                        value={listingEditDraft.title}
                        onChange={(event) =>
                          setListingEditDraft((draft) => ({
                            ...draft,
                            title: event.target.value,
                          }))
                        }
                      />
                      <div className="two-col">
                        <select
                          value={listingEditDraft.category}
                          onChange={(event) =>
                            setListingEditDraft((draft) => ({
                              ...draft,
                              category: event.target.value,
                            }))
                          }
                        >
                          {marketplaceCategories
                            .filter((category) => category !== "All")
                            .map((category) => (
                              <option key={category}>{category}</option>
                            ))}
                        </select>
                        <div className="price-field">
                          <input
                            value={listingEditDraft.price}
                            onChange={(event) =>
                              setListingEditDraft((draft) => ({
                                ...draft,
                                price: event.target.value,
                              }))
                            }
                          />
                          {listingEditDraft.price.trim().toLowerCase() !== "free" && (
                            <span>RM</span>
                          )}
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={listingEditDraft.description}
                        onChange={(event) =>
                          setListingEditDraft((draft) => ({
                            ...draft,
                            description: event.target.value,
                          }))
                        }
                      />
                      <input
                        value={listingEditDraft.location}
                        onChange={(event) =>
                          setListingEditDraft((draft) => ({
                            ...draft,
                            location: event.target.value,
                          }))
                        }
                      />
                      <div className="two-col">
                        <select
                          value={listingEditDraft.paymentPreference}
                          onChange={(event) =>
                            setListingEditDraft((draft) => ({
                              ...draft,
                              paymentPreference: event.target.value as PaymentMethod,
                            }))
                          }
                        >
                          {paymentPreferences.map((preference) => (
                            <option key={preference}>{preference}</option>
                          ))}
                        </select>
                        <input
                          value={listingEditDraft.tags}
                          onChange={(event) =>
                            setListingEditDraft((draft) => ({
                              ...draft,
                              tags: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <label className="file-input">
                        <ImagePlus size={18} aria-hidden="true" />
                        <span>
                          {listingEditImages.length
                            ? `${listingEditImages.length} photo${listingEditImages.length === 1 ? "" : "s"} selected`
                            : "Replace photos"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={updateListingEditImages}
                        />
                      </label>
                      <div className="card-actions">
                        <button
                          className="primary-button"
                          type="button"
                          onClick={() => saveListingEdit(selectedListing.id)}
                        >
                          <Check size={16} aria-hidden="true" />
                          Save listing
                        </button>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => setEditingListingId(null)}
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {viewerListing && viewerImages.length > 0 && (
          <div
            className="modal-backdrop image-viewer-backdrop"
            role="presentation"
            onClick={() => setImageViewerListingId(null)}
          >
            <section
              className="image-viewer"
              role="dialog"
              aria-modal="true"
              aria-label={`${viewerListing.title} photos`}
              onClick={(event) => event.stopPropagation()}
              onTouchEnd={(event) => {
                if (touchStartX === null) return;
                const delta = event.changedTouches[0].clientX - touchStartX;
                if (Math.abs(delta) > 45) {
                  setViewerImageIndex((current) =>
                    delta < 0
                      ? (current + 1) % viewerImages.length
                      : (current - 1 + viewerImages.length) % viewerImages.length,
                  );
                }
                setTouchStartX(null);
              }}
              onTouchStart={(event) =>
                setTouchStartX(event.changedTouches[0].clientX)
              }
            >
              <button
                className="icon-button modal-close"
                type="button"
                title="Close"
                onClick={() => setImageViewerListingId(null)}
              >
                <X size={17} aria-hidden="true" />
              </button>
              <button
                className="image-nav previous"
                type="button"
                onClick={() =>
                  setViewerImageIndex(
                    (viewerImageIndex - 1 + viewerImages.length) %
                      viewerImages.length,
                  )
                }
              >
                <ChevronLeft size={24} aria-hidden="true" />
              </button>
              <img src={viewerImages[viewerImageIndex]} alt="" />
              <button
                className="image-nav next"
                type="button"
                onClick={() =>
                  setViewerImageIndex((viewerImageIndex + 1) % viewerImages.length)
                }
              >
                <ChevronRight size={24} aria-hidden="true" />
              </button>
              <div className="image-viewer-caption">
                <strong>{viewerListing.title}</strong>
                <span>
                  {viewerImageIndex + 1} / {viewerImages.length}
                </span>
              </div>
            </section>
          </div>
        )}

        {activeModule === "map" && (
          <section className="module">
            <div className="module-heading">
              <div>
                <p className="eyebrow">Skudai, Johor Bahru</p>
                <h1>Famous UTM locations</h1>
              </div>
              <div className="filter-row">
                {campusCategories.map((category) => (
                  <button
                    className={`chip ${mapCategory === category ? "is-active" : ""}`}
                    key={category}
                    type="button"
                    onClick={() => setMapCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="map-layout">
              <section className="campus-map-panel">
                <MapContainer
                  center={[selectedLocation.lat, selectedLocation.lng]}
                  className="campus-map"
                  zoom={15}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapFocus location={selectedLocation} />
                  {visibleLocations.map((location) => (
                    <Marker
                      eventHandlers={{
                        click: () => setSelectedLocationId(location.id),
                      }}
                      icon={campusMarkerIcon(
                        location.category,
                        location.id === selectedLocationId,
                      )}
                      key={location.id}
                      position={[location.lat, location.lng]}
                    >
                      <Popup>
                        <strong>{location.name}</strong>
                        <br />
                        {location.blurb}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </section>

              <aside className="panel location-panel">
                <div className="panel-heading">
                  <h2>Places</h2>
                  <span>{visibleLocations.length}</span>
                </div>
                <div className="location-list">
                  {visibleLocations.map((location) => (
                    <button
                      className={`location-row ${
                        selectedLocationId === location.id ? "is-active" : ""
                      }`}
                      key={location.id}
                      type="button"
                      onClick={() => setSelectedLocationId(location.id)}
                    >
                      <span>{location.category}</span>
                      <strong>{location.name}</strong>
                      <small>{location.area}</small>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="panel selected-place">
                <div className="selected-place-header">
                  <span className="pill">{selectedLocation.category}</span>
                  <h2>{selectedLocation.name}</h2>
                  <p>{selectedLocation.blurb}</p>
                </div>
                <div className="best-for">
                  {selectedLocation.bestFor.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <a
                  className="primary-button full-width link-button"
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.lat},${selectedLocation.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation size={17} aria-hidden="true" />
                  Open location
                </a>
                <button
                  className="secondary-button full-width"
                  type="button"
                  onClick={() => draftTransportToLocation(selectedLocation)}
                >
                  <CarFront size={17} aria-hidden="true" />
                  Get there
                </button>
                <p className="fine-print">
                  Campus pins are guide estimates for in-app navigation.
                </p>
              </section>
            </div>
          </section>
        )}

        {activeModule === "community" && (
          <section className="module chat-module">
            <div className="module-heading">
              <div>
                <p className="eyebrow">Community</p>
                <h1>{t("campusChats")}</h1>
              </div>
              <div className="filter-row">
                {allChatChannels.map((channel) => (
                  <button
                    className={`chip ${activeChannel === channel ? "is-active" : ""}`}
                    key={channel}
                    type="button"
                    onClick={() => setActiveChannel(channel)}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>

            <section className="chat-panel">
              <div className="chat-thread">
                {channelMessages.length === 0 ? (
                  <EmptyState
                    icon={MessagesSquare}
                    title="No messages found"
                    body="This channel is waiting for a new campus update."
                  />
                ) : (
                  channelMessages.map((message) => {
                    const reactionEntries = Object.entries(
                      message.reactions ?? {},
                    ).filter(([, users]) => users.length > 0);
                    const canManage = isCurrentUserEntity(
                      message.authorId,
                      message.author,
                    );
                    return (
                      <article
                        className={`message-bubble ${
                          isCurrentUserEntity(message.authorId, message.author)
                            ? "is-mine"
                            : ""
                        }`}
                        key={message.id}
                        onDoubleClick={() => reactToMessage(message.id, "❤️")}
                        onPointerCancel={() => cancelLongPress(message.id)}
                        onPointerDown={() =>
                          startLongPress(message.id, () =>
                            setMessageActionId(message.id),
                          )
                        }
                        onPointerLeave={() => cancelLongPress(message.id)}
                        onPointerUp={() => cancelLongPress(message.id)}
                      >
                        <div className="message-head">
                          <button
                            className="author-button"
                            type="button"
                            onClick={() => openProfile(message.author)}
                          >
                            <PersonAvatar
                              image={
                                message.authorAvatar ||
                                getProfile(message.author).profilePicture
                              }
                              name={message.author}
                              size={30}
                            />
                            <strong>{message.author}</strong>
                          </button>
                          <span>
                            {formatDate(message.time)}
                            {message.editedAt ? " · edited" : ""}
                          </span>
                        </div>
                        {editingMessageId === message.id ? (
                          <div className="inline-editor">
                            <input
                              value={messageEditDraft}
                              onFocus={clearActionFocus}
                              onChange={(event) =>
                                setMessageEditDraft(event.target.value)
                              }
                            />
                            <button
                              className="primary-button mini-button"
                              type="button"
                              onClick={() => saveMessageEdit(message.id)}
                            >
                              {t("save")}
                            </button>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                        {message.image && (
                          <button
                            className="message-image"
                            type="button"
                            onClick={() => window.open(message.image, "_blank")}
                          >
                            <img src={message.image} alt="" />
                          </button>
                        )}
                        {message.voiceUrl && (
                          <div className="voice-message">
                            <audio controls src={message.voiceUrl}>
                              Voice message
                            </audio>
                            <span>{message.voiceDuration ?? 0}s</span>
                          </div>
                        )}
                        {translatedItems[`message-${message.id}`] && (
                          <p className="translation-box">
                            {translatedItems[`message-${message.id}`]}
                          </p>
                        )}
                        <div className="reaction-row">
                          {reactionEntries.map(([reaction, users]) => (
                            <button
                              className={`reaction-chip ${
                                users.includes(currentUserId) ? "is-active" : ""
                              }`}
                              key={reaction}
                              type="button"
                              onClick={() => reactToMessage(message.id, reaction)}
                            >
                              {reaction} {users.length}
                            </button>
                          ))}
                        </div>
                        {messageActionId === message.id && (
                          <div className="message-actions">
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => beginEditMessage(message)}
                              >
                                <Pencil size={14} aria-hidden="true" />
                                {t("edit")}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                toggleTranslation(
                                  `message-${message.id}`,
                                  message.content,
                                )
                              }
                            >
                              <Languages size={14} aria-hidden="true" />
                              Translate
                            </button>
                            <div className="reaction-palette" aria-label="Choose reaction">
                              {reactionChoices.map((reaction) => (
                                <button
                                  key={reaction}
                                  type="button"
                                  onClick={() => reactToMessage(message.id, reaction)}
                                >
                                  {reaction}
                                </button>
                              ))}
                            </div>
                            {canManage && (
                              <button
                                className="danger-text"
                                type="button"
                                onClick={() => deleteMessage(message.id)}
                              >
                                <Trash2 size={14} aria-hidden="true" />
                                {t("delete")}
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>

              <form className="chat-composer" onSubmit={handleChatSubmit}>
                <label className="icon-button attachment-button" title="Add picture">
                  <ImagePlus size={17} aria-hidden="true" />
                  <input type="file" accept="image/*" onChange={updateMessageImage} />
                </label>
                <button
                  className={`icon-button voice-button ${
                    isRecordingVoice ? "is-recording" : ""
                  }`}
                  type="button"
                  title={isRecordingVoice ? "Stop recording" : "Record voice message"}
                  onClick={toggleVoiceRecording}
                >
                  {isRecordingVoice ? (
                    <Square size={15} aria-hidden="true" />
                  ) : (
                    <Mic size={17} aria-hidden="true" />
                  )}
                </button>
                <input
                  value={messageDraft}
                  onFocus={clearActionFocus}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder={
                    messageVoice
                      ? `Voice ready for ${activeChannel}`
                      : messageImage
                        ? `Picture ready for ${activeChannel}`
                      : `Message ${activeChannel}`
                  }
                />
                {messageVoice && (
                  <div className="voice-preview">
                    <audio controls src={messageVoice}>
                      Voice preview
                    </audio>
                    <div className="voice-bars" aria-hidden="true">
                      {Array.from({ length: 16 }).map((_, index) => (
                        <span key={index} style={{ "--bar": `${(index % 5) + 3}` } as CSSProperties} />
                      ))}
                    </div>
                    <button
                      className="ghost-button mini-button voice-ready-chip"
                      type="button"
                      onClick={clearVoiceMessage}
                    >
                      <Mic size={14} aria-hidden="true" />
                      {messageVoiceDuration}s
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                )}
                <button className="primary-button" type="submit">
                  <Send size={17} aria-hidden="true" />
                  {t("send")}
                </button>
              </form>
            </section>
          </section>
        )}

        {activeModule === "qa" && (
          <section className="module">
            <div className="module-heading">
              <div>
                <p className="eyebrow">Ask seniors, help juniors</p>
                <h1>{t("qaTitle")}</h1>
              </div>
              <label className="sort-control">
                <ArrowUpDown size={16} aria-hidden="true" />
                <span>Sort</span>
                <select
                  value={questionSort}
                  onChange={(event) =>
                    setQuestionSort(
                      event.target.value as (typeof questionSortOptions)[number],
                    )
                  }
                >
                  {questionSortOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="qa-layout">
              <section className="panel qa-form-panel">
                <div className="panel-heading">
                  <h2>{t("askQuestion")}</h2>
                  <CircleHelp size={18} aria-hidden="true" />
                </div>
                <form className="stacked-form" onSubmit={handleQuestionSubmit}>
                  <label>
                    <span>Title</span>
                    <input
                      value={questionDraft.title}
                      onChange={(event) =>
                        setQuestionDraft((draft) => ({
                          ...draft,
                          title: event.target.value,
                        }))
                      }
                      placeholder="How do I..."
                    />
                  </label>
                  <label>
                    <span>Details</span>
                    <textarea
                      rows={4}
                      value={questionDraft.body}
                      onChange={(event) =>
                        setQuestionDraft((draft) => ({
                          ...draft,
                          body: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="file-input">
                    <ImagePlus size={18} aria-hidden="true" />
                    <span>{questionImage ? "Question picture selected" : "Add question picture"}</span>
                    <input type="file" accept="image/*" onChange={updateQuestionImage} />
                  </label>
                  <label>
                    <span>Tags</span>
                    <input
                      value={questionDraft.tags}
                      onChange={(event) =>
                        setQuestionDraft((draft) => ({
                          ...draft,
                          tags: event.target.value,
                        }))
                      }
                      placeholder="transport, library"
                    />
                  </label>
                  <button className="primary-button full-width" type="submit">
                    <Plus size={17} aria-hidden="true" />
                    {t("postQuestion")}
                  </button>
                </form>
              </section>

              <section className="question-list">
                {visibleQuestions.length === 0 ? (
                  <EmptyState
                    icon={CircleHelp}
                    title="No questions found"
                    body="Try a broader search."
                  />
                ) : (
                  visibleQuestions.map((question) => (
                    <article
                      className="question-card"
                      key={question.id}
                      onPointerCancel={() => cancelLongPress(question.id)}
                      onPointerDown={() =>
                        startLongPress(question.id, () =>
                          setQuestionActionId(question.id),
                        )
                      }
                      onPointerLeave={() => cancelLongPress(question.id)}
                      onPointerUp={() => cancelLongPress(question.id)}
                    >
                      <div className="question-body">
                        <div className="card-title-row">
                          <h2>{question.title}</h2>
                          {isCurrentUserEntity(question.authorId, question.author) ? (
                            <button
                              className={`status-pill ${
                                question.resolved ? "is-good" : ""
                              }`}
                              type="button"
                              onClick={() => markQuestionResolved(question.id)}
                            >
                              {question.resolved ? "Resolved" : "Open"}
                            </button>
                          ) : (
                            <span
                              className={`status-pill ${
                                question.resolved ? "is-good" : ""
                              }`}
                            >
                              {question.resolved ? "Resolved" : "Open"}
                            </span>
                          )}
                        </div>
                        <button
                          className="author-line"
                          type="button"
                          onClick={() => openProfile(question.author)}
                        >
                          <PersonAvatar
                            image={
                              question.authorAvatar ||
                              getProfile(question.author).profilePicture
                            }
                            name={question.author}
                            size={30}
                          />
                          <span>
                            Asked by <strong>{question.author}</strong>
                            {question.createdAt
                              ? ` · ${formatDate(question.createdAt)}`
                              : ""}
                          </span>
                        </button>
                        {editingQuestionId === question.id ? (
                          <div className="stacked-form inline-question-editor">
                            <input
                              value={questionEditDraft.title}
                              onChange={(event) =>
                                setQuestionEditDraft((draft) => ({
                                  ...draft,
                                  title: event.target.value,
                                }))
                              }
                            />
                            <textarea
                              rows={3}
                              value={questionEditDraft.body}
                              onChange={(event) =>
                                setQuestionEditDraft((draft) => ({
                                  ...draft,
                                  body: event.target.value,
                                }))
                              }
                            />
                            <input
                              value={questionEditDraft.tags}
                              onChange={(event) =>
                                setQuestionEditDraft((draft) => ({
                                  ...draft,
                                  tags: event.target.value,
                                }))
                              }
                            />
                            <div className="card-actions">
                              <button
                                className="primary-button"
                                type="button"
                                onClick={() => saveQuestionEdit(question.id)}
                              >
                                {t("save")}
                              </button>
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={() => setEditingQuestionId(null)}
                              >
                                {t("cancel")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p>
                            {question.body}
                            {question.editedAt ? " (edited)" : ""}
                          </p>
                        )}
                        {question.image && (
                          <button
                            className="question-image"
                            type="button"
                            onClick={() => window.open(question.image, "_blank")}
                          >
                            <img src={question.image} alt="" />
                          </button>
                        )}
                        {translatedItems[`question-${question.id}`] && (
                          <p className="translation-box">
                            {translatedItems[`question-${question.id}`]}
                          </p>
                        )}
                        {questionActionId === question.id && (
                          <div className="message-actions question-actions">
                            {isCurrentUserEntity(
                              question.authorId,
                              question.author,
                            ) && (
                              <button
                                type="button"
                                onClick={() => beginEditQuestion(question)}
                              >
                                <Pencil size={14} aria-hidden="true" />
                                {t("edit")}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                toggleTranslation(
                                  `question-${question.id}`,
                                  `${question.title}. ${question.body}`,
                                )
                              }
                            >
                              <Languages size={14} aria-hidden="true" />
                              Translate
                            </button>
                            {isCurrentUserEntity(
                              question.authorId,
                              question.author,
                            ) && (
                              <button
                                className="danger-text"
                                type="button"
                                onClick={() => deleteQuestion(question.id)}
                              >
                                <Trash2 size={14} aria-hidden="true" />
                                {t("delete")}
                              </button>
                            )}
                          </div>
                        )}
                        <div className="tag-row">
                          {question.tags.map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                        <div className="answer-list">
                          {question.answers.map((answer) => {
                            const markedHelpful = (answer.helpfulBy ?? []).includes(
                              currentUserId,
                            );
                            return (
                              <article
                                className="answer-row"
                                key={answer.id}
                                onPointerCancel={() => cancelLongPress(answer.id)}
                                onPointerDown={() =>
                                  startLongPress(answer.id, () =>
                                    setAnswerActionId(answer.id),
                                  )
                                }
                                onPointerLeave={() => cancelLongPress(answer.id)}
                                onPointerUp={() => cancelLongPress(answer.id)}
                              >
                                <div>
                                  <button
                                    className="author-button"
                                    type="button"
                                    onClick={() => openProfile(answer.author)}
                                  >
                                    <PersonAvatar
                                      image={
                                        answer.authorAvatar ||
                                        getProfile(answer.author).profilePicture
                                      }
                                      name={answer.author}
                                      size={28}
                                    />
                                    <strong>{answer.author}</strong>
                                  </button>
                                  <span>{formatDate(answer.time)}</span>
                                </div>
                                <p>{answer.body}</p>
                                {translatedItems[`answer-${answer.id}`] && (
                                  <p className="translation-box">
                                    {translatedItems[`answer-${answer.id}`]}
                                  </p>
                                )}
                                {answerActionId === answer.id && (
                                  <div className="message-actions answer-actions">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleTranslation(
                                          `answer-${answer.id}`,
                                          answer.body,
                                        )
                                      }
                                    >
                                      <Languages size={14} aria-hidden="true" />
                                      Translate
                                    </button>
                                  </div>
                                )}
                                <button
                                  className={`ghost-button helpful-button ${
                                    markedHelpful ? "is-active" : ""
                                  }`}
                                  type="button"
                                  onClick={() =>
                                    markAnswerHelpful(question.id, answer.id)
                                  }
                                >
                                  <ThumbsUp size={15} aria-hidden="true" />
                                  {t("helpful")} {answer.helpful}
                                </button>
                              </article>
                            );
                          })}
                        </div>
                        {question.resolved ? (
                          <p className="locked-answer-note">
                            This question is resolved, so new answers are locked.
                          </p>
                        ) : (
                          <div className="answer-composer">
                            <input
                              value={answerDrafts[question.id] ?? ""}
                              onFocus={clearActionFocus}
                              onChange={(event) =>
                                setAnswerDrafts((draft) => ({
                                  ...draft,
                                  [question.id]: event.target.value,
                                }))
                              }
                              placeholder="Add an answer"
                            />
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => addAnswer(question.id)}
                            >
                              <Send size={16} aria-hidden="true" />
                              {t("answer")}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </section>
            </div>
          </section>
        )}

        {activeModule === "papers" && (
          <section className="module">
            <div className="module-heading">
              <div>
                <p className="eyebrow">Study vault</p>
                <h1>{t("papersTitle")}</h1>
              </div>
              <div className="filter-row">
                {faculties.map((faculty) => (
                  <button
                    className={`chip ${paperFaculty === faculty ? "is-active" : ""}`}
                    key={faculty}
                    type="button"
                    onClick={() => setPaperFaculty(faculty)}
                  >
                    {faculty}
                  </button>
                ))}
              </div>
            </div>

            <div className="papers-layout">
              <section className="panel upload-panel">
                <div className="panel-heading">
                  <h2>{t("uploadPaper")}</h2>
                  <Upload size={18} aria-hidden="true" />
                </div>
                <form className="stacked-form" onSubmit={handlePaperUpload}>
                  <div className="two-col">
                    <label>
                      <span>Course code</span>
                      <input
                        value={paperDraft.code}
                        onChange={(event) =>
                          setPaperDraft((draft) => ({
                            ...draft,
                            code: event.target.value,
                          }))
                        }
                        placeholder="SECJ1013"
                      />
                    </label>
                    <label>
                      <span>Year</span>
                      <input
                        value={paperDraft.year}
                        onChange={(event) =>
                          setPaperDraft((draft) => ({
                            ...draft,
                            year: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label>
                    <span>Title</span>
                    <input
                      value={paperDraft.title}
                      onChange={(event) =>
                        setPaperDraft((draft) => ({
                          ...draft,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Final examination"
                    />
                  </label>
                  <div className="two-col">
                    <label>
                      <span>Faculty</span>
                      <select
                        value={paperDraft.faculty}
                        onChange={(event) =>
                          setPaperDraft((draft) => ({
                            ...draft,
                            faculty: event.target.value,
                          }))
                        }
                      >
                        {faculties
                          .filter((faculty) => faculty !== "All")
                          .map((faculty) => (
                            <option key={faculty}>{faculty}</option>
                          ))}
                      </select>
                    </label>
                    <label>
                      <span>Test</span>
                      <select
                        value={paperDraft.type}
                        onChange={(event) =>
                          setPaperDraft((draft) => ({
                            ...draft,
                            type: event.target.value,
                          }))
                        }
                      >
                        {paperTestOptions.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    <span>Semester</span>
                    <select
                      value={paperDraft.semester}
                      onChange={(event) =>
                        setPaperDraft((draft) => ({
                          ...draft,
                          semester: event.target.value,
                        }))
                      }
                    >
                      {paperSemesterOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="file-input">
                    <FileText size={18} aria-hidden="true" />
                    <span>{paperFile ? paperFile.name : "Attach PDF or image"}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={updatePaperFile}
                    />
                  </label>
                  <button className="primary-button full-width" type="submit">
                    <Upload size={17} aria-hidden="true" />
                    {t("submitReview")}
                  </button>
                </form>
              </section>

              <section className="paper-grid">
                <div className="external-drive-grid">
                  {externalDrives.map((drive) => (
                    <a
                      className="drive-card"
                      href={drive.url}
                      key={drive.id}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FolderArchive size={22} aria-hidden="true" />
                      <div>
                        <strong>{drive.name}</strong>
                        <span>{drive.description}</span>
                      </div>
                      <ExternalLink size={16} aria-hidden="true" />
                    </a>
                  ))}
                </div>

                {isOwner && pendingPapers.length > 0 && (
                  <section className="panel review-panel">
                    <div className="panel-heading">
                      <h2>{t("ownerReview")}</h2>
                      <ShieldCheck size={18} aria-hidden="true" />
                    </div>
                    <div className="review-list">
                      {pendingPapers.map((paper) => (
                        <article className="review-row" key={paper.id}>
                          <div>
                            <strong>
                              {paper.code}: {paper.title}
                            </strong>
                            <span>
                              Uploaded by {paper.uploader} · {paper.fileName}
                            </span>
                          </div>
                          <div className="card-actions">
                            <button
                              className="primary-button mini-button"
                              type="button"
                              onClick={() => approvePaper(paper.id)}
                            >
                              <Check size={14} aria-hidden="true" />
                              Approve
                            </button>
                            <button
                              className="secondary-button mini-button"
                              type="button"
                              onClick={() => rejectPaper(paper.id)}
                            >
                              <X size={14} aria-hidden="true" />
                              Reject
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {visiblePapers.length === 0 ? (
                  <EmptyState
                    icon={FolderArchive}
                    title="No papers found"
                    body="Try another faculty or search term."
                  />
                ) : (
                  visiblePapers.map((paper) => (
                    <article className="paper-card" key={paper.id}>
                      <div className="paper-icon">
                        <FileText size={24} aria-hidden="true" />
                      </div>
                      <div>
                        <span className="pill">{paper.faculty}</span>
                        <h2>
                          {paper.code}: {paper.title}
                        </h2>
                        <p>
                          {paper.year} · {paper.semester} · {paper.type}
                        </p>
                        <button
                          className="author-line"
                          type="button"
                          onClick={() => openProfile(paper.uploader)}
                        >
                          <PersonAvatar
                            image={getProfile(paper.uploader).profilePicture}
                            name={paper.uploader}
                            size={28}
                          />
                          <span>Uploaded by {paper.uploader}</span>
                        </button>
                        <div className="meta-row">
                          <span>{paper.fileName}</span>
                          <span>{paper.fileSize}</span>
                        </div>
                      </div>
                      <div className="paper-actions">
                        <span>{paper.downloads} downloads</span>
                        {paper.dataUrl ? (
                          <a
                            className="secondary-button link-button"
                            download={paper.fileName}
                            href={paper.dataUrl}
                            onClick={() => registerDownload(paper.id)}
                          >
                            <Download size={16} aria-hidden="true" />
                            Download
                          </a>
                        ) : (
                          <button className="secondary-button" type="button" disabled>
                            <Download size={16} aria-hidden="true" />
                            Uploaded soon
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </section>
            </div>
          </section>
        )}

        {activeModule === "requests" && (
          <section className="module">
            <div className="module-heading">
              <div>
                <p className="eyebrow">Campus movement</p>
                <h1>Transportation</h1>
              </div>
            </div>
            <div className="filter-row transport-filter-row" aria-label="Transportation place filters">
              {transportPlaceFilters.map((place) => (
                <button
                  className={`chip ${requestPlaceFilter === place ? "is-active" : ""}`}
                  key={place}
                  type="button"
                  onClick={() => setRequestPlaceFilter(place)}
                >
                  {place}
                </button>
              ))}
            </div>

            <div className="requests-layout">
              <section className="panel request-form-panel">
                <div className="panel-heading">
                  <h2>Post request</h2>
                  <CarFront size={18} aria-hidden="true" />
                </div>
                <form className="stacked-form" onSubmit={handleRequestSubmit}>
                  <div className="segmented-control" aria-label="Request type">
                    {(["Ride", "Delivery"] as const).map((type) => (
                      <button
                        className={requestDraft.type === type ? "is-active" : ""}
                        key={type}
                        type="button"
                        onClick={() => updateRequestType(type)}
                      >
                        {type === "Ride" ? (
                          <CarFront size={16} aria-hidden="true" />
                        ) : (
                          <ShoppingBag size={16} aria-hidden="true" />
                        )}
                        {type}
                      </button>
                    ))}
                  </div>
                  <label>
                    <span>Title</span>
                    <input
                      value={requestDraft.title}
                      onChange={(event) =>
                        setRequestDraft((draft) => ({
                          ...draft,
                          title: event.target.value,
                        }))
                      }
                      placeholder={
                        requestDraft.type === "Ride"
                          ? "Ride to Senai Airport"
                          : "Deliver printouts to KTDI"
                      }
                    />
                  </label>
                  <div className="map-input-panel">
                    <div className="map-input-heading">
                      <MapPinned size={17} aria-hidden="true" />
                      <strong>Map input and custom locations</strong>
                    </div>
                    <div className="two-col">
                      <label>
                        <span>Pickup</span>
                        <input
                          list="transport-location-suggestions"
                          value={requestDraft.pickup}
                          onChange={(event) =>
                            applyRequestMapLocation("pickup", event.target.value)
                          }
                          placeholder="Choose or type pickup location"
                        />
                      </label>
                      <label>
                        <span>Drop off</span>
                        <input
                          list="transport-location-suggestions"
                          value={requestDraft.dropoff}
                          onChange={(event) =>
                            applyRequestMapLocation("dropoff", event.target.value)
                          }
                          placeholder="Choose or type drop off location"
                        />
                      </label>
                    </div>
                    <datalist id="transport-location-suggestions">
                      {campusLocations.map((location) => (
                        <option key={location.id} value={location.name} />
                      ))}
                    </datalist>
                    <div className="map-action-row">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={locateMeForRequest}
                      >
                        <Navigation size={16} aria-hidden="true" />
                        Locate me
                      </button>
                      <a
                        className="ghost-button link-button"
                        href={googleMapsSearchUrl(requestDraft.pickup)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPin size={16} aria-hidden="true" />
                        Open pickup map
                      </a>
                      <a
                        className="ghost-button link-button"
                        href={googleMapsSearchUrl(requestDraft.dropoff)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Route size={16} aria-hidden="true" />
                        Open drop-off map
                      </a>
                    </div>
                    {(requestDraft.pickupLat || requestDraft.dropoffLat) && (
                      <p className="fine-print">
                        Google Maps location saved for selected pickup or drop-off.
                      </p>
                    )}
                  </div>
                  <div className="two-col">
                    <label>
                      <span>Day</span>
                      <select
                        value={requestDraft.scheduleDay}
                        onChange={(event) =>
                          setRequestDraft((draft) => ({
                            ...draft,
                            scheduleDay: event.target.value,
                            scheduleTime:
                              event.target.value === currentDayName() &&
                              compareTimeValues(draft.scheduleTime, currentTimeValue()) < 0
                                ? currentTimeValue()
                                : draft.scheduleTime,
                          }))
                        }
                      >
                        {availableTransportDays().map((day) => (
                          <option key={day}>{day}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Time</span>
                      <input
                        type="time"
                        min={
                          requestDraft.scheduleDay === currentDayName()
                            ? currentTimeValue()
                            : undefined
                        }
                        value={requestDraft.scheduleTime}
                        onChange={(event) =>
                          setRequestDraft((draft) => ({
                            ...draft,
                            scheduleTime: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <div className="two-col">
                    <label>
                      <span>Budget</span>
                      <div className="price-field">
                        <input
                          maxLength={2}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          type="text"
                          value={requestDraft.budget}
                          onChange={(event) =>
                            setRequestDraft((draft) => ({
                              ...draft,
                              budget: sanitizeBudgetInput(event.target.value),
                            }))
                          }
                        />
                        {requestDraft.budget && <span>RM</span>}
                      </div>
                    </label>
                  </div>
                  <label>
                    <span>Payment</span>
                    <select
                      value={requestDraft.paymentPreference}
                      onChange={(event) =>
                        setRequestDraft((draft) => ({
                          ...draft,
                          paymentPreference: event.target.value as PaymentMethod,
                        }))
                      }
                    >
                      {paymentPreferences.map((preference) => (
                        <option key={preference}>{preference}</option>
                      ))}
                    </select>
                  </label>
                  <div
                    className={`payment-detail-panel ${
                      requestDraft.paymentPreference === "Cash" ? "is-disabled" : ""
                    }`}
                    aria-disabled={requestDraft.paymentPreference === "Cash"}
                  >
                    <Banknote size={18} aria-hidden="true" />
                    <span>
                      {requestDraft.paymentPreference === "Cash"
                        ? "Cash selected. Digital payment request is disabled."
                        : `${requestDraft.paymentPreference} payment can be requested after matching.`}
                    </span>
                  </div>
                  <label>
                    <span>Notes</span>
                    <textarea
                      rows={3}
                      value={requestDraft.notes}
                      onChange={(event) =>
                        setRequestDraft((draft) => ({
                          ...draft,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Passenger count, item size, gate details"
                    />
                  </label>
                  <button className="primary-button full-width" type="submit">
                    <Plus size={17} aria-hidden="true" />
                    Post request
                  </button>
                </form>
              </section>

              <section className="request-list">
                {visibleRequests.length === 0 ? (
                  <EmptyState
                    icon={CarFront}
                    title="No requests found"
                    body="Try a different search."
                  />
                ) : (
                  visibleRequests.map((request) => {
                    const requestText = [
                      request.title,
                      request.pickup,
                      request.dropoff,
                      request.notes,
                    ].join(". ");
                    return (
                    <article
                      className="request-card"
                      key={request.id}
                      onPointerCancel={() => cancelLongPress(request.id)}
                      onPointerDown={() =>
                        startLongPress(request.id, () =>
                          setRequestActionId(request.id),
                        )
                      }
                      onPointerLeave={() => cancelLongPress(request.id)}
                      onPointerUp={() => cancelLongPress(request.id)}
                    >
                      <div className="request-card-head">
                        <span className="pill">{request.type}</span>
                        <span className={`request-status ${request.status.toLowerCase()}`}>
                          {request.status}
                        </span>
                      </div>
                      <h2>{request.title}</h2>
                      <button
                        className="author-line"
                        type="button"
                        onClick={() => openProfile(request.requester)}
                      >
                        <PersonAvatar
                          image={
                            request.requesterAvatar ||
                            getProfile(request.requester).profilePicture
                          }
                          name={request.requester}
                          size={30}
                        />
                        <span>
                          Requested by <strong>{request.requester}</strong>
                        </span>
                      </button>
                      <div className="route-line">
                        <MapPin size={17} aria-hidden="true" />
                        <span>{request.pickup}</span>
                        <Route size={17} aria-hidden="true" />
                        <span>{request.dropoff}</span>
                      </div>
                      {(request.pickupMapUrl || request.dropoffMapUrl) && (
                        <div className="map-link-row">
                          {request.pickupMapUrl && (
                            <a
                              className="ghost-button mini-button link-button"
                              href={request.pickupMapUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MapPin size={14} aria-hidden="true" />
                              Pickup map
                            </a>
                          )}
                          {request.dropoffMapUrl && (
                            <a
                              className="ghost-button mini-button link-button"
                              href={request.dropoffMapUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Route size={14} aria-hidden="true" />
                              Drop off map
                            </a>
                          )}
                        </div>
                      )}
                      <p>{request.notes || "No extra notes."}</p>
                      {translatedItems[`request-${request.id}`] && (
                        <p className="translation-box">
                          {translatedItems[`request-${request.id}`]}
                        </p>
                      )}
                      {requestActionId === request.id && (
                        <div className="message-actions request-actions">
                          <button
                            type="button"
                            onClick={() =>
                              toggleTranslation(`request-${request.id}`, requestText)
                            }
                          >
                            <Languages size={14} aria-hidden="true" />
                            Translate
                          </button>
                        </div>
                      )}
                      <div className="request-meta">
                        <span>
                          <Clock3 size={15} aria-hidden="true" />
                          {formatSchedule(request.schedule)}
                        </span>
                        <span>
                          <Banknote size={15} aria-hidden="true" />
                          {request.paymentPreference ?? "Cash"}
                        </span>
                        <strong>{formatRequestBudget(request.budget, request.type)}</strong>
                      </div>
                      {request.driver && (
                        <button
                          className="driver-chip"
                          type="button"
                          onClick={() => openProfile(request.driver ?? "")}
                        >
                          <Users size={15} aria-hidden="true" />
                          Matched with {request.driver}
                        </button>
                      )}
                      <div className="card-actions">
                        {request.status === "Open" &&
                          !isCurrentUserEntity(
                            request.requesterId,
                            request.requester,
                          ) && (
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => matchRequest(request.id)}
                          >
                            <BadgeCheck size={16} aria-hidden="true" />
                            Match
                          </button>
                        )}
                        {request.status === "Matched" &&
                          request.budget > 0 &&
                          isDigitalPayment(request.paymentPreference) && (
                          <button
                            className="primary-button"
                            type="button"
                            onClick={() => requestTransportPayment(request)}
                          >
                            <QrCode size={16} aria-hidden="true" />
                            Request payment
                          </button>
                        )}
                        {request.status === "Paid" &&
                          isCurrentUserEntity(
                            request.requesterId,
                            request.requester,
                          ) && (
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => completeRequest(request.id)}
                          >
                            <CheckCircle2 size={16} aria-hidden="true" />
                            Complete
                          </button>
                        )}
                      </div>
                    </article>
                    );
                  })
                )}
              </section>
            </div>
          </section>
        )}

        {activeModule === "bus" && (
          <section className="module">
            <div className="module-heading">
              <div>
                <p className="eyebrow">UTM shuttle updates</p>
                <h1>{t("busScheduleTitle")}</h1>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => navigateToModule("requests")}
              >
                <CarFront size={17} aria-hidden="true" />
                Request transport
              </button>
            </div>

            <div className="bus-layout">
              <section className="panel bus-update-panel">
                <div className="panel-heading">
                  <h2>Route lookup</h2>
                  <CalendarClock size={18} aria-hidden="true" />
                </div>
                <div className="filter-row bus-document-tabs">
                  {busScheduleDocuments.map((document) => (
                    <button
                      className={`chip ${
                        selectedBusDocumentId === document.id ? "is-active" : ""
                      }`}
                      key={document.id}
                      type="button"
                      onClick={() => {
                        const firstRoute = busScheduleRoutes.find(
                          (route) => route.documentId === document.id,
                        );
                        setSelectedBusDocumentId(document.id);
                        setSelectedBusRouteId(firstRoute?.id ?? selectedBusRouteId);
                      }}
                    >
                      {document.title}
                    </button>
                  ))}
                </div>
                <label className="bus-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    value={busSearch}
                    onChange={(event) => setBusSearch(event.target.value)}
                    placeholder="Search route, stop, or bus code"
                  />
                </label>
                <div className="bus-route-list">
                  {visibleBusRoutes.map((route) => (
                    (() => {
                      const routeStops = uniqueBusStops(route);
                      const routeStop = routeStops.includes(activeBusStop)
                        ? activeBusStop
                        : routeStops[0] ?? "";
                      const availability = busAvailability(route, routeStop);
                      return (
                        <button
                          className={`bus-route-row ${
                            selectedBusRoute.id === route.id ? "is-active" : ""
                          }`}
                          key={route.id}
                          type="button"
                          onClick={() => setSelectedBusRouteId(route.id)}
                        >
                          <div className="bus-route-title">
                            <strong>{route.code}</strong>
                            <span
                              className={`bus-availability ${
                                availability.minutes !== null ? "is-available" : ""
                              }`}
                            >
                              {availability.label}
                            </span>
                          </div>
                          <span>{route.route}</span>
                          <small>{route.service}</small>
                        </button>
                      );
                    })()
                  ))}
                </div>
              </section>

              <section className="panel bus-timetable-panel">
                <div className="panel-heading">
                  <h2>
                    Bus {selectedBusRoute.code} · {selectedBusRoute.route}
                  </h2>
                  <span>Page {selectedBusRoute.pdfPage}</span>
                </div>
                <div className="bus-summary-strip">
                  <span className="pill">{selectedBusDocument.effective}</span>
                  <span
                    className={`bus-availability ${
                      selectedBusAvailability.minutes !== null
                        ? "is-available"
                        : ""
                    }`}
                  >
                    {selectedBusAvailability.label}
                  </span>
                  <span>{selectedBusDocument.appliesTo}</span>
                </div>
                <label className="bus-stop-select">
                  <MapPin size={16} aria-hidden="true" />
                  <span>Calculate for stop</span>
                  <select
                    value={activeBusStop}
                    onChange={(event) => setSelectedBusStop(event.target.value)}
                  >
                    {selectedBusStops.map((stop) => (
                      <option key={stop}>{stop}</option>
                    ))}
                  </select>
                </label>
                <div className="bus-stop-flow">
                  {selectedBusStops.map((stop, index) => (
                    <button
                      className={activeBusStop === stop ? "is-active" : ""}
                      key={`${selectedBusRoute.id}-${stop}-${index}`}
                      type="button"
                      onClick={() => setSelectedBusStop(stop)}
                    >
                      {stop}
                    </button>
                  ))}
                </div>
                <figure className="bus-timetable-image">
                  <img src={selectedBusRoute.pageImage} alt="" />
                </figure>
                <div className="bus-notes">
                  {selectedBusRoute.notes.map((note) => (
                    <span key={note}>{note}</span>
                  ))}
                </div>
                <div className="card-actions">
                  <a
                    className="secondary-button link-button"
                    href={selectedBusDocument.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    Open source PDF
                  </a>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => navigateToModule("map")}
                  >
                    <MapPinned size={16} aria-hidden="true" />
                    Open campus map
                  </button>
                </div>
              </section>
            </div>
          </section>
        )}

        {activeModule === "profile" && (
          <section className="module">
            <div className="module-heading">
              <div>
                <p className="eyebrow">Your campus identity</p>
                <h1>{t("profileTitle")}</h1>
              </div>
            </div>

            <div className="profile-layout">
              <section className="panel profile-card-panel">
                <div className="profile-photo">
                  {(viewingOwnProfile
                    ? profileDraft.profilePicture
                    : selectedProfile.profilePicture) ? (
                    <img
                      src={
                        viewingOwnProfile
                          ? profileDraft.profilePicture
                          : selectedProfile.profilePicture
                      }
                      alt=""
                    />
                  ) : (
                    <UserCircle size={82} aria-hidden="true" />
                  )}
                </div>
                {viewingOwnProfile && (
                  <label className="secondary-button profile-upload">
                    <Camera size={17} aria-hidden="true" />
                    Change photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={updateProfilePicture}
                    />
                  </label>
                )}
                <div className="profile-card-text">
                  <h2>
                    {viewingOwnProfile
                      ? profileDraft.name || currentDisplayName
                      : selectedProfile.name || "UTM user"}
                  </h2>
                  <p>
                    {viewingOwnProfile
                      ? profileDraft.matricNumber || "Matric number not set"
                      : selectedProfile.matricNumber || "Not shared"}
                  </p>
                  <span>
                    {viewingOwnProfile
                      ? profileDraft.faculty || "Faculty not set"
                      : selectedProfile.faculty || "Faculty not shared"}
                  </span>
                  {selectedProfile.role && <small>{selectedProfile.role}</small>}
                  <div className="profile-stats">
                    <span>
                      <Star size={14} aria-hidden="true" />
                      {selectedProfileReviews.length} reviews
                    </span>
                    <span>{selectedProfileListings.length} listings</span>
                    <span>{selectedProfileQuestions.length} questions</span>
                  </div>
                </div>
              </section>

              {viewingOwnProfile ? (
                <section className="panel profile-form-panel">
                  <div className="panel-heading">
                    <h2>Student details</h2>
                    <UserCircle size={18} aria-hidden="true" />
                  </div>
                  <div className="stacked-form">
                    <div className="two-col">
                      <label>
                        <span className="field-label-icon">
                          <UserCircle size={14} aria-hidden="true" />
                          Name
                        </span>
                        <input
                          value={profileDraft.name}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span className="field-label-icon">
                          <Phone size={14} aria-hidden="true" />
                          Contact number
                        </span>
                        <input
                          value={profileDraft.contactNumber}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              contactNumber: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className="two-col">
                      <label>
                        <span className="field-label-icon">
                          <IdCard size={14} aria-hidden="true" />
                          Matric number
                        </span>
                        <input
                          value={profileDraft.matricNumber}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              matricNumber: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span className="field-label-icon">
                          <GraduationCap size={14} aria-hidden="true" />
                          Study year
                        </span>
                        <select
                          value={profileDraft.studyYear}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              studyYear: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select study year</option>
                          <option>Foundation</option>
                          <option>Year 1</option>
                          <option>Year 2</option>
                          <option>Year 3</option>
                          <option>Year 4</option>
                          <option>Postgraduate</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      <span className="field-label-icon">
                        <Building2 size={14} aria-hidden="true" />
                        Faculty
                      </span>
                      <select
                        value={profileDraft.faculty}
                        onChange={(event) =>
                          setProfileDraft((current) => ({
                            ...current,
                            faculty: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select faculty</option>
                        {faculties
                          .filter((faculty) => faculty !== "All")
                          .map((faculty) => (
                            <option key={faculty}>{faculty}</option>
                          ))}
                      </select>
                    </label>
                    <div className="two-col">
                      <label>
                        <span className="field-label-icon">
                          <Cake size={14} aria-hidden="true" />
                          Age
                        </span>
                        <input
                          min="16"
                          type="number"
                          value={profileDraft.age}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              age: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span className="field-label-icon">
                          <Users size={14} aria-hidden="true" />
                          Sex
                        </span>
                        <select
                          value={profileDraft.sex}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              sex: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select sex</option>
                          <option>Female</option>
                          <option>Male</option>
                          <option>Prefer not to say</option>
                        </select>
                      </label>
                    </div>
                    <button
                      className="primary-button full-width"
                      type="button"
                      onClick={saveProfile}
                    >
                      <Check size={17} aria-hidden="true" />
                      {t("saveProfile")}
                    </button>
                  </div>
                </section>
              ) : (
                <section className="panel profile-form-panel">
                  <div className="panel-heading">
                    <h2>Public profile</h2>
                    <UserRound size={18} aria-hidden="true" />
                  </div>
                  <div className="profile-detail-list">
                    <span>
                      <Phone size={15} aria-hidden="true" />
                      Contact: {selectedProfile.contactNumber || "Not shared"}
                    </span>
                    <span>
                      <GraduationCap size={15} aria-hidden="true" />
                      Study year: {selectedProfile.studyYear || "Not shared"}
                    </span>
                    <span>
                      <Building2 size={15} aria-hidden="true" />
                      Faculty: {selectedProfile.faculty || "Not shared"}
                    </span>
                    <span>
                      <Cake size={15} aria-hidden="true" />
                      Age: {selectedProfile.age || "Not shared"}
                    </span>
                    <span>
                      <Users size={15} aria-hidden="true" />
                      Sex: {selectedProfile.sex || "Not shared"}
                    </span>
                  </div>
                </section>
              )}

              <section className="panel profile-reviews-panel">
                <div className="panel-heading">
                  <h2>Reviews</h2>
                  <Star size={18} aria-hidden="true" />
                </div>
                {!viewingOwnProfile && (
                  <form className="review-form" onSubmit={submitProfileReview}>
                    <select
                      value={reviewDraft.rating}
                      onChange={(event) =>
                        setReviewDraft((draft) => ({
                          ...draft,
                          rating: event.target.value,
                        }))
                      }
                    >
                      <option value="5">5 stars</option>
                      <option value="4">4 stars</option>
                      <option value="3">3 stars</option>
                      <option value="2">2 stars</option>
                      <option value="1">1 star</option>
                    </select>
                    <input
                      value={reviewDraft.body}
                      onChange={(event) =>
                        setReviewDraft((draft) => ({
                          ...draft,
                          body: event.target.value,
                        }))
                      }
                      placeholder={`Review ${selectedProfile.name}`}
                    />
                    <button className="secondary-button" type="submit">
                      <Star size={16} aria-hidden="true" />
                      Post review
                    </button>
                  </form>
                )}
                <div className="review-list">
                  {selectedProfileReviews.length === 0 ? (
                    <p className="muted">No reviews yet.</p>
                  ) : (
                    selectedProfileReviews.map((review) => (
                      <article className="review-row" key={review.id}>
                        <div>
                          <strong>
                            {"★".repeat(review.rating)}
                            {"☆".repeat(5 - review.rating)}
                          </strong>
                          <span>
                            {review.body} · {review.reviewer} ·{" "}
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </section>
        )}

        {activeModule === "settings" && (
          <section className="module">
            <div className="module-heading">
              <div>
                <p className="eyebrow">App controls</p>
                <h1>{t("settingsTitle")}</h1>
              </div>
            </div>

            <div className="settings-layout">
              <section className="panel settings-info-panel auth-inline-panel">
                <div className="panel-heading">
                  <h2>{isSignedIn ? "Account" : "Guest access"}</h2>
                  <UserCircle size={18} aria-hidden="true" />
                </div>
                <p className="muted settings-note">
                  {isSignedIn
                    ? `Signed in as ${authSession?.user.email ?? profileData.name}.`
                    : "You are browsing as a guest. Sign in to sync your data and account profile."}
                </p>
                {isSignedIn ? (
                  <button className="secondary-button full-width" type="button" onClick={signOut}>
                    <ExternalLink size={16} aria-hidden="true" />
                    Sign out
                  </button>
                ) : (
                  <button
                    className="primary-button full-width"
                    type="button"
                    onClick={() => {
                      setGuestMode(false);
                      switchAuthMode("signin");
                    }}
                  >
                    Sign in
                  </button>
                )}
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <h2>{t("appearance")}</h2>
                  <Settings size={18} aria-hidden="true" />
                </div>
                <div className="segmented-control">
                  <button
                    className={appSettings.theme === "light" ? "is-active" : ""}
                    type="button"
                    onClick={() =>
                      setSettings((current) => ({ ...current, theme: "light" }))
                    }
                  >
                    <Sun size={16} aria-hidden="true" />
                    {t("lightMode")}
                  </button>
                  <button
                    className={appSettings.theme === "dark" ? "is-active" : ""}
                    type="button"
                    onClick={() =>
                      setSettings((current) => ({ ...current, theme: "dark" }))
                    }
                  >
                    <Moon size={16} aria-hidden="true" />
                    {t("darkMode")}
                  </button>
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h2>{t("language")}</h2>
                  <Languages size={18} aria-hidden="true" />
                </div>
                <div className="language-grid">
                  {(["en", "ms", "ar", "zh"] as const).map((language) => (
                    <button
                      className={`language-option ${
                        appSettings.language === language ? "is-active" : ""
                      }`}
                      key={language}
                      type="button"
                      onClick={() =>
                        setSettings((current) => ({ ...current, language }))
                      }
                    >
                      <strong>{languageNames[language]}</strong>
                      <span>{language.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
                <p className="muted settings-note">
                  More languages coming soon. The selected language updates navigation
                  labels and page direction now.
                </p>
              </section>

              <section className="panel settings-info-panel support-panel">
                <div className="panel-heading">
                  <h2>Developer support</h2>
                  <Heart size={18} aria-hidden="true" />
                </div>
                <p className="muted settings-note">
                  Optional support for the EverythingUTM app developer only. This is
                  separate from marketplace, transport, delivery, or student payments.
                </p>
                <a
                  className="primary-button link-button full-width"
                  href={developerSupportUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Heart size={16} aria-hidden="true" />
                  Buy me a coffee
                </a>
              </section>

              <section className="panel settings-info-panel">
                <div className="panel-heading">
                  <h2>{t("privacySafety")}</h2>
                  <ShieldCheck size={18} aria-hidden="true" />
                </div>
                <p className="muted settings-note">
                  Keep personal details minimal and never post passwords, bank
                  credentials, IC/passport photos, house keys, or private student
                  documents in public chats. Marketplace meetups should happen in
                  visible campus areas, preferably during daytime. For rides and
                  delivery, confirm the requester, route, price, and pickup point
                  before moving. Paper uploads stay hidden until owner approval to
                  reduce spam, copyrighted leaks, and unsafe files.
                </p>
              </section>

              <section className="panel settings-info-panel">
                <div className="panel-heading">
                  <h2>{t("terms")}</h2>
                  <FileText size={18} aria-hidden="true" />
                </div>
                <p className="muted settings-note">
                  EverythingUTM is a campus coordination tool, not an official UTM
                  authority, escrow service, transport company, bank, or file host.
                  Users are responsible for truthful listings, lawful sharing of
                  past papers, respectful chat behavior, and checking QR/account
                  details before paying. Do not impersonate staff, sell prohibited
                  items, harass users, upload malicious files, or share exam content
                  that your faculty has not allowed to circulate.
                </p>
              </section>

              <section className="panel settings-info-panel">
                <div className="panel-heading">
                  <h2>{t("helpCenter")}</h2>
                  <HelpCircle size={18} aria-hidden="true" />
                </div>
                <div className="help-list">
                  <article>
                    <strong>How do I buy safely?</strong>
                    <p>Press Buy, continue in private chat, verify the seller, then scan the seller's QR or account details only after both sides agree.</p>
                  </article>
                  <article>
                    <strong>Why is my paper not visible?</strong>
                    <p>Community uploads wait for owner review first. Approved files become visible in the Past Papers list.</p>
                  </article>
                  <article>
                    <strong>Can I answer a resolved question?</strong>
                    <p>No. Resolved questions are locked so the accepted answer does not keep drifting.</p>
                  </article>
                  <a
                    className="primary-button link-button"
                    href="mailto:Hammau05@gmail.com?subject=EverythingUTM%20Help%20Request"
                  >
                    <Send size={16} aria-hidden="true" />
                    Contact owner
                  </a>
                </div>
              </section>

              <section className="panel settings-info-panel">
                <div className="panel-heading">
                  <h2>{t("reportBug")}</h2>
                  <Bug size={18} aria-hidden="true" />
                </div>
                <textarea
                  rows={4}
                  value={bugReportDraft}
                  onChange={(event) => setBugReportDraft(event.target.value)}
                />
                <button
                  className="secondary-button"
                  type="button"
                  onClick={submitBugReport}
                >
                  <Send size={16} aria-hidden="true" />
                  {t("reportBug")}
                </button>
              </section>

              <section className="panel danger-zone">
                <div className="panel-heading">
                  <h2>{t("deleteAccount")}</h2>
                  <Trash2 size={18} aria-hidden="true" />
                </div>
                <p>{t("deleteWarning")}</p>
                {deleteAccountArmed && (
                  <label className="delete-confirm-field">
                    <span>Type DELETE to confirm</span>
                    <input
                      value={deleteConfirmText}
                      onChange={(event) => setDeleteConfirmText(event.target.value)}
                    />
                  </label>
                )}
                <button
                  className="danger-button"
                  type="button"
                  onClick={deleteLocalAccount}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {deleteAccountArmed ? "Confirm delete account" : t("deleteAccount")}
                </button>
              </section>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
