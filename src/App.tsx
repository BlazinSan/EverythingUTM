import {
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
  BadgeCheck,
  Banknote,
  Bug,
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
  Heart,
  HelpCircle,
  Home,
  ImagePlus,
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
  seedMarketplace,
  seedMessages,
  seedPapers,
  seedProfileReviews,
  seedProfiles,
  seedQuestions,
  seedRequests,
} from "./data";
import {
  isSupabaseConfigured,
  loadSupabaseState,
  saveSupabaseState,
} from "./lib/supabase";
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

const seedNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Welcome to EverythingUTM",
    body: "Your campus hub is ready. Add a listing, ask a question, or request a ride.",
    module: "home",
    read: false,
    timestamp: "2026-05-15T08:00:00.000Z",
  },
  {
    id: "notif-2",
    title: "Delivery request waiting",
    body: "A PSZ printout delivery is matched and waiting for payment.",
    module: "requests",
    read: false,
    timestamp: "2026-05-15T11:35:00.000Z",
  },
];

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
  budget: "Ride along for free",
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
  if (!value.trim() || /free/i.test(value.trim())) {
    return 0;
  }
  return Number(value.replace(/[^\d.]/g, "")) || 0;
}

function budgetInputLabel(type: ServiceRequest["type"]) {
  return type === "Delivery" ? "Free delivery" : "Ride along for free";
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
    `Pickup/area: ${item.location}`,
    `Seller: ${item.seller}`,
    item.description,
    `Open in app: ${listingShareUrl(item.id)}`,
  ].join("\n");
}

function googleMapsUrlFor(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
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
  return /free/i.test(value.trim()) || value.trim() === "0"
    ? budgetInputLabel(type)
    : value;
}

function translatePreview(text: string, language: LanguageCode) {
  if (!text.trim()) {
    return "";
  }
  const label = languageNames[language] ?? "selected language";
  return `Translated to ${label}: ${text}`;
}

