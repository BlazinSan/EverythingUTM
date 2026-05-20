import type { LucideIcon } from "lucide-react";

export type PaymentMethod =
  | "DuitNow QR"
  | "TnG wallet"
  | "Bank Transfer"
  | "Cash";

export type ModuleKey =
  | "home"
  | "marketplace"
  | "map"
  | "community"
  | "qa"
  | "papers"
  | "requests"
  | "bus"
  | "family"
  | "reels"
  | "profile"
  | "admin"
  | "settings"
  | "notifications";

export type NavItem = {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
};

export type MarketplaceItem = {
  id: string;
  title: string;
  category: string;
  price: number;
  seller: string;
  sellerId?: string;
  sellerAvatar?: string;
  location: string;
  fulfillment?: "Pickup" | "Delivery";
  condition: "New" | "Fresh" | "Slightly Used" | "Good" | "Barely holding on";
  paymentPreference?: PaymentMethod;
  description: string;
  image: string;
  images?: string[];
  tags: string[];
  createdAt: string;
  sold?: boolean;
  soldAt?: string;
};

export type CampusLocation = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  area: string;
  blurb: string;
  bestFor: string[];
};

export type ChatMessage = {
  id: string;
  channel: string;
  author: string;
  authorId?: string;
  authorAvatar?: string;
  replyTo?: {
    id: string;
    author: string;
    content: string;
  };
  content: string;
  image?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  time: string;
  editedAt?: string;
  likedBy?: string[];
  reactions?: Record<string, string[]>;
};

export type Answer = {
  id: string;
  author: string;
  authorId?: string;
  authorAvatar?: string;
  body: string;
  image?: string;
  helpful: number;
  helpfulBy?: string[];
  time: string;
};

export type Question = {
  id: string;
  title: string;
  body: string;
  author: string;
  authorId?: string;
  authorAvatar?: string;
  image?: string;
  tags: string[];
  votes: number;
  resolved: boolean;
  createdAt?: string;
  editedAt?: string;
  answers: Answer[];
};

export type PastPaper = {
  id: string;
  code: string;
  title: string;
  faculty: string;
  year: string;
  semester: string;
  type: string;
  uploader: string;
  fileName: string;
  fileSize: string;
  dataUrl?: string;
  externalUrl?: string;
  sourceDrive?: string;
  status?: "Pending Review" | "Approved" | "Rejected";
  downloads: number;
};

export type ExternalDrive = {
  id: string;
  name: string;
  owner: string;
  url: string;
  description: string;
};

export type ServiceRequest = {
  id: string;
  type: "Ride" | "Delivery";
  title: string;
  requester: string;
  requesterId?: string;
  requesterAvatar?: string;
  pickup: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupMapUrl?: string;
  dropoff: string;
  dropoffLat?: number;
  dropoffLng?: number;
  dropoffMapUrl?: string;
  schedule: string;
  budget: number;
  paymentPreference?: PaymentMethod;
  notes: string;
  status: "Open" | "Matched" | "Paid" | "Completed";
  createdAt?: string;
  editedAt?: string;
  driver?: string;
  driverId?: string;
  driverAvatar?: string;
  paymentId?: string;
};

export type Profile = {
  username?: string;
  profileSaved?: boolean;
  name: string;
  role: string;
  contactNumber: string;
  matricNumber: string;
  studyYear: string;
  faculty: string;
  age: string;
  sex: string;
  profilePicture: string;
  wallet: number;
};

export type ProfileReview = {
  id: string;
  profileName: string;
  reviewer: string;
  reviewerAvatar?: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type BusScheduleDocument = {
  id: string;
  title: string;
  sourceName: string;
  effective: string;
  appliesTo: string;
  fileUrl: string;
  summary: string;
  notes: string[];
};

export type BusScheduleRoute = {
  id: string;
  documentId: string;
  code: string;
  route: string;
  service: string;
  directions: string[];
  pageImage: string;
  pdfPage: number;
  notes: string[];
};

export type LanguageCode = "en" | "ms" | "ar" | "zh";

export type AppSettings = {
  theme: "light" | "dark";
  language: LanguageCode;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  module: ModuleKey;
  read: boolean;
  timestamp: string;
};
