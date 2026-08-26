import React, { useState, useEffect, useMemo, Component, useRef } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  Building2,
  Folder,
  FolderOpen,
  Clock,
  ClipboardList,
  LogOut,
  Search,
  Plus,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Users as UsersIcon,
  AlertCircle,
  AlertTriangle,
  Activity,
  UserPlus,
  Trash2,
  MapPin,
  Edit,
  User,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Loader2,
  Download,
  Bell,
  Menu,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List,
  FileQuestion,
  FileX,
  Award,
  Building,
  Layout,
  Bath,
  Maximize2,
  Minimize2,
  X,
  CheckCircle2,
  Info,
  Calendar,
  Home,
  Layers,
  IndianRupee,
  Check,
  Star,
  RefreshCw,
  Minus,
  Mail,
  Send,
  Key,
  Settings,
  Maximize,
  Minimize,
  Moon,
  Sun,
  Monitor,
  Type,
  Zap,
  Globe,
  Palette,
  Save,
  Volume2,
  HelpCircle,
  Keyboard,
  BarChart as BarChartIcon,
  Database as DatabaseIcon,
  Smartphone,
  Sparkles,
  Percent,
  Server,
  Terminal,
  Copy,
  Cpu,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  QrCode,
  Phone,
  Camera,
  Share2,
  History,
  Lock,
  BadgeCheck,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import Markdown from "react-markdown";
import QRCode from "qrcode";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

import { ProjectForm, defaultPaymentPlans } from "./components/ProjectForm";
import { ResalePropertyForm } from "./components/ResalePropertyForm";
import ProjectMapView from "./components/ProjectMapView";
import { PdfFile } from "./components/PdfUpload";
import { ProgressRoadmap } from "./components/ProgressRoadmap";
import { CredentialManager } from "./components/credentials/CredentialManager";
import { CredentialForm } from "./components/credentials/CredentialForm";
import { CredentialGenerationCard } from "./components/credentials/CredentialGenerationCard";
import { UserCredentials } from "./components/credentials/types";
import {
  LoginForm,
  ForgotPasswordForm,
} from "./components/credentials/AuthScreens";
import { MediaExplorer } from "./components/MediaExplorer";
import { InlineImageCarousel } from "./components/InlineImageCarousel";
import { DeveloperPortfolioModal } from "./components/DeveloperPortfolioModal";

// --- Types ---
const HighlightText = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  if (!highlight) return React.createElement("span", null, text);
  try {
    const escaped = highlight.replace(
      /[-\/\\^$*+?.()|[\]{}]/g,
      (m) => "\\" + m,
    );
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return React.createElement(
      "span",
      null,
      ...parts.map((part, i) =>
        regex.test(part)
          ? React.createElement(
              "mark",
              {
                key: i,
                className:
                  "bg-amber-primary/30 text-amber-primary font-bold rounded-sm px-0.5",
              },
              part,
            )
          : part,
      ),
    );
  } catch (e) {
    return React.createElement("span", null, text);
  }
};

type Role = "admin" | "employee" | "team_leader";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  status?: "Active" | "Pending Approval" | "Rejected" | "Pending";
  mustResetPassword?: boolean;
  lastActive?: string;
  profilePicture?: string;
  phoneNumber?: string;
  permissions?: string[];
  teamLeaderId?: string;
  favorites?: string[];
}

interface Project {
  id: string;
  title: string;
  type: string;
  configuration?: string;
  possessionStatus: "Ready to Move" | "Under Construction" | "New Launch";
  price: number;
  location: string;
  status: "Active" | "Sold" | "Pending" | "PENDING_DELETE";
  isFavorite?: boolean;
  area: string;
  bathrooms?: string;
  sector?: string;
  microMarket?: string;
  coordinates?: { lat: number; lng: number };
  builderName?: string;
  projectType?: "Residential" | "Commercial";
  subType?: string;
  launchDate?: string;
  possessionDate?: string;
  projectSize?: string;
  towersAndFloors?: string;
  noOfTowers?: string;
  noOfFloors?: string;
  totalUnits?: string;
  sizeRange?: string;
  reraNumber: string;
  pdfs?: { name: string; size: number; data: string }[];
  images?: { name: string; size: number; data: string }[];
  paymentPlans?: any;
  notes?: string;
  createdAt: string;
  assignedTo?: string;
}

interface ResaleProperty {
  id: string;
  propertyHolderName: string;
  societyName: string;
  location: string;
  builderName: string;
  propertyType: string;
  sizeSqft: number;
  bhk: string;
  possessionStatus: "Ready to Move" | "Under Construction";
  possessionDate?: string;
  bathrooms?: string;
  price: number;
  isNegotiable: "YES" | "NO";
  floorNumber: string;
  propertyAge: string;
  constructionYear?: number;
  reraNumber?: string;
  floorPlan?: PdfFile[];
  images?: { name: string; size: number; data: string }[];
  brokeragePercentage: number;
  contactNumber?: string;
  coordinates?: { lat: number; lng: number };
  status: "Active" | "Sold" | "Pending" | "PENDING_DELETE";
  createdAt: string;
}

interface Report {
  id: string;
  title: string;
  content: string;
  assignedTo: string;
  status: "Draft" | "Final" | "Archived";
  createdAt: string;
  updatedAt: string;
}

// --- Permissions ---
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "MANAGE_USERS",
    "VIEW_PROJECTS",
    "ADD_PROJECTS",
    "EDIT_PROJECTS",
    "DELETE_PROJECTS",
    "APPROVE_DELETIONS",
    "VIEW_LOGS",
    "VIEW_STATS",
    "VIEW_RESALE",
    "ADD_RESALE",
    "EDIT_RESALE",
    "DELETE_RESALE",
    "MANAGE_PERMISSIONS",
    "MANAGE_TEAM",
    "VIEW_REPORTS",
    "ADD_REPORTS",
    "EDIT_REPORTS",
    "DELETE_REPORTS",
  ],
  team_leader: [
    "VIEW_PROJECTS",
    "ADD_PROJECTS",
    "REQUEST_DELETION",
    "VIEW_STATS",
    "VIEW_RESALE",
    "ADD_RESALE",
    "MANAGE_TEAM",
    "VIEW_REPORTS",
    "ADD_REPORTS",
    "EDIT_REPORTS",
    "DELETE_REPORTS",
  ],
  employee: [
    "VIEW_PROJECTS",
    "VIEW_RESALE",
    "ADD_PROJECTS",
    "REQUEST_DELETION",
    "VIEW_REPORTS",
    "EDIT_REPORTS",
  ],
};

const PERMISSION_CATEGORIES = [
  {
    name: "User Management",
    permissions: ["MANAGE_USERS", "MANAGE_PERMISSIONS", "MANAGE_TEAM"],
  },
  {
    name: "Project Management",
    permissions: [
      "VIEW_PROJECTS",
      "ADD_PROJECTS",
      "EDIT_PROJECTS",
      "DELETE_PROJECTS",
      "APPROVE_DELETIONS",
      "REQUEST_DELETION",
    ],
  },
  {
    name: "Listing Projects Management",
    permissions: ["VIEW_RESALE", "ADD_RESALE", "EDIT_RESALE", "DELETE_RESALE"],
  },
  {
    name: "Report Management",
    permissions: [
      "VIEW_REPORTS",
      "ADD_REPORTS",
      "EDIT_REPORTS",
      "DELETE_REPORTS",
    ],
  },
  {
    name: "System & Analytics",
    permissions: ["VIEW_LOGS", "VIEW_STATS"],
  },
];

const hasPermission = (user: User | null, permission: string) => {
  if (!user) return false;
  if (user.permissions && user.permissions.includes(permission)) return true;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, badge, className = "" }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 group ${
      active
        ? "bg-amber-primary/10 border border-amber-primary/30 text-amber-primary"
        : "text-text-secondary hover:bg-surface-2 hover:text-text-primary border border-transparent"
    } ${className}`}
  >
    <Icon
      size={18}
      className={
        active
          ? "text-amber-primary"
          : "text-text-dim group-hover:text-text-secondary"
      }
    />
    <span className="text-[13px] font-medium">{label}</span>
    {badge > 0 && (
      <span className="ml-auto bg-amber-primary text-black font-black text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm animate-breathe">
        {badge}
      </span>
    )}
  </button>
);

const KpiCard = ({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  color = "amber",
  externalLink,
}: any) => {
  const colorThemes: any = {
    amber: {
      text: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/25",
      glow: "from-amber-500/15 via-amber-500/5 to-transparent",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    blue: {
      text: "text-sky-400",
      bg: "bg-sky-400/10",
      border: "border-sky-400/25",
      glow: "from-sky-500/15 via-sky-500/5 to-transparent",
      badge: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    },
    green: {
      text: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/25",
      glow: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    purple: {
      text: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/25",
      glow: "from-purple-500/15 via-purple-500/5 to-transparent",
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    red: {
      text: "text-rose-400",
      bg: "bg-rose-400/10",
      border: "border-rose-400/25",
      glow: "from-rose-500/15 via-rose-500/5 to-transparent",
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    },
  };

  const theme = colorThemes[color] || colorThemes.amber;

  const CardContent = (
    <>
      <div
        className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${theme.glow} rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme.bg} ${theme.border} ${theme.text} transition-transform group-hover:scale-110 shadow-sm backdrop-blur-sm`}
          >
            {Icon && <Icon size={18} />}
          </div>
          {trend !== undefined && trend !== null && (
            <div
              className={`flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${
                trend > 0
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }`}
            >
              {trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              <span>{trend > 0 ? `+${trend}%` : `${trend}%`}</span>
            </div>
          )}
          {externalLink && (
            <div className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 group-hover:bg-emerald-500 group-hover:text-black transition-all shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse group-hover:bg-black" />
              <span>LIVE BUCKET</span>
              <ExternalLink size={10} />
            </div>
          )}
          {typeof label === "string" && (label.toLowerCase().includes("pending") || label.toLowerCase().includes("approval")) && Number(value) > 0 && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-sm animate-breathe">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-breathe-dot" />
              <span>Action Req</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-mono font-bold flex items-center justify-between">
            <span>{label}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-sans">
            {value}
          </div>
          <div className="text-[11px] text-text-secondary font-medium flex items-center gap-1.5 pt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                trend && trend > 0
                  ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                  : "bg-amber-primary"
              }`}
            />
            <span className="truncate">{sub}</span>
          </div>
        </div>
      </div>
    </>
  );

  const cardClasses =
    "bg-surface-2/60 border border-border-bright hover:border-amber-primary/40 p-5 rounded-2xl relative overflow-hidden group shadow-lg transition-all backdrop-blur-md";

  if (externalLink) {
    return (
      <motion.a
        href={externalLink}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className={`${cardClasses} block cursor-pointer`}
      >
        {CardContent}
      </motion.a>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cardClasses}
    >
      {CardContent}
    </motion.div>
  );
};

const DashboardSection = ({ title, icon: Icon, children, action }: any) => (
  <div className="bg-surface/80 border border-border-bright rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm relative">
    <div className="px-5 py-3.5 border-b border-border-dim/40 flex justify-between items-center bg-surface-2/40 relative z-10">
      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2.5">
        {Icon && (
          <div className="p-1 rounded-lg bg-amber-primary/10 border border-amber-primary/20 text-amber-primary">
            <Icon size={14} />
          </div>
        )}
        <span>{title}</span>
      </h3>
      {action && <div className="relative z-10">{action}</div>}
    </div>
    <div className="p-5 relative z-10">{children}</div>
  </div>
);

// --- Error Boundary ---
class ErrorBoundary extends Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-text-primary">
              Something went wrong
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              An unexpected error occurred. Please try refreshing the page or
              contact support if the problem persists.
            </p>
            <div className="bg-surface-2 p-4 rounded-xl border border-border-dim text-left overflow-auto max-h-40">
              <code className="text-[10px] text-red-400 font-mono">
                {this.state.error?.toString()}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-amber-primary hover:bg-amber-secondary text-bg font-bold py-3 rounded-xl transition-all"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Toast Component ---
interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: (id: string) => void;
}

const Toast = ({ id, message, type, onClose }: ToastProps) => {
  const duration = 3000;

  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle2 size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-amber-primary" />,
    warning: <AlertTriangle size={18} className="text-orange-500" />,
  };

  const colors = {
    success: "border-green-500/30 bg-green-500/5 text-green-500",
    error: "border-red-500/30 bg-red-500/5 text-red-500",
    info: "border-amber-primary/30 bg-amber-primary/5 text-amber-primary",
    warning: "border-orange-500/30 bg-orange-500/5 text-orange-500",
  };

  const progressColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-amber-primary",
    warning: "bg-orange-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
      layout
      className={`group relative flex items-center gap-3 p-4 rounded-xl border shadow-2xl min-w-[320px] max-w-md overflow-hidden ${colors[type]}`}
    >
      <div className="flex-shrink-0 bg-surface/50 p-1.5 rounded-lg border border-white/5 shadow-inner">
        {icons[type]}
      </div>
      <div className="flex-1 text-[11px] font-bold uppercase tracking-wider leading-relaxed text-text-primary">
        {message}
      </div>
      <button
        onClick={() => onClose(id)}
        className="p-1 text-text-dim hover:text-text-primary hover:bg-white/5 rounded-md transition-all"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>

      {/* Progress Bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-0.5 opacity-40 ${progressColors[type]}`}
      />
    </motion.div>
  );
};

const formatPrice = (price: number) => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} Lacs`;
  }
  return `₹${price.toLocaleString()}`;
};

const projectCardVariants: any = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: 20,
  },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: Math.min(index * 0.05, 0.4),
      duration: 0.35,
      ease: "easeOut",
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -10,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

const projectRowVariants: any = {
  hidden: {
    opacity: 0,
    x: -12,
  },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: Math.min(index * 0.04, 0.35),
      duration: 0.3,
      ease: "easeOut",
    },
  }),
  exit: {
    opacity: 0,
    x: 12,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

const ProjectCard = ({
  project,
  onClick,
  onEdit,
  onDelete,
  hasEditPermission,
  hasDeletePermission,
  isSelected,
  onSelect,
  onShowOnMap,
  isAlertActive,
  alertActiveSince,
  onToggleAlert,
}: any) => {
  const [isClickPulsing, setIsClickPulsing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const activeSinceDate = useMemo(() => {
    if (!isAlertActive) return null;
    let rawDate = alertActiveSince;
    if (!rawDate) {
      try {
        const saved = localStorage.getItem("pysync_price_alerts");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed[project.id]?.createdAt) {
            rawDate = parsed[project.id].createdAt;
          }
        }
      } catch (_) {}
    }
    if (!rawDate) {
      rawDate = new Date().toISOString();
    }
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  }, [isAlertActive, alertActiveSince, project.id]);

  const handleClickAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClickPulsing(true);
    setTimeout(() => setIsClickPulsing(false), 600);
    onToggleAlert && onToggleAlert(project);
  };

  return (
  <motion.div
    whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
    onClick={() => onClick(project)}
    className={`bg-surface border rounded-2xl overflow-hidden group flex flex-col h-full transition-all duration-500 relative cursor-pointer ${
      isSelected
        ? "ring-2 ring-amber-primary border-amber-primary shadow-[0_0_30px_rgba(245,158,11,0.3)] bg-amber-primary/5"
        : "border-border-dim hover:border-amber-primary/60 hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)]"
    }`}
  >
    {/* Selection Checkbox */}
    <div
      className={`absolute top-3 left-3 z-30 w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
        isSelected
          ? "bg-amber-primary border-amber-primary"
          : "bg-black/40 border-white/20 hover:border-white/60 "
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(project.id);
      }}
    >
      {isSelected && <Check size={12} className="text-bg font-black" />}
    </div>

    {/* Price Alert Bell Button & Descriptive Hover Popover */}
    <div
      className="absolute top-3 right-3 z-30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        id={`btn-price-alert-${project.id}`}
        onClick={handleClickAlert}
        className={`relative w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-300 shadow-md backdrop-blur-md cursor-pointer group/alertbtn transform hover:scale-110 active:scale-90 ${
          isClickPulsing ? "ring-4 ring-amber-primary scale-125 shadow-[0_0_25px_rgba(245,158,11,1)]" : ""
        } ${
          isAlertActive
            ? "bg-amber-primary text-bg border-amber-primary shadow-[0_0_15px_rgba(245,158,11,0.6)] ring-2 ring-amber-primary/30 hover:shadow-[0_0_22px_rgba(245,158,11,0.9)] hover:ring-amber-primary/60 hover:animate-pulse"
            : "bg-black/60 border-white/20 text-white/80 hover:text-amber-primary hover:border-amber-primary hover:bg-amber-primary/20 hover:shadow-[0_0_16px_rgba(245,158,11,0.6)] hover:ring-2 hover:ring-amber-primary/40 hover:animate-pulse"
        }`}
      >
        {/* Transient Ripple / Ring Wave Effect on Click */}
        {isClickPulsing && (
          <span className="absolute -inset-2 rounded-xl border-2 border-amber-primary animate-ping pointer-events-none opacity-80" />
        )}

        <Bell
          size={13}
          className={`${
            isAlertActive
              ? "fill-bg animate-pulse"
              : "group-hover/alertbtn:scale-110 group-hover/alertbtn:rotate-12 transition-transform duration-200"
          }`}
        />
      </button>

      {/* Custom Descriptive Popover on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-9 right-0 w-64 bg-[#0c0e14]/95 backdrop-blur-md border border-border-bright/90 rounded-xl p-3 shadow-2xl z-50 text-left pointer-events-none"
          >
            {/* Header Tag */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-border-dim/60">
              <div className="flex items-center gap-1.5 text-amber-primary font-bold text-[10px] uppercase tracking-wider">
                <Bell size={11} className={isAlertActive ? "fill-amber-primary" : ""} />
                <span>Price & Status Monitor</span>
              </div>
              <span
                className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded ${
                  isAlertActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-surface-3 text-text-dim border border-border-dim"
                }`}
              >
                {isAlertActive ? "Subscribed" : "Idle"}
              </span>
            </div>

            {/* Metrics List */}
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-text-dim text-[10px]">Last Tracked Price</span>
                <span className="font-bold text-amber-primary">{formatPrice(project.price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-dim text-[10px]">Last Tracked Status</span>
                <span className="font-bold text-text-primary px-1.5 py-0.5 rounded bg-surface-2 border border-border-dim text-[10px]">
                  {project.status || "Active"}
                </span>
              </div>
              {isAlertActive && (
                <div className="flex items-center justify-between pt-1 border-t border-border-dim/40">
                  <span className="text-text-dim text-[10px]">Alert active since</span>
                  <span className="font-bold text-emerald-400 text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    {activeSinceDate || "Active"}
                  </span>
                </div>
              )}
              {project.configuration && (
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-text-dim text-[10px]">Configuration</span>
                  <span className="text-text-secondary text-[10px]">{project.configuration}</span>
                </div>
              )}
            </div>

            {/* Footer Hint */}
            <div className="mt-2.5 pt-2 border-t border-border-dim/40 text-[9px] text-text-dim flex items-center justify-between">
              <span>{isAlertActive ? "Click to disable alert" : "Click to subscribe"}</span>
              <span className="text-amber-primary/70">Instant haptics</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Image Section */}
    <div className="relative h-36 overflow-hidden">
      <InlineImageCarousel images={project.images} title={project.title} heightClass="h-full w-full" />

      {/* Status Badge */}
      <div className="absolute bottom-2 left-2 z-20">
        <span
          className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border flex items-center gap-1.5 transition-all ${
            project.status === "Active"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : project.status === "PENDING_DELETE"
                ? "border-red-500/60 bg-red-500/15 text-red-400 shadow-sm animate-breathe"
                : "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm animate-breathe"
          }`}
        >
          {project.status === "Active" ? (
            <span className="flex h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-breathe-dot" />
          )}
          {project.status === "PENDING_DELETE" ? "Pending Delete" : project.status}
        </span>
      </div>

      {/* Price Overlay */}
      <div className="absolute bottom-2 right-2 z-20">
        <div className="bg-bg/80 border border-white/10 px-2 py-1 rounded-lg shadow-xl">
          <p className="text-[6px] text-text-dim uppercase tracking-widest font-black mb-0.5">
            Starting From
          </p>
          <p className="text-xs font-mono font-bold text-amber-primary leading-none">
            {formatPrice(project.price)}
          </p>
        </div>
      </div>
    </div>

    {/* Content Section */}
    <div className="p-3 flex-1 flex flex-col">
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[8px] text-amber-primary font-black uppercase tracking-widest">
            {(project.type || project.projectType || "")
              .replace("FLATS", "Apartments")
              .replace("Apartment", "Apartments")}
          </span>
          <span className="w-1 h-1 rounded-full bg-border-bright" />
          <span className="text-[8px] text-text-dim font-bold uppercase tracking-widest">
            {project.possessionStatus}
            {project.possessionDate &&
              ` • ${new Date(project.possessionDate).toLocaleDateString()}`}
          </span>
        </div>
        <h3 className="text-sm font-serif font-bold text-text-primary group-hover:text-amber-primary transition-colors line-clamp-1">
          {project.title}
        </h3>
        <div className="flex items-center gap-1 mt-0.5 text-text-dim group-hover:text-text-secondary transition-colors">
          <MapPin size={8} className="text-amber-primary/60" />
          <span className="text-[9px] font-medium truncate">
            {project.location}
          </span>
        </div>
      </div>

      {/* Property Specs Grid */}
      <div className="grid grid-cols-3 gap-1 py-2 border-y border-border-dim/30 mb-2">
        <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-surface-2/50 border border-border-dim/20">
          <Maximize2 size={10} className="text-amber-primary mb-0.5" />
          <span className="text-[8px] font-mono font-bold text-text-primary">
            {project.area}
          </span>
          <span className="text-[6px] text-text-dim uppercase font-black tracking-tighter">
            Sq.Ft
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-surface-2/50 border border-border-dim/20">
          <Home size={10} className="text-amber-primary mb-0.5" />
          <span className="text-[8px] font-mono font-bold text-text-primary truncate max-w-full px-1">
            {(project.configuration || project.bhk || "N/A").replace(
              "5BHK",
              "Penthouse",
            )}
          </span>
          <span className="text-[6px] text-text-dim uppercase font-black tracking-tighter">
            BHK
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-surface-2/50 border border-border-dim/20">
          <Bath size={10} className="text-amber-primary mb-0.5" />
          <span className="text-[8px] font-mono font-bold text-text-primary">
            {project.bathrooms || 2}
          </span>
          <span className="text-[6px] text-text-dim uppercase font-black tracking-tighter">
            Baths
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-primary to-amber-secondary flex items-center justify-center text-[8px] font-black text-bg border-2 border-surface shadow-lg">
              {project.assignedTo?.charAt(0) || "U"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-surface rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-[6px] text-text-dim uppercase font-black tracking-widest leading-none">
              Manager
            </span>
            <span className="text-[8px] text-text-primary font-bold leading-none">
              {project.assignedTo || "Unassigned"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAlert && onToggleAlert(project);
            }}
            className={`p-1 rounded-lg transition-all duration-300 group/btn transform hover:scale-110 active:scale-95 ${
              isAlertActive
                ? "text-amber-primary bg-amber-primary/15 hover:bg-amber-primary/25 border border-amber-primary/30 hover:shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:animate-pulse"
                : "text-text-dim hover:text-amber-primary hover:bg-amber-primary/15 hover:shadow-[0_0_10px_rgba(245,158,11,0.4)] hover:animate-pulse"
            }`}
            title={
              isAlertActive
                ? "Price & Status Alert Active (Click to disable)"
                : "Set Price & Status Alert for this project"
            }
          >
            <Bell
              size={12}
              className={`group-hover/btn:scale-110 transition-transform ${isAlertActive ? "fill-amber-primary animate-pulse" : ""}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(project);
            }}
            className="p-1 text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-all group/btn"
            title="View Details"
          >
            <Eye
              size={12}
              className="group-hover/btn:scale-110 transition-transform"
            />
          </button>
          {hasEditPermission && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="p-1 text-text-dim hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group/btn"
              title="Edit Project"
            >
              <Edit
                size={12}
                className="group-hover/btn:scale-110 transition-transform"
              />
            </button>
          )}
          {hasDeletePermission && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
              className="p-1 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all group/btn"
              title="Delete Project"
            >
              <Trash2
                size={12}
                className="group-hover/btn:scale-110 transition-transform"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  </motion.div>
  );
};

const BuilderDetailModal = ({
  builderName,
  projects,
  onClose,
  onProjectClick,
  user,
}: {
  builderName: string;
  projects: Project[];
  onClose: () => void;
  onProjectClick?: (project: Project) => void;
  user: User | null;
}) => {
  return (
    <DeveloperPortfolioModal
      builderName={builderName}
      projects={projects}
      onClose={onClose}
      onProjectClick={onProjectClick}
      user={user}
    />
  );
};

interface PreviewImage {
  name?: string;
  data: string;
  size?: number;
}

const ImagePreviewModal = ({
  images,
  initialIndex,
  onClose,
  showToast,
}: {
  images: PreviewImage[];
  initialIndex: number;
  onClose: () => void;
  showToast?: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<"fit" | "full">("fit");
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const dragBounds = viewMode === "full" ? 2500 : scale * 150;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "=" || e.key === "+") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "r" || e.key === "R") {
        handleReset();
      } else if (e.key === "f" || e.key === "F") {
        setViewMode((prev) => {
          const next = prev === "fit" ? "full" : "fit";
          setScale(1);
          setPosition({ x: 0, y: 0 });
          if (showToast) {
            showToast(
              next === "full" ? "Switched to Full Size mode" : "Switched to Fit to Screen mode",
              "info"
            );
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, scale, position, images, showToast]);

  const handlePrev = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    handleReset();
  };

  const handleNext = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    handleReset();
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const nextScale = Math.max(prev - 0.5, 1);
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return nextScale;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setViewMode("fit");
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1 && viewMode !== "full") return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || (scale <= 1 && viewMode !== "full")) return;
    e.preventDefault();
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setPosition({
      x: Math.min(Math.max(newX, -dragBounds), dragBounds),
      y: Math.min(Math.max(newY, -dragBounds), dragBounds),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1 && viewMode !== "full") return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || (scale <= 1 && viewMode !== "full")) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStartRef.current.x;
    const newY = touch.clientY - dragStartRef.current.y;
    setPosition({
      x: Math.min(Math.max(newX, -dragBounds), dragBounds),
      y: Math.min(Math.max(newY, -dragBounds), dragBounds),
    });
  };

  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/98 backdrop-blur-2xl text-white select-none font-sans">
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-50">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-amber-primary uppercase tracking-widest">
            {currentImage.name || "Asset Image"}
          </span>
          {images.length > 1 && (
            <span className="text-[10px] text-text-dim font-mono">
              Asset {currentIndex + 1} of {images.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Fit to Screen vs Full Size Segmented Toggle */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 mr-1 shrink-0">
            <button
              onClick={() => {
                setViewMode("fit");
                setScale(1);
                setPosition({ x: 0, y: 0 });
                if (showToast) showToast("Switched to Fit to Screen", "info");
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                viewMode === "fit"
                  ? "bg-amber-primary text-bg font-extrabold shadow-sm"
                  : "text-text-dim hover:text-white"
              }`}
              title="Fit to Screen (Key: F)"
            >
              <Minimize2 size={11} />
              <span className="hidden sm:inline">Fit</span>
            </button>
            <button
              onClick={() => {
                setViewMode("full");
                setScale(1);
                setPosition({ x: 0, y: 0 });
                if (showToast) showToast("Switched to Full Size", "info");
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                viewMode === "full"
                  ? "bg-amber-primary text-bg font-extrabold shadow-sm"
                  : "text-text-dim hover:text-white"
              }`}
              title="Full Size (Key: F)"
            >
              <Maximize2 size={11} />
              <span className="hidden sm:inline">Full</span>
            </button>
          </div>

          <div className="px-2.5 py-1 text-[10px] font-mono bg-white/10 rounded-md border border-white/5 text-amber-primary font-bold">
            {Math.round(scale * 100)}%
          </div>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className="p-2 bg-white/5 hover:bg-amber-primary hover:text-black rounded-lg border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            title="Zoom In (Key: +)"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 bg-white/5 hover:bg-amber-primary hover:text-black rounded-lg border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            title="Zoom Out (Key: -)"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleReset}
            disabled={scale === 1 && position.x === 0 && position.y === 0 && viewMode === "fit"}
            className="p-2 bg-white/5 hover:bg-amber-primary hover:text-black rounded-lg border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            title="Reset (Key: R)"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-amber-primary hover:bg-amber-secondary text-black rounded-lg transition-colors cursor-pointer"
            title="Close (Key: Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-4 ${
          scale > 1 || viewMode === "full" ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <motion.div
          animate={{
            scale,
            x: position.x,
            y: position.y,
          }}
          transition={isDragging ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 250 }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="relative max-w-full max-h-full flex items-center justify-center"
        >
          <img
            src={currentImage.data}
            alt={currentImage.name || "Preview Image"}
            draggable={false}
            referrerPolicy="no-referrer"
            className={
              viewMode === "full"
                ? "max-w-none max-h-none object-contain rounded-lg shadow-2xl border border-white/5"
                : "max-w-[90vw] max-h-[80vh] md:max-w-[85vw] md:max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/5"
            }
          />
        </motion.div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-amber-500 hover:text-black text-white rounded-full border border-white/10 backdrop-blur-md transition-all flex items-center justify-center shadow-lg group hover:scale-105"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-amber-500 hover:text-black text-white rounded-full border border-white/10 backdrop-blur-md transition-all flex items-center justify-center shadow-lg group hover:scale-105"
            >
              <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </>
        )}
      </div>

      {(scale > 1 || viewMode === "full") && (
        <>
          {/* Viewport Navigator Box */}
          <div className="absolute bottom-6 right-6 z-40 flex flex-col p-1.5 bg-black/85 border border-white/15 rounded-xl backdrop-blur-lg shadow-2xl w-32 h-24 overflow-hidden select-none">
            <div className="relative w-full h-full flex items-center justify-center bg-zinc-950/40 rounded-lg overflow-hidden">
              <img
                src={currentImage.data}
                alt="Navigator Thumbnail"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain opacity-50 select-none pointer-events-none"
              />
              <div
                style={{
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`,
                  left: `${50 - (50 / scale) - (position.x / dragBounds) * (50 - (50 / scale))}%`,
                  top: `${50 - (50 / scale) - (position.y / dragBounds) * (50 - (50 / scale))}%`,
                }}
                className="absolute border border-amber-primary bg-amber-primary/10 rounded-sm pointer-events-none transition-all duration-75"
              />
            </div>
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/95 rounded border border-white/10 text-[8px] font-black text-amber-primary uppercase tracking-widest pointer-events-none">
              NAVIGATOR
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full border border-white/10 backdrop-blur-md text-[10px] text-text-dim pointer-events-none flex items-center gap-1.5 font-sans">
            <span>Drag image to pan and explore details</span>
          </div>
        </>
      )}
    </div>
  );
};

const ProjectDetailModal = ({
  project,
  onClose,
  showToast,
  onViewBuilder,
  onEdit,
  onDelete,
  onCreate,
  hasEditPermission,
  hasDeletePermission,
  hasCreatePermission,
  onRequestEdit,
  isAlertActive,
  onToggleAlert,
}: {
  project: Project;
  onClose: () => void;
  showToast: (
    msg: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;
  onViewBuilder: (name: string) => void;
  onEdit?: (p: Project) => void;
  onDelete?: (p: Project) => void;
  onCreate?: () => void;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
  hasCreatePermission?: boolean;
  onRequestEdit?: (p: Project, details: string) => Promise<boolean>;
  isAlertActive?: boolean;
  onToggleAlert?: (p: Project) => void;
}) => {
  const [isReportMistakeOpen, setIsReportMistakeOpen] = useState(false);
  const [mistakeDescription, setMistakeDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [currentModalTab, setCurrentModalTab] = useState<"overview" | "specs" | "payment" | "inventory">("overview");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);
  const [isMobileSummaryExpanded, setIsMobileSummaryExpanded] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const projectShareUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?project=${project.id}`
    : `https://example.com?project=${project.id}`;

  useEffect(() => {
    if (project?.id) {
      QRCode.toDataURL(
        projectShareUrl,
        {
          width: 360,
          margin: 2,
          color: {
            dark: "#f59e0b",
            light: "#0b0c0e",
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrCodeUrl(url);
          }
        }
      );
    }
  }, [project?.id, projectShareUrl]);

  // Unit Inventory state & generation helpers
  interface Unit {
    id: string;
    tower: string;
    floor: number;
    bhk: string;
    areaSqft: number;
    price: number;
    status: "Available" | "Sold" | "Reserved";
  }

  const [units, setUnits] = useState<Unit[]>([]);
  const [activeUnitIdForStatusEdit, setActiveUnitIdForStatusEdit] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<"All" | "Available" | "Sold" | "Reserved">("All");
  const [updatedUnits, setUpdatedUnits] = useState<Record<string, number>>({});

  useEffect(() => {
    if (project && project.id) {
      // Seeded deterministic unit generation
      let seed = 0;
      for (let i = 0; i < project.id.length; i++) {
        seed += project.id.charCodeAt(i);
      }

      const bhkValue = parseInt(project.configuration || "3") || 3;
      const areaValue = parseInt(project.area?.replace(/[^0-9]/g, "") || "1800") || 1800;
      const towersCount = parseInt(project.noOfTowers || "3") || 3;
      const towers = Array.from({ length: towersCount }, (_, idx) => `Tower ${String.fromCharCode(65 + idx)}`);

      const unitsList: Unit[] = [];
      // Generate 12 realistic units based on the project parameters
      for (let i = 0; i < 12; i++) {
        const hash = (seed + i * 23) % 100;
        const tower = towers[i % towers.length];
        const floor = Math.floor(i / towers.length) + 1;
        const unitNo = `${floor}0${(i % 3) + 1}`;
        
        let status: "Available" | "Sold" | "Reserved" = "Available";
        if (hash < 40) {
          status = "Sold";
        } else if (hash < 70) {
          status = "Available";
        } else {
          status = "Reserved";
        }

        const uBhk = `${bhkValue + (i % 2 === 0 ? 0 : i % 3 === 1 ? 1 : -1)} BHK`;
        const uArea = areaValue + (i % 2 === 0 ? -120 : 180);
        const uPrice = Math.floor((uArea * 7200) + (floor * 45000));

        unitsList.push({
          id: `${tower}-${unitNo}`,
          tower,
          floor,
          bhk: uBhk,
          areaSqft: uArea,
          price: uPrice,
          status,
        });
      }
      setUnits(unitsList);
    }
  }, [project?.id]);

  const handleUpdateUnitStatus = (unitId: string, newStatus: "Available" | "Sold" | "Reserved") => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, status: newStatus } : u))
    );
    setUpdatedUnits((prev) => ({
      ...prev,
      [unitId]: Date.now()
    }));
    const displayId = unitId.includes("-") ? unitId.split("-")[1] : unitId;
    const displayTower = unitId.includes("-") ? unitId.split("-")[0] : "";
    showToast(`${displayTower} Unit #${displayId} updated to ${newStatus}`, "success");
    setActiveUnitIdForStatusEdit(null);
  };

  const totalCount = units.length;
  const availableCount = units.filter((u) => u.status === "Available").length;
  const soldCount = units.filter((u) => u.status === "Sold").length;
  const reservedCount = units.filter((u) => u.status === "Reserved").length;

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.id.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      u.tower.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      u.bhk.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesFilter = inventoryStatusFilter === "All" || u.status === inventoryStatusFilter;
    return matchesSearch && matchesFilter;
  });

  const images = project.images && project.images.length > 0
    ? project.images
    : [{ name: "Default View", size: 0, data: `https://picsum.photos/seed/${project.title}/1920/1080` }];

  const plans = {
    plp: { ...defaultPaymentPlans.plp, ...(project.paymentPlans?.plp || {}) },
    clp: { ...defaultPaymentPlans.clp, ...(project.paymentPlans?.clp || {}) },
    subvention: { ...defaultPaymentPlans.subvention, ...(project.paymentPlans?.subvention || {}) },
  };

  const activePlan =
    project.paymentPlans?.plp?.enabled
      ? "plp"
      : project.paymentPlans?.clp?.enabled
      ? "clp"
      : project.paymentPlans?.subvention?.enabled
      ? "subvention"
      : "plp";

  const handleReportMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeDescription.trim()) {
      showToast("Please enter report details", "warning");
      return;
    }
    setIsSubmittingReport(true);
    try {
      if (onRequestEdit) {
        const success = await onRequestEdit(project, mistakeDescription);
        if (success) {
          showToast("Discrepancy report submitted successfully to advisory team", "success");
          setMistakeDescription("");
          setIsReportMistakeOpen(false);
        } else {
          showToast("Failed to submit feedback", "error");
        }
      } else {
        // Fallback simulate submission
        await new Promise((resolve) => setTimeout(resolve, 1000));
        showToast("Feedback sent! Thank you for helping keep rates updated.", "success");
        setMistakeDescription("");
        setIsReportMistakeOpen(false);
      }
    } catch (err) {
      showToast("Something went wrong", "error");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl transition-all"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 40 }}
        transition={{ type: "spring", damping: 28, stiffness: 200 }}
        className="relative w-full max-w-6xl h-full max-h-[96vh] sm:max-h-[92vh] bg-gradient-to-b from-[#0E1013] to-[#060708] border border-white/[0.08] rounded-[32px] shadow-[0_48px_144px_-24px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col z-50 transition-colors"
      >
        {/* Superior Ambient Gold Accent Glow at Top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80 z-40" />

        {/* Floating Elegant Actions Bar */}
        <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onToggleAlert && onToggleAlert(project)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] flex items-center gap-1.5 sm:gap-2 transition-all duration-300 shadow-md border cursor-pointer ${
              isAlertActive
                ? "bg-amber-500 border-amber-500 text-black font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20"
            }`}
            title={
              isAlertActive
                ? "Price & Status Alert is Active (Click to disable)"
                : "Set Price & Status Alert for this project"
            }
          >
            <Bell size={11} className={isAlertActive ? "fill-black animate-pulse" : ""} />
            <span>{isAlertActive ? "Alert Active" : "Price Alert"}</span>
          </button>

          <button
            onClick={() => {
              setIsQrModalOpen(!isQrModalOpen);
              if (isReportMistakeOpen) setIsReportMistakeOpen(false);
            }}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] flex items-center gap-1.5 sm:gap-2 transition-all duration-300 shadow-md border ${
              isQrModalOpen
                ? "bg-amber-500 border-amber-500 text-black font-extrabold"
                : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20"
            }`}
            title="Generate QR Code"
          >
            <QrCode size={11} className={isQrModalOpen ? "animate-pulse" : ""} />
            <span>{isQrModalOpen ? "Hide QR" : "QR Code"}</span>
          </button>

          <button
            onClick={() => {
              setIsReportMistakeOpen(!isReportMistakeOpen);
              if (isQrModalOpen) setIsQrModalOpen(false);
            }}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] flex items-center gap-1.5 sm:gap-2 transition-all duration-300 shadow-md border ${
              isReportMistakeOpen
                ? "bg-amber-500 border-amber-500 text-black font-extrabold"
                : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <AlertCircle size={11} className={isReportMistakeOpen ? "animate-pulse" : ""} />
            <span>{isReportMistakeOpen ? "Cancel" : "Report"}</span>
          </button>
          
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 bg-white/5 hover:bg-amber-500 text-white hover:text-black rounded-full border border-white/10 hover:border-amber-500/25 transition-all duration-300 group shadow-md flex items-center justify-center"
            title="Dismiss detailed view"
          >
            <X size={14} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div ref={modalContentRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="w-full">
            {/* Interactive QR Code Generator Drawer */}
            <AnimatePresence>
              {isQrModalOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="bg-amber-500/[0.04] border-b border-amber-500/20 overflow-hidden font-sans relative z-30"
                >
                  <div className="p-6 md:p-8 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-6 text-left">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="relative group shrink-0 p-3 bg-[#0B0C0E] border-2 border-amber-500/30 rounded-2xl shadow-xl shadow-amber-500/10 overflow-hidden"
                    >
                      <AnimatePresence mode="wait">
                        {qrCodeUrl ? (
                          <motion.img
                            key={qrCodeUrl}
                            initial={{ opacity: 0, scale: 0.82 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 22,
                              mass: 0.8,
                            }}
                            src={qrCodeUrl}
                            alt={`QR Code for ${project.title}`}
                            className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-lg shadow-md"
                          />
                        ) : (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-36 h-36 sm:w-44 sm:h-44 flex flex-col items-center justify-center text-amber-500/70 gap-2 font-mono text-[10px]"
                          >
                            <Loader2 className="animate-spin text-amber-500" size={24} />
                            <span>Generating QR...</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="absolute inset-0 bg-amber-500/5 rounded-2xl pointer-events-none group-hover:bg-transparent transition-colors" />
                    </motion.div>

                    <div className="flex-1 space-y-3 text-center sm:text-left w-full min-w-0">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest">
                          <QrCode size={10} /> Scan & Share Property
                        </div>
                        <h4 className="text-base font-extrabold text-white truncate">
                          {project.title}
                        </h4>
                        <p className="text-xs text-white/60">
                          Scan with any mobile camera or QR reader to quickly share or view this property link.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2 text-xs font-mono text-amber-400/90 truncate">
                        <span className="truncate text-[11px]">{projectShareUrl}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(projectShareUrl);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-sans font-extrabold text-[10px] uppercase tracking-wider shrink-0 hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedLink ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                          <span>{copiedLink ? "Copied" : "Copy"}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                        {qrCodeUrl && (
                          <a
                            href={qrCodeUrl}
                            download={`${project.title.replace(/\s+/g, "_")}_QR.png`}
                            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                          >
                            <Download size={11} />
                            <span>Download PNG</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsQrModalOpen(false)}
                          className="px-3.5 py-1.5 rounded-xl bg-transparent hover:bg-white/5 text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Interactive Discrepancy Reporting Drawer */}
            <AnimatePresence>
              {isReportMistakeOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="bg-amber-500/[0.03] border-b border-amber-500/15 overflow-hidden font-sans relative z-30"
                >
                  <form onSubmit={handleReportMistake} className="p-6 md:p-8 space-y-4 max-w-4xl mx-auto">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/10 shrink-0 mt-0.5">
                        <AlertTriangle size={18} className="animate-bounce" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest leading-none">
                          Report Verification Discrepancy
                        </h4>
                        <p className="text-[10px] text-white/50 leading-relaxed max-w-2xl">
                          Noticed a temporary drift in base price configurations, possession calendars, builder notes, or brochures? State the exact error and our regional team will audit the listings instantly.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pl-0 sm:pl-[44px]">
                      <textarea
                        required
                        value={mistakeDescription}
                        onChange={(e) => setMistakeDescription(e.target.value)}
                        placeholder="e.g. Possession date shifted to Q2 2028 based on latest RERA approvals..."
                        className="w-full min-h-[90px] p-4 bg-[#141619] text-[11px] rounded-2xl border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/30 font-medium resize-y focus:ring-1 focus:ring-amber-500/20"
                      />
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsReportMistakeOpen(false)}
                          className="px-4 py-2 bg-transparent border border-white/10 hover:border-white/20 text-white/60 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingReport}
                          className="px-5 py-2 bg-amber-500 disabled:bg-amber-500/30 text-black hover:bg-amber-400 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                        >
                          {isSubmittingReport ? (
                            <>
                              <Loader2 size={11} className="animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Check size={11} />
                              <span>Submit Desk Report</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Sticky Summary Header (Collapsible layout prioritizing price & location summary) */}
            <div className="sticky top-0 z-40 md:hidden bg-[#0B0C0E]/95 backdrop-blur-xl border-b border-amber-500/25 shadow-2xl transition-all duration-300">
              <div className="py-2.5 pl-3.5 pr-28 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                    <IndianRupee size={13} />
                  </div>
                  <div className="flex flex-col overflow-hidden min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-500 tracking-tight font-mono">
                        {formatPrice(project.price)}
                      </span>
                      <span className={`text-[7.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 border flex items-center gap-1 ${
                        project.status === "Active"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm animate-breathe"
                      }`}>
                        {project.status !== "Active" && (
                          <span className="w-1 h-1 rounded-full bg-amber-400 animate-breathe-dot" />
                        )}
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9.5px] text-white/80 font-medium truncate">
                      <MapPin size={9} className="text-amber-500 shrink-0 animate-pulse" />
                      <span className="truncate">{project.title} · {project.location}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileSummaryExpanded(!isMobileSummaryExpanded)}
                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                  title="Expand / collapse quick metrics"
                >
                  <span>{isMobileSummaryExpanded ? "Less" : "Specs"}</span>
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-300 ${
                      isMobileSummaryExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Collapsible Quick Metrics Drawer */}
              <AnimatePresence>
                {isMobileSummaryExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-white/10 bg-black/80 px-3.5 py-3 space-y-2.5"
                  >
                    <div className="grid grid-cols-2 gap-2 text-sans">
                      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                        <span className="text-[7px] uppercase font-black text-white/40 tracking-wider">Price Tier</span>
                        <span className="text-[11px] font-extrabold text-amber-500">{formatPrice(project.price)}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                        <span className="text-[7px] uppercase font-black text-white/40 tracking-wider">Footprint</span>
                        <span className="text-[11px] font-extrabold text-white">{project.area} Sq.Ft.</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                        <span className="text-[7px] uppercase font-black text-white/40 tracking-wider">Configuration</span>
                        <span className="text-[11px] font-extrabold text-white truncate">{project.configuration || "N/A"}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                        <span className="text-[7px] uppercase font-black text-white/40 tracking-wider">Builder</span>
                        <span className="text-[11px] font-extrabold text-white truncate">{project.builderName || "General Builder"}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8.5px] text-white/60">
                      <div className="flex items-center gap-1 text-amber-500 truncate pr-2">
                        <MapPin size={9} className="shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </div>
                      <span className="text-[7.5px] font-mono text-white/40 shrink-0">RERA: {project.reraNumber || "Verified"}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Elite Image Gallery Carousel Hero */}
            <div className="relative h-[280px] sm:h-[460px] lg:h-[530px] w-full overflow-hidden font-sans">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImgIndex}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  src={images[currentImgIndex].data}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover cursor-zoom-in hover:scale-102 transition-all duration-500"
                  onClick={() => {
                    setPreviewInitialIndex(currentImgIndex);
                    setIsPreviewModalOpen(true);
                  }}
                />
              </AnimatePresence>

              {/* Click to Zoom Overlay Button */}
              <button
                type="button"
                onClick={() => {
                  setPreviewInitialIndex(currentImgIndex);
                  setIsPreviewModalOpen(true);
                }}
                className="absolute top-6 left-6 z-30 px-3.5 py-2 rounded-full bg-black/65 hover:bg-amber-500 text-white hover:text-black border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all duration-300 shadow-md hover:scale-105 cursor-pointer"
                title="Zoom-in / Explore Fullscreen"
              >
                <ZoomIn size={12} />
                <span>Zoom & Explore</span>
              </button>
              
              {/* Complex Linear and Radial Dark Masks */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060708] via-[#060708]/30 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#060708]/80 via-[#060708]/15 to-transparent pointer-events-none" />

              {/* Floating Pill Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-6 right-6 z-30 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[9px] font-mono font-bold text-white/90 flex items-center gap-1.5 shadow-lg">
                  <ImageIcon size={10} className="text-amber-500" />
                  <span>{currentImgIndex + 1} / {images.length}</span>
                </div>
              )}

              {/* Precise Directional Arrow Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-amber-500 text-white hover:text-black border border-white/10 backdrop-blur-md transition-all group flex items-center justify-center cursor-pointer shadow-lg hover:scale-105"
                    title="Previous Slide"
                  >
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-amber-500 text-white hover:text-black border border-white/10 backdrop-blur-md transition-all group flex items-center justify-center cursor-pointer shadow-lg hover:scale-105"
                    title="Next Slide"
                  >
                    <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </>
              )}

              {/* Typography overlay */}
              <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 lg:p-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 pointer-events-none">
                <div className="space-y-4 flex-1 max-w-3xl pointer-events-auto">
                  <div className="flex flex-wrap items-center gap-2">
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-[9px] px-3 py-1 rounded-md border font-black uppercase tracking-[0.25em] flex items-center gap-1.5 ${
                        project.status === "Active"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          : project.status === "PENDING_DELETE"
                            ? "border-red-500/60 bg-red-500/15 text-red-400 shadow-sm animate-breathe"
                            : "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm animate-breathe"
                      }`}
                    >
                      {project.status !== "Active" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-breathe-dot" />
                      )}
                      {project.status === "PENDING_DELETE" ? "Pending Deletion" : project.status}
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-[9px] px-3 py-1 rounded-md border border-white/10 bg-white/5 text-white/90 font-black uppercase tracking-[0.25em]"
                    >
                      {project.projectType}
                    </motion.span>
                  </div>

                  <div className="space-y-2">
                    <motion.h2
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-text-primary tracking-tight leading-[1.1] drop-shadow-md"
                    >
                      {project.title}
                    </motion.h2>
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-2 text-amber-primary font-sans text-xs sm:text-sm font-semibold opacity-90"
                    >
                      <MapPin size={14} className="text-amber-primary shrink-0 animate-pulse" />
                      <span>{project.location}</span>
                    </motion.div>
                  </div>
                </div>

                {/* Bullets Pagination */}
                {images.length > 1 && (
                  <div className="flex items-center gap-1.5 self-center sm:self-end bg-[#141517]/70 px-3 py-2 rounded-full border border-white/5 backdrop-blur-md shrink-0 pointer-events-auto shadow-xl">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImgIndex(idx);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          currentImgIndex === idx
                            ? "bg-amber-primary w-4"
                            : "bg-white/20 hover:bg-white/50"
                        }`}
                        title={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content Grid with Rich Editorial Layout */}
            <div className="p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left Column: Premium Content Tabs */}
              <div className="lg:col-span-8 flex flex-col space-y-10">
                
                {/* Custom Fine-Line Tab Bar */}
                <div 
                  role="tablist"
                  aria-label="Project Details navigation"
                  className="flex border-b border-white/[0.06] pb-0 gap-4 sm:gap-10 overflow-x-auto no-scrollbar"
                >
                  {[
                    { id: "overview", label: "Executive Overview", icon: LayoutDashboard },
                    { id: "specs", label: "Technical Blueprint", icon: ClipboardList },
                    { id: "payment", label: "Transactional Plans", icon: Percent }
                  ].map((tab, idx, arr) => {
                    const Icon = tab.icon;
                    const isSel = currentModalTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        id={`project-tab-${tab.id}`}
                        role="tab"
                        aria-selected={isSel}
                        aria-controls={`project-tabpanel-${tab.id}`}
                        aria-label={tab.label}
                        tabIndex={isSel ? 0 : -1}
                        onClick={() => setCurrentModalTab(tab.id as any)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowRight") {
                            e.preventDefault();
                            const nextIdx = (idx + 1) % arr.length;
                            setCurrentModalTab(arr[nextIdx].id as any);
                            setTimeout(() => {
                              document.getElementById(`project-tab-${arr[nextIdx].id}`)?.focus();
                            }, 50);
                          } else if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            const prevIdx = (idx - 1 + arr.length) % arr.length;
                            setCurrentModalTab(arr[prevIdx].id as any);
                            setTimeout(() => {
                              document.getElementById(`project-tab-${arr[prevIdx].id}`)?.focus();
                            }, 50);
                          } else if (e.key === "Home") {
                            e.preventDefault();
                            setCurrentModalTab(arr[0].id as any);
                            setTimeout(() => {
                              document.getElementById(`project-tab-${arr[0].id}`)?.focus();
                            }, 50);
                          } else if (e.key === "End") {
                            e.preventDefault();
                            setCurrentModalTab(arr[arr.length - 1].id as any);
                            setTimeout(() => {
                              document.getElementById(`project-tab-${arr[arr.length - 1].id}`)?.focus();
                            }, 50);
                          }
                        }}
                        className={`flex items-center gap-2 pb-4 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] relative transition-all duration-300 cursor-pointer whitespace-nowrap px-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded-sm ${
                          isSel ? "text-amber-500 font-extrabold" : "text-white/40 hover:text-white/80"
                        }`}
                      >
                        <Icon size={12} className={isSel ? "text-amber-500" : "text-white/30"} />
                        <span>{tab.label}</span>
                        {isSel && (
                          <motion.div
                            layoutId="activeModalTabLine"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 to-amber-300 rounded-full z-10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
 
                {/* Tab Views Content */}
                <div className="flex-1 space-y-10">
                  {currentModalTab === "overview" && (
                    <motion.div 
                      id="project-tabpanel-overview"
                      role="tabpanel"
                      aria-labelledby="project-tab-overview"
                      initial={{ opacity: 0, y: 12 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.35 }}
                      className="space-y-10"
                    >
                      {/* Premium Grid Bento Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4.5">
                        {[
                          {
                            label: "Valuation tier",
                            value: formatPrice(project.price),
                            subText: "Base rate BSP tier",
                            icon: IndianRupee,
                            color: "text-amber-500",
                            border: "hover:border-amber-500/30",
                            bg: "bg-amber-500/[0.02]",
                          },
                          {
                            label: "Total footprint",
                            value: `${project.area} Sq.Ft.`,
                            subText: "Super Area coverage",
                            icon: LayoutGrid,
                            color: "text-blue-400",
                            border: "hover:border-blue-400/30",
                            bg: "bg-blue-400/[0.02]",
                          },
                          {
                            label: "Configuration",
                            value: (project.configuration || "N/A").replace("5BHK", "Penthouse"),
                            subText: "Premium room layout",
                            icon: Home,
                            color: "text-purple-400",
                            border: "hover:border-purple-400/30",
                            bg: "bg-purple-400/[0.02]",
                          },
                          {
                            label: "Possession Status",
                            value: (() => {
                              if (!project.possessionDate) return project.possessionStatus;
                              const target = new Date(project.possessionDate);
                              const now = new Date();
                              const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              if (diffDays > 0) return project.possessionStatus;
                              return "Ready to Move";
                            })(),
                            subText: (() => {
                              if (!project.possessionDate) return "Project phase";
                              const target = new Date(project.possessionDate);
                              const now = new Date();
                              const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              if (diffDays > 0) return `${diffDays} days remaining`;
                              return "Ready today";
                            })(),
                            icon: Calendar,
                            color: "text-emerald-400",
                            border: "hover:border-emerald-400/30",
                            bg: "bg-emerald-400/[0.02]",
                          },
                          {
                            label: "Micro Market",
                            value: project.microMarket || "N/A",
                            subText: "Strategic Cluster",
                            icon: MapPin,
                            color: "text-orange-400",
                            border: "hover:border-orange-400/30",
                            bg: "bg-orange-400/[0.02]",
                          },
                          {
                            label: "Sector / Zone",
                            value: project.sector || "N/A",
                            subText: "Regional Zone",
                            icon: Globe,
                            color: "text-cyan-400",
                            border: "hover:border-cyan-400/30",
                            bg: "bg-cyan-400/[0.02]",
                          },
                          {
                            label: "RERA Reg. No.",
                            value: project.reraNumber || "Applied",
                            subText: "Govt. Verification",
                            icon: ShieldCheck,
                            color: "text-rose-400",
                            border: "hover:border-rose-400/30",
                            bg: "bg-rose-400/[0.02]",
                          },
                          {
                            label: "Structure",
                            value: `${project.noOfTowers || '0'} Towers`,
                            subText: `${project.noOfFloors || '0'} Floor Heights`,
                            icon: Building,
                            color: "text-indigo-400",
                            border: "hover:border-indigo-400/30",
                            bg: "bg-indigo-400/[0.02]",
                          },
                        ].map((stat, i) => (
                          <div
                            key={i}
                            className={`p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] ${stat.border} ${stat.bg} flex flex-col justify-between space-y-4 transition-all duration-300 hover:scale-[1.03] hover:bg-white/[0.04] shadow-md`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[7.5px] text-white/40 uppercase tracking-[0.25em] font-black">
                                {stat.label}
                              </span>
                              <stat.icon size={12} className={stat.color} />
                            </div>
                            <div className="space-y-1">
                              <div className="text-[13px] font-semibold text-white truncate">
                                {stat.value}
                              </div>
                              <div className="text-[9px] font-mono text-white/30 text-left">
                                {stat.subText}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Construction Progress Roadmap Component */}
                      <ProgressRoadmap project={project} />
 
                      {/* Builder Sales Advisory Message Block */}
                      {project.notes && (
                        <div className="p-6 bg-gradient-to-r from-white/[0.02] to-transparent rounded-2xl border border-white/[0.06] space-y-4 font-sans relative overflow-hidden shadow-lg">
                          <div className="absolute top-4 right-6 text-white/[0.02] pointer-events-none select-none">
                            <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                            </svg>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[7.5px] uppercase font-black tracking-[0.25em] text-amber-500 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                              <Info size={10} /> 
                              Builder Sales Advisory Desk
                            </span>
                            <div className="h-px bg-white/[0.06] flex-1" />
                          </div>
                          
                          <p className="text-xs text-white/80 leading-relaxed italic pr-4">
                            &ldquo;{project.notes}&rdquo;
                          </p>
                          <div className="text-[8px] font-mono text-white/30 flex items-center justify-between border-t border-white/[0.06] pt-3">
                            <span>REGIONAL EXECUTIVE SUMMARY</span>
                            <span className="text-emerald-400 font-bold tracking-widest uppercase">✓ VERIFIED INSTANTLY</span>
                          </div>
                        </div>
                      )}
 
                      {/* Fine Visual Interactive Portfolio */}
                      {project.images && project.images.length > 0 && (
                        <div className="space-y-4 font-sans">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                            <h3 className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em] flex items-center gap-2">
                              <div className="w-4 h-px bg-amber-500/50" />
                              Interactive Asset Portfolio
                            </h3>
                            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest font-black">
                              {project.images.length} Captured Details
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {project.images.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setCurrentImgIndex(idx);
                                  modalContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className={`relative aspect-[16/11] rounded-2xl overflow-hidden border transition-all duration-300 group cursor-pointer shadow-md ${
                                  currentImgIndex === idx
                                    ? "border-amber-500 ring-2 ring-amber-500/20 scale-[1.03]"
                                    : "border-white/[0.06] hover:border-white/20"
                                }`}
                              >
                                <img
                                  src={img.data}
                                  alt={img.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-108 transition-all duration-500"
                                />
                                <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 ${
                                  currentImgIndex === idx ? "opacity-100 bg-black/30" : ""
                                }`}>
                                  <Maximize2 size={12} className="text-white" />
                                  <span className="text-[8px] text-white font-black uppercase tracking-widest">
                                    {currentImgIndex === idx ? "Featured Now" : "Focus Image"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {currentModalTab === "specs" && (
                    <motion.div
                      id="project-tabpanel-specs"
                      role="tabpanel"
                      aria-labelledby="project-tab-specs"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="space-y-10"
                    >
                      {/* Categorized Technical Specifications */}
                      <div className="space-y-8">
                        {[
                          {
                            title: "Structural Engineering & Layout",
                            icon: Building,
                            items: [
                              { label: "Typology Option", value: (project.type || "Apartment").replace("FLATS", "Premium Residence"), icon: Building },
                              { label: "Specific Sub-Type", value: project.subType || "General Unit", icon: Layout },
                              { label: "Tower Configuration", value: project.towersAndFloors || "Premium Structure Details", icon: Building2 },
                            ]
                          },
                          {
                            title: "Dimensioning & Area Proportions",
                            icon: LayoutGrid,
                            items: [
                              { label: "Combined Footprint", value: project.projectSize ? `${project.projectSize} Acres` : "Inquire dimension metric", icon: Sparkles },
                              { label: "Built Range Scale", value: project.sizeRange ? `${project.sizeRange} Sq.Ft.` : "Super built-up range", icon: Layers },
                              { label: "Washroom Allocations", value: project.bathrooms ? `${project.bathrooms} Washrooms Assigned` : "Standard specifications", icon: Bath },
                            ]
                          },
                          {
                            title: "Time Schedules & Launch Data",
                            icon: Calendar,
                            items: [
                              { label: "Official Launch Date", value: project.launchDate ? new Date(project.launchDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "Approved Stage Status", icon: Clock },
                              { label: "Total Inventory Capacity", value: project.totalUnits ? `${project.totalUnits} Total Units` : "Restricted release phase", icon: Home },
                            ]
                          }
                        ].map((category, catIdx) => (
                          <div key={catIdx} className="space-y-4 font-sans">
                            <div className="flex items-center gap-3">
                              <category.icon size={12} className="text-amber-500" />
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                                {category.title}
                              </h4>
                              <div className="h-px bg-white/[0.06] flex-1" />
                            </div>
 
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5.5">
                              {category.items.map((item, itemIdx) => (
                                <div
                                  key={itemIdx}
                                  className="p-5 bg-white/[0.015] border border-white/[0.05] hover:border-white/15 rounded-2xl flex flex-col justify-between space-y-4 shadow-md group transition-all duration-300 hover:scale-[1.02]"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-white/[0.03] group-hover:bg-amber-500/10 transition-colors duration-300">
                                      <item.icon size={11} className="text-white/40 group-hover:text-amber-500 transition-colors duration-300" />
                                    </div>
                                    <span className="text-[7.5px] text-white/40 uppercase font-black tracking-widest leading-none">
                                      {item.label}
                                    </span>
                                  </div>
                                  <span className="text-[12px] font-semibold text-white leading-tight">
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
 
                  {currentModalTab === "payment" && (
                    <motion.div
                      id="project-tabpanel-payment"
                      role="tabpanel"
                      aria-labelledby="project-tab-payment"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="space-y-8"
                    >
                      <div className="space-y-8 font-sans">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-white/[0.06] pb-5">
                          <div className="space-y-1">
                            <h3 className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em] flex items-center gap-2">
                              <div className="w-4 h-px bg-amber-500/50" />
                              Transaction & Financing Paths
                            </h3>
                            <p className="text-[10px] text-white/40">
                              Validated path options conforming with current advisory guidelines.
                            </p>
                          </div>
                          
                          {/* Luxe Single Active Plan Display */}
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-md">
                            <span className="text-[8.5px] uppercase font-black text-amber-500 tracking-wider">
                              Active Plan: {activePlan === "plp" ? "Possession-Linked (PLP)" : activePlan === "clp" ? "Construction-Linked (CLP)" : "Subvention Scheme"}
                            </span>
                          </div>
                        </div>
 
                        {/* Selected Sub-Tab Contents */}
                        <div className="space-y-5">
                          {activePlan === "plp" && (() => {
                            const plp = plans.plp;
                            const isCustom = !!project.paymentPlans?.plp?.enabled;
                            return (
                              <div className="p-6 sm:p-8 bg-white/[0.015] rounded-[24px] border border-white/[0.05] space-y-8 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-[50px]" />
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-amber-500">
                                      <Percent size={13} />
                                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
                                        Possession-Linked payment (PLP)
                                      </h4>
                                    </div>
                                    <p className="text-[10px] text-white/40">
                                      Chronological milestones bound with developer structural progress.
                                    </p>
                                  </div>
                                  <span className={`text-[8px] font-mono font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                                    isCustom 
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                                      : "border-white/10 bg-white/5 text-white/50"
                                  }`}>
                                    {isCustom ? "Custom Approved" : "Standard Policy"}
                                  </span>
                                                   {/* Connected Milestone graphic / Custom PLP Milestones */}
                                {plp.hasMilestones ? (
                                  <div className="space-y-3">
                                    {(plp.milestones || []).map((stage: any, idx: number) => {
                                      const status = stage.status || "Not Started";
                                      let statusBadge = (
                                        <span className="text-[8px] tracking-wider font-extrabold px-2.5 py-1 rounded bg-[#0E1013] text-white/30 border border-white/[0.06] whitespace-nowrap">
                                          Scheduled
                                        </span>
                                      );
                                      if (status === "In Progress") {
                                        statusBadge = (
                                          <span className="text-[8px] tracking-wider font-black px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/15 animate-pulse whitespace-nowrap">
                                            In Progress
                                          </span>
                                        );
                                      } else if (status === "Completed") {
                                        statusBadge = (
                                          <span className="text-[8px] tracking-wider font-black px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                            Cleared ✓
                                          </span>
                                        );
                                      }

                                      return (
                                        <div key={idx} className="p-4 bg-black/15 rounded-xl border border-white/[0.04] hover:border-white/10 transition-all duration-300 flex flex-col gap-3 group">
                                          <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                                            <div className="flex items-start gap-3">
                                              <span className="w-6 h-6 bg-white/[0.03] border border-white/[0.06] rounded-lg flex items-center justify-center text-[10px] font-black text-white font-mono shrink-0 mt-0.5 shadow-md">
                                                {idx + 1}
                                              </span>
                                              <div className="space-y-1">
                                                <div className="text-[11.5px] font-bold text-white transition-colors duration-300 group-hover:text-amber-500">
                                                  {stage.stage}
                                                </div>
                                                {stage.timeline && (
                                                  <div className="text-[9.5px] text-white/40 flex items-center gap-1.5">
                                                    <span className="font-semibold text-[8px] uppercase tracking-wider text-amber-500/80 font-sans">Trigger:</span>
                                                    <span>{stage.timeline}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 ml-auto sm:ml-0 font-sans">
                                              <span className="text-[11px] font-bold text-white px-2 py-1 bg-white/[0.03] rounded-lg border border-white/[0.05] w-12 text-center shadow-inner">
                                                {stage.percentage || "0"}%
                                              </span>
                                              {statusBadge}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                                    <div className="hidden md:block absolute top-[40%] left-1/4 right-1/4 h-px bg-dashed bg-gradient-to-r from-amber-500/40 to-emerald-500/40 pointer-events-none" />

                                    {[
                                      { title: "Booking Phase", val: plp.bookingPercentage || "30", desc: "Commitment payment during initial booking registration stage", color: "border-amber-500" },
                                      { title: "Mid-Build Phase", val: plp.constructionPercentage || "30", desc: "Instalments spanning core physical structural progress", color: "border-orange-500" },
                                      { title: "Handover / Key", val: plp.possessionPercentage || "40", desc: "Handover clearing during final occupancy registration", color: "border-emerald-500" },
                                    ].map((node, nodeIdx) => (
                                      <div key={nodeIdx} className="bg-black/35 p-5 rounded-2xl border border-white/[0.04] flex flex-col justify-between space-y-4 relative z-10 shadow-lg">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[7.5px] uppercase tracking-wider text-white/40 font-black">
                                            Stage {nodeIdx + 1}: {node.title}
                                          </span>
                                          <div className={`w-2 h-2 rounded-full border ${node.color} bg-[#060708]`} />
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-2xl font-semibold text-white tracking-tight">
                                            {node.val}%
                                          </div>
                                          <p className="text-[9.5px] text-white/40 leading-relaxed font-medium">
                                            {node.desc}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}                </div>
 
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="p-4 bg-black/25 rounded-xl border border-white/[0.04] flex items-center justify-between">
                                    <span className="text-[8px] text-white/40 uppercase font-black tracking-wider">Milestone Ratio</span>
                                    <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/15">{plp.type || "30:30:40"}</span>
                                  </div>
                                  {plp.durationMonths && (
                                    <div className="p-4 bg-black/25 rounded-xl border border-white/[0.04] flex items-center justify-between">
                                      <span className="text-[8px] text-white/40 uppercase font-black tracking-wider">Project Window</span>
                                      <span className="text-xs font-semibold text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">{plp.durationMonths} Months</span>
                                    </div>
                                  )}
                                </div>
 
                                {plp.notes && (
                                  <div className="p-4 bg-black/10 rounded-xl border border-white/[0.04] border-dashed flex items-start gap-2.5 text-white/50 text-[11px] leading-relaxed italic">
                                    <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span>&ldquo;{plp.notes}&rdquo;</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
 
                          {activePlan === "clp" && (() => {
                            const clp = plans.clp;
                            const isCustom = !!project.paymentPlans?.clp?.enabled;
                            return (
                              <div className="p-6 sm:p-8 bg-white/[0.015] rounded-[24px] border border-white/[0.05] space-y-8 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.02] rounded-full blur-[50px]" />
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-amber-500">
                                      <Percent size={13} />
                                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
                                        Construction-Linked scheme (CLP)
                                      </h4>
                                    </div>
                                    <p className="text-[10px] text-white/40">
                                      Projections triggered on certified building progress.
                                    </p>
                                  </div>
                                  <span className={`text-[8px] font-mono font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                                    isCustom 
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                                      : "border-white/10 bg-white/5 text-white/50"
                                  }`}>
                                    {isCustom ? "Custom Approved" : "Standard Model"}
                                  </span>
                                </div>
 
                                <div className="space-y-3">
                                  {(clp.stages || []).map((stage: any, idx: number) => {
                                    const status = stage.status || "Not Started";
                                    let statusBadge = (
                                      <span className="text-[8px] tracking-wider font-extrabold px-2.5 py-1 rounded bg-[#0E1013] text-white/30 border border-white/[0.06] whitespace-nowrap">
                                        Scheduled
                                      </span>
                                    );
                                    if (status === "In Progress") {
                                      statusBadge = (
                                        <span className="text-[8px] tracking-wider font-black px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/15 animate-pulse whitespace-nowrap">
                                          In Progress
                                        </span>
                                      );
                                    } else if (status === "Completed") {
                                      statusBadge = (
                                        <span className="text-[8px] tracking-wider font-black px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                          Cleared ✓
                                        </span>
                                      );
                                    }
 
                                    return (
                                      <div key={idx} className="p-4 bg-black/15 rounded-xl border border-white/[0.04] hover:border-white/10 transition-all duration-300 flex flex-col gap-3 group">
                                        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                                          <div className="flex items-start gap-3">
                                            <span className="w-6 h-6 bg-white/[0.03] border border-white/[0.06] rounded-lg flex items-center justify-center text-[10px] font-black text-white font-mono shrink-0 mt-0.5 shadow-md">
                                              {idx + 1}
                                            </span>
                                            <div className="space-y-1">
                                              <div className="text-[11.5px] font-bold text-white transition-colors duration-300 group-hover:text-amber-500">
                                                {stage.stage}
                                              </div>
                                              {stage.timeline && (
                                                <div className="text-[9.5px] text-white/40 flex items-center gap-1.5">
                                                  <span className="font-semibold text-[8px] uppercase tracking-wider text-amber-500/80">Est. Date:</span>
                                                  <span>{stage.timeline}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 ml-auto sm:ml-0 font-sans">
                                            <span className="text-[11px] font-bold text-white px-2 py-1 bg-white/[0.03] rounded-lg border border-white/[0.05] w-12 text-center shadow-inner">
                                              {stage.percentage}%
                                            </span>
                                            {statusBadge}
                                          </div>
                                        </div>
 
                                        {stage.chargeType && (
                                          <div className="flex items-center gap-2 pl-9 border-t border-white/[0.04] pt-2 text-[8px] text-white/30 mt-0.5">
                                            <span className="font-black text-[7.5px] uppercase tracking-wider text-white/20">Stage inclusions:</span>
                                            <span className="bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.04] text-white/60">
                                              {stage.chargeType}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
 
                                {clp.notes && (
                                  <div className="p-4 bg-black/10 rounded-xl border border-white/[0.04] border-dashed flex items-start gap-2 text-white/50 text-[11px] leading-relaxed italic">
                                    <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span>&ldquo;{clp.notes}&rdquo;</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {activePlan === "subvention" && (() => {
                            const sub = plans.subvention;
                            const isCustom = !!project.paymentPlans?.subvention?.enabled;
                            const booking = Number(sub.bookingPercentage || 10);
                            const bank = Number(sub.bankFinancedPercentage || 90);
                            const sum = booking + bank;

                            const banksList = (sub.fundingBank || "")
                              .split(",")
                              .map((b: string) => b.trim())
                              .filter(Boolean);

                            let noEmiDisplay = "Till Possession";
                            if (sub.noEmiTriggerType === "Months-Linked") {
                              noEmiDisplay = `${sub.noEmiPeriodMonths || "24"} Months`;
                            } else if (sub.noEmiTriggerType === "Structure-Linked") {
                              noEmiDisplay = "Till Superstructure Check";
                            } else if (sub.noEmiPeriodMonths) {
                              noEmiDisplay = `${sub.noEmiPeriodMonths} Months`;
                            }

                            return (
                              <div className="p-6 bg-surface-2 rounded-3xl border border-white/5 space-y-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[40px]" />
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 text-amber-primary">
                                      <Percent size={14} className="animate-pulse" />
                                      <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">
                                        Financing Subvention Scheme
                                      </h4>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-relaxed">
                                      Low downpayment model supported directly by certified retail mortgage desks.
                                    </p>
                                  </div>
                                  <span className={`text-[9px] font-mono font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                                    isCustom 
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                                      : "border-white/5 bg-surface-3/50 text-text-dim"
                                  }`}>
                                    {isCustom ? "Desk Custom Match" : "Standard Flow"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="p-4 bg-[#18191b] rounded-2xl border border-white/5 flex flex-col justify-between space-y-1.5 shadow-sm">
                                    <span className="text-[8px] text-text-dim uppercase font-black tracking-wider">Initial Downpayment</span>
                                    <span className="text-sm font-black text-text-primary">{booking}% Contribution</span>
                                  </div>
                                  <div className="p-4 bg-[#18191b] rounded-2xl border border-white/5 flex flex-col justify-between space-y-1.5 shadow-sm">
                                    <span className="text-[8px] text-text-dim uppercase font-black tracking-wider">Retail Bank Mortgaging</span>
                                    <span className="text-sm font-black text-text-primary">{bank}% Financed Sum</span>
                                  </div>
                                </div>

                                {/* RATIO ALLOCATION VISUALIZER PRO BAR */}
                                <div className="space-y-2 p-4 bg-[#18191b] rounded-2xl border border-white/5 shadow-inner">
                                  <div className="flex justify-between items-center text-[8px] uppercase font-black tracking-widest text-[#989a9e]">
                                    <span>Ratio Proportion Map</span>
                                    <span className="font-mono text-xs text-amber-primary">{booking}:{bank} Split Ratio</span>
                                  </div>
                                  <div className="w-full h-4 bg-surface rounded-full overflow-hidden border border-white/5 flex p-[2px]">
                                    <div
                                      style={{ width: `${Math.min(100, Math.max(0, (booking / (sum || 100)) * 100))}%` }}
                                      className="bg-amber-primary h-full rounded-l-full flex items-center justify-center text-[8px] font-black text-black select-none"
                                    >
                                      {booking >= 15 && `Own (${booking}%)`}
                                    </div>
                                    <div
                                      style={{ width: `${Math.min(100, Math.max(0, (bank / (sum || 100)) * 100))}%` }}
                                      className="bg-emerald-500 h-full rounded-r-full flex items-center justify-center text-[8px] font-black text-white select-none"
                                    >
                                      {bank >= 15 && `Bank Loan (${bank}%)`}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                                  <div className="p-3 bg-[#18191b] rounded-xl border border-white/5 flex flex-col justify-center space-y-1">
                                    <div className="text-[8px] text-text-dim font-black uppercase tracking-wider">Subvention EMI Shield</div>
                                    <div className="text-xs font-bold text-text-primary">{noEmiDisplay}</div>
                                  </div>
                                  <div className="p-3 bg-[#18191b] rounded-xl border border-white/5 flex flex-col justify-center space-y-1">
                                    <div className="text-[8px] text-text-dim font-black uppercase tracking-wider">LTV Cap Index</div>
                                    <div className="text-xs font-bold text-text-primary">{sub.maxLoanAmount || "Up to 80% Segment"}</div>
                                  </div>
                                  <div className="p-3 bg-[#18191b] rounded-xl border border-white/5 flex flex-col justify-center space-y-1">
                                    <div className="text-[8px] text-text-dim font-black uppercase tracking-wider">Subsidy Coverage</div>
                                    <div className="text-xs font-bold text-text-primary">{sub.subsidyRate || "100"}% Rate Coverage</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="p-4 bg-[#18191b] rounded-2xl border border-white/5 space-y-1.5">
                                    <div className="text-[8px] text-text-dim font-black uppercase tracking-wider leading-none">Eligible Typologies</div>
                                    <div className="text-[11px] font-bold text-text-primary leading-tight">{sub.eligibleUnits || "All general segment inventory configurations"}</div>
                                  </div>
                                  <div className="p-4 bg-[#18191b] rounded-2xl border border-white/5 space-y-1.5">
                                    <div className="text-[8px] text-text-dim font-black uppercase tracking-wider leading-none">Pre-Approved Partners</div>
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                      {banksList.length > 0 ? (
                                        banksList.map((bk: string) => (
                                          <span key={bk} className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-md">
                                            {bk}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-[9px] text-[#86888c] font-semibold italic">All tier-1 scheduling banks</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {sub.notes && (
                                  <div className="p-4 bg-[#18191b]/50 rounded-2xl border border-white/5 border-dashed flex items-start gap-2 text-text-dim text-xs leading-relaxed italic">
                                    <Info size={14} className="text-amber-primary shrink-0 mt-0.5" />
                                    <span>&ldquo;{sub.notes}&rdquo;</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentModalTab === "inventory" && (
                    <motion.div
                      id="project-tabpanel-inventory"
                      role="tabpanel"
                      aria-labelledby="project-tab-inventory"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="space-y-8"
                    >
                      <div className="space-y-8 font-sans">
                        {/* Header metadata */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-white/[0.06] pb-5">
                          <div className="space-y-1">
                            <h3 className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em] flex items-center gap-2">
                              <div className="w-4 h-px bg-amber-500/50" />
                              Dynamic Unit Inventory Registry
                            </h3>
                            <p className="text-[10px] text-white/40">
                              Real-world verification desk, status management, and size catalog for individual allotments.
                            </p>
                          </div>
                        </div>

                        {/* Bento Statistics Dashboard Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {/* Card 1: Total units */}
                          <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl flex flex-col justify-between space-y-3 shadow-md">
                            <div className="flex items-center justify-between">
                              <span className="text-[7.5px] text-white/40 uppercase tracking-widest font-black">Total Cataloged</span>
                              <Layers size={11} className="text-blue-400" />
                            </div>
                            <div>
                              <div className="text-[18px] font-bold text-white">{totalCount}</div>
                              <div className="text-[8px] text-white/30 uppercase font-black tracking-wider mt-0.5">Primary Units</div>
                            </div>
                          </div>

                          {/* Card 2: Available list */}
                          <div className="p-4 bg-emerald-500/[0.01] border border-emerald-500/10 rounded-2xl flex flex-col justify-between space-y-3 shadow-md">
                            <div className="flex items-center justify-between">
                              <span className="text-[7.5px] text-emerald-400/50 uppercase tracking-widest font-black">Available</span>
                              <CheckCircle2 size={11} className="text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-[18px] font-bold text-emerald-400">{availableCount}</div>
                              <div className="w-full bg-[#181a1e] h-1.5 rounded-full mt-1.5 overflow-hidden flex">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full" 
                                  style={{ width: `${totalCount > 0 ? (availableCount / totalCount) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Card 3: Sold list */}
                          <div className="p-4 bg-red-500/[0.01] border border-red-500/10 rounded-2xl flex flex-col justify-between space-y-3 shadow-md">
                            <div className="flex items-center justify-between">
                              <span className="text-[7.5px] text-red-400/50 uppercase tracking-widest font-black">Acquired / Sold</span>
                              <ShieldCheck size={11} className="text-red-400" />
                            </div>
                            <div>
                              <div className="text-[18px] font-bold text-red-400">{soldCount}</div>
                              <div className="w-full bg-[#181a1e] h-1.5 rounded-full mt-1.5 overflow-hidden flex">
                                <div 
                                  className="bg-red-500 h-full rounded-full" 
                                  style={{ width: `${totalCount > 0 ? (soldCount / totalCount) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Card 4: Reserved lists */}
                          <div className="p-4 bg-amber-500/[0.01] border border-amber-500/10 rounded-2xl flex flex-col justify-between space-y-3 shadow-md">
                            <div className="flex items-center justify-between">
                              <span className="text-[7.5px] text-amber-500/50 uppercase tracking-widest font-black">Reserved desk</span>
                              <Clock size={11} className="text-amber-500" />
                            </div>
                            <div>
                              <div className="text-[18px] font-bold text-amber-500">{reservedCount}</div>
                              <div className="w-full bg-[#181a1e] h-1.5 rounded-full mt-1.5 overflow-hidden flex">
                                <div 
                                  className="bg-amber-500 h-full rounded-full" 
                                  style={{ width: `${totalCount > 0 ? (reservedCount / totalCount) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Search and Filters Segment Controls */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl">
                          <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                              type="text"
                              value={inventorySearch}
                              onChange={(e) => setInventorySearch(e.target.value)}
                              placeholder="Search by Unit No, Tower, or Configuration..."
                              aria-label="Search units"
                              className="w-full bg-black/40 pl-9 pr-8 py-2 border border-white/[0.06] rounded-xl text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                            />
                            {inventorySearch && (
                              <button 
                                onClick={() => setInventorySearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                                aria-label="Clear search"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>

                          <div className="flex overflow-x-auto no-scrollbar bg-black/40 p-1 rounded-xl border border-white/[0.06] shrink-0 gap-1.5 font-sans">
                            {(["All", "Available", "Sold", "Reserved"] as const).map((filterOpt) => {
                              const isCur = inventoryStatusFilter === filterOpt;
                              const count = filterOpt === "All" ? totalCount : filterOpt === "Available" ? availableCount : filterOpt === "Sold" ? soldCount : reservedCount;
                              return (
                                <button
                                  key={filterOpt}
                                  onClick={() => setInventoryStatusFilter(filterOpt)}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    isCur 
                                      ? "bg-amber-500 text-black font-black" 
                                      : "text-white/40 hover:text-white/80"
                                  }`}
                                >
                                  <span>{filterOpt}</span>
                                  <span className={`text-[8px] font-mono px-1 py-0.2 rounded-full ${isCur ? "bg-black/20 text-black" : "bg-white/[0.05] text-white/40"}`}>
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Interactive Unit Inventory list Grid */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={inventoryStatusFilter}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18, ease: "easeInOut" }}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5"
                          >
                          {filteredUnits.length > 0 ? (
                            filteredUnits.map((u) => {
                              const isEditing = activeUnitIdForStatusEdit === u.id;
                              const badgeStyle = 
                                u.status === "Available" 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : u.status === "Sold"
                                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20";

                              const statusIcon = 
                                u.status === "Available" ? <CheckCircle2 size={10} className="shrink-0" /> :
                                u.status === "Sold" ? <ShieldCheck size={10} className="shrink-0" /> :
                                <Clock size={10} className="shrink-0" />;

                              return (
                                <motion.div
                                  layout
                                  key={u.id}
                                  className={`p-4 bg-white/[0.015] border rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:scale-[1.01] transition-all duration-200 group relative ${
                                    isEditing ? "border-amber-500/70 shadow-[0_0_12px_rgba(242,162,30,0.1)]" : "border-white/[0.05] hover:border-white/10"
                                  }`}
                                >
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[7.5px] font-mono uppercase tracking-widest text-[#9c9ea2]">
                                        {u.tower}
                                      </span>
                                      
                                      <motion.button
                                        layout
                                        onClick={() => setActiveUnitIdForStatusEdit(isEditing ? null : u.id)}
                                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 hover:scale-[1.02] ${badgeStyle}`}
                                        title="Click to update status"
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                      >
                                        <AnimatePresence mode="wait">
                                          <motion.span
                                            key={u.status}
                                            initial={{ y: -6, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 6, opacity: 0 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="flex items-center gap-1"
                                          >
                                            {statusIcon}
                                            <span>{u.status}</span>
                                          </motion.span>
                                        </AnimatePresence>
                                      </motion.button>
                                    </div>
                                    
                                    <div className="flex items-baseline justify-between select-none">
                                      <h4 className="text-[15px] font-black tracking-tight text-white">
                                        Unit #{u.id.split("-")[1]}
                                      </h4>
                                      <span className="text-[10px] text-white/50 font-bold">
                                        {u.bhk}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 border-t border-b border-white/[0.03] py-2 text-[10px] font-sans">
                                    <div>
                                      <div className="text-[7.5px] uppercase font-black tracking-wide text-white/35">Built footprint</div>
                                      <div className="font-semibold text-white mt-0.5">{u.areaSqft} Sq.Ft.</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[7.5px] uppercase font-black tracking-wide text-white/35">Base price limit</div>
                                      <div className="font-bold text-amber-500 mt-0.5">{formatPrice(u.price)}</div>
                                    </div>
                                  </div>

                                  <div className="pt-0.5 flex items-center justify-between">
                                    <span className="text-[7px] text-white/30 uppercase tracking-widest leading-none font-mono">
                                      Floor level {u.floor}
                                    </span>
                                    
                                    <button
                                      onClick={() => setActiveUnitIdForStatusEdit(isEditing ? null : u.id)}
                                      className="text-[8px] text-amber-500 hover:text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1 select-none cursor-pointer"
                                    >
                                      <Edit size={8} />
                                      <span>Change Status</span>
                                    </button>
                                  </div>

                                  <AnimatePresence>
                                    {isEditing && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute inset-0 bg-[#0B0C0E]/95 rounded-2xl p-4 flex flex-col justify-center space-y-3.5 z-20 border border-amber-500/40"
                                      >
                                        <div className="text-center">
                                          <div className="text-[8px] text-white/40 uppercase font-black tracking-widest">Select status for #{u.id.split("-")[1]}</div>
                                          <div className="text-[10px] text-white font-medium mt-0.5">Authorize real-time status update</div>
                                        </div>

                                        <div className="flex flex-col gap-1.5 font-sans">
                                          {(["Available", "Sold", "Reserved"] as const).map((statusVal) => {
                                            const isActiveVal = u.status === statusVal;
                                            return (
                                              <button
                                                key={statusVal}
                                                onClick={() => handleUpdateUnitStatus(u.id, statusVal)}
                                                className={`py-1.5 px-3 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                                                  isActiveVal
                                                    ? "bg-amber-500 text-black border-amber-500 animate-pulse"
                                                    : "bg-white/[0.02] text-white/70 border-white/[0.05] hover:bg-white/[0.06] hover:text-white"
                                                }`}
                                              >
                                                <span>{statusVal}</span>
                                                {isActiveVal && <Check size={10} />}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        <button
                                          onClick={() => setActiveUnitIdForStatusEdit(null)}
                                          className="text-[8px] text-white/40 hover:text-white uppercase font-black tracking-widest mt-1 text-center cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Status Update Flash Overlay */}
                                  <AnimatePresence>
                                    {updatedUnits[u.id] && (
                                      <motion.div
                                        key={updatedUnits[u.id]}
                                        initial={{ opacity: 0.85 }}
                                        animate={{ opacity: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                        className={`absolute inset-0 rounded-2xl pointer-events-none z-10 ${
                                          u.status === "Available"
                                            ? "bg-emerald-500/20 shadow-[inset_0_0_24px_rgba(16,185,129,0.45)] border border-emerald-500/50"
                                            : u.status === "Sold"
                                              ? "bg-red-500/20 shadow-[inset_0_0_24px_rgba(239,68,68,0.45)] border border-red-500/50"
                                              : "bg-amber-500/20 shadow-[inset_0_0_24px_rgba(245,158,11,0.45)] border border-amber-500/50"
                                        }`}
                                      />
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              );
                            })
                          ) : (
                            <div className="col-span-full p-12 text-center bg-white/[0.01] rounded-2xl border border-white/[0.05] border-dashed">
                              <FileX size={20} className="text-white/20 mx-auto mb-2.5" />
                              <p className="text-[10px] text-white/50 font-black tracking-widest uppercase">
                                No Units Match Selected Filters
                              </p>
                              <p className="text-[9px] text-white/35 italic mt-1">
                                Try adjusting search keywords or selecting "All" categories.
                              </p>
                            </div>
                          )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Right Column: Builder & Downloads */}
              <div className="lg:col-span-4 space-y-10">
                {/* Builder Card with Gold Highlights */}
                <div className="bg-gradient-to-b from-surface-2 to-surface rounded-[24px] p-6 border border-border-dim hover:border-amber-primary/40 relative overflow-hidden group shadow-xl transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-primary/5 rounded-full -mr-16 -mt-16 blur-[40px] group-hover:bg-amber-primary/10 transition-all duration-700" />
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-primary/10 rounded-2xl flex items-center justify-center text-amber-primary border border-amber-primary/25 shadow-md group-hover:scale-105 transition-transform duration-500">
                          <Building2 size={22} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-text-primary leading-tight">
                            {project.builderName || "Master Builder"}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-primary/15 text-amber-primary border border-amber-primary/30 uppercase tracking-wider">
                              <Award size={10} /> Tier-1 Developer
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck size={10} /> RERA Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                      {project.builderName === "M3M"
                        ? "Founded in 2010, M3M India has quickly risen as one of India's most dynamic and innovative luxury real estate developers, built on the values of ethical governance, transparency, and architectural distinction."
                        : project.builderName === "DLF"
                          ? "Founded in 1946 by Chaudhary Raghvendra Singh, DLF began with the development of 22 urban colonies in Delhi. Today, DLF is the largest publicly listed real estate conglomerate in India."
                          : `A premier Grade-A developer recognized for architectural innovation, timely deliveries, and commitment to delivering exceptional residential experiences across premium sectoral nodes.`}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-dim/60">
                      <div className="text-left">
                        <div className="text-[8px] text-text-dim uppercase font-black tracking-widest leading-none">Deliveries</div>
                        <div className="text-xs font-bold text-text-primary mt-1">45k+ Units Handed Over</div>
                      </div>
                      <div className="text-left">
                        <div className="text-[8px] text-text-dim uppercase font-black tracking-widest leading-none">Track Record</div>
                        <div className="text-xs font-bold text-emerald-400 mt-1">98.4% On-Time Index</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onViewBuilder(project.builderName || "General Builder")}
                      className="w-full py-3 bg-amber-primary hover:bg-amber-primary/90 text-black rounded-xl text-[10px] font-black uppercase tracking-[0.18em] transition-all duration-300 shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LayoutGrid size={13} />
                      <span>Explore Developer Portfolio</span>
                    </button>
                  </div>
                </div>

                {/* Downloads Section with Micro-interaction */}
                <div className="space-y-4">
                  <h3 className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em] flex items-center gap-2">
                    <div className="w-4 h-px bg-amber-500/50" />
                    Secure Downloads & Dossiers
                  </h3>
                  
                  <div className="space-y-3">
                    {(() => {
                      const uniquePdfs: any[] = [];
                      const seenNames = new Set();
                      if (project.pdfs) {
                        project.pdfs.forEach((pdf) => {
                          if (!seenNames.has(pdf.name)) {
                            seenNames.add(pdf.name);
                            uniquePdfs.push(pdf);
                          }
                        });
                      }

                      return uniquePdfs.length > 0 ? (
                        uniquePdfs.map((pdf, idx) => (
                          <motion.button
                            whileHover={{ x: 4 }}
                            key={idx}
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = pdf.data;
                              link.download = pdf.name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              showToast("Preparing dossier download...", "info");
                            }}
                            className="w-full flex items-center justify-between p-4 bg-white/[0.015] border border-white/[0.05] hover:border-amber-500/30 hover:bg-white/[0.03] rounded-2xl transition-all group text-left shadow-lg cursor-pointer"
                          >
                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className="bg-red-500/10 p-2.5 rounded-xl text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                                <FileText size={14} />
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-[11.5px] font-bold text-white truncate group-hover:text-amber-500 transition-colors">
                                  {pdf.name}
                                </span>
                                <span className="text-[7.5px] text-white/30 font-mono uppercase tracking-widest pt-0.5">
                                  Secure PDF · {(pdf.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                            <Download
                              size={12}
                              className="text-white/40 group-hover:text-amber-500 transition-colors shrink-0 ml-2 animate-bounce"
                            />
                          </motion.button>
                        ))
                      ) : (
                        <div className="p-8 border border-dashed border-white/[0.06] rounded-2xl text-center space-y-3 bg-white/[0.01]">
                          <FileX size={18} className="text-white/20 mx-auto" />
                          <p className="text-[8px] text-white/30 font-bold tracking-wider uppercase">
                            No Documentation Uploaded
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions Panel */}
        <div className="p-6 sm:p-8 border-t border-white/[0.06] bg-[#0A0B0D]">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] uppercase font-black tracking-[0.25em] text-white/40">
                  Internal Desk Status
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest pl-0.5">
                    Live Portal Verified
                  </span>
                </div>
              </div>
              
              <div className="w-px h-8 bg-white/[0.06]" />
              
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] uppercase font-black tracking-[0.25em] text-white/40">
                  Last Cache Sync
                </span>
                <span className="text-[9px] font-mono font-bold text-white">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 select-none">
              {hasEditPermission && onEdit && (
                <button
                  onClick={() => {
                    onEdit(project);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-5 py-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit size={12} />
                  <span>Edit Info</span>
                </button>
              )}
              {hasDeletePermission && onDelete && (
                <button
                  onClick={() => {
                    onDelete(project);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-5 py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-10 py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-amber-500/10 active:scale-98 cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {isPreviewModalOpen && (
        <ImagePreviewModal
          images={images}
          initialIndex={previewInitialIndex}
          onClose={() => setIsPreviewModalOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
};

const ResalePropertyDetailModal = ({
  property,
  onClose,
  showToast,
  onViewBuilder,
  onEdit,
  onDelete,
  hasEditPermission,
  hasDeletePermission,
}: {
  property: ResaleProperty;
  onClose: () => void;
  showToast: (
    msg: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;
  onViewBuilder: (name: string) => void;
  onEdit?: (p: ResaleProperty) => void;
  onDelete?: (p: ResaleProperty) => void;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
}) => {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ name: "Default View", size: 0, data: `https://picsum.photos/seed/${property.societyName}/1920/1080` }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 select-none font-sans">
      {/* Blurred Deep Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-6xl h-full max-h-[95vh] sm:max-h-[90vh] bg-gradient-to-b from-[#13151A] to-[#0A0B0E] border border-white/[0.08] rounded-2xl sm:rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-50 text-white"
      >
        {/* Fine Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-30 p-2.5 bg-black/60 hover:bg-amber-500 hover:text-black text-white/75 rounded-full border border-white/10 transition-all duration-300 shadow-lg cursor-pointer group"
        >
          <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-none">
            {/* Hero Interactive Area */}
            <div className="relative h-[220px] sm:h-[400px] lg:h-[480px] w-full overflow-hidden">
              <img
                src={images[0].data}
                alt={property.societyName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover scale-102 filter brightness-[0.85] cursor-zoom-in hover:brightness-100 transition-all duration-300"
                onClick={() => {
                  setPreviewInitialIndex(0);
                  setIsPreviewModalOpen(true);
                }}
              />
              
              {/* Click to Zoom Overlay Button */}
              <button
                type="button"
                onClick={() => {
                  setPreviewInitialIndex(0);
                  setIsPreviewModalOpen(true);
                }}
                className="absolute top-6 left-6 z-30 px-3.5 py-2 rounded-full bg-black/65 hover:bg-amber-500 text-white hover:text-black border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all duration-300 shadow-md hover:scale-105 cursor-pointer"
                title="Zoom-in / Explore Fullscreen"
              >
                <ZoomIn size={12} />
                <span>Zoom & Explore</span>
              </button>

              <div className="absolute inset-0 bg-gradient-to-t from-[#13151A] via-[#13151A]/40 to-transparent" />

              <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10.5 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`text-[8px] px-3 py-1 rounded-md border font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5 ${
                      property.status === "Active"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : property.status === "Sold"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm animate-breathe"
                    }`}
                  >
                    {property.status !== "Active" && property.status !== "Sold" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-breathe-dot" />
                    )}
                    {property.status}
                  </span>
                  <span className="text-[8px] px-3 py-1 rounded-md border border-white/[0.08] bg-white/5 text-white/[0.6] font-black uppercase tracking-[0.2em]">
                    Premium Resale Asset
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
                    {property.societyName}
                  </h2>
                  <div className="flex items-center gap-1.5 text-amber-500 font-medium text-xs sm:text-sm">
                    <MapPin size={14} />
                    {property.location}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
              {/* Left Column: Stats & Specifications */}
              <div className="lg:col-span-8 flex flex-col space-y-10">
                
                {/* Bento Grid Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4.5">
                  {[
                    {
                      label: "Asset Valuation",
                      value: formatPrice(property.price),
                      icon: IndianRupee,
                      color: "text-amber-500",
                      bg: "bg-amber-500/[0.02]",
                    },
                    {
                      label: "Super Net Area",
                      value: `${property.sizeSqft} Sq.Ft.`,
                      icon: LayoutGrid,
                      color: "text-blue-400",
                      bg: "bg-blue-400/[0.02]",
                    },
                    {
                      label: "Configuration",
                      value:
                        property.bhk.includes("BHK") ||
                        property.bhk.includes("Penthouse")
                          ? property.bhk
                          : `${property.bhk} BHK`,
                      icon: Home,
                      color: "text-purple-400",
                      bg: "bg-purple-400/[0.02]",
                    },
                    {
                      label: "Washrooms",
                      value: property.bathrooms || "N/A",
                      icon: Bath,
                      color: "text-cyan-400",
                      bg: "bg-cyan-400/[0.02]",
                    },
                    {
                      label: "Age of Property",
                      value: property.propertyAge || "N/A",
                      icon: Clock,
                      color: "text-emerald-400",
                      bg: "bg-emerald-400/[0.02]",
                    },
                    {
                      label: "Construction Year",
                      value: property.constructionYear || "N/A",
                      icon: Calendar,
                      color: "text-orange-400",
                      bg: "bg-orange-400/[0.02]",
                    },
                    {
                      label: "Negotiable",
                      value: property.isNegotiable || "NO",
                      icon: CheckCircle2,
                      color: "text-pink-400",
                      bg: "bg-pink-400/[0.02]",
                    },
                    {
                      label: "Floor Number",
                      value: property.floorNumber || "N/A",
                      icon: Layers,
                      color: "text-violet-400",
                      bg: "bg-violet-400/[0.02]",
                    },
                    {
                      label: "Brokerage",
                      value: `${property.brokeragePercentage || 0}%`,
                      icon: Zap,
                      color: "text-yellow-400",
                      bg: "bg-yellow-400/[0.02]",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className={`p-4.5 border border-white/[0.05] rounded-2xl ${stat.bg} hover:border-[#F2A21E]/20 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between space-y-3.5`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[7.5px] text-white/40 uppercase tracking-[0.25em] font-black">
                          {stat.label}
                        </span>
                        <stat.icon size={11} className={stat.color} />
                      </div>
                      <div className="text-[12px] font-semibold text-white truncate">
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Extended Interactive Photo Gallery */}
                {property.images && property.images.length > 1 && (
                  <div className="space-y-4">
                    <h3 className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em] flex items-center gap-2">
                      <div className="w-4 h-px bg-amber-500/50" />
                      Visual Representation Portfolio
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {property.images.slice(1).map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setPreviewInitialIndex(idx + 1);
                            setIsPreviewModalOpen(true);
                          }}
                          className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/[0.05] hover:border-white/20 transition-all duration-300 group cursor-zoom-in shadow-md"
                        >
                          <img
                            src={img.data}
                            alt={img.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1">
                            <Maximize2 size={13} className="text-white" />
                            <span className="text-[7.5px] text-white font-black uppercase tracking-widest">Enlarge view</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-px bg-white/[0.06] w-full" />

                {/* Dual Column Layout: Features vs Owner Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4 font-sans">
                    <h3 className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em] flex items-center gap-2">
                      <div className="w-4 h-px bg-amber-500/50" />
                      Asset Details
                    </h3>
                    <div className="space-y-3 bg-white/[0.01] border border-white/[0.05] p-5 rounded-2xl shadow-xl">
                      {[
                        {
                          label: "Property Type",
                          value: property.propertyType,
                        },
                        {
                          label: "Floor Number",
                          value: property.floorNumber || "N/A",
                        },
                        { label: "Price Negotiable", value: property.isNegotiable },
                        {
                          label: "Brokerage Offered",
                          value: `${property.brokeragePercentage}%`,
                        },
                        {
                          label: "Listed On System",
                          value: new Date(
                            property.createdAt,
                          ).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center py-2.5 border-b border-white/[0.04] last:border-0"
                        >
                          <span className="text-[8px] text-white/40 uppercase font-bold tracking-wider">
                            {item.label}
                          </span>
                          <span className="text-[11.5px] font-semibold text-white">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* High Quality Ownership Card */}
                  <div className="space-y-4 font-sans">
                    <h3 className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em] flex items-center gap-2">
                      <div className="w-4 h-px bg-amber-500/50" />
                      Assigned Ownership Details
                    </h3>
                    <div className="bg-gradient-to-r from-white/[0.015] to-transparent rounded-2xl p-5 border border-white/[0.06] space-y-5 shadow-xl">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="text-[7.5px] text-white/40 uppercase font-black tracking-wider">
                            Property Holder Desk
                          </div>
                          <div className="text-[12.5px] font-bold text-white mt-0.5">
                            {property.propertyHolderName}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[7.5px] text-white/40 uppercase font-black tracking-wider">
                          Certified Phone Records
                        </div>
                        <div className="flex items-center justify-between bg-black/25 p-3.5 rounded-xl border border-white/[0.05] font-mono text-[10px] text-white/80">
                          {property.contactNumber || "Not Provided Desk Option"}
                          {property.contactNumber && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  property.contactNumber!,
                                );
                                showToast("Copied safely to clipboard", "success");
                              }}
                              className="text-amber-500 hover:text-amber-400 p-1 shrink-0"
                            >
                              <ClipboardList size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Original Developer Profile and Layout blueprints */}
              <div className="lg:col-span-4 space-y-10">
                {/* Original Developer Segment Details */}
                <div className="bg-gradient-to-b from-surface-2 to-surface rounded-[24px] p-6 border border-border-dim hover:border-amber-primary/40 relative overflow-hidden group shadow-xl transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-primary/5 rounded-full -mr-16 -mt-16 blur-[40px] group-hover:bg-amber-primary/10 transition-all duration-700" />
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-amber-primary/10 border border-amber-primary/25 rounded-2xl flex items-center justify-center text-amber-primary shadow-md group-hover:scale-105 transition-transform duration-500">
                        <Building2 size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">
                          {property.builderName || "Master Builder"}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-primary/15 text-amber-primary border border-amber-primary/30 uppercase tracking-wider">
                            <Award size={10} /> Tier-1 Master Developer
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                      The original authorized development company of this prime society, offering robust structural specifications, verified title clearances, and prime regional infrastructure access in {property.location}.
                    </p>
                    <button
                      onClick={() =>
                        onViewBuilder(property.builderName || "General Builder")
                      }
                      className="w-full py-3 bg-amber-primary hover:bg-amber-primary/90 text-black rounded-xl text-[10px] font-black uppercase tracking-[0.18em] transition-all duration-300 shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LayoutGrid size={13} />
                      <span>Explore Developer Portfolio</span>
                    </button>
                  </div>
                </div>

                {/* File/Doc Downloads Row */}
                <div className="space-y-4">
                  <h3 className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em] flex items-center gap-2">
                    <div className="w-4 h-px bg-amber-500/50" />
                    Property Blueprints
                  </h3>
                  <div className="space-y-3">
                    {property.floorPlan && property.floorPlan.length > 0 ? (
                      property.floorPlan.map((pdf, idx) => (
                        <motion.button
                          whileHover={{ x: 4 }}
                          key={idx}
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = pdf.data;
                            link.download = pdf.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            showToast("Preparing blueprint download...", "info");
                          }}
                          className="w-full flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl hover:border-amber-500/30 hover:bg-white/[0.03] transition-all duration-300 group text-left"
                        >
                          <div className="flex items-center gap-3.5 overflow-hidden">
                            <div className="bg-red-500/10 p-2.5 rounded-xl text-red-400 group-hover:scale-105 transition-transform duration-300">
                              <FileText size={14} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-[11px] font-bold text-white truncate group-hover:text-amber-500 transition-colors">
                                {pdf.name}
                              </span>
                              <span className="text-[7.5px] text-white/30 font-mono uppercase tracking-wider pt-0.5">
                                {(pdf.size / 1024).toFixed(1)} KB • PDF blueprint
                              </span>
                            </div>
                          </div>
                          <Download
                            size={12}
                            className="text-white/40 group-hover:text-amber-500 transition-colors"
                          />
                        </motion.button>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-white/[0.01] rounded-2xl border border-white/[0.05] border-dashed">
                        <FileQuestion
                          size={18}
                          className="text-white/20 mx-auto mb-1.5 animate-pulse"
                        />
                        <p className="text-[8px] text-white/30 font-bold uppercase tracking-wider">
                          No documentation available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel Footer controls */}
        <div className="p-6 sm:p-8 border-t border-white/[0.06] bg-[#0A0B0D]">
          <div className="w-full max-w-none flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] uppercase font-black tracking-[0.25em] text-white/40">
                  Verification status
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest pl-0.5">
                    Live Verified
                  </span>
                </div>
              </div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] uppercase font-black tracking-[0.25em] text-white/40">
                  System Sync
                </span>
                <span className="text-[9px] font-mono font-bold text-white">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} UTC
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              {hasEditPermission && onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(property);
                  }}
                  className="px-6 py-3.5 bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/30 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit size={12} />
                  <span>Edit</span>
                </button>
              )}
              {hasDeletePermission && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(property);
                  }}
                  className="px-6 py-3.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-10 py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-amber-500/10 active:scale-95 cursor-pointer"
              >
                Close Asset Details
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {isPreviewModalOpen && (
        <ImagePreviewModal
          images={images}
          initialIndex={previewInitialIndex}
          onClose={() => setIsPreviewModalOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
};

const ProfileView = ({
  user,
  onUpdate,
  isSelf,
  onBack,
  currentUserRole,
  showToast,
  autoSave,
  onResetCredentials,
  logs = [],
}: {
  user: User | null;
  onUpdate: (data: Partial<User>) => void;
  isSelf: boolean;
  onBack?: () => void;
  currentUserRole: Role;
  showToast: (msg: string, type?: any) => void;
  autoSave: boolean;
  onResetCredentials: (id: string) => Promise<void>;
  logs?: any[];
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "employee",
    profilePicture: user?.profilePicture || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<
    "overview" | "security" | "activity"
  >("overview");
  const [searchActivityText, setSearchActivityText] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const canChangeRole = currentUserRole === "admin";
  const permissions = user ? ROLE_PERMISSIONS[user.role] || [] : [];
  const previewPermissions = formData.role
    ? ROLE_PERMISSIONS[formData.role] || []
    : [];

  // Filter logs associated with this user
  const userLogs = useMemo(() => {
    if (!user) return [];
    return logs.filter(
      (l) =>
        l.userId === user.id ||
        l.username === user.username ||
        l.performedBy === user.name ||
        l.email === user.email
    );
  }, [logs, user]);

  const filteredUserLogs = useMemo(() => {
    if (!searchActivityText.trim()) return userLogs;
    const q = searchActivityText.toLowerCase();
    return userLogs.filter(
      (l) =>
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.target && l.target.toLowerCase().includes(q)) ||
        (l.ip && l.ip.toLowerCase().includes(q))
    );
  }, [userLogs, searchActivityText]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label} to clipboard`, "success");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        showToast("Please upload JPEG, PNG, or SVG images", "error");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be under 5MB", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePicture: reader.result as string }));
        showToast("Profile image updated in form", "info");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleBlur = () => {
    if (autoSave && isEditing) {
      onUpdate(formData);
    }
  };

  const isOnline =
    user?.lastActive &&
    new Date().getTime() - new Date(user.lastActive).getTime() < 300000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full space-y-6 pb-16 font-sans max-w-7xl mx-auto"
    >
      {/* Navigation Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0D0E12] border border-white/[0.08] p-4 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          {!isSelf && onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-white/[0.04] hover:bg-amber-500/20 hover:border-amber-500/40 border border-white/10 rounded-xl transition-all duration-200 text-text-dim hover:text-amber-primary cursor-pointer group"
              title="Back to Users"
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-primary px-2 py-0.5 rounded bg-amber-primary/10 border border-amber-primary/20">
                {isSelf ? "Personal Account" : "User Profile"}
              </span>
              <span className="text-xs text-text-dim">• ID: {user?.id?.slice(0, 8)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-0.5">
              {isSelf ? "My Profile & Account" : `${user?.name || "User"}'s Account`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Edit size={14} /> Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (user) {
                    setFormData({
                      name: user.name,
                      email: user.email,
                      role: user.role,
                      profilePicture: user.profilePicture || "",
                      phoneNumber: user.phoneNumber || "",
                    });
                  }
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check size={15} /> Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Luxury Hero Banner Card */}
      <div className="relative bg-[#0F1015] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
        {/* Ambient Decorative Background */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-black/80 relative overflow-hidden border-b border-white/[0.06]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.18),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 border ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-white/5 text-text-dim border-white/10"
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-text-dim"}`} />
              {isOnline ? "Active Now" : user?.lastActive ? `Active ${new Date(user.lastActive).toLocaleDateString()}` : "Offline"}
            </span>
          </div>
        </div>

        {/* User Content Info Strip */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left w-full md:w-auto">
            {/* Avatar Frame */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-[#090A0D] p-1.5 ring-4 ring-amber-500/30 shadow-2xl shadow-amber-500/15 relative overflow-hidden group">
                {formData.profilePicture ? (
                  <img
                    src={formData.profilePicture}
                    alt={user?.name || "User Avatar"}
                    className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/30 flex items-center justify-center text-3xl sm:text-4xl font-black text-amber-primary uppercase">
                    {user?.name?.[0] || "?"}
                  </div>
                )}

                {/* File Upload Overlay when Editing */}
                {isEditing && (
                  <label className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-xl">
                    <Camera size={26} className="text-amber-primary mb-1 animate-bounce" />
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">
                      Upload Photo
                    </span>
                    <span className="text-[8px] text-text-dim font-mono">JPG / PNG / SVG</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.svg"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              {/* Status Badge */}
              <div className="absolute -bottom-1 -right-1 p-1 bg-[#090A0D] rounded-full border border-white/10 shadow-lg">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  isOnline ? "bg-emerald-500 text-black" : "bg-text-dim text-black"
                }`}>
                  <CheckCircle2 size={12} className="text-black" />
                </div>
              </div>
            </div>

            {/* User Meta Data */}
            <div className="space-y-2 mb-1 w-full sm:w-auto">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                  {user?.name || "Unknown User"}
                </h2>
                <BadgeCheck size={22} className="text-amber-primary fill-amber-primary/20 shrink-0" />
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                  user?.role === "admin"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-amber-500/10"
                    : user?.role === "team_leader"
                    ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/40"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                }`}>
                  {user?.role === "admin" ? "Super Admin" : user?.role?.replace("_", " ") || "Employee"}
                </span>
              </div>

              {/* Quick Info Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-text-dim font-mono">
                <button
                  onClick={() => user?.email && copyToClipboard(user.email, "Email")}
                  className="px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-all flex items-center gap-1.5 hover:text-amber-primary cursor-pointer"
                  title="Click to copy email"
                >
                  <Mail size={13} className="text-amber-primary/70" />
                  <span>{user?.email}</span>
                  {copiedField === "Email" ? <Check size={12} className="text-emerald-400" /> : <Copy size={11} className="opacity-60" />}
                </button>

                {user?.phoneNumber && (
                  <button
                    onClick={() => copyToClipboard(user.phoneNumber!, "Phone")}
                    className="px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-all flex items-center gap-1.5 hover:text-amber-primary cursor-pointer"
                    title="Click to copy phone"
                  >
                    <Phone size={13} className="text-amber-primary/70" />
                    <span>{user.phoneNumber}</span>
                    {copiedField === "Phone" ? <Check size={12} className="text-emerald-400" /> : <Copy size={11} className="opacity-60" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions / Share */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-center">
            <button
              onClick={() => user?.id && copyToClipboard(user.id, "User ID")}
              className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-xs font-mono font-medium text-text-secondary hover:text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <Copy size={13} className="text-amber-primary" />
              <span>ID: {user?.id?.slice(0, 8)}...</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Banner Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/[0.08] divide-x divide-y sm:divide-y-0 divide-white/[0.08] bg-black/20">
          <div className="p-4 sm:p-5 text-center sm:text-left space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim">
              Access Role
            </span>
            <div className="text-sm sm:text-base font-bold text-text-primary capitalize flex items-center gap-1.5 justify-center sm:justify-start">
              <ShieldCheck size={16} className="text-amber-primary" />
              {user?.role?.replace("_", " ") || "Employee"}
            </div>
          </div>

          <div className="p-4 sm:p-5 text-center sm:text-left space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim">
              Permissions Granted
            </span>
            <div className="text-sm sm:text-base font-bold text-amber-primary flex items-center gap-1.5 justify-center sm:justify-start">
              <Sparkles size={16} className="text-amber-primary" />
              {permissions.length} System Rules
            </div>
          </div>

          <div className="p-4 sm:p-5 text-center sm:text-left space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim">
              Security Status
            </span>
            <div className="text-sm sm:text-base font-bold text-emerald-400 flex items-center gap-1.5 justify-center sm:justify-start">
              <Lock size={15} className="text-emerald-400" />
              Verified Account
            </div>
          </div>

          <div className="p-4 sm:p-5 text-center sm:text-left space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim">
              Logged Audit Actions
            </span>
            <div className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-1.5 justify-center sm:justify-start">
              <History size={16} className="text-amber-primary" />
              {userLogs.length} Events Logged
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="flex border-b border-white/[0.08] gap-2 overflow-x-auto pb-0">
        <button
          onClick={() => setActiveProfileTab("overview")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeProfileTab === "overview"
              ? "border-amber-primary text-amber-primary bg-amber-primary/5 rounded-t-xl"
              : "border-transparent text-text-dim hover:text-text-primary hover:bg-white/[0.02] rounded-t-xl"
          }`}
        >
          <User size={16} /> Overview & Details
        </button>

        <button
          onClick={() => setActiveProfileTab("security")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeProfileTab === "security"
              ? "border-amber-primary text-amber-primary bg-amber-primary/5 rounded-t-xl"
              : "border-transparent text-text-dim hover:text-text-primary hover:bg-white/[0.02] rounded-t-xl"
          }`}
        >
          <ShieldCheck size={16} /> Security & Permissions
        </button>

        <button
          onClick={() => setActiveProfileTab("activity")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeProfileTab === "activity"
              ? "border-amber-primary text-amber-primary bg-amber-primary/5 rounded-t-xl"
              : "border-transparent text-text-dim hover:text-text-primary hover:bg-white/[0.02] rounded-t-xl"
          }`}
        >
          <History size={16} /> Activity Log ({userLogs.length})
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeProfileTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {isEditing ? (
              <form onSubmit={handleSubmit} className="bg-[#0E0F14] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Edit Personal Information</h3>
                    <p className="text-xs text-text-dim mt-0.5">
                      Update profile details, contact number, and avatar image.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-primary bg-amber-primary/10 border border-amber-primary/20 px-2.5 py-1 rounded-full">
                    {autoSave ? "Auto-Save Enabled" : "Manual Save"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <User size={14} className="text-amber-primary" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onBlur={handleBlur}
                      className="w-full bg-[#14161F] border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-amber-primary focus:ring-1 focus:ring-amber-primary/50 transition-all font-medium"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <Mail size={14} className="text-amber-primary" /> Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onBlur={handleBlur}
                      className="w-full bg-[#14161F] border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-amber-primary focus:ring-1 focus:ring-amber-primary/50 transition-all font-medium"
                      placeholder="user@example.com"
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <Phone size={14} className="text-amber-primary" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      onBlur={handleBlur}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#14161F] border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-amber-primary focus:ring-1 focus:ring-amber-primary/50 transition-all font-medium"
                    />
                  </div>

                  {/* Profile Picture Uploader */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-amber-primary" /> Profile Image URL / File
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-2 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                        {formData.profilePicture ? (
                          <img
                            src={formData.profilePicture}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={20} className="text-text-dim" />
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer">
                        <div className="w-full bg-[#14161F] border border-white/10 hover:border-amber-primary rounded-xl px-4 py-3 text-xs text-text-secondary hover:text-white transition-all flex items-center justify-between">
                          <span>{formData.profilePicture ? "Change Image File" : "Choose JPEG, PNG or SVG"}</span>
                          <Plus size={14} className="text-amber-primary" />
                        </div>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.svg"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    Save Details
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information Tile */}
                <div className="bg-[#0E0F14] border border-white/[0.08] rounded-3xl p-6 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <User size={16} className="text-amber-primary" /> Personal Information
                    </h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-amber-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                      <div>
                        <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider font-bold">Full Name</div>
                        <div className="text-sm font-semibold text-text-primary mt-0.5">{user?.name}</div>
                      </div>
                      <User size={16} className="text-amber-primary/50" />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                      <div>
                        <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider font-bold">Email Address</div>
                        <div className="text-sm font-semibold text-text-primary mt-0.5">{user?.email}</div>
                      </div>
                      <button
                        onClick={() => user?.email && copyToClipboard(user.email, "Email")}
                        className="p-1.5 text-text-dim hover:text-amber-primary transition-colors cursor-pointer"
                        title="Copy email"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                      <div>
                        <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider font-bold">Phone Number</div>
                        <div className="text-sm font-semibold text-text-primary mt-0.5">
                          {user?.phoneNumber || "Not specified"}
                        </div>
                      </div>
                      <Phone size={16} className="text-amber-primary/50" />
                    </div>
                  </div>
                </div>

                {/* Account Credentials & Meta Tile */}
                <div className="bg-[#0E0F14] border border-white/[0.08] rounded-3xl p-6 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <ShieldCheck size={16} className="text-amber-primary" /> System Identity
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                      <div>
                        <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider font-bold">Internal UUID</div>
                        <div className="text-xs font-mono text-amber-primary mt-0.5">{user?.id}</div>
                      </div>
                      <button
                        onClick={() => user?.id && copyToClipboard(user.id, "User ID")}
                        className="p-1.5 text-text-dim hover:text-amber-primary transition-colors cursor-pointer"
                        title="Copy ID"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                      <div>
                        <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider font-bold">Username Code</div>
                        <div className="text-sm font-mono text-text-primary mt-0.5">{user?.username || user?.email?.split("@")[0]}</div>
                      </div>
                      <UserCheck size={16} className="text-amber-primary/50" />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                      <div>
                        <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider font-bold">Role Classification</div>
                        <div className="text-sm font-semibold text-amber-primary capitalize mt-0.5">
                          {user?.role?.replace("_", " ")}
                        </div>
                      </div>
                      <Award size={16} className="text-amber-primary/50" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeProfileTab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left 2 Cols: Role & Permissions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#0E0F14] border border-white/[0.08] rounded-3xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <ShieldCheck size={18} className="text-amber-primary" /> Role & System Permissions
                    </h3>
                    <p className="text-xs text-text-dim mt-0.5">
                      Permissions control access to features, databases, and administrative operations.
                    </p>
                  </div>

                  {isEditing && canChangeRole && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-primary font-mono uppercase font-bold">Change Role:</span>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                        className="bg-[#14161F] border border-amber-primary/40 text-amber-primary text-xs font-bold rounded-xl px-3 py-1.5 outline-none"
                      >
                        <option value="employee">Employee</option>
                        <option value="team_leader">Team Leader</option>
                        <option value="admin">Super Admin</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Categorized Permissions Grid */}
                <div className="space-y-4">
                  {PERMISSION_CATEGORIES.map((category) => {
                    const activePerms = (isEditing ? previewPermissions : permissions).filter((p) =>
                      category.permissions.includes(p)
                    );
                    const hasPerms = activePerms.length > 0;

                    return (
                      <div
                        key={category.name}
                        className={`p-4 rounded-2xl border transition-all ${
                          hasPerms
                            ? "bg-white/[0.02] border-white/[0.08]"
                            : "bg-black/20 border-white/[0.03] opacity-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-primary flex items-center gap-1.5">
                            <Sparkles size={13} /> {category.name}
                          </span>
                          <span className="text-[10px] font-mono text-text-dim">
                            {activePerms.length} / {category.permissions.length} Enabled
                          </span>
                        </div>

                        {hasPerms ? (
                          <div className="flex flex-wrap gap-2">
                            {activePerms.map((p) => (
                              <span
                                key={p}
                                className="px-2.5 py-1 bg-amber-primary/10 border border-amber-primary/20 rounded-lg text-[10px] font-mono text-amber-primary flex items-center gap-1.5"
                              >
                                <Check size={10} />
                                {p?.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-text-dim italic">
                            No permissions granted for this role category.
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Compliance Card */}
              <div className="p-5 bg-amber-primary/5 rounded-2xl border border-amber-primary/20 flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-primary">
                    Audit Compliance & Access Governance
                  </h4>
                  <p className="text-xs text-text-dim leading-relaxed">
                    All administrative updates and role changes are timestamped and permanently logged in the central audit ledger.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col: Credential Manager */}
            <div className="space-y-6">
              <div className="bg-[#0E0F14] border border-white/[0.08] rounded-3xl p-6 space-y-5 shadow-xl">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2 border-b border-white/[0.08] pb-3">
                  <Key size={16} className="text-amber-primary" /> Credential Management
                </h3>
                {user && (
                  <CredentialManager
                    user={user}
                    onResetCredentials={() => onResetCredentials(user.id)}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeProfileTab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-[#0E0F14] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <History size={18} className="text-amber-primary" /> User Activity Ledger
                  </h3>
                  <p className="text-xs text-text-dim mt-0.5">
                    Real-time action history and system events performed by this account.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                  <input
                    type="text"
                    value={searchActivityText}
                    onChange={(e) => setSearchActivityText(e.target.value)}
                    placeholder="Search activity logs..."
                    className="w-full bg-[#14161F] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary transition-all"
                  />
                </div>
              </div>

              {filteredUserLogs.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredUserLogs.map((log, index) => {
                    const crudInfo = getCrudInfo(log.action || "");
                    return (
                      <div
                        key={log.id || index}
                        className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-2xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border shrink-0 ${crudInfo.badgeColor}`}
                          >
                            {crudInfo.type}
                          </span>
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors">
                              {log.action || "System Event"}
                            </div>
                            <div className="text-xs text-text-dim">
                              {log.details || log.target || "Operation executed successfully."}
                            </div>
                            {log.ip && (
                              <div className="text-[10px] font-mono text-text-dim/60">
                                IP Address: {log.ip}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-text-dim flex items-center gap-1 justify-end">
                            <Clock size={11} className="text-amber-primary/70" />
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Recent"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center space-y-3 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
                  <Activity size={32} className="mx-auto text-amber-primary/40" />
                  <div className="text-sm font-bold text-text-primary">No Activity Records Found</div>
                  <p className="text-xs text-text-dim max-w-sm mx-auto">
                    {searchActivityText
                      ? "No logs matched your search filter."
                      : "User actions (project edits, uploads, logins) will automatically appear here."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const getCrudInfo = (action: string) => {
  const normAction = (action || "").toUpperCase();

  if (
    normAction === "CREATE" ||
    normAction === "ADD_PROJECT" ||
    normAction === "ADD_RESALE" ||
    normAction === "SIGNUP" ||
    normAction.includes("REPORT_CREATE") ||
    normAction.includes("ADD")
  ) {
    return {
      type: "CREATE",
      badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
      title: "Database Insert (CREATE)",
      description:
        "Action Triggered: CREATE operation. Created a new resource/record with fields verified and initialized in database.",
    };
  }

  if (
    normAction === "LOGIN" ||
    normAction === "LOGOUT" ||
    normAction === "LOGIN_FAILED" ||
    normAction.startsWith("READ")
  ) {
    return {
      type: "READ",
      badgeColor: "text-purple-500 bg-purple-500/10 border-purple-500/30",
      title: "Data Access & Auth (READ)",
      description:
        "Action Triggered: READ operation. Queried database records, retrieved directory/project data, or established secure user session.",
    };
  }

  if (
    normAction === "DELETE" ||
    normAction === "DELETE_RESALE" ||
    normAction === "DELETE_USER" ||
    normAction.includes("REPORT_DELETE") ||
    normAction.includes("REMOVE")
  ) {
    return {
      type: "DELETE",
      badgeColor: "text-red-500 bg-red-500/10 border-red-500/30",
      title: "Database Remove (DELETE)",
      description:
        "Action Triggered: DELETE operation. Permanently hard-deleted record from storage tables or decommissioned resources.",
    };
  }

  // Anything else like UPDATE, EDIT, APPROVE, REJECT, DELETE_REQ, etc. is an UPDATE operation
  return {
    type: "UPDATE",
    badgeColor: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    title: "Database Modify (UPDATE)",
    description:
      "Action Triggered: UPDATE operation. Modified record properties, processed transaction values, or transitioned item status.",
  };
};

const LogsView = ({
  logs,
  user,
  isLive: initialLive = true,
  onExport,
}: {
  logs: any[];
  user?: any;
  isLive?: boolean;
  onExport?: (logs: any[]) => void;
}) => {
  const [filter, setFilter] = useState("ALL");
  const [specificAction, setSpecificAction] = useState("ALL");
  const [userSearch, setUserSearch] = useState("");
  const [keywordSearch, setKeywordSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);



  const logsToProcess = logs || [];

  const actionCategories = [
    { label: "All Events", value: "ALL" },
    {
      label: "Access / Auth",
      value: "AUTH",
      actions: [
        "LOGIN",
        "LOGOUT",
        "LOGIN_FAILED",
        "SECURITY_UPDATE",
        "EXTERNAL_API_ACCESS",
      ],
    },
    {
      label: "Projects",
      value: "PROJECTS",
      actions: [
        "ADD_PROJECT",
        "EDIT_PROJECT",
        "CREATE",
        "UPDATE",
        "DELETE",
        "READ_PROJECTS",
      ],
    },
    {
      label: "Resale",
      value: "RESALE",
      actions: ["ADD_RESALE", "EDIT_RESALE", "DELETE_RESALE", "READ_RESALE"],
    },
    {
      label: "Users & Teams",
      value: "USERS",
      actions: [
        "USER_CREATED",
        "UPDATE_USER",
        "DELETE_USER",
        "TEAM_ASSIGNMENT",
        "PERMISSIONS_UPDATED",
      ],
    },
    {
      label: "Approvals",
      value: "APPROVALS",
      actions: [
        "APPROVE",
        "REJECT",
        "APPROVE_EDIT",
        "REJECT_EDIT",
        "REJECT_PROJECT",
        "DELETE_REQ",
        "EDIT_REQ",
      ],
    },
    {
      label: "System & Database",
      value: "SYSTEM",
      actions: [
        "READ_DATABASE",
        "READ_DATABASE_SCHEMA",
        "READ_DATABASE_TABLE",
        "READ_NOTIFICATIONS",
        "READ_REPORTS",
        "REPORT_CREATED",
        "REPORT_EDITED",
        "DELETE_REPORT",
      ],
    },
  ];

  const uniqueActions = Array.from(
    new Set(logsToProcess.map((l) => l.action).filter(Boolean)),
  ).sort();

  const filteredLogs = logsToProcess.filter((log) => {
    const matchesCategory =
      filter === "ALL" ||
      actionCategories
        .find((c) => c.value === filter)
        ?.actions?.includes(log.action);
    const matchesSpecificAction =
      specificAction === "ALL" || log.action === specificAction;

    const matchesUser =
      !userSearch || (log.user && log.user.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesKeyword =
      !keywordSearch ||
      (log.summary &&
        log.summary.toLowerCase().includes(keywordSearch.toLowerCase())) ||
      (log.action &&
        log.action.toLowerCase().includes(keywordSearch.toLowerCase()));

    const logDate = new Date(log.timestamp);
    const matchesDateFrom = !dateFrom || logDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || logDate <= new Date(dateTo);

    return (
      matchesCategory &&
      matchesSpecificAction &&
      matchesUser &&
      matchesKeyword &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const valA = a[sortBy as keyof typeof a];
    const valB = b[sortBy as keyof typeof b];
    if (!valA) return 1;
    if (!valB) return -1;
    if (sortOrder === "asc") return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + pageSize);

  // Compute stats
  const totalCount = logsToProcess.length;
  const authCount = logsToProcess.filter((l) =>
    ["LOGIN", "LOGOUT", "LOGIN_FAILED", "SECURITY_UPDATE"].includes(l.action),
  ).length;
  const crudCount = logsToProcess.filter((l) =>
    ["CREATE", "UPDATE", "DELETE", "ADD_PROJECT", "EDIT_PROJECT", "ADD_RESALE", "EDIT_RESALE"].some(a => l.action?.includes(a)),
  ).length;
  const approvalCount = logsToProcess.filter((l) =>
    ["APPROVE", "REJECT", "APPROVE_EDIT", "REJECT_EDIT"].some(a => l.action?.includes(a)),
  ).length;

  const handleExport = () => {
    if (onExport) {
      onExport(sortedLogs);
      return;
    }
    const headers = ["Timestamp", "User", "Action", "Summary"];
    const csvContent = [
      headers.join(","),
      ...sortedLogs.map((log) =>
        [
          new Date(log.timestamp).toLocaleString(),
          `"${log.user || ""}"`,
          `"${log.action || ""}"`,
          `"${(log.summary || "").replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `audit_logs_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const activeFiltersCount = [
    filter !== "ALL",
    specificAction !== "ALL",
    !!userSearch,
    !!keywordSearch,
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 w-full max-w-none font-sans">
      {/* Header & Quick Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface/60 backdrop-blur-xl border border-border-dim/50 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center text-amber-primary shrink-0 shadow-inner">
            <Activity size={20} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Audit Trail & System Logs
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-primary/15 text-amber-primary border border-amber-primary/30 text-[9px] font-black uppercase tracking-wider">
                Live Feed
              </span>
            </div>
            <p className="text-xs text-text-dim">
              Security activity, CRUD database updates, and permission changes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-black/40 hover:bg-black/70 border border-white/10 hover:border-amber-primary/40 rounded-xl text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-amber-primary transition-all shadow-sm cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          {/* Filter Trigger Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider cursor-pointer ${
                showFilters || activeFiltersCount > 0
                  ? "bg-amber-primary text-black border-amber-primary shadow-lg shadow-amber-primary/20"
                  : "bg-black/40 border-white/10 text-text-secondary hover:border-white/20 hover:text-white"
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 bg-black text-amber-primary rounded-full flex items-center justify-center text-[9px] font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Advanced Filters Popover Drawer */}
            <AnimatePresence>
              {showFilters && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowFilters(false)}
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 mt-2 w-[320px] sm:w-[420px] bg-surface/95 backdrop-blur-2xl border border-border-dim/80 rounded-2xl shadow-2xl z-50 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-border-dim/40 pb-3">
                      <div className="flex items-center gap-2">
                        <Filter size={14} className="text-amber-primary" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-text-primary">
                          Advanced Search & Filters
                        </h4>
                      </div>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={() => {
                            setFilter("ALL");
                            setSpecificAction("ALL");
                            setUserSearch("");
                            setKeywordSearch("");
                            setDateFrom("");
                            setDateTo("");
                            setCurrentPage(1);
                          }}
                          className="text-[10px] text-amber-primary font-bold uppercase tracking-wider hover:underline cursor-pointer"
                        >
                          Reset All
                        </button>
                      )}
                    </div>

                    <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] text-text-dim uppercase tracking-wider font-extrabold">
                            Category
                          </label>
                          <select
                            value={filter}
                            onChange={(e) => {
                              setFilter(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-amber-primary/50"
                          >
                            {actionCategories.map((cat) => (
                              <option key={cat.value} value={cat.value} className="bg-black text-white">
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-text-dim uppercase tracking-wider font-extrabold">
                            CRUD Action
                          </label>
                          <select
                            value={specificAction}
                            onChange={(e) => {
                              setSpecificAction(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-amber-primary/50"
                          >
                            <option value="ALL" className="bg-black text-white">All Actions</option>
                            {uniqueActions.map((action) => (
                              <option key={action} value={action} className="bg-black text-white">
                                {action}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-text-dim uppercase tracking-wider font-extrabold">
                          User Name / Email
                        </label>
                        <div className="relative">
                          <Search
                            size={12}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
                          />
                          <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => {
                              setUserSearch(e.target.value);
                              setCurrentPage(1);
                            }}
                            placeholder="Filter by user..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-amber-primary/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-text-dim uppercase tracking-wider font-extrabold">
                          Summary Keywords
                        </label>
                        <div className="relative">
                          <Search
                            size={12}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
                          />
                          <input
                            type="text"
                            value={keywordSearch}
                            onChange={(e) => {
                              setKeywordSearch(e.target.value);
                              setCurrentPage(1);
                            }}
                            placeholder="Search in log details..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-amber-primary/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-text-dim uppercase tracking-wider font-extrabold">
                          Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="datetime-local"
                            value={dateFrom}
                            onChange={(e) => {
                              setDateFrom(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] text-text-primary focus:outline-none focus:border-amber-primary/50 [color-scheme:dark]"
                          />
                          <input
                            type="datetime-local"
                            value={dateTo}
                            onChange={(e) => {
                              setDateTo(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] text-text-primary focus:outline-none focus:border-amber-primary/50 [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full py-2 bg-amber-primary text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer"
                    >
                      Apply & Close
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-surface/50 backdrop-blur-xl border border-border-dim/50 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-amber-primary/10 text-amber-primary border border-amber-primary/20 shrink-0">
            <Activity size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase font-black text-text-dim tracking-wider">Total Audit Events</span>
            <span className="text-base font-black text-text-primary font-mono">{totalCount}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface/50 backdrop-blur-xl border border-border-dim/50 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase font-black text-text-dim tracking-wider">Auth & Security</span>
            <span className="text-base font-black text-blue-400 font-mono">{authCount}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface/50 backdrop-blur-xl border border-border-dim/50 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Clock size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase font-black text-text-dim tracking-wider">CRUD Mutations</span>
            <span className="text-base font-black text-emerald-400 font-mono">{crudCount}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface/50 backdrop-blur-xl border border-border-dim/50 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <UserCheck size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase font-black text-text-dim tracking-wider">Approvals & Req</span>
            <span className="text-base font-black text-purple-400 font-mono">{approvalCount}</span>
          </div>
        </div>
      </div>

      {/* Category Pills & View Controls Toolbar */}
      <div className="p-3 rounded-2xl bg-surface/60 backdrop-blur-xl border border-border-dim/50 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {actionCategories.map((cat) => {
            const isSelected = filter === cat.value;
            const count =
              cat.value === "ALL"
                ? logsToProcess.length
                : logsToProcess.filter((l) => cat.actions?.includes(l.action)).length;

            return (
              <button
                key={cat.value}
                onClick={() => {
                  setFilter(cat.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-amber-primary text-black font-extrabold shadow-sm"
                    : "bg-black/40 hover:bg-black/70 border border-white/10 text-text-secondary hover:text-white"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isSelected ? "bg-black/20 text-black font-black" : "bg-white/10 text-text-dim"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Rows per page */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-text-dim">
            <span className="text-[10px] font-bold uppercase tracking-wider">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent text-amber-500 font-bold focus:outline-none cursor-pointer"
            >
              <option value={10} className="bg-black text-white">10</option>
              <option value={20} className="bg-black text-white">20</option>
              <option value={50} className="bg-black text-white">50</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 text-text-dim">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "table"
                  ? "bg-amber-primary text-black font-extrabold shadow"
                  : "hover:text-white"
              }`}
              title="Table View (Press 'T')"
            >
              <List size={13} />
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/20 opacity-70">T</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "grid"
                  ? "bg-amber-primary text-black font-extrabold shadow"
                  : "hover:text-white"
              }`}
              title="Cards View (Press 'G')"
            >
              <LayoutGrid size={13} />
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/20 opacity-70">G</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Logs Table or Grid Container */}
      <div className="bg-surface/50 backdrop-blur-xl border border-border-dim/50 rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-primary/5 rounded-full blur-[120px] pointer-events-none" />

        {paginatedLogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 bg-surface-2 rounded-full flex items-center justify-center text-text-dim/40 border border-border-dim/50">
              <Search size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-widest">
                No matching logs
              </h4>
              <p className="text-[11px] text-text-dim max-w-xs mx-auto">
                No activity logs match your active search filters or date range.
              </p>
            </div>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[750px]">
              <thead>
                <tr className="bg-surface-2/60 backdrop-blur-md">
                  <th
                    className="px-4 py-2.5 text-[9px] text-text-dim uppercase tracking-[0.25em] font-black border-b border-border-dim/50 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort("timestamp")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Timestamp</span>
                      {sortBy === "timestamp" && (
                        sortOrder === "asc" ? <ChevronUp size={12} className="text-amber-primary" /> : <ChevronDown size={12} className="text-amber-primary" />
                      )}
                    </div>
                  </th>

                  <th
                    className="px-4 py-2.5 text-[9px] text-text-dim uppercase tracking-[0.25em] font-black border-b border-border-dim/50 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort("user")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>User</span>
                      {sortBy === "user" && (
                        sortOrder === "asc" ? <ChevronUp size={12} className="text-amber-primary" /> : <ChevronDown size={12} className="text-amber-primary" />
                      )}
                    </div>
                  </th>

                  <th
                    className="px-4 py-2.5 text-[9px] text-text-dim uppercase tracking-[0.25em] font-black border-b border-border-dim/50 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort("action")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Action / Type</span>
                      {sortBy === "action" && (
                        sortOrder === "asc" ? <ChevronUp size={12} className="text-amber-primary" /> : <ChevronDown size={12} className="text-amber-primary" />
                      )}
                    </div>
                  </th>

                  <th className="px-4 py-2.5 text-[9px] text-text-dim uppercase tracking-[0.25em] font-black border-b border-border-dim/50">
                    Summary Details
                  </th>

                  <th className="px-4 py-2.5 text-[9px] text-text-dim uppercase tracking-[0.25em] font-black text-right border-b border-border-dim/50 pr-5">
                    Inspect
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-dim/10">
                {paginatedLogs.map((log) => {
                  const crudInfo = getCrudInfo(log.action);
                  const isNegative =
                    log.action?.includes("DELETE") ||
                    log.action?.includes("REJECT") ||
                    log.action?.includes("FAILED");
                  const isPositive =
                    log.action?.includes("ADD") ||
                    log.action?.includes("APPROVE") ||
                    log.action?.includes("SIGNUP") ||
                    log.action?.includes("CREATE");
                  const isModify =
                    log.action?.includes("EDIT") || log.action?.includes("UPDATE");

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="group transition-all duration-300 hover:bg-white/[0.03] cursor-pointer"
                    >
                      <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none font-mono">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-text-primary">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-text-dim">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-primary/15 border border-amber-primary/30 flex items-center justify-center text-[10px] font-extrabold text-amber-primary shrink-0">
                            {(log.user || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors truncate max-w-[140px]">
                            {log.user || "System"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                            isNegative
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : isPositive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : isModify
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          <span>{log.action?.replace(/_/g, " ")}</span>
                        </span>
                      </td>

                      <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none text-xs text-text-secondary max-w-[280px]">
                        <p className="truncate text-text-secondary group-hover:text-text-primary transition-colors">
                          {log.summary}
                        </p>
                      </td>

                      <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none text-right pr-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-primary bg-amber-primary/10 hover:bg-amber-primary/20 rounded-lg border border-amber-primary/30 transition-all cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards Grid View */
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedLogs.map((log) => {
              const isNegative =
                log.action?.includes("DELETE") ||
                log.action?.includes("REJECT") ||
                log.action?.includes("FAILED");
              const isPositive =
                log.action?.includes("ADD") ||
                log.action?.includes("APPROVE") ||
                log.action?.includes("SIGNUP") ||
                log.action?.includes("CREATE");

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between gap-3 hover:border-amber-primary/30 transition-all group cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                          isNegative
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : isPositive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {log.action?.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-mono text-text-dim">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-text-primary font-medium line-clamp-2 leading-relaxed">
                      {log.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-text-dim">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-amber-primary/10 flex items-center justify-center text-[9px] font-bold text-amber-primary">
                        {(log.user || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-text-secondary truncate max-w-[100px]">
                        {log.user}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-text-dim">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {sortedLogs.length > 0 && (
          <div className="p-3 border-t border-border-dim/40 bg-surface-2/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-text-dim">
            <div>
              Showing <span className="font-bold text-text-primary">{startIndex + 1}</span> to{" "}
              <span className="font-bold text-text-primary">
                {Math.min(startIndex + pageSize, sortedLogs.length)}
              </span>{" "}
              of <span className="font-bold text-amber-primary">{sortedLogs.length}</span> records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 hover:border-white/20 disabled:opacity-30 text-text-primary font-bold transition-all cursor-pointer"
              >
                Prev
              </button>
              <span className="px-2 font-mono text-xs font-bold text-amber-500">
                Page {safePage} of {totalPages}
              </span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 hover:border-white/20 disabled:opacity-30 text-text-primary font-bold transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Inspector Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              className="relative w-full max-w-xl bg-surface/95 backdrop-blur-2xl border border-border-bright rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="p-5 border-b border-border-dim/50 flex items-center justify-between bg-surface-2/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-primary/15 border border-amber-primary/30 rounded-xl text-amber-primary">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">
                      Audit Log Details
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-dim font-mono">
                        LOG ID: {selectedLog.id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedLog.id, "id")}
                        className="text-[9px] text-amber-primary hover:underline font-bold uppercase"
                      >
                        {copiedId === "id" ? "Copied!" : "Copy ID"}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-text-dim hover:text-text-primary cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                    <span className="text-[9px] text-text-dim uppercase tracking-wider font-extrabold">
                      Timestamp
                    </span>
                    <p className="text-xs font-mono font-bold text-text-primary">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                    <span className="text-[9px] text-text-dim uppercase tracking-wider font-extrabold">
                      Actor / User
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-primary/20 text-amber-primary flex items-center justify-center text-[10px] font-extrabold">
                        {(selectedLog.user || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-text-primary truncate">
                        {selectedLog.user}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CRUD Operation Info Box */}
                {(() => {
                  const info = getCrudInfo(selectedLog.action);
                  return (
                    <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-2">
                      <span className="text-[9px] text-text-dim uppercase tracking-wider font-extrabold">
                        Operation Context
                      </span>
                      <div className="flex items-start gap-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${info.badgeColor}`}>
                          {info.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-text-primary">
                            {info.title}
                          </h5>
                          <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Event Action & Category */}
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between">
                  <span className="text-[9px] text-text-dim uppercase tracking-wider font-extrabold">
                    Triggered Action Tag
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-primary/15 border border-amber-primary/30 text-amber-primary text-xs font-mono font-bold">
                    {selectedLog.action}
                  </span>
                </div>

                {/* Log Summary */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-text-dim uppercase tracking-wider font-extrabold">
                      Full Log Summary
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedLog.summary, "summary")}
                      className="text-[9px] text-amber-primary hover:underline font-bold uppercase"
                    >
                      {copiedId === "summary" ? "Copied!" : "Copy Summary"}
                    </button>
                  </div>
                  <div className="p-3.5 bg-black/60 border border-white/10 rounded-xl text-xs text-text-primary leading-relaxed font-mono whitespace-pre-wrap">
                    {selectedLog.summary}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-2/60 border-t border-border-dim/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                  <ShieldCheck size={13} />
                  <span>Verified Audit Record</span>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-1.5 bg-amber-primary text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportsView = ({
  reports,
  users,
  onUpdate,
  onCreate,
  onDelete,
  user,
  selectedReport,
  setSelectedReport,
  isEditing,
  setIsEditing,
}: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateType, setDateType] = useState<"createdAt" | "updatedAt">(
    "updatedAt",
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [reportToDelete, setReportToDelete] = useState<any>(null);

  const filteredReports = reports
    .filter((r: Report) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      const matchesAssignee =
        assigneeFilter === "All" || r.assignedTo === assigneeFilter;

      const reportDate = new Date(r[dateType]);
      const matchesDateFrom = !dateFrom || reportDate >= new Date(dateFrom);
      const matchesDateTo =
        !dateTo || reportDate <= new Date(dateTo + "T23:59:59");

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAssignee &&
        matchesDateFrom &&
        matchesDateTo
      );
    })
    .sort((a: any, b: any) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (sortOrder === "asc") return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

  const handleCreate = () => {
    const newReport = {
      title: "New Report",
      content: "",
      assignedTo: user?.name || "Unassigned",
      status: "Draft",
    };
    onCreate(newReport).then((created: Report) => {
      setSelectedReport(created);
      setIsEditing(true);
    });
  };

  const handleSave = (data: any) => {
    if (selectedReport) {
      onUpdate(selectedReport.id, data).then((updated: Report) => {
        setSelectedReport(updated);
        setIsEditing(false);
      });
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-primary/10 rounded-lg">
            <FileText className="text-amber-primary" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Reports Management
            </h2>
            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
              Create and manage internal reports
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 bg-amber-primary hover:bg-amber-600 text-black px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-amber-primary/20"
        >
          <Plus size={16} />
          CREATE REPORT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <div className="bg-surface-1 border border-border-dim rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-2 border border-border-bright rounded-lg pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary"
                />
              </div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                  showAdvancedFilters
                    ? "bg-amber-primary border-amber-primary text-bg shadow-lg shadow-amber-primary/20"
                    : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50"
                }`}
              >
                <Filter size={14} />
                {showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}
              </button>
            </div>

            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-surface-2/50 border border-border-dim rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-text-dim uppercase font-black tracking-widest">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-surface border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Final">Final</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-text-dim uppercase font-black tracking-widest">
                        Assignee
                      </label>
                      <select
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                        className="w-full bg-surface border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary"
                      >
                        <option value="All">All Assignees</option>
                        {Array.from(
                          new Set(reports.map((r: Report) => r.assignedTo)),
                        ).map((name: any) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-text-dim uppercase font-black tracking-widest">
                        Date Type
                      </label>
                      <select
                        value={dateType}
                        onChange={(e) => setDateType(e.target.value as any)}
                        className="w-full bg-surface border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary"
                      >
                        <option value="updatedAt">Last Updated</option>
                        <option value="createdAt">Created Date</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-text-dim uppercase font-black tracking-widest">
                        Date Range
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="flex-1 bg-surface border border-border-bright rounded-lg px-2 py-2 text-[10px] text-text-primary outline-none focus:border-amber-primary"
                        />
                        <span className="text-text-dim">-</span>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="flex-1 bg-surface border border-border-bright rounded-lg px-2 py-2 text-[10px] text-text-primary outline-none focus:border-amber-primary"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                      <button
                        onClick={() => {
                          setStatusFilter("All");
                          setAssigneeFilter("All");
                          setDateFrom("");
                          setDateTo("");
                          setSearchQuery("");
                        }}
                        className="text-[9px] text-amber-primary hover:underline uppercase font-black tracking-widest"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border border-border-dim rounded-lg overflow-hidden overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="bg-surface-2 border-b border-border-dim">
                  <tr>
                    <th className="px-4 py-3 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap">
                      Title
                    </th>
                    <th className="px-4 py-3 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap">
                      Updated
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {filteredReports.map((report: Report) => (
                    <tr
                      key={report.id}
                      onClick={() => {
                        setSelectedReport(report);
                        setIsEditing(false);
                      }}
                      className={`hover:bg-surface-2 transition-colors cursor-pointer ${selectedReport?.id === report.id ? "bg-amber-primary/5" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-text-primary whitespace-normal min-w-[150px]">
                        {report.title}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {report.assignedTo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider ${
                            report.status === "Final"
                              ? "bg-green-500/10 text-green-500"
                              : report.status === "Draft"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-text-dim/10 text-text-dim"
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-dim font-mono text-[10px] whitespace-nowrap">
                        {new Date(report.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {(user?.role === "admin" ||
                          user?.role === "team_leader") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportToDelete(report);
                            }}
                            className="text-text-dim hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-text-dim italic"
                      >
                        No reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key={selectedReport.id + (isEditing ? "-edit" : "-view")}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-surface-1 border border-border-dim rounded-xl p-6 h-full flex flex-col gap-4"
              >
                {isEditing ? (
                  <ReportEditor
                    report={selectedReport}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                    users={users}
                  />
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">
                          {selectedReport.title}
                        </h3>
                        <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                          Report Details
                        </p>
                      </div>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 bg-surface-2 border border-border-bright rounded-lg text-text-secondary hover:text-amber-primary transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-border-dim">
                      <div>
                        <p className="text-[9px] text-text-dim uppercase font-bold">
                          Assigned To
                        </p>
                        <p className="text-xs text-text-primary font-medium">
                          {selectedReport.assignedTo}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-text-dim uppercase font-bold">
                          Status
                        </p>
                        <p className="text-xs text-text-primary font-medium">
                          {selectedReport.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-text-dim uppercase font-bold">
                          Created At
                        </p>
                        <p className="text-xs text-text-dim font-mono">
                          {new Date(selectedReport.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-text-dim uppercase font-bold">
                          Last Updated
                        </p>
                        <p className="text-xs text-text-dim font-mono">
                          {new Date(selectedReport.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                      <p className="text-[9px] text-text-dim uppercase font-bold mb-2">
                        Content
                      </p>
                      <div className="text-xs text-text-secondary leading-relaxed prose prose-invert prose-sm max-w-none">
                        {selectedReport.content ? (
                          <Markdown>{selectedReport.content}</Markdown>
                        ) : (
                          "No content provided."
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <div className="bg-surface-1 border border-border-dim border-dashed rounded-xl p-12 h-full flex flex-col items-center justify-center text-center gap-4">
                <div className="p-4 bg-surface-2 rounded-full text-text-dim">
                  <FileText size={32} />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    No Report Selected
                  </p>
                  <p className="text-xs text-text-dim">
                    Select a report from the list to view or edit details.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {reportToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportToDelete(null)}
              className="absolute inset-0 bg-black/60 "
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-surface-1 border border-border-dim rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  Delete Report?
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-6">
                  Are you sure you want to delete{" "}
                  <span className="text-text-primary font-bold">
                    "{reportToDelete.title}"
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setReportToDelete(null)}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-bold text-text-secondary bg-surface-2 hover:text-text-primary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDelete(reportToDelete.id);
                      setReportToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-bold text-bg bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportEditor = ({ report, onSave, onCancel, users }: any) => {
  const [formData, setFormData] = useState(() => {
    const savedDraft = localStorage.getItem(`draft_report_${report.id}`);
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.warn("Could not parse draft report", e);
      }
    }
    return {
      title: report.title,
      content: report.content,
      assignedTo: report.assignedTo,
      status: report.status,
    };
  });

  useEffect(() => {
    localStorage.setItem(`draft_report_${report.id}`, JSON.stringify(formData));
  }, [formData, report.id]);

  const handleSave = () => {
    onSave(formData);
    localStorage.removeItem(`draft_report_${report.id}`);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-text-primary">Edit Report</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              localStorage.removeItem(`draft_report_${report.id}`);
              onCancel();
            }}
            className="px-3 py-1.5 text-[10px] font-bold text-text-dim hover:text-text-primary uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-amber-primary hover:bg-amber-600 text-black px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1">
        <div className="space-y-1.5">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as any })
            }
            className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary"
          >
            <option value="Draft">Draft</option>
            <option value="Final">Final</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        <div className="space-y-1.5 flex-1 flex flex-col min-h-[400px]">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
            Content
          </label>
          <div className="flex-1 bg-surface-2 border border-border-bright rounded-lg overflow-hidden editor-container">
            <SimpleMDE
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              options={{
                spellChecker: false,
                placeholder: "Write report content here...",
                status: false,
                toolbar: [
                  "bold",
                  "italic",
                  "heading",
                  "|",
                  "quote",
                  "unordered-list",
                  "ordered-list",
                  "|",
                  "link",
                  "image",
                  "|",
                  "preview",
                  "guide",
                ],
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({
  isOpen,
  onClose,
  notificationsEnabled,
  setNotificationsEnabled,
  criticalChimeEnabled,
  setCriticalChimeEnabled,
  updatesChimeEnabled,
  setUpdatesChimeEnabled,
  compactMode,
  setCompactMode,
  autoSave,
  setAutoSave,
  soundEffects,
  setSoundEffects,
  language,
  setLanguage,
  accentColor,
  setAccentColor,
  theme,
  setTheme,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  reducedMotion,
  setReducedMotion,
  user,
  onProfileClick,
  playSound,
  initialTab = "account",
  request,
  showToast,
  assignedRegion,
  setAssignedRegion,
}: any) => {
  const [activeTab, setActiveTab] = useState("account");

  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: "587",
    user: "",
    pass: "",
    from: ""
  });
  const [loadingSmtp, setLoadingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [smtpProviderPreset, setSmtpProviderPreset] = useState<string>("custom");

  const applySmtpPreset = (preset: string) => {
    setSmtpProviderPreset(preset);
    if (preset === "gmail") {
      setSmtpConfig(prev => ({
        ...prev,
        host: "smtp.gmail.com",
        port: "587",
        from: prev.from || (prev.user ? `"pySync Notifications" <${prev.user}>` : '"pySync Notifications" <noreply@gmail.com>')
      }));
    } else if (preset === "office365") {
      setSmtpConfig(prev => ({
        ...prev,
        host: "smtp.office365.com",
        port: "587",
        from: prev.from || (prev.user ? `"pySync Notifications" <${prev.user}>` : '"pySync Notifications" <noreply@office365.com>')
      }));
    } else if (preset === "sendgrid") {
      setSmtpConfig(prev => ({
        ...prev,
        host: "smtp.sendgrid.net",
        port: "587",
        user: prev.user || "apikey"
      }));
    } else if (preset === "ses") {
      setSmtpConfig(prev => ({
        ...prev,
        host: "email-smtp.us-east-1.amazonaws.com",
        port: "587"
      }));
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "smtp" && request) {
      setLoadingSmtp(true);
      request("/api/smtp/config")
        .then((data: any) => {
          if (data) {
            setSmtpConfig({
              host: data.host || "",
              port: data.port || "587",
              user: data.user || "",
              pass: data.pass || "",
              from: data.from || ""
            });
            if (data.host?.includes("gmail")) setSmtpProviderPreset("gmail");
            else if (data.host?.includes("office365") || data.host?.includes("outlook")) setSmtpProviderPreset("office365");
            else if (data.host?.includes("sendgrid")) setSmtpProviderPreset("sendgrid");
            else if (data.host?.includes("amazonaws")) setSmtpProviderPreset("ses");
            else if (data.host) setSmtpProviderPreset("custom");
          }
        })
        .catch((err: any) => {
          console.error("Failed to load SMTP config:", err);
          if (showToast) showToast("Failed to load SMTP configuration.", "error");
        })
        .finally(() => {
          setLoadingSmtp(false);
        });
    }
  }, [isOpen, activeTab, request]);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    setLoadingSmtp(true);
    try {
      const res = await request("/api/smtp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpConfig)
      });
      if (res && res.success) {
        if (showToast) showToast(res.message || "SMTP configuration saved.", "success");
      }
    } catch (err: any) {
      console.error("Failed to save SMTP config:", err);
      if (showToast) showToast(err.message || "Failed to save SMTP configuration.", "error");
    } finally {
      setLoadingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    const targetEmail = testEmail || user?.email;
    if (!targetEmail) {
      if (showToast) showToast("Please enter a test recipient email address.", "error");
      return;
    }
    if (!request) return;
    setTestingSmtp(true);
    try {
      const res = await request("/api/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      if (res && res.success) {
        if (showToast) showToast(res.message || "Test email sent successfully!", "success");
      }
    } catch (err: any) {
      console.error("Failed SMTP test:", err);
      if (showToast) showToast(err.message || "SMTP connection test failed.", "error");
    } finally {
      setTestingSmtp(false);
    }
  };

  const [stackDomain, setStackDomain] = useState("pysync.yourdomain.com");
  const [stackEmail, setStackEmail] = useState("admin@yourdomain.com");
  const [stackPort, setStackPort] = useState(3000);
  const [stackInstances, setStackInstances] = useState("max");
  const [loadingStack, setLoadingStack] = useState(false);
  const [savingStack, setSavingStack] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"ecosystem" | "nginx" | "deploy">("deploy");
  const [generatedFiles, setGeneratedFiles] = useState<any>(null);

  useEffect(() => {
    if (isOpen && activeTab === "stack" && request) {
      setLoadingStack(true);
      request("/api/stack/config")
        .then((data: any) => {
          if (data) {
            setStackDomain(data.domain || "pysync.yourdomain.com");
            setStackEmail(data.email || "admin@yourdomain.com");
            setStackPort(data.port || 3000);
            setStackInstances(data.instances || "max");
          }
        })
        .catch((err: any) => {
          console.error("Failed to load stack config:", err);
        })
        .finally(() => {
          setLoadingStack(false);
        });
    }
  }, [isOpen, activeTab, request]);

  const handleSaveStack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    setSavingStack(true);
    try {
      const res = await request("/api/stack/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: stackDomain,
          email: stackEmail,
          port: Number(stackPort),
          instances: stackInstances
        })
      });
      if (res && res.success) {
        if (showToast) showToast(res.message || "Stack configuration saved and files generated.", "success");
        if (res.files) {
          setGeneratedFiles(res.files);
        }
      }
    } catch (err: any) {
      console.error("Failed to save stack config:", err);
      if (showToast) showToast(err.message || "Failed to save stack configuration.", "error");
    } finally {
      setSavingStack(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const languages = ["English", "Spanish", "Hindi", "French", "German"];

  const translations: Record<string, Record<string, string>> = {
    English: {
      settings: "Settings",
      preferences: "Preferences",
      appearance: "Appearance",
      language: "Language",
      accent: "Accent Color",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      systemDefault: "System Default",
      font: "Font Style",
      fontSize: "Font Size",
      motion: "Reduced Motion",
    },
    Spanish: {
      settings: "Ajustes",
      preferences: "Preferencias",
      appearance: "Apariencia",
      language: "Idioma",
      accent: "Color de Acento",
      theme: "Tema",
      light: "Claro",
      dark: "Oscuro",
      systemDefault: "Predeterminado del Sistema",
      font: "Estilo de Fuente",
      fontSize: "Tamaño de Fuente",
      motion: "Movimiento Reducido",
    },
    Hindi: {
      settings: "सेटिग्स",
      preferences: "वरीयताएँ",
      appearance: "दिखावट",
      language: "भाषा",
      accent: "एक्सेन्ट रंग",
      theme: "थीम",
      light: "लाइट",
      dark: "डार्क",
      systemDefault: "सिस्टम डिफ़ॉल्ट",
      font: "फ़ॉन्ट शैली",
      fontSize: "फ़ॉन्ट आकार",
      motion: "कम गति",
    },
    French: {
      settings: "Paramètres",
      preferences: "Préférences",
      appearance: "Apparence",
      language: "Langue",
      accent: "Couleur d'Accent",
      theme: "Thème",
      light: "Clair",
      dark: "Sombre",
      systemDefault: "Système par Défaut",
      font: "Style de Police",
      fontSize: "Taille de Police",
      motion: "Mouvement Réduit",
    },
    German: {
      settings: "Einstellungen",
      preferences: "Präferenzen",
      appearance: "Erscheinungsbild",
      language: "Sprache",
      accent: "Akzentfarbe",
      theme: "Design",
      light: "Hell",
      dark: "Dunkel",
      systemDefault: "Systemstandard",
      font: "Schriftstil",
      fontSize: "Schriftgröße",
      motion: "Reduzierte Bewegung",
    },
  };

  const t = (key: string) => {
    return translations[language]?.[key] || translations["English"][key] || key;
  };

  const colors = [
    { id: "amber", class: "bg-amber-primary" },
    { id: "blue", class: "bg-blue-500" },
    { id: "green", class: "bg-emerald-500" },
    { id: "purple", class: "bg-purple-500" },
    { id: "red", class: "bg-rose-500" },
  ];

  const handleToggle = (setter: any, value: boolean) => {
    setter(!value);
    playSound("click");
  };

  const tabs = [
    { id: "account", label: "Account", mobileLabel: "Account", icon: User },
    { id: "preferences", label: "Preferences", mobileLabel: "Prefs", icon: Settings },
    { id: "appearance", label: "Appearance", mobileLabel: "Style", icon: Palette },
    ...(user?.role === "admin" || user?.permissions?.includes("MANAGE_USERS") ? [
      { id: "smtp", label: "Email & SMTP", mobileLabel: "SMTP", icon: Mail },
      { id: "stack", label: "Stack Manager", mobileLabel: "Stack", icon: Server },
    ] : []),
    { id: "help", label: "Help", mobileLabel: "Help", icon: HelpCircle },
    { id: "system", label: "System & About", mobileLabel: "System", icon: Info },
  ];

  const getLiveCode = () => {
    if (activeCodeTab === "ecosystem") {
      return `/**
 * PM2 Process Manager Configuration for pySync CRM
 * Generated automatically by PySync Stack Manager
 */
module.exports = {
  apps: [
    {
      name: 'pysync-crm',
      script: './dist/server.cjs',
      instances: '${stackInstances}',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: ${stackPort}
      },
      env_file: '.env',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};`;
    } else if (activeCodeTab === "nginx") {
      return `# Nginx Server Block Virtual Host configuration for pySync CRM
# Generated automatically by PySync Stack Manager

server {
    listen 80;
    listen [::]:80;
    server_name ${stackDomain};

    # Redirect all HTTP traffic to secure HTTPS
    location / {
        return 301 https://$host$request_uri;
    }

    # Certbot ACME challenge validation path
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${stackDomain};

    # SSL Certificates managed by Certbot Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/${stackDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${stackDomain}/privkey.pem;

    # Secure SSL Protocols and Ciphers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_comp_level 5;

    # Backend API / Reverse Proxy configuration
    location / {
        proxy_pass http://127.0.0.1:${stackPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Max body upload limits (useful for larger document transfers)
        client_max_body_size 500M;
    }

    # Static Assets Long-term Caching
    location /assets/ {
        proxy_pass http://127.0.0.1:${stackPort};
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}`;
    } else {
      return `#!/bin/bash
# pySync CRM Automated Deployment Script (Ubuntu/Debian)
# NGINX + PM2 + Certbot Stack Setup
# Generated automatically by PySync Stack Manager

# Exit on any error
set -e

DOMAIN="${stackDomain}"
EMAIL="${stackEmail}"
PORT="${stackPort}"

echo "================================================="
echo "🚀 Starting pySync CRM Stack Deployment on Host"
echo "Target Domain: \$DOMAIN"
echo "Internal Port: \$PORT"
echo "Alert SSL Email: \$EMAIL"
echo "================================================="

# 1. Update Package repositories
echo "Updating apt packages..."
sudo apt update -y

# 2. Install curl and git if missing
sudo apt install -y curl git gnupg

# 3. Install Node.js (v20 LTS)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: \$(node -v)"
fi

# 4. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    sudo npm install -y pm2 -g
else
    echo "PM2 already installed: \$(pm2 -v)"
fi

# 5. Install NGINX
if ! command -v nginx &> /dev/null; then
    echo "Installing NGINX..."
    sudo apt install -y nginx
else
    echo "NGINX already installed."
fi

# 6. Install Certbot
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "Certbot already installed."
fi

# 7. Configure Temporary HTTP Server block for ACME challenge
echo "Creating HTTP Nginx configuration..."
sudo tee /etc/nginx/sites-available/pysync.conf > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name \$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:\$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOF

# Link configuration
sudo ln -sf /etc/nginx/sites-available/pysync.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test & reload
sudo nginx -t
sudo systemctl reload nginx

# 8. Request SSL Certificate
echo "Requesting SSL certificates..."
sudo certbot --nginx --non-interactive --agree-tos --email "\${EMAIL}" -d "\${DOMAIN}" --redirect

# 9. Overwrite with full production secure SSL server block
echo "Applying final secure HTTPS configuration..."
sudo tee /etc/nginx/sites-available/pysync.conf > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name \$DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name \$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/\$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/\$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        proxy_pass http://127.0.0.1:\$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 500M;
    }
}
EOF

# Test & reload final configuration
sudo nginx -t
sudo systemctl reload nginx

# 10. Install production dependencies and boot up PM2
echo "Installing production dependencies..."
npm install --omit=dev --legacy-peer-deps || npm install --legacy-peer-deps

echo "Building production bundles..."
npm run build

echo "Starting/Reloading process with PM2..."
if pm2 show pysync-crm &> /dev/null; then
    pm2 reload ecosystem.config.cjs
else
    pm2 start ecosystem.config.cjs
fi

sudo env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u \$USER --hp \$HOME
pm2 save

echo "================================================="
echo "🎉 pySync CRM stack deployment complete!"
echo "Check your site at: https://$DOMAIN"
echo "================================================="`;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 ">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface border border-border-dim rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-[85vh] max-h-[800px]"
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-surface-2 border-b md:border-b-0 md:border-r border-border-dim flex flex-col shrink-0">
          <div className="p-4 sm:p-6 border-b border-border-dim flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-primary/10 rounded-lg">
                <Settings className="text-amber-primary" size={20} />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary">
                {t("settings")}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-text-dim hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-2 md:p-4 bg-surface-2 md:bg-transparent">
            <div className="grid grid-cols-5 md:flex md:flex-col gap-1 md:gap-1 p-1 md:p-0 bg-surface-3/50 md:bg-transparent rounded-xl border border-border-dim/50 md:border-none">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      playSound("click");
                    }}
                    className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-1 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl text-[10px] sm:text-xs md:text-sm font-medium transition-all text-center md:text-left ${
                      isActive
                        ? "bg-amber-primary text-black font-bold shadow-sm shadow-amber-primary/30 md:bg-amber-primary/10 md:text-amber-primary md:border md:border-amber-primary/30"
                        : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                    }`}
                  >
                    <tab.icon size={16} className={`shrink-0 ${isActive ? "text-black md:text-amber-primary" : "text-text-dim"}`} />
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="inline md:hidden text-[10px] leading-tight font-semibold tracking-tight">{tab.mobileLabel || tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
          <div className="hidden md:flex absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 bg-surface-2 border border-border-dim rounded-lg text-text-dim hover:text-text-primary hover:border-border-bright transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-8">
              {activeTab === "account" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">
                      Account Profile
                    </h3>
                    <p className="text-sm text-text-dim">
                      Manage your personal information and role.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-surface-2 rounded-2xl border border-border-bright">
                    <div className="w-24 h-24 rounded-full bg-amber-primary/20 flex items-center justify-center text-4xl text-amber-primary font-bold overflow-hidden border-2 border-amber-primary/30 shadow-lg shrink-0">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.name?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-xl font-bold text-text-primary">
                        {user?.name}
                      </h4>
                      <p className="text-sm text-text-secondary mb-3">
                        {user?.email}
                      </p>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20 bg-amber-500/5 text-amber-500">
                        {user?.role === "admin"
                          ? "Super Admin"
                          : user?.role?.replace("_", " ")}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onProfileClick();
                        onClose();
                        playSound("click");
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-amber-primary text-bg rounded-xl text-sm font-bold hover:bg-amber-secondary transition-all shadow-lg shadow-amber-primary/20"
                    >
                      Edit Profile
                    </button>
                  </div>

                  {/* Team Settings / Assigned Region Setting */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary uppercase tracking-[0.2em] mb-1">
                        Team Settings
                      </h4>
                      <p className="text-xs text-text-dim">
                        Configure regional bounds and zone operations for your desk.
                      </p>
                    </div>

                    <div className="p-6 bg-surface-2 rounded-2xl border border-border-bright hover:border-amber-primary/40 transition-all space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-text-primary">
                            Current Assigned Region
                          </p>
                          <p className="text-xs text-text-dim">
                            Warnings will trigger if resale properties are listed outside this region.
                          </p>
                        </div>
                        <div className="w-full sm:w-48">
                          <select
                            value={assignedRegion}
                            onChange={(e) => {
                              setAssignedRegion(e.target.value);
                              showToast(`Assigned region updated to ${e.target.value}`, "success");
                              playSound("click");
                            }}
                            className="w-full bg-surface-3 border border-border-bright rounded-xl px-4 py-2.5 text-xs font-bold text-text-primary focus:outline-none focus:border-amber-primary"
                          >
                            <option value="Gurugram">Gurugram</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Noida">Noida</option>
                            <option value="Bangalore">Bangalore</option>
                            <option value="Pune">Pune</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "help" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">
                      Help & Support
                    </h3>
                    <p className="text-sm text-text-dim">
                      Get assistance or find answers to common questions.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim">
                      <h4 className="text-sm font-bold text-text-primary mb-3">
                        Frequently Asked Questions
                      </h4>
                      <div className="space-y-3">
                        <div className="p-4 bg-surface-3 rounded-xl">
                          <p className="text-sm font-bold text-text-primary">
                            How do I add a project?
                          </p>
                          <p className="text-xs text-text-dim mt-1">
                            Navigate to the Projects tab and click the "Add
                            Project" button.
                          </p>
                        </div>
                        <div className="p-4 bg-surface-3 rounded-xl">
                          <p className="text-sm font-bold text-text-primary">
                            How do I update my profile?
                          </p>
                          <p className="text-xs text-text-dim mt-1">
                            Go to Settings &gt; Account and click "Edit
                            Profile".
                          </p>
                        </div>
                      </div>
                    </div>



                    <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim">
                      <h4 className="text-sm font-bold text-text-primary mb-3">
                        Contact Support
                      </h4>
                      <p className="text-xs text-text-dim mb-4">
                        Need further assistance? Reach out to our support team.
                      </p>
                      <a
                        href="mailto:support@example.com"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-primary text-bg rounded-xl text-xs font-bold hover:bg-amber-secondary transition-all"
                      >
                        <Mail size={14} />
                        Email Support
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "preferences" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">
                      App Preferences
                    </h3>
                    <p className="text-sm text-text-dim">
                      Customize how the application behaves.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div id="settings-notifications-row" className="flex flex-col p-4 sm:p-5 bg-surface-2 rounded-2xl border-2 border-amber-primary/30 sm:border-border-bright hover:border-amber-primary/50 transition-all gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-primary/10 rounded-xl text-amber-primary">
                            <Bell size={20} className="animate-pulse" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary flex items-center gap-2">
                              <span>Notifications</span>
                              <span className="px-1.5 py-0.5 text-[9px] bg-amber-primary/10 text-amber-primary rounded font-mono uppercase tracking-wider">Active</span>
                            </p>
                            <p className="text-xs text-text-dim">
                              Receive real-time system broadcasts and transaction logs
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleToggle(
                              setNotificationsEnabled,
                              notificationsEnabled,
                            )
                          }
                          className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${notificationsEnabled ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${notificationsEnabled ? "left-7" : "left-1"}`}
                          />
                        </button>
                      </div>

                      {/* Per-category Chime Alerts */}
                      <div className="pt-4 border-t border-border-dim/50 pl-2 sm:pl-16 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-text-primary">Critical Alerts Chime</p>
                            <p className="text-[10px] text-text-dim">Audible chime for errors and high-priority warnings.</p>
                          </div>
                          <button
                            onClick={() => handleToggle(setCriticalChimeEnabled, criticalChimeEnabled)}
                            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${criticalChimeEnabled ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${criticalChimeEnabled ? "left-5" : "left-0.5"}`} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-text-primary">General Updates Chime</p>
                            <p className="text-[10px] text-text-dim">Audible chime for successes and standard notifications.</p>
                          </div>
                          <button
                            onClick={() => handleToggle(setUpdatesChimeEnabled, updatesChimeEnabled)}
                            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${updatesChimeEnabled ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${updatesChimeEnabled ? "left-5" : "left-0.5"}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 sm:p-5 bg-surface-2 rounded-2xl border border-border-dim hover:border-border-bright transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-surface-3 rounded-xl text-text-secondary">
                          <Layers size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">
                            Compact Mode
                          </p>
                          <p className="text-xs text-text-dim">
                            Reduce spacing in tables and lists
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleToggle(setCompactMode, compactMode)
                        }
                        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${compactMode ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${compactMode ? "left-7" : "left-1"}`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 sm:p-5 bg-surface-2 rounded-2xl border border-border-dim hover:border-border-bright transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-surface-3 rounded-xl text-text-secondary">
                          <Save size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">
                            Auto-save Changes
                          </p>
                          <p className="text-xs text-text-dim">
                            Save edits automatically without prompting
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(setAutoSave, autoSave)}
                        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${autoSave ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${autoSave ? "left-7" : "left-1"}`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 sm:p-5 bg-surface-2 rounded-2xl border border-border-dim hover:border-border-bright transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-surface-3 rounded-xl text-text-secondary">
                          <Volume2 size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">
                            Sound Effects
                          </p>
                          <p className="text-xs text-text-dim">
                            Play sounds on clicks and interactions
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleToggle(setSoundEffects, soundEffects)
                        }
                        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${soundEffects ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${soundEffects ? "left-7" : "left-1"}`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "appearance" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">
                      Appearance
                    </h3>
                    <p className="text-sm text-text-dim">
                      Customize the look and feel of the app.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Globe size={18} className="text-text-secondary" />
                        <h4 className="text-sm font-bold text-text-primary">
                          {t("language")}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {languages.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setLanguage(lang);
                              playSound("click");
                            }}
                            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                              language === lang
                                ? "bg-amber-primary/10 border-amber-primary text-amber-primary shadow-sm shadow-amber-primary/10"
                                : "bg-surface border-border-dim text-text-secondary hover:border-border-bright hover:text-text-primary"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Palette size={18} className="text-text-secondary" />
                        <h4 className="text-sm font-bold text-text-primary">
                          {t("accent")}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {colors.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => {
                              setAccentColor(color.id);
                              playSound("click");
                            }}
                            className={`w-10 h-10 rounded-full transition-all ring-offset-4 ring-offset-surface-2 ${color.class} ${
                              accentColor === color.id
                                ? "ring-2 ring-amber-primary scale-110 shadow-lg"
                                : "opacity-70 hover:opacity-100 hover:scale-105"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Palette size={18} className="text-text-secondary" />
                          <h4 className="text-sm font-bold text-text-primary">
                            {t("theme")}
                          </h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "light", label: t("light"), icon: Sun },
                            { id: "dark", label: t("dark"), icon: Moon },
                            { id: "system", label: t("systemDefault"), icon: Monitor },
                          ].map((tOption) => (
                            <button
                              key={tOption.id}
                              onClick={(e) => {
                                setTheme(tOption.id, e);
                                playSound("click");
                              }}
                              className={`px-2 py-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1.5 text-center ${
                                theme === tOption.id
                                  ? "bg-amber-primary/10 border-amber-primary text-amber-primary shadow-sm"
                                  : "bg-surface border-border-dim text-text-secondary hover:border-border-bright"
                              }`}
                            >
                              <tOption.icon size={15} />
                              <span className="leading-tight text-[10px] sm:text-xs">{tOption.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Type size={18} className="text-text-secondary" />
                          <h4 className="text-sm font-bold text-text-primary">
                            {t("font")}
                          </h4>
                        </div>
                        <div className="flex gap-3">
                          {["mono", "sans"].map((f) => (
                            <button
                              key={f}
                              onClick={() => {
                                setFontFamily(f);
                                playSound("click");
                              }}
                              className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all border capitalize ${
                                fontFamily === f
                                  ? "bg-amber-primary/10 border-amber-primary text-amber-primary shadow-sm"
                                  : "bg-surface border-border-dim text-text-secondary hover:border-border-bright"
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Maximize size={18} className="text-text-secondary" />
                          <h4 className="text-sm font-bold text-text-primary">
                            {t("fontSize")}
                          </h4>
                        </div>
                        <div className="flex gap-2 bg-surface p-1 rounded-xl border border-border-dim">
                          {["small", "medium", "large"].map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                setFontSize(s);
                                playSound("click");
                              }}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                                fontSize === s
                                  ? "bg-surface-3 text-text-primary shadow-sm"
                                  : "text-text-dim hover:text-text-secondary"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 sm:p-5 bg-surface-2 rounded-2xl border border-border-dim hover:border-border-bright transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-surface-3 rounded-xl text-text-secondary">
                          <Zap size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">
                            {t("motion")}
                          </p>
                          <p className="text-xs text-text-dim">
                            Disable animations for better performance
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleToggle(setReducedMotion, reducedMotion)
                        }
                        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${reducedMotion ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${reducedMotion ? "left-7" : "left-1"}`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "system" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">
                      System & About
                    </h3>
                    <p className="text-sm text-text-dim">
                      Application information and system controls.
                    </p>
                  </div>

                  <div className="p-6 bg-surface-2 rounded-2xl border border-border-dim space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-border-dim">
                      <div className="w-16 h-16 bg-amber-primary/20 rounded-2xl border border-amber-primary/30 flex items-center justify-center">
                        <Building2 size={32} className="text-amber-primary" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-text-primary tracking-tight">
                          PySync
                        </h4>
                        <p className="text-sm text-text-secondary">
                          Real Estate Data Platform
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-dim">
                        <span className="text-sm text-text-secondary">
                          App Version
                        </span>
                        <span className="text-sm text-text-primary font-mono font-bold bg-surface-3 px-2 py-1 rounded-md">
                          v2.4.0-stable
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-dim">
                        <span className="text-sm text-text-secondary">
                          Build Date
                        </span>
                        <span className="text-sm text-text-primary font-mono font-bold bg-surface-3 px-2 py-1 rounded-md">
                          April 2026
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-dim">
                        <span className="text-sm text-text-secondary">
                          Environment
                        </span>
                        <span className="text-sm text-green-500 font-mono font-bold bg-green-500/10 px-2 py-1 rounded-md">
                          Production
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-dim">
                        <span className="text-sm text-text-secondary">
                          Developer
                        </span>
                        <span className="text-xs text-text-primary font-bold flex items-center gap-1.5">
                          made with <span className="text-red-500">❤️</span>{" "}
                          Gaurav Rathore
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm text-text-dim leading-relaxed">
                      PySync is a comprehensive real estate data platform
                      designed for modern teams. Built with precision and
                      performance in mind to streamline your workflow.
                    </p>
                  </div>

                  <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/20 space-y-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={20} className="text-red-500" />
                      <h4 className="text-sm font-bold text-red-500">
                        Danger Zone
                      </h4>
                    </div>
                    <p className="text-xs text-text-dim">
                      Resetting to defaults will clear all your local
                      preferences and reload the application.
                    </p>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} /> Reset to Defaults
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === "smtp" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  {/* Modern Status & Dispatch Hero Card */}
                  <div className="relative rounded-2xl bg-gradient-to-br from-surface-2 via-surface-2 to-surface border border-border-dim p-4 sm:p-5 overflow-hidden shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          smtpConfig.host && smtpConfig.user
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-amber-primary/10 border-amber-primary/30 text-amber-primary"
                        }`}>
                          <Mail size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-text-primary">
                              SMTP Relay Engine
                            </h3>
                            {smtpConfig.host && smtpConfig.user ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Online & Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-primary/10 text-amber-primary border border-amber-primary/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-primary" />
                                Setup Required
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-dim mt-0.5">
                            Handles user invites, temporary passwords, reset tokens, and notifications.
                          </p>
                        </div>
                      </div>

                      {user?.email && (
                        <div className="text-left sm:text-right text-[11px] text-text-dim">
                          <span className="opacity-70">Admin Dispatcher:</span>{" "}
                          <span className="font-mono font-medium text-text-primary">{user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mail Provider Selection Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
                        <Server size={12} className="text-amber-primary" /> Mail Service Provider
                      </label>
                      <span className="text-[10px] text-text-dim">One-click port & host presets</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: "gmail", name: "Google Workspace", sub: "smtp.gmail.com", badge: "TLS 587" },
                        { id: "office365", name: "Microsoft 365", sub: "smtp.office365.com", badge: "TLS 587" },
                        { id: "sendgrid", name: "SendGrid", sub: "smtp.sendgrid.net", badge: "TLS 587" },
                        { id: "ses", name: "Amazon SES", sub: "email-smtp.aws", badge: "TLS 587" },
                        { id: "custom", name: "Custom Host", sub: "Enterprise SMTP", badge: "Custom" },
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => applySmtpPreset(prov.id)}
                          className={`p-2.5 rounded-xl text-left border transition-all relative flex flex-col justify-between ${
                            smtpProviderPreset === prov.id
                              ? "bg-amber-primary/10 border-amber-primary text-text-primary shadow-sm ring-1 ring-amber-primary/20"
                              : "bg-surface-2 border-border-dim text-text-dim hover:text-text-primary hover:border-border-bright"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border-dim/60 text-text-dim">
                              {prov.badge}
                            </span>
                            {smtpProviderPreset === prov.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-primary" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold truncate">{prov.name}</div>
                            <div className="text-[10px] text-text-dim truncate">{prov.sub}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gmail App Password Alert Card */}
                  {smtpConfig.host.includes("gmail") && (
                    <div className="p-4 bg-gradient-to-r from-amber-primary/10 to-surface-2 border border-amber-primary/30 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-primary flex items-center gap-1.5 text-xs">
                          <Key size={14} /> Gmail Security Requirement
                        </span>
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-primary hover:underline bg-amber-primary/10 px-2 py-0.5 rounded-lg border border-amber-primary/20"
                        >
                          Generate App Password <ExternalLink size={11} />
                        </a>
                      </div>
                      <p className="text-[11px] text-text-dim leading-relaxed">
                        Standard account passwords cannot be used. Enable 2-Step Verification on your Google Account, generate a 16-character <strong>App Password</strong>, and paste it into the password field below.
                      </p>
                    </div>
                  )}

                  {/* Connection Console Form */}
                  <form onSubmit={handleSaveSmtp} className="p-5 bg-surface-2/80 rounded-2xl border border-border-dim space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Host */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-text-secondary">SMTP Hostname</label>
                        <div className="relative">
                          <Server size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                          <input
                            type="text"
                            value={smtpConfig.host}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                            placeholder="smtp.example.com"
                            className="w-full pl-8 pr-3 py-2 text-xs bg-surface border border-border-dim hover:border-border-bright focus:border-amber-primary rounded-xl text-text-primary outline-none transition-all placeholder:text-text-dim/60"
                            required
                          />
                        </div>
                      </div>

                      {/* Port & Protocol Selector */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-text-secondary">Port & Security Mode</label>
                          <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-border-dim">
                            <button
                              type="button"
                              onClick={() => setSmtpConfig({ ...smtpConfig, port: "587" })}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                smtpConfig.port === "587"
                                  ? "bg-amber-primary text-black"
                                  : "text-text-dim hover:text-text-primary"
                              }`}
                            >
                              587 (STARTTLS)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSmtpConfig({ ...smtpConfig, port: "465" })}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                smtpConfig.port === "465"
                                  ? "bg-amber-primary text-black"
                                  : "text-text-dim hover:text-text-primary"
                              }`}
                            >
                              465 (SSL/TLS)
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={smtpConfig.port}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                          placeholder="587"
                          className="w-full px-3 py-2 text-xs bg-surface border border-border-dim hover:border-border-bright focus:border-amber-primary rounded-xl text-text-primary outline-none transition-all placeholder:text-text-dim/60 font-mono"
                          required
                        />
                      </div>

                      {/* Username */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-text-secondary">Username / Authentication Email</label>
                        <div className="relative">
                          <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                          <input
                            type="text"
                            value={smtpConfig.user}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSmtpConfig(prev => ({
                                ...prev,
                                user: val,
                                from: prev.from || (val.includes('@') ? `"pySync Notifications" <${val}>` : prev.from)
                              }));
                            }}
                            placeholder="notifications@yourdomain.com"
                            className="w-full pl-8 pr-3 py-2 text-xs bg-surface border border-border-dim hover:border-border-bright focus:border-amber-primary rounded-xl text-text-primary outline-none transition-all placeholder:text-text-dim/60"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-text-secondary">SMTP App Password</label>
                          <button
                            type="button"
                            onClick={() => setShowSmtpPass(!showSmtpPass)}
                            className="text-[10px] text-amber-primary hover:underline flex items-center gap-1 font-medium"
                          >
                            {showSmtpPass ? <EyeOff size={11} /> : <Eye size={11} />}
                            <span>{showSmtpPass ? "Mask" : "Reveal"}</span>
                          </button>
                        </div>
                        <div className="relative">
                          <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                          <input
                            type={showSmtpPass ? "text" : "password"}
                            value={smtpConfig.pass}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                            placeholder="Enter 16-character password"
                            className="w-full pl-8 pr-3 py-2 font-mono text-xs bg-surface border border-border-dim hover:border-border-bright focus:border-amber-primary rounded-xl text-text-primary outline-none transition-all placeholder:text-text-dim/60"
                          />
                        </div>
                      </div>

                      {/* From Header */}
                      <div className="space-y-1 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-text-secondary">Sender Header Name & Address</label>
                          {smtpConfig.user && smtpConfig.user.includes("@") && (
                            <button
                              type="button"
                              onClick={() => setSmtpConfig({ ...smtpConfig, from: `"pySync Notifications" <${smtpConfig.user}>` })}
                              className="text-[10px] text-amber-primary hover:underline font-semibold"
                            >
                              Sync with Username
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={smtpConfig.from}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
                          placeholder='"pySync CRM" <alerts@yourdomain.com>'
                          className="w-full px-3 py-2 text-xs bg-surface border border-border-dim hover:border-border-bright focus:border-amber-primary rounded-xl text-text-primary outline-none transition-all placeholder:text-text-dim/60"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={loadingSmtp}
                        className="px-5 py-2.5 bg-amber-primary text-black font-black uppercase tracking-wider text-xs rounded-xl hover:bg-amber-primary/90 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
                      >
                        {loadingSmtp ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Saving Configuration...
                          </>
                        ) : (
                          <>
                            <Save size={14} /> Save SMTP Credentials
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Deliverability Diagnostic Dispatch Card */}
                  <div className="p-4 sm:p-5 bg-surface-2/80 rounded-2xl border border-border-dim space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                        Diagnostic Delivery Test
                      </h4>
                      {user?.email && (
                        <button
                          type="button"
                          onClick={() => setTestEmail(user.email)}
                          className="text-[10px] text-amber-primary hover:underline font-semibold"
                        >
                          Target Current User ({user.email})
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-text-dim">
                      Dispatch a test message to confirm firewall permissions, SSL handshakes, and mailbox deliverability.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Recipient email address (e.g. admin@company.com)"
                        className="flex-1 px-3 py-2 text-xs bg-surface border border-border-dim hover:border-border-bright focus:border-amber-primary rounded-xl text-text-primary outline-none transition-all placeholder:text-text-dim/60"
                      />
                      <button
                        type="button"
                        onClick={handleTestSmtp}
                        disabled={testingSmtp}
                        className="px-5 py-2 bg-surface hover:bg-surface-3 border border-border-dim hover:border-amber-primary text-text-primary font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-[0.99]"
                      >
                        {testingSmtp ? (
                          <>
                            <Loader2 size={13} className="animate-spin" /> Testing Relay...
                          </>
                        ) : (
                          <>
                            <Send size={13} className="text-amber-primary" /> Send Diagnostic Test
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "stack" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">
                      NGINX + PM2 + Certbot Stack Manager
                    </h3>
                    <p className="text-sm text-text-dim">
                      Configure parameters and write production deploy/config files directly to your workspaces.
                    </p>
                  </div>

                  <form onSubmit={handleSaveStack} className="p-5 sm:p-6 bg-surface-2 rounded-2xl border border-border-dim space-y-4">
                    <h4 className="text-sm font-bold text-amber-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Cpu size={16} /> Server Parameters
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary">Domain Name (FQDN)</label>
                        <input
                          type="text"
                          value={stackDomain}
                          onChange={(e) => setStackDomain(e.target.value)}
                          placeholder="e.g. pysync.yourdomain.com"
                          className="w-full px-3 py-2 text-sm bg-surface border border-border-dim rounded-xl text-text-primary focus:outline-none focus:border-amber-primary"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary">SSL Certbot Alert Email</label>
                        <input
                          type="email"
                          value={stackEmail}
                          onChange={(e) => setStackEmail(e.target.value)}
                          placeholder="e.g. admin@yourdomain.com"
                          className="w-full px-3 py-2 text-sm bg-surface border border-border-dim rounded-xl text-text-primary focus:outline-none focus:border-amber-primary"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary">Application Port (Internal proxy target)</label>
                        <input
                          type="number"
                          value={stackPort}
                          onChange={(e) => setStackPort(Number(e.target.value))}
                          placeholder="3000"
                          className="w-full px-3 py-2 text-sm bg-surface border border-border-dim rounded-xl text-text-primary focus:outline-none focus:border-amber-primary"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary">PM2 Instance Scaling</label>
                        <select
                          value={stackInstances}
                          onChange={(e) => setStackInstances(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-surface border border-border-dim rounded-xl text-text-primary focus:outline-none focus:border-amber-primary"
                        >
                          <option value="max">Max Cores (Cluster Mode)</option>
                          <option value="1">1 Instance</option>
                          <option value="2">2 Instances (Recommended)</option>
                          <option value="4">4 Instances</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <span className="text-[11px] text-text-dim max-w-md">
                        Saves configuration state and automatically writes physical config files to the root of your pySync workspace folder.
                      </span>
                      <button
                        type="submit"
                        disabled={savingStack}
                        className="w-full sm:w-auto px-5 py-2.5 bg-amber-primary text-black font-bold text-xs sm:text-sm rounded-xl hover:bg-amber-primary/90 transition-all flex items-center justify-center gap-2"
                      >
                        {savingStack ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Generating...
                          </>
                        ) : (
                          <>
                            <Save size={16} /> Save & Generate Stack
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Generated Configurations Previewer */}
                  <div className="p-5 sm:p-6 bg-surface-2 rounded-2xl border border-border-dim space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-amber-primary uppercase tracking-wider flex items-center gap-2">
                        <Terminal size={16} /> Active Stack Configuration Files
                      </h4>
                      <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                        Live Dynamic Preview
                      </span>
                    </div>

                    <div className="flex border-b border-border-dim gap-2 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setActiveCodeTab("deploy")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                          activeCodeTab === "deploy"
                            ? "bg-amber-primary/10 text-amber-primary border border-amber-primary/30"
                            : "text-text-secondary hover:bg-surface"
                        }`}
                      >
                        deploy.sh (Automated script)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCodeTab("nginx")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                          activeCodeTab === "nginx"
                            ? "bg-amber-primary/10 text-amber-primary border border-amber-primary/30"
                            : "text-text-secondary hover:bg-surface"
                        }`}
                      >
                        nginx.conf
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCodeTab("ecosystem")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                          activeCodeTab === "ecosystem"
                            ? "bg-amber-primary/10 text-amber-primary border border-amber-primary/30"
                            : "text-text-secondary hover:bg-surface"
                        }`}
                      >
                        ecosystem.config.cjs
                      </button>
                    </div>

                    <div className="relative rounded-xl overflow-hidden bg-[#0d0f14] border border-border-dim text-xs font-mono p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          const code = getLiveCode();
                          navigator.clipboard.writeText(code);
                          if (showToast) showToast("Copied config file to clipboard!", "success");
                        }}
                        className="absolute top-3 right-3 p-2 bg-surface hover:bg-surface-3 border border-border-dim text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                        title="Copy configuration code"
                      >
                        <Copy size={14} />
                      </button>
                      <pre className="text-[#a9b1d6] leading-relaxed select-all overflow-x-auto">
                        {getLiveCode()}
                      </pre>
                    </div>
                  </div>

                  {/* Interactive Deployment Steps Checklist */}
                  <div className="p-5 sm:p-6 bg-surface-2 rounded-2xl border border-border-dim space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-amber-primary uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 size={16} /> Interactive Deployment Progress
                        </h4>
                        <p className="text-xs text-text-dim mt-0.5">
                          Follow these step-by-step instructions to bring your pySync CRM instance live.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border-dim">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-amber-primary/10 text-amber-primary text-xs font-bold flex items-center justify-center mt-0.5">1</div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-bold text-text-primary">Configure DNS A Record</p>
                          <p className="text-[11px] text-text-secondary">Point your domain <span className="font-mono text-amber-primary font-bold">{stackDomain}</span> to your Ubuntu VPS Server IP address inside your domain provider console (GoDaddy, Cloudflare, Namecheap, etc.).</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border-dim">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-amber-primary/10 text-amber-primary text-xs font-bold flex items-center justify-center mt-0.5">2</div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-bold text-text-primary">Transfer Deployment Files</p>
                          <p className="text-[11px] text-text-secondary">Copy <span className="font-mono font-bold text-text-primary">deploy.sh</span>, <span className="font-mono font-bold text-text-primary">ecosystem.config.cjs</span>, and your production project files onto the Ubuntu VPS server inside your target deployment folder (e.g. <span className="font-mono">/var/www/pysync</span>).</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border-dim">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-amber-primary/10 text-amber-primary text-xs font-bold flex items-center justify-center mt-0.5">3</div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-bold text-text-primary">Execute Automated Script</p>
                          <p className="text-[11px] text-text-secondary">SSH into your Ubuntu server and run: <span className="block font-mono bg-surface-3 p-1.5 rounded border border-border-dim text-white mt-1">chmod +x deploy.sh && ./deploy.sh</span> This installs Nginx, Node, Certbot, obtains SSL certificates and spins up PM2 cluster mode.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Database Explorer Component ---
const DatabaseExplorer = ({
  showToast,
  request,
}: {
  showToast: (
    msg: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;
  request: (url: string, options?: RequestInit) => Promise<any>;
}) => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await request("/api/database/tables");
      if (Array.isArray(res)) setTables(res);
      setLoading(false);
    } catch (e) {
      showToast("Failed to fetch tables", "error");
      setLoading(false);
    }
  };

  const fetchTableData = async (table: string) => {
    setSelectedTable(table);
    setLoading(true);
    try {
      const res = await request(`/api/database/tables/${table}`);
      setTableData(res);
      setLoading(false);
    } catch (e) {
      showToast("Failed to fetch table data", "error");
      setLoading(false);
    }
  };

  if (loading && !tables.length) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-amber-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface p-4 md:p-6 w-full">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div className="p-3 rounded-xl bg-amber-primary/10">
          <DatabaseIcon className="text-amber-primary" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary capitalize tracking-wider">
            Database Explorer
          </h1>
          <p className="text-xs text-text-dim">System Data Explorer</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Tables Sidebar */}
        <div className="w-full md:w-64 max-h-48 md:max-h-none bg-surface-2 rounded-xl border border-border-dim shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-border-dim bg-surface">
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-widest">
              Collections
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => fetchTableData(table)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 flex items-center justify-between ${
                  selectedTable === table
                    ? "bg-amber-primary/10 text-amber-primary"
                    : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                }`}
              >
                <span className="truncate capitalize">{table}</span>
                <DatabaseIcon
                  size={14}
                  className={
                    selectedTable === table
                      ? "text-amber-primary"
                      : "opacity-30"
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Data Grid View */}
        <div className="flex-1 bg-surface-2 rounded-xl border border-border-dim shadow-sm flex flex-col overflow-hidden">
          {selectedTable ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border-dim flex items-center justify-between bg-surface">
                <h2 className="text-sm font-bold text-text-primary space-x-2">
                  <span className="uppercase tracking-widest text-text-dim text-[10px]">
                    Table:
                  </span>
                  <span className="text-amber-primary capitalize">
                    {selectedTable}
                  </span>
                </h2>
                <span className="text-xs font-mono text-amber-primary bg-amber-primary/10 px-2 py-1 rounded border border-amber-primary/20">
                  {tableData.length} records
                </span>
              </div>

              <div className="flex-1 overflow-auto bg-surface relative custom-scrollbar">
                {loading ? (
                  <div className="absolute inset-0 flex justify-center items-center bg-surface/50 z-20">
                    <Loader2
                      className="animate-spin text-amber-primary"
                      size={32}
                    />
                  </div>
                ) : tableData.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-text-dim italic text-sm">
                    No data found in this table.
                  </div>
                ) : (
                  <div className="min-w-max p-4">
                    <table className="w-full text-left border-collapse bg-surface-2 rounded-xl overflow-hidden border border-border-dim shadow-sm">
                      <thead className="bg-surface border-b border-border-dim">
                        <tr>
                          {Object.keys(tableData[0] || {}).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-primary border-r border-border-dim last:border-r-0 whitespace-nowrap"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, i) => (
                          <tr
                            key={row.id || i}
                            className="border-b border-border-dim last:border-b-0 hover:bg-surface-3 transition-colors"
                          >
                            {Object.keys(tableData[0] || {}).map((key) => {
                              const val = row[key];
                              let displayVal = val;
                              if (typeof val === "object" && val !== null) {
                                displayVal = Array.isArray(val)
                                  ? `[Array(${val.length})]`
                                  : "{Object}";
                              }
                              if (
                                typeof displayVal === "string" &&
                                displayVal.length > 40 &&
                                !displayVal.startsWith("data:image")
                              ) {
                                displayVal =
                                  displayVal.substring(0, 40) + "...";
                              } else if (
                                typeof displayVal === "string" &&
                                displayVal.startsWith("data:image")
                              ) {
                                displayVal = "[Base64 Image Data]";
                              }

                              return (
                                <td
                                  key={key}
                                  title={
                                    typeof val === "string"
                                      ? val
                                      : JSON.stringify(val)
                                  }
                                  className="px-4 py-3 text-xs text-text-dim font-mono max-w-[200px] truncate border-r border-border-dim/50 last:border-r-0"
                                >
                                  {String(displayVal)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-text-dim gap-4 p-8 text-center h-full">
              <div className="p-6 bg-surface border border-border-dim rounded-full">
                <DatabaseIcon size={48} className="opacity-20" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  No Table Selected
                </h3>
                <p className="text-sm">
                  Select a table from the sidebar to view its raw contents.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("token") && !!localStorage.getItem("user");
  });
  const lastRefreshTimeRef = useRef<number>(0);
  const activeRequestRef = useRef<Promise<any> | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.role === "admin") return "dashboard";
      } catch {}
    }
    return "dashboard";
  });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [mediaViewLayout, setMediaViewLayout] = useState<"grid" | "list">("grid");
  const [selectedMediaFile, setSelectedMediaFile] = useState<{ name: string; size: number; data: string; type: "pdfs" | "images" } | null>(null);
  const [activeFileAnalysis, setActiveFileAnalysis] = useState<{ [fileName: string]: { tags: string[]; summary: string } }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilterType, setMediaFilterType] = useState<"all" | "pdfs" | "images">("all");
  const [explorerSidebarOpen, setExplorerSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const [isBuilderDropdownOpen, setIsBuilderDropdownOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [isUserRoleDropdownOpen, setIsUserRoleDropdownOpen] = useState(false);
  const [isUserTeamDropdownOpen, setIsUserTeamDropdownOpen] = useState(false);
  const [isUserPageSizeDropdownOpen, setIsUserPageSizeDropdownOpen] = useState(false);
  const [userPage, setUserPage] = useState<number>(1);
  const [userPageSize, setUserPageSize] = useState<number>(6);
  const [userViewMode, setUserViewMode] = useState<"table" | "grid">("table");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("All");
  const [builderFilter, setBuilderFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string[]>(["All"]);
  const [possessionFilter, setPossessionFilter] = useState<string[]>(["All"]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showPriceAlertsOnly, setShowPriceAlertsOnly] = useState(false);
  const [bathroomsFilter, setBathroomsFilter] = useState<number[]>([]);
  const [configurationFilter, setConfigurationFilter] = useState<string[]>([]);
  const [priceRangeFilter, setPriceRangeFilter] = useState<[number, number]>([
    0, 1000000000,
  ]);
  const [areaRangeFilter, setAreaRangeFilter] = useState<[number, number]>([
    0, 100000,
  ]);
  const [unitsRangeFilter, setUnitsRangeFilter] = useState<[number, number]>([
    0, 10000,
  ]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Active filter counters for visual badges
  const activeProjectFiltersCount = [
    assignedToFilter !== "All",
    builderFilter !== "All",
    possessionFilter.length > 0 && !possessionFilter.includes("All"),
    configurationFilter.length > 0,
    priceRangeFilter[0] !== 0 || priceRangeFilter[1] !== 1000000000,
    areaRangeFilter[0] !== 0 || areaRangeFilter[1] !== 100000,
    bathroomsFilter.length > 0,
    unitsRangeFilter[0] !== 0 || unitsRangeFilter[1] !== 10000,
  ].filter(Boolean).length;

  const activeResaleFiltersCount = [
    builderFilter !== "All",
    possessionFilter.length > 0 && !possessionFilter.includes("All"),
    configurationFilter.length > 0,
    priceRangeFilter[0] !== 0 || priceRangeFilter[1] !== 1000000000,
    areaRangeFilter[0] !== 0 || areaRangeFilter[1] !== 100000,
    bathroomsFilter.length > 0,
  ].filter(Boolean).length;

  const [sortBy, setSortBy] = useState(
    () => localStorage.getItem("defaultProjectSort") || "id",
  );
  const [viewMode, setViewMode] = useState<"table" | "grid" | "map">("grid");
  const [selectedMapItemId, setSelectedMapItemId] = useState<string | null>(
    null,
  );
  const [projects, setProjects] = useState<Project[]>([]);

  // Immediately resets the search query and all project filter states
  const handleResetProjectFiltersAndSearch = () => {
    setSearchQuery("");
    setAssignedToFilter("All");
    setBuilderFilter("All");
    setStatusFilter(["All"]);
    setPossessionFilter(["All"]);
    setShowFavoritesOnly(false);
    setShowPriceAlertsOnly(false);
    setBathroomsFilter([]);
    setConfigurationFilter([]);
    setPriceRangeFilter([0, 1000000000]);
    setAreaRangeFilter([0, 100000]);
    setUnitsRangeFilter([0, 10000]);
    setShowAdvancedFilters(false);
  };

  // Robust, unified project filter matching helper
  const matchesProjectFilters = (p: Project) => {
    const matchesBuilder = builderFilter === "All" || p.builderName === builderFilter;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.type || p.projectType || "").replace("FLATS", "Apartments").replace("Apartment", "Apartments").toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter.includes("All") || statusFilter.includes(p.status);
    const matchesPossession = possessionFilter.includes("All") || possessionFilter.includes(p.possessionStatus);
    const matchesAssigned = assignedToFilter === "All" || p.assignedTo === assignedToFilter;
    const matchesBathrooms = bathroomsFilter.length === 0 || (p.bathrooms && String(p.bathrooms).split(", ").some((b) => bathroomsFilter.includes(Number(b))));
    const matchesConfig = configurationFilter.length === 0 || configurationFilter.some((config) => (p.configuration || p.type || "").toLowerCase().includes(config.toLowerCase()));
    const matchesPrice = p.price >= priceRangeFilter[0] && p.price <= priceRangeFilter[1];
    
    // Parse area/sizeRange (e.g. "1800-2400" or "1500" or "1800 sqft")
    const pArea = parseInt(String(p.area || p.sizeRange || "0").replace(/[^0-9]/g, "")) || 0;
    const matchesArea = pArea === 0 || (pArea >= areaRangeFilter[0] && pArea <= areaRangeFilter[1]);
    
    // Parse units
    const pUnits = parseInt(String(p.totalUnits || "0").replace(/[^0-9]/g, "")) || 0;
    const matchesUnits = pUnits === 0 || (pUnits >= unitsRangeFilter[0] && pUnits <= unitsRangeFilter[1]);
    
    const matchesPriceAlert = !showPriceAlertsOnly || !!priceAlerts[p.id];

    return matchesBuilder && matchesSearch && matchesStatus && matchesPossession && matchesAssigned && matchesBathrooms && matchesConfig && matchesPrice && matchesArea && matchesUnits && matchesPriceAlert;
  };

  const matchesResaleFilters = (p: ResaleProperty) => {
    const matchesBuilder = builderFilter === "All" || p.builderName === builderFilter;
    const matchesSearch =
      p.propertyHolderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.societyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.propertyType || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter.includes("All") || statusFilter.includes(p.status);
    const matchesPossession = possessionFilter.includes("All") || possessionFilter.includes(p.possessionStatus);
    
    // Price Filter
    const matchesPrice = p.price >= priceRangeFilter[0] && p.price <= priceRangeFilter[1];

    // Bathrooms check: p.bathrooms is a string
    const pBathrooms = parseInt(p.bathrooms || "0") || 0;
    const matchesBathrooms = bathroomsFilter.length === 0 || bathroomsFilter.includes(pBathrooms);

    // BHK size check
    const matchesConfig = configurationFilter.length === 0 || configurationFilter.some((config) => {
      return (p.bhk || "").toLowerCase().includes(config.toLowerCase());
    });

    // Area sizeSqft
    const pArea = p.sizeSqft || 0;
    const matchesArea = pArea === 0 || (pArea >= areaRangeFilter[0] && pArea <= areaRangeFilter[1]);

    return matchesBuilder && matchesSearch && matchesStatus && matchesPossession && matchesPrice && matchesBathrooms && matchesConfig && matchesArea;
  };

  const [resaleProperties, setResaleProperties] = useState<ResaleProperty[]>(
    [],
  );
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    folders: 0,
    liveUsers: 0,
    totalProperties: 0,
    totalLogs: 0,
    teamLeaders: 0,
  });
  const [approvals, setApprovals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u && u.name) {
          const cached = localStorage.getItem(`realestate_notifs_${u.name}`);
          if (cached) {
            return JSON.parse(cached);
          }
        }
      }
    } catch (e) {}
    return [];
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<string>("account");
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    if (showNotifDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifDropdown]);

  const [notifActiveTab, setNotifActiveTab] = useState<"inbox" | "simulator" | "settings">("inbox");

  // Real estate local notifications state persistence per user
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`realestate_notifs_${user.name}`, JSON.stringify(notifications));
    } catch (e) {
      console.error("Local storage persistence error:", e);
    }
  }, [notifications, user]);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "updates">("all");
  const [notifSearch, setNotifSearch] = useState("");
  const [logCatFilter, setLogCatFilter] = useState<"ALL" | "WRITE" | "DELETE" | "ACCESS">("ALL");
  const [logSearchText, setLogSearchText] = useState("");
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);
  const [expandedNotifIds, setExpandedNotifIds] = useState<string[]>([]);
  const [expandedLogIds, setExpandedLogIds] = useState<string[]>([]);

  const triggerTestNotification = () => {
    if (!user) return;
    const testTemplates = [
      {
        title: "Deal Approved! 🎉",
        message: "The commercial lease listing for 'Westwood Plaza Suite B' has been finalized and approved.",
        type: "success"
      },
      {
        title: "Price Shift Drop Alert 📉",
        message: "Inventory value for 'Skyline Residence Penthouse' shifted -4.2% below standard listing index.",
        type: "warning"
      },
      {
        title: "Compliance Audit Passed ✔️",
        message: "The annual regulatory safety clearance document for 'Meadowbrook Estates' is approved.",
        type: "success"
      },
      {
        title: "System Update: Sync Pipeline 🔄",
        message: "The high-volume multi-node live sync pipeline completed state aggregation in 124ms.",
        type: "info"
      },
      {
        title: "New Tour Request 📅",
        message: "Client 'Amanda Sterling' scheduled a walkthrough for 'Oakwood Villa 102' tomorrow at 2:00 PM.",
        type: "info"
      },
      {
        title: "Draft Rejected ❌",
        message: "Agent description draft for 'Highland Valley Compound' was rejected: 'Violates spacing limits.'",
        type: "warning"
      }
    ];

    const pick = testTemplates[Math.floor(Math.random() * testTemplates.length)];
    const mockNotif = {
      id: "test-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      title: pick.title,
      message: pick.message,
      type: pick.type,
      createdAt: new Date().toISOString(),
      readBy: []
    };

    setNotifications((prev) => [mockNotif, ...prev]);
    showToast("Interactive Test Alert fired!", "success");
  };

  const bulkMarkSelectedAsRead = async () => {
    if (selectedNotifIds.length === 0 || !user) return;
    const testIds = selectedNotifIds.filter((id) => id.startsWith("test-"));
    const realIds = selectedNotifIds.filter((id) => !id.startsWith("test-"));

    try {
      if (testIds.length > 0) {
        setNotifications((prev) =>
          prev.map((n) =>
            testIds.includes(n.id)
              ? { ...n, readBy: Array.from(new Set([...n.readBy, user.name])) }
              : n,
          ),
        );
      }

      if (realIds.length > 0) {
        await Promise.all(
          realIds.map((id) =>
            request(`/api/notifications/${id}/read`, {
              method: "POST",
              headers: { "x-user-name": user.name },
            }),
          ),
        );
      }

      fetchNotifications();
      setSelectedNotifIds([]);
      showToast(`${selectedNotifIds.length} notifications marked read`, "success");
    } catch (err) {
      showToast("Failed to update bulk selection", "error");
    }
  };

  const bulkDismissSelected = async () => {
    if (selectedNotifIds.length === 0) return;
    const testIds = selectedNotifIds.filter((id) => id.startsWith("test-"));
    const realIds = selectedNotifIds.filter((id) => !id.startsWith("test-"));

    try {
      if (testIds.length > 0) {
        setNotifications((prev) => prev.filter((n) => !testIds.includes(n.id)));
      }

      if (realIds.length > 0) {
        await Promise.all(
          realIds.map((id) =>
            request(`/api/notifications/${id}`, {
              method: "DELETE",
            }),
          ),
        );
      }

      fetchNotifications();
      setSelectedNotifIds([]);
      showToast(`${selectedNotifIds.length} notifications dismissed`, "info");
    } catch (err) {
      showToast("Failed to dismiss bulk selection", "error");
    }
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<{
    isOpen: boolean;
    type: "project" | "resale";
    title: string;
    message: string;
  } | null>(null);
  const [entryType, setEntryType] = useState<"project" | "resale">("project");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingResale, setEditingResale] = useState<ResaleProperty | null>(
    null,
  );
  const [isAddingResale, setIsAddingResale] = useState(false);
  const [selectedResale, setSelectedResale] = useState<ResaleProperty | null>(
    null,
  );
  const [resaleToDelete, setResaleToDelete] = useState<ResaleProperty | null>(
    null,
  );
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(
    null,
  );
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isBuildTeamModalOpen, setIsBuildTeamModalOpen] = useState(false);
  const [selectedUsersForTeam, setSelectedUsersForTeam] = useState<string[]>(
    [],
  );
  const [userForPermissions, setUserForPermissions] = useState<User | null>(
    null,
  );
  const [userForTeam, setUserForTeam] = useState<User | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<{
    id: string;
    action: "approve" | "reject";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
        showToast("App installed successfully!", "success");
      }
    } catch (err) {
      console.warn("Install prompt error:", err);
    }
  };

  const allBuilders = Array.from(
    new Set(
      [
        ...(Array.isArray(projects) ? projects : []).map((p) => p.builderName),
        ...(Array.isArray(resaleProperties) ? resaleProperties : []).map((p) => p.builderName),
      ].filter(Boolean),
    ),
  );

  const allSocieties = Array.from(
    new Set(
      (Array.isArray(resaleProperties) ? resaleProperties : [])
        .map((p) => p.societyName)
        .filter(Boolean),
    ),
  );

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "pdfs" | "images",
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFolder) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const project = projects.find((p) => p.id === selectedFolder);
      if (!project) return;

      const newItem = {
        name: file.name,
        size: file.size,
        data: base64String,
      };

      const updatedItems = [...(project[type] || []), newItem];

      try {
        const response = await request(
          `/api/projects/${project.id}?role=${user?.role}&userName=${user?.name}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              [type]: updatedItems,
            }),
          },
        );

        if (response) {
          setProjects((prev) =>
            prev.map((p) => (p.id === project.id ? response : p)),
          );
          showToast(
            `${type === "pdfs" ? "File" : "Image"} uploaded successfully`,
            "success",
          );
        }
      } catch (error) {
        console.error("Upload failed:", error);
        showToast(
          `Failed to upload ${type === "pdfs" ? "file" : "image"}`,
          "error",
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteMediaFile = async (project: any, fileToDelete: any, type: "pdfs" | "images") => {
    const updatedItems = (project[type] || []).filter((item: any) => item.name !== fileToDelete.name);
    try {
       const response = await request(
        `/api/projects/${project.id}?role=${user?.role}&userName=${user?.name}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [type]: updatedItems,
          }),
        },
      );

      if (response) {
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? response : p)),
        );
        setSelectedMediaFile(null);
        showToast("Asset deleted successfully", "success");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      showToast("Failed to delete asset", "error");
    }
  };

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("Active");
  const [selectedBuilder, setSelectedBuilder] = useState<string | null>(null);
  const [newProp, setNewProp] = useState({
    title: "",
    type: "Apartment",
    price: 0,
    location: "",
    area: "",
  });
  const [lastSavedUser, setLastSavedUser] = useState<Date | null>(null);
  const [newUser, setNewUser] = useState(() => {
    const savedDraft = localStorage.getItem("draft_user");
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.warn("Could not parse draft user", e);
      }
    }
    return { name: "", email: "", role: "employee" as Role, phoneNumber: "" };
  });

  useEffect(() => {
    localStorage.setItem("draft_user", JSON.stringify(newUser));
    setLastSavedUser(new Date());
  }, [newUser]);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<UserCredentials | null>(null);
  const [userError, setUserError] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "admin@pysync.local",
    password: "password123",
  });
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [initialLoginUser, setInitialLoginUser] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("notificationsEnabled") !== "false",
  );
  const [criticalChimeEnabled, setCriticalChimeEnabled] = useState(
    () => localStorage.getItem("criticalChimeEnabled") !== "false",
  );
  const [updatesChimeEnabled, setUpdatesChimeEnabled] = useState(
    () => localStorage.getItem("updatesChimeEnabled") !== "false",
  );
  const [compactMode, setCompactMode] = useState(
    () => localStorage.getItem("compactMode") === "true",
  );
  const [autoSave, setAutoSave] = useState(
    () => localStorage.getItem("autoSave") !== "false",
  );
  const [soundEffects, setSoundEffects] = useState(
    () => localStorage.getItem("soundEffects") !== "false",
  );
  const [language, setLanguage] = useState(
    () => localStorage.getItem("language") || "English",
  );
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem("accentColor") || "amber",
  );
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
      return saved;
    }
    return "system";
  });
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleChange);
      return () => (mediaQuery as any).removeListener(handleChange);
    }
  }, []);

  const effectiveTheme = theme === "system" ? systemTheme : theme;

  const [themeRipple, setThemeRipple] = useState<{
    active: boolean;
    x: number;
    y: number;
    toTheme: string;
  } | null>(null);

  const handleThemeChange = (newTheme: string, event?: any) => {
    if (newTheme === theme) return;
    if (themeRipple?.active) return;
    const targetEffective = newTheme === "system" ? systemTheme : newTheme;
    if (reducedMotion) {
      setTheme(newTheme);
      return;
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (event) {
      if (event.clientX !== undefined && event.clientY !== undefined) {
        x = event.clientX;
        y = event.clientY;
      } else if (event.touches && event.touches[0]) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      } else if (event.target) {
        const rect = event.target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    setThemeRipple({
      active: true,
      x,
      y,
      toTheme: targetEffective,
    });

    // Change the core theme at 350ms, when the expand is fully covering the screen
    setTimeout(() => {
      setTheme(newTheme);
    }, 350);

    // Trigger exit animation at 550ms allowing GPU layers to smoothly crossfade
    setTimeout(() => {
      setThemeRipple(null);
    }, 550);
  };
  const [fontFamily, setFontFamily] = useState(
    () => localStorage.getItem("fontFamily") || "mono",
  );
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("fontSize") || "medium",
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => localStorage.getItem("reducedMotion") === "true",
  );
  const [assignedRegion, setAssignedRegionState] = useState(
    () => localStorage.getItem("assignedRegion") || "Gurugram",
  );
  const setAssignedRegion = (val: string) => {
    localStorage.setItem("assignedRegion", val);
    setAssignedRegionState(val);
  };
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportEditing, setIsReportEditing] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "notificationsEnabled",
      notificationsEnabled.toString(),
    );
    localStorage.setItem("criticalChimeEnabled", criticalChimeEnabled.toString());
    localStorage.setItem("updatesChimeEnabled", updatesChimeEnabled.toString());
    localStorage.setItem("compactMode", compactMode.toString());
    localStorage.setItem("autoSave", autoSave.toString());
    localStorage.setItem("soundEffects", soundEffects.toString());
    localStorage.setItem("language", language);
    localStorage.setItem("accentColor", accentColor);
    localStorage.setItem("theme", theme);
    localStorage.setItem("fontFamily", fontFamily);
    localStorage.setItem("fontSize", fontSize);
    localStorage.setItem("reducedMotion", reducedMotion.toString());
  }, [
    notificationsEnabled,
    criticalChimeEnabled,
    updatesChimeEnabled,
    compactMode,
    autoSave,
    soundEffects,
    language,
    accentColor,
    theme,
    fontFamily,
    fontSize,
    reducedMotion,
  ]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", effectiveTheme === "light");
    root.style.setProperty(
      "--font-family",
      fontFamily === "mono"
        ? '"DM Mono", ui-monospace, monospace'
        : "ui-sans-serif, system-ui, sans-serif",
    );
    root.style.setProperty("--motion-duration", reducedMotion ? "0s" : "0.2s");

    const fontSizes: Record<string, string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    root.style.fontSize = fontSizes[fontSize] || "16px";

    const colors: Record<string, { primary: string; secondary: string }> = {
      amber: { primary: "#f59e0b", secondary: "#fbbf24" },
      blue: { primary: "#3b82f6", secondary: "#60a5fa" },
      green: { primary: "#10b981", secondary: "#34d399" },
      purple: { primary: "#8b5cf6", secondary: "#a78bfa" },
      red: { primary: "#f43f5e", secondary: "#fb7185" },
    };

    const selected = colors[accentColor] || colors.amber;
    root.style.setProperty("--accent-primary", selected.primary);
    root.style.setProperty("--accent-secondary", selected.secondary);
  }, [accentColor, effectiveTheme, fontFamily, fontSize, reducedMotion]);

  const playSound = (
    type: "click" | "success" | "error" | "notify" = "click",
  ) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        if (type === "click") {
          navigator.vibrate(10);
        } else if (type === "success") {
          navigator.vibrate([25, 30, 25]);
        } else if (type === "error") {
          navigator.vibrate(150);
        } else if (type === "notify") {
          navigator.vibrate(45);
        }
      } catch (_) {}
    }

    if (!soundEffects) return;

    if (type === "error" && !criticalChimeEnabled) return;
    if ((type === "notify" || type === "success") && !updatesChimeEnabled) return;

    const frequencies: Record<string, number> = {
      click: 440,
      success: 880,
      error: 220,
      notify: 660,
    };

    try {
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        frequencies[type],
        audioCtx.currentTime,
      );

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.1,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn("AudioContext not supported or blocked");
    }
  };

  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [resetSuccess, setResetSuccess] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [debugResetLink, setDebugResetLink] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [forgotIsError, setForgotIsError] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 12)
      return "Password must be at least 12 characters long";
    if (!/\d/.test(password))
      return "Password must contain at least one digit";
    return null;
  };

  const [toasts, setToasts] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Price Alert Subscription State
  const [priceAlerts, setPriceAlerts] = useState<
    Record<
      string,
      {
        projectId: string;
        projectTitle: string;
        lastKnownPrice: number;
        lastKnownStatus: string;
        createdAt: string;
      }
    >
  >(() => {
    try {
      const saved = localStorage.getItem("pysync_price_alerts");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleTogglePriceAlert = (proj: Project) => {
    setPriceAlerts((prev) => {
      const isExisting = !!prev[proj.id];
      const next = { ...prev };
      if (isExisting) {
        delete next[proj.id];
        try {
          localStorage.setItem("pysync_price_alerts", JSON.stringify(next));
        } catch {}
        showToast(`🔕 Price & Status Alert turned OFF for "${proj.title}"`, "info");
      } else {
        next[proj.id] = {
          projectId: proj.id,
          projectTitle: proj.title,
          lastKnownPrice: proj.price,
          lastKnownStatus: proj.status,
          createdAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem("pysync_price_alerts", JSON.stringify(next));
        } catch {}
        showToast(
          `🔔 Price Alert ON: Tracking "${proj.title}" (${formatPrice(proj.price)}, ${proj.status}). You will receive notifications on price drops and status changes!`,
          "success",
        );
      }
      return next;
    });
  };

  // Watcher: Monitor live project price drops or status updates for subscribed alerts
  const prevAlertProjectsMapRef = useRef<Map<string, { price: number; status: string }>>(new Map());
  useEffect(() => {
    if (!projects || projects.length === 0) return;

    if (prevAlertProjectsMapRef.current.size === 0) {
      const initMap = new Map<string, { price: number; status: string }>();
      projects.forEach((p) => initMap.set(p.id, { price: p.price, status: p.status }));
      prevAlertProjectsMapRef.current = initMap;
      return;
    }

    let hasAlertChanges = false;
    const updatedAlerts = { ...priceAlerts };

    projects.forEach((currProj) => {
      const prevData = prevAlertProjectsMapRef.current.get(currProj.id);
      const alert = updatedAlerts[currProj.id];

      if (alert && prevData) {
        // Price Drop Event
        if (currProj.price < prevData.price) {
          const dropAmount = prevData.price - currProj.price;
          showToast(
            `🚨 Price Drop Alert: "${currProj.title}" price dropped from ${formatPrice(prevData.price)} to ${formatPrice(currProj.price)} (Saved ${formatPrice(dropAmount)})!`,
            "success",
          );
          updatedAlerts[currProj.id] = {
            ...alert,
            lastKnownPrice: currProj.price,
          };
          hasAlertChanges = true;
        }

        // Status Change Event
        if (currProj.status !== prevData.status) {
          showToast(
            `📢 Status Change Alert: "${currProj.title}" status changed from "${prevData.status}" to "${currProj.status}"!`,
            "info",
          );
          updatedAlerts[currProj.id] = {
            ...alert,
            lastKnownStatus: currProj.status,
          };
          hasAlertChanges = true;
        }
      }
    });

    const newMap = new Map<string, { price: number; status: string }>();
    projects.forEach((p) => newMap.set(p.id, { price: p.price, status: p.status }));
    prevAlertProjectsMapRef.current = newMap;

    if (hasAlertChanges) {
      setPriceAlerts(updatedAlerts);
      try {
        localStorage.setItem("pysync_price_alerts", JSON.stringify(updatedAlerts));
      } catch {}
    }
  }, [projects]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
    }
    const welcomeUser = params.get("user") || params.get("username") || params.get("email");
    const isWelcome = params.get("welcome") === "true";
    if (welcomeUser) {
      setInitialLoginUser(welcomeUser);
      setLoginForm((prev) => ({ ...prev, email: welcomeUser }));
      if (isWelcome) {
        showToast("Welcome! Please enter your generated credentials to sign in.", "info");
      }
    }
    if (token || welcomeUser || isWelcome) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);



  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (type === "success") playSound("success");
    else if (type === "error") playSound("error");
    else playSound("notify");
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const request = async (url: string, options: RequestInit = {}, retries = 5, delayMs = 2000): Promise<any> => {
    const headers = new Headers(options.headers || {});

    if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Attempt to attach token authorization
    const token = localStorage.getItem("token");
    if (token) {
      if (!headers.has("Authorization"))
        headers.set("Authorization", `Bearer ${token}`);
    }

    // Keep old headers for backwards compatibility or fallback if needed
    if (user) {
      if (!headers.has("x-user-role")) headers.set("x-user-role", user.role);
      if (!headers.has("x-user-name")) headers.set("x-user-name", user.name);
      if (!headers.has("x-user-id")) headers.set("x-user-id", user.id);
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 429 && retries > 0) {
        console.warn(`Transient 429 rate limit hit for ${url}. Retrying in ${delayMs}ms... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return request(url, options, retries - 1, delayMs * 2);
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        setUser(null);
        showToast("Session expired. Please log in again.", "error");
        throw new Error("Unauthorized");
      }

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = {
          error: `Server error: ${response.status} ${response.statusText}`,
        };
      }

      if (!response.ok) {
        let errorMessage = data.error || data.message;

        if (!errorMessage) {
          switch (response.status) {
            case 400:
              errorMessage =
                "Bad Request: Please check your input and try again.";
              break;
            case 403:
              errorMessage =
                "Forbidden: You do not have permission to perform this action.";
              break;
            case 404:
              errorMessage =
                "Not Found: The requested resource could not be found.";
              break;
            case 429:
              errorMessage =
                "Too Many Requests: Please slow down and try again later.";
              break;
            case 500:
              errorMessage =
                "Internal Server Error: Something went wrong on our end.";
              break;
            default:
              errorMessage = `Request failed with status ${response.status}`;
          }
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (err: any) {
      const is429 = err.message && (
        err.message.includes("429") || 
        err.message.includes("Too Many Requests") || 
        err.message.toLowerCase().includes("rate limit") || 
        err.message.includes("Too many requests")
      );
      if (err.message !== "Unauthorized" && err.message !== "Failed to fetch" && err.message !== "Load failed" && !is429) {
        console.error(`API Error (${url}):`, err);
        showToast(err.message || "An unexpected error occurred", "error");
      }
      throw err;
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      refreshData();
    }
  }, [isLoggedIn, activeTab]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      refreshData();
    }, 90000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Background System Health Monitor runs in the background silently
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      console.log(`[System Health Background Monitor] Ping ok. Connection: STABLE. Storage: 1.2GB/10GB. Active at: ${new Date().toLocaleTimeString()}`);
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Automated status update for New Launch projects - DEPRECATED: Handled by server background task
  /*
 useEffect(() => {
 if (isLoggedIn && projects.length > 0) {
 // ... handled by server ...
 }
 }, [isLoggedIn, projects.length]);
 */

  useEffect(() => {
    if (!isLoggedIn) return;

    let reconnectAttempts = 0;
    let eventSource: EventSource | null = null;

    const connect = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const streamUrl = `/api/stream?token=${token}`;
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        reconnectAttempts = 0;
      };

      eventSource.onmessage = (event) => {
        reconnectAttempts = 0;
        try {
          const data = JSON.parse(event.data);
          setIsSyncing(true);
          setTimeout(() => setIsSyncing(false), 1500);
          if (data.type === "NEW_NOTIFICATION") {
            fetchNotifications();
            showToast("New notification received", "info");
          } else if (data.type === "USER_CREATED") {
            setUsers((prev) => [...prev, data.user]);
          } else if (data.type === "USER_DELETED") {
            setUsers((prev) => prev.filter((u) => u.id !== data.userId));
          } else if (data.type === "USER_UPDATED") {
            setUsers((prev) =>
              prev.map((u) => (u.id === data.user.id ? data.user : u)),
            );
          } else if (data.type === "NEW_LOG") {
            setLogs((prev) => {
              if (prev.some((l) => l.id === data.log.id)) return prev;
              return [data.log, ...prev].slice(0, 5000);
            });
          }
        } catch (e) {
          // Heartbeat or malformed JSON
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();

        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;

        setTimeout(() => {
          if (isLoggedIn) {
            connect();
          }
        }, delay);
      };
    };

    connect();
    return () => eventSource?.close();
  }, [isLoggedIn]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await request("/api/notifications", {
        headers: {
          "x-user-role": user.role,
          "x-user-name": user.name,
        },
      });
      const serverNotifs = Array.isArray(data) ? data : [];
      setNotifications((prev) => {
        const testNotifs = prev.filter((n) => n.id && n.id.toString().startsWith("test-"));
        const mergedServerNotifs = serverNotifs.map((sn) => {
          const localMatch = prev.find((pn) => pn.id === sn.id);
          if (localMatch) {
            const combinedReadBy = Array.from(new Set([...(sn.readBy || []), ...(localMatch.readBy || [])]));
            return { ...sn, ...localMatch, readBy: combinedReadBy };
          }
          return sn;
        });
        const mergedList = [...testNotifs];
        mergedServerNotifs.forEach((sn) => {
          if (!mergedList.some((mn) => mn.id === sn.id)) {
            mergedList.push(sn);
          }
        });
        return mergedList;
      });
    } catch (err) {
      // Error handled by request helper
    }
  };

  const isTestId = (id: string) => id.toString().startsWith("test-");

  const markAsRead = async (id: string) => {
    if (!user) return;
    if (isTestId(id)) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, readBy: Array.from(new Set([...n.readBy, user.name])) }
            : n,
        ),
      );
      showToast("Simulation alert marked as read", "info");
      return;
    }
    try {
      await request(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { "x-user-name": user.name },
      });
      fetchNotifications();
      showToast("Notification marked as read", "info");
    } catch (err) {
      // Error handled by request helper
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      // Also mark local simulation items as read
      setNotifications((prev) =>
        prev.map((n) =>
          isTestId(n.id)
            ? { ...n, readBy: Array.from(new Set([...n.readBy, user.name])) }
            : n,
        ),
      );

      await request("/api/notifications/read-all", {
        method: "POST",
        headers: { "x-user-name": user.name },
      });
      fetchNotifications();
    } catch (err) {
      // Error handled by request helper
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (isTestId(id)) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelectedNotifIds((prev) => prev.filter((sid) => sid !== id));
      showToast("Simulation alert dismissed", "info");
      return;
    }
    try {
      await request(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      fetchNotifications();
      setSelectedNotifIds((prev) => prev.filter((sid) => sid !== id));
      showToast("Notification dismissed", "info");
    } catch (err) {
      // Error handled by request helper
    }
  };

  const refreshData = async () => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 15000) {
      if (activeRequestRef.current) {
        try {
          await activeRequestRef.current;
        } catch (e) {}
      }
      return;
    }
    lastRefreshTimeRef.current = now;

    if (activeRequestRef.current) {
      try {
        await activeRequestRef.current;
        return;
      } catch (e) {}
    }

    setIsSyncing(true);
    const requestPromise = request("/api/batch-data");
    activeRequestRef.current = requestPromise;

    try {
      const data = await requestPromise;
      if (data) {
        if (data.stats !== undefined) setStats(data.stats || {
          total: 0,
          active: 0,
          pending: 0,
          folders: 0,
          liveUsers: 0,
          totalProperties: 0,
          totalLogs: 0,
          teamLeaders: 0,
        });
        if (data.projects !== undefined) setProjects(Array.isArray(data.projects) ? data.projects : []);
        if (data.resaleProperties !== undefined) setResaleProperties(Array.isArray(data.resaleProperties) ? data.resaleProperties : []);
        if (data.reports !== undefined) setReports(Array.isArray(data.reports) ? data.reports : []);
        if (data.approvals !== undefined) setApprovals(Array.isArray(data.approvals) ? data.approvals : []);
        if (data.notifications !== undefined) {
          const serverNotifs = Array.isArray(data.notifications) ? data.notifications : [];
          setNotifications((prev) => {
            const testNotifs = prev.filter((n) => n.id && n.id.toString().startsWith("test-"));
            const mergedServerNotifs = serverNotifs.map((sn) => {
              const localMatch = prev.find((pn) => pn.id === sn.id);
              if (localMatch) {
                const combinedReadBy = Array.from(new Set([...(sn.readBy || []), ...(localMatch.readBy || [])]));
                return { ...sn, ...localMatch, readBy: combinedReadBy };
              }
              return sn;
            });
            const mergedList = [...testNotifs];
            mergedServerNotifs.forEach((sn) => {
              if (!mergedList.some((mn) => mn.id === sn.id)) {
                mergedList.push(sn);
              }
            });
            return mergedList;
          });
        }
        if (data.users !== undefined) setUsers(Array.isArray(data.users) ? data.users : []);
        if (data.logs !== undefined) setLogs(Array.isArray(data.logs) ? data.logs : []);
      }
    } catch (err: any) {
      const is429 = err?.message && (
        err.message.includes("429") ||
        err.message.includes("Too Many Requests") ||
        err.message.toLowerCase().includes("rate limit") ||
        err.message.includes("Too many requests")
      );
      if (err?.message !== "Unauthorized" && err?.message !== "Failed to fetch" && err?.message !== "Load failed" && !is429) {
        console.error("Refresh failed:", err);
      }
    } finally {
      activeRequestRef.current = null;
      setTimeout(() => setIsSyncing(false), 1500);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await request("/api/users", {
        headers: { "x-user-role": user?.role || "" },
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      // Error handled by request helper
    }
  };

  const fetchLogs = async () => {
    if (
      !hasPermission(user, "VIEW_LOGS") &&
      !hasPermission(user, "VIEW_REPORTS")
    )
      return;
    try {
      const data = await request("/api/logs", {
        headers: { "x-user-role": user?.role || "" },
      });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      // Error handled by request helper
    }
  };

  const fetchStats = async () => {
    try {
      const data = await request("/api/stats", {
        headers: { "x-user-role": user?.role || "" },
      });
      setStats(data || {
        total: 0,
        active: 0,
        pending: 0,
        folders: 0,
        liveUsers: 0,
        totalProperties: 0,
        totalLogs: 0,
        teamLeaders: 0,
      });
    } catch (err) {
      // Error handled by request helper
    }
  };

  const createReport = async (reportData: any) => {
    try {
      const data = await request("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reportData, userName: user?.name }),
      });
      setReports((prev) => [...prev, data]);
      showToast("Report created successfully", "success");
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateReport = async (id: string, reportData: any) => {
    try {
      const data = await request(`/api/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reportData, userName: user?.name }),
      });
      setReports((prev) => prev.map((r) => (r.id === id ? data : r)));
      showToast("Report updated successfully", "success");
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      await request(`/api/reports/${id}?userName=${user?.name}`, {
        method: "DELETE",
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
      showToast("Report deleted successfully", "success");
    } catch (err) {
      // Error handled by request helper
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await request("/api/projects", {
        headers: { "x-user-role": user?.role || "" },
      });
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      // Error handled by request helper
    }
  };

  const fetchResaleProperties = async () => {
    try {
      const data = await request("/api/resale-properties", {
        headers: { "x-user-role": user?.role || "" },
      });
      setResaleProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      // Error handled by request helper
    }
  };

  const fetchReports = async () => {
    if (!hasPermission(user, "VIEW_REPORTS")) return;
    try {
      const data = await request("/api/reports", {
        headers: { "x-user-role": user?.role || "" },
      });
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      // Error handled by request helper
    }
  };

  const fetchApprovals = async () => {
    try {
      const data = await request("/api/approvals", {
        headers: { "x-user-role": user?.role || "" },
      });
      setApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      // Error handled by request helper
    }
  };

  const handleAddProject = async (formData: any) => {
    try {
      const { price, priceUnit, ...rest } = formData;
      const actualPrice =
        priceUnit === "Lacs"
          ? Number(price) * 100000
          : Number(price) * 10000000;

      // Local duplicate check in frontend first
      const duplicate = projects.find(p => 
        (p.title || "").trim().toLowerCase() === (rest.title || "").trim().toLowerCase() && 
        (p.builderName || "").trim().toLowerCase() === (rest.builderName || "").trim().toLowerCase() &&
        (p.location || "").trim().toLowerCase() === (rest.location || "").trim().toLowerCase()
      );
      if (duplicate) {
        setDuplicateAlert({
          isOpen: true,
          type: "project",
          title: "Duplicate Project Entry",
          message: `A project with the title "${rest.title}", builder "${rest.builderName}", and location "${rest.location}" already exists in the system.`
        });
        return;
      }

      await request("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
        },
        body: JSON.stringify({
          ...rest,
          price: actualPrice,
          userName: user?.name,
        }),
      });
      setIsModalOpen(false);
      showToast("Project added successfully", "success");
      refreshData();
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes("already exists") || err.message.toLowerCase().includes("duplicate"))) {
        setDuplicateAlert({
          isOpen: true,
          type: "project",
          title: "Duplicate Project Entry",
          message: err.message
        });
      }
      // Error handled by request helper
    }
  };

  const handleEditProject = async (formData: any) => {
    try {
      if (!editingProject) return;
      const { price, priceUnit, ...rest } = formData;
      const actualPrice =
        priceUnit === "Lacs"
          ? Number(price) * 100000
          : Number(price) * 10000000;

      // Local duplicate check in frontend first for edit
      const duplicate = projects.find(p => 
        p.id !== editingProject.id &&
        (p.title || "").trim().toLowerCase() === (rest.title || "").trim().toLowerCase() && 
        (p.builderName || "").trim().toLowerCase() === (rest.builderName || "").trim().toLowerCase() &&
        (p.location || "").trim().toLowerCase() === (rest.location || "").trim().toLowerCase()
      );
      if (duplicate) {
        setDuplicateAlert({
          isOpen: true,
          type: "project",
          title: "Duplicate Project Entry",
          message: `A project with the title "${rest.title}", builder "${rest.builderName}", and location "${rest.location}" already exists in the system.`
        });
        return;
      }

      await request(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
        },
        body: JSON.stringify({
          ...rest,
          price: actualPrice,
          userName: user?.name,
        }),
      });
      setEditingProject(null);
      setIsModalOpen(false);
      showToast("Project updated successfully", "success");
      refreshData();
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes("already exists") || err.message.toLowerCase().includes("duplicate"))) {
        setDuplicateAlert({
          isOpen: true,
          type: "project",
          title: "Duplicate Project Entry",
          message: err.message
        });
      }
      // Error handled by request helper
    }
  };

  const handleAddResale = async (formData: any) => {
    try {
      const { price, priceUnit, ...rest } = formData;
      const actualPrice =
        priceUnit === "Lacs"
          ? Number(price) * 100000
          : Number(price) * 10000000;

      // Local duplicate check in frontend first
      const duplicate = resaleProperties.find(p => 
        (p.societyName || "").trim().toLowerCase() === (rest.societyName || "").trim().toLowerCase() && 
        Number(p.bhk || 0) === Number(rest.bhk || 0) &&
        (p.floorNumber || "").trim().toLowerCase() === (rest.floorNumber || "").trim().toLowerCase() &&
        (p.location || "").trim().toLowerCase() === (rest.location || "").trim().toLowerCase()
      );
      if (duplicate) {
        setDuplicateAlert({
          isOpen: true,
          type: "resale",
          title: "Duplicate Listing Detected",
          message: `A listing in "${rest.societyName}" with ${rest.bhk} BHK on floor "${rest.floorNumber}" in "${rest.location}" already exists in the system.`
        });
        return;
      }

      await request("/api/resale-properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
        },
        body: JSON.stringify({
          ...rest,
          price: actualPrice,
          userName: user?.name,
        }),
      });
      setIsAddingResale(false);
      showToast("Listing Project added successfully", "success");
      refreshData();
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes("already exists") || err.message.toLowerCase().includes("duplicate"))) {
        setDuplicateAlert({
          isOpen: true,
          type: "resale",
          title: "Duplicate Listing Detected",
          message: err.message
        });
      }
      // Error handled by request helper
    }
  };

  const handleEditResale = async (formData: any) => {
    try {
      if (!editingResale) return;
      const { price, priceUnit, ...rest } = formData;
      const actualPrice =
        priceUnit === "Lacs"
          ? Number(price) * 100000
          : Number(price) * 10000000;

      // Local duplicate check in frontend first for edit
      const duplicate = resaleProperties.find(p => 
        p.id !== editingResale.id &&
        (p.societyName || "").trim().toLowerCase() === (rest.societyName || "").trim().toLowerCase() && 
        Number(p.bhk || 0) === Number(rest.bhk || 0) &&
        (p.floorNumber || "").trim().toLowerCase() === (rest.floorNumber || "").trim().toLowerCase() &&
        (p.location || "").trim().toLowerCase() === (rest.location || "").trim().toLowerCase()
      );
      if (duplicate) {
        setDuplicateAlert({
          isOpen: true,
          type: "resale",
          title: "Duplicate Listing Detected",
          message: `A listing in "${rest.societyName}" with ${rest.bhk} BHK on floor "${rest.floorNumber}" in "${rest.location}" already exists in the system.`
        });
        return;
      }

      await request(`/api/resale-properties/${editingResale.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
        },
        body: JSON.stringify({
          ...rest,
          price: actualPrice,
          userName: user?.name,
        }),
      });
      setEditingResale(null);
      showToast("Listing Project updated successfully", "success");
      refreshData();
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes("already exists") || err.message.toLowerCase().includes("duplicate"))) {
        setDuplicateAlert({
          isOpen: true,
          type: "resale",
          title: "Duplicate Listing Detected",
          message: err.message
        });
      }
      // Error handled by request helper
    }
  };

  const handleDeleteResale = async (id: string) => {
    try {
      await request(
        `/api/resale-properties/${id}?role=${user?.role}&userName=${user?.name}`,
        {
          method: "DELETE",
          headers: { "x-user-role": user?.role || "" },
        },
      );
      showToast("Listing Project deleted successfully", "success");
      refreshData();
    } catch (err) {
      // Error handled by request helper
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await request(
        `/api/projects/${id}?role=${user?.role}&userName=${user?.name}`,
        {
          method: "DELETE",
          headers: { "x-user-role": user?.role || "" },
        },
      );
      showToast(
        hasPermission(user, "DELETE_PROJECTS")
          ? "Project deleted successfully"
          : "Deletion request sent successfully",
        "success",
      );
      refreshData();
    } catch (err) {
      // Error handled by request helper
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedProjectIds.map((id) =>
          request(
            `/api/projects/${id}?role=${user?.role}&userName=${user?.name}`,
            {
              method: "DELETE",
              headers: { "x-user-role": user?.role || "" },
            },
          ),
        ),
      );

      showToast(
        `Successfully processed ${selectedProjectIds.length} projects`,
        "success",
      );
      setSelectedProjectIds([]);
      setIsBulkDeleteModalOpen(false);
      refreshData();
    } catch (error) {
      showToast("Failed to process some projects", "error");
    }
  };

  const handleBulkStatusChange = async () => {
    try {
      await Promise.all(
        selectedProjectIds.map((id) => {
          const project = projects.find((p) => p.id === id);
          if (!project) return Promise.resolve();
          return request(`/api/projects/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...project, status: bulkStatus }),
          });
        }),
      );

      showToast(
        `Updated status for ${selectedProjectIds.length} projects`,
        "success",
      );
      setSelectedProjectIds([]);
      setIsBulkStatusModalOpen(false);
      refreshData();
    } catch (error) {
      showToast("Failed to update status for some projects", "error");
    }
  };

  const handleApproval = async (id: string, action: "approve" | "reject") => {
    try {
      setCompletingTaskId({ id, action });
      // Add a small delay for visual feedback if it's very fast
      const startTime = Date.now();

      await request(`/api/approvals/${id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
        },
        body: JSON.stringify({ action, userName: user?.name }),
      });

      const endTime = Date.now();
      const elapsed = endTime - startTime;
      if (elapsed < 600) {
        await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
      }

      showToast(`Request ${action}d successfully`, "success");
      refreshData();
    } catch (err) {
      // Error handled by request helper
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleAddUser = async (formData: any) => {
    setUserError("");
    setIsSubmitting(true);
    try {
      const data = await request("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
        },
        body: JSON.stringify({ ...formData, adminName: user?.name }),
      });
      setCreatedUserCredentials({
        username: data.username,
        password: data.password,
        email: data.email || formData.email,
        loginLink: data.loginLink,
      });
      setNewUser({ name: "", email: "", role: "employee", phoneNumber: "" });
      localStorage.removeItem("draft_user");
      showToast("User ID created & invitation link generated!", "success");
      refreshData();
    } catch (err: any) {
      setUserError(err.message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetCredentials = async (targetUserId: string) => {
    try {
      const data = await request(
        `/api/users/${targetUserId}/reset-credentials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": user?.role || "",
          },
        },
      );
      showToast(
        "Credentials reset successfully. Please use the new temporary password.",
        "success",
      );
      if (data.credentials) {
        setCreatedUserCredentials(data.credentials);
        setIsUserModalOpen(true);
      }
    } catch (err: any) {
      showToast(err.message, "error");
      throw err;
    }
  };

  const handleUpdatePermissions = async () => {
    if (!userForPermissions) return;
    try {
      await request(`/api/users/${userForPermissions.id}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          permissions: selectedPermissions,
          adminName: user?.name,
        }),
      });
      setIsPermissionsModalOpen(false);
      setUserForPermissions(null);
      showToast("Permissions updated successfully", "success");
      refreshData();
    } catch (err) {
      // Error handled by request helper
    }
  };

  const handleAssignTeam = async () => {
    if (!userForTeam) return;
    try {
      await request(`/api/users/${userForTeam.id}/assign-team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          teamLeaderId: selectedTeamLeader,
          leaderName: user?.name,
        }),
      });
      setIsTeamModalOpen(false);
      setUserForTeam(null);
      showToast("Team assigned successfully", "success");
      refreshData();
    } catch (err) {
      // Error handled by request helper
    }
  };

  const handleBulkAssignTeam = async () => {
    if (selectedUsersForTeam.length === 0) {
      showToast("Please select at least one user", "error");
      return;
    }

    const targetLeaderId = selectedTeamLeader || user?.id;
    const targetLeaderName =
      users.find((u) => u.id === targetLeaderId)?.name || user?.name;

    try {
      await request(`/api/users/bulk-assign-team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          userIds: selectedUsersForTeam,
          teamLeaderId: targetLeaderId,
          leaderName: targetLeaderName,
        }),
      });
      setIsBuildTeamModalOpen(false);
      setSelectedUsersForTeam([]);
      setSelectedTeamLeader("");
      showToast(
        `Successfully assigned ${selectedUsersForTeam.length} users to the team`,
        "success",
      );
      refreshData();
    } catch (err) {
      // Error handled by request helper
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await request(`/api/users/${userToDelete.id}?adminName=${user?.name}`, {
        method: "DELETE",
        headers: { "x-user-role": user?.role || "" },
      });
      setIsDeleteUserModalOpen(false);
      setUserToDelete(null);
      showToast("User deleted successfully", "success");
      refreshData();
    } catch (err: any) {
      // Error handled by request helper
    }
  };

  const handleUpdateProfile = async (updatedData: Partial<User>) => {
    const targetUserId = selectedProfileUser?.id || user?.id;
    if (!targetUserId) return;

    try {
      const updatedUser = await request(`/api/users/${targetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedData,
          adminName: user?.name,
          requesterRole: user?.role,
          requesterId: user?.id,
        }),
      });

      // If updating current user, update the user state
      if (targetUserId === user?.id) {
        setUser(updatedUser);
      }

      // If viewing someone else's profile, update the selectedProfileUser state
      if (selectedProfileUser) {
        setSelectedProfileUser(updatedUser);
      }

      refreshData();
      showToast("Profile updated successfully", "success");
    } catch (err: any) {
      // Error handled by request helper
    }
  };

  const handleLogin = async (overrideForm?: {
    email: string;
    password: string;
  }) => {
    setLoginError("");
    setIsLoggingIn(true);
    const formToSubmit = overrideForm || loginForm;
    try {
      const responseBody = await request(
        `${window.location.origin}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formToSubmit),
        },
      );
      // Login logic
      const authUser = responseBody.user;
      const authToken = responseBody.token;

      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(authUser));

      setUser(authUser);
      setIsLoggedIn(true);
      if (authUser.role === "admin") {
        setActiveTab("dashboard");
      } else {
        setActiveTab("dashboard");
      }
      showToast(`Welcome back, ${authUser.name}`, "success");
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async (email: string): Promise<boolean> => {
    setForgotEmail(email);
    setForgotMessage("");
    setDebugResetLink("");
    setForgotIsError(false);
    setIsSendingReset(true);
    try {
      const data = await request("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
      setForgotMessage(data.message);
      if (data.isError) {
        setForgotIsError(true);
        showToast(data.message, "error");
        return false;
      } else {
        showToast(data.message, "success");
        if (data.debugResetLink) {
          setDebugResetLink(data.debugResetLink);
        }
        return true;
      }
    } catch (err: any) {
      setForgotMessage(err.message);
      setForgotIsError(true);
      showToast(err.message, "error");
      return false;
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResetPassword = async () => {
    setLoginError("");

    const passwordError = validatePassword(resetPasswordForm.password);
    if (passwordError) {
      setLoginError(passwordError);
      return;
    }

    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      setLoginError("Passwords do not match");
      return;
    }
    setIsResetting(true);
    try {
      await request("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword: resetPasswordForm.password,
        }),
      });
      setResetSuccess(true);
      setResetToken("");
      setForgotPassword(false);
      showToast("Password reset successfully", "success");
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const togglePossessionFilter = (status: string) => {
    setPossessionFilter([status]);
  };

  const toggleBathroomFilter = (count: number) => {
    if (bathroomsFilter.includes(count)) {
      setBathroomsFilter(bathroomsFilter.filter((c) => c !== count));
    } else {
      setBathroomsFilter([...bathroomsFilter, count]);
    }
  };

  const toggleConfigurationFilter = (config: string) => {
    if (configurationFilter.includes(config)) {
      setConfigurationFilter(configurationFilter.filter((c) => c !== config));
    } else {
      setConfigurationFilter([...configurationFilter, config]);
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter([status]);
  };

  return (
    <ErrorBoundary>
      {!isLoggedIn ? (
        <div className="h-screen bg-bg flex flex-col justify-center items-center p-4 relative overflow-hidden">
          {/* Animated Background Gradients - constrained to prevent scroll */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-primary/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-700" />
          </div>

          <div className="flex items-center justify-center w-full z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[360px] bg-3d border-3d p-6 rounded-[32px] relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(255,255,255,0.05)]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="text-[9px] text-text-dim uppercase tracking-[0.2em] font-black">
                  pySync System · v2.0
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2 border border-border-bright">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[7px] font-mono text-text-secondary uppercase">
                    Core Operational
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {resetToken ? (
                  <motion.div
                    key="reset"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <ShieldCheck size={20} className="text-emerald-500" />
                        Critical Reset
                      </h3>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        Initialize your new secure credentials below. Ensure
                        your password meets the security requirements.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-text-dim uppercase tracking-widest font-black ml-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={resetPasswordForm.password}
                          onChange={(e) =>
                            setResetPasswordForm({
                              ...resetPasswordForm,
                              password: e.target.value,
                            })
                          }
                          className="w-full bg-surface-2 border border-border-bright p-4 rounded-2xl font-mono text-sm text-text-primary focus:border-amber-primary outline-none transition-all"
                          placeholder="••••••••••••"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-text-dim uppercase tracking-widest font-black ml-1">
                          Confirm Identity
                        </label>
                        <input
                          type="password"
                          value={resetPasswordForm.confirmPassword}
                          onChange={(e) =>
                            setResetPasswordForm({
                              ...resetPasswordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full bg-surface-2 border border-border-bright p-4 rounded-2xl font-mono text-sm text-text-primary focus:border-amber-primary outline-none transition-all"
                          placeholder="••••••••••••"
                        />
                      </div>
                    </div>

                    {loginError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold">
                        {loginError}
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleResetPassword}
                        disabled={isResetting}
                        className="w-full bg-amber-primary text-bg py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all"
                      >
                        {isResetting
                          ? "Processing Update..."
                          : "Update & Authenticate"}
                      </button>
                      <button
                        onClick={() => setResetToken("")}
                        className="w-full py-2 text-[10px] font-bold text-text-dim hover:text-text-primary transition-colors uppercase tracking-widest"
                      >
                        Cancel Handshake
                      </button>
                    </div>
                  </motion.div>
                ) : forgotPassword ? (
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <ForgotPasswordForm
                      onBack={() => {
                        setForgotPassword(false);
                        setForgotMessage("");
                        setDebugResetLink("");
                        setForgotIsError(false);
                      }}
                      onSendReset={handleForgotPassword}
                      isLoading={isSendingReset}
                      message={forgotMessage}
                      debugResetLink={debugResetLink}
                      isError={forgotIsError}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="space-y-0.5 mb-6 text-center">
                      <h2 className="text-4xl font-serif font-black text-amber-primary tracking-tighter drop-shadow-md">
                        pySync
                      </h2>
                      <p className="text-[8px] text-text-dim uppercase tracking-[0.4em] font-black opacity-60">
                        Registry Protocol
                      </p>
                    </div>
                    <LoginForm
                      onLogin={handleLogin}
                      onForgotPassword={() => setForgotPassword(true)}
                      isLoading={isLoggingIn}
                      error={loginError}
                      initialIdentifier={initialLoginUser}
                    />

                    <div className="mt-6 space-y-3 pt-4 border-t border-border-dim/20">
                      <div className="flex items-center gap-2 px-1">
                        <div className="h-px flex-1 bg-border-dim/20"></div>
                        <span className="text-[8px] text-text-dim uppercase tracking-[0.2em] font-black">
                          Quick Auth
                        </span>
                        <div className="h-px flex-1 bg-border-dim/20"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => {
                            const form = {
                              email: "admin@pysync.local",
                              password: "password123",
                            };
                            setLoginForm(form);
                            handleLogin(form);
                          }}
                          className="flex flex-col items-center gap-1 p-2 bg-surface-2 border border-border-bright rounded-xl hover:border-amber-primary/50 transition-all group"
                        >
                          <ShieldCheck
                            size={14}
                            className="text-text-dim group-hover:text-amber-primary transition-colors"
                          />
                          <span className="text-[6px] font-black uppercase text-text-dim group-hover:text-text-primary tracking-tighter">
                            Admin
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            const form = {
                              email: "leader@pysync.local",
                              password: "password123",
                            };
                            setLoginForm(form);
                            handleLogin(form);
                          }}
                          className="flex flex-col items-center gap-1 p-2 bg-surface-2 border border-border-bright rounded-xl hover:border-amber-primary/50 transition-all group"
                        >
                          <ShieldCheck
                            size={14}
                            className="text-text-dim group-hover:text-amber-primary transition-colors"
                          />
                          <span className="text-[6px] font-black uppercase text-text-dim group-hover:text-text-primary tracking-tighter">
                            Leader
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            const form = {
                              email: "employee@pysync.local",
                              password: "password123",
                            };
                            setLoginForm(form);
                            handleLogin(form);
                          }}
                          className="flex flex-col items-center gap-1 p-2 bg-surface-2 border border-border-bright rounded-xl hover:border-amber-primary/50 transition-all group"
                        >
                          <ShieldCheck
                            size={14}
                            className="text-text-dim group-hover:text-amber-primary transition-colors"
                          />
                          <span className="text-[6px] font-black uppercase text-text-dim group-hover:text-text-primary tracking-tighter">
                            Staff
                          </span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-12 pt-8 border-t border-border-dim flex justify-between items-center text-[9px] text-text-dim uppercase tracking-widest font-black">
                <span>Security Audited</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={10} />{" "}
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </motion.div>
          </div>

          <footer className="shrink-0 w-full border-t border-border-dim/30 bg-bg/40 backdrop-blur-md py-4 px-4 sm:px-6 z-40 relative">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[9px] uppercase tracking-[0.22em] text-text-dim text-center sm:text-left select-none">
              {/* Sleek minimalist line logo & essential copyright on the left */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
                <span className="text-[10px] font-black text-text-primary tracking-[0.24em] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-primary inline-block min-w-[4px]" />
                  PYSYNC
                </span>
                <span className="text-border-dim/40 font-light font-sans">
                  |
                </span>
                <span className="font-semibold text-text-dim">
                  &copy; {new Date().getFullYear()}
                </span>
                <span className="text-border-dim/40 font-light font-sans">
                  |
                </span>
                <span className="text-text-dim/80 font-medium">
                  Platform by{" "}
                  <span className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150 cursor-pointer">
                    Propertyards.com
                  </span>
                </span>
              </div>

              {/* Essential pages in the same single line */}
              <div className="flex items-center justify-center gap-3.5">
                <a
                  href="#"
                  className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150"
                >
                  Privacy
                </a>
                <span className="text-border-dim/40 font-light">•</span>
                <a
                  href="#"
                  className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150"
                >
                  Terms
                </a>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <div className="flex w-full h-screen bg-bg overflow-hidden relative">
          {/* Animated Background Grid */}
          {activeTab !== "media" && (
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #f59e0b 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          )}

          {/* Mobile Menu Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 z-40 md:hidden"
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <aside
            className={`fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 bg-3d-inverse border-r border-black/50 shadow-3d flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
          >
            <div className="p-6 border-b border-black/50 flex items-baseline justify-between gap-2 relative z-10">
              <div className="flex items-baseline gap-2">
                <motion.span
                  whileHover={{
                    scale: 1.05,
                    x: 5,
                    filter: "drop-shadow(0 0 8px rgba(245,158,11,0.4))",
                  }}
                  className="font-serif text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-primary via-amber-500 to-amber-600 tracking-tighter cursor-default transition-all"
                >
                  pySync
                </motion.span>
              </div>
              <button
                className="md:hidden text-text-dim hover:text-text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 px-3 py-6 space-y-8 overflow-y-auto no-scrollbar">
              <div className="space-y-1">
                <div className="px-4 text-[9px] text-text-dim uppercase tracking-[0.2em] mb-3">
                  Main
                </div>
                <SidebarItem
                  icon={LayoutDashboard}
                  label="Dashboard"
                  active={activeTab === "dashboard"}
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                />
                {user?.role === "team_leader" && (
                  <SidebarItem
                    icon={UsersIcon}
                    label="My Team"
                    active={activeTab === "users"}
                    onClick={() => {
                      setActiveTab("users");
                      setTeamFilter(user.id);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                )}
                <SidebarItem
                  icon={Building2}
                  label="Project"
                  active={activeTab === "projects"}
                  onClick={() => {
                    setActiveTab("projects");
                    setIsMobileMenuOpen(false);
                  }}
                  badge={projects.length}
                />
                <SidebarItem
                  icon={ClipboardList}
                  label="Listing Projects"
                  active={activeTab === "resale"}
                  onClick={() => {
                    setActiveTab("resale");
                    setIsMobileMenuOpen(false);
                  }}
                  badge={resaleProperties.length}
                />
                <SidebarItem
                  icon={FolderOpen}
                  label="Media Folders"
                  active={activeTab === "media"}
                  onClick={() => {
                    setActiveTab("media");
                    setIsMobileMenuOpen(false);
                  }}
                />
              </div>

              <div className="space-y-1">
                <div className="px-4 text-[9px] text-text-dim uppercase tracking-[0.2em] mb-3">
                  Workflow
                </div>
                <SidebarItem
                  icon={Clock}
                  label="Approvals"
                  active={activeTab === "approvals"}
                  onClick={() => {
                    setActiveTab("approvals");
                    setIsMobileMenuOpen(false);
                  }}
                  badge={approvals.length}
                />
                <SidebarItem
                  icon={UsersIcon}
                  label="Users Management"
                  active={activeTab === "users"}
                  onClick={() => {
                    setActiveTab("users");
                    setSearchQuery("");
                    setTeamFilter(null);
                    setIsMobileMenuOpen(false);
                    playSound("click");
                  }}
                />
                <SidebarItem
                  icon={Activity}
                  label="System Audit Logs"
                  active={activeTab === "logs"}
                  onClick={() => {
                    setActiveTab("logs");
                    setIsMobileMenuOpen(false);
                    playSound("click");
                  }}
                />
                <SidebarItem
                  icon={Settings}
                  label="Settings"
                  active={isSettingsModalOpen}
                  onClick={() => {
                    setSettingsInitialTab("account");
                    setIsSettingsModalOpen(true);
                    setIsMobileMenuOpen(false);
                    playSound?.("click");
                  }}
                  className="md:hidden"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border-dim">
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setSelectedProfileUser(null);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 bg-surface-2 rounded-xl border border-border-bright hover:border-amber-primary transition-all group"
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-amber-primary/20 border border-amber-primary flex items-center justify-center text-amber-primary font-bold group-hover:bg-amber-primary group-hover:text-bg transition-all overflow-hidden">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user?.name?.[0] || "?"
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-surface rounded-full flex items-center justify-center border border-border-dim">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden text-left">
                  <div className="text-xs font-bold text-text-primary truncate">
                    {user?.name}
                  </div>
                  <div className="text-[10px] text-text-dim uppercase tracking-wider">
                    {user?.role === "admin"
                      ? "Super Admin"
                      : user?.role === "team_leader"
                        ? "Team Leader"
                        : "Employee"}
                  </div>
                </div>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative bg-bg">
            <header className="h-16 bg-3d border-b border-black/50 shadow-3d flex items-center justify-between px-4 sm:px-8 shrink-0 w-full relative z-[45]">
              <div className="flex items-center gap-4">
                <button
                  className="md:hidden text-text-dim hover:text-amber-primary"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h1 className="font-serif text-lg sm:text-xl font-bold text-text-primary capitalize">
                    {activeTab === "profile"
                      ? selectedProfileUser
                        ? `${selectedProfileUser?.name || "User"}'s Profile`
                        : "My Profile"
                      : activeTab}
                  </h1>
                  <p className="hidden sm:block text-[11px] text-text-dim">
                    Real Estate Data Platform
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">

                <div className="relative" ref={notifDropdownRef}>
                  <button
                    onClick={() => setShowNotifDropdown((prev) => !prev)}
                    className="p-2 sm:p-3 text-text-dim hover:text-amber-primary transition-all relative group rounded-xl hover:bg-surface-2"
                  >
                    <Bell
                      size={20}
                      className={
                        notifications.filter(
                          (n) => !n.readBy.includes(user?.name || ""),
                        ).length > 0
                          ? "animate-pulse"
                          : "group-hover:scale-110 transition-transform"
                      }
                    />
                    {notifications.filter(
                      (n) => !n.readBy.includes(user?.name || ""),
                    ).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface shrink-0 animate-pulse"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifDropdown && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="fixed inset-0 bg-[#000000]/90 z-[998]"
                          onClick={() => setShowNotifDropdown(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 12, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="absolute right-[-12px] sm:right-0 mt-3 w-[calc(100vw-32px)] xs:w-[380px] sm:w-[440px] md:w-[460px] bg-[#0c0f16] border border-border-bright rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-[999] overflow-hidden"
                        >
                        {/* Dropdown Header */}
                        <div className="p-5 pb-4 bg-surface border-b border-border-dim flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-[#b4530930] text-[#f59e0b] shrink-0 border border-[#b4530950]">
                              <Bell size={18} className="fill-[#f59e0b]/10 text-[#f59e0b]" />
                            </div>
                            <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                              Notifications
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                markAllAsRead();
                                playSound?.("click");
                              }}
                              className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-text-dim hover:text-text-primary transition-colors"
                            >
                              MARK ALL READ
                            </button>
                            <span className="text-border-dim font-light">|</span>
                            <button
                              onClick={() => {
                                setShowNotifDropdown(false);
                                setSettingsInitialTab("preferences");
                                setIsSettingsModalOpen(true);
                                playSound?.("click");
                              }}
                              title="Notification Settings"
                              className="p-1.5 text-text-dim hover:text-amber-primary transition-all rounded-md hover:bg-surface-3 hover:rotate-45 duration-300"
                            >
                              <Settings size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Recent List */}
                        <div className="max-h-[350px] overflow-y-auto divide-y divide-border-dim hover:scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-3">
                          {notifications.length === 0 ? (
                            <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-3 bg-surface-2">
                              <div className="w-12 h-12 rounded-full bg-surface border border-border-dim flex items-center justify-center text-text-dim">
                                <Bell size={20} className="text-[#f59e0b] animate-bounce" />
                              </div>
                              <p className="text-sm text-text-primary font-semibold">You are all caught up!</p>
                              <p className="text-xs text-text-dim max-w-[200px]">Any new system transaction logs or real estate approvals will appear here.</p>
                            </div>
                          ) : (
                            <AnimatePresence initial={false}>
                              {[...notifications]
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((n) => {
                                  const isUnread = !n.readBy.includes(user?.name || "");

                                  const formatNotifTimeExact = (dateStr: string) => {
                                  try {
                                    const d = new Date(dateStr);
                                    if (isNaN(d.getTime())) return "";
                                    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                                    const month = months[d.getMonth()];
                                    const day = d.getDate();
                                    let hours = d.getHours();
                                    const minutes = d.getMinutes().toString().padStart(2, "0");
                                    const ampm = hours >= 12 ? "PM" : "AM";
                                    hours = hours % 12;
                                    hours = hours ? hours : 12;
                                    return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
                                  } catch (e) {
                                    return "";
                                  }
                                };

                                return (
                                  <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    key={n.id}
                                    onClick={() => {
                                      if (isUnread) {
                                        markAsRead(n.id);
                                        playSound?.("click");
                                      }
                                    }}
                                    className={`p-5 relative group transition-all duration-200 cursor-pointer border-b border-border-dim flex gap-4 ${
                                      isUnread ? "bg-surface-3/50" : "bg-surface-2"
                                    } hover:bg-surface-3`}
                                  >
                                    <div className="flex gap-3 items-start w-full">
                                      <div className="flex items-start shrink-0 pt-1.5">
                                        <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isUnread ? "bg-amber-primary" : "bg-transparent"}`} />
                                      </div>
                                      <div className="flex-1 min-w-0 pr-6">
                                        <p className={`font-bold text-sm tracking-wide sm:text-[14px] ${isUnread ? "text-text-primary" : "text-text-secondary"}`}>
                                          {n.title}
                                        </p>
                                        <p className="text-text-dim text-xs sm:text-[13px] font-normal leading-relaxed mt-1 break-words">
                                          {n.message}
                                        </p>
                                        <span className="text-text-dim/60 text-[10px] font-mono tracking-wider mt-2.5 block uppercase">
                                          {formatNotifTimeExact(n.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(n.id, e);
                                        playSound?.("click");
                                      }}
                                      className="p-1 text-text-dim hover:text-rose-500 rounded hover:bg-surface-3 transition-colors absolute right-4 top-4 opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"
                                      title="Dismiss Notification"
                                    >
                                      <X size={12} />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          )}
                        </div>

                        {/* Dropdown Footer */}
                        <div className="px-5 py-3.5 bg-surface border-t border-border-dim flex justify-between items-center gap-4">
                          <button
                            onClick={() => {
                              setShowNotifDropdown(false);
                              setSettingsInitialTab("preferences");
                              setIsSettingsModalOpen(true);
                              playSound?.("click");
                            }}
                            className="text-xs font-bold text-text-dim hover:text-text-primary transition-colors flex items-center gap-1.5"
                          >
                            <Settings size={14} className="text-text-dim" />
                            <span>Preferences</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowNotifDropdown(false);
                              setShowNotifications(true);
                              playSound?.("click");
                            }}
                            className="text-xs font-extrabold text-[#f59e0b] hover:text-[#fbbf24] transition-colors flex items-center gap-1.5 animate-pulse"
                          >
                            <span>View All Actions</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showNotifications && createPortal(
                      <>
                        {/* Solid black backdrop with zero opacity bleed for 100% full visibility and readability */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => {
                            setShowNotifications(false);
                            setNotifSearch("");
                          }}
                          className="fixed inset-0 bg-bg z-[120]"
                        />
                        {/* Center Popup Window */}
                        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ type: "spring", damping: 28, stiffness: 240 }}
                            className="pointer-events-auto relative w-full max-w-xl bg-black border-2 border-[#4d3b24]/80 rounded-3xl shadow-[0_0_64px_rgba(0,0,0,1)] flex flex-col overflow-hidden text-left max-h-[85vh] ring-1 ring-white/5"
                          >
                            {/* Pure black Header */}
                            <div className="p-6 border-b border-neutral-850 bg-black flex flex-col gap-4">
                              <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                  <h3 className="font-bold font-serif text-text-primary text-xl flex items-center gap-2.5">
                                    <div className="relative p-1.5 rounded-lg bg-amber-primary/10 text-amber-primary">
                                      <Bell size={20} className="animate-wiggle" />
                                      {notifications.filter((n) => !n.readBy.includes(user?.name || "")).length > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                      )}
                                    </div>
                                    Notification Hub
                                  </h3>
                                  <p className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-mono">
                                    {notifications.filter((n) => !n.readBy.includes(user?.name || "")).length} unread alerts active
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setShowNotifications(false);
                                    setNotifSearch("");
                                  }}
                                  className="p-2 rounded-xl text-text-dim hover:text-text-primary hover:bg-neutral-850 transition-all"
                                >
                                  <X size={18} />
                                </button>
                              </div>

                              {/* Navigation Tab toggles with Simulator */}
                              <div className="flex bg-neutral-900 border border-neutral-850 p-1 rounded-xl">
                                <button
                                  onClick={() => setNotifActiveTab("inbox")}
                                  className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    notifActiveTab === "inbox"
                                      ? "bg-[#271e14] text-amber-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-[#4d3b24]"
                                      : "text-text-dim hover:text-text-primary hover:bg-neutral-850 border border-transparent"
                                  }`}
                                >
                                  <Bell size={14} />
                                  <span>Active Alerts</span>
                                  {notifications.filter((n) => !n.readBy.includes(user?.name || "")).length > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-primary text-black font-black">
                                      {notifications.filter((n) => !n.readBy.includes(user?.name || "")).length}
                                    </span>
                                  )}
                                </button>
                                <button
                                  onClick={() => setNotifActiveTab("simulator")}
                                  className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    notifActiveTab === "simulator"
                                      ? "bg-[#271e14] text-amber-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-[#4d3b24]"
                                      : "text-text-dim hover:text-text-primary hover:bg-neutral-850 border border-transparent"
                                  }`}
                                >
                                  <Activity size={14} />
                                  <span>Simulator Controls</span>
                                </button>
                                <button
                                  onClick={() => setNotifActiveTab("settings")}
                                  className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    notifActiveTab === "settings"
                                      ? "bg-[#271e14] text-amber-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-[#4d3b24]"
                                      : "text-text-dim hover:text-text-primary hover:bg-neutral-850 border border-transparent"
                                  }`}
                                >
                                  <Settings size={14} />
                                  <span>Preferences</span>
                                </button>
                              </div>
                            </div>

                            {/* Inbox Tab content */}
                            {notifActiveTab === "inbox" && (
                              <>
                                {/* Search and Filtering Toolbar with full solid contrast */}
                                <div className="p-5 border-b border-neutral-850 bg-black space-y-4">
                                  {/* Glass search input bar */}
                                  <div className="relative flex items-center bg-neutral-900 border border-neutral-800 focus-within:border-amber-primary/40 focus-within:ring-2 focus-within:ring-amber-primary/10 transition-all rounded-xl px-4 py-2.5">
                                    <Search size={16} className="text-text-dim shrink-0 mr-2" />
                                    <input
                                      type="text"
                                      placeholder="Filter alerts by keyword..."
                                      value={notifSearch}
                                      onChange={(e) => setNotifSearch(e.target.value)}
                                      className="bg-transparent border-none outline-none text-xs text-text-primary w-full font-medium placeholder:text-text-dim/40"
                                    />
                                    {notifSearch && (
                                      <button
                                        onClick={() => setNotifSearch("")}
                                        className="text-text-dim hover:text-text-primary transition-colors"
                                      >
                                        <X size={14} />
                                      </button>
                                    )}
                                  </div>

                                  {/* Filter Category pills */}
                                  <div className="flex justify-between items-center gap-2">
                                    <div className="flex p-0.5 bg-neutral-900 rounded-xl border border-neutral-850 gap-1 grow">
                                      {(["all", "unread", "updates"] as const).map((tab) => {
                                        const count =
                                          tab === "all"
                                            ? notifications.length
                                            : tab === "unread"
                                            ? notifications.filter((n) => !n.readBy.includes(user?.name || "")).length
                                            : notifications.filter(
                                                (n) =>
                                                  n.title.toLowerCase().includes("status") ||
                                                  n.title.toLowerCase().includes("approved") ||
                                                  n.title.toLowerCase().includes("rejected")
                                              ).length;

                                        return (
                                          <button
                                            key={tab}
                                            onClick={() => setNotifFilter(tab)}
                                            className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                              notifFilter === tab
                                                ? "bg-amber-primary text-black font-extrabold shadow-sm"
                                                : "text-text-dim hover:text-text-primary hover:bg-neutral-800"
                                            }`}
                                          >
                                            <span>{tab}</span>
                                            {count > 0 && (
                                              <span
                                                className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold leading-none ${
                                                  notifFilter === tab ? "bg-black/15 text-black" : "bg-neutral-800 text-text-secondary border border-neutral-700"
                                                }`}
                                              >
                                                {count}
                                              </span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    
                                    {notifications.filter((n) => !n.readBy.includes(user?.name || "")).length > 0 && (
                                      <button
                                        onClick={() => {
                                          markAllAsRead();
                                          showToast("All notifications marked as read", "success");
                                        }}
                                        className="shrink-0 px-2.5 py-2 rounded-xl text-[9px] text-amber-primary hover:bg-amber-primary/10 uppercase tracking-widest font-black transition-all border border-amber-primary/20 hover:border-amber-primary/40 block"
                                      >
                                        Mark All Read
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Notifications List grouped by timeframe */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 bg-[#000000]">
                                  {(() => {
                                    let filtered = [...notifications];
                                    
                                    if (notifFilter === "unread") {
                                      filtered = filtered.filter((n) => !n.readBy.includes(user?.name || ""));
                                    } else if (notifFilter === "updates") {
                                      filtered = filtered.filter(
                                        (n) =>
                                          n.title.toLowerCase().includes("status") ||
                                          n.title.toLowerCase().includes("approved") ||
                                          n.title.toLowerCase().includes("rejected")
                                      );
                                    }

                                    if (notifSearch.trim()) {
                                      const q = notifSearch.toLowerCase();
                                      filtered = filtered.filter(
                                        (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
                                      );
                                    }

                                    if (filtered.length === 0) {
                                      return (
                                        <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                                          <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-text-dim/35 shadow-inner relative">
                                            <Bell size={24} className="opacity-40" />
                                            <span className="absolute inset-0 rounded-full border border-amber-primary/10 animate-ping [animation-duration:3s]" />
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-text-primary text-sm font-semibold font-serif">No notifications</p>
                                            <p className="text-text-dim text-[11px] max-w-[240px] mx-auto text-center leading-relaxed">
                                              {notifSearch ? "No matches found. Try refining your keyword phrase." : "You are completely up to date with the system."}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    }

                                    // Timeframe classification
                                    const todayItems: any[] = [];
                                    const yesterdayItems: any[] = [];
                                    const earlierItems: any[] = [];

                                    const todayStart = new Date();
                                    todayStart.setHours(0, 0, 0, 0);
                                    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

                                    filtered.forEach((n) => {
                                      const t = new Date(n.createdAt).getTime();
                                      if (t >= todayStart.getTime()) {
                                        todayItems.push(n);
                                      } else if (t >= yesterdayStart.getTime()) {
                                        yesterdayItems.push(n);
                                      } else {
                                        earlierItems.push(n);
                                      }
                                    });

                                    const timelineGroups = [
                                      { heading: "Today", data: todayItems },
                                      { heading: "Yesterday", data: yesterdayItems },
                                      { heading: "Earlier", data: earlierItems },
                                    ].filter(g => g.data.length > 0);

                                    return (
                                      <div className="space-y-6">
                                        {/* Multiselect Toolbar */}
                                        <div className="flex items-center justify-between px-1 py-1 text-xs">
                                          <div className="flex items-center gap-3">
                                            <button
                                              onClick={() => {
                                                const allIds = filtered.map(x => x.id);
                                                const someUnselected = allIds.some(id => !selectedNotifIds.includes(id));
                                                if (someUnselected) {
                                                  setSelectedNotifIds(allIds);
                                                } else {
                                                  setSelectedNotifIds([]);
                                                }
                                              }}
                                              className="text-[10px] font-bold text-amber-primary/90 hover:text-amber-primary uppercase tracking-wider bg-neutral-900 border border-neutral-850 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                                            >
                                              {filtered.every(x => selectedNotifIds.includes(x.id)) ? "Deselect All" : "Select All Available"}
                                            </button>
                                            {selectedNotifIds.length > 0 && (
                                              <span className="text-[10px] text-text-primary px-2 py-1 bg-amber-primary/10 border border-amber-primary/20 rounded-md font-bold">
                                                {selectedNotifIds.length} Selected
                                              </span>
                                            )}
                                          </div>
                                          
                                          {selectedNotifIds.length > 0 && (
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={bulkMarkSelectedAsRead}
                                                className="text-[9px] uppercase tracking-wider font-extrabold px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-amber-primary hover:bg-[#20170e] hover:border-amber-primary/40 rounded-lg transition-colors flex items-center gap-1"
                                              >
                                                <CheckCircle2 size={11} /> Read
                                              </button>
                                              <button
                                                onClick={bulkDismissSelected}
                                                className="text-[9px] uppercase tracking-wider font-extrabold px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-rose-500 hover:bg-rose-950/20 hover:border-rose-500/30 rounded-lg transition-colors flex items-center gap-1"
                                              >
                                                <Trash2 size={11} /> Dismiss
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {timelineGroups.map((group) => (
                                          <div key={group.heading} className="space-y-3">
                                            {/* Minimal Label */}
                                            <div className="flex items-center gap-3">
                                              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-amber-primary/80 font-bold whitespace-nowrap">
                                                {group.heading}
                                              </span>
                                              <div className="h-px bg-neutral-850 grow" />
                                              <span className="text-[8px] font-mono text-text-dim/60 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-850">
                                                {group.data.length}
                                              </span>
                                            </div>

                                            <div className="space-y-2">
                                              <AnimatePresence mode="popLayout">
                                                {group.data.map((n) => {
                                                  const isUnread = !n.readBy.includes(user?.name || "");
                                                  const isExpanded = expandedNotifIds.includes(n.id);
                                                  const isSelected = selectedNotifIds.includes(n.id);
                                                  
                                                  const isApproved = n.title.toLowerCase().includes("approved") || n.type === "success";
                                                  const isRejected = n.title.toLowerCase().includes("rejected") || n.type === "warning";
                                                  const isCritical = n.title.toLowerCase().includes("security") || n.title.toLowerCase().includes("critical") || n.type === "error";
                                                  const isProjectListing = n.title.toLowerCase().includes("project") || n.title.toLowerCase().includes("resale") || n.title.toLowerCase().includes("tour");

                                                  let IconComponent = Bell;
                                                  let iconColorClass = "text-amber-primary bg-amber-950/40 border border-amber-900/40";
                                                  let cardBorder = isUnread ? "border-l-4 border-l-amber-primary border-y-neutral-850 border-r-neutral-850" : "border-neutral-850";
                                                  let cardBg = isUnread 
                                                    ? "bg-[#18120b]" 
                                                    : "bg-[#0b0b0b] hover:bg-[#121212]";

                                                  if (isApproved) {
                                                    IconComponent = CheckCircle2;
                                                    iconColorClass = "text-emerald-400 bg-emerald-950/40 border border-emerald-900/50";
                                                  } else if (isRejected) {
                                                    IconComponent = AlertTriangle;
                                                    iconColorClass = "text-rose-400 bg-rose-950/40 border border-rose-900/50";
                                                  } else if (isCritical) {
                                                    IconComponent = AlertCircle;
                                                    iconColorClass = "text-red-500 bg-red-950/40 border border-red-900/50";
                                                  } else if (isProjectListing) {
                                                    IconComponent = Home;
                                                    iconColorClass = "text-sky-400 bg-sky-950/40 border border-sky-900/50";
                                                  }

                                                  return (
                                                    <motion.div
                                                      layout
                                                      key={n.id}
                                                      initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                      transition={{ duration: 0.25, ease: "easeOut" }}
                                                      onClick={() => {
                                                        if (isUnread) {
                                                          markAsRead(n.id);
                                                        }
                                                        setExpandedNotifIds(prev => 
                                                          prev.includes(n.id) 
                                                            ? prev.filter(x => x !== n.id) 
                                                            : [...prev, n.id]
                                                        );
                                                      }}
                                                      className={`p-4 rounded-2xl relative transition-all duration-200 cursor-pointer shadow-sm flex gap-4 overflow-hidden group/item border ${cardBorder} ${cardBg} ${isExpanded ? "ring-1 ring-amber-primary/20 bg-[#14120f]" : ""}`}
                                                    >
                                                      {/* Checkbox column */}
                                                      <div 
                                                        className="flex items-center justify-center shrink-0"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setSelectedNotifIds(prev => 
                                                            prev.includes(n.id) 
                                                              ? prev.filter(x => x !== n.id) 
                                                              : [...prev, n.id]
                                                          );
                                                        }}
                                                      >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? "bg-amber-primary border-amber-primary text-black scale-105" : "border-neutral-700 bg-neutral-900 group-hover/item:border-neutral-500"}`}>
                                                          {isSelected && <Check size={11} className="stroke-[3]" />}
                                                        </div>
                                                      </div>

                                                      {/* Icon */}
                                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/item:scale-105 ${iconColorClass}`}>
                                                        <IconComponent size={16} />
                                                      </div>

                                                      {/* Details Column */}
                                                      <div className="flex-1 space-y-1 relative">
                                                        <div className="flex justify-between items-start gap-2">
                                                          <span className={`text-[11.5px] leading-snug tracking-tight transition-colors ${
                                                            isUnread ? "font-bold text-text-primary group-hover/item:text-amber-primary" : "font-semibold text-text-secondary"
                                                          }`}>
                                                            {n.title}
                                                          </span>
                                                          <div className="flex items-center gap-1.5 shrink-0">
                                                            {isUnread && (
                                                              <span className="px-1.5 py-0.5 rounded bg-amber-primary text-black text-[7.5px] font-black uppercase tracking-wider animate-pulse">
                                                                New
                                                              </span>
                                                            )}
                                                            <div className="p-0.5 text-text-dim/30 group-hover/item:text-text-dim/60 transition-colors">
                                                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            </div>
                                                          </div>
                                                        </div>
                                                        <p className={`text-[10px] text-text-dim leading-relaxed font-normal ${isExpanded ? "" : "line-clamp-2"}`}>
                                                          {n.message}
                                                        </p>

                                                        {/* Interactive Accordion detail view */}
                                                        {isExpanded && (
                                                          <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mt-3 pt-3 border-t border-neutral-800 space-y-3"
                                                            onClick={(e) => e.stopPropagation()}
                                                          >
                                                            {/* Detailed mock meta */}
                                                            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-black/60 p-2.5 rounded-lg border border-neutral-800">
                                                              <div className="space-y-0.5">
                                                                <span className="text-text-dim">Tracking ID</span>
                                                                <p className="text-text-primary select-all">{n.id}</p>
                                                              </div>
                                                              <div className="space-y-0.5">
                                                                <span className="text-text-dim">Event Class</span>
                                                                <p className="text-amber-primary uppercase font-bold">{n.type || "SYSTEM"}</p>
                                                              </div>
                                                              <div className="space-y-0.5 col-span-2 pt-1 border-t border-neutral-800/40">
                                                                <span className="text-text-dim">Context Resource Location</span>
                                                                <p className="text-text-secondary">
                                                                  {isApproved ? "Westwood Plaza Commercial Complex" : isProjectListing ? "Active Portfolio Listings Inventory" : "Regulatory Compliance Registry"}
                                                                </p>
                                                              </div>
                                                            </div>

                                                            {/* Workflows based on Category */}
                                                            <div className="flex flex-wrap items-center gap-2">
                                                              {isApproved && (
                                                                <button
                                                                  onClick={() => {
                                                                    setActiveTab("approvals");
                                                                    setShowNotifications(false);
                                                                    showToast("Redirected to approvals hub", "info");
                                                                  }}
                                                                  className="text-[9px] font-bold text-black bg-emerald-400 hover:bg-emerald-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                                                >
                                                                  <CheckCircle2 size={10} /> Review Work Approvals
                                                                </button>
                                                              )}
                                                              {isProjectListing && (
                                                                <button
                                                                  onClick={() => {
                                                                    setActiveTab("dashboard");
                                                                    setShowNotifications(false);
                                                                    showToast("Redirected to property catalog", "info");
                                                                  }}
                                                                  className="text-[9px] font-bold text-black bg-sky-400 hover:bg-sky-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                                                >
                                                                  <Home size={10} /> Show Active Inventory
                                                                </button>
                                                              )}
                                                              {isCritical && (
                                                                <button
                                                                  onClick={() => {
                                                                    setActiveTab("logs");
                                                                    setShowNotifications(false);
                                                                    showToast("Redirected to audit tracking system", "info");
                                                                  }}
                                                                  className="text-[9px] font-bold text-white bg-rose-600 hover:bg-rose-500 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                                                >
                                                                  <Activity size={10} /> Inspect Security Logs
                                                                </button>
                                                              )}
                                                              <button
                                                                onClick={() => {
                                                                  if (isUnread) markAsRead(n.id);
                                                                  setExpandedNotifIds(prev => prev.filter(x => x !== n.id));
                                                                }}
                                                                className="text-[9px] font-semibold text-text-primary bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1.5 rounded-lg transition-colors border border-neutral-700"
                                                              >
                                                                Collapse Details
                                                              </button>
                                                            </div>
                                                          </motion.div>
                                                        )}

                                                        <div className="flex justify-between items-center pt-2 border-t border-neutral-900 flex-wrap gap-2 text-[8px] font-mono text-text-dim/60">
                                                          <span className="uppercase tracking-wider flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {new Date(n.createdAt).toLocaleString(undefined, {
                                                              month: "short",
                                                              day: "numeric",
                                                              hour: "2-digit",
                                                              minute: "2-digit",
                                                            })}
                                                          </span>
                                                          
                                                          <div className="flex items-center gap-2">
                                                            {isUnread && (
                                                              <button
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  markAsRead(n.id);
                                                                }}
                                                                className="text-[8.5px] font-bold text-amber-primary/90 hover:text-amber-primary transition-all flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/item:opacity-100 px-1 py-0.5 rounded hover:bg-amber-primary/5"
                                                              >
                                                                <Check size={11} /> Mark read
                                                              </button>
                                                            )}
                                                            <button
                                                              onClick={(e) => deleteNotification(n.id, e)}
                                                              className="p-1 px-2 rounded-lg text-[8.5px] text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 font-bold transition-all flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/item:opacity-100"
                                                              aria-label="Dismiss notification"
                                                            >
                                                              <Trash2 size={10} />
                                                              <span>Dismiss</span>
                                                            </button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </motion.div>
                                                  );
                                                })}
                                              </AnimatePresence>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </>
                            )}

                            {/* Simulator Tab Content */}
                            {notifActiveTab === "simulator" && (
                              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-black">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-serif font-bold text-amber-primary">
                                    Interactive Alert Simulation Panel
                                  </h4>
                                  <p className="text-[11px] text-text-dim leading-relaxed">
                                    Fire simulated event categories to verify alert routing, custom badge icons, sound triggers, and localStorage persistence states instantly.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Trigger 1 */}
                                  <button
                                    onClick={() => {
                                      const mockNotif = {
                                        id: "test-approved-" + Date.now(),
                                        title: "Deal Fully Approved! 🎉",
                                        message: "The double premium lease validation for 'Westwood Plaza Suite B' has been finalized by compliance managers.",
                                        type: "success",
                                        createdAt: new Date().toISOString(),
                                        readBy: []
                                      };
                                      setNotifications((prev) => [mockNotif, ...prev]);
                                      playSound("success");
                                      showToast("Deal Approval Alert fired!", "success");
                                    }}
                                    className="p-4 rounded-xl border border-emerald-900/50 bg-[#061c10] hover:bg-[#0c2a1b] text-left space-y-2 transition-all active:scale-[0.98] group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                                        <CheckCircle2 size={14} />
                                      </div>
                                      <span className="text-[11px] font-black uppercase text-emerald-400 font-mono tracking-wider">Success Deal</span>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-normal">
                                      Simulates lease/draft final authorization success alerts.
                                    </p>
                                  </button>

                                  {/* Trigger 2 */}
                                  <button
                                    onClick={() => {
                                      const mockNotif = {
                                        id: "test-price-" + Date.now(),
                                        title: "Price Shift Index Alert 📉",
                                        message: "Estimated inventory value index for 'Skyline Residence Penthouse' fell -12.4% below quarterly index projections.",
                                        type: "warning",
                                        createdAt: new Date().toISOString(),
                                        readBy: []
                                      };
                                      setNotifications((prev) => [mockNotif, ...prev]);
                                      playSound("notify");
                                      showToast("Price shift warning fired!", "warning");
                                    }}
                                    className="p-4 rounded-xl border border-yellow-900/40 bg-[#1e1604] hover:bg-[#2b1f07] text-left space-y-2 transition-all active:scale-[0.98] group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-500 group-hover:scale-110 transition-transform">
                                        <AlertTriangle size={14} />
                                      </div>
                                      <span className="text-[11px] font-black uppercase text-yellow-500 font-mono tracking-wider">Index Dropped</span>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-normal">
                                      Simulates financial market index warnings or price drops.
                                    </p>
                                  </button>

                                  {/* Trigger 3 */}
                                  <button
                                    onClick={() => {
                                      const mockNotif = {
                                        id: "test-rejected-" + Date.now(),
                                        title: "Description Drafting Rejected ❌",
                                        message: "Agent description draft for 'Highland Valley Compound' was rejected: 'Violates platform spacing regulations.'",
                                        type: "warning",
                                        createdAt: new Date().toISOString(),
                                        readBy: []
                                      };
                                      setNotifications((prev) => [mockNotif, ...prev]);
                                      playSound("error");
                                      showToast("Regulation Draft Rejected!", "error");
                                    }}
                                    className="p-4 rounded-xl border border-rose-900/50 bg-[#250d11] hover:bg-[#341217] text-left space-y-2 transition-all active:scale-[0.98] group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
                                        <AlertCircle size={14} />
                                      </div>
                                      <span className="text-[11px] font-black uppercase text-rose-400 font-mono tracking-wider">Draft Rejection</span>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-normal">
                                      Simulates regulatory or compliance descriptions failures.
                                    </p>
                                  </button>

                                  {/* Trigger 4 */}
                                  <button
                                    onClick={() => {
                                      const mockNotif = {
                                        id: "test-auth-" + Date.now(),
                                        title: "SECURITY: Super-Admin Access Attempt 🔒",
                                        message: "Super-Admin level credentials requested from unregistered proxy server subnet IP address in Amsterdam, Netherlands.",
                                        type: "error",
                                        createdAt: new Date().toISOString(),
                                        readBy: []
                                      };
                                      setNotifications((prev) => [mockNotif, ...prev]);
                                      playSound("error");
                                      showToast("Security alert triggered!", "error");
                                    }}
                                    className="p-4 rounded-xl border border-red-900 bg-red-950/20 hover:bg-red-950/45 text-left space-y-2 transition-all active:scale-[0.98] group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg bg-red-500/20 text-red-500 group-hover:scale-110 transition-transform animate-pulse">
                                        <ShieldCheck size={14} />
                                      </div>
                                      <span className="text-[11px] font-black uppercase text-red-500 font-mono tracking-wider">Critical Guard</span>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-normal">
                                      Critical security system triggers. Plays a deeper low bass alarm.
                                    </p>
                                  </button>

                                  {/* Trigger 5 */}
                                  <button
                                    onClick={() => {
                                      const mockNotif = {
                                        id: "test-sync-" + Date.now(),
                                        title: "Sync Node Aggregator Online 🔄",
                                        message: "The multi-region realestate SQL pipeline aggregator node achieved sync consolidation on 48 databases concurrently.",
                                        type: "info",
                                        createdAt: new Date().toISOString(),
                                        readBy: []
                                      };
                                      setNotifications((prev) => [mockNotif, ...prev]);
                                      playSound("click");
                                      showToast("Sync Pipeline online!", "info");
                                    }}
                                    className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-left space-y-2 transition-all active:scale-[0.98] group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg bg-neutral-700 text-text-primary group-hover:scale-110 transition-transform">
                                        <Activity size={14} />
                                      </div>
                                      <span className="text-[11px] font-black uppercase text-text-primary font-mono tracking-wider">System Node</span>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-normal">
                                      Simulates quiet backend microservices status signals.
                                    </p>
                                  </button>

                                  {/* Reset Button */}
                                  <button
                                    onClick={() => {
                                      setNotifications([]);
                                      setSelectedNotifIds([]);
                                      playSound("click");
                                      showToast("Cleared simulation buffer", "info");
                                    }}
                                    className="p-4 rounded-xl border border-dashed border-neutral-800 bg-black hover:bg-neutral-905 hover:border-neutral-700 text-left space-y-2 transition-all active:scale-[0.98] group"
                                  >
                                    <div className="flex items-center gap-2 text-amber-primary">
                                      <div className="p-1.5 rounded-lg bg-amber-primary/10 group-hover:rotate-45 transition-transform">
                                        <Trash2 size={14} />
                                      </div>
                                      <span className="text-[11px] font-black uppercase font-mono tracking-wider">Reset Buffer</span>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-normal">
                                      Instantly disposes of all notifications in the Active Alerts cache.
                                    </p>
                                  </button>
                                </div>

                                <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-center">
                                  <p className="text-[10px] text-text-dim leading-relaxed">
                                    All simulated notifications are fully responsive and persisted directly beneath current browser profile session <strong>realestate_notifs_{user?.name || "global"}</strong>.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Settings / Preferences Tab content */}
                            {notifActiveTab === "settings" && (
                              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-black">
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-mono uppercase tracking-[0.22em] text-text-dim/70 font-semibold flex items-center gap-2">
                                    <ShieldCheck size={11} className="text-amber-primary" /> Notification Delivery
                                  </h4>
                                  
                                  {/* Toggles */}
                                  <div className="bg-[#0b0b0b] border border-neutral-850 rounded-2xl p-4 space-y-4">
                                    {/* Toggle 1: SSE Live Streaming Alerts */}
                                    <div className="flex flex-col gap-4">
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                          <p className="text-xs font-semibold text-text-primary">Enable Alerts Delivery</p>
                                          <p className="text-[10px] text-text-dim max-w-[340px] leading-relaxed">
                                            Allow notifications and system broadcasts to arrive in real-time.
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => {
                                            const prev = notificationsEnabled;
                                            setNotificationsEnabled(!prev);
                                            playSound("click");
                                            showToast(`Notifications ${!prev ? "enabled" : "disabled"}`, "info");
                                          }}
                                          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${notificationsEnabled ? "bg-amber-primary" : "bg-neutral-800 border border-white/5"}`}
                                        >
                                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-slate-950 transition-all shadow-sm ${notificationsEnabled ? "left-6" : "left-1"}`} />
                                        </button>
                                      </div>

                                      {/* Chims Sub Settings */}
                                      <div className="pl-4 border-l-2 border-neutral-850 space-y-4">
                                        <div className="flex items-center justify-between pointer-events-auto">
                                          <div className="space-y-0.5">
                                            <p className="text-[11px] font-medium text-text-secondary">Critical Alerts Chime</p>
                                            <p className="text-[9px] text-text-dim">Chime for errors and priority warnings.</p>
                                          </div>
                                          <button
                                            onClick={() => {
                                              setCriticalChimeEnabled(!criticalChimeEnabled);
                                              playSound("click");
                                            }}
                                            className={`w-8 h-4.5 rounded-full transition-colors relative shrink-0 ${criticalChimeEnabled ? "bg-amber-primary" : "bg-neutral-800 border border-white/5"}`}
                                          >
                                            <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-slate-950 transition-all shadow-sm ${criticalChimeEnabled ? "left-[18px]" : "left-0.5"}`} />
                                          </button>
                                        </div>
                                        <div className="flex items-center justify-between pointer-events-auto">
                                          <div className="space-y-0.5">
                                            <p className="text-[11px] font-medium text-text-secondary">General Updates Chime</p>
                                            <p className="text-[9px] text-text-dim">Chime for successes and standard info.</p>
                                          </div>
                                          <button
                                            onClick={() => {
                                              setUpdatesChimeEnabled(!updatesChimeEnabled);
                                              playSound("click");
                                            }}
                                            className={`w-8 h-4.5 rounded-full transition-colors relative shrink-0 ${updatesChimeEnabled ? "bg-amber-primary" : "bg-neutral-800 border border-white/5"}`}
                                          >
                                            <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-slate-950 transition-all shadow-sm ${updatesChimeEnabled ? "left-[18px]" : "left-0.5"}`} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="h-px bg-neutral-850" />

                                    {/* Toggle 2: High Density Layout (Compact Mode) */}
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-primary">High Density Interface</p>
                                        <p className="text-[10px] text-text-dim max-w-[340px] leading-relaxed">
                                          Compact padding grids on listing projects, reports and tabular inventory elements.
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          const prev = compactMode;
                                          setCompactMode(!prev);
                                          playSound("click");
                                          showToast(`Compact mode ${!prev ? "enabled" : "disabled"}`, "info");
                                        }}
                                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${compactMode ? "bg-amber-primary" : "bg-neutral-800 border border-white/5"}`}
                                      >
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-slate-950 transition-all shadow-sm ${compactMode ? "left-6" : "left-1"}`} />
                                      </button>
                                    </div>

                                    <div className="h-px bg-neutral-850" />

                                    {/* Toggle 3: System Audio feedback */}
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold text-[#ffffff]">Interactive Sound FX</p>
                                        <p className="text-[10px] text-text-dim max-w-[340px] leading-relaxed">
                                          Synthesize alert audio chimes on simulator triggers, read status updates and deletions.
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          const prev = soundEffects;
                                          setSoundEffects(!prev);
                                          playSound("click");
                                          showToast(`Synthesizer audio ${!prev ? "activated" : "deactivated"}`, "info");
                                        }}
                                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${soundEffects ? "bg-amber-primary" : "bg-neutral-800 border border-white/5"}`}
                                      >
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-slate-950 transition-all shadow-sm ${soundEffects ? "left-6" : "left-1"}`} />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Active Session / Listener Connections diagnostics */}
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-mono uppercase tracking-[0.22em] text-text-dim/70 font-semibold flex items-center gap-2">
                                    <Activity size={11} className="text-amber-primary" /> Feed Diagnostics
                                  </h4>
                                  <div className="bg-[#0b0b0b] border border-neutral-850 rounded-2xl p-4 space-y-3 font-mono text-[9px] text-text-dim leading-normal">
                                    <div className="flex justify-between items-center">
                                      <span>Session User Role</span>
                                      <span className="text-text-primary font-bold uppercase">{user?.role || "Visitor"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span>Active Client Buffer</span>
                                      <span className="text-text-primary">{notifications.length} notifications</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span>Live Server Pipeline</span>
                                      <span className="flex items-center gap-1.5 text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        CONNECTED
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span>Local Storage Key</span>
                                      <span className="text-amber-primary">realestate_notifs_{user?.name || "global"}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-center pt-2">
                                  <p className="text-[9px] text-text-dim/55">
                                    Settings are synchronized with your browser's persistent cache.
                                  </p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </div>
                      </>,
                      document.body
                    )}
                  </AnimatePresence>
                </div>
                {activeTab === "profile" && selectedProfileUser && (
                  <button
                    onClick={() => {
                      setActiveTab("users");
                      setSelectedProfileUser(null);
                    }}
                    className="text-xs font-bold text-amber-primary hover:underline flex items-center gap-1"
                  >
                    <ChevronRight size={14} className="rotate-180" /> Back to
                    Users
                  </button>
                )}
                <div className="relative group">
                  <div
                    className={`flex items-center gap-2 bg-surface-2 border transition-all duration-200 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 ${isSearchFocused ? "border-amber-primary ring-4 ring-amber-primary/10 w-52 sm:w-96" : "border-border-bright w-32 sm:w-72"}`}
                  >
                    <Search
                      size={15}
                      className={`${isSearchFocused ? "text-amber-primary" : "text-text-dim"} shrink-0`}
                    />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() =>
                        setTimeout(() => setIsSearchFocused(false), 200)
                      }
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-text-primary w-full font-medium placeholder:text-text-dim/50"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        id="btn-dashboard-search-clear-all"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleResetProjectFiltersAndSearch();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetProjectFiltersAndSearch();
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-primary/15 hover:bg-amber-primary text-amber-primary hover:text-bg border border-amber-primary/30 hover:border-amber-primary transition-all text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 cursor-pointer shadow-xs active:scale-95 group/clear"
                        title="Clear search text and reset all project filters"
                      >
                        <span>Clear All</span>
                        <X size={11} className="shrink-0 group-hover/clear:rotate-90 transition-transform duration-150" />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {isSearchFocused && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-3 right-0 sm:left-0 sm:right-auto bg-surface border border-border-dim rounded-2xl shadow-2xl z-50 max-h-[75vh] sm:max-h-[480px] overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4 w-[calc(100vw-2rem)] sm:w-[500px] max-w-[500px]"
                      >
                        {!searchQuery ? (
                          <div className="space-y-4 p-1">
                            <div className="flex items-center justify-between border-b border-border-dim/20 pb-2">
                              <p className="text-[10px] text-text-dim uppercase font-black tracking-widest font-mono">
                                Quick Navigation / Actions
                              </p>
                              <span className="text-[9px] text-amber-primary font-bold font-mono">
                                Ready
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5 text-xs">
                              <button
                                type="button"
                                onMouseDown={() => {
                                  setSearchQuery("");
                                }}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-2 text-text-secondary hover:text-amber-primary transition-all text-left font-sans border border-transparent hover:border-amber-primary/10"
                              >
                                <div className="p-2.5 bg-amber-primary/10 rounded-xl text-amber-primary flex-shrink-0">
                                  <Search size={15} />
                                </div>
                                <div>
                                  <span className="font-extrabold text-text-primary block text-sm">
                                    Interactive Live Search
                                  </span>
                                  <span className="text-[11px] text-text-dim mt-0.5 block">
                                    Search listings, builders, teams, and
                                    properties database
                                  </span>
                                </div>
                              </button>

                              {activeTab === "projects" && (
                                <>
                                  <div className="border-t border-border-dim/20 my-2" />
                                  <div className="flex items-center justify-between pb-1.5 px-1">
                                    <p className="text-[10px] text-text-dim uppercase font-black tracking-widest font-mono">
                                      Popular Builders
                                    </p>
                                    <span className="text-[9px] text-text-dim/60 font-mono">
                                      Select to filter
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 p-1">
                                    {Array.from(
                                      new Set(
                                        projects
                                          .map((p) => p.builderName)
                                          .filter(Boolean),
                                      ),
                                    )
                                      .slice(0, 10)
                                      .map((builderName) => (
                                        <button
                                          key={builderName}
                                          type="button"
                                          onMouseDown={() => {
                                            setBuilderFilter(builderName);
                                            playSound("click");
                                          }}
                                          className="px-3 py-2.5 bg-surface-2 border border-border-bright text-text-secondary text-[10px] rounded-xl hover:text-amber-primary hover:border-amber-primary transition-all font-bold uppercase tracking-wider text-left truncate flex items-center gap-2"
                                        >
                                          <Building
                                            size={12}
                                            className="text-amber-primary/60"
                                          />
                                          <span className="truncate">
                                            {builderName}
                                          </span>
                                        </button>
                                      ))}
                                  </div>
                                </>
                              )}

                              {activeTab === "resale" && (
                                <>
                                  <div className="border-t border-border-dim/20 my-2" />
                                  <div className="flex items-center justify-between pb-1.5 px-1">
                                    <p className="text-[10px] text-text-dim uppercase font-black tracking-widest font-mono font-sans">
                                      Quick Societies
                                    </p>
                                    <span className="text-[9px] text-text-dim/60 font-mono">
                                      Filter by society
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 p-1">
                                    {Array.from(
                                      new Set(
                                        (Array.isArray(resaleProperties)
                                          ? resaleProperties
                                          : []
                                        )
                                          .map((p) => p.societyName)
                                          .filter(Boolean),
                                      ),
                                    )
                                      .slice(0, 10)
                                      .map((society) => (
                                        <button
                                          key={society}
                                          type="button"
                                          onMouseDown={() => {
                                            setSearchQuery(society);
                                            playSound("click");
                                          }}
                                          className="px-3 py-2.5 bg-surface-2 border border-border-bright text-text-secondary text-[11px] rounded-xl hover:text-amber-primary hover:border-amber-primary transition-all font-bold text-left truncate flex items-center gap-2"
                                        >
                                          <Home
                                            size={12}
                                            className="text-amber-primary/60"
                                          />
                                          <span className="truncate">
                                            {society}
                                          </span>
                                        </button>
                                      ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 p-1">
                            {/* Project matches */}
                            {(activeTab === "projects" ||
                              activeTab === "dashboard") &&
                              (() => {
                                const matches = projects.filter(
                                  (p) =>
                                    p.title
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()) ||
                                    p.location
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()) ||
                                    (p.builderName &&
                                      p.builderName
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase())),
                                );
                                const displayedMatches = matches.slice(0, 15);
                                return (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between border-b border-border-dim/20 pb-1.5 px-1">
                                      <span className="text-[10px] text-text-dim uppercase font-black tracking-widest font-mono">
                                        Matched Projects ({matches.length})
                                      </span>
                                      <span className="text-[8px] text-text-dim bg-surface-2 px-1.5 py-0.5 rounded font-black font-mono">
                                        DISPLAYING {displayedMatches.length}
                                      </span>
                                    </div>
                                    {displayedMatches.length > 0 ? (
                                      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                        {displayedMatches.map((p) => (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onMouseDown={() => {
                                              setSelectedProject(p);
                                              setSearchQuery(p.title);
                                            }}
                                            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-amber-primary/5 hover:text-amber-primary transition-all text-left text-xs text-text-secondary font-medium border border-transparent hover:border-amber-primary/10"
                                          >
                                            <div className="flex items-center gap-3 truncate">
                                              <div className="p-2 bg-amber-primary/10 rounded-lg text-amber-primary flex-shrink-0">
                                                <Building2 size={15} />
                                              </div>
                                              <div className="truncate">
                                                <span className="font-bold text-text-primary block truncate text-sm">
                                                  <HighlightText
                                                    text={p.title}
                                                    highlight={searchQuery}
                                                  />
                                                </span>
                                                <span className="text-[11px] text-text-dim block truncate mt-0.5">
                                                  <MapPin
                                                    size={10}
                                                    className="inline mr-1 text-text-dim/70 align-middle"
                                                  />
                                                  <HighlightText
                                                    text={p.location}
                                                    highlight={searchQuery}
                                                  />
                                                  {p.builderName && (
                                                    <>
                                                      <span className="mx-1.5 text-text-dim/40">
                                                        •
                                                      </span>
                                                      <Building
                                                        size={10}
                                                        className="inline mr-1 text-text-dim/70 align-middle"
                                                      />
                                                      <HighlightText
                                                        text={p.builderName}
                                                        highlight={searchQuery}
                                                      />
                                                    </>
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-surface-2 border border-border-bright text-text-dim rounded-md">
                                                Project
                                              </span>
                                              <ChevronRight
                                                size={14}
                                                className="text-text-dim/60"
                                              />
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-text-dim italic px-3 py-1">
                                        No matching projects found
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}

                            {/* Resale matches */}
                            {activeTab === "resale" &&
                              (() => {
                                const items = Array.isArray(resaleProperties)
                                  ? resaleProperties
                                  : [];
                                const matches = items.filter(
                                  (r) =>
                                    r.societyName
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()) ||
                                    r.location
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()) ||
                                    (r.builderName &&
                                      r.builderName
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase())),
                                );
                                const displayedMatches = matches.slice(0, 15);
                                return (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between border-b border-border-dim/20 pb-1.5 px-1">
                                      <span className="text-[10px] text-text-dim uppercase font-black tracking-widest font-mono">
                                        Matched Listings ({matches.length})
                                      </span>
                                      <span className="text-[8px] text-text-dim bg-surface-2 px-1.5 py-0.5 rounded font-black font-mono">
                                        DISPLAYING {displayedMatches.length}
                                      </span>
                                    </div>
                                    {displayedMatches.length > 0 ? (
                                      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                        {displayedMatches.map((r) => (
                                          <button
                                            key={r.id}
                                            type="button"
                                            onMouseDown={() => {
                                              setSelectedResale(r);
                                              setSearchQuery(r.societyName);
                                            }}
                                            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-amber-primary/5 hover:text-amber-primary transition-all text-left text-xs text-text-secondary font-medium border border-transparent hover:border-amber-primary/10"
                                          >
                                            <div className="flex items-center gap-3 truncate">
                                              <div className="p-2 bg-amber-primary/10 rounded-lg text-amber-primary flex-shrink-0">
                                                <Home size={15} />
                                              </div>
                                              <div className="truncate">
                                                <span className="font-bold text-text-primary block truncate text-sm">
                                                  <HighlightText
                                                    text={r.societyName}
                                                    highlight={searchQuery}
                                                  />
                                                </span>
                                                <span className="text-[11px] text-text-dim block truncate mt-0.5">
                                                  <MapPin
                                                    size={10}
                                                    className="inline mr-1 text-text-dim/70 align-middle"
                                                  />
                                                  <HighlightText
                                                    text={r.location}
                                                    highlight={searchQuery}
                                                  />
                                                  <span className="mx-1.5 text-text-dim/40">
                                                    •
                                                  </span>
                                                  <span className="text-[10px] font-extrabold text-amber-secondary">
                                                    {r.bhk} BHK
                                                  </span>
                                                </span>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-surface-2 border border-border-bright text-text-dim rounded-md">
                                                Listing
                                              </span>
                                              <ChevronRight
                                                size={14}
                                                className="text-text-dim/60"
                                              />
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-text-dim italic px-3 py-1">
                                        No matching listings found
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}

                            {/* Users matches */}
                            {activeTab === "users" &&
                              (() => {
                                const matches = users.filter(
                                  (u) =>
                                    u.name
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()) ||
                                    u.email
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()),
                                );
                                const displayedMatches = matches.slice(0, 15);
                                return (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between border-b border-border-dim/20 pb-1.5 px-1">
                                      <span className="text-[10px] text-text-dim uppercase font-black tracking-widest font-mono">
                                        Matched Team Members ({matches.length})
                                      </span>
                                      <span className="text-[8px] text-text-dim bg-surface-2 px-1.5 py-0.5 rounded font-black font-mono">
                                        DISPLAYING {displayedMatches.length}
                                      </span>
                                    </div>
                                    {displayedMatches.length > 0 ? (
                                      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                        {displayedMatches.map((u) => (
                                          <button
                                            key={u.id}
                                            type="button"
                                            onMouseDown={() => {
                                              setSelectedProfileUser(u);
                                              setActiveTab("profile");
                                              setSearchQuery("");
                                            }}
                                            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-amber-primary/5 hover:text-amber-primary transition-all text-left text-xs text-text-secondary font-medium border border-transparent hover:border-amber-primary/10"
                                          >
                                            <div className="flex items-center gap-3 truncate">
                                              <div className="p-2 bg-amber-primary/10 rounded-lg text-amber-primary flex-shrink-0">
                                                <User size={15} />
                                              </div>
                                              <div className="truncate">
                                                <span className="font-bold text-text-primary block truncate text-sm">
                                                  <HighlightText
                                                    text={u.name}
                                                    highlight={searchQuery}
                                                  />
                                                </span>
                                                <span className="text-[11px] text-text-dim block truncate font-mono mt-0.5">
                                                  <HighlightText
                                                    text={u.email}
                                                    highlight={searchQuery}
                                                  />
                                                </span>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-surface-2 border border-border-bright text-text-dim rounded-md">
                                                Team
                                              </span>
                                              <ChevronRight
                                                size={14}
                                                className="text-text-dim/60"
                                              />
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-text-dim italic px-3 py-1">
                                        No matching team members found
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}

                            {/* Fallback Empty State for tabs not matches or no matches whatsoever */}
                            {(() => {
                              const pm =
                                activeTab === "projects" ||
                                activeTab === "dashboard"
                                  ? projects.filter(
                                      (p) =>
                                        p.title
                                          .toLowerCase()
                                          .includes(
                                            searchQuery.toLowerCase(),
                                          ) ||
                                        p.location
                                          .toLowerCase()
                                          .includes(searchQuery.toLowerCase()),
                                    )
                                  : [];
                              const rm =
                                activeTab === "resale"
                                  ? (Array.isArray(resaleProperties)
                                      ? resaleProperties
                                      : []
                                    ).filter(
                                      (r) =>
                                        r.societyName
                                          .toLowerCase()
                                          .includes(
                                            searchQuery.toLowerCase(),
                                          ) ||
                                        r.location
                                          .toLowerCase()
                                          .includes(searchQuery.toLowerCase()),
                                    )
                                  : [];
                              const um =
                                activeTab === "users"
                                  ? users.filter(
                                      (u) =>
                                        u.name
                                          .toLowerCase()
                                          .includes(
                                            searchQuery.toLowerCase(),
                                          ) ||
                                        u.email
                                          .toLowerCase()
                                          .includes(searchQuery.toLowerCase()),
                                    )
                                  : [];
                              const totalMatchCount =
                                pm.length + rm.length + um.length;
                              if (totalMatchCount === 0) {
                                return (
                                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                    <div className="p-3.5 bg-red-500/10 rounded-full text-red-400 mb-3.5">
                                      <Search size={24} />
                                    </div>
                                    <p className="text-sm font-black text-text-primary">
                                      No Matching Results
                                    </p>
                                    <p className="text-xs text-text-dim mt-1 max-w-[320px]">
                                      We couldn't find any items matching "
                                      {searchQuery}" under the current
                                      configuration and tab.
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {activeTab === "users" &&
                hasPermission(user, "MANAGE_USERS") ? (
                  <button
                    onClick={() => {
                      setUserError("");
                      setIsUserModalOpen(true);
                    }}
                    className="bg-amber-primary text-bg px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-amber-secondary transition-all"
                  >
                    <UserPlus size={16} />{" "}
                    <span className="hidden sm:inline">Add User</span>
                  </button>
                ) : activeTab === "resale" ? (
                  <button
                    onClick={() => {
                      setEditingResale(null);
                      setEntryType("resale");
                      setIsModalOpen(true);
                    }}
                    className="bg-amber-primary text-bg px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-amber-secondary transition-all"
                  >
                    <Plus size={16} />{" "}
                    <span className="hidden sm:inline">Add Listing</span>
                  </button>
                ) : activeTab === "dashboard" || activeTab === "projects" ? (
                  <button
                    onClick={() => {
                      setEditingProject(null);
                      setIsModalOpen(true);
                    }}
                    className="bg-amber-primary text-bg px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-amber-secondary transition-all"
                  >
                    <Plus size={16} />{" "}
                    <span className="hidden sm:inline">Project</span>
                  </button>
                ) : null}
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors border border-red-500/20 hover:border-red-500/50 rounded-lg uppercase tracking-widest"
                >
                  <LogOut size={14} />{" "}
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
                <button
                  onClick={() => {
                    setSettingsInitialTab("account");
                    setIsSettingsModalOpen(true);
                  }}
                  className="hidden md:flex items-center gap-2 p-1.5 pr-3 text-text-dim hover:text-amber-primary transition-colors border border-border-dim hover:border-amber-primary/30 rounded-lg group"
                  title="Settings"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-primary/20 flex items-center justify-center text-[10px] font-bold text-amber-primary overflow-hidden border border-amber-primary/10 group-hover:border-amber-primary/30 transition-all">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user?.name?.charAt(0) || "U"
                    )}
                  </div>
                  <Settings size={14} />
                </button>
              </div>
            </header>

            <div className="flex-1 min-w-0 flex overflow-hidden bg-bg">
              <div className="flex-1 min-w-0 overflow-y-auto p-4 pb-24 md:pb-8 sm:p-8 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {activeTab === "database" && (
                    <DatabaseExplorer showToast={showToast} request={request} />
                  )}
                  {user?.role === "admin" && activeTab === "admin_panel" && (
                    <motion.div
                      key="admin_panel"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="space-y-8 pb-12 w-full max-w-none"
                    >
                      {/* Admin Hero Header */}
                      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-2 via-surface to-surface-2/60 border border-border-bright p-6 sm:p-8 shadow-2xl backdrop-blur-md">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-amber-primary/15 flex items-center justify-center text-amber-primary border border-amber-primary/30 shadow-lg shadow-amber-primary/10">
                              <ShieldCheck size={28} />
                            </div>
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-primary/10 border border-amber-primary/20 text-[10px] font-mono font-bold text-amber-primary uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Super Admin Privileges Active</span>
                              </div>
                              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary tracking-tight">
                                Super Admin Control Center
                              </h1>
                              <p className="text-xs text-text-dim max-w-xl leading-relaxed">
                                Global system administration, role governance, database tools, and security auditing.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setActiveTab("logs")}
                              className="px-4 py-2.5 bg-surface-2/80 hover:bg-surface-2 border border-border-bright hover:border-amber-primary/40 rounded-xl text-xs font-bold text-text-primary transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                            >
                              <Activity size={14} className="text-amber-primary" />
                              <span>Live Logs</span>
                            </button>
                            <button
                              onClick={() => setActiveTab("users")}
                              className="px-4 py-2.5 bg-amber-primary hover:bg-amber-secondary text-bg font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-primary/20"
                            >
                              <UserPlus size={14} />
                              <span>Manage Team</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Admin KPIs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <KpiCard
                          label="Total Users"
                          value={users.length}
                          icon={UsersIcon}
                          color="amber"
                          sub="Platform-wide active accounts"
                        />
                        <KpiCard
                          label="Security Logs"
                          value={logs.length}
                          icon={Activity}
                          color="red"
                          sub={`${logs.length > 100 ? "Active auditing" : "System healthy"}`}
                        />
                        <KpiCard
                          label="Approval Queue"
                          value={approvals.length}
                          icon={Clock}
                          color="purple"
                          sub="Pending supervisor actions"
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DashboardSection
                          title="Administrative Quick Links"
                          icon={ShieldCheck}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <button
                              onClick={() => setActiveTab("users")}
                              className="p-4 rounded-2xl border border-border-bright bg-surface-2/50 hover:bg-surface-2 hover:border-amber-primary/40 transition-all text-left group cursor-pointer relative overflow-hidden shadow-sm"
                            >
                              <div className="w-10 h-10 rounded-xl bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center text-amber-primary mb-3 group-hover:scale-110 transition-transform">
                                <UsersIcon size={20} />
                              </div>
                              <h3 className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors">
                                Manage Users
                              </h3>
                              <p className="text-[10px] text-text-dim mt-0.5 leading-relaxed">
                                Create, edit, and assign roles to system members.
                              </p>
                              <div className="mt-3 flex items-center gap-1 text-[10px] font-mono font-bold text-amber-primary uppercase tracking-wider">
                                <span>Access</span>
                                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </div>
                            </button>

                            <button
                              onClick={() => setActiveTab("logs")}
                              className="p-4 rounded-2xl border border-border-bright bg-surface-2/50 hover:bg-surface-2 hover:border-amber-primary/40 transition-all text-left group cursor-pointer relative overflow-hidden shadow-sm"
                            >
                              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 group-hover:scale-110 transition-transform">
                                <Activity size={20} />
                              </div>
                              <h3 className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors">
                                Audit Logs
                              </h3>
                              <p className="text-[10px] text-text-dim mt-0.5 leading-relaxed">
                                Monitor all system actions and state transitions.
                              </p>
                              <div className="mt-3 flex items-center gap-1 text-[10px] font-mono font-bold text-amber-primary uppercase tracking-wider">
                                <span>Access</span>
                                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </div>
                            </button>

                            <button
                              onClick={() => setActiveTab("database")}
                              className="p-4 rounded-2xl border border-border-bright bg-surface-2/50 hover:bg-surface-2 hover:border-amber-primary/40 transition-all text-left group cursor-pointer relative overflow-hidden shadow-sm"
                            >
                              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                                <DatabaseIcon size={20} />
                              </div>
                              <h3 className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors">
                                Database Tool
                              </h3>
                              <p className="text-[10px] text-text-dim mt-0.5 leading-relaxed">
                                Direct access to raw system data tables & query tool.
                              </p>
                              <div className="mt-3 flex items-center gap-1 text-[10px] font-mono font-bold text-amber-primary uppercase tracking-wider">
                                <span>Access</span>
                                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </div>
                            </button>

                            <button
                              onClick={() => setActiveTab("approvals")}
                              className="p-4 rounded-2xl border border-border-bright bg-surface-2/50 hover:bg-surface-2 hover:border-amber-primary/40 transition-all text-left group cursor-pointer relative overflow-hidden shadow-sm"
                            >
                              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3 group-hover:scale-110 transition-transform">
                                <Clock size={20} />
                              </div>
                              <h3 className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors">
                                Approvals Queue
                              </h3>
                              <p className="text-[10px] text-text-dim mt-0.5 leading-relaxed">
                                Review and authorize sensitive data requests.
                              </p>
                              <div className="mt-3 flex items-center gap-1 text-[10px] font-mono font-bold text-amber-primary uppercase tracking-wider">
                                <span>Access</span>
                                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </div>
                            </button>
                          </div>
                        </DashboardSection>

                        <DashboardSection
                          title="Recent System Activity"
                          icon={Activity}
                          action={
                            <button
                              onClick={() => setActiveTab("logs")}
                              className="text-xs text-amber-primary hover:underline uppercase tracking-wider font-mono font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>View All</span>
                              <ArrowUpRight size={13} />
                            </button>
                          }
                        >
                          <div className="space-y-2">
                            {logs.slice(0, 5).map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-surface-2/40 border border-border-dim/40 hover:border-amber-primary/30 transition-all text-xs"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-2 h-2 rounded-full bg-amber-primary shrink-0" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                                      {log.action?.replace(/_/g, " ")}:
                                    </span>{" "}
                                    <span className="text-text-secondary truncate text-[11px]">
                                      {log.summary}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 pl-2">
                                  <div className="text-[9px] text-text-dim font-mono">
                                    {new Date(log.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {logs.length === 0 && (
                              <div className="py-6 text-center text-xs text-text-dim italic">
                                No recent activity logged.
                              </div>
                            )}
                          </div>
                        </DashboardSection>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "dashboard" && (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8 pb-12 w-full max-w-none"
                    >
                      {/* Welcome Hero Section */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-2 via-surface to-surface-2/60 border border-border-bright p-6 sm:p-10 shadow-2xl w-full"
                      >
                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                          <div className="space-y-4 max-w-2xl">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-text-primary tracking-tight leading-[1.1]">
                              Welcome back,{" "}
                              <span className="text-amber-primary bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                                {user?.name?.split(" ")[0] || "Executive"}
                              </span>
                            </h2>

                            <p className="text-sm text-text-secondary leading-relaxed">
                              Your real estate portfolio is performing at peak efficiency. You have{" "}
                              <span className="text-amber-primary font-bold px-1.5 py-0.5 rounded bg-amber-primary/10 border border-amber-primary/20">
                                {stats.pending} tasks
                              </span>{" "}
                              requiring your immediate attention today.
                            </p>

                            <div className="flex flex-wrap items-center gap-4 pt-2">
                              <button
                                onClick={() => setActiveTab("projects")}
                                className="px-6 py-3 bg-amber-primary hover:bg-amber-secondary text-bg rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-primary/20 flex items-center gap-2 active:scale-[0.98] cursor-pointer"
                              >
                                <span>Explore Projects</span>
                                <ChevronRight size={15} />
                              </button>

                              <div className="flex items-center gap-2 bg-surface/60 border border-border-bright px-3 py-1.5 rounded-xl backdrop-blur-sm">
                                <div className="flex -space-x-2.5">
                                  {users.slice(0, 4).map((u, i) => (
                                    <div
                                      key={i}
                                      className="w-8 h-8 rounded-full border-2 border-surface bg-surface-3 flex items-center justify-center text-[10px] font-bold text-text-primary overflow-hidden shadow-sm"
                                      title={u.name}
                                    >
                                      {u.profilePicture ? (
                                        <img
                                          src={u.profilePicture}
                                          alt={u.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        u.name[0]
                                      )}
                                    </div>
                                  ))}
                                  {users.length > 4 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-surface bg-amber-primary/15 text-amber-primary flex items-center justify-center text-[9px] font-bold font-mono shadow-sm">
                                      +{users.length - 4}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider pl-1">
                                  Team Live
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 w-full lg:w-auto">
                            <div className="bg-surface/70 border border-border-bright p-5 rounded-2xl flex flex-col items-center text-center gap-1.5 shadow-lg backdrop-blur-sm">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-2xl sm:text-3xl font-bold font-sans text-text-primary">
                                  {stats.liveUsers}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider font-bold">
                                Active Users
                              </div>
                            </div>

                            <div className="bg-surface/70 border border-border-bright p-5 rounded-2xl flex flex-col items-center text-center gap-1.5 shadow-lg backdrop-blur-sm">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-primary" />
                                <span className="text-2xl sm:text-3xl font-bold font-sans text-text-primary">
                                  {stats.totalProperties}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider font-bold">
                                Total Listings
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* PWA Install Promotion Banner - highly responsive for Android users */}
                      <AnimatePresence>
                        {isInstallable && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 15 }}
                            className="bg-amber-primary/5 border border-amber-primary/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 select-none relative overflow-hidden backdrop-blur-sm"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-primary/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                            <div className="relative z-10 flex items-center gap-4 text-left">
                              <div className="w-11 h-11 rounded-xl bg-amber-primary/15 border border-amber-primary/30 flex items-center justify-center text-amber-primary shrink-0 shadow-lg shadow-amber-primary/10">
                                <Smartphone
                                  size={22}
                                  className="animate-pulse"
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-text-primary">
                                  Install pySync App on Android
                                </h4>
                                <p className="text-xs text-text-dim mt-0.5 leading-relaxed max-w-2xl">
                                  Enjoy a polished fullscreen workspace, instant touch-screen response, persistent offline sessions, and native Android home-screen integration.
                                </p>
                              </div>
                            </div>
                            <div className="relative z-10 flex items-center gap-3 w-full md:w-auto justify-end">
                              <button
                                onClick={handleInstallApp}
                                className="px-4 py-2 bg-amber-primary hover:bg-amber-secondary text-bg font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-[0.98] shadow-lg shadow-amber-primary/10 cursor-pointer"
                              >
                                <Download size={14} /> Install App
                              </button>
                              <button
                                onClick={() => setIsInstallable(false)}
                                className="px-3 py-2 text-text-dim hover:text-text-primary rounded-xl hover:bg-surface-2 transition-colors text-xs font-bold cursor-pointer"
                              >
                                Dismiss
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Primary KPI Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <KpiCard
                          label="Total Projects"
                          value={stats.total}
                          sub="Live in Database"
                          icon={Layers}
                          trend={12}
                          color="amber"
                        />
                        <KpiCard
                          label="Active Listings"
                          value={stats.active}
                          sub="Market Ready"
                          icon={Building2}
                          trend={5}
                          color="blue"
                        />
                        <KpiCard
                          label="Pending Approval"
                          value={stats.pending}
                          sub="Requires Action"
                          icon={Clock}
                          trend={-2}
                          color="purple"
                        />
                        <KpiCard
                          label="Media Assets"
                          value={stats.folders}
                          sub="Media Library"
                          icon={FolderOpen}
                          color="green"
                        />
                      </div>

                      {/* Admin Secondary Stats Strip */}
                      {user?.role === "admin" && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                          <KpiCard
                            label="Live Users"
                            value={stats.liveUsers}
                            sub="Online Now"
                            icon={User}
                            color="green"
                          />
                          <KpiCard
                            label="Team Leaders"
                            value={stats.teamLeaders}
                            sub="Active Leaders"
                            icon={UsersIcon}
                            color="blue"
                          />
                          <KpiCard
                            label="Approvals"
                            value={stats.pending}
                            sub="Workflow Tasks"
                            icon={ShieldCheck}
                            color="purple"
                          />
                          <KpiCard
                            label="Total Properties"
                            value={stats.totalProperties}
                            sub="All Listings"
                            icon={Home}
                            color="amber"
                          />
                          <KpiCard
                            label="Audit Logs"
                            value={stats.totalLogs}
                            sub="System Events"
                            icon={Activity}
                            color="red"
                          />
                        </div>
                      )}

                      {/* Recent Projects Section */}
                      <DashboardSection
                        title="Recent Projects"
                        icon={Building2}
                        action={
                          <button
                            onClick={() => setActiveTab("projects")}
                            className="text-xs text-amber-primary hover:underline uppercase tracking-wider font-mono font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Explore All ({projects.length})</span>
                            <ArrowUpRight size={13} />
                          </button>
                        }
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {projects.slice(0, 6).map((project, idx) => {
                            const projectAny = project as any;
                            const firstImage = Array.isArray(project.images) && project.images.length > 0 
                              ? project.images[0] 
                              : projectAny.imageUrl || projectAny.coverImage || null;
                            const priceInCr = (project.price / 10000000).toFixed(2);
                            const projectTypeLabel = (project.type || project.projectType || "Apartments")
                              .replace("FLATS", "Apartments")
                              .replace("Apartment", "Apartments");

                            return (
                              <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="bg-surface-2/60 border border-border-bright hover:border-amber-primary/50 rounded-2xl p-4 hover:bg-surface-2 transition-all cursor-pointer group shadow-lg flex flex-col justify-between backdrop-blur-md relative overflow-hidden"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setActiveTab("projects");
                                }}
                              >
                                <div className="absolute top-0 right-0 w-28 h-28 bg-amber-primary/5 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none" />
                                
                                <div>
                                  {/* Top badges & header */}
                                  <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono font-bold text-text-dim px-2 py-0.5 rounded-lg bg-surface-3/80 border border-border-bright">
                                        #{project.id.slice(0, 7)}
                                      </span>
                                      {project.reraNumber && (
                                        <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/25 px-1.5 py-0.5 rounded">
                                          RERA
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                                        project.status === "Active"
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                          : project.status === "Sold"
                                          ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                          : "bg-amber-500/15 text-amber-300 border-amber-500/60 shadow-sm animate-breathe"
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${project.status === "Active" ? "bg-emerald-400 animate-pulse" : project.status === "Sold" ? "bg-sky-400" : "bg-amber-400 animate-breathe-dot"}`} />
                                      <span>{project.status}</span>
                                    </span>
                                  </div>

                                  {/* Thumbnail & Title */}
                                  <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-surface-3 border border-border-bright flex items-center justify-center text-amber-primary shrink-0 overflow-hidden shadow-inner group-hover:border-amber-primary/40 transition-colors">
                                      {firstImage ? (
                                        <img 
                                          src={firstImage} 
                                          alt={project.title} 
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        />
                                      ) : (
                                        <Building2 size={22} className="text-amber-primary/70" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-sm font-bold text-text-primary group-hover:text-amber-primary transition-colors truncate">
                                        {project.title}
                                      </h4>
                                      <p className="text-[11px] text-text-dim truncate flex items-center gap-1 mt-1">
                                        <MapPin size={11} className="text-amber-primary shrink-0" />
                                        <span className="truncate">{project.location || "Prime Location"}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom pricing & type footer */}
                                <div className="mt-4 pt-3 border-t border-border-dim/40 flex justify-between items-center">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-text-dim uppercase tracking-wider font-mono">Valuation</span>
                                    <span className="text-sm font-bold text-amber-primary font-mono tracking-tight">
                                      ₹{priceInCr} Cr
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-text-secondary uppercase tracking-wider font-mono font-medium px-2 py-0.5 rounded-lg bg-surface-3/60 border border-border-bright">
                                      {projectTypeLabel}
                                    </span>
                                    <div className="w-6 h-6 rounded-lg bg-surface-3 flex items-center justify-center text-text-dim group-hover:text-amber-primary group-hover:bg-amber-primary/10 transition-all">
                                      <ArrowUpRight size={13} />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                          {projects.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-surface-2/30 rounded-2xl border border-dashed border-border-bright">
                              <Building2
                                size={36}
                                className="text-text-dim/40 mx-auto mb-2"
                              />
                              <p className="text-xs text-text-dim font-medium">
                                No projects recorded in database yet.
                              </p>
                            </div>
                          )}
                        </div>
                      </DashboardSection>

                      {/* Project Analytics Section */}
                      <DashboardSection
                        title="Project Analytics & Distribution"
                        icon={BarChartIcon}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Listing Status Breakdown */}
                          <div className="flex flex-col items-center bg-surface-2/60 border border-border-bright rounded-2xl p-5 shadow-lg backdrop-blur-md">
                            <div className="w-full flex items-center justify-between mb-4 pb-2 border-b border-border-dim/40">
                              <div>
                                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono flex items-center gap-2">
                                  <span>Listing Status Breakdown</span>
                                </h4>
                                <p className="text-[10px] text-text-dim mt-0.5">Inventory distribution across lifecycle stages</p>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-amber-primary bg-amber-primary/10 border border-amber-primary/20 px-2 py-0.5 rounded-md">
                                {projects.length} Total
                              </span>
                            </div>
                            <div className="w-full h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    {
                                      name: "Active",
                                      count: projects.filter(
                                        (p) => p.status === "Active",
                                      ).length,
                                    },
                                    {
                                      name: "Sold",
                                      count: projects.filter(
                                        (p) => p.status === "Sold",
                                      ).length,
                                    },
                                    {
                                      name: "Pending",
                                      count: projects.filter(
                                        (p) => p.status === "PENDING_DELETE" || p.status === "Pending",
                                      ).length,
                                    },
                                  ]}
                                >
                                  <defs>
                                    <linearGradient id="barAmberGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                                      <stop offset="100%" stopColor="#D97706" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="barEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                                      <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="barPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                                      <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.4} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(255, 255, 255, 0.06)"
                                    vertical={false}
                                  />
                                  <XAxis
                                    dataKey="name"
                                    stroke="currentColor"
                                    className="text-text-dim text-[10px] font-bold"
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <YAxis
                                    stroke="currentColor"
                                    className="text-text-dim text-[10px] font-bold"
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                  />
                                  <Tooltip
                                    cursor={{
                                      fill: "rgba(245, 158, 11, 0.06)",
                                    }}
                                    contentStyle={{
                                      backgroundColor: "#13151D",
                                      borderColor: "rgba(255, 255, 255, 0.15)",
                                      borderRadius: "14px",
                                      fontSize: "12px",
                                      boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.8)",
                                    }}
                                    itemStyle={{
                                      color: "#F3F4F6",
                                      fontWeight: "bold",
                                    }}
                                  />
                                  <Bar
                                    dataKey="count"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={48}
                                  >
                                    <Cell fill="url(#barAmberGrad)" />
                                    <Cell fill="url(#barEmeraldGrad)" />
                                    <Cell fill="url(#barPurpleGrad)" />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Possession Timelines */}
                          <div className="flex flex-col items-center bg-surface-2/60 border border-border-bright rounded-2xl p-5 shadow-lg backdrop-blur-md">
                            <div className="w-full flex items-center justify-between mb-4 pb-2 border-b border-border-dim/40">
                              <div>
                                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                                  Possession Timelines
                                </h4>
                                <p className="text-[10px] text-text-dim mt-0.5">Construction and handover readiness ratio</p>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                                Lifecycle Mix
                              </span>
                            </div>
                            <div className="w-full h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      {
                                        name: "Ready to Move",
                                        count: projects.filter(
                                          (p) =>
                                            p.possessionStatus ===
                                            "Ready to Move",
                                        ).length,
                                      },
                                      {
                                        name: "Under Construction",
                                        count: projects.filter(
                                          (p) =>
                                            p.possessionStatus ===
                                            "Under Construction",
                                        ).length,
                                      },
                                      {
                                        name: "New Launch",
                                        count: projects.filter(
                                          (p) => p.possessionStatus === "New Launch",
                                        ).length,
                                      },
                                    ].filter((d) => d.count > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={58}
                                    outerRadius={82}
                                    paddingAngle={6}
                                    dataKey="count"
                                  >
                                    <Cell fill="#38BDF8" />
                                    <Cell fill="#F59E0B" />
                                    <Cell fill="#EC4899" />
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: "#13151D",
                                      borderColor: "rgba(255, 255, 255, 0.15)",
                                      borderRadius: "14px",
                                      fontSize: "12px",
                                      boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.8)",
                                    }}
                                    itemStyle={{
                                      color: "#F3F4F6",
                                      fontWeight: "bold",
                                    }}
                                  />
                                  <Legend
                                    wrapperStyle={{
                                      fontSize: "11px",
                                      fontWeight: "bold",
                                      paddingTop: "14px",
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </DashboardSection>

                      {/* Lower Operations Grid */}
                      <div className="space-y-6">
                        {user?.role === "admin" ? (
                          <div className="space-y-6">
                            {/* 2-Column Split: Approvals & Team */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Approvals Column */}
                                <div>
                                  {approvals.length > 0 ? (
                                    <DashboardSection
                                      title="Pending Approvals"
                                      icon={Clock}
                                      action={
                                        <button
                                          onClick={() =>
                                            setActiveTab("approvals")
                                          }
                                          className="text-xs text-amber-primary hover:underline uppercase tracking-wider font-mono font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                          <span>Queue ({approvals.length})</span>
                                          <ArrowUpRight size={13} />
                                        </button>
                                      }
                                    >
                                      <div className="space-y-2.5">
                                        {approvals
                                          .slice(0, 3)
                                          .map((app, idx) => (
                                            <motion.div
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ delay: idx * 0.05 }}
                                              key={app.id}
                                              className="flex items-center justify-between p-3.5 bg-surface-2/60 border border-border-bright rounded-2xl hover:border-amber-primary/40 hover:bg-surface-2 transition-all cursor-pointer shadow-sm group"
                                              onClick={() => {
                                                setActiveTab("approvals");
                                                playSound("click");
                                              }}
                                            >
                                              <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center text-amber-primary shrink-0 group-hover:scale-105 transition-transform">
                                                  <ShieldCheck size={16} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                  <span className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors uppercase tracking-wider truncate">
                                                    {app.type?.replace(
                                                      /_/g,
                                                      " ",
                                                    )}
                                                  </span>
                                                  <span className="text-[10px] text-text-dim truncate mt-0.5">
                                                    Requested by <strong className="text-text-secondary">{app.requestedBy}</strong>
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm animate-breathe">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-breathe-dot" />
                                                  <span>Pending Approval</span>
                                                </span>
                                              </div>
                                            </motion.div>
                                          ))}
                                      </div>
                                    </DashboardSection>
                                  ) : (
                                    <DashboardSection
                                      title="Approvals"
                                      icon={ShieldCheck}
                                    >
                                      <div className="h-full flex flex-col items-center justify-center py-8 bg-surface-2/30 rounded-2xl border border-dashed border-border-bright">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2 shadow-sm">
                                          <Check size={20} />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-dim">
                                          Workflow Queue Clear
                                        </span>
                                      </div>
                                    </DashboardSection>
                                  )}
                                </div>

                                {/* Active Team Column */}
                                <div>
                                  <DashboardSection
                                    title="Active Team"
                                    icon={UsersIcon}
                                    action={
                                      <button
                                        onClick={() => setActiveTab("users")}
                                        className="text-xs text-amber-primary hover:underline uppercase tracking-wider font-mono font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>Roster ({users.length})</span>
                                        <ArrowUpRight size={13} />
                                      </button>
                                    }
                                  >
                                    <div className="space-y-2.5">
                                      {users.slice(0, 3).map((u, idx) => (
                                        <motion.div
                                          initial={{ opacity: 0, x: 10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: idx * 0.05 }}
                                          key={u.id}
                                          className="flex items-center justify-between p-3 rounded-2xl border border-border-bright bg-surface-2/40 hover:border-amber-primary/40 hover:bg-surface-2/70 transition-all cursor-pointer group shadow-sm"
                                          onClick={() => {
                                            setActiveTab("users");
                                            playSound("click");
                                          }}
                                        >
                                          <div className="flex items-center gap-3 min-w-0">
                                            {u.profilePicture ? (
                                              <img
                                                src={u.profilePicture}
                                                alt={u.name}
                                                className="w-9 h-9 rounded-full object-cover border border-border-bright shadow-sm"
                                              />
                                            ) : (
                                              <div className="w-9 h-9 rounded-full bg-surface-3 border border-border-bright flex items-center justify-center text-[11px] font-bold text-amber-primary shadow-sm">
                                                {u.name[0]}
                                              </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors truncate">
                                                {u.name}
                                              </span>
                                              <span className="text-[9px] text-text-dim uppercase tracking-wider font-mono mt-0.5">
                                                {u.role}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`w-2 h-2 rounded-full ${idx < 2 ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-surface-3"}`}
                                            />
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </DashboardSection>
                                </div>
                              </div>

                              {/* Recent Audit Logs Stream */}
                              <DashboardSection
                                title="Recent Audit Logs"
                                icon={Activity}
                                action={
                                  <button
                                    onClick={() => setActiveTab("logs")}
                                    className="text-xs text-amber-primary hover:underline uppercase tracking-wider font-mono font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Full History</span>
                                    <ArrowUpRight size={13} />
                                  </button>
                                }
                              >
                                <div className="space-y-1.5">
                                  {logs.slice(0, 5).map((log, idx) => (
                                    <motion.div
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.04 }}
                                      key={log.id}
                                      className="flex items-center justify-between p-3 rounded-xl bg-surface-2/30 hover:bg-surface-2/70 transition-all group border border-transparent hover:border-border-bright cursor-pointer"
                                      onClick={() => {
                                        setActiveTab("logs");
                                        playSound("click");
                                      }}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-surface-3 border border-border-bright flex items-center justify-center text-text-dim group-hover:text-amber-primary transition-colors shrink-0">
                                          <Activity size={14} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors uppercase tracking-wider truncate">
                                            {log.action?.replace(/_/g, " ")}
                                          </span>
                                          <span className="text-[11px] text-text-dim line-clamp-1">
                                            {log.summary}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0 pl-3">
                                        <div className="text-[11px] text-text-secondary font-bold font-mono">
                                          {log.user}
                                        </div>
                                        <div className="text-[9px] text-text-dim font-mono">
                                          {new Date(
                                            log.timestamp,
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                  {logs.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center bg-surface-2/20 rounded-xl border border-dashed border-border-bright">
                                      <Activity
                                        size={28}
                                        className="text-text-dim/40 mb-2"
                                      />
                                      <p className="text-xs text-text-dim italic">
                                        No recent activity recorded.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </DashboardSection>
                            </div>
                          ) : (
                            /* Non-Admin Executive Agent Launchpad */
                            <div className="space-y-6">
                              <div className="relative overflow-hidden rounded-3xl bg-surface-2/60 border border-border-bright p-8 shadow-xl backdrop-blur-md">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-primary/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                  <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-primary/10 border border-amber-primary/20 text-[10px] font-mono font-bold text-amber-primary uppercase tracking-widest">
                                      <span>Agent Workspace</span>
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-text-primary">
                                      Welcome to PySync Command
                                    </h3>
                                    <p className="text-xs text-text-secondary max-w-md leading-relaxed">
                                      Your dedicated real estate operations console. Access listings, inspect floor plans, manage resale portfolios, and collaborate across assets.
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => setActiveTab("projects")}
                                    className="px-5 py-3 bg-amber-primary hover:bg-amber-secondary text-bg font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-primary/20"
                                  >
                                    <Building2 size={16} />
                                    <span>Browse Inventory</span>
                                  </button>
                                </div>
                              </div>

                              {/* Agent Quick Launch Actions */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                  onClick={() => setActiveTab("projects")}
                                  className="p-5 rounded-2xl border border-border-bright bg-surface-2/40 hover:bg-surface-2/80 hover:border-amber-primary/40 transition-all text-left group cursor-pointer shadow-md"
                                >
                                  <div className="w-10 h-10 rounded-xl bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center text-amber-primary mb-3 group-hover:scale-110 transition-transform">
                                    <Building2 size={20} />
                                  </div>
                                  <h4 className="text-sm font-bold text-text-primary group-hover:text-amber-primary transition-colors">
                                    Browse Project Catalog
                                  </h4>
                                  <p className="text-xs text-text-dim mt-1 leading-relaxed">
                                    Inspect all verified master developments, floor plans, and pricing sheets.
                                  </p>
                                </button>

                                <button
                                  onClick={() => setActiveTab("resale")}
                                  className="p-5 rounded-2xl border border-border-bright bg-surface-2/40 hover:bg-surface-2/80 hover:border-amber-primary/40 transition-all text-left group cursor-pointer shadow-md"
                                >
                                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3 group-hover:scale-110 transition-transform">
                                    <Home size={20} />
                                  </div>
                                  <h4 className="text-sm font-bold text-text-primary group-hover:text-amber-primary transition-colors">
                                    Resale Listings
                                  </h4>
                                  <p className="text-xs text-text-dim mt-1 leading-relaxed">
                                    Search secondary market inventory, direct owner listings, and verified plots.
                                  </p>
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "logs" && <LogsView logs={logs} />}
                  {activeTab === "projects" && (
                    <motion.div
                      key="projects"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6 w-full max-w-none"
                    >
                      <div className="bg-surface/70 backdrop-blur-md border border-border-dim/40 rounded-3xl p-5 shadow-lg relative z-30 w-full space-y-4">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-primary/30 to-transparent pointer-events-none" />
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border-dim/30">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-primary animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">
                              Project Inventory Filter Console
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim">
                            <span className="font-bold text-text-secondary">{projects.filter(matchesProjectFilters).length}</span>
                            <span>/</span>
                            <span>{projects.length} Total Projects</span>
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between w-full">
                          <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
                            {/* View Mode */}
                            <div className="hidden md:flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-border-bright">
                              <button
                                onClick={() => {
                                  setViewMode("grid");
                                  playSound("click");
                                }}
                                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === "grid" ? "bg-amber-primary text-bg shadow-md shadow-amber-primary/25 font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-3/50"}`}
                                title="Grid View (Press 'G')"
                              >
                                <LayoutGrid size={16} />
                                <span className="hidden xl:inline text-[9px] font-mono px-1 py-0.2 rounded bg-black/20 text-text-secondary uppercase">G</span>
                              </button>
                              <button
                                onClick={() => {
                                  setViewMode("table");
                                  playSound("click");
                                }}
                                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === "table" ? "bg-amber-primary text-bg shadow-md shadow-amber-primary/25 font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-3/50"}`}
                                title="Table View (Press 'T')"
                              >
                                <List size={16} />
                                <span className="hidden xl:inline text-[9px] font-mono px-1 py-0.2 rounded bg-black/20 text-text-secondary uppercase">T</span>
                              </button>
                            </div>

                            <div className="h-6 w-px bg-border-dim hidden md:block" />

                            {/* Status Filter */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <span className="text-[9px] text-text-dim uppercase tracking-widest font-black shrink-0">
                                Status:
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                                {[
                                  "All",
                                  "Active",
                                  "Sold",
                                  "Pending",
                                  "PENDING_DELETE",
                                ].map((status) => {
                                  const isActive = statusFilter.includes(status);
                                  return (
                                    <button
                                      key={status}
                                      onClick={() => toggleStatusFilter(status)}
                                      className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-[9px] border transition-all font-black uppercase tracking-wider flex items-center justify-center gap-1 ${
                                        isActive
                                          ? "bg-amber-primary border-amber-primary text-bg shadow-md"
                                          : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50 hover:bg-surface-3/30"
                                      }`}
                                    >
                                      {status === "Active" && (
                                        <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-bg' : 'bg-emerald-500 animate-pulse'}`} />
                                      )}
                                      <span>
                                        {status === "PENDING_DELETE"
                                          ? "Del Req"
                                          : status}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row on Mobile / Right side on Desktop: Sort, Export & Smart Filters */}
                          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-border-dim/20">
                            {/* Sort Dropdown */}
                            <div
                              className="col-span-2 sm:col-span-1 sm:w-48 relative"
                              onMouseLeave={() => setIsSortDropdownOpen(false)}
                            >
                              <button
                                onClick={() =>
                                  setIsSortDropdownOpen(!isSortDropdownOpen)
                                }
                                className="w-full bg-surface-2 border border-border-bright rounded-xl px-3 sm:px-4 py-2 text-xs text-text-primary outline-none hover:border-amber-primary font-bold flex items-center justify-between transition-colors shadow-sm"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <SlidersHorizontal size={12} className="text-amber-primary shrink-0" />
                                  <span className="truncate">
                                    {sortBy === "id"
                                      ? "Sort: Default"
                                      : sortBy === "title-asc"
                                        ? "Title (A-Z)"
                                        : sortBy === "title-desc"
                                          ? "Title (Z-A)"
                                          : sortBy === "price-asc"
                                            ? "Price: Low to High"
                                            : sortBy === "price-desc"
                                              ? "Price: High to Low"
                                              : sortBy === "location-asc"
                                                ? "Location (A-Z)"
                                                : "Sort By"}
                                  </span>
                                </span>
                                <ChevronRight
                                  size={12}
                                  className={`rotate-90 transition-transform duration-200 shrink-0 ${isSortDropdownOpen ? "rotate-270" : ""} text-text-dim`}
                                />
                              </button>
                              <AnimatePresence>
                                {isSortDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute left-0 right-0 sm:right-0 sm:left-auto top-full mt-2 w-full sm:w-48 bg-surface border border-border-dim rounded-xl shadow-xl z-50 p-1.5 space-y-0.5"
                                  >
                                    {[
                                      { value: "id", label: "ID (Default)" },
                                      { value: "title-asc", label: "Title (A-Z)" },
                                      { value: "title-desc", label: "Title (Z-A)" },
                                      { value: "price-asc", label: "Price (Low-High)" },
                                      { value: "price-desc", label: "Price (High-Low)" },
                                      { value: "location-asc", label: "Location (A-Z)" },
                                    ].map((opt) => (
                                      <button
                                        key={opt.value}
                                        onClick={() => {
                                          setSortBy(opt.value);
                                          setIsSortDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${sortBy === opt.value ? "bg-amber-primary text-bg font-black" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                      >
                                        <span>{opt.label}</span>
                                        {sortBy === opt.value && <Check size={10} />}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Export CSV button */}
                            <button
                              onClick={() => {
                                const filtered = projects.filter(matchesProjectFilters);
                                const csvContent =
                                  "data:text/csv;charset=utf-8," +
                                  "ID,Title,Type,Configuration,Possession,Location,Price,Status,Builder,Area,Bathrooms,Assigned To,Created At\n" +
                                  filtered
                                    .map(
                                      (p) =>
                                        `${p.id},"${p.title}","${p.type}","${p.configuration}","${p.possessionStatus}","${p.location}",${p.price},"${p.status}","${p.builderName || ""}","${p.area || ""}","${p.bathrooms || ""}","${p.assignedTo || ""}","${p.createdAt || ""}"`,
                                    )
                                    .join("\n");

                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute(
                                  "download",
                                  `pysync_projects_${new Date().toISOString().split("T")[0]}.csv`,
                                );
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="col-span-1 sm:col-span-1 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 sm:px-4 py-2 rounded-xl border border-border-bright bg-surface-2 text-text-dim hover:text-amber-primary hover:border-amber-primary hover:bg-surface-3/30 transition-all shadow-sm"
                              title="Export filtered projects to CSV"
                            >
                              <Download size={12} />
                              <span>Export</span>
                            </button>

                            {/* Price Alerts Filter Toggle */}
                            <button
                              type="button"
                              onClick={() => setShowPriceAlertsOnly(!showPriceAlertsOnly)}
                              className={`col-span-1 sm:col-span-1 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 sm:px-4 py-2 rounded-xl border transition-all shadow-sm cursor-pointer ${
                                showPriceAlertsOnly
                                  ? "bg-amber-primary border-amber-primary text-bg shadow-md shadow-amber-primary/20 font-black"
                                  : "bg-surface-2 border-border-bright text-text-dim hover:text-amber-primary hover:border-amber-primary/50 hover:bg-surface-3/30"
                              }`}
                              title="Filter to projects with active price/status alerts"
                            >
                              <Bell size={12} className={showPriceAlertsOnly ? "fill-bg" : ""} />
                              <span>Alerts</span>
                              {Object.keys(priceAlerts).length > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold leading-none ${showPriceAlertsOnly ? 'bg-bg text-amber-primary' : 'bg-amber-primary/20 text-amber-primary'}`}>
                                  {Object.keys(priceAlerts).length}
                                </span>
                              )}
                            </button>

                            {/* Show Advanced Filters toggle button */}
                            <button
                              onClick={() =>
                                setShowAdvancedFilters(!showAdvancedFilters)
                              }
                              className={`col-span-1 sm:col-span-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 sm:px-4 py-2 rounded-xl border transition-all shadow-sm ${
                                showAdvancedFilters
                                  ? "bg-amber-primary border-amber-primary text-bg shadow-md"
                                  : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50 hover:bg-surface-3/30"
                              }`}
                            >
                              <Filter size={12} />
                              <span>{showAdvancedFilters ? "Hide Panel" : "Smart Filters"}</span>
                              <AnimatePresence>
                                {activeProjectFiltersCount > 0 && (
                                  <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-black rounded-full transition-colors ${
                                      showAdvancedFilters
                                        ? "bg-surface-2/90 text-amber-primary"
                                        : "bg-amber-primary text-bg"
                                    }`}
                                  >
                                    {activeProjectFiltersCount}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </button>
                          </div>
                        </div>
                      </div>

                      {showAdvancedFilters && (
                        <motion.div
                          initial={{ opacity: 0, y: -12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-surface/50 backdrop-blur-md p-6 md:p-8 border border-border-dim/40 rounded-3xl shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-20"
                        >
                          {/* Manager Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl relative">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <User size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Assigned Manager
                              </span>
                            </div>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setIsManagerDropdownOpen(!isManagerDropdownOpen)
                                }
                                className="w-full bg-surface-2 border border-border-bright rounded-xl px-3 py-2.5 text-xs text-text-primary outline-none hover:border-amber-primary font-medium flex items-center justify-between transition-colors"
                              >
                                <span>
                                  {assignedToFilter === "All"
                                    ? "All Managers"
                                    : assignedToFilter}
                                </span>
                                <ChevronRight
                                  size={14}
                                  className={`rotate-90 transition-transform duration-200 ${isManagerDropdownOpen ? "rotate-270" : ""} text-text-dim`}
                                />
                              </button>
                              <AnimatePresence>
                                {isManagerDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border-dim rounded-xl shadow-xl z-50 p-1 max-h-52 overflow-y-auto custom-scrollbar space-y-0.5"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAssignedToFilter("All");
                                        setIsManagerDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${assignedToFilter === "All" ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                    >
                                      <span>All Managers</span>
                                      {assignedToFilter === "All" && <Check size={10} />}
                                    </button>
                                    {Array.from(
                                      new Set(
                                        projects
                                          .map((p) => p.assignedTo)
                                          .filter(Boolean),
                                      ),
                                    ).map((name) => (
                                      <button
                                        type="button"
                                        key={name}
                                        onClick={() => {
                                          setAssignedToFilter(name);
                                          setIsManagerDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${assignedToFilter === name ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                      >
                                        <span>{name}</span>
                                        {assignedToFilter === name && <Check size={10} />}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Builder Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl relative">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Building2 size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Builder Brand
                              </span>
                            </div>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setIsBuilderDropdownOpen(!isBuilderDropdownOpen)
                                }
                                className="w-full bg-surface-2 border border-border-bright rounded-xl px-3 py-2.5 text-xs text-text-primary outline-none hover:border-amber-primary font-medium flex items-center justify-between transition-colors"
                              >
                                <span>
                                  {builderFilter === "All"
                                    ? "All Builders"
                                    : builderFilter}
                                </span>
                                <ChevronRight
                                  size={14}
                                  className={`rotate-90 transition-transform duration-200 ${isBuilderDropdownOpen ? "rotate-270" : ""} text-text-dim`}
                                />
                              </button>
                              <AnimatePresence>
                                {isBuilderDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border-dim rounded-xl shadow-xl z-50 p-1 max-h-52 overflow-y-auto custom-scrollbar space-y-0.5"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBuilderFilter("All");
                                        setIsBuilderDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${builderFilter === "All" ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                    >
                                      <span>All Builders</span>
                                      {builderFilter === "All" && <Check size={10} />}
                                    </button>
                                    {Array.from(
                                      new Set(
                                        [...projects.map((p) => p.builderName), ...resaleProperties.map((r) => r.builderName)].filter(Boolean)
                                      ),
                                    ).map((name) => (
                                      <button
                                        type="button"
                                        key={name}
                                        onClick={() => {
                                          setBuilderFilter(name);
                                          setIsBuilderDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${builderFilter === name ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                      >
                                        <span>{name}</span>
                                        {builderFilter === name && <Check size={10} />}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Possession Status Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Clock size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Possession Phase
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {[
                                "All",
                                "Ready to Move",
                                "Under Construction",
                                "New Launch",
                              ].map((status) => {
                                const isSel = possessionFilter.includes(status);
                                return (
                                  <button
                                    key={status}
                                    onClick={() => togglePossessionFilter(status)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[9px] border transition-all font-bold ${
                                      isSel
                                        ? "bg-amber-primary border-amber-primary text-bg shadow-sm"
                                        : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50 hover:bg-surface-3/30"
                                    }`}
                                  >
                                    {status}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* BHK Size Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Layers size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Configuration
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK"].map((bhk) => {
                                const isSel = configurationFilter.includes(bhk);
                                return (
                                  <button
                                    key={bhk}
                                    type="button"
                                    onClick={() => toggleConfigurationFilter(bhk)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[9px] border transition-all font-bold ${
                                      isSel
                                        ? "bg-amber-primary border-amber-primary text-bg shadow-sm"
                                        : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50 hover:bg-surface-3/30"
                                    }`}
                                  >
                                    {bhk}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Price Range Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <IndianRupee size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Price (Lakhs)
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[8px] text-text-dim uppercase font-black">
                                  Min Value
                                </span>
                                <input
                                  type="number"
                                  value={priceRangeFilter[0] / 100000}
                                  onChange={(e) =>
                                    setPriceRangeFilter([
                                      Number(e.target.value) * 100000,
                                      priceRangeFilter[1],
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary font-mono font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] text-text-dim uppercase font-black">
                                  Max Value
                                </span>
                                <input
                                  type="number"
                                  value={priceRangeFilter[1] / 100000}
                                  onChange={(e) =>
                                    setPriceRangeFilter([
                                      priceRangeFilter[0],
                                      Number(e.target.value) * 100000,
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Area Range Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Maximize2 size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Area Size (Sq.Ft.)
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[8px] text-text-dim uppercase font-black">
                                  Min Area
                                </span>
                                <input
                                  type="number"
                                  value={areaRangeFilter[0]}
                                  onChange={(e) =>
                                    setAreaRangeFilter([
                                      Number(e.target.value),
                                      areaRangeFilter[1],
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary font-mono font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] text-text-dim uppercase font-black">
                                  Max Area
                                </span>
                                <input
                                  type="number"
                                  value={areaRangeFilter[1]}
                                  onChange={(e) =>
                                    setAreaRangeFilter([
                                      areaRangeFilter[0],
                                      Number(e.target.value),
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bathrooms Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Bath size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Bathrooms
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {[1, 2, 3, 4, 5].map((count) => {
                                const isSel = bathroomsFilter.includes(count);
                                return (
                                  <button
                                    key={count}
                                    onClick={() => toggleBathroomFilter(count)}
                                    className={`w-8 h-8 rounded-lg text-[10px] border flex items-center justify-center transition-all font-black ${
                                      isSel
                                        ? "bg-amber-primary border-amber-primary text-bg shadow-sm"
                                        : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50 hover:bg-surface-3/30"
                                    }`}
                                  >
                                    {count}+
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Total Units Range Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Home size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Total Units Scale
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[8px] text-text-dim uppercase font-black">
                                  Min Units
                                </span>
                                <input
                                  type="number"
                                  value={unitsRangeFilter[0]}
                                  onChange={(e) =>
                                    setUnitsRangeFilter([
                                      Number(e.target.value),
                                      unitsRangeFilter[1],
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary font-mono font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] text-text-dim uppercase font-black">
                                  Max Units
                                </span>
                                <input
                                  type="number"
                                  value={unitsRangeFilter[1]}
                                  onChange={(e) =>
                                    setUnitsRangeFilter([
                                      unitsRangeFilter[0],
                                      Number(e.target.value),
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row Glow and Reset Action */}
                          <div className="col-span-full pt-4 border-t border-border-dim/30 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setPriceRangeFilter([0, 1000000000]);
                                setAreaRangeFilter([0, 100000]);
                                setUnitsRangeFilter([0, 10000]);
                                setPossessionFilter(["All"]);
                                setBathroomsFilter([]);
                                setConfigurationFilter([]);
                                setAssignedToFilter("All");
                                setBuilderFilter("All");
                              }}
                              className="text-[10px] bg-red-500/10 border border-red-500/25 hover:bg-red-500 hover:text-white transition-all text-red-500 px-4 py-2 rounded-xl font-black uppercase tracking-widest"
                            >
                              Reset Active Filters
                            </button>
                          </div>
                        </motion.div>
                      )}

                      <AnimatePresence mode="popLayout">
                        {viewMode === "map" ? (
                          <motion.div
                            key="map"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            className="w-full"
                          >
                            <ProjectMapView
                              items={projects.filter(matchesProjectFilters)}
                              onSelectItem={(id) => {
                                const p = projects.find((proj) => proj.id === id);
                                if (p) setSelectedProject(p);
                              }}
                              type="project"
                              selectedItemId={selectedMapItemId}
                            />
                          </motion.div>
                        ) : viewMode === "grid" ? (
                          <motion.div
                            key={`grid-${builderFilter}-${searchQuery}-${statusFilter.join(",")}-${possessionFilter.join(",")}-${assignedToFilter}-${bathroomsFilter.join(",")}-${configurationFilter.join(",")}-${priceRangeFilter.join(",")}-${areaRangeFilter.join(",")}-${unitsRangeFilter.join(",")}-${showPriceAlertsOnly}-${sortBy}`}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            className="w-full"
                          >
                            <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-6">
                              <AnimatePresence mode="popLayout">
                                {(() => {
                                  let filtered = projects.filter(matchesProjectFilters);

                                  if (sortBy === "price-asc") {
                                    filtered = [...filtered].sort(
                                      (a, b) => a.price - b.price,
                                    );
                                  } else if (sortBy === "price-desc") {
                                    filtered = [...filtered].sort(
                                      (a, b) => b.price - a.price,
                                    );
                                  } else if (sortBy === "location-asc") {
                                    filtered = [...filtered].sort((a, b) =>
                                      a.location.localeCompare(b.location),
                                    );
                                  } else if (sortBy === "location-desc") {
                                    filtered = [...filtered].sort((a, b) =>
                                      b.location.localeCompare(a.location),
                                    );
                                  } else if (sortBy === "title-asc") {
                                    filtered = [...filtered].sort((a, b) =>
                                      a.title.localeCompare(b.title),
                                    );
                                  } else if (sortBy === "title-desc") {
                                    filtered = [...filtered].sort((a, b) =>
                                      b.title.localeCompare(a.title),
                                    );
                                  } else if (sortBy === "builder-asc") {
                                    filtered = [...filtered].sort((a, b) =>
                                      (a.builderName || "").localeCompare(
                                        b.builderName || "",
                                      ),
                                    );
                                  } else if (sortBy === "builder-desc") {
                                    filtered = [...filtered].sort((a, b) =>
                                      (b.builderName || "").localeCompare(
                                        a.builderName || "",
                                      ),
                                    );
                                  }

                                  if (filtered.length === 0) {
                                    return (
                                      <motion.div
                                        key="empty"
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="col-span-full py-24 text-center space-y-4 bg-surface border border-border-dim rounded-2xl border-dashed"
                                      >
                                        <div className="p-4 bg-surface-2 rounded-full w-fit mx-auto text-text-dim">
                                          <Search size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-text-primary">
                                          No projects found
                                        </p>
                                        <p className="text-xs text-text-dim">
                                          Try adjusting your filters or search query.
                                        </p>
                                      </motion.div>
                                    );
                                  }

                                  return filtered.map((p, index) => (
                                    <motion.div
                                      layout
                                      custom={index}
                                      variants={projectCardVariants}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      key={p.id}
                                    >
                                      <ProjectCard
                                        project={p}
                                        onClick={setSelectedProject}
                                        onEdit={(p: any) => {
                                          setEditingProject(p);
                                          setIsModalOpen(true);
                                        }}
                                        onDelete={setProjectToDelete}
                                        hasEditPermission={hasPermission(user, "EDIT_PROJECTS") && user?.role === "admin"}
                                        hasDeletePermission={hasPermission(user, "DELETE_PROJECTS") && user?.role === "admin"}
                                        isSelected={selectedProjectIds.includes(p.id)}
                                        onSelect={(id: string) => {
                                          setSelectedProjectIds((prev) =>
                                            prev.includes(id)
                                              ? prev.filter((i) => i !== id)
                                              : [...prev, id],
                                          );
                                        }}
                                        onShowOnMap={(proj: any) => {
                                          setViewMode("map");
                                          setSelectedMapItemId(proj.id);
                                        }}
                                        isAlertActive={!!priceAlerts[p.id]}
                                        alertActiveSince={priceAlerts[p.id]?.createdAt}
                                        onToggleAlert={handleTogglePriceAlert}
                                      />
                                    </motion.div>
                                  ));
                                })()}
                              </AnimatePresence>
                            </motion.div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`table-${builderFilter}-${searchQuery}-${statusFilter.join(",")}-${possessionFilter.join(",")}-${assignedToFilter}-${bathroomsFilter.join(",")}-${configurationFilter.join(",")}-${priceRangeFilter.join(",")}-${areaRangeFilter.join(",")}-${unitsRangeFilter.join(",")}-${showPriceAlertsOnly}-${sortBy}`}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            className="w-full"
                          >
                            {/* Table view for Desktop & Tablet viewports */}
                            <div className="hidden md:block bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-xl">
                              <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
                              <thead>
                                <tr className="bg-surface-2/30">
                                  <th className="px-6 py-4 w-12 border-b border-border-dim first:rounded-tl-2xl">
                                    <div
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                                        projects.length > 0 &&
                                        selectedProjectIds.length ===
                                          projects.length
                                          ? "bg-amber-primary border-amber-primary"
                                          : "bg-surface-3 border-border-bright hover:border-amber-primary/50"
                                      }`}
                                      onClick={() => {
                                        if (
                                          selectedProjectIds.length ===
                                          projects.length
                                        ) {
                                          setSelectedProjectIds([]);
                                        } else {
                                          setSelectedProjectIds(
                                            projects.map((p) => p.id),
                                          );
                                        }
                                      }}
                                    >
                                      {selectedProjectIds.length ===
                                        projects.length &&
                                        projects.length > 0 && (
                                          <Check
                                            size={12}
                                            className="text-bg font-black"
                                          />
                                        )}
                                      {selectedProjectIds.length > 0 &&
                                        selectedProjectIds.length <
                                          projects.length && (
                                          <div className="w-2 h-0.5 bg-amber-primary" />
                                        )}
                                    </div>
                                  </th>
                                  <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim">
                                    <div className="flex items-center gap-2">
                                      <Zap
                                        size={12}
                                        className="text-amber-primary/50"
                                      />
                                      Ref ID
                                    </div>
                                  </th>
                                  <th
                                    className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim cursor-pointer hover:text-text-primary transition-colors hover:bg-surface-3/30"
                                    onClick={() =>
                                      setSortBy(
                                        sortBy === "title-asc"
                                          ? "title-desc"
                                          : "title-asc",
                                      )
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      <Building2
                                        size={12}
                                        className="text-amber-primary/50"
                                      />
                                      Project Title{" "}
                                      {sortBy === "title-asc"
                                        ? "↑"
                                        : sortBy === "title-desc"
                                          ? "↓"
                                          : ""}
                                    </div>
                                  </th>
                                  <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim hidden sm:table-cell">
                                    <div className="flex items-center gap-2">
                                      <Layers
                                        size={12}
                                        className="text-amber-primary/50"
                                      />
                                      Type
                                    </div>
                                  </th>
                                  <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim hidden md:table-cell">
                                    <div className="flex items-center gap-2">
                                      <Clock
                                        size={12}
                                        className="text-amber-primary/50"
                                      />
                                      Possession
                                    </div>
                                  </th>
                                  <th
                                    className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim hidden lg:table-cell cursor-pointer hover:text-text-primary transition-colors hover:bg-surface-3/30"
                                    onClick={() =>
                                      setSortBy(
                                        sortBy === "location-asc"
                                          ? "location-desc"
                                          : "location-asc",
                                      )
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      <MapPin
                                        size={12}
                                        className="text-amber-primary/50"
                                      />
                                      Location{" "}
                                      {sortBy === "location-asc"
                                        ? "↑"
                                        : sortBy === "location-desc"
                                          ? "↓"
                                          : ""}
                                    </div>
                                  </th>
                                  <th
                                    className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim cursor-pointer hover:text-text-primary transition-colors hover:bg-surface-3/30"
                                    onClick={() =>
                                      setSortBy(
                                        sortBy === "price-asc"
                                          ? "price-desc"
                                          : "price-asc",
                                      )
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      <IndianRupee
                                        size={12}
                                        className="text-amber-primary/50"
                                      />
                                      Price{" "}
                                      {sortBy === "price-asc"
                                        ? "↑"
                                        : sortBy === "price-desc"
                                          ? "↓"
                                          : ""}
                                    </div>
                                  </th>
                                  <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim">
                                    <div className="flex items-center gap-2">
                                      <Activity
                                        size={12}
                                        className="text-amber-primary/50"
                                      />
                                      Status
                                    </div>
                                  </th>
                                  <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim text-right last:rounded-tr-2xl">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  let filtered = projects.filter(matchesProjectFilters);

                                  if (sortBy === "price-asc") {
                                    filtered = [...filtered].sort(
                                      (a, b) => a.price - b.price,
                                    );
                                  } else if (sortBy === "price-desc") {
                                    filtered = [...filtered].sort(
                                      (a, b) => b.price - a.price,
                                    );
                                  } else if (sortBy === "location-asc") {
                                    filtered = [...filtered].sort((a, b) =>
                                      a.location.localeCompare(b.location),
                                    );
                                  } else if (sortBy === "location-desc") {
                                    filtered = [...filtered].sort((a, b) =>
                                      b.location.localeCompare(a.location),
                                    );
                                  } else if (sortBy === "title-asc") {
                                    filtered = [...filtered].sort((a, b) =>
                                      a.title.localeCompare(b.title),
                                    );
                                  } else if (sortBy === "title-desc") {
                                    filtered = [...filtered].sort((a, b) =>
                                      b.title.localeCompare(a.title),
                                    );
                                  }

                                  if (filtered.length === 0) {
                                    return (
                                      <tr>
                                        <td
                                          colSpan={8}
                                          className="p-16 text-center text-text-dim text-xs italic"
                                        >
                                          No projects matching the current
                                          filters.
                                        </td>
                                      </tr>
                                    );
                                  }

                                  return filtered.map((p, index) => (
                                    <motion.tr
                                      key={p.id}
                                      custom={index}
                                      variants={projectRowVariants}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      onClick={() => setSelectedProject(p)}
                                      className={`group transition-all duration-300 cursor-pointer ${
                                        selectedProjectIds.includes(p.id)
                                          ? "bg-amber-primary/[0.03]"
                                          : index % 2 === 0
                                            ? "bg-surface"
                                            : "bg-surface-2/20"
                                      } hover:bg-surface-3/80`}
                                    >
                                      <td className="px-6 py-4 border-b border-border-dim/30">
                                        <div
                                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                                            selectedProjectIds.includes(p.id)
                                              ? "bg-amber-primary border-amber-primary"
                                              : "bg-surface-3 border-border-bright hover:border-amber-primary/50"
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedProjectIds((prev) =>
                                              prev.includes(p.id)
                                                ? prev.filter((i) => i !== p.id)
                                                : [...prev, p.id],
                                            );
                                          }}
                                        >
                                          {selectedProjectIds.includes(
                                            p.id,
                                          ) && (
                                            <Check
                                              size={12}
                                              className="text-bg font-black"
                                            />
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 border-b border-border-dim/30 font-mono text-[10px] text-text-dim uppercase tracking-wider relative">
                                        {p.status === "Active" && (
                                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-r-full shadow-[2px_0_10px_rgba(16,185,129,0.5)]" />
                                        )}
                                        {p.id.slice(0, 8)}
                                      </td>
                                      <td className="px-6 py-4 border-b border-border-dim/30 min-w-[240px]">
                                        <div className="flex flex-col">
                                          <span className="text-sm font-bold text-text-primary group-hover:text-amber-primary transition-colors leading-tight">
                                            {p.title}
                                          </span>
                                          <span className="text-[9px] text-text-dim uppercase tracking-[0.15em] font-bold mt-1 opacity-70">
                                            {p.builderName || "General"}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 border-b border-border-dim/30 text-xs text-text-secondary hidden sm:table-cell font-medium">
                                        <div className="flex flex-col">
                                          <span className="text-text-primary font-semibold">
                                            {(p.type || p.projectType || "")
                                              .replace("FLATS", "Apartments")
                                              .replace(
                                                "Apartment",
                                                "Apartments",
                                              )}
                                          </span>
                                          <span className="text-[10px] text-text-dim">
                                            {(
                                              p.configuration || "Standard"
                                            ).replace("5BHK", "Penthouse")}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 border-b border-border-dim/30 hidden md:table-cell">
                                        <span
                                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                            p.possessionStatus ===
                                            "Ready to Move"
                                              ? "border-green-500/20 bg-green-500/5 text-green-500"
                                              : p.possessionStatus ===
                                                  "Under Construction"
                                                ? "border-amber-500/20 bg-amber-500/5 text-amber-500"
                                                : "border-blue-500/20 bg-blue-500/5 text-blue-500"
                                          }`}
                                        >
                                          <div
                                            className={`w-1 h-1 rounded-full mr-1.5 ${
                                              p.possessionStatus ===
                                              "Ready to Move"
                                                ? "bg-green-500"
                                                : p.possessionStatus ===
                                                    "Under Construction"
                                                  ? "bg-amber-500"
                                                  : "bg-blue-500"
                                            }`}
                                          />
                                          {p.possessionStatus}
                                        </span>
                                        {p.possessionDate && (
                                          <div className="flex flex-col text-[8px] pl-1 border-l border-border-dim/50 ml-1 mt-1">
                                            <span className="text-text-dim uppercase font-bold tracking-tighter">
                                              {p.possessionStatus ===
                                              "Ready to Move"
                                                ? "Ready Since"
                                                : "Expected"}
                                            </span>
                                            <span className="text-text-secondary font-bold">
                                              {(() => {
                                                const target = new Date(
                                                  p.possessionDate,
                                                );
                                                const now = new Date();
                                                const diffTime =
                                                  target.getTime() -
                                                  now.getTime();
                                                const diffDays = Math.ceil(
                                                  diffTime /
                                                    (1000 * 60 * 60 * 24),
                                                );
                                                if (diffDays > 0)
                                                  return `${diffDays}d left (${target.toLocaleDateString()})`;
                                                if (diffDays === 0)
                                                  return "Ready Today";
                                                return target.toLocaleDateString();
                                              })()}
                                            </span>
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 border-b border-border-dim/30 hidden lg:table-cell min-w-[180px]">
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.location)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center gap-2 group/loc"
                                        >
                                          <div className="w-7 h-7 bg-surface-2 rounded-lg flex items-center justify-center text-text-dim group-hover/loc:text-amber-primary group-hover/loc:bg-amber-primary/10 transition-all">
                                            <MapPin size={12} />
                                          </div>
                                          <span className="text-xs text-text-dim group-hover/loc:text-text-primary group-hover/loc:underline transition-all line-clamp-1">
                                            {p.location}
                                          </span>
                                        </a>
                                      </td>
                                      <td className="px-6 py-4 border-b border-border-dim/30">
                                        <div className="flex flex-col">
                                          <span className="text-sm font-mono font-black text-text-primary">
                                            {formatPrice(p.price)}
                                          </span>
                                          <span className="text-[9px] text-text-dim uppercase font-bold tracking-tighter">
                                            Total Value
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 border-b border-border-dim/30">
                                        <span
                                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${
                                            p.status === "Active"
                                              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                              : p.status === "PENDING_DELETE"
                                                ? "border-red-500/50 bg-red-500/15 text-red-400 shadow-sm animate-breathe"
                                                : "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm animate-breathe"
                                          }`}
                                        >
                                          {p.status === "Active" ? (
                                            <span className="relative flex h-1.5 w-1.5">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                            </span>
                                          ) : (
                                            <span className="relative flex h-1.5 w-1.5">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400 animate-breathe-dot"></span>
                                            </span>
                                          )}
                                          {p.status === "PENDING_DELETE" ? "Pending Delete" : p.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 border-b border-border-dim/30 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTogglePriceAlert(p);
                                            }}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                                              priceAlerts[p.id]
                                                ? "text-amber-primary bg-amber-primary/15 hover:bg-amber-primary/25 border border-amber-primary/30"
                                                : "text-text-dim hover:text-amber-primary hover:bg-amber-primary/10"
                                            }`}
                                            title={
                                              priceAlerts[p.id]
                                                ? "Price Alert Active (Click to disable)"
                                                : "Enable Price Alert"
                                            }
                                          >
                                            <Bell
                                              size={14}
                                              className={priceAlerts[p.id] ? "fill-amber-primary animate-pulse" : ""}
                                            />
                                          </button>
                                          <button
                                            onClick={() =>
                                              setSelectedProject(p)
                                            }
                                            className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-all"
                                            title="Quick View"
                                          >
                                            <Eye size={14} />
                                          </button>
                                          {hasPermission(user, "EDIT_PROJECTS") && user?.role === "admin" && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingProject(p);
                                                setIsModalOpen(true);
                                              }}
                                              className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                                              title="Edit Project"
                                            >
                                              <Edit size={14} />
                                            </button>
                                          )}
                                          {hasPermission(user, "DELETE_PROJECTS") && user?.role === "admin" && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setProjectToDelete(p);
                                              }}
                                              className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                              title="Delete Project"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </motion.tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Cards / Grid view for Mobile viewports when Table view is active */}
                        <div className="md:hidden">
                          <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-6">
                            <AnimatePresence mode="popLayout">
                              {(() => {
                                let filtered = projects.filter(matchesProjectFilters);

                                if (sortBy === "price-asc") {
                                  filtered = [...filtered].sort((a, b) => a.price - b.price);
                                } else if (sortBy === "price-desc") {
                                  filtered = [...filtered].sort((a, b) => b.price - a.price);
                                } else if (sortBy === "location-asc") {
                                  filtered = [...filtered].sort((a, b) => a.location.localeCompare(b.location));
                                } else if (sortBy === "location-desc") {
                                  filtered = [...filtered].sort((a, b) => b.location.localeCompare(a.location));
                                } else if (sortBy === "title-asc") {
                                  filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
                                } else if (sortBy === "title-desc") {
                                  filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title));
                                } else if (sortBy === "builder-asc") {
                                  filtered = [...filtered].sort((a, b) => (a.builderName || "").localeCompare(b.builderName || ""));
                                } else if (sortBy === "builder-desc") {
                                  filtered = [...filtered].sort((a, b) => (b.builderName || "").localeCompare(a.builderName || ""));
                                }

                                if (filtered.length === 0) {
                                  return (
                                    <motion.div
                                      key="empty"
                                      layout
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      className="col-span-full py-24 text-center space-y-4 bg-surface border border-border-dim rounded-2xl border-dashed"
                                    >
                                      <div className="p-4 bg-surface-2 rounded-full w-fit mx-auto text-text-dim">
                                        <Search size={32} />
                                      </div>
                                      <p className="text-sm font-bold text-text-primary">
                                        No projects found
                                      </p>
                                      <p className="text-xs text-text-dim">
                                        Try adjusting your filters or search query.
                                      </p>
                                    </motion.div>
                                  );
                                }

                                return filtered.map((p, index) => (
                                  <motion.div
                                    layout
                                    custom={index}
                                    variants={projectCardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    key={p.id}
                                  >
                                    <ProjectCard
                                      project={p}
                                      onClick={setSelectedProject}
                                      onEdit={(p: any) => {
                                        setEditingProject(p);
                                        setIsModalOpen(true);
                                      }}
                                      onDelete={setProjectToDelete}
                                      hasEditPermission={hasPermission(user, "EDIT_PROJECTS") && user?.role === "admin"}
                                      hasDeletePermission={hasPermission(user, "DELETE_PROJECTS") && user?.role === "admin"}
                                      isSelected={selectedProjectIds.includes(p.id)}
                                      onSelect={(id: string) => {
                                        setSelectedProjectIds((prev) =>
                                          prev.includes(id)
                                            ? prev.filter((i) => i !== id)
                                            : [...prev, id],
                                        );
                                      }}
                                      onShowOnMap={(proj: any) => {
                                        setViewMode("map");
                                        setSelectedMapItemId(proj.id);
                                      }}
                                      isAlertActive={!!priceAlerts[p.id]}
                                      alertActiveSince={priceAlerts[p.id]?.createdAt}
                                      onToggleAlert={handleTogglePriceAlert}
                                    />
                                  </motion.div>
                                ));
                              })()}
                            </AnimatePresence>
                          </motion.div>
                        </div>
                      </motion.div>
                      )}
                    </AnimatePresence>

                      {/* Bulk Actions Bar */}
                      <AnimatePresence>
                        {selectedProjectIds.length > 0 && (
                          <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-surface border border-amber-primary/30 shadow-2xl shadow-amber-primary/20 rounded-2xl px-4 md:px-6 py-4 flex flex-col md:flex-row items-center gap-4 md:gap-8 w-[90vw] md:w-auto"
                          >
                            <div className="flex items-center gap-3 md:pr-8 md:border-r border-border-dim w-full md:w-auto justify-center md:justify-start">
                              <div className="w-8 h-8 rounded-full bg-amber-primary flex items-center justify-center text-bg font-black text-xs shrink-0">
                                {selectedProjectIds.length}
                              </div>
                              <span className="text-xs font-bold text-text-primary uppercase tracking-widest shrink-0">
                                Selected
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
                              <button
                                onClick={() => setIsBulkStatusModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-border-bright text-text-secondary hover:text-amber-primary hover:border-amber-primary transition-all text-[10px] font-black uppercase tracking-widest"
                              >
                                <RefreshCw size={14} /> Change Status
                              </button>

                              <button
                                onClick={() => setIsBulkDeleteModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                              >
                                <Trash2 size={14} /> Delete
                              </button>

                              <button
                                onClick={() => setSelectedProjectIds([])}
                                className="text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-text-primary transition-colors ml-4"
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {activeTab === "resale" && (
                    <motion.div
                      key="resale"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4 w-full max-w-none"
                    >
                      <div className="bg-surface/70 backdrop-blur-md border border-border-dim/40 rounded-3xl p-5 shadow-lg relative z-30 w-full space-y-4">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-primary/30 to-transparent pointer-events-none" />
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border-dim/30">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-primary animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">
                              Resale Inventory Filter Console
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim">
                            <span className="font-bold text-text-secondary">{resaleProperties.filter(matchesResaleFilters).length}</span>
                            <span>/</span>
                            <span>{resaleProperties.length} Total Resales</span>
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between w-full">
                          <div className="flex flex-wrap gap-4 items-center">
                            {/* View Mode */}
                            <div className="hidden md:flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-border-bright">
                              <button
                                onClick={() => {
                                  setViewMode("grid");
                                  playSound("click");
                                }}
                                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === "grid" ? "bg-amber-primary text-bg shadow-md shadow-amber-primary/25 font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-3/50"}`}
                                title="Grid View (Press 'G')"
                              >
                                <LayoutGrid size={16} />
                                <span className="hidden xl:inline text-[9px] font-mono px-1 py-0.2 rounded bg-black/20 text-text-secondary uppercase">G</span>
                              </button>
                              <button
                                onClick={() => {
                                  setViewMode("table");
                                  playSound("click");
                                }}
                                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === "table" ? "bg-amber-primary text-bg shadow-md shadow-amber-primary/25 font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-3/50"}`}
                                title="Table View (Press 'T')"
                              >
                                <List size={16} />
                                <span className="hidden xl:inline text-[9px] font-mono px-1 py-0.2 rounded bg-black/20 text-text-secondary uppercase">T</span>
                              </button>
                            </div>

                            <div className="h-6 w-px bg-border-dim hidden lg:block" />

                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-text-dim uppercase tracking-widest font-black shrink-0">
                                Status:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {[
                                  "All",
                                  "Active",
                                  "Sold",
                                  "Pending",
                                  "PENDING_DELETE",
                                ].map((status) => {
                                  const isActive = statusFilter.includes(status);
                                  return (
                                    <button
                                      key={status}
                                      onClick={() => toggleStatusFilter(status)}
                                      className={`px-3 py-1.5 rounded-lg text-[9px] border transition-all font-black uppercase tracking-wider flex items-center gap-1 ${
                                        isActive
                                          ? "bg-amber-primary border-amber-primary text-bg shadow-md"
                                          : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50 hover:bg-surface-3/30"
                                      }`}
                                    >
                                      {status === "Active" && (
                                        <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-bg' : 'bg-emerald-500 animate-pulse'}`} />
                                      )}
                                      <span>
                                        {status === "PENDING_DELETE"
                                          ? "Del Req"
                                          : status}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                            {/* Export CSV button */}
                            <button
                              onClick={() => {
                                const filtered = resaleProperties.filter(matchesResaleFilters);
                                const csvContent =
                                  "data:text/csv;charset=utf-8," +
                                  "ID,Holder Name,Society,Location,Builder,Type,Size(Sqft),BHK,Price,Negotiable,Floor,Age,Possession Status,Possession Date,Status\n" +
                                  filtered
                                    .map(
                                      (p) =>
                                        `${p.id},"${p.propertyHolderName}","${p.societyName}","${p.location}","${p.builderName}","${(p.propertyType || "").replace("FLATS", "Apartments").replace("Apartment", "Apartments")}",${p.sizeSqft},"${(p.bhk || "").includes("BHK") || (p.bhk || "").includes("Penthouse") ? (p.bhk || "").replace("5BHK", "Penthouse") : `${p.bhk || "Standard"} BHK`}",${p.price},${p.isNegotiable},"${p.floorNumber}","${p.propertyAge}","${p.possessionStatus || "N/A"}","${p.possessionDate || "N/A"}",${p.status}`,
                                    )
                                    .join("\n");

                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute(
                                  "download",
                                  `pysync_resale_${new Date().toISOString().split("T")[0]}.csv`,
                                );
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-border-bright bg-surface-2 text-text-dim hover:text-amber-primary hover:border-amber-primary hover:bg-surface-3/30 transition-all shadow-sm"
                              title="Export filtered resales to CSV"
                            >
                              <Download size={12} />
                              <span>Export</span>
                            </button>

                            {/* Show Advanced Filters toggle button */}
                            <button
                              onClick={() =>
                                setShowAdvancedFilters(!showAdvancedFilters)
                              }
                              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all shadow-sm ${
                                showAdvancedFilters
                                  ? "bg-amber-primary border-amber-primary text-bg shadow-md"
                                  : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50 hover:bg-surface-3/30"
                              }`}
                            >
                              <Filter size={12} />
                              <span>{showAdvancedFilters ? "Hide Panel" : "Smart Filters"}</span>
                              <AnimatePresence>
                                {activeResaleFiltersCount > 0 && (
                                  <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-black rounded-full transition-colors ${
                                      showAdvancedFilters
                                        ? "bg-surface-2/90 text-amber-primary"
                                        : "bg-amber-primary text-bg"
                                    }`}
                                  >
                                    {activeResaleFiltersCount}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </button>
                          </div>
                        </div>
                      </div>

                      {showAdvancedFilters && (
                        <motion.div
                          initial={{ opacity: 0, y: -12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-surface/50 backdrop-blur-md p-6 md:p-8 border border-border-dim/40 rounded-3xl shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-20"
                        >
                          {/* Builder Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl relative">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Building2 size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Builder Brand
                              </span>
                            </div>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setIsBuilderDropdownOpen(!isBuilderDropdownOpen)
                                }
                                className="w-full bg-surface-2 border border-border-bright rounded-xl px-3 py-2.5 text-xs text-text-primary outline-none hover:border-amber-primary font-medium flex items-center justify-between transition-colors"
                              >
                                <span>
                                  {builderFilter === "All"
                                    ? "All Builders"
                                    : builderFilter}
                                </span>
                                <ChevronRight
                                  size={14}
                                  className={`rotate-90 transition-transform duration-200 ${isBuilderDropdownOpen ? "rotate-270" : ""} text-text-dim`}
                                />
                              </button>
                              <AnimatePresence>
                                {isBuilderDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border-dim rounded-xl shadow-xl z-50 p-1 max-h-52 overflow-y-auto custom-scrollbar space-y-0.5"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBuilderFilter("All");
                                        setIsBuilderDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${builderFilter === "All" ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                    >
                                      <span>All Builders</span>
                                      {builderFilter === "All" && <Check size={10} />}
                                    </button>
                                    {Array.from(
                                      new Set(
                                        [...projects.map((p) => p.builderName), ...resaleProperties.map((r) => r.builderName)].filter(Boolean)
                                      ),
                                    ).map((name) => (
                                      <button
                                        type="button"
                                        key={name}
                                        onClick={() => {
                                          setBuilderFilter(name);
                                          setIsBuilderDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${builderFilter === name ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                      >
                                        <span>{name}</span>
                                        {builderFilter === name && <Check size={10} />}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Possession Status Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Clock size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Possession Phase
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {[
                                "All",
                                "Ready to Move",
                                "Under Construction",
                                "New Launch",
                              ].map((status) => {
                                const isSel = possessionFilter.includes(status);
                                return (
                                  <button
                                    key={status}
                                    onClick={() => togglePossessionFilter(status)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[9px] border transition-all font-bold ${
                                      isSel
                                        ? "bg-amber-primary border-amber-primary text-bg shadow-sm"
                                        : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50 hover:bg-surface-3/30"
                                    }`}
                                  >
                                    {status}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* BHK Size Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Layers size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Configuration
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK"].map((bhk) => {
                                const isSel = configurationFilter.includes(bhk);
                                return (
                                  <button
                                    key={bhk}
                                    type="button"
                                    onClick={() => toggleConfigurationFilter(bhk)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[9px] border transition-all font-bold ${
                                      isSel
                                        ? "bg-amber-primary border-amber-primary text-bg shadow-sm"
                                        : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50 hover:bg-surface-3/30"
                                    }`}
                                  >
                                    {bhk}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Price Range Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <IndianRupee size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Price (Lakhs)
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[8px] text-text-dim uppercase font-black">
                                  Min Value
                                </span>
                                <input
                                  type="number"
                                  value={priceRangeFilter[0] / 100000}
                                  onChange={(e) =>
                                    setPriceRangeFilter([
                                      Number(e.target.value) * 100000,
                                      priceRangeFilter[1],
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary font-mono font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] text-text-dim uppercase font-black">
                                  Max Value
                                </span>
                                <input
                                  type="number"
                                  value={priceRangeFilter[1] / 100000}
                                  onChange={(e) =>
                                    setPriceRangeFilter([
                                      priceRangeFilter[0],
                                      Number(e.target.value) * 100000,
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Area Range Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Maximize2 size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Area Size (Sq.Ft.)
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[8px] text-text-dim uppercase font-black">
                                  Min Area
                                </span>
                                <input
                                  type="number"
                                  value={areaRangeFilter[0]}
                                  onChange={(e) =>
                                    setAreaRangeFilter([
                                      Number(e.target.value),
                                      areaRangeFilter[1],
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary font-mono font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] text-text-dim uppercase font-black">
                                  Max Area
                                </span>
                                <input
                                  type="number"
                                  value={areaRangeFilter[1]}
                                  onChange={(e) =>
                                    setAreaRangeFilter([
                                      areaRangeFilter[0],
                                      Number(e.target.value),
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bathrooms Filter Card */}
                          <div className="space-y-3 bg-surface-2/40 border border-border-bright p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Bath size={14} className="opacity-90" />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Bathrooms
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {[1, 2, 3, 4, 5].map((count) => {
                                const isSel = bathroomsFilter.includes(count);
                                return (
                                  <button
                                    key={count}
                                    onClick={() => toggleBathroomFilter(count)}
                                    className={`w-8 h-8 rounded-lg text-[10px] border flex items-center justify-center transition-all font-black ${
                                      isSel
                                        ? "bg-amber-primary border-amber-primary text-bg shadow-sm"
                                        : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50 hover:bg-surface-3/30"
                                    }`}
                                  >
                                    {count}+
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Bottom Row Glow and Reset Action */}
                          <div className="col-span-full pt-4 border-t border-border-dim/30 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setPriceRangeFilter([0, 1000000000]);
                                setAreaRangeFilter([0, 100000]);
                                setUnitsRangeFilter([0, 10000]);
                                setPossessionFilter(["All"]);
                                setBathroomsFilter([]);
                                setConfigurationFilter([]);
                                setAssignedToFilter("All");
                                setBuilderFilter("All");
                              }}
                              className="text-[10px] bg-red-500/10 border border-red-500/25 hover:bg-red-500 hover:text-white transition-all text-red-500 px-4 py-2 rounded-xl font-black uppercase tracking-widest"
                            >
                              Reset Active Filters
                            </button>
                          </div>
                        </motion.div>
                      )}

                      <AnimatePresence mode="popLayout">
                        {viewMode === "map" ? (
                          <motion.div
                            key="map"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            className="w-full"
                          >
                            <ProjectMapView
                              items={resaleProperties.filter(matchesResaleFilters)}
                              onSelectItem={(id) => {
                                const p = resaleProperties.find(
                                  (prop) => prop.id === id,
                                );
                                if (p) setSelectedResale(p);
                              }}
                              type="resale"
                              selectedItemId={selectedMapItemId}
                            />
                          </motion.div>
                        ) : viewMode === "grid" ? (
                          <motion.div
                            key="grid"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            className="w-full"
                          >
                            <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-6">
                              <AnimatePresence mode="popLayout">
                                {resaleProperties
                                  .filter(matchesResaleFilters)
                                  .map((p) => (
                                    <motion.div
                                      layout
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      transition={{ duration: 0.2 }}
                                      key={p.id}
                                      onClick={() => setSelectedResale(p)}
                                      className="bg-surface border border-border-dim rounded-2xl overflow-hidden hover:border-amber-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-xl"
                                    >
                                      <div className="aspect-video bg-surface-2 relative overflow-hidden">
                                        <InlineImageCarousel images={p.images} title={p.societyName} heightClass="h-full w-full" />
                                        <div className="absolute top-3 right-3 bg-bg/80 px-2 py-1 rounded-lg text-[10px] font-bold text-amber-primary border border-border-dim uppercase tracking-wider">
                                          {(p.propertyType || "")
                                            .replace("FLATS", "Apartments")
                                            .replace("Apartment", "Apartments")}
                                        </div>
                                      </div>
                                      <div className="p-4 space-y-3">
                                        <div>
                                          <h3 className="font-bold text-text-primary group-hover:text-amber-primary transition-colors line-clamp-1">
                                            {p.societyName}
                                          </h3>
                                          <p className="text-[10px] text-text-dim flex items-center gap-1 mt-1 font-medium">
                                            <MapPin size={10} /> {p.location}
                                          </p>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-border-dim/50">
                                          <span className="text-sm font-black text-text-primary">
                                            {formatPrice(p.price)}
                                          </span>
                                          <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                                            {(p.bhk || "").includes("BHK") ||
                                            (p.bhk || "").includes("Penthouse")
                                              ? (p.bhk || "").replace("5BHK", "Penthouse")
                                              : `${p.bhk || "Standard"} BHK`}
                                          </span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                              </AnimatePresence>
                            </motion.div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="table"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            className="hidden md:block bg-surface/50 backdrop-blur-xl border border-border-dim/50 rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative group/container"
                          >
                            {/* Decorative background effects */}
                            <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-primary/5 rounded-full blur-[120px] pointer-events-none" />
                            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
                            
                            <div className="overflow-x-auto no-scrollbar relative z-10">
                            <table className="w-full text-left border-separate border-spacing-0 min-w-[1200px]">
                              <thead>
                                <tr className="bg-surface-2/40 backdrop-blur-md">
                                  <th className="px-8 py-6 text-[10px] text-text-dim uppercase tracking-[0.3em] font-black border-b border-border-dim/50 first:rounded-tl-[32px] whitespace-nowrap group/th cursor-help">
                                    <div className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-primary group-hover/th:animate-ping" />
                                      <span>Society & Asset</span>
                                    </div>
                                  </th>
                                  <th className="px-8 py-6 text-[10px] text-text-dim uppercase tracking-[0.3em] font-black border-b border-border-dim/50 whitespace-nowrap group/th cursor-help hidden sm:table-cell">
                                    <div className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover/th:animate-ping" />
                                      <span>Specifications</span>
                                    </div>
                                  </th>
                                  <th className="px-8 py-6 text-[10px] text-text-dim uppercase tracking-[0.3em] font-black border-b border-border-dim/50 whitespace-nowrap group/th cursor-help hidden md:table-cell">
                                    <div className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover/th:animate-ping" />
                                      <span>Timeline</span>
                                    </div>
                                  </th>
                                  <th className="px-8 py-6 text-[10px] text-text-dim uppercase tracking-[0.3em] font-black border-b border-border-dim/50 whitespace-nowrap group/th cursor-help hidden md:table-cell">
                                    <div className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover/th:animate-ping" />
                                      <span>Location</span>
                                    </div>
                                  </th>
                                  <th className="px-8 py-6 text-[10px] text-text-dim uppercase tracking-[0.3em] font-black border-b border-border-dim/50 whitespace-nowrap group/th cursor-help">
                                    <div className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover/th:animate-ping" />
                                      <span>Valuation</span>
                                    </div>
                                  </th>
                                  <th className="px-8 py-6 text-[10px] text-text-dim uppercase tracking-[0.3em] font-black border-b border-border-dim/50 whitespace-nowrap group/th cursor-help">
                                    <div className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-primary group-hover/th:animate-ping" />
                                      <span>Lifecycle</span>
                                    </div>
                                  </th>
                                  <th className="px-8 py-6 text-[10px] text-text-dim uppercase tracking-[0.3em] font-black text-right border-b border-border-dim/50 last:rounded-tr-[32px] whitespace-nowrap">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-dim/10">
                                {(() => {
                                  const filtered = resaleProperties.filter(matchesResaleFilters);

                                  if (filtered.length === 0) {
                                    return (
                                      <tr>
                                        <td
                                          colSpan={7}
                                          className="p-32 text-center"
                                        >
                                          <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                                            <div className="w-24 h-24 bg-surface-2 rounded-full flex items-center justify-center text-text-dim/20 border border-border-dim/50 shadow-inner group/empty">
                                              <Search
                                                size={48}
                                                className="group-hover/empty:scale-110 transition-transform"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <h4 className="text-sm font-bold text-text-primary uppercase tracking-[0.4em]">
                                                Asset Search Null
                                              </h4>
                                              <p className="text-[10px] text-text-dim font-medium leading-relaxed opacity-60 uppercase tracking-widest">
                                                {searchQuery
                                                  ? `No projects localized matching vector "${searchQuery}"`
                                                  : "The database registry is currently clear of assets."}
                                              </p>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  }

                                  return filtered.map((p) => {
                                    const cellPadding = compactMode
                                      ? "px-8 py-4"
                                      : "px-8 py-6";
                                    return (
                                      <tr
                                        key={p.id}
                                        className="group transition-all duration-500 hover:bg-white/[0.02] cursor-pointer"
                                        onClick={() => setSelectedResale(p)}
                                      >
                                        <td
                                          className={`${cellPadding} border-b border-border-dim/10 group-last:border-none relative overflow-hidden min-w-[280px] transition-colors`}
                                        >
                                          <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-14 h-14 rounded-[20px] bg-amber-primary/5 flex items-center justify-center text-amber-primary border border-amber-primary/10 group-hover:bg-amber-primary/10 group-hover:scale-105 group-hover:-rotate-3 transition-all duration-500 shrink-0 shadow-lg shadow-amber-primary/5">
                                              <Home size={24} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-[15px] font-bold text-text-primary group-hover:text-amber-primary transition-colors leading-tight truncate">
                                                {p.societyName}
                                              </span>
                                              <div className="flex items-center gap-2 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <User size={10} className="text-amber-primary" />
                                                <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest truncate">
                                                  {p.propertyHolderName}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td
                                          className={`${cellPadding} border-b border-border-dim/10 group-last:border-none hidden sm:table-cell transition-colors group-hover:bg-blue-500/[0.01]`}
                                        >
                                          <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-text-primary tracking-tight">
                                                {(p.bhk || "").includes("BHK") ||
                                                (p.bhk || "").includes("Penthouse")
                                                  ? (p.bhk || "").replace(
                                                      "5BHK",
                                                      "Penthouse",
                                                    )
                                                  : `${p.bhk || "Standard"} BHK`}
                                              </span>
                                              <span className="w-1 h-1 rounded-full bg-border-dim" />
                                              <span className="text-[10px] font-black text-text-dim uppercase tracking-widest opacity-60">
                                                {(p.propertyType || "")
                                                  .replace("FLATS", "Apartments")
                                                  .replace(
                                                    "Apartment",
                                                    "Apartments",
                                                  )}
                                              </span>
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface-2 border border-border-bright/30 rounded-lg w-fit group/size hover:border-blue-500/30 transition-colors">
                                              <Maximize size={10} className="text-blue-500/50 group-hover/size:text-blue-500 transition-colors" />
                                              <span className="text-[10px] font-mono font-bold text-text-secondary tracking-tighter uppercase whitespace-nowrap">
                                                {p.sizeSqft} Sq.Ft.
                                              </span>
                                            </div>
                                          </div>
                                        </td>
                                        <td
                                          className={`${cellPadding} border-b border-border-dim/10 group-last:border-none hidden md:table-cell transition-colors group-hover:bg-emerald-500/[0.01]`}
                                        >
                                          <div className="flex flex-col gap-2">
                                            <span
                                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border transition-all shadow-sm w-fit ${
                                                p.possessionStatus ===
                                                "Ready to Move"
                                                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500 shadow-emerald-500/5"
                                                  : "border-amber-500/20 bg-amber-500/5 text-amber-500 shadow-amber-500/5"
                                              }`}
                                            >
                                              <div className={`w-1.5 h-1.5 rounded-full ${p.possessionStatus === "Ready to Move" ? "bg-emerald-500" : "bg-amber-500"}`} />
                                              {p.possessionStatus || "N/A"}
                                            </span>
                                            {p.possessionDate && (
                                              <div className="flex items-center gap-2 text-[9px] text-text-dim font-black uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">
                                                <Clock size={10} className="text-amber-primary" />
                                                <span>
                                                  {(() => {
                                                    const target = new Date(
                                                      p.possessionDate,
                                                    );
                                                    const now = new Date();
                                                    const diffDays = Math.ceil(
                                                      (target.getTime() -
                                                        now.getTime()) /
                                                        (1000 * 60 * 60 * 24),
                                                    );
                                                    if (diffDays > 0)
                                                      return `${diffDays} Day Cycle`;
                                                    if (diffDays === 0)
                                                      return "Arrival Today";
                                                    return target.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                                                  })()}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                        <td
                                          className={`${cellPadding} border-b border-border-dim/10 group-last:border-none hidden md:table-cell min-w-[200px] transition-colors group-hover:bg-indigo-500/[0.01]`}
                                        >
                                          <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.location)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="group/loc flex flex-col gap-1 w-fit"
                                          >
                                            <div className="flex items-center gap-2 text-[11px] text-text-dim font-bold tracking-tight hover:text-text-primary transition-colors">
                                              <div className="p-1.5 rounded-lg bg-surface-2 border border-border-dim group-hover/loc:bg-indigo-500/10 group-hover/loc:text-indigo-400 group-hover/loc:scale-110 transition-all">
                                                <MapPin size={10} />
                                              </div>
                                              <span className="line-clamp-1 group-hover/loc:underline underline-offset-4 decoration-indigo-500/30">
                                                {p.location}
                                              </span>
                                            </div>
                                            <span className="text-[8px] text-text-dim uppercase tracking-[0.2em] font-black opacity-30 mt-1 pl-7 group-hover/loc:opacity-60 transition-opacity">Geo-Verified</span>
                                          </a>
                                        </td>
                                        <td
                                          className={`${cellPadding} border-b border-border-dim/10 group-last:border-none transition-colors group-hover:bg-rose-500/[0.01]`}
                                        >
                                          <div className="flex flex-col gap-1">
                                            <span className="text-[15px] font-mono font-black text-text-primary tracking-tighter">
                                              {formatPrice(p.price)}
                                            </span>
                                            <div className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest w-fit border ${p.isNegotiable === "YES" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500" : "border-border-dim/30 bg-surface-2 text-text-dim opacity-50"}`}>
                                              {p.isNegotiable}
                                            </div>
                                          </div>
                                        </td>
                                        <td
                                          className={`${cellPadding} border-b border-border-dim/10 group-last:border-none transition-colors group-hover:bg-amber-primary/[0.01]`}
                                        >
                                          <span
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border transition-all shadow-sm ${
                                              p.status === "Active"
                                                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500 shadow-emerald-500/10 shadow-sm"
                                                : p.status === "Sold"
                                                  ? "border-blue-500/30 bg-blue-500/5 text-blue-500 shadow-blue-500/10 shadow-sm"
                                                  : p.status === "PENDING_DELETE"
                                                    ? "border-red-500/50 bg-red-500/15 text-red-400 shadow-red-500/10 shadow-sm animate-breathe"
                                                    : "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-amber-500/15 shadow-sm animate-breathe"
                                            }`}
                                          >
                                            <div
                                              className={`w-1.5 h-1.5 rounded-full ${
                                                p.status === "Active"
                                                  ? "bg-emerald-500 animate-pulse"
                                                  : p.status === "Sold"
                                                    ? "bg-blue-500"
                                                    : p.status === "PENDING_DELETE"
                                                      ? "bg-red-400 animate-pulse"
                                                      : "bg-amber-400 animate-breathe-dot"
                                              }`}
                                            />
                                            {p.status === "PENDING_DELETE" ? "DECOMMISSIONING" : p.status}
                                          </span>
                                        </td>
                                        <td
                                          className={`${cellPadding} border-b border-border-dim/10 group-last:border-none text-right transition-colors group-hover:bg-red-500/[0.01]`}
                                        >
                                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedResale(p);
                                              }}
                                              className="w-10 h-10 flex items-center justify-center text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-2xl transition-all border border-transparent hover:border-amber-primary/20 active:scale-95 shadow-none hover:shadow-lg hover:shadow-amber-primary/5"
                                              title="Inspect Data"
                                            >
                                              <Eye size={18} />
                                            </button>
                                            {hasPermission(user, "EDIT_RESALE") && user?.role === "admin" && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingResale(p);
                                                  setEntryType("resale");
                                                  setIsModalOpen(true);
                                                }}
                                                className="w-10 h-10 flex items-center justify-center text-text-dim hover:text-blue-500 hover:bg-blue-500/10 rounded-2xl transition-all border border-transparent hover:border-blue-500/20 active:scale-95 shadow-none hover:shadow-lg hover:shadow-blue-500/5"
                                                title="Modify Registry"
                                              >
                                                <Edit size={18} />
                                              </button>
                                            )}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setResaleToDelete(p);
                                              }}
                                              className="w-10 h-10 flex items-center justify-center text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20 active:scale-95 shadow-none hover:shadow-lg hover:shadow-red-500/5"
                                              title="Delete Entry"
                                            >
                                              <Trash2 size={18} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                       )}
                     </AnimatePresence>
                    </motion.div>
                  )}

                  {activeTab === "media" && (
                    <MediaExplorer
                      projects={projects}
                      user={user}
                      reports={reports}
                      logs={logs}
                      hasPermission={hasPermission}
                      setSelectedProject={setSelectedProject}
                      setEditingProject={setEditingProject}
                      setIsModalOpen={setIsModalOpen}
                      setProjectToDelete={setProjectToDelete}
                      setSelectedBuilder={setSelectedBuilder}
                      setActiveTab={setActiveTab}
                      setSelectedReport={setSelectedReport}
                      setIsReportEditing={setIsReportEditing}
                      request={request}
                      showToast={showToast}
                      playSound={playSound}
                      setProjects={setProjects}
                      LogsViewComponent={LogsView}
                    />
                  )}

                  {activeTab === "approvals" && (
                    <motion.div
                      key="approvals"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 w-full"
                    >
                      <AnimatePresence mode="popLayout">
                        {approvals.map((a) => (
                          <motion.div
                            layout
                            key={a.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{
                              opacity: 0,
                              x:
                                completingTaskId?.id === a.id
                                  ? completingTaskId.action === "approve"
                                    ? 20
                                    : -20
                                  : 0,
                              scale: 0.95,
                              filter: "blur(4px)",
                            }}
                            transition={{ duration: 0.35, ease: "anticipate" }}
                            className={`relative bg-surface border border-border-dim p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden transition-colors duration-500 ${
                              completingTaskId?.id === a.id
                                ? completingTaskId.action === "approve"
                                  ? "bg-green-500/5 border-green-500/30"
                                  : "bg-red-500/5 border-red-500/30"
                                : ""
                            }`}
                          >
                            {/* Success/Reject Overlay Animation */}
                            <AnimatePresence>
                              {completingTaskId?.id === a.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-0 z-10 flex items-center justify-center bg-surface/40 "
                                >
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1.2 }}
                                    className={`p-4 rounded-full ${completingTaskId.action === "approve" ? "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"}`}
                                  >
                                    {completingTaskId.action === "approve" ? (
                                      <Check size={32} strokeWidth={3} />
                                    ) : (
                                      <X size={32} strokeWidth={3} />
                                    )}
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="relative z-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-[8px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest ${
                                    a.type === "User Registration Approval" || a.type === "User Registration" || a.type === "New User Registration"
                                      ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                                      : a.type === "Edit Request"
                                        ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                        : a.type === "New Project Approval"
                                          ? "border-green-500/30 bg-green-500/10 text-green-500"
                                          : "border-red-500/30 bg-red-500/10 text-red-500"
                                  }`}
                                >
                                  {a.type === "User Registration Approval" ? "User Registration" : a.type || "Deletion Request"}
                                </span>
                                {(!a.status || a.status === "Pending" || a.status === "Pending Approval") && (
                                  <span className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm animate-breathe">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-breathe-dot" />
                                    <span>Pending Approval</span>
                                  </span>
                                )}
                                <div className="text-sm font-bold text-text-primary">
                                  {a.projectTitle || (a.userName ? `${a.userName} (${a.userEmail || a.userRole || "User"})` : "User Registration")}
                                </div>
                              </div>
                              <div className="text-[10px] text-text-dim uppercase tracking-widest">
                                Requested by {a.requestedBy} ·{" "}
                                {new Date(a.requestedAt).toLocaleString()}
                              </div>
                              {(a.type === "Edit Request" || a.type === "User Registration Approval" || a.type === "User Registration" || a.type === "New User Registration") && a.details && (
                                <div className="mt-2 p-3 bg-surface-2 rounded-xl border border-border-bright text-xs text-text-secondary leading-relaxed font-semibold max-w-xl">
                                  <span className="font-extrabold text-text-primary block text-[9px] uppercase tracking-wider mb-1 text-amber-500">
                                    {a.type?.includes("User") ? "Registration Details:" : "Suggested Correction / Reported Mistake:"}
                                  </span>
                                  {a.details}
                                </div>
                              )}
                            </div>
                            {a.status && a.status !== "Pending" ? (
                              <div className="flex gap-2 w-full sm:w-auto relative z-0">
                                <span
                                  className={`px-4 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest ${
                                    a.status === "Approved"
                                      ? "border-green-500/40 bg-green-500/10 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                                      : "border-red-500/40 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                                  }`}
                                >
                                  {a.status}
                                </span>
                              </div>
                            ) : hasPermission(user, "APPROVE_DELETIONS") || (user?.role === "team_leader" && a.type === "New Project Approval") || user?.role === "admin" ? (
                              <div className="flex gap-2 w-full sm:w-auto relative z-0">
                                <button
                                  disabled={!!completingTaskId}
                                  onClick={() =>
                                    handleApproval(a.id, "approve")
                                  }
                                  className="flex-1 sm:flex-none bg-green-500/10 text-green-500 border border-green-500/30 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-green-500 hover:text-bg transition-all disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={!!completingTaskId}
                                  onClick={() => handleApproval(a.id, "reject")}
                                  className="flex-1 sm:flex-none bg-red-500/10 text-red-500 border border-red-500/30 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-bg transition-all disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-text-dim uppercase tracking-widest italic">
                                Awaiting Admin Signature
                              </span>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {approvals.length === 0 && (
                        <div className="text-center p-12 bg-surface border border-border-dim rounded-xl text-text-dim text-xs italic">
                          All clear — no pending approvals.
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "reports" && (
                    <motion.div
                      key="reports"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full"
                    >
                      <ReportsView
                        reports={reports}
                        users={users}
                        onCreate={createReport}
                        onUpdate={updateReport}
                        onDelete={deleteReport}
                        user={user}
                        selectedReport={selectedReport}
                        setSelectedReport={setSelectedReport}
                        isEditing={isReportEditing}
                        setIsEditing={setIsReportEditing}
                      />
                    </motion.div>
                  )}

                  {activeTab === "users" &&
                    (user?.role === "admin" ||
                      user?.role === "team_leader") && (
                      <motion.div
                        key="users"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3.5 w-full font-sans"
                      >
                        {/* Summary Cards & Controls */}
                        {(() => {
                          const totalMembers = users.length;
                          const totalAdmins = users.filter((u) => u.role === "admin").length;
                          const totalLeaders = users.filter((u) => u.role === "team_leader").length;
                          const totalActiveNow = users.filter((u) => u.lastActive && (new Date().getTime() - new Date(u.lastActive).getTime() < 300000)).length;

                          const filtered = users.filter((u) => {
                            const matchesSearch =
                              u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.role.toLowerCase().includes(searchQuery.toLowerCase());
                            const matchesTeam = !teamFilter || u.teamLeaderId === teamFilter;
                            const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
                            return matchesSearch && matchesTeam && matchesRole;
                          });

                          const totalPages = Math.max(1, Math.ceil(filtered.length / userPageSize));
                          const safePage = Math.min(userPage, totalPages);
                          const startIndex = (safePage - 1) * userPageSize;
                          const paginatedUsers = filtered.slice(startIndex, startIndex + userPageSize);

                          return (
                            <>
                              {/* Top Stat Summary Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-3 rounded-2xl bg-surface/50 backdrop-blur-xl border border-border-dim/50 flex items-center gap-3 shadow-sm">
                                  <div className="p-2 rounded-xl bg-amber-primary/10 text-amber-primary border border-amber-primary/20 shrink-0">
                                    <UsersIcon size={16} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] uppercase font-black text-text-dim tracking-wider">Total Members</span>
                                    <span className="text-sm font-black text-text-primary font-mono">{totalMembers}</span>
                                  </div>
                                </div>

                                <div className="p-3 rounded-2xl bg-surface/50 backdrop-blur-xl border border-border-dim/50 flex items-center gap-3 shadow-sm">
                                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                    <ShieldCheck size={16} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] uppercase font-black text-text-dim tracking-wider">Admins</span>
                                    <span className="text-sm font-black text-amber-500 font-mono">{totalAdmins}</span>
                                  </div>
                                </div>

                                <div className="p-3 rounded-2xl bg-surface/50 backdrop-blur-xl border border-border-dim/50 flex items-center gap-3 shadow-sm">
                                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 shrink-0">
                                    <UserCheck size={16} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] uppercase font-black text-text-dim tracking-wider">Team Leaders</span>
                                    <span className="text-sm font-black text-purple-400 font-mono">{totalLeaders}</span>
                                  </div>
                                </div>

                                <div className="p-3 rounded-2xl bg-surface/50 backdrop-blur-xl border border-border-dim/50 flex items-center gap-3 shadow-sm">
                                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                    <Activity size={16} className="animate-pulse" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] uppercase font-black text-text-dim tracking-wider">Active Online</span>
                                    <span className="text-sm font-black text-emerald-400 font-mono">{totalActiveNow}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Filter & Toolbar Header */}
                              <div className="p-3 rounded-2xl bg-surface/60 backdrop-blur-xl border border-border-dim/50 flex flex-wrap items-center justify-between gap-3 shadow-md">
                                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                                  {/* Search Bar */}
                                  <div className="relative flex-1">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                    <input
                                      type="text"
                                      value={searchQuery}
                                      onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setUserPage(1);
                                      }}
                                      placeholder="Search name, email, or role..."
                                      className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-text-primary placeholder:text-text-dim/50 focus:outline-none focus:border-amber-primary/50 transition-all"
                                    />
                                    {searchQuery && (
                                      <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-white"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>

                                  {/* Custom Role Dropdown */}
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsUserRoleDropdownOpen(!isUserRoleDropdownOpen);
                                        setIsUserTeamDropdownOpen(false);
                                        setIsUserPageSizeDropdownOpen(false);
                                      }}
                                      className={`px-3 py-1.5 rounded-xl bg-black/50 border text-xs text-text-primary flex items-center gap-2 transition-all cursor-pointer ${
                                        userRoleFilter !== "all"
                                          ? "border-amber-primary/50 text-amber-primary bg-amber-primary/5 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                                          : "border-white/10 hover:border-white/20 hover:bg-black/70"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        {userRoleFilter === "admin" && <ShieldCheck size={13} className="text-amber-500" />}
                                        {userRoleFilter === "team_leader" && <UsersIcon size={13} className="text-purple-400" />}
                                        {userRoleFilter === "employee" && <User size={13} className="text-blue-400" />}
                                        {userRoleFilter === "all" && <Filter size={13} className="text-text-dim" />}
                                        <span className="font-semibold">
                                          {userRoleFilter === "all"
                                            ? "All Roles"
                                            : userRoleFilter === "admin"
                                            ? "Admin"
                                            : userRoleFilter === "team_leader"
                                            ? "Team Leader"
                                            : "Employee"}
                                        </span>
                                      </div>
                                      <ChevronDown
                                        size={12}
                                        className={`text-text-dim transition-transform duration-200 ${
                                          isUserRoleDropdownOpen ? "rotate-180 text-amber-primary" : ""
                                        }`}
                                      />
                                    </button>

                                    <AnimatePresence>
                                      {isUserRoleDropdownOpen && (
                                        <>
                                          <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setIsUserRoleDropdownOpen(false)}
                                          />
                                          <motion.div
                                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-0 mt-1.5 w-48 rounded-2xl bg-surface/95 backdrop-blur-2xl border border-border-dim/60 shadow-2xl z-40 p-1.5 space-y-0.5 overflow-hidden"
                                          >
                                            <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-text-dim border-b border-border-dim/30 mb-1">
                                              Filter By Role
                                            </div>

                                            {[
                                              { id: "all", label: "All Roles", icon: Filter, color: "text-text-dim", count: users.length },
                                              { id: "admin", label: "Admin", icon: ShieldCheck, color: "text-amber-500", count: users.filter(u => u.role === "admin").length },
                                              { id: "team_leader", label: "Team Leader", icon: UsersIcon, color: "text-purple-400", count: users.filter(u => u.role === "team_leader").length },
                                              { id: "employee", label: "Employee", icon: User, color: "text-blue-400", count: users.filter(u => u.role === "employee").length },
                                            ].map((roleItem) => {
                                              const Icon = roleItem.icon;
                                              const isSelected = userRoleFilter === roleItem.id;
                                              return (
                                                <button
                                                  key={roleItem.id}
                                                  onClick={() => {
                                                    setUserRoleFilter(roleItem.id);
                                                    setUserPage(1);
                                                    setIsUserRoleDropdownOpen(false);
                                                  }}
                                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                                                    isSelected
                                                      ? "bg-amber-primary/15 text-amber-primary font-bold border border-amber-primary/30"
                                                      : "hover:bg-white/5 text-text-secondary hover:text-text-primary border border-transparent"
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <Icon size={13} className={roleItem.color} />
                                                    <span>{roleItem.label}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-black/40 text-text-dim">
                                                      {roleItem.count}
                                                    </span>
                                                    {isSelected && <Check size={12} className="text-amber-primary" />}
                                                  </div>
                                                </button>
                                              );
                                            })}
                                          </motion.div>
                                        </>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Custom Team / Team Leader Filter Dropdown */}
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsUserTeamDropdownOpen(!isUserTeamDropdownOpen);
                                        setIsUserRoleDropdownOpen(false);
                                        setIsUserPageSizeDropdownOpen(false);
                                      }}
                                      className={`px-3 py-1.5 rounded-xl bg-black/50 border text-xs text-text-primary flex items-center gap-2 transition-all cursor-pointer ${
                                        teamFilter
                                          ? "border-purple-500/50 text-purple-300 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                                          : "border-white/10 hover:border-white/20 hover:bg-black/70"
                                      }`}
                                    >
                                      <UsersIcon size={13} className={teamFilter ? "text-purple-400" : "text-text-dim"} />
                                      <span className="font-semibold truncate max-w-[120px]">
                                        {teamFilter
                                          ? users.find((u) => u.id === teamFilter)?.name || "Team Filter"
                                          : "All Teams"}
                                      </span>
                                      {teamFilter && (
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTeamFilter(null);
                                            setUserPage(1);
                                          }}
                                          className="hover:text-white p-0.5 rounded-md hover:bg-white/10 transition-colors ml-0.5"
                                          title="Clear team filter"
                                        >
                                          <X size={11} />
                                        </span>
                                      )}
                                      <ChevronDown
                                        size={12}
                                        className={`text-text-dim transition-transform duration-200 ${
                                          isUserTeamDropdownOpen ? "rotate-180 text-purple-400" : ""
                                        }`}
                                      />
                                    </button>

                                    <AnimatePresence>
                                      {isUserTeamDropdownOpen && (
                                        <>
                                          <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setIsUserTeamDropdownOpen(false)}
                                          />
                                          <motion.div
                                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-0 mt-1.5 w-56 rounded-2xl bg-surface/95 backdrop-blur-2xl border border-border-dim/60 shadow-2xl z-40 p-1.5 space-y-0.5 overflow-hidden"
                                          >
                                            <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-text-dim border-b border-border-dim/30 mb-1 flex items-center justify-between">
                                              <span>Filter By Team Leader</span>
                                              {teamFilter && (
                                                <button
                                                  onClick={() => {
                                                    setTeamFilter(null);
                                                    setUserPage(1);
                                                    setIsUserTeamDropdownOpen(false);
                                                  }}
                                                  className="text-purple-400 hover:underline cursor-pointer lowercase"
                                                >
                                                  reset
                                                </button>
                                              )}
                                            </div>

                                            <button
                                              onClick={() => {
                                                setTeamFilter(null);
                                                setUserPage(1);
                                                setIsUserTeamDropdownOpen(false);
                                              }}
                                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                                                !teamFilter
                                                  ? "bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30"
                                                  : "hover:bg-white/5 text-text-secondary hover:text-text-primary border border-transparent"
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <UsersIcon size={13} className="text-purple-400" />
                                                <span>All Teams / Members</span>
                                              </div>
                                              {!teamFilter && <Check size={12} className="text-purple-400" />}
                                            </button>

                                            <div className="my-1 border-t border-border-dim/20" />

                                            {users
                                              .filter((u) => u.role === "team_leader" || u.role === "admin")
                                              .map((tl) => {
                                                const memberCount = users.filter((u) => u.teamLeaderId === tl.id).length;
                                                const isSelected = teamFilter === tl.id;
                                                return (
                                                  <button
                                                    key={tl.id}
                                                    onClick={() => {
                                                      setTeamFilter(tl.id);
                                                      setUserPage(1);
                                                      setIsUserTeamDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                                                      isSelected
                                                        ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40"
                                                        : "hover:bg-white/5 text-text-secondary hover:text-text-primary border border-transparent"
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                      <div className="w-5 h-5 rounded-md bg-surface-2 border border-white/10 flex items-center justify-center text-[10px] font-bold text-purple-400 overflow-hidden shrink-0">
                                                        {tl.profilePicture ? (
                                                          <img src={tl.profilePicture} alt={tl.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                          tl.name?.[0] || "T"
                                                        )}
                                                      </div>
                                                      <span className="truncate">{tl.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-text-dim">
                                                        {memberCount}
                                                      </span>
                                                      {isSelected && <Check size={12} className="text-purple-400" />}
                                                    </div>
                                                  </button>
                                                );
                                              })}
                                          </motion.div>
                                        </>
                                      )}
                                    </AnimatePresence>
                                  </div>

                                  {/* Custom Rows Per Page Dropdown */}
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsUserPageSizeDropdownOpen(!isUserPageSizeDropdownOpen);
                                        setIsUserRoleDropdownOpen(false);
                                        setIsUserTeamDropdownOpen(false);
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 hover:border-white/20 text-xs text-text-dim hover:text-text-primary flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-70">Show:</span>
                                      <span className="font-bold font-mono text-amber-500">{userPageSize}</span>
                                      <ChevronDown
                                        size={11}
                                        className={`text-text-dim transition-transform duration-200 ${
                                          isUserPageSizeDropdownOpen ? "rotate-180 text-amber-500" : ""
                                        }`}
                                      />
                                    </button>

                                    <AnimatePresence>
                                      {isUserPageSizeDropdownOpen && (
                                        <>
                                          <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setIsUserPageSizeDropdownOpen(false)}
                                          />
                                          <motion.div
                                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-1.5 w-32 rounded-2xl bg-surface/95 backdrop-blur-2xl border border-border-dim/60 shadow-2xl z-40 p-1.5 space-y-0.5 overflow-hidden"
                                          >
                                            <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-text-dim border-b border-border-dim/30 mb-1">
                                              Rows Per Page
                                            </div>

                                            {[5, 6, 10, 15, 25, 50].map((size) => {
                                              const isSelected = userPageSize === size;
                                              return (
                                                <button
                                                  key={size}
                                                  onClick={() => {
                                                    setUserPageSize(size);
                                                    setUserPage(1);
                                                    setIsUserPageSizeDropdownOpen(false);
                                                  }}
                                                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                                                    isSelected
                                                      ? "bg-amber-primary/15 text-amber-primary font-bold border border-amber-primary/30"
                                                      : "hover:bg-white/5 text-text-secondary hover:text-text-primary border border-transparent"
                                                  }`}
                                                >
                                                  <span>{size} rows</span>
                                                  {isSelected && <Check size={12} className="text-amber-primary" />}
                                                </button>
                                              );
                                            })}
                                          </motion.div>
                                        </>
                                      )}
                                    </AnimatePresence>
                                  </div>

                                  {/* View Layout Mode Selector */}
                                  <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 text-text-dim">
                                    <button
                                      onClick={() => {
                                        setUserViewMode("table");
                                        playSound("click");
                                      }}
                                      className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                                        userViewMode === "table"
                                          ? "bg-amber-primary text-black font-extrabold shadow"
                                          : "hover:text-white"
                                      }`}
                                      title="Table View (Press 'T')"
                                    >
                                      <List size={13} />
                                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/20 opacity-70">T</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setUserViewMode("grid");
                                        playSound("click");
                                      }}
                                      className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                                        userViewMode === "grid"
                                          ? "bg-amber-primary text-black font-extrabold shadow"
                                          : "hover:text-white"
                                      }`}
                                      title="Grid Cards View (Press 'G')"
                                    >
                                      <LayoutGrid size={13} />
                                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/20 opacity-70">G</span>
                                    </button>
                                  </div>

                                  {/* Build Team Button */}
                                  {hasPermission(user, "MANAGE_TEAM") && (
                                    <button
                                      onClick={() => {
                                        setSelectedUsersForTeam([]);
                                        setIsBuildTeamModalOpen(true);
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                    >
                                      <UserPlus size={13} />
                                      <span className="hidden sm:inline">Build Team</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Main Users Table / Cards Container */}
                              <div className="bg-surface/50 backdrop-blur-xl border border-border-dim/50 rounded-2xl overflow-hidden shadow-2xl relative">
                                <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-primary/5 rounded-full blur-[120px] pointer-events-none" />

                                {filtered.length === 0 ? (
                                  <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                                    <div className="w-14 h-14 bg-surface-2 rounded-full flex items-center justify-center text-text-dim/40 border border-border-dim/50">
                                      <Search size={24} />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-widest">
                                        No matching users
                                      </h4>
                                      <p className="text-[11px] text-text-dim max-w-xs mx-auto">
                                        {searchQuery || userRoleFilter !== "all" || teamFilter
                                          ? "Try adjusting your search query or clear active filters."
                                          : "No user accounts registered in the database."}
                                      </p>
                                    </div>
                                  </div>
                                ) : userViewMode === "table" ? (
                                  <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
                                      <thead>
                                        <tr className="bg-surface-2/60 backdrop-blur-md">
                                          <th className="px-4 py-2.5 text-[9px] text-text-dim uppercase tracking-[0.25em] font-black border-b border-border-dim/50">
                                            Member Identification
                                          </th>
                                          <th className="px-4 py-2.5 text-[9px] text-text-dim uppercase tracking-[0.25em] font-black border-b border-border-dim/50">
                                            Email & Channels
                                          </th>
                                          <th className="px-4 py-2.5 text-[9px] text-text-dim uppercase tracking-[0.25em] font-black border-b border-border-dim/50">
                                            Authority Role
                                          </th>
                                          <th className="px-4 py-2.5 text-[9px] text-text-dim uppercase tracking-[0.25em] font-black text-right border-b border-border-dim/50 pr-5">
                                            Control
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border-dim/10">
                                        {paginatedUsers.map((u) => {
                                          const isOnline =
                                            u.lastActive &&
                                            new Date().getTime() - new Date(u.lastActive).getTime() < 300000;

                                          return (
                                            <tr
                                              key={u.id}
                                              className="group transition-all duration-300 hover:bg-white/[0.03]"
                                            >
                                              <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none">
                                                <div className="flex items-center gap-3">
                                                  <div className="relative shrink-0">
                                                    <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border-bright flex items-center justify-center text-xs font-extrabold text-amber-primary shadow overflow-hidden">
                                                      {u.profilePicture ? (
                                                        <img
                                                          src={u.profilePicture}
                                                          alt={u.name}
                                                          className="w-full h-full object-cover"
                                                        />
                                                      ) : (
                                                        u.name?.[0] || "?"
                                                      )}
                                                    </div>
                                                    <div
                                                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface shadow ${
                                                        isOnline ? "bg-emerald-500 animate-pulse" : "bg-text-dim/40"
                                                      }`}
                                                      title={isOnline ? "Online now" : "Offline"}
                                                    />
                                                  </div>
                                                  <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors truncate">
                                                      {u.name}
                                                    </span>
                                                    <span className="text-[9px] text-text-dim font-mono tracking-tight opacity-75">
                                                      ID: {u.id.slice(0, 8)}
                                                    </span>
                                                  </div>
                                                </div>
                                              </td>

                                              <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none">
                                                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                  <Mail size={11} className="text-text-dim shrink-0" />
                                                  <span className="font-mono text-[11px] truncate max-w-[180px]">{u.email}</span>
                                                </div>
                                              </td>

                                              <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                                      u.role === "admin"
                                                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                                        : u.role === "team_leader"
                                                        ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                                                        : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                                    }`}
                                                  >
                                                    {u.role === "admin" && <ShieldCheck size={10} />}
                                                    {u.role === "team_leader" && <UsersIcon size={10} />}
                                                    {u.role === "employee" && <User size={10} />}
                                                    <span>{u.role === "admin" ? "Admin" : u.role?.replace(/_/g, " ")}</span>
                                                  </span>
                                                  {u.status && u.status !== "Active" && (
                                                    <span
                                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shadow-sm ${
                                                        u.status === "Pending Approval" || u.status === "Pending"
                                                          ? "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm animate-breathe"
                                                          : "border-red-500/30 bg-red-500/10 text-red-400"
                                                      }`}
                                                    >
                                                      {(u.status === "Pending Approval" || u.status === "Pending") && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-breathe-dot" />
                                                      )}
                                                      {u.status}
                                                    </span>
                                                  )}
                                                </div>
                                              </td>

                                              <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none text-right pr-4">
                                                <div className="flex items-center justify-end gap-1">
                                                  {hasPermission(user, "MANAGE_PERMISSIONS") && (
                                                    <button
                                                      onClick={() => {
                                                        setUserForPermissions(u);
                                                        setSelectedPermissions(u.permissions || []);
                                                        setIsPermissionsModalOpen(true);
                                                      }}
                                                      className="p-1.5 text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg border border-transparent hover:border-amber-primary/20 transition-all cursor-pointer"
                                                      title="Permissions"
                                                    >
                                                      <ShieldCheck size={13} />
                                                    </button>
                                                  )}

                                                  {hasPermission(user, "MANAGE_TEAM") && u.role === "employee" && (
                                                    <button
                                                      onClick={() => {
                                                        setUserForTeam(u);
                                                        setSelectedTeamLeader(
                                                          user?.role === "team_leader" ? user.id : u.teamLeaderId || ""
                                                        );
                                                        setIsTeamModalOpen(true);
                                                      }}
                                                      className="p-1.5 text-text-dim hover:text-purple-400 hover:bg-purple-500/10 rounded-lg border border-transparent hover:border-purple-500/20 transition-all cursor-pointer"
                                                      title="Assign Team"
                                                    >
                                                      <UsersIcon size={13} />
                                                    </button>
                                                  )}

                                                  {u.role === "team_leader" && (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          setTeamFilter(u.id);
                                                          setSearchQuery("");
                                                          setUserPage(1);
                                                        }}
                                                        className="p-1.5 text-text-dim hover:text-purple-400 hover:bg-purple-500/10 rounded-lg border border-transparent hover:border-purple-500/20 transition-all cursor-pointer"
                                                        title="View Team Members"
                                                      >
                                                        <UsersIcon size={13} />
                                                      </button>
                                                      {user?.role === "admin" && (
                                                        <button
                                                          onClick={() => {
                                                            setSelectedTeamLeader(u.id);
                                                            setSelectedUsersForTeam([]);
                                                            setIsBuildTeamModalOpen(true);
                                                          }}
                                                          className="p-1.5 text-text-dim hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-transparent hover:border-emerald-500/20 transition-all cursor-pointer"
                                                          title="Expand Hierarchy"
                                                        >
                                                          <UserPlus size={13} />
                                                        </button>
                                                      )}
                                                    </>
                                                  )}

                                                  <button
                                                    onClick={() => {
                                                      setSelectedProfileUser(u);
                                                      setActiveTab("profile");
                                                    }}
                                                    className="p-1.5 text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg border border-transparent hover:border-amber-primary/20 transition-all cursor-pointer"
                                                    title="Inspect Profile"
                                                  >
                                                    <User size={13} />
                                                  </button>

                                                  {u.id !== user?.id && (user?.role === "admin" || user?.role === "team_leader") && (
                                                    <button
                                                      onClick={() => {
                                                        setUserToDelete(u);
                                                        setIsDeleteUserModalOpen(true);
                                                      }}
                                                      className="p-1.5 text-text-dim hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                                                      title="Delete Account"
                                                    >
                                                      <Trash2 size={13} />
                                                    </button>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  /* Grid Cards Layout */
                                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {paginatedUsers.map((u) => {
                                      const isOnline =
                                        u.lastActive &&
                                        new Date().getTime() - new Date(u.lastActive).getTime() < 300000;

                                      return (
                                        <div
                                          key={u.id}
                                          className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between gap-3 hover:border-amber-primary/30 transition-all group"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <div className="relative shrink-0">
                                                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border-bright flex items-center justify-center text-sm font-extrabold text-amber-primary shadow overflow-hidden">
                                                  {u.profilePicture ? (
                                                    <img
                                                      src={u.profilePicture}
                                                      alt={u.name}
                                                      className="w-full h-full object-cover"
                                                    />
                                                  ) : (
                                                    u.name?.[0] || "?"
                                                  )}
                                                </div>
                                                <div
                                                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface shadow ${
                                                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-text-dim/40"
                                                  }`}
                                                />
                                              </div>
                                              <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-black text-text-primary group-hover:text-amber-primary transition-colors truncate">
                                                  {u.name}
                                                </span>
                                                <span className="text-[9px] text-text-dim font-mono tracking-tight">
                                                  ID: {u.id.slice(0, 8)}
                                                </span>
                                              </div>
                                            </div>

                                            <span
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shrink-0 ${
                                                u.role === "admin"
                                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                                  : u.role === "team_leader"
                                                  ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                                                  : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                              }`}
                                            >
                                              {u.role === "admin" ? "Admin" : u.role?.replace(/_/g, " ")}
                                            </span>
                                          </div>

                                          <div className="text-xs text-text-secondary flex items-center gap-1.5 font-mono truncate bg-surface-2/40 px-2.5 py-1.5 rounded-lg border border-border-dim/20">
                                            <Mail size={10} className="text-text-dim shrink-0" />
                                            <span className="truncate text-[10.5px]">{u.email}</span>
                                          </div>

                                          <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-1">
                                            {hasPermission(user, "MANAGE_PERMISSIONS") && (
                                              <button
                                                onClick={() => {
                                                  setUserForPermissions(u);
                                                  setSelectedPermissions(u.permissions || []);
                                                  setIsPermissionsModalOpen(true);
                                                }}
                                                className="p-1.5 text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-colors cursor-pointer"
                                                title="Permissions"
                                              >
                                                <ShieldCheck size={13} />
                                              </button>
                                            )}
                                            {hasPermission(user, "MANAGE_TEAM") && u.role === "employee" && (
                                              <button
                                                onClick={() => {
                                                  setUserForTeam(u);
                                                  setSelectedTeamLeader(
                                                    user?.role === "team_leader" ? user.id : u.teamLeaderId || ""
                                                  );
                                                  setIsTeamModalOpen(true);
                                                }}
                                                className="p-1.5 text-text-dim hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                                                title="Assign Team"
                                              >
                                                <UsersIcon size={13} />
                                              </button>
                                            )}
                                            <button
                                              onClick={() => {
                                                setSelectedProfileUser(u);
                                                setActiveTab("profile");
                                              }}
                                              className="p-1.5 text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-colors cursor-pointer"
                                              title="Inspect Profile"
                                            >
                                              <User size={13} />
                                            </button>
                                            {u.id !== user?.id && (user?.role === "admin" || user?.role === "team_leader") && (
                                              <button
                                                onClick={() => {
                                                  setUserToDelete(u);
                                                  setIsDeleteUserModalOpen(true);
                                                }}
                                                className="p-1.5 text-text-dim hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                title="Delete Account"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Bottom Pagination Bar */}
                                {filtered.length > 0 && (
                                  <div className="px-4 py-3 bg-surface-2/40 border-t border-border-dim/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <span className="text-[11px] text-text-dim font-medium">
                                      Showing <span className="font-bold text-text-primary">{startIndex + 1}</span> to{" "}
                                      <span className="font-bold text-text-primary">
                                        {Math.min(startIndex + userPageSize, filtered.length)}
                                      </span>{" "}
                                      of <span className="font-bold text-amber-500">{filtered.length}</span> members
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        disabled={safePage <= 1}
                                        onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                                        className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-text-dim hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        <ChevronLeft size={12} />
                                        <span>Prev</span>
                                      </button>

                                      <div className="flex items-center gap-1 px-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                          <button
                                            key={pg}
                                            onClick={() => setUserPage(pg)}
                                            className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                              pg === safePage
                                                ? "bg-amber-primary text-black font-extrabold shadow"
                                                : "bg-black/30 hover:bg-white/10 text-text-dim hover:text-white"
                                            }`}
                                          >
                                            {pg}
                                          </button>
                                        ))}
                                      </div>

                                      <button
                                        disabled={safePage >= totalPages}
                                        onClick={() => setUserPage((prev) => Math.min(totalPages, prev + 1))}
                                        className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-text-dim hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>Next</span>
                                        <ChevronRight size={12} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </motion.div>
                    )}

                  {activeTab === "profile" && (
                    <div className="w-full h-full">
                      <ProfileView
                        user={selectedProfileUser || user!}
                        onUpdate={handleUpdateProfile}
                        isSelf={
                          !selectedProfileUser ||
                          selectedProfileUser.id === user?.id
                        }
                        currentUserRole={user?.role || "employee"}
                        showToast={showToast}
                        autoSave={autoSave}
                        onResetCredentials={handleResetCredentials}
                        logs={logs}
                        onBack={() => {
                          setSelectedProfileUser(null);
                          setActiveTab("users");
                        }}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <footer className="shrink-0 w-full border-t border-border-dim/30 bg-bg/40 backdrop-blur-md py-4 pb-20 md:pb-4 px-4 sm:px-6 z-40 relative">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[9px] uppercase tracking-[0.22em] text-text-dim text-center sm:text-left select-none">
                {/* Sleek minimalist line logo & essential copyright on the left */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
                  <span className="text-[10px] font-black text-text-primary tracking-[0.24em] flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-primary inline-block min-w-[4px]" />
                    PYSYNC
                  </span>
                  <span className="text-border-dim/40 font-light font-sans">
                    |
                  </span>
                  <span className="font-semibold text-text-dim">
                    &copy; {new Date().getFullYear()}
                  </span>
                  <span className="text-border-dim/40 font-light font-sans">
                    |
                  </span>
                  <span className="text-text-dim/80 font-medium">
                    Platform by{" "}
                    <span className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150 cursor-pointer">
                      Propertyards.com
                    </span>
                  </span>
                </div>

                {/* Essential pages in the same single line */}
                <div className="flex items-center justify-center gap-3.5">
                  <a
                    href="#"
                    className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150"
                  >
                    Privacy
                  </a>
                  <span className="text-border-dim/40 font-light">•</span>
                  <a
                    href="#"
                    className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150"
                  >
                    Terms
                  </a>
                </div>
              </div>
            </footer>

            {/* Android-optimized Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-3d border-t border-border-dim/50 backdrop-blur-md flex justify-around items-center h-16 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  playSound("click");
                }}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${activeTab === "dashboard" ? "text-amber-primary scale-105" : "text-text-dim/80 hover:text-text-secondary"}`}
              >
                <LayoutDashboard size={18} />
                <span className="text-[9px] font-bold mt-1 tracking-wider uppercase">
                  Dash
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("projects");
                  playSound("click");
                }}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all relative ${activeTab === "projects" ? "text-amber-primary scale-105" : "text-text-dim/80 hover:text-text-secondary"}`}
              >
                <Building2 size={18} />
                <span className="text-[9px] font-bold mt-1 tracking-wider uppercase">
                  Projects
                </span>
                {projects.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-amber-primary text-bg font-bold text-[8px] h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center">
                    {projects.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("resale");
                  playSound("click");
                }}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all relative ${activeTab === "resale" ? "text-amber-primary scale-105" : "text-text-dim/80 hover:text-text-secondary"}`}
              >
                <ClipboardList size={18} />
                <span className="text-[9px] font-bold mt-1 tracking-wider uppercase">
                  Listings
                </span>
                {resaleProperties.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-amber-primary text-bg font-bold text-[8px] h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center">
                    {resaleProperties.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("media");
                  playSound("click");
                }}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${activeTab === "media" ? "text-amber-primary scale-105" : "text-text-dim/80 hover:text-text-secondary"}`}
              >
                <FolderOpen size={18} />
                <span className="text-[9px] font-bold mt-1 tracking-wider uppercase">
                  Media
                </span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(true);
                  playSound("click");
                }}
                className="flex flex-col items-center justify-center w-14 h-14 rounded-xl text-text-dim/80 hover:text-text-secondary transition-all"
              >
                <Menu size={18} />
                <span className="text-[9px] font-bold mt-1 tracking-wider uppercase">
                  Menu
                </span>
              </button>
            </div>
          </main>

          {/* Project Modal */}
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProject(null);
                    setEditingResale(null);
                  }}
                  className="absolute inset-0 bg-black/80 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  className="relative w-full max-w-4xl h-full max-h-[95vh] sm:max-h-[90vh] bg-surface rounded-2xl sm:rounded-[32px] border border-border-dim shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50"
                >
                  <div className="p-6 sm:px-8 border-b border-border-dim flex justify-between items-center shrink-0 bg-surface/80 z-10">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          setEditingProject(null);
                          setEditingResale(null);
                        }}
                        className="p-2 hover:bg-surface-2 rounded-full text-text-dim transition-colors"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div>
                        <h2 className="font-serif text-2xl font-bold text-text-primary">
                          {editingProject
                            ? "Edit Project"
                            : editingResale
                              ? "Edit Listing Projects"
                              : entryType === "project"
                                ? "Add Project"
                                : "Add Listing Projects"}
                        </h2>
                        <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                          Listing Management
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingProject(null);
                        setEditingResale(null);
                      }}
                      className="p-2 bg-surface-2 rounded-xl text-text-dim hover:text-red-500 transition-colors border border-border-dim"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 no-scrollbar">
                    <div className="max-w-4xl mx-auto">
                      {!editingProject && !editingResale && (
                        <div className="flex justify-center mb-8">
                          <div className="bg-surface-2 p-1.5 rounded-2xl flex items-center border border-border-dim/50 shadow-inner relative w-full max-w-lg">
                            {/* Sliding Background */}
                            <motion.div
                              className="absolute bg-amber-primary rounded-xl shadow-lg shadow-amber-primary/20"
                              initial={false}
                              animate={{
                                x: entryType === "project" ? 0 : "100%",
                                width: "50%",
                                height: "calc(100% - 12px)",
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                              }}
                              style={{ left: "6px" }}
                            />

                            <button
                              type="button"
                              onClick={() => {
                                setEntryType("project");
                                playSound("click");
                              }}
                              className={`relative flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 z-10 ${
                                entryType === "project"
                                  ? "text-bg"
                                  : "text-text-dim hover:text-text-primary"
                              }`}
                            >
                              <Building2
                                size={14}
                                className={
                                  entryType === "project"
                                    ? "text-bg"
                                    : "text-amber-primary"
                                }
                              />
                              Project Entry
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEntryType("resale");
                                playSound("click");
                              }}
                              className={`relative flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 z-10 ${
                                entryType === "resale"
                                  ? "text-bg"
                                  : "text-text-dim hover:text-text-primary"
                              }`}
                            >
                              <ClipboardList
                                size={14}
                                className={
                                  entryType === "resale"
                                    ? "text-bg"
                                    : "text-amber-primary"
                                }
                              />
                              Listing Projects
                            </button>
                          </div>
                        </div>
                      )}

                      {editingResale || entryType === "resale" ? (
                        <ResalePropertyForm
                          initialData={
                            editingResale
                              ? {
                                  ...editingResale,
                                  price:
                                    editingResale.price >= 10000000
                                      ? Number(editingResale.price) / 10000000
                                      : Number(editingResale.price) / 100000,
                                  priceUnit:
                                    editingResale.price >= 10000000
                                      ? "Cr"
                                      : "Lacs",
                                }
                              : undefined
                          }
                          onSubmit={
                            editingResale ? handleEditResale : handleAddResale
                          }
                          onCancel={() => {
                            setIsModalOpen(false);
                            setEditingResale(null);
                          }}
                          existingProperties={resaleProperties
                            .filter(
                              (p) =>
                                !editingResale || p.id !== editingResale.id,
                            )
                            .map((p) => ({
                              societyName: p.societyName,
                              bhk: p.bhk,
                              floorNumber: p.floorNumber,
                              location: p.location,
                              propertyHolderName: p.propertyHolderName,
                            }))}
                          existingBuilders={allBuilders}
                          existingSocieties={allSocieties}
                          showToast={showToast}
                          assignedRegion={assignedRegion}
                        />
                      ) : (
                        <ProjectForm
                          initialData={
                            editingProject
                              ? {
                                  ...editingProject,
                                  price:
                                    editingProject.price >= 10000000
                                      ? editingProject.price / 10000000
                                      : editingProject.price / 100000,
                                  priceUnit:
                                    editingProject.price >= 10000000
                                      ? "Cr"
                                      : "Lacs",
                                }
                              : undefined
                          }
                          onSubmit={
                            editingProject
                              ? handleEditProject
                              : handleAddProject
                          }
                          onCancel={() => {
                            setIsModalOpen(false);
                            setEditingProject(null);
                          }}
                          existingTitles={projects
                            .filter((p) => p.id !== editingProject?.id)
                            .map((p) => p.title)}
                          existingBuilders={allBuilders}
                          showToast={showToast}
                          users={users}
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {selectedProject && (
              <ProjectDetailModal
                project={selectedProject}
                onClose={() => setSelectedProject(null)}
                showToast={showToast}
                onViewBuilder={(name) => {
                  setSelectedBuilder(name);
                }}
                onEdit={(p: any) => {
                  setEditingProject(p);
                  setIsModalOpen(true);
                }}
                onDelete={setProjectToDelete}
                onCreate={() => {
                  setEditingProject(null);
                  setIsModalOpen(true);
                }}
                hasEditPermission={
                  hasPermission(user, "EDIT_PROJECTS") && user?.role === "admin"
                }
                hasDeletePermission={
                  hasPermission(user, "DELETE_PROJECTS") && user?.role === "admin"
                }
                hasCreatePermission={hasPermission(user, "ADD_PROJECTS")}
                isAlertActive={!!priceAlerts[selectedProject.id]}
                onToggleAlert={handleTogglePriceAlert}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedBuilder && (
              <BuilderDetailModal
                builderName={selectedBuilder}
                projects={projects}
                onClose={() => setSelectedBuilder(null)}
                onProjectClick={(project) => {
                  setSelectedBuilder(null);
                  setSelectedProject(project);
                }}
                user={user}
              />
            )}
          </AnimatePresence>

          {/* Resale Property Modal - REMOVED: Consolidated into main modal */}
          <AnimatePresence>
            {selectedResale && (
              <ResalePropertyDetailModal
                property={selectedResale}
                onClose={() => setSelectedResale(null)}
                showToast={showToast}
                onViewBuilder={(name) => {
                  setSelectedBuilder(name);
                }}
                onEdit={(p: any) => {
                  setEditingResale(p);
                  setEntryType("resale");
                  setIsModalOpen(true);
                }}
                onDelete={(p: any) => {
                  setResaleToDelete(p);
                  setSelectedResale(null);
                }}
                hasEditPermission={
                  hasPermission(user, "EDIT_RESALE") && user?.role === "admin"
                }
                hasDeletePermission={
                  hasPermission(user, "DELETE_RESALE") && user?.role === "admin"
                }
              />
            )}
          </AnimatePresence>
          {/* User Modal */}
          <AnimatePresence>
            {isUserModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setCreatedUserCredentials(null);
                  }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-lg max-h-[92vh] bg-surface border border-border-dim rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
                >
                  <div className="px-6 py-4 border-b border-border-dim/60 flex justify-between items-center shrink-0 bg-surface-2/60 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-primary/10 border border-amber-primary/20 text-amber-primary">
                        {createdUserCredentials ? <ShieldCheck size={18} /> : <UserPlus size={18} />}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-text-primary">
                          {createdUserCredentials
                            ? "Account Provisioned"
                            : "Provision Team Member"}
                        </h2>
                        <p className="text-[11px] text-text-dim">
                          {createdUserCredentials
                            ? "System access credentials generated successfully"
                            : "Configure account permissions & issue authentication token"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserModalOpen(false);
                        setCreatedUserCredentials(null);
                      }}
                      className="p-1.5 rounded-xl hover:bg-surface-3 text-text-dim hover:text-text-primary transition-colors border border-border-dim/50"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="overflow-y-auto no-scrollbar">
                    {createdUserCredentials ? (
                      <CredentialGenerationCard
                        credentials={createdUserCredentials}
                        onDone={() => {
                          setIsUserModalOpen(false);
                          setCreatedUserCredentials(null);
                        }}
                        onCopySuccess={(msg) => showToast(msg, "info")}
                      />
                    ) : (
                      <CredentialForm
                        onSubmit={handleAddUser}
                        isLoading={isSubmitting}
                        error={userError}
                      />
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Permissions Modal */}
          <AnimatePresence>
            {isPermissionsModalOpen && userForPermissions && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsPermissionsModalOpen(false)}
                  className="absolute inset-0 bg-black/80 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-lg bg-surface border border-border-bright rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
                >
                  <div className="p-6 border-b border-border-dim flex justify-between items-center">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-text-primary">
                        Grant Permissions
                      </h2>
                      <p className="text-[10px] text-text-dim uppercase tracking-widest">
                        User: {userForPermissions.name}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsPermissionsModalOpen(false)}
                      className="text-text-dim hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-6">
                    {PERMISSION_CATEGORIES.map((category) => (
                      <div key={category.name} className="space-y-3">
                        <h3 className="text-[10px] text-amber-primary uppercase tracking-[0.2em] font-black flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-primary rounded-full" />
                          {category.name}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {category.permissions.map((perm) => (
                            <label
                              key={perm}
                              className="flex items-center gap-3 p-3 rounded-xl border border-border-bright hover:border-amber-primary/50 cursor-pointer transition-all group"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPermissions([
                                      ...selectedPermissions,
                                      perm,
                                    ]);
                                  } else {
                                    setSelectedPermissions(
                                      selectedPermissions.filter(
                                        (p) => p !== perm,
                                      ),
                                    );
                                  }
                                }}
                                className="w-4 h-4 rounded border-border-bright text-amber-primary focus:ring-amber-primary bg-surface-2"
                              />
                              <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                                {perm?.replace(/_/g, " ")}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-surface-2 border-t border-border-dim flex justify-end gap-3">
                    <button
                      onClick={() => setIsPermissionsModalOpen(false)}
                      className="px-6 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdatePermissions}
                      className="bg-amber-primary text-bg px-8 py-2 rounded-lg text-xs font-bold hover:bg-amber-secondary transition-all"
                    >
                      Save Permissions
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Build Team Modal */}
          <AnimatePresence>
            {isBuildTeamModalOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setIsBuildTeamModalOpen(false);
                    setSelectedTeamLeader("");
                  }}
                  className="absolute inset-0 bg-black/80 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-2xl bg-surface border border-border-bright rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                  <div className="p-6 border-b border-border-dim flex justify-between items-center shrink-0">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <UsersIcon size={20} className="text-purple-500" />
                        Build Team{" "}
                        {selectedTeamLeader
                          ? `for ${users.find((u) => u.id === selectedTeamLeader)?.name}`
                          : ""}
                      </h2>
                      <p className="text-[10px] text-text-dim uppercase tracking-widest">
                        Select employees to assign to the team
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsBuildTeamModalOpen(false);
                        setSelectedTeamLeader("");
                      }}
                      className="text-text-dim hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="space-y-4">
                      {users.filter(
                        (u) =>
                          u.role === "employee" &&
                          u.teamLeaderId !== (selectedTeamLeader || user?.id),
                      ).length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-border-dim rounded-xl text-text-dim text-xs italic">
                          No unassigned employees available to add to this team.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {users
                            .filter(
                              (u) =>
                                u.role === "employee" &&
                                u.teamLeaderId !==
                                  (selectedTeamLeader || user?.id),
                            )
                            .map((u) => (
                              <label
                                key={u.id}
                                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                                  selectedUsersForTeam.includes(u.id)
                                    ? "bg-purple-500/10 border-purple-500"
                                    : "bg-surface-2 border-border-bright hover:border-purple-500/50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={selectedUsersForTeam.includes(u.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsersForTeam((prev) => [
                                        ...prev,
                                        u.id,
                                      ]);
                                    } else {
                                      setSelectedUsersForTeam((prev) =>
                                        prev.filter((id) => id !== u.id),
                                      );
                                    }
                                  }}
                                />
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                                    selectedUsersForTeam.includes(u.id)
                                      ? "bg-purple-500 text-white"
                                      : "border border-border-dim bg-surface"
                                  }`}
                                >
                                  {selectedUsersForTeam.includes(u.id) && (
                                    <Check size={12} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-text-primary truncate">
                                    {u.name}
                                  </div>
                                  <div className="text-[10px] text-text-dim truncate">
                                    {u.email}
                                  </div>
                                </div>
                                {u.teamLeaderId && (
                                  <div className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold uppercase tracking-widest shrink-0">
                                    Reassign
                                  </div>
                                )}
                              </label>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-surface-2 border-t border-border-dim flex justify-between items-center shrink-0">
                    <div className="text-xs text-text-dim font-bold">
                      {selectedUsersForTeam.length} user
                      {selectedUsersForTeam.length !== 1 ? "s" : ""} selected
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setIsBuildTeamModalOpen(false);
                          setSelectedTeamLeader("");
                        }}
                        className="px-6 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkAssignTeam}
                        disabled={selectedUsersForTeam.length === 0}
                        className="bg-purple-500 text-white px-8 py-2 rounded-lg text-xs font-bold hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Assign to Team
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Team Assignment Modal */}
          <AnimatePresence>
            {isTeamModalOpen && userForTeam && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsTeamModalOpen(false)}
                  className="absolute inset-0 bg-black/80 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-surface border border-border-bright rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-6 border-b border-border-dim flex justify-between items-center">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-text-primary">
                        Assign Team
                      </h2>
                      <p className="text-[10px] text-text-dim uppercase tracking-widest">
                        User: {userForTeam.name}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsTeamModalOpen(false)}
                      className="text-text-dim hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                        Select Team Leader
                      </label>
                      {user?.role === "admin" ? (
                        <select
                          value={selectedTeamLeader}
                          onChange={(e) =>
                            setSelectedTeamLeader(e.target.value)
                          }
                          className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-primary transition-all"
                        >
                          <option value="">No Team Leader</option>
                          {users
                            .filter(
                              (u) =>
                                u.role === "team_leader" || u.role === "admin",
                            )
                            .map((leader) => (
                              <option key={leader.id} value={leader.id}>
                                {leader.name} (
                                {leader.role === "admin"
                                  ? "Super Admin"
                                  : leader.role?.replace(/_/g, " ")}
                                )
                              </option>
                            ))}
                        </select>
                      ) : (
                        <div className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm text-text-primary">
                          {user?.name} (You)
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary italic leading-relaxed">
                      {user?.role === "admin"
                        ? "Assigning a team leader allows them to view and manage this user's activity."
                        : "Assigning this user to your team will allow you to view and manage their activity."}
                    </p>
                  </div>
                  <div className="p-6 bg-surface-2 border-t border-border-dim flex justify-end gap-3">
                    <button
                      onClick={() => setIsTeamModalOpen(false)}
                      className="px-6 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssignTeam}
                      className="bg-amber-primary text-bg px-8 py-2 rounded-lg text-xs font-bold hover:bg-amber-secondary transition-all"
                    >
                      Confirm Assignment
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isDeleteUserModalOpen && userToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDeleteUserModalOpen(false)}
                  className="absolute inset-0 bg-black/70 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-surface border border-border-dim rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-text-primary mb-2">
                      Delete User?
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed mb-8">
                      Are you sure you want to delete{" "}
                      <span className="text-text-primary font-bold">
                        {userToDelete.name}
                      </span>
                      ? This action cannot be undone and all associated logs
                      will remain for audit purposes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setIsDeleteUserModalOpen(false)}
                        className="w-full sm:flex-1 px-6 py-3 rounded-xl text-xs font-bold text-text-secondary bg-surface-2 hover:text-text-primary transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteUser}
                        className="w-full sm:flex-1 px-6 py-3 rounded-xl text-xs font-bold text-bg bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Delete Project Confirmation Modal */}
          <AnimatePresence>
            {projectToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setProjectToDelete(null)}
                  className="absolute inset-0 bg-black/70 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-surface border border-border-dim rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-text-primary mb-2">
                      Delete Project?
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed mb-8">
                      Are you sure you want to delete this project? This action
                      cannot be undone.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setProjectToDelete(null)}
                        className="w-full sm:flex-1 px-6 py-3 rounded-xl text-xs font-bold text-text-secondary bg-surface-2 hover:text-text-primary transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteProject(projectToDelete.id);
                          setProjectToDelete(null);
                        }}
                        className={`w-full sm:flex-1 px-6 py-3 rounded-xl text-xs font-bold text-bg transition-all shadow-lg ${
                          hasPermission(user, "DELETE_PROJECTS")
                            ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                            : "bg-amber-primary hover:bg-amber-secondary shadow-amber-primary/20"
                        }`}
                      >
                        {hasPermission(user, "DELETE_PROJECTS")
                          ? "Confirm Delete"
                          : "Confirm Request"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Delete Resale Confirmation Modal */}
          <AnimatePresence>
            {resaleToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setResaleToDelete(null)}
                  className="absolute inset-0 bg-black/70 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-surface border border-border-dim rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-text-primary mb-2">
                      Delete Resale Property?
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed mb-8">
                      Are you sure you want to delete the resale listing for{" "}
                      <span className="font-bold text-text-primary">
                        {resaleToDelete.societyName}
                      </span>
                      ? This action cannot be undone.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setResaleToDelete(null)}
                        className="w-full sm:flex-1 px-6 py-3 rounded-xl text-xs font-bold text-text-secondary bg-surface-2 hover:text-text-primary transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteResale(resaleToDelete.id);
                          setResaleToDelete(null);
                        }}
                        className={`w-full sm:flex-1 px-6 py-3 rounded-xl text-xs font-bold text-bg transition-all shadow-lg ${
                          hasPermission(user, "DELETE_RESALE")
                            ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                            : "bg-amber-primary hover:bg-amber-secondary shadow-amber-primary/20"
                        }`}
                      >
                        {hasPermission(user, "DELETE_RESALE")
                          ? "Confirm Delete"
                          : "Confirm Request"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Bulk Delete Confirmation Modal */}
          <AnimatePresence>
            {isBulkDeleteModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="absolute inset-0 bg-black/70 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-surface border border-border-dim rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-text-primary mb-2">
                      Delete {selectedProjectIds.length} Projects?
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed mb-8">
                      Are you sure you want to delete these projects? This
                      action cannot be undone.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setIsBulkDeleteModalOpen(false)}
                        className="w-full sm:flex-1 px-6 py-3 rounded-xl text-xs font-bold text-text-secondary bg-surface-2 hover:text-text-primary transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="w-full sm:flex-1 px-6 py-3 rounded-xl text-xs font-bold text-bg bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Toast Container */}
          <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
              {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                  <Toast
                    id={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={removeToast}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>

          {/* Bulk Status Change Modal */}
          <AnimatePresence>
            {isBulkStatusModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsBulkStatusModalOpen(false)}
                  className="absolute inset-0 bg-black/70 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-surface border border-border-dim rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-xl font-bold text-text-primary">
                        Change Status
                      </h2>
                      <button
                        onClick={() => setIsBulkStatusModalOpen(false)}
                        className="text-text-dim hover:text-red-500 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <p className="text-xs text-text-secondary mb-6">
                      Updating status for{" "}
                      <span className="text-amber-primary font-bold">
                        {selectedProjectIds.length}
                      </span>{" "}
                      selected projects.
                    </p>

                    <div className="space-y-4 mb-8">
                      {["Active", "Sold", "Pending"].map((status) => (
                        <button
                          key={status}
                          onClick={() => setBulkStatus(status)}
                          className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                            bulkStatus === status
                              ? "border-amber-primary bg-amber-primary/5 text-amber-primary"
                              : "border-border-dim bg-surface-2 text-text-secondary hover:border-amber-primary/50"
                          }`}
                        >
                          <span className="text-sm font-bold uppercase tracking-widest">
                            {status}
                          </span>
                          {bulkStatus === status && <Check size={16} />}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setIsBulkStatusModalOpen(false)}
                        className="w-full sm:flex-1 px-6 py-3 rounded-xl text-xs font-bold text-text-secondary bg-surface-2 hover:text-text-primary transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkStatusChange}
                        className="w-full sm:flex-1 px-6 py-3 rounded-xl text-xs font-bold text-bg bg-amber-primary hover:bg-amber-secondary transition-all shadow-lg shadow-amber-primary/20"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Logout Confirmation Modal */}
          <AnimatePresence>
            {isLogoutModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="absolute inset-0 bg-black/80 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm bg-surface border border-border-bright rounded-2xl shadow-2xl overflow-hidden p-8 text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                    <LogOut size={32} className="text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-text-primary">
                      Sign Out
                    </h2>
                    <p className="text-sm text-text-secondary">
                      Are you sure you want to log out of your account?
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => setIsLogoutModalOpen(false)}
                      className="flex-1 px-6 py-3 rounded-xl text-xs font-bold text-text-secondary bg-surface-2 hover:text-text-primary transition-all border border-border-dim"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await request("/api/auth/logout", { method: "POST" });
                        } catch (err) {
                          console.error("Logout error", err);
                        } finally {
                          localStorage.removeItem("token");
                          localStorage.removeItem("user");
                          localStorage.removeItem("pysync_token");
                          setIsLoggedIn(false);
                          setUser(null);
                          setActiveTab("dashboard");
                          setIsLogoutModalOpen(false);
                          showToast("Logged out successfully", "info");
                        }
                      }}
                      className="flex-1 px-6 py-3 rounded-xl text-xs font-bold text-bg bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            initialTab={settingsInitialTab}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            compactMode={compactMode}
            setCompactMode={setCompactMode}
            autoSave={autoSave}
            setAutoSave={setAutoSave}
            soundEffects={soundEffects}
            setSoundEffects={setSoundEffects}
            language={language}
            setLanguage={setLanguage}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            theme={theme}
            setTheme={handleThemeChange}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
            reducedMotion={reducedMotion}
            setReducedMotion={setReducedMotion}
            user={user}
            onProfileClick={() => {
              setSelectedProfileUser(user);
              setActiveTab("profile");
            }}
            playSound={playSound}
            request={request}
            showToast={showToast}
            assignedRegion={assignedRegion}
            setAssignedRegion={setAssignedRegion}
          />

          {/* Duplicate Entry Warning Alert Modal */}
          <AnimatePresence>
            {duplicateAlert && duplicateAlert.isOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDuplicateAlert(null)}
                  className="absolute inset-0 bg-black/85 backdrop-blur-xs"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-surface border border-red-500/30 rounded-3xl shadow-[0_32px_128px_-16px_rgba(239,68,68,0.2)] overflow-hidden p-8 text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle size={32} className="text-amber-500 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-xl font-bold font-serif text-text-primary tracking-tight">
                      Duplicate Entry Detected
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed bg-surface-2 p-4 rounded-2xl border border-border-dim text-left font-mono">
                      {duplicateAlert.message}
                    </p>
                    <p className="text-xs text-text-dim mt-2">
                      Please change the details in the form to register this item successfully.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setDuplicateAlert(null)}
                      className="w-full px-6 py-3.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-98 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-none"
                    >
                      Dismiss Alert
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {themeRipple && themeRipple.active && (
              <motion.div
                key="theme-ripple-overlay"
                initial={{
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                transition={{
                  duration: 0.55,
                  ease: [0.16, 1, 0.3, 1], // Fluid expo curve (flawless entry speed)
                }}
                className="fixed pointer-events-none rounded-full"
                style={{
                  left: themeRipple.x,
                  top: themeRipple.y,
                  width: "350vmax",
                  height: "350vmax",
                  marginLeft: "-175vmax",
                  marginTop: "-175vmax",
                  backgroundColor: themeRipple.toTheme === "light" ? "#FFFDD0" : "#0e1015",
                  zIndex: 99999,
                  willChange: "transform",
                  transformOrigin: "center center",
                }}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </ErrorBoundary>
  );
}