const developerSupportUrl =
  import.meta.env.VITE_BUY_ME_COFFEE_URL ||
  "https://www.buymeacoffee.com/blazinsan";

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [supabaseLoaded, setSupabaseLoaded] = useState(!isSupabaseConfigured);
  const [state, setState] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let cancelled = false;
    loadSupabaseState<T>(key)
      .then((stored) => {
        if (cancelled) {
          return;
        }
        if (stored !== null) {
          setState(stored);
        }
        setSupabaseLoaded(true);
      })
      .catch(() => setSupabaseLoaded(true));

    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Local storage can fail in private windows or if file uploads are very large.
    }

    if (supabaseLoaded) {
      saveSupabaseState(key, state).catch(() => {
        // Keep the app usable offline or before Supabase policies are configured.
      });
    }
  }, [key, state, supabaseLoaded]);

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
  >("everything-utm:profile-reviews", seedProfileReviews);
  const [marketplace, setMarketplace] = useLocalStorageState<MarketplaceItem[]>(
    "everything-utm:marketplace",
    seedMarketplace,
  );
  const [favourites, setFavourites] = useLocalStorageState<string[]>(
    "everything-utm:favourites",
    [],
  );
  const [messages, setMessages] = useLocalStorageState<ChatMessage[]>(
    "everything-utm:messages",
    seedMessages,
  );
  const [questions, setQuestions] = useLocalStorageState<Question[]>(
    "everything-utm:questions",
    seedQuestions,
  );
  const [papers, setPapers] = useLocalStorageState<PastPaper[]>(
    "everything-utm:papers",
    seedPapers,
  );
  const [requests, setRequests] = useLocalStorageState<ServiceRequest[]>(
    "everything-utm:requests",
    seedRequests,
  );

  const [marketCategory, setMarketCategory] = useState("All");
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
  const [busSearch, setBusSearch] = useState("");
  const [profileDraft, setProfileDraft] = useState<Profile>({
    ...appUser,
    ...profile,
  });
  const [selectedProfileName, setSelectedProfileName] = useState(profile.name);
  const [reviewDraft, setReviewDraft] = useState({ rating: "5", body: "" });
  const [deleteAccountArmed, setDeleteAccountArmed] = useState(false);
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const longPressTimers = useRef<Record<string, number>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);

  const profileData: Profile = { ...appUser, ...profile };
  const appSettings: AppSettings = {
    ...defaultSettings,
    ...settings,
  };
  const t = (key: string) =>
    uiText[appSettings.language]?.[key] ?? uiText.en[key] ?? key;
  const search = normalize(query);
  const unreadCount = notifications.filter((item) => !item.read).length;
  const isOwner = profileData.matricNumber === appUser.matricNumber;
  const activeModuleIndex = navItems.findIndex((item) => item.key === activeModule);
  const profileDirectory = useMemo(() => {
    const directory = new Map<string, Profile>();
    seedProfiles.forEach((person) => directory.set(person.name, person));
    directory.set(profileData.name, profileData);
    directory.set(appUser.name, { ...appUser, ...profileData });
    return directory;
  }, [profileData]);
  const getProfile = (name: string) =>
    profileDirectory.get(name) ?? {
      ...appUser,
      name,
      role: "UTM community member",
      contactNumber: "Not shared",
      matricNumber: "Not shared",
      profilePicture: "",
      wallet: 0,
    };
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
    selectedProfile.name === profileData.name ||
    selectedProfile.matricNumber === profileData.matricNumber;

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
    setProfileDraft({ ...appUser, ...profile });
  }, [profile]);

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

  const favouriteItems = useMemo(
    () =>
      favourites
        .map((itemId) => marketplace.find((listing) => listing.id === itemId))
        .filter((item): item is MarketplaceItem => Boolean(item)),
    [favourites, marketplace],
  );

  const visibleMarketplace = useMemo(() => {
    return marketplace.filter((item) => {
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
  }, [favourites, marketCategory, marketplace, search]);

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
    return questions.filter((question) => {
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
  }, [questions, search]);

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

  function navigateToModule(module: ModuleKey) {
    const nextIndex = navItems.findIndex((item) => item.key === module);
    setPageDirection(
      nextIndex >= activeModuleIndex || nextIndex === -1 ? "forward" : "back",
    );
    setActiveModuleState(module);
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

  function toggleTranslation(key: string, text: string) {
    setTranslatedItems((current) => {
      if (current[key]) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return {
        ...current,
        [key]: translatePreview(text, appSettings.language),
      };
    });
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
      mediaRecorderRef.current?.stop();
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
    setSelectedProfileName(name);
    setProfileDraft({ ...getProfile(name) });
    navigateToModule("profile");
  }

  function openOwnProfile() {
    setSelectedProfileName(profileData.name);
    setProfileDraft({ ...profileData });
    navigateToModule("profile");
  }

  function buyListing(item: MarketplaceItem) {
    const channel = `${t("privateChat")}: ${item.seller}`;
    const content = `Hi ${item.seller}, I would like to buy "${item.title}". Please send me your preferred payment QR or account number.`;
    const message: ChatMessage = {
      id: uid("msg"),
      channel,
      author: profileData.name,
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
      seller: profileData.name,
      sellerId: profileData.matricNumber,
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
    };

    setMarketplace((current) => [item, ...current]);
    setListingDraft(initialListing);
    setListingImages([]);
    showNotice("Listing published");
    addNotification("Listing published", `${item.title} is now live in Marketplace.`, "marketplace");
  }

  function beginEditListing(item: MarketplaceItem) {
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
    setMarketplace((current) => current.filter((item) => item.id !== itemId));
    setFavourites((current) => current.filter((id) => id !== itemId));
    setSelectedListingId(null);
    setImageViewerListingId(null);
    showNotice("Listing deleted");
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
      showNotice("Message needs text or a picture", "error");
      return;
    }
    const message: ChatMessage = {
      id: uid("msg"),
      channel: activeChannel,
      author: profileData.name,
      authorId: profileData.matricNumber,
      authorAvatar: profileData.profilePicture,
      content: messageDraft.trim(),
      image: messageImage,
      voiceUrl: messageVoice,
      voiceDuration: messageVoiceDuration,
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
        const liked = likedBy.includes(profileData.matricNumber);
        return {
          ...message,
          likedBy: liked
            ? likedBy.filter((id) => id !== profileData.matricNumber)
            : [...likedBy, profileData.matricNumber],
        };
      }),
    );
  }

  function reactToMessage(messageId: string, reaction: string) {
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId) return message;
        const reactions = message.reactions ?? {};
        const users = reactions[reaction] ?? [];
        const reacted = users.includes(profileData.matricNumber);
        return {
          ...message,
          reactions: {
            ...reactions,
            [reaction]: reacted
              ? users.filter((id) => id !== profileData.matricNumber)
              : [...users, profileData.matricNumber],
          },
        };
      }),
    );
    setMessageActionId(null);
  }

  function beginEditMessage(message: ChatMessage) {
    setEditingMessageId(message.id);
    setMessageEditDraft(message.content);
    setMessageActionId(null);
  }

  function saveMessageEdit(messageId: string) {
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
      author: profileData.name,
      authorId: profileData.matricNumber,
      authorAvatar: profileData.profilePicture,
      image: questionImage,
      tags: compactTags(questionDraft.tags),
      votes: 0,
      resolved: false,
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
                  author: profileData.name,
                  authorId: profileData.matricNumber,
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
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, resolved: !question.resolved }
          : question,
      ),
    );
  }

  function beginEditQuestion(question: Question) {
    setEditingQuestionId(question.id);
    setQuestionEditDraft({
      title: question.title,
      body: question.body,
      tags: question.tags.join(", "),
    });
    setQuestionActionId(null);
  }

  function saveQuestionEdit(questionId: string) {
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
                      const alreadyHelpful = helpedBy.includes(profileData.matricNumber);
                      return {
                        ...answer,
                        helpful: Math.max(
                          0,
                          answer.helpful + (alreadyHelpful ? -1 : 1),
                        ),
                        helpfulBy: alreadyHelpful
                          ? helpedBy.filter((id) => id !== profileData.matricNumber)
                          : [...helpedBy, profileData.matricNumber],
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
        uploader: profileData.name,
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
      budget: budgetInputLabel("Ride"),
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

    const request: ServiceRequest = {
      id: uid("req"),
      type: requestDraft.type,
      title: requestDraft.title.trim(),
      requester: profileData.name,
      requesterId: profileData.matricNumber,
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
              driver: profileData.name,
              driverId: profileData.matricNumber,
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
      author: profileData.name,
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
    const previousName = profileData.name;
    const nextProfile = { ...profileDraft };
    setMarketplace((current) =>
      current.map((item) =>
        item.seller === previousName || item.sellerId === profileData.matricNumber
          ? {
              ...item,
              seller: nextProfile.name,
              sellerId: nextProfile.matricNumber,
              sellerAvatar: nextProfile.profilePicture,
            }
          : item,
      ),
    );
    setMessages((current) =>
      current.map((message) =>
        message.author === previousName || message.authorId === profileData.matricNumber
          ? {
              ...message,
              author: nextProfile.name,
              authorId: nextProfile.matricNumber,
              authorAvatar: nextProfile.profilePicture,
            }
          : message,
      ),
    );
    setQuestions((current) =>
      current.map((question) => ({
        ...question,
        author:
          question.author === previousName || question.authorId === profileData.matricNumber
            ? nextProfile.name
            : question.author,
        authorId:
          question.author === previousName || question.authorId === profileData.matricNumber
            ? nextProfile.matricNumber
            : question.authorId,
        authorAvatar:
          question.author === previousName || question.authorId === profileData.matricNumber
            ? nextProfile.profilePicture
            : question.authorAvatar,
        answers: question.answers.map((answer) =>
          answer.author === previousName || answer.authorId === profileData.matricNumber
            ? {
                ...answer,
                author: nextProfile.name,
                authorId: nextProfile.matricNumber,
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
          request.requester === previousName || request.requesterId === profileData.matricNumber
            ? nextProfile.name
            : request.requester,
        requesterId:
          request.requester === previousName || request.requesterId === profileData.matricNumber
            ? nextProfile.matricNumber
            : request.requesterId,
        requesterAvatar:
          request.requester === previousName || request.requesterId === profileData.matricNumber
            ? nextProfile.profilePicture
            : request.requesterAvatar,
        driver:
          request.driver === previousName || request.driverId === profileData.matricNumber
            ? nextProfile.name
            : request.driver,
        driverId:
          request.driver === previousName || request.driverId === profileData.matricNumber
            ? nextProfile.matricNumber
            : request.driverId,
        driverAvatar:
          request.driver === previousName || request.driverId === profileData.matricNumber
            ? nextProfile.profilePicture
            : request.driverAvatar,
      })),
    );
    setProfile(nextProfile);
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
      reviewer: profileData.name,
      reviewerAvatar: profileData.profilePicture,
      rating: Number(reviewDraft.rating) || 5,
      body: reviewDraft.body.trim(),
      createdAt: new Date().toISOString(),
    };
    setProfileReviews((current) => [review, ...current]);
    setReviewDraft({ rating: "5", body: "" });
    showNotice("Review posted");
  }

  function deleteLocalAccount() {
    if (!deleteAccountArmed) {
      setDeleteAccountArmed(true);
      showNotice("Press delete again to confirm", "error");
      return;
    }
    window.localStorage.clear();
    setDeleteAccountArmed(false);
    window.location.reload();
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
                name={profileData.name}
                size={34}
              />
              <span>{profileData.name}</span>
              <small>{profileData.faculty}</small>
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
                <small>{favouriteItems.length} favourites</small>
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
              <article className="metric-card">
                <Heart size={20} aria-hidden="true" />
                <span>{t("savedFavourites")}</span>
                <strong>{favouriteItems.length}</strong>
                <small>Marketplace items</small>
              </article>
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
                        <strong>{request.title}</strong>
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
                      value={listingDraft.location}
                      onChange={(event) =>
                        setListingDraft((draft) => ({
                          ...draft,
                          location: event.target.value,
                        }))
                      }
                    />
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
                        className="product-card clickable-card"
                        key={item.id}
                        onClick={() => setSelectedListingId(item.id)}
                      >
                        <img src={item.image} alt="" loading="lazy" />
                        <div className="product-body">
                          <div className="card-title-row">
                            <span className="pill">{item.category}</span>
                            <strong>{formatListingPrice(item.price)}</strong>
                          </div>
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
                              onClick={(event) => {
                                event.stopPropagation();
                                buyListing(item);
                              }}
                            >
                              <ShoppingBag size={17} aria-hidden="true" />
                              {t("buy")}
                            </button>
                          </div>
                          {(item.seller === profileData.name ||
                            item.sellerId === profileData.matricNumber ||
                            isOwner) && (
                            <div className="card-actions compact-actions">
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
              className="detail-modal listing-detail-modal"
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
                <span className="pill">{selectedListing.category}</span>
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
                    onClick={() => buyListing(selectedListing)}
                  >
                    <ShoppingBag size={17} aria-hidden="true" />
                    {t("buy")}
                  </button>
                </div>
                {(selectedListing.seller === profileData.name ||
                  selectedListing.sellerId === profileData.matricNumber ||
                  isOwner) && (
                  <div className="card-actions">
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
          <section className="module">
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
                    const liked = (message.likedBy ?? []).includes(
                      profileData.matricNumber,
                    );
                    const reactionEntries = Object.entries(
                      message.reactions ?? {},
                    ).filter(([, users]) => users.length > 0);
                    const canManage = message.author === profileData.name || isOwner;
                    return (
                      <article
                        className={`message-bubble ${
                          message.author === profileData.name ? "is-mine" : ""
                        }`}
                        key={message.id}
                        onDoubleClick={() => toggleMessageHeart(message.id)}
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
                          {(message.likedBy?.length ?? 0) > 0 && (
                            <button
                              className={`reaction-chip ${liked ? "is-active" : ""}`}
                              type="button"
                              onClick={() => toggleMessageHeart(message.id)}
                            >
                              <Heart size={14} aria-hidden="true" />
                              {message.likedBy?.length}
                            </button>
                          )}
                          {reactionEntries.map(([reaction, users]) => (
                            <button
                              className="reaction-chip"
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
                  <button
                    className="ghost-button mini-button voice-ready-chip"
                    type="button"
                    onClick={clearVoiceMessage}
                  >
                    <Mic size={14} aria-hidden="true" />
                    {messageVoiceDuration}s
                    <X size={13} aria-hidden="true" />
                  </button>
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
                          {question.author === profileData.name ? (
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
                            {(question.author === profileData.name || isOwner) && (
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
                            {(question.author === profileData.name || isOwner) && (
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
                              profileData.matricNumber,
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
                    <button
                      className="secondary-button full-width"
                      type="button"
                      onClick={locateMeForRequest}
                    >
                      <Navigation size={16} aria-hidden="true" />
                      Locate me for pickup
                    </button>
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
                          }))
                        }
                      >
                        {dayOfWeekOptions.map((day) => (
                          <option key={day}>{day}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Time</span>
                      <input
                        type="time"
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
                      <input
                        inputMode="decimal"
                        value={requestDraft.budget}
                        onFocus={() =>
                          setRequestDraft((draft) => ({
                            ...draft,
                            budget: /free/i.test(draft.budget) ? "" : draft.budget,
                          }))
                        }
                        onBlur={() =>
                          setRequestDraft((draft) => ({
                            ...draft,
                            budget: draft.budget.trim()
                              ? draft.budget
                              : budgetInputLabel(draft.type),
                          }))
                        }
                        onChange={(event) =>
                          setRequestDraft((draft) => ({
                            ...draft,
                            budget: event.target.value,
                          }))
                        }
                      />
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
                          request.requester !== profileData.name &&
                          request.requesterId !== profileData.matricNumber && (
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
                          (request.requester === profileData.name ||
                            request.requesterId === profileData.matricNumber) && (
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
                    <button
                      className={`bus-route-row ${
                        selectedBusRoute.id === route.id ? "is-active" : ""
                      }`}
                      key={route.id}
                      type="button"
                      onClick={() => setSelectedBusRouteId(route.id)}
                    >
                      <strong>{route.code}</strong>
                      <span>{route.route}</span>
                      <small>{route.service}</small>
                    </button>
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
                  <span>{selectedBusDocument.appliesTo}</span>
                </div>
                <div className="bus-stop-flow">
                  {selectedBusRoute.directions.map((stop, index) => (
                    <span key={`${selectedBusRoute.id}-${stop}-${index}`}>
                      {stop}
                    </span>
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
                  <h2>{viewingOwnProfile ? profileDraft.name : selectedProfile.name}</h2>
                  <p>
                    {viewingOwnProfile
                      ? profileDraft.matricNumber
                      : selectedProfile.matricNumber}
                  </p>
                  <span>
                    {viewingOwnProfile ? profileDraft.faculty : selectedProfile.faculty}
                  </span>
                  <small>{selectedProfile.role}</small>
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
                        <span>Name</span>
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
                        <span>Contact number</span>
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
                        <span>Matric number</span>
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
                        <span>Study year</span>
                        <select
                          value={profileDraft.studyYear}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              studyYear: event.target.value,
                            }))
                          }
                        >
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
                      <span>Faculty</span>
                      <select
                        value={profileDraft.faculty}
                        onChange={(event) =>
                          setProfileDraft((current) => ({
                            ...current,
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
                    <div className="two-col">
                      <label>
                        <span>Age</span>
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
                        <span>Sex</span>
                        <select
                          value={profileDraft.sex}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              sex: event.target.value,
                            }))
                          }
                        >
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
                    <span>Contact: {selectedProfile.contactNumber}</span>
                    <span>Study year: {selectedProfile.studyYear}</span>
                    <span>Faculty: {selectedProfile.faculty}</span>
                    <span>Age: {selectedProfile.age || "Not shared"}</span>
                    <span>Sex: {selectedProfile.sex || "Not shared"}</span>
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
                  placeholder="Describe the issue, page, and steps to reproduce"
                />
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    showNotice("Bug report saved for owner review");
                    addNotification("Bug report received", "Thanks for the report.", "settings");
                  }}
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
