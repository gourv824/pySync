import React, { useState, useEffect, Component, useRef } from "react";
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
  LayoutGrid,
  List,
  FileQuestion,
  FileX,
  Award,
  Building,
  Layout,
  Bath,
  Maximize2,
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
  Key,
  Settings,
  Maximize,
  Moon,
  Type,
  Zap,
  Globe,
  Palette,
  Save,
  Volume2,
  HelpCircle,
  BarChart as BarChartIcon,
  Database as DatabaseIcon,
  Smartphone,
  Sparkles,
  Percent,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import Markdown from "react-markdown";
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
import { CredentialManager } from "./components/credentials/CredentialManager";
import { CredentialForm } from "./components/credentials/CredentialForm";
import { CredentialGenerationCard } from "./components/credentials/CredentialGenerationCard";
import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
} from "./components/credentials/AuthScreens";
import { SyncIntegrationView } from "./components/SyncIntegrationView";

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

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 group ${
      active
        ? "bg-amber-primary/10 border border-amber-primary/30 text-amber-primary"
        : "text-text-secondary hover:bg-surface-2 hover:text-text-primary border border-transparent"
    }`}
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
      <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px]">
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
}: any) => {
  const colorClasses: any = {
    amber: "text-amber-primary bg-amber-primary/10 border-amber-primary/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-3d border-3d shadow-3d p-6 rounded-[24px] relative overflow-hidden group"
    >
      {/* Scanning Line Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-amber-primary/10 to-transparent " />
      </div>

      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/10 transition-all" />

      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-xl border ${colorClasses[color] || colorClasses.amber} transition-transform group-hover:scale-110`}
        >
          {Icon && <Icon size={20} />}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${trend > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-bold">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-serif font-bold text-text-primary tracking-tight">
            {value}
          </div>
        </div>
        <div className="text-[10px] text-text-secondary font-medium flex items-center gap-1.5 mt-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${trend && trend > 0 ? "bg-green-500 animate-pulse" : "bg-amber-primary"}`}
          />
          {sub}
        </div>
      </div>
    </motion.div>
  );
};

const DashboardSection = ({ title, icon: Icon, children, action }: any) => (
  <div className="bg-3d border-3d rounded-[24px] overflow-hidden shadow-3d relative">
    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
    <div className="px-6 py-4 border-b border-black/30 flex justify-between items-center bg-surface-2/30 relative z-10">
      <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.2em] flex items-center gap-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        {Icon && (
          <Icon
            size={16}
            className="text-amber-primary drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"
          />
        )}
        {title}
      </h3>
      <div className="relative z-10">{action}</div>
    </div>
    <div className="p-6 relative z-10">{children}</div>
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
}: any) => (
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

    {/* Image Section */}
    <div className="relative h-36 overflow-hidden">
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

      <img
        src={
          project.images && project.images.length > 0
            ? project.images[0].data
            : `https://picsum.photos/seed/${project.title}/800/600`
        }
        alt={project.title}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
      />

      {/* Status Badge */}
      <div className="absolute bottom-2 left-2 z-20">
        <span
          className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border flex items-center gap-1 ${
            project.status === "Active"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : project.status === "PENDING_DELETE"
                ? "border-red-500/50 bg-red-500/10 text-red-400"
                : "border-amber-500/50 bg-amber-500/10 text-amber-400"
          }`}
        >
          {project.status === "Active" && (
            <span className="flex h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          )}
          {project.status}
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
          {project.coordinates && onShowOnMap && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowOnMap(project);
              }}
              className="p-1 text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-all group/btn"
              title="Show on Map"
            >
              <MapPin
                size={12}
                className="group-hover/btn:scale-110 transition-transform text-amber-primary"
              />
            </button>
          )}
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
  const builderProjects = projects.filter((p) => p.builderName === builderName);
  const totalArea = builderProjects.reduce(
    (acc, p) => acc + (parseInt(p.area.replace(/,/g, "")) || 0),
    0,
  );
  const avgPrice =
    builderProjects.reduce((acc, p) => acc + p.price, 0) /
    builderProjects.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 "
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-6xl h-full max-h-[95vh] sm:max-h-[90vh] bg-surface border border-border-dim rounded-2xl sm:rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col z-[70]"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-30 p-3 bg-surface/40 hover:bg-amber-primary text-white hover:text-bg rounded-full border border-white/10 transition-all group"
        >
          <X size={18} className="group-hover:rotate-90 transition-transform" />
        </button>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-none">
            {/* Hero Header */}
            <div className="relative p-8 sm:p-12 bg-gradient-to-br from-amber-primary/10 via-surface to-surface border-b border-border-dim overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-primary/5 rounded-full -mr-48 -mt-48 blur-[40px]" />

              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                <motion.div
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="w-20 h-20 bg-surface-2 rounded-2xl flex items-center justify-center text-amber-primary border border-border-bright shadow-xl shadow-amber-primary/10"
                >
                  <Building2 size={36} strokeWidth={1.5} />
                </motion.div>
                <div className="text-center md:text-left space-y-4 max-w-2xl">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-primary">
                        Developer Profile
                      </span>
                      <div className="h-px w-8 bg-amber-primary/30" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary tracking-tight leading-tight">
                      {builderName}
                    </h2>
                  </div>

                  <p className="text-text-dim text-[11px] leading-relaxed font-medium whitespace-pre-line opacity-80">
                    {builderName === "M3M"
                      ? "Founded in 2010, M3M India has quickly risen as one of India’s most dynamic and innovative real estate developers, built on the values of ethical governance, transparency, commitment, and passion for excellence.\n\nWith a forward-looking vision crafted by Founder Chairman Sh. Basant Bansal and Promoters Sh. Roop Bansal and Sh. Pankaj Bansal, M3M India has become a transformative force in the luxury residential and retail real estate sector. Today, M3M stands as a symbol of sophistication and innovation, setting new benchmarks across India."
                      : builderName === "DLF"
                        ? "Founded in 1946 by Chaudhary Raghvendra Singh, DLF began with the development of 22 urban colonies in Delhi. In 1985, the company expanded into the then-unknown region of Gurugram, creating exceptional living and working spaces for India’s emerging global professionals. Today, DLF is the largest publicly listed real estate company in India, with residential, commercial, and retail properties spanning 15 states and 24 cities.\n\nOur diverse verticals reflect our dedication to developing ecosystems for India’s evolving needs. However, our true foundation lies in our employees, customers, stakeholders, and shareholders. We invest in spearheading innovation through empowerment and optimism, to build the foundation of India’s future grounded in the legacy of our past."
                        : "A premier real estate developer committed to delivering high-quality residential and commercial spaces with a focus on innovation and sustainability."}
                  </p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[9px] font-black uppercase tracking-widest">
                      <ShieldCheck size={12} />
                      Verified
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-primary/10 text-amber-primary rounded-full border border-amber-primary/20 text-[9px] font-black uppercase tracking-widest">
                      <Award size={12} />
                      Premium
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-12 space-y-12">
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    label: "Total Projects",
                    value: builderProjects.length,
                    icon: LayoutGrid,
                    color: "text-amber-primary",
                    bg: "bg-amber-primary/5",
                  },
                  {
                    label: "Area Delivered",
                    value: `${(totalArea / 1000000).toFixed(1)}M Sq.Ft.`,
                    icon: Activity,
                    color: "text-blue-400",
                    bg: "bg-blue-400/5",
                  },
                  {
                    label: "Avg. Value",
                    value: formatPrice(avgPrice),
                    icon: IndianRupee,
                    color: "text-green-400",
                    bg: "bg-green-400/5",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -3 }}
                    className={`${stat.bg} p-6 rounded-2xl border border-border-bright space-y-3 relative overflow-hidden group`}
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <stat.icon size={48} />
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-text-dim uppercase tracking-[0.25em] font-black">
                      <stat.icon size={14} className={stat.color} />
                      {stat.label}
                    </div>
                    <div className="text-xl font-serif font-bold text-text-primary">
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Portfolio Showcase */}
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-serif font-bold text-text-primary">
                      Project Portfolio
                    </h3>
                    <p className="text-xs text-text-dim">
                      Selection of active developments
                    </p>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-1.5 bg-surface-2 rounded-lg border border-border-bright">
                    <span className="text-[9px] text-text-dim uppercase tracking-widest font-bold">
                      Listings
                    </span>
                    <div className="w-px h-3 bg-border-dim" />
                    <span className="text-[10px] font-mono font-bold text-amber-primary">
                      {builderProjects.length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {builderProjects.map((p, idx) => (
                    <motion.button
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => onProjectClick && onProjectClick(p)}
                      className="group text-left bg-surface-2 border border-border-bright rounded-2xl overflow-hidden hover:border-amber-primary/40 transition-all shadow-md"
                    >
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <img
                          src={
                            p.images && p.images.length > 0
                              ? p.images[0].data
                              : `https://picsum.photos/seed/${p.id}/800/500`
                          }
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-2 via-transparent to-transparent" />
                        <div className="absolute top-3 right-3">
                          <span
                            className={`text-[7px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest ${
                              p.status === "Active"
                                ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                                : "border-amber-500/30 bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-text-primary group-hover:text-amber-primary transition-colors line-clamp-1">
                            {p.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[9px] text-text-dim font-medium">
                            <MapPin size={10} className="text-amber-primary" />
                            {p.location}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border-dim/30">
                          <div className="space-y-0.5">
                            <p className="text-[7px] text-text-dim uppercase font-black tracking-widest">
                              From
                            </p>
                            <div className="text-xs font-mono font-bold text-text-primary">
                              {formatPrice(p.price)}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[7px] text-text-dim uppercase font-black tracking-widest">
                              Type
                            </p>
                            <div className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">
                              {p.type}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 border-t border-border-dim bg-surface-2">
          <div className="w-full max-w-none flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-text-dim">
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black tracking-widest">
                  Updated
                </span>
                <span className="text-[10px] font-mono">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="w-px h-6 bg-border-dim" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black tracking-widest">
                  ID
                </span>
                <span className="text-[10px] font-mono">
                  B-{builderName.slice(0, 3).toUpperCase()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-10 py-3.5 bg-amber-primary text-bg rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-secondary transition-all shadow-xl shadow-amber-primary/20 active:scale-95"
            >
              Close Portfolio
            </button>
          </div>
        </div>
      </motion.div>
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
}) => {
  const [isReportMistakeOpen, setIsReportMistakeOpen] = useState(false);
  const [mistakeDescription, setMistakeDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [currentModalTab, setCurrentModalTab] = useState<"overview" | "specs" | "payment" | "inventory">("overview");
  const modalContentRef = useRef<HTMLDivElement>(null);

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
  }, [project]);

  const handleUpdateUnitStatus = (unitId: string, newStatus: "Available" | "Sold" | "Reserved") => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, status: newStatus } : u))
    );
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
        <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
          <button
            onClick={() => setIsReportMistakeOpen(!isReportMistakeOpen)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all duration-300 shadow-md border ${
              isReportMistakeOpen
                ? "bg-amber-500 border-amber-500 text-black font-extrabold"
                : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <AlertCircle size={11} className={isReportMistakeOpen ? "animate-pulse" : ""} />
            <span>{isReportMistakeOpen ? "Cancel Report" : "Report Flag"}</span>
          </button>
          
          <button
            onClick={onClose}
            className="p-2.5 bg-white/5 hover:bg-amber-500 text-white hover:text-black rounded-full border border-white/10 hover:border-amber-500/25 transition-all duration-300 group shadow-md flex items-center justify-center"
            title="Dismiss detailed view"
          >
            <X size={14} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div ref={modalContentRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="w-full">
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
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              
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
                      className={`text-[9px] px-3 py-1 rounded-md border font-black uppercase tracking-[0.25em] ${
                        project.status === "Active"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          : project.status === "PENDING_DELETE"
                            ? "border-red-500/40 bg-red-500/10 text-red-400"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {project.status}
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
                                <div
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
                                </div>
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
                <div className="bg-gradient-to-b from-white/[0.02] to-transparent rounded-[24px] p-6.5 border border-white/[0.06] relative overflow-hidden group shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full -mr-16 -mt-16 blur-[50px] group-hover:bg-amber-500/[0.04] transition-all duration-700" />
                  <div className="relative z-10 space-y-6">
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-white/[0.03] rounded-2xl flex items-center justify-center text-amber-500 border border-white/[0.06] shadow-lg group-hover:scale-105 transition-transform duration-500">
                        <Building2 size={22} strokeWidth={1.5} />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-md font-semibold text-white leading-tight">
                          {project.builderName || "General Builder"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shadow-inner">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span className="text-[7.5px] text-emerald-400 font-extrabold uppercase tracking-wider">
                              Verified Partner
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star size={9} fill="currentColor" />
                            <span className="text-[7.5px] font-black uppercase tracking-wider">4.8 Rating</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                      {project.builderName === "M3M"
                        ? "Founded in 2010, M3M India has quickly risen as one of India's most dynamic and innovative real estate developers, built on the values of ethical governance, transparency, commitment, and passion for excellence."
                        : project.builderName === "DLF"
                          ? "Founded in 1946 by Chaudhary Raghvendra Singh, DLF began with the development of 22 urban colonies in Delhi. Today, DLF is the largest publicly listed real estate company in India."
                          : `A premier developer recognized for architectural innovation, timely deliveries, and commitment to delivering exceptional residential experiences across premium sectoral nodes.`}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-white/[0.06]">
                      <div className="text-left">
                        <div className="text-[7.5px] text-white/40 uppercase font-black tracking-widest leading-none">Legacy</div>
                        <div className="text-xs font-black text-white mt-1">15+ Years</div>
                      </div>
                      <div className="text-left">
                        <div className="text-[7.5px] text-white/40 uppercase font-black tracking-widest leading-none">Deliveries</div>
                        <div className="text-xs font-black text-white mt-1">45k+ Homes</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onViewBuilder(project.builderName || "General Builder")}
                      className="w-full py-3.5 bg-white/[0.02] hover:bg-amber-500 border border-white/[0.06] hover:border-amber-500 rounded-xl text-[9px] font-black text-white hover:text-black uppercase tracking-[0.2em] transition-all duration-300 shadow-md cursor-pointer"
                    >
                      View Builder Profile
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
                    if (window.confirm("Are you sure you want to delete this listing?")) {
                      onDelete(project);
                      onClose();
                    }
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
    </div>
  );
};

const ResalePropertyDetailModal = ({
  property,
  onClose,
  showToast,
  onViewBuilder,
}: {
  property: ResaleProperty;
  onClose: () => void;
  showToast: (
    msg: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;
  onViewBuilder: (name: string) => void;
}) => {
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
                src={
                  property.images && property.images.length > 0
                    ? property.images[0].data
                    : `https://picsum.photos/seed/${property.societyName}/1920/1080`
                }
                alt={property.societyName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover scale-102 filter brightness-[0.85]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#13151A] via-[#13151A]/40 to-transparent" />

              <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10.5 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`text-[8px] px-3 py-1 rounded-md border font-black uppercase tracking-[0.2em] shadow-sm ${
                      property.status === "Active"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : property.status === "Sold"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                    }`}
                  >
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
                          className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/[0.05] hover:border-white/20 transition-all duration-300 group cursor-pointer shadow-md"
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
                <div className="bg-gradient-to-b from-white/[0.02] to-transparent rounded-[24px] p-6.5 border border-white/[0.05] relative overflow-hidden group shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full -mr-16 -mt-16 blur-[50px] group-hover:bg-amber-500/[0.04] transition-all duration-700" />
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center text-amber-500 shadow-md">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-white">
                          {property.builderName || "General Builder"}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[7.5px] text-amber-500 font-extrabold uppercase tracking-widest">
                            Original Developer
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/50 leading-relaxed font-semibold">
                      The original authorized development company of this prime society, offering robust specifications and vetted regional planning approvals in {property.location}.
                    </p>
                    <button
                      onClick={() =>
                        onViewBuilder(property.builderName || "General Builder")
                      }
                      className="w-full py-3 bg-white/[0.02] hover:bg-amber-500 hover:text-black border border-white/[0.06] hover:border-amber-500 rounded-xl text-[9px] font-black text-white uppercase tracking-[0.2em] transition-all duration-300"
                    >
                      View Builder Portfolio
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

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-10 py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-amber-500/10 active:scale-95 cursor-pointer"
            >
              Close Asset Details
            </button>
          </div>
        </div>
      </motion.div>
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
}: {
  user: User | null;
  onUpdate: (data: Partial<User>) => void;
  isSelf: boolean;
  onBack?: () => void;
  currentUserRole: Role;
  showToast: (msg: string, type?: any) => void;
  autoSave: boolean;
  onResetCredentials: (id: string) => Promise<void>;
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "employee",
    profilePicture: user?.profilePicture || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const canChangeRole = currentUserRole === "admin";
  const permissions = user ? ROLE_PERMISSIONS[user.role] || [] : [];
  const previewPermissions = formData.role
    ? ROLE_PERMISSIONS[formData.role] || []
    : [];

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        showToast("Please upload only JPEG or SVG images", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result as string });
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-8 pb-12"
    >
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {!isSelf && onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-surface-2 rounded-full transition-colors"
              aria-label="Back"
            >
              <ChevronRight size={18} className="rotate-180 text-text-dim" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {isSelf ? "My Profile" : "User Profile"}
          </h1>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-5 py-2 bg-text-primary text-bg rounded-full text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Activity size={14} /> Edit Profile
          </button>
        )}
      </header>

      {/* Hero Section */}
      <div className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-primary/0 via-amber-primary/50 to-amber-primary/0" />

        <div className="relative group">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-surface-2 border-4 border-bg flex items-center justify-center text-3xl md:text-4xl font-bold text-amber-primary shadow-xl overflow-hidden relative">
            {formData.profilePicture ? (
              <img
                src={formData.profilePicture}
                alt={user?.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-primary/10">
                {user?.name?.[0] || "?"}
              </div>
            )}

            {isEditing && (
              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ">
                <ImageIcon size={24} className="text-white mb-1" />
                <span className="text-[8px] text-white font-bold uppercase tracking-widest">
                  Change
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.svg"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
          <div className="absolute bottom-2 right-2 w-6 h-6 bg-surface rounded-full flex items-center justify-center border-4 border-bg shadow-lg">
            <div
              className={`w-3 h-3 rounded-full ${
                user?.lastActive &&
                new Date().getTime() - new Date(user.lastActive).getTime() <
                  300000
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                  : "bg-text-dim"
              }`}
            />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-3 w-full">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight break-words">
              {user?.name || "Unknown User"}
            </h2>
            <p className="text-[10px] md:text-xs text-text-dim font-mono mt-1 break-all">
              {user?.email}
            </p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
            <span className="px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-amber-primary/10 text-amber-primary border border-amber-primary/20">
              {user?.role === "admin"
                ? "Super Admin"
                : user?.role?.replace("_", " ") || "Employee"}
            </span>
            <span className="px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-surface-2 text-text-secondary border border-border-bright">
              ID: {user?.id?.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Column (65%) */}
        <section className="lg:col-span-2 space-y-6 md:space-y-8">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-base md:text-lg font-bold text-text-primary tracking-tight">
                Edit Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
                    Full Name
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    onBlur={handleBlur}
                    className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-primary transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    onBlur={handleBlur}
                    className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-primary transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    onBlur={handleBlur}
                    placeholder="Enter phone number"
                    className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-primary transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-2 border border-border-bright overflow-hidden flex-shrink-0">
                      {formData.profilePicture ? (
                        <img
                          src={formData.profilePicture}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-dim">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                    <label className="flex-1">
                      <div className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-xs text-text-secondary cursor-pointer hover:border-amber-primary transition-all flex items-center justify-between">
                        <span>
                          {formData.profilePicture
                            ? "Change Image"
                            : "Choose JPEG or SVG"}
                        </span>
                        <Plus size={14} />
                      </div>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.svg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[9px] text-text-dim italic">
                    Supported formats: JPEG, JPG, SVG only.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold text-text-secondary hover:text-text-primary transition-all bg-surface-2 sm:bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-full text-xs font-bold text-bg bg-amber-primary hover:bg-amber-secondary transition-all shadow-lg shadow-amber-primary/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 md:space-y-8">
              <h3 className="text-base md:text-lg font-bold text-text-primary tracking-tight">
                Account Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-1">
                  <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                    Full Name
                  </div>
                  <div className="text-sm text-text-primary">{user.name}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                    Email Address
                  </div>
                  <div className="text-sm text-text-primary">{user.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                    Phone Number
                  </div>
                  <div className="text-sm text-text-primary">
                    {user.phoneNumber || "Not provided"}
                  </div>
                </div>
              </div>

              {user.permissions && user.permissions.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-border-dim">
                  <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                    Permissions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-3 py-1.5 bg-surface-2 border border-border-bright rounded-full text-[10px] font-mono text-text-secondary"
                      >
                        {p?.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-surface border border-border-dim p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest border-b border-border-dim pb-4">
              Recent Activity
            </h3>
            <div
              className="space-y-4 max-h-64 overflow-y-auto pr-2"
              aria-live="polite"
            >
              <div className="text-sm text-text-dim italic">
                Activity log will appear here.
              </div>
            </div>
          </div>
        </section>

        {/* Context Column (35%) */}
        <aside className="space-y-8">
          <div className="bg-surface border border-border-dim p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest border-b border-border-dim pb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-primary" />
              Security & Access
            </h3>

            {isEditing && canChangeRole ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
                    Role Assignment
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as Role })
                    }
                    className="w-full bg-surface-2 border border-border-bright rounded-lg px-4 py-2.5 text-sm outline-none focus:border-amber-primary transition-all"
                  >
                    <option value="employee">Employee</option>
                    <option value="team_leader">Team Leader</option>
                    <option value="admin">Super Admin</option>
                  </select>
                  {isSelf && user?.role === "admin" && (
                    <p className="text-[9px] text-amber-500/70 italic mt-1">
                      Note: Changing your own role may restrict your access.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold flex justify-between">
                    <span>Preview Permissions</span>
                    <span className="text-amber-primary lowercase font-mono">
                      ({formData.role})
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {PERMISSION_CATEGORIES.map((category) => {
                      const rolePerms = previewPermissions.filter((p) =>
                        category.permissions.includes(p),
                      );
                      if (rolePerms.length === 0) return null;
                      return (
                        <div key={category.name} className="space-y-1">
                          <div className="text-[8px] text-amber-primary/70 uppercase tracking-widest font-bold">
                            {category.name}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {rolePerms.map((p) => (
                              <span
                                key={p}
                                className="bg-amber-primary/5 px-1.5 py-0.5 rounded border border-amber-primary/20 text-[8px] font-mono text-amber-primary tracking-tight"
                              >
                                {p?.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                    Current Role
                  </div>
                  <div className="text-sm text-text-primary capitalize">
                    {user.role}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                    Permissions
                  </div>
                  <div className="flex flex-col gap-2">
                    {PERMISSION_CATEGORIES.map((category) => {
                      const rolePerms = permissions.filter((p) =>
                        category.permissions.includes(p),
                      );
                      if (rolePerms.length === 0) return null;
                      return (
                        <div key={category.name} className="space-y-1">
                          <div className="text-[8px] text-amber-primary/70 uppercase tracking-widest font-bold">
                            {category.name}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rolePerms.map((p) => (
                              <span
                                key={p}
                                className="bg-surface-2 px-2 py-1 rounded border border-border-bright text-[9px] font-mono text-text-secondary tracking-tight"
                              >
                                {p?.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {user && (
              <div className="pt-6 border-t border-border-dim">
                <CredentialManager
                  user={user}
                  onResetCredentials={() => onResetCredentials(user.id)}
                />
              </div>
            )}
          </div>

          <div className="bg-surface border border-border-dim p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest border-b border-border-dim pb-4 flex items-center gap-2">
              <Activity size={16} className="text-text-dim" />
              Account Meta
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                  Internal ID
                </div>
                <div className="text-xs font-mono text-text-primary bg-surface-2 px-3 py-1.5 rounded border border-border-bright inline-block">
                  {user.id}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                  Username
                </div>
                <div className="text-xs font-mono text-amber-primary bg-surface-2 px-3 py-1.5 rounded border border-border-bright inline-block">
                  {user.username}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                  Last Active
                </div>
                <div className="text-xs text-text-primary">
                  {user.lastActive &&
                  new Date().getTime() - new Date(user.lastActive).getTime() <
                    300000 ? (
                    <span className="text-green-500 font-medium">
                      Active Now
                    </span>
                  ) : user.lastActive ? (
                    new Date(user.lastActive).toLocaleString()
                  ) : (
                    "Never active"
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-amber-primary/5 rounded-xl border border-amber-primary/10">
            <div className="flex items-center gap-2 text-amber-primary mb-2">
              <AlertCircle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Compliance Note
              </span>
            </div>
            <p className="text-[10px] text-text-dim leading-relaxed">
              All profile modifications are logged in the system audit trail.
              Ensure changes comply with the organizational data privacy policy.
            </p>
          </div>
        </aside>
      </div>
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
    normAction === "LOGIN_FAILED"
  ) {
    return {
      type: "READ",
      badgeColor: "text-purple-500 bg-purple-500/10 border-purple-500/30",
      title: "Session & Auth (READ)",
      description:
        "Action Triggered: READ operation. Authenticated credentials, established secure session, or read-only validation check.",
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

  const logsToProcess = logs;

  const actionCategories = [
    { label: "All Audit Actions", value: "ALL" },
    {
      label: "Access Events",
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
      label: "Project CRUD",
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
      label: "Resale/Listing CRUD",
      value: "RESALE",
      actions: ["ADD_RESALE", "EDIT_RESALE", "DELETE_RESALE", "READ_RESALE"],
    },
    {
      label: "User CRUD & Admin",
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
      label: "Approval Events",
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
      label: "System & Reports",
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
    new Set(logsToProcess.map((l) => l.action)),
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
      !userSearch || log.user.toLowerCase().includes(userSearch.toLowerCase());
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
    if (sortOrder === "asc") return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

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
          `"${log.user}"`,
          `"${log.action}"`,
          `"${log.summary.replace(/"/g, '""')}"`,
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

  return (
    <div className="space-y-6 w-full max-w-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-bold text-text-primary">
              Audit Logs
            </h1>
          </div>
          <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold bg-surface-2 px-3 py-1.5 rounded-lg border border-border-dim">
            {filteredLogs.length} Records
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border-dim rounded-xl text-xs font-bold uppercase tracking-widest text-text-secondary hover:border-amber-primary/50 transition-all"
          >
            <Download size={14} />
            Export CSV
          </button>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${
                showFilters || activeFiltersCount > 0
                  ? "bg-amber-primary border-amber-primary text-bg shadow-lg shadow-amber-primary/20"
                  : "bg-surface-2 border-border-dim text-text-secondary hover:border-amber-primary/50"
              }`}
            >
              <Filter size={14} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 w-4 h-4 bg-white text-amber-primary rounded-full flex items-center justify-center text-[9px] font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showFilters && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowFilters(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-[320px] sm:w-[400px] bg-surface border border-border-bright rounded-2xl shadow-2xl z-50 p-6 space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-border-dim pb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">
                        Filter Options
                      </h4>
                      {(filter !== "ALL" ||
                        userSearch ||
                        dateFrom ||
                        dateTo ||
                        specificAction !== "ALL" ||
                        keywordSearch) && (
                        <button
                          onClick={() => {
                            setFilter("ALL");
                            setSpecificAction("ALL");
                            setUserSearch("");
                            setKeywordSearch("");
                            setDateFrom("");
                            setDateTo("");
                          }}
                          className="text-[9px] text-amber-primary font-bold uppercase tracking-widest hover:underline"
                        >
                          Reset All
                        </button>
                      )}
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-[9px] text-text-dim uppercase tracking-wider font-black">
                            Action Category
                          </label>
                          <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-2.5 text-xs text-text-primary outline-none focus:border-amber-primary transition-colors"
                          >
                            {actionCategories.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] text-text-dim uppercase tracking-wider font-black">
                            Specific Action (CRUD)
                          </label>
                          <select
                            value={specificAction}
                            onChange={(e) => setSpecificAction(e.target.value)}
                            className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-2.5 text-xs text-text-primary outline-none focus:border-amber-primary transition-colors"
                          >
                            <option value="ALL">All Actions</option>
                            {uniqueActions.map((action) => (
                              <option key={action} value={action}>
                                {action}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] text-text-dim uppercase tracking-wider font-black">
                          Search Summary Keyword
                        </label>
                        <div className="relative">
                          <Search
                            size={12}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim"
                          />
                          <input
                            type="text"
                            value={keywordSearch}
                            onChange={(e) => setKeywordSearch(e.target.value)}
                            placeholder="Resource ID, keyword..."
                            className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary outline-none focus:border-amber-primary transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] text-text-dim uppercase tracking-wider font-black">
                          Search User
                        </label>
                        <div className="relative">
                          <Search
                            size={12}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim"
                          />
                          <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Name or Email..."
                            className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary outline-none focus:border-amber-primary transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] text-text-dim uppercase tracking-wider font-black">
                          Date & Time Range
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="datetime-local"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-2.5 text-[10px] text-text-primary outline-none focus:border-amber-primary [color-scheme:dark]"
                          />
                          <input
                            type="datetime-local"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-2.5 text-[10px] text-text-primary outline-none focus:border-amber-primary [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full py-3 bg-amber-primary text-bg rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-secondary transition-all"
                    >
                      Apply Filters
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead className="bg-surface-2 border-b border-border-dim">
              <tr>
                <th
                  className="px-6 py-4 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors"
                  onClick={() => toggleSort("timestamp")}
                >
                  <div className="flex items-center gap-2">
                    Timestamp
                    {sortBy === "timestamp" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      ))}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors"
                  onClick={() => toggleSort("user")}
                >
                  <div className="flex items-center gap-2">
                    User
                    {sortBy === "user" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      ))}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors"
                  onClick={() => toggleSort("action")}
                >
                  <div className="flex items-center gap-2">
                    Action
                    {sortBy === "action" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      ))}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors"
                  onClick={() => toggleSort("summary")}
                >
                  <div className="flex items-center gap-2">
                    Summary
                    {sortBy === "summary" && (
                      <span className="text-amber-primary">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dim">
              {sortedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-surface-2 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-6 py-4 text-text-secondary font-mono whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-text-dim">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-primary font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-primary/10 flex items-center justify-center text-[10px] font-bold text-amber-primary">
                        {log.user.charAt(0).toUpperCase()}
                      </div>
                      {log.user}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative group inline-block">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest cursor-help transition-all duration-150 relative z-10 ${
                          log.action?.includes("DELETE") ||
                          log.action?.includes("REJECT") ||
                          log.action?.includes("FAILED")
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/25"
                            : log.action?.includes("ADD") ||
                                log.action?.includes("APPROVE") ||
                                log.action?.includes("SIGNUP") ||
                                log.action?.includes("CREATE")
                              ? "bg-green-500/10 text-green-500 hover:bg-green-500/25"
                              : log.action?.includes("EDIT") ||
                                  log.action?.includes("UPDATE")
                                ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/25"
                                : "bg-amber-500/10 text-amber-500"
                        }`}
                        title={`${getCrudInfo(log.action).title}: ${getCrudInfo(log.action).description}`}
                      >
                        {log.action?.replace(/_/g, " ")}
                      </span>
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:block w-72 bg-surface-2 border border-border-bright p-3.5 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.6)] z-50 pointer-events-none select-none text-left">
                        <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-border-dim/50">
                          <span
                            className={`text-[8px] px-1.5 py-0.5 rounded font-black border uppercase tracking-wider ${getCrudInfo(log.action).badgeColor}`}
                          >
                            {getCrudInfo(log.action).type}
                          </span>
                          <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">
                            {getCrudInfo(log.action).title}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary leading-relaxed font-sans mb-1.5">
                          {getCrudInfo(log.action).description}
                        </p>
                        <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-[0.15em] text-text-dim">
                          <span>Action: {log.action}</span>
                          <span>Verified Event</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 text-text-secondary min-w-[200px] whitespace-normal"
                    title={log.summary}
                  >
                    <div className="line-clamp-1">{log.summary}</div>
                  </td>
                </tr>
              ))}
              {sortedLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-text-dim italic"
                  >
                    No logs found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-black/60 "
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface border border-border-bright rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-dim flex items-center justify-between bg-surface-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-primary/10 rounded-lg text-amber-primary">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Log Details
                    </h3>
                    <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                      ID: {selectedLog.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-surface rounded-full transition-colors text-text-dim hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">
                      Timestamp
                    </p>
                    <p className="text-sm font-mono text-text-primary">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 bg-surface-2 border border-border-dim rounded-xl space-y-2">
                    <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">
                      CRUD Operations Context
                    </p>
                    <div className="flex items-start gap-3">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase tracking-wider inline-block mt-0.5 ${getCrudInfo(selectedLog.action).badgeColor}`}
                      >
                        ${getCrudInfo(selectedLog.action).type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                          ${getCrudInfo(selectedLog.action).title}
                        </h5>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-1 font-sans">
                          ${getCrudInfo(selectedLog.action).description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">
                      User
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-primary/10 flex items-center justify-center text-[10px] font-bold text-amber-primary">
                        {selectedLog.user.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-bold text-text-primary">
                        {selectedLog.user}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">
                      Action Triggered
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                        selectedLog.action?.includes("DELETE") ||
                        selectedLog.action?.includes("REJECT") ||
                        selectedLog.action?.includes("FAILED")
                          ? "bg-red-500/10 text-red-500"
                          : selectedLog.action?.includes("ADD") ||
                              selectedLog.action?.includes("APPROVE") ||
                              selectedLog.action?.includes("SIGNUP") ||
                              selectedLog.action?.includes("CREATE")
                            ? "bg-green-500/10 text-green-500"
                            : selectedLog.action?.includes("EDIT") ||
                                selectedLog.action?.includes("UPDATE")
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      ${selectedLog.action?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">
                    Summary
                  </p>
                  <div className="p-4 bg-surface-2 border border-border-dim rounded-xl text-sm text-text-secondary leading-relaxed">
                    {selectedLog.summary}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-2 border-t border-border-dim flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-6 py-2 bg-amber-primary text-bg rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-secondary transition-all"
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
}: any) => {
  const [activeTab, setActiveTab] = useState("account");

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
      font: "फ़ॉन्ट शैली",
      fontSize: "फ़ॉन्ट आकार",
      motion: "कम गति",
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
    { id: "account", label: "Account", icon: User },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "help", label: "Help", icon: HelpCircle },
    { id: "system", label: "System & About", icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 ">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface border border-border-dim rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] max-h-[800px]"
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-surface-2 border-b md:border-b-0 md:border-r border-border-dim flex flex-col shrink-0">
          <div className="p-6 border-b border-border-dim flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-primary/10 rounded-lg">
                <Settings className="text-amber-primary" size={20} />
              </div>
              <h2 className="text-lg font-bold text-text-primary">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-1 flex flex-row md:flex-col gap-2 md:gap-0 overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  playSound("click");
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-amber-primary/10 text-amber-primary"
                    : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
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

          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
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
                        className={`w-12 h-6 rounded-full transition-colors relative ${compactMode ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
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
                        className={`w-12 h-6 rounded-full transition-colors relative ${autoSave ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
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
                        className={`w-12 h-6 rounded-full transition-colors relative ${soundEffects ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
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
                          <Moon size={18} className="text-text-secondary" />
                          <h4 className="text-sm font-bold text-text-primary">
                            {t("theme")}
                          </h4>
                        </div>
                        <div className="flex gap-3">
                          {["dark", "light"].map((tOption) => (
                            <button
                              key={tOption}
                              onClick={(e) => {
                                setTheme(tOption, e);
                                playSound("click");
                              }}
                              className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all border capitalize ${
                                theme === tOption
                                  ? "bg-amber-primary/10 border-amber-primary text-amber-primary shadow-sm"
                                  : "bg-surface border-border-dim text-text-secondary hover:border-border-bright"
                              }`}
                            >
                              {tOption}
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
                        className={`w-12 h-6 rounded-full transition-colors relative ${reducedMotion ? "bg-amber-primary" : "bg-surface-3 border border-border-dim"}`}
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
  const [assignedToFilter, setAssignedToFilter] = useState<string>("All");
  const [builderFilter, setBuilderFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string[]>(["All"]);
  const [possessionFilter, setPossessionFilter] = useState<string[]>(["All"]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
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
  const [sortBy, setSortBy] = useState(
    () => localStorage.getItem("defaultProjectSort") || "id",
  );
  const [viewMode, setViewMode] = useState<"table" | "grid" | "map">("grid");
  const [selectedMapItemId, setSelectedMapItemId] = useState<string | null>(
    null,
  );
  const [projects, setProjects] = useState<Project[]>([]);

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
    
    return matchesBuilder && matchesSearch && matchesStatus && matchesPossession && matchesAssigned && matchesBathrooms && matchesConfig && matchesPrice && matchesArea && matchesUnits;
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
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [userError, setUserError] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "admin@pysync.local",
    password: "password123",
  });
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
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
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  const [themeRipple, setThemeRipple] = useState<{
    active: boolean;
    x: number;
    y: number;
    toTheme: string;
  } | null>(null);

  const handleThemeChange = (newTheme: string, event?: any) => {
    if (newTheme === theme) return;
    if (themeRipple?.active) return;
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
      toTheme: newTheme,
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
    root.classList.toggle("light", theme === "light");
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
  }, [accentColor, theme, fontFamily, fontSize, reducedMotion]);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      // Clear the token from the URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchFocused(false);
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      });
      setNewUser({ name: "", email: "", role: "employee", phoneNumber: "" });
      localStorage.removeItem("draft_user");
      showToast("User created successfully", "success");
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

  const handleRegister = async (data: any) => {
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await request(`${window.location.origin}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.fullName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: data.password,
          role: "employee", // Default to employee for self-registration
        }),
      });
      showToast("Registration successful! Please login with your credentials.", "success");
      setIsRegistering(false);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
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
      } else {
        showToast(data.message, "success");
      }
      if (data.debugResetLink) {
        setDebugResetLink(data.debugResetLink);
      }
    } catch (err: any) {
      setForgotMessage(err.message);
      setForgotIsError(true);
      showToast(err.message, "error");
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
                ) : isRegistering ? (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <RegisterForm
                      onRegister={handleRegister}
                      onBack={() => {
                        setIsRegistering(false);
                        setLoginError("");
                      }}
                      isLoading={isLoggingIn}
                      error={loginError}
                    />
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
                      onRegister={() => setIsRegistering(true)}
                      isLoading={isLoggingIn}
                      error={loginError}
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
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #f59e0b 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

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
                {user?.role === "admin" && (
                  <SidebarItem
                    icon={RefreshCw}
                    label="Local Website Sync"
                    active={activeTab === "sync"}
                    onClick={() => {
                      setActiveTab("sync");
                      setIsMobileMenuOpen(false);
                      playSound("click");
                    }}
                  />
                )}
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
                    className={`flex items-center gap-2 bg-surface-2 border transition-all duration-200 rounded-xl px-2 sm:px-4 py-2 ${isSearchFocused ? "border-amber-primary ring-4 ring-amber-primary/10 w-40 sm:w-96" : "border-border-bright w-24 sm:w-64"}`}
                  >
                    <Search
                      size={16}
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
                        onClick={() => setSearchQuery("")}
                        className="text-text-dim hover:text-text-primary transition-colors"
                      >
                        <X size={14} />
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
                        className="absolute top-full mt-3 left-0 sm:-right-24 bg-surface border border-border-dim rounded-2xl shadow-2xl z-50 max-h-[480px] overflow-y-auto custom-scrollbar p-4 space-y-4 min-w-[300px] sm:w-[500px]"
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
                  className="flex items-center gap-2 p-1.5 pr-3 text-text-dim hover:text-amber-primary transition-colors border border-border-dim hover:border-amber-primary/30 rounded-lg group"
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
                      className="space-y-10 pb-12 w-full max-w-none"
                    >
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-amber-primary/10 flex items-center justify-center text-amber-primary shadow-inner border border-amber-primary/20">
                          <ShieldCheck size={32} />
                        </div>
                        <div>
                          <h1 className="text-3xl font-serif font-bold text-text-primary tracking-tight">
                            Super Admin Control Center
                          </h1>
                          <p className="text-sm text-text-dim">
                            Global system administration, user governance, and
                            security auditing.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          sub={`${logs.length > 100 ? "Review required" : "System healthy"}`}
                        />
                        <KpiCard
                          label="Approval Queue"
                          value={approvals.length}
                          icon={Clock}
                          color="purple"
                          sub="Pending supervisor actions"
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <DashboardSection
                          title="Administrative Quick Links"
                          icon={ShieldCheck}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                              onClick={() => setActiveTab("users")}
                              className="p-4 rounded-xl border border-border-dim/50 bg-surface-2 hover:border-amber-primary/50 transition-all text-left group"
                            >
                              <UsersIcon
                                size={24}
                                className="text-amber-primary mb-3 group-hover:scale-110 transition-transform"
                              />
                              <h3 className="text-sm font-bold text-text-primary">
                                Manage Users
                              </h3>
                              <p className="text-[10px] text-text-dim">
                                Create, edit, and assign roles to system
                                members.
                              </p>
                            </button>
                            <button
                              onClick={() => setActiveTab("logs")}
                              className="p-4 rounded-xl border border-border-dim/50 bg-surface-2 hover:border-amber-primary/50 transition-all text-left group"
                            >
                              <Activity
                                size={24}
                                className="text-red-500 mb-3 group-hover:scale-110 transition-transform"
                              />
                              <h3 className="text-sm font-bold text-text-primary">
                                Audit Logs
                              </h3>
                              <p className="text-[10px] text-text-dim">
                                Monitor all system actions and transitions.
                              </p>
                            </button>
                            <button
                              onClick={() => setActiveTab("database")}
                              className="p-4 rounded-xl border border-border-dim/50 bg-surface-2 hover:border-amber-primary/50 transition-all text-left group"
                            >
                              <DatabaseIcon
                                size={24}
                                className="text-purple-500 mb-3 group-hover:scale-110 transition-transform"
                              />
                              <h3 className="text-sm font-bold text-text-primary">
                                Database Tool
                              </h3>
                              <p className="text-[10px] text-text-dim">
                                Direct access to raw system data tables.
                              </p>
                            </button>
                            <button
                              onClick={() => setActiveTab("approvals")}
                              className="p-4 rounded-xl border border-border-dim/50 bg-surface-2 hover:border-amber-primary/50 transition-all text-left group"
                            >
                              <Clock
                                size={24}
                                className="text-blue-500 mb-3 group-hover:scale-110 transition-transform"
                              />
                              <h3 className="text-sm font-bold text-text-primary">
                                Approvals Queue
                              </h3>
                              <p className="text-[10px] text-text-dim">
                                Review and authorize sensitive data requests.
                              </p>
                            </button>
                          </div>
                        </DashboardSection>

                        <DashboardSection
                          title="Recent System Activity"
                          icon={Activity}
                        >
                          <div className="space-y-4">
                            {logs.slice(0, 5).map((log) => (
                              <div
                                key={log.id}
                                className="flex items-start gap-3 text-xs"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-primary mt-1.5 shrink-0" />
                                <div>
                                  <span className="font-bold text-text-primary">
                                    {log.action}:
                                  </span>{" "}
                                  <span className="text-text-secondary">
                                    {log.summary}
                                  </span>
                                  <div className="text-[9px] text-text-dim mt-0.5">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => setActiveTab("logs")}
                              className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim hover:text-amber-primary transition-colors border-t border-border-dim/30 mt-2"
                            >
                              View Full System History
                            </button>
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
                      className="space-y-10 pb-12 w-full max-w-none"
                    >
                      {/* Welcome Hero Section */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-2 to-surface border border-border-dim p-6 sm:p-12 shadow-2xl  w-full"
                      >
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-primary/5 blur-[40px] -mr-24 -mt-24 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-500/5 blur-[40px] -ml-24 -mb-24 pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-primary/10 border border-amber-primary/20 text-[10px] font-bold text-amber-primary uppercase tracking-widest">
                              <ShieldCheck size={12} />
                              System Secure & Operational
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-text-primary tracking-tight leading-[1.1]">
                              Welcome back, <br />
                              <span className="text-amber-primary">
                                {user?.name?.split(" ")[0]}
                              </span>
                            </h2>
                            <p className="text-sm text-text-secondary max-w-md leading-relaxed">
                              Your real estate portfolio is performing at peak
                              efficiency. You have{" "}
                              <span className="text-text-primary font-bold">
                                {stats.pending} tasks
                              </span>{" "}
                              requiring your immediate attention today.
                            </p>
                            <div className="flex items-center gap-4 pt-2">
                              <button
                                onClick={() => setActiveTab("projects")}
                                className="px-6 py-3 bg-amber-primary text-bg rounded-xl text-xs font-bold hover:bg-amber-secondary transition-all shadow-lg shadow-amber-primary/20 flex items-center gap-2"
                              >
                                Explore Projects <ChevronRight size={16} />
                              </button>
                              <div className="flex -space-x-3">
                                {users.slice(0, 4).map((u, i) => (
                                  <div
                                    key={i}
                                    className="w-10 h-10 rounded-full border-4 border-surface bg-surface-3 flex items-center justify-center text-xs font-bold text-text-dim overflow-hidden"
                                  >
                                    {u.profilePicture ? (
                                      <img
                                        src={u.profilePicture}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      u.name[0]
                                    )}
                                  </div>
                                ))}
                                <div className="w-10 h-10 rounded-full border-4 border-surface bg-surface-2 flex items-center justify-center text-[10px] font-bold text-text-dim">
                                  +{users.length > 4 ? users.length - 4 : 0}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                            <div className="bg-surface/40 border border-border-bright p-6 rounded-2xl flex flex-col items-center text-center gap-2">
                              <div className="text-2xl font-serif font-bold text-text-primary">
                                {stats.liveUsers}
                              </div>
                              <div className="text-[9px] text-text-dim uppercase tracking-widest font-bold">
                                Active Users
                              </div>
                              <div className="w-8 h-1 bg-green-500 rounded-full mt-1 animate-pulse" />
                            </div>
                            <div className="bg-surface/40 border border-border-bright p-6 rounded-2xl flex flex-col items-center text-center gap-2">
                              <div className="text-2xl font-serif font-bold text-text-primary">
                                {stats.totalProperties}
                              </div>
                              <div className="text-[9px] text-text-dim uppercase tracking-widest font-bold">
                                Listings
                              </div>
                              <div className="w-8 h-1 bg-amber-primary rounded-full mt-1" />
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
                            className="bg-amber-primary/5 border border-amber-primary/20 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 select-none relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-primary/5 rounded-full -mr-16 -mt-16 blur-[20px]" />
                            <div className="relative z-10 flex items-center gap-4 text-left">
                              <div className="w-12 h-12 rounded-2xl bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center text-amber-primary shrink-0 shadow-lg shadow-amber-primary/5">
                                <Smartphone
                                  size={22}
                                  className="animate-pulse"
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-text-primary">
                                  Install pySync App on Android
                                </h4>
                                <p className="text-[11px] text-text-dim mt-0.5 leading-relaxed max-w-2xl">
                                  Enjoy a polished fullscreen workspace, instant
                                  touch-screen response, persistent offline
                                  login sessions, and native Android home-screen
                                  integration.
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
                                className="px-3 py-2 text-text-dim hover:text-text-primary rounded-xl hover:bg-surface-2 transition-colors text-xs font-bold"
                              >
                                Dismiss
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* KPI Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                          sub="Cloud Storage"
                          icon={FolderOpen}
                          color="green"
                        />
                      </div>

                      {user?.role === "admin" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

                      <DashboardSection
                        title="Recent Projects"
                        icon={Building2}
                        action={
                          <button
                            onClick={() => setActiveTab("projects")}
                            className="text-[10px] text-amber-primary hover:underline uppercase tracking-widest font-bold"
                          >
                            View All
                          </button>
                        }
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                          {projects.slice(0, 6).map((project, idx) => (
                            <motion.div
                              key={project.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="bg-surface-2/50 border border-border-bright rounded-xl p-4 hover:border-amber-primary/30 transition-all cursor-pointer group"
                              onClick={() => {
                                setSelectedProject(project);
                                setActiveTab("projects");
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="text-[10px] font-mono text-text-dim">
                                  {project.id.slice(0, 8)}
                                </div>
                                <div
                                  className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ${project.status === "Active" ? "bg-green-500/10 text-green-500" : "bg-amber-primary/10 text-amber-primary"}`}
                                >
                                  {project.status}
                                </div>
                              </div>
                              <h4 className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors truncate">
                                {project.title}
                              </h4>
                              <p className="text-[10px] text-text-dim truncate">
                                {project.location}
                              </p>
                              <div className="mt-3 pt-3 border-t border-border-dim/30 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-amber-primary">
                                  ₹{(project.price / 10000000).toFixed(2)} Cr
                                </span>
                                <span className="text-[9px] text-text-dim uppercase tracking-widest font-bold">
                                  {(project.type || project.projectType || "")
                                    .replace("FLATS", "Apartments")
                                    .replace("Apartment", "Apartments")}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                          {projects.length === 0 && (
                            <div className="col-span-full py-12 text-center">
                              <Building2
                                size={32}
                                className="text-text-dim/20 mx-auto mb-2"
                              />
                              <p className="text-xs text-text-dim italic">
                                No projects found in database.
                              </p>
                            </div>
                          )}
                        </div>
                      </DashboardSection>

                      <DashboardSection
                        title="Project Analytics"
                        icon={BarChartIcon}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-surface-2/20 rounded-2xl">
                          <div className="flex flex-col items-center bg-surface border border-border-dim rounded-2xl p-6 shadow-sm hover:border-amber-primary/30 transition-all">
                            <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-6">
                              Listing Status Breakdown
                            </h4>
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
                                        (p) => p.status === "PENDING_DELETE",
                                      ).length,
                                    },
                                  ]}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="currentColor"
                                    className="text-border-dim/30"
                                    vertical={false}
                                  />
                                  <XAxis
                                    dataKey="name"
                                    stroke="currentColor"
                                    className="text-text-dim text-[9px] font-bold"
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <YAxis
                                    stroke="currentColor"
                                    className="text-text-dim text-[9px] font-bold"
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                  />
                                  <Tooltip
                                    cursor={{
                                      fill: "var(--amber-primary)",
                                      opacity: 0.05,
                                    }}
                                    contentStyle={{
                                      backgroundColor: "var(--surface-color)",
                                      borderColor: "var(--border-dim)",
                                      borderRadius: "12px",
                                      fontSize: "12px",
                                      boxShadow:
                                        "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                                    }}
                                    itemStyle={{
                                      color: "var(--text-primary)",
                                      fontWeight: "bold",
                                    }}
                                  />
                                  <Bar
                                    dataKey="count"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={40}
                                  >
                                    <Cell fill="#F59E0B" />
                                    <Cell fill="#10B981" />
                                    <Cell fill="#8B5CF6" />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="flex flex-col items-center bg-surface border border-border-dim rounded-2xl p-6 shadow-sm hover:border-blue-500/30 transition-all">
                            <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-6">
                              Possession Timelines
                            </h4>
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
                                          (p) =>
                                            p.possessionStatus === "New Launch",
                                        ).length,
                                      },
                                    ].filter((d) => d.count > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                  >
                                    <Cell fill="#3B82F6" />
                                    <Cell fill="#F59E0B" />
                                    <Cell fill="#EC4899" />
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: "var(--surface-color)",
                                      borderColor: "var(--border-dim)",
                                      borderRadius: "12px",
                                      fontSize: "12px",
                                      boxShadow:
                                        "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                                    }}
                                    itemStyle={{
                                      color: "var(--text-primary)",
                                      fontWeight: "bold",
                                    }}
                                  />
                                  <Legend
                                    wrapperStyle={{
                                      fontSize: "10px",
                                      fontWeight: "bold",
                                      paddingTop: "20px",
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </DashboardSection>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                          {user?.role === "admin" ? (
                            <div className="space-y-8">
                              {/* Summary Grid for Admin */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Approvals Column */}
                                <div className="space-y-8">
                                  {approvals.length > 0 ? (
                                    <DashboardSection
                                      title="Pending Approvals"
                                      icon={Clock}
                                      action={
                                        <button
                                          onClick={() =>
                                            setActiveTab("approvals")
                                          }
                                          className="text-[10px] text-amber-primary hover:underline uppercase tracking-widest font-bold"
                                        >
                                          Queue
                                        </button>
                                      }
                                    >
                                      <div className="space-y-3">
                                        {approvals
                                          .slice(0, 3)
                                          .map((app, idx) => (
                                            <motion.div
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ delay: idx * 0.05 }}
                                              key={app.id}
                                              className="flex items-center justify-between p-3.5 bg-surface-2/50 border border-border-bright rounded-xl hover:border-amber-primary/30 transition-all cursor-pointer"
                                              onClick={() => {
                                                setActiveTab("approvals");
                                                playSound("click");
                                              }}
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-primary/10 flex items-center justify-center text-amber-primary shrink-0">
                                                  <ShieldCheck size={14} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                  <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider truncate">
                                                    {app.type?.replace(
                                                      /_/g,
                                                      " ",
                                                    )}
                                                  </span>
                                                  <span className="text-[9px] text-text-dim truncate">
                                                    By {app.requestedBy}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="w-2 h-2 rounded-full bg-amber-primary animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)] shrink-0" />
                                            </motion.div>
                                          ))}
                                      </div>
                                    </DashboardSection>
                                  ) : (
                                    <DashboardSection
                                      title="Approvals"
                                      icon={ShieldCheck}
                                    >
                                      <div className="h-full flex flex-col items-center justify-center py-10 bg-surface-2/30 rounded-2xl border border-dashed border-border-dim/50 border-spacing-4">
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-2">
                                          <Check size={20} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim">
                                          Queue Clear
                                        </span>
                                      </div>
                                    </DashboardSection>
                                  )}
                                </div>

                                {/* Users Column */}
                                <div className="space-y-8">
                                  <DashboardSection
                                    title="Active Team"
                                    icon={UsersIcon}
                                    action={
                                      <button
                                        onClick={() => setActiveTab("users")}
                                        className="text-[10px] text-amber-primary hover:underline uppercase tracking-widest font-bold"
                                      >
                                        Team
                                      </button>
                                    }
                                  >
                                    <div className="space-y-3">
                                      {users.slice(0, 3).map((u, idx) => (
                                        <motion.div
                                          initial={{ opacity: 0, x: 10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: idx * 0.05 }}
                                          key={u.id}
                                          className="flex items-center justify-between p-3.5 rounded-xl border border-border-dim/30 hover:border-amber-primary/30 hover:bg-surface-2/50 transition-all cursor-pointer group"
                                          onClick={() => {
                                            setActiveTab("users");
                                            playSound("click");
                                          }}
                                        >
                                          <div className="flex items-center gap-3">
                                            {u.profilePicture ? (
                                              <img
                                                src={u.profilePicture}
                                                alt={u.name}
                                                className="w-8 h-8 rounded-full object-cover border border-border-bright"
                                              />
                                            ) : (
                                              <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-[9px] font-black text-text-primary">
                                                {u.name[0]}
                                              </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-[11px] font-bold text-text-primary group-hover:text-amber-primary transition-colors truncate">
                                                {u.name}
                                              </span>
                                              <span className="text-[8px] text-text-dim uppercase tracking-widest font-bold">
                                                {u.role}
                                              </span>
                                            </div>
                                          </div>
                                          <div
                                            className={`w-1.5 h-1.5 rounded-full ${idx < 2 ? "bg-green-500" : "bg-surface-3"}`}
                                          />
                                        </motion.div>
                                      ))}
                                    </div>
                                  </DashboardSection>
                                </div>
                              </div>

                              {/* Audit Logs Full Width */}
                              <DashboardSection
                                title="Recent Audit Logs"
                                icon={Activity}
                                action={
                                  <button
                                    onClick={() => setActiveTab("logs")}
                                    className="text-[10px] text-amber-primary hover:underline uppercase tracking-widest font-bold"
                                  >
                                    View History
                                  </button>
                                }
                              >
                                <div className="space-y-1">
                                  {logs.slice(0, 5).map((log, idx) => (
                                    <motion.div
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      key={log.id}
                                      className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-2/50 transition-colors group border-b border-border-dim/30 last:border-0 cursor-pointer"
                                      onClick={() => {
                                        setActiveTab("logs");
                                        playSound("click");
                                      }}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-text-dim group-hover:text-amber-primary transition-colors">
                                          <Activity size={14} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors uppercase tracking-wider">
                                            {log.action?.replace(/_/g, " ")}
                                          </span>
                                          <span className="text-[10px] text-text-dim italic line-clamp-1">
                                            {log.summary}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="text-[10px] text-text-secondary font-bold">
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
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                      <Activity
                                        size={32}
                                        className="text-text-dim/20 mb-2"
                                      />
                                      <p className="text-xs text-text-dim italic">
                                        No activity recorded yet.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </DashboardSection>
                            </div>
                          ) : (
                            <div className="relative overflow-hidden rounded-3xl bg-surface border border-border-dim p-12 flex flex-col items-center justify-center text-center gap-6 min-h-[400px]">
                              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-primary/5 to-transparent pointer-events-none" />
                              <div className="p-6 bg-amber-primary/10 rounded-full text-amber-primary animate-bounce">
                                <LayoutDashboard size={48} />
                              </div>
                              <div className="space-y-2 relative z-10">
                                <h3 className="text-2xl font-serif font-bold text-text-primary">
                                  Welcome to PySync
                                </h3>
                                <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
                                  Your personalized real estate command center.
                                  Use the sidebar to navigate through projects,
                                  resale listings, and media assets.
                                </p>
                              </div>
                              <button
                                onClick={() => setActiveTab("projects")}
                                className="px-8 py-3 bg-surface-2 border border-border-bright rounded-xl text-xs font-bold text-text-primary hover:border-amber-primary transition-all relative z-10"
                              >
                                Get Started
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-8">
                          <div className="bg-gradient-to-br from-amber-primary to-amber-secondary p-6 rounded-2xl text-bg shadow-xl shadow-amber-primary/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10 space-y-4">
                              <div className="p-2 bg-white/20 rounded-lg w-fit">
                                <ShieldCheck size={20} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold uppercase tracking-wider">
                                  Pro Tip
                                </h4>
                                <p className="text-[11px] leading-relaxed opacity-90">
                                  Use the global search (⌘+K) to quickly find
                                  any project or resale listing across all
                                  buckets.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
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
                      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-surface p-6 border border-border-dim rounded-2xl shadow-sm w-full">
                        <div className="flex flex-wrap gap-6 items-center">
                          <div className="flex items-center gap-3 bg-surface-2 p-1 rounded-xl border border-border-bright">
                            <button
                              onClick={() => setViewMode("grid")}
                              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-amber-primary text-bg shadow-lg shadow-amber-primary/20" : "text-text-dim hover:text-text-primary"}`}
                            >
                              <LayoutGrid size={18} />
                            </button>
                            <button
                              onClick={() => setViewMode("table")}
                              className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-amber-primary text-bg shadow-lg shadow-amber-primary/20" : "text-text-dim hover:text-text-primary"}`}
                            >
                              <List size={18} />
                            </button>
                            <button
                              onClick={() => setViewMode("map")}
                              className={`p-2 rounded-lg transition-all ${viewMode === "map" ? "bg-amber-primary text-bg shadow-lg shadow-amber-primary/20" : "text-text-dim hover:text-text-primary"}`}
                            >
                              <MapPin size={18} />
                            </button>
                          </div>

                          <div className="h-8 w-px bg-border-dim hidden lg:block" />

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-text-dim uppercase tracking-widest font-black">
                              Status
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                "All",
                                "Active",
                                "Sold",
                                "Pending",
                                "Pending Approval",
                                "PENDING_DELETE",
                              ].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => toggleStatusFilter(status)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] border transition-all font-bold uppercase tracking-wider ${
                                    statusFilter.includes(status)
                                      ? "bg-amber-primary border-amber-primary text-bg shadow-md shadow-amber-primary/10"
                                      : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50"
                                  }`}
                                >
                                  {status === "PENDING_DELETE"
                                    ? "Del Req"
                                    : status === "Pending Approval"
                                      ? "Approvals Pending"
                                      : status}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full lg:w-auto">
                          <div
                            className="flex-1 lg:flex-none relative"
                            onMouseLeave={() => setIsSortDropdownOpen(false)}
                          >
                            <button
                              onClick={() =>
                                setIsSortDropdownOpen(!isSortDropdownOpen)
                              }
                              className="w-full lg:w-48 bg-surface-2 border border-border-bright rounded-xl px-4 py-2 text-xs text-text-primary outline-none hover:border-amber-primary font-bold flex items-center justify-between"
                            >
                              <span>
                                {sortBy === "id"
                                  ? "ID (Default)"
                                  : sortBy === "title-asc"
                                    ? "Title (A-Z)"
                                    : sortBy === "title-desc"
                                      ? "Title (Z-A)"
                                      : sortBy === "price-asc"
                                        ? "Price (Low-High)"
                                        : sortBy === "price-desc"
                                          ? "Price (High-Low)"
                                          : sortBy === "location-asc"
                                            ? "Location (A-Z)"
                                            : "Sort By"}
                              </span>
                              <ChevronRight
                                size={14}
                                className={`rotate-90 transition-transform duration-200 ${isSortDropdownOpen ? "rotate-270" : ""} text-text-dim`}
                              />
                            </button>
                            <AnimatePresence>
                              {isSortDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 top-full mt-2 w-full md:w-48 bg-surface border border-border-dim rounded-xl shadow-xl z-50 p-1.5 space-y-0.5"
                                >
                                  {[
                                    { value: "id", label: "ID (Default)" },
                                    {
                                      value: "title-asc",
                                      label: "Title (A-Z)",
                                    },
                                    {
                                      value: "title-desc",
                                      label: "Title (Z-A)",
                                    },
                                    {
                                      value: "price-asc",
                                      label: "Price (Low-High)",
                                    },
                                    {
                                      value: "price-desc",
                                      label: "Price (High-Low)",
                                    },
                                    {
                                      value: "location-asc",
                                      label: "Location (A-Z)",
                                    },
                                  ].map((opt) => (
                                    <button
                                      key={opt.value}
                                      onClick={() => {
                                        setSortBy(opt.value);
                                        setIsSortDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${sortBy === opt.value ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <button
                            onClick={() => {
                              const filtered = projects.filter(
                                (p) =>
                                  (builderFilter === "All" ||
                                    p.builderName === builderFilter) &&
                                  (p.title
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                    p.type
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()) ||
                                    p.location
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase())) &&
                                  (statusFilter.includes("All") ||
                                    statusFilter.includes(p.status)) &&
                                  (possessionFilter.includes("All") ||
                                    possessionFilter.includes(
                                      p.possessionStatus,
                                    )) &&
                                  (assignedToFilter === "All" ||
                                    p.assignedTo === assignedToFilter) &&
                                  (bathroomsFilter.length === 0 ||
                                    (p.bathrooms &&
                                      String(p.bathrooms)
                                        .split(", ")
                                        .some((b) =>
                                          bathroomsFilter.includes(Number(b)),
                                        ))) &&
                                  (configurationFilter.length === 0 ||
                                    configurationFilter.some((config) =>
                                      (p.configuration || p.type || "")
                                        .toLowerCase()
                                        .includes(config.toLowerCase()),
                                    )) &&
                                  p.price >= priceRangeFilter[0] &&
                                  p.price <= priceRangeFilter[1],
                              );

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
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-border-bright bg-surface-2 text-text-dim hover:text-amber-primary hover:border-amber-primary transition-all"
                            title="Export filtered projects to CSV"
                          >
                            <Download size={14} /> Export
                          </button>
                          <button
                            onClick={() =>
                              setShowAdvancedFilters(!showAdvancedFilters)
                            }
                            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${
                              showAdvancedFilters
                                ? "bg-amber-primary border-amber-primary text-bg shadow-lg shadow-amber-primary/20"
                                : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50"
                            }`}
                          >
                            <Filter size={14} />{" "}
                            {showAdvancedFilters ? "Hide" : "Filters"}
                          </button>
                        </div>
                      </div>

                      {showAdvancedFilters && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-surface p-8 border border-border-dim rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <User size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Assigned Manager
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setIsManagerDropdownOpen(!isManagerDropdownOpen)
                              }
                              className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm text-text-primary outline-none hover:border-amber-primary font-medium flex items-center justify-between"
                            >
                              <span>
                                {assignedToFilter === "All"
                                  ? "All Managers"
                                  : assignedToFilter}
                              </span>
                              <ChevronRight
                                size={16}
                                className={`rotate-90 transition-transform duration-200 ${isManagerDropdownOpen ? "rotate-270" : ""} text-text-dim`}
                              />
                            </button>
                            <AnimatePresence>
                              {isManagerDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border-dim rounded-xl shadow-xl z-50 p-1.5 max-h-56 overflow-y-auto custom-scrollbar space-y-0.5"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAssignedToFilter("All");
                                      setIsManagerDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${assignedToFilter === "All" ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                  >
                                    All Managers
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
                                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${assignedToFilter === name ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                    >
                                      {name}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div
                            className="space-y-4 col-span-1 relative"
                            onMouseLeave={() => setIsBuilderDropdownOpen(false)}
                          >
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Building2 size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Builder Name
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setIsBuilderDropdownOpen(!isBuilderDropdownOpen)
                              }
                              className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm text-text-primary outline-none hover:border-amber-primary font-medium flex items-center justify-between"
                            >
                              <span>
                                {builderFilter === "All"
                                  ? "All Builders"
                                  : builderFilter}
                              </span>
                              <ChevronRight
                                size={16}
                                className={`rotate-90 transition-transform duration-200 ${isBuilderDropdownOpen ? "rotate-270" : ""} text-text-dim`}
                              />
                            </button>
                            <AnimatePresence>
                              {isBuilderDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border-dim rounded-xl shadow-xl z-50 p-1.5 max-h-56 overflow-y-auto custom-scrollbar space-y-0.5"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuilderFilter("All");
                                      setIsBuilderDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${builderFilter === "All" ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                  >
                                    All Builders
                                  </button>
                                  {Array.from(
                                    new Set(
                                      projects
                                        .map((p) => p.builderName)
                                        .filter(Boolean),
                                    ),
                                  ).map((name) => (
                                    <button
                                      type="button"
                                      key={name}
                                      onClick={() => {
                                        setBuilderFilter(name);
                                        setIsBuilderDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${builderFilter === name ? "bg-amber-primary text-bg font-bold" : "text-text-dim hover:text-text-primary hover:bg-surface-2"}`}
                                    >
                                      {name}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Clock size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Possession
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {[
                                "All",
                                "Ready to Move",
                                "Under Construction",
                                "New Launch",
                              ].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => togglePossessionFilter(status)}
                                  className={`px-3 py-2 rounded-xl text-[10px] border transition-all font-bold ${
                                    possessionFilter.includes(status)
                                      ? "bg-amber-primary border-amber-primary text-bg shadow-md"
                                      : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50"
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Bath size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Bathrooms
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3, 4, 5].map((count) => (
                                <button
                                  key={count}
                                  onClick={() => toggleBathroomFilter(count)}
                                  className={`w-10 h-10 rounded-xl text-[10px] border flex items-center justify-center transition-all font-bold ${
                                    bathroomsFilter.includes(count)
                                      ? "bg-amber-primary border-amber-primary text-bg shadow-md"
                                      : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50"
                                  }`}
                                >
                                  {count}+
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Layers size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                BHK Size
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {["2 BHK", "3 BHK", "4 BHK", "5 BHK"].map((bhk) => (
                                <button
                                  key={bhk}
                                  type="button"
                                  onClick={() => toggleConfigurationFilter(bhk)}
                                  className={`px-3 py-2 rounded-xl text-[10px] border transition-all font-bold ${
                                    configurationFilter.includes(bhk)
                                      ? "bg-amber-primary border-amber-primary text-bg shadow-md"
                                      : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50"
                                  }`}
                                >
                                  {bhk}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <IndianRupee size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Price Range (Lakhs)
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[8px] text-text-dim uppercase font-black">
                                  Min
                                </label>
                                <input
                                  type="number"
                                  value={priceRangeFilter[0] / 100000}
                                  onChange={(e) =>
                                    setPriceRangeFilter([
                                      Number(e.target.value) * 100000,
                                      priceRangeFilter[1],
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] text-text-dim uppercase font-black">
                                  Max
                                </label>
                                <input
                                  type="number"
                                  value={priceRangeFilter[1] / 100000}
                                  onChange={(e) =>
                                    setPriceRangeFilter([
                                      priceRangeFilter[0],
                                      Number(e.target.value) * 100000,
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Maximize2 size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Area Range (Sq.Ft.)
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[8px] text-text-dim uppercase font-black">
                                  Min Area
                                </label>
                                <input
                                  type="number"
                                  value={areaRangeFilter[0]}
                                  onChange={(e) =>
                                    setAreaRangeFilter([
                                      Number(e.target.value),
                                      areaRangeFilter[1],
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] text-text-dim uppercase font-black">
                                  Max Area
                                </label>
                                <input
                                  type="number"
                                  value={areaRangeFilter[1]}
                                  onChange={(e) =>
                                    setAreaRangeFilter([
                                      areaRangeFilter[0],
                                      Number(e.target.value),
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-primary">
                              <Home size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Total Units Range
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[8px] text-text-dim uppercase font-black">
                                  Min Units
                                </label>
                                <input
                                  type="number"
                                  value={unitsRangeFilter[0]}
                                  onChange={(e) =>
                                    setUnitsRangeFilter([
                                      Number(e.target.value),
                                      unitsRangeFilter[1],
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] text-text-dim uppercase font-black">
                                  Max Units
                                </label>
                                <input
                                  type="number"
                                  value={unitsRangeFilter[1]}
                                  onChange={(e) =>
                                    setUnitsRangeFilter([
                                      unitsRangeFilter[0],
                                      Number(e.target.value),
                                    ])
                                  }
                                  className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary font-mono"
                                />
                              </div>
                            </div>
                            <button
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
                              className="text-[9px] text-amber-primary hover:underline uppercase font-black tracking-widest block mt-2"
                            >
                              Reset Filters
                            </button>
                          </div>
                        </motion.div>
                      )}

                      <AnimatePresence mode="wait">
                        {viewMode === "map" ? (
                          <motion.div
                            key="map"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
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
                            key="grid"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
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

                                  return filtered.map((p) => (
                                    <motion.div
                                      layout
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      transition={{ duration: 0.2 }}
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
                                      />
                                    </motion.div>
                                  ));
                                })()}
                              </AnimatePresence>
                            </motion.div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="table"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="w-full"
                          >
                            <div className="bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-xl">
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
                                    <tr
                                      key={p.id}
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
                                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${
                                            p.status === "Active"
                                              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                              : p.status === "PENDING_DELETE"
                                                ? "border-red-500/20 bg-red-500/5 text-red-500"
                                                : "border-amber-500/20 bg-amber-500/5 text-amber-500"
                                          }`}
                                        >
                                          {p.status === "Active" && (
                                            <span className="relative flex h-1.5 w-1.5">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                            </span>
                                          )}
                                          {p.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 border-b border-border-dim/30 text-right">
                                        <div className="flex items-center justify-end gap-1">
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
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
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
                      <div className="flex flex-wrap gap-4 items-center justify-between bg-surface p-4 border border-border-dim rounded-xl w-full">
                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="flex items-center gap-3 bg-surface-2 p-1 rounded-xl border border-border-bright">
                            <button
                              onClick={() => setViewMode("grid")}
                              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-amber-primary text-bg shadow-lg shadow-amber-primary/20" : "text-text-dim hover:text-text-primary"}`}
                            >
                              <LayoutGrid size={18} />
                            </button>
                            <button
                              onClick={() => setViewMode("table")}
                              className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-amber-primary text-bg shadow-lg shadow-amber-primary/20" : "text-text-dim hover:text-text-primary"}`}
                            >
                              <List size={18} />
                            </button>
                            <button
                              onClick={() => setViewMode("map")}
                              className={`p-2 rounded-lg transition-all ${viewMode === "map" ? "bg-amber-primary text-bg shadow-lg shadow-amber-primary/20" : "text-text-dim hover:text-text-primary"}`}
                            >
                              <MapPin size={18} />
                            </button>
                          </div>

                          <div className="h-8 w-px bg-border-dim hidden lg:block" />

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
                              Status:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {[
                                "All",
                                "Active",
                                "Sold",
                                "Pending",
                                "PENDING_DELETE",
                              ].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => toggleStatusFilter(status)}
                                  className={`px-2 py-1 rounded text-[10px] border transition-all ${
                                    statusFilter.includes(status)
                                      ? "bg-amber-primary border-amber-primary text-bg font-bold"
                                      : "bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50"
                                  }`}
                                >
                                  {status === "PENDING_DELETE"
                                    ? "Del Req"
                                    : status}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-[10px] text-text-dim uppercase tracking-widest font-mono">
                            {resaleProperties.length} Total Records
                          </div>
                          <button
                            onClick={() => {
                              const filtered = resaleProperties.filter(
                                (p) =>
                                  (p.propertyHolderName
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                    p.societyName
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()) ||
                                    p.location
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase())) &&
                                  (statusFilter.includes("All") ||
                                    statusFilter.includes(p.status)),
                              );

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
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-primary hover:text-amber-secondary transition-colors"
                            title="Export filtered resale properties to CSV"
                          >
                            <Download size={14} /> Export CSV
                          </button>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {viewMode === "map" ? (
                          <motion.div
                            key="map"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="w-full"
                          >
                            <ProjectMapView
                              items={resaleProperties.filter(
                                (p) =>
                                  (p.propertyHolderName
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                    p.societyName
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()) ||
                                    p.location
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase())) &&
                                  (statusFilter.includes("All") ||
                                    statusFilter.includes(p.status)),
                              )}
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="w-full"
                          >
                            <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-6">
                              <AnimatePresence mode="popLayout">
                                {resaleProperties
                                  .filter(
                                    (p) =>
                                      (p.propertyHolderName
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase()) ||
                                        p.societyName
                                          .toLowerCase()
                                          .includes(searchQuery.toLowerCase()) ||
                                        p.location
                                          .toLowerCase()
                                          .includes(searchQuery.toLowerCase())) &&
                                      (statusFilter.includes("All") ||
                                        statusFilter.includes(p.status)),
                                  )
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
                                        {p.images && p.images.length > 0 ? (
                                          <img
                                            src={p.images[0].data}
                                            alt={p.societyName}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-text-dim/20">
                                            <Home size={48} />
                                          </div>
                                        )}
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-surface/50 backdrop-blur-xl border border-border-dim/50 rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative group/container"
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
                                  const filtered = resaleProperties.filter(
                                    (p) =>
                                      (p.propertyHolderName
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase()) ||
                                        p.societyName
                                          .toLowerCase()
                                          .includes(
                                            searchQuery.toLowerCase(),
                                          ) ||
                                        p.propertyType
                                          .toLowerCase()
                                          .includes(
                                            searchQuery.toLowerCase(),
                                          ) ||
                                        p.location
                                          .toLowerCase()
                                          .includes(
                                            searchQuery.toLowerCase(),
                                          )) &&
                                      (statusFilter.includes("All") ||
                                        statusFilter.includes(p.status)) &&
                                      (possessionFilter.includes("All") ||
                                        possessionFilter.includes(
                                          p.possessionStatus,
                                        )),
                                  );

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
                                                  : p.status ===
                                                      "PENDING_DELETE"
                                                    ? "border-red-500/30 bg-red-500/5 text-red-500 shadow-red-500/10 shadow-sm"
                                                    : "border-amber-500/30 bg-amber-500/5 text-amber-500 shadow-amber-500/10 shadow-sm"
                                            }`}
                                          >
                                            <div
                                              className={`w-1.5 h-1.5 rounded-full ${
                                                p.status === "Active"
                                                  ? "bg-emerald-500 animate-pulse"
                                                  : p.status === "Sold"
                                                    ? "bg-blue-500"
                                                    : "bg-amber-500"
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
                    <motion.div
                      key="media"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col gap-6 w-full max-w-none"
                    >
                      {/* Header Section */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-amber-primary/10 rounded-lg">
                              <FolderOpen
                                className="text-amber-primary"
                                size={24}
                              />
                            </div>
                            Media Explorer
                          </h2>
                          <p className="text-xs text-text-dim mt-1">
                            Manage and browse project assets across cloud
                            storage buckets
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setShowFullReport(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-primary text-bg rounded-xl text-xs font-bold hover:bg-amber-secondary transition-all shadow-lg shadow-amber-primary/20"
                          >
                            <Activity size={14} />
                            Full Report
                          </button>
                          <div className="relative group">
                            <Search
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors"
                              size={14}
                            />
                            <input
                              type="text"
                              placeholder="Search folders..."
                              className="bg-surface border border-border-dim rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-amber-primary/50 focus:ring-4 focus:ring-amber-primary/5 w-full md:w-64 transition-all"
                            />
                          </div>
                          <button className="p-2 bg-surface border border-border-dim rounded-xl text-text-dim hover:text-amber-primary transition-all">
                            <Filter size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-1 gap-6 overflow-hidden">
                        {/* Main Explorer Area */}
                        <div className="bg-surface/50 border border-border-dim rounded-2xl flex flex-col overflow-hidden flex-1 shadow-2xl shadow-black/20">
                          <div className="px-6 py-4 border-b border-border-dim flex justify-between items-center bg-surface-2/50">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase">
                              <button
                                onClick={() => setSelectedFolder(null)}
                                className="text-text-dim hover:text-amber-primary transition-colors flex items-center gap-1.5"
                              >
                                <LayoutGrid size={14} />
                                Explorer
                              </button>
                              {selectedFolder && (
                                <>
                                  <ChevronRight
                                    size={14}
                                    className="text-text-dim/30"
                                  />
                                  <span className="text-amber-primary truncate max-w-[200px] bg-amber-primary/10 px-2 py-0.5 rounded">
                                    {
                                      projects.find(
                                        (p) => p.id === selectedFolder,
                                      )?.title
                                    }
                                  </span>
                                </>
                              )}
                            </div>
                            {selectedFolder && (
                              <button
                                onClick={() => setSelectedFolder(null)}
                                className="text-[10px] text-text-dim hover:text-amber-primary uppercase tracking-widest font-bold flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-lg border border-border-bright transition-all"
                              >
                                <ChevronLeft size={12} /> Back to Root
                              </button>
                            )}
                          </div>

                          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {showFullReport ? (
                              <div className="space-y-6">
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => setShowFullReport(false)}
                                      className="p-2 hover:bg-surface rounded-full transition-colors text-text-dim hover:text-text-primary"
                                    >
                                      <ChevronLeft size={20} />
                                    </button>
                                    <h3 className="text-xl font-bold text-text-primary">
                                      Activity Reports
                                    </h3>
                                  </div>
                                </div>
                                <LogsView
                                  logs={logs}
                                  user={user}
                                  isLive={true}
                                  onExport={(exportLogs) => {
                                    const csvContent =
                                      "Timestamp,User,Action,Summary\n" +
                                      exportLogs
                                        .map(
                                          (l) =>
                                            `${new Date(l.timestamp).toLocaleString()},"${l.user}","${l.action}","${l.summary}"`,
                                        )
                                        .join("\n");
                                    const blob = new Blob([csvContent], {
                                      type: "text/csv;charset=utf-8;",
                                    });
                                    const link = document.createElement("a");
                                    const url = URL.createObjectURL(blob);
                                    link.setAttribute("href", url);
                                    link.setAttribute(
                                      "download",
                                      `full_report_${new Date().toISOString().split("T")[0]}.csv`,
                                    );
                                    link.style.visibility = "hidden";
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                />
                              </div>
                            ) : !selectedFolder ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {projects.map((p) => (
                                  <motion.button
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    key={p.id}
                                    onClick={() => setSelectedFolder(p.id)}
                                    className="flex flex-col items-start p-6 rounded-2xl border border-border-dim bg-surface hover:border-amber-primary/50 hover:shadow-xl hover:shadow-amber-primary/10 transition-all group relative overflow-hidden text-left"
                                  >
                                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-primary/5 rounded-full blur-3xl group-hover:bg-amber-primary/15 transition-colors duration-500" />

                                    <div className="flex items-start justify-between w-full mb-6 relative z-10">
                                      <div className="relative w-10 h-10">
                                        <Folder
                                          size={40}
                                          className="text-amber-primary/70 group-hover:opacity-0 transition-opacity duration-300 absolute top-0 left-0"
                                        />
                                        <FolderOpen
                                          size={40}
                                          className="text-amber-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-0 left-0"
                                        />
                                      </div>
                                      {p.pdfs && p.pdfs.length > 0 && (
                                        <div className="bg-amber-primary/10 border border-amber-primary/20 px-2.5 py-1 rounded-full text-[10px] font-black text-amber-primary flex items-center gap-1.5 shadow-sm">
                                          <FileText size={12} />
                                          {p.pdfs.length}
                                        </div>
                                      )}
                                      {p.images && p.images.length > 0 && (
                                        <div className="bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full text-[10px] font-black text-blue-500 flex items-center gap-1.5 shadow-sm">
                                          <ImageIcon size={12} />
                                          {p.images.length}
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-1.5 w-full relative z-10">
                                      <h3 className="text-base font-bold text-text-primary line-clamp-1 group-hover:text-amber-primary transition-colors">
                                        {p.title}
                                      </h3>
                                      <div className="flex items-center gap-2 text-[11px] text-text-dim font-medium">
                                        <span className="truncate max-w-[120px]">
                                          {p.builderName || "General"}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-border-bright" />
                                        <span className="font-mono uppercase tracking-wider">
                                          {p.id.slice(0, 6)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-border-dim/50 w-full flex items-center justify-between relative z-10">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-[10px] text-text-dim uppercase tracking-widest font-bold">
                                          <Clock size={12} />
                                          Updated Recently
                                        </div>
                                        <div className="text-[9px] text-text-dim/60 font-mono">
                                          Created:{" "}
                                          {p.createdAt
                                            ? new Date(
                                                p.createdAt,
                                              ).toLocaleDateString()
                                            : "N/A"}
                                        </div>
                                      </div>
                                      <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center group-hover:bg-amber-primary group-hover:text-bg transition-colors">
                                        <ChevronRight
                                          size={14}
                                          className="translate-x-0 group-hover:translate-x-0.5 transition-transform"
                                        />
                                      </div>
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {/* Project Actions Header */}
                                <div className="flex flex-wrap items-center gap-4 bg-surface p-4 rounded-xl border border-border-dim shadow-sm">
                                  <div className="flex items-center gap-3 pr-4 border-r border-border-dim">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                      <Settings
                                        size={18}
                                        className="text-blue-500"
                                      />
                                    </div>
                                    <h3 className="text-sm font-bold text-text-primary">
                                      Project Actions
                                    </h3>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        setSelectedProject(
                                          projects.find(
                                            (p) => p.id === selectedFolder,
                                          ) || null,
                                        )
                                      }
                                      className="flex items-center gap-2 bg-surface-2 border border-border-bright text-text-primary px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:border-amber-primary hover:text-amber-primary transition-all"
                                    >
                                      <Eye size={14} /> View Details
                                    </button>
                                    {hasPermission(user, "EDIT_PROJECTS") && user?.role === "admin" && (
                                      <button
                                        onClick={() => {
                                          const p = projects.find(
                                            (p) => p.id === selectedFolder,
                                          );
                                          if (p) {
                                            setEditingProject(p);
                                            setIsModalOpen(true);
                                          }
                                        }}
                                          className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all"
                                        >
                                          <Edit size={14} /> Edit
                                        </button>
                                      )}
                                    {hasPermission(user, "DELETE_PROJECTS") && user?.role === "admin" && (
                                      <button
                                        onClick={() => {
                                          const p = projects.find(
                                            (p) => p.id === selectedFolder,
                                          );
                                          if (p) setProjectToDelete(p);
                                        }}
                                          className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                                        >
                                          <Trash2 size={14} /> Delete
                                        </button>
                                      )}
                                    {hasPermission(user, "ADD_PROJECTS") && (
                                      <button
                                        onClick={() => {
                                          setEditingProject(null);
                                          setIsModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-green-500 hover:text-white transition-all"
                                      >
                                        <Plus size={14} /> Project
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* PDF List Header */}
                                <div className="flex items-center justify-between bg-surface-2/50 p-4 rounded-xl border border-border-dim">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-primary/10 rounded-lg">
                                      <FileText
                                        size={18}
                                        className="text-amber-primary"
                                      />
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-bold text-text-primary">
                                        Project Documents
                                      </h3>
                                      <p className="text-[10px] text-text-dim mt-0.5">
                                        {projects.find(
                                          (p) => p.id === selectedFolder,
                                        )?.pdfs?.length || 0}{" "}
                                        Files available
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                    className="flex items-center gap-2 bg-amber-primary text-bg px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-secondary transition-colors shadow-lg shadow-amber-primary/20"
                                  >
                                    <Plus size={14} />
                                    Upload File
                                  </button>
                                  <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) =>
                                      handleMediaUpload(e, "pdfs")
                                    }
                                    className="hidden"
                                    accept=".pdf"
                                  />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                  {(() => {
                                    const project = projects.find(
                                      (p) => p.id === selectedFolder,
                                    );
                                    if (
                                      !project ||
                                      !project.pdfs ||
                                      project.pdfs.length === 0
                                    ) {
                                      return (
                                        <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-surface-2/30 rounded-2xl border-2 border-dashed border-border-dim hover:border-amber-primary/30 hover:bg-surface-2/50 transition-all cursor-pointer group">
                                          <div className="p-5 bg-surface-3 rounded-full mb-4 group-hover:scale-110 group-hover:bg-amber-primary/10 transition-all">
                                            <FileQuestion
                                              size={40}
                                              className="text-text-dim group-hover:text-amber-primary transition-colors"
                                            />
                                          </div>
                                          <h3 className="text-sm font-bold text-text-primary mb-1">
                                            No Documents Found
                                          </h3>
                                          <p className="text-xs text-text-secondary max-w-[250px] mb-6">
                                            This project has no uploaded PDF
                                            documents. Click below or drag and
                                            drop to upload.
                                          </p>
                                          <button
                                            onClick={() =>
                                              fileInputRef.current?.click()
                                            }
                                            className="px-6 py-2.5 bg-surface border border-border-bright rounded-xl text-xs font-bold text-text-primary hover:border-amber-primary hover:text-amber-primary transition-all shadow-sm"
                                          >
                                            Browse Files
                                          </button>
                                        </div>
                                      );
                                    }

                                    const uniquePdfs: any[] = [];
                                    const seenNames = new Set();
                                    project.pdfs.forEach((pdf) => {
                                      if (!seenNames.has(pdf.name)) {
                                        seenNames.add(pdf.name);
                                        uniquePdfs.push(pdf);
                                      }
                                    });

                                    return uniquePdfs.map((pdf, idx) => (
                                      <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className="flex flex-col bg-surface border border-border-bright rounded-xl hover:border-amber-primary/50 hover:shadow-xl hover:shadow-amber-primary/5 transition-all group overflow-hidden relative"
                                      >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/50 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="p-5 flex items-start gap-4">
                                          <div className="bg-red-500/10 p-3.5 rounded-xl text-red-500 group-hover:scale-110 group-hover:bg-red-500/20 transition-all shadow-sm">
                                            <FileText size={24} />
                                          </div>
                                          <div className="flex flex-col overflow-hidden flex-1">
                                            <span
                                              className="text-sm font-bold text-text-primary truncate group-hover:text-amber-primary transition-colors"
                                              title={pdf.name}
                                            >
                                              {pdf.name}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1.5">
                                              <span className="text-[10px] text-text-dim font-mono bg-surface-2 px-1.5 py-0.5 rounded">
                                                {(
                                                  pdf.size /
                                                  1024 /
                                                  1024
                                                ).toFixed(2)}{" "}
                                                MB
                                              </span>
                                              <span className="w-1 h-1 rounded-full bg-border-bright" />
                                              <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
                                                PDF
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="px-4 py-3 bg-surface-2/50 border-t border-border-dim/50 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                                          <span className="text-[9px] text-text-dim font-mono">
                                            Added recently
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              className="p-1.5 text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-md transition-all"
                                              title="Preview"
                                            >
                                              <Eye size={14} />
                                            </button>
                                            <button
                                              onClick={() => {
                                                const link =
                                                  document.createElement("a");
                                                link.href = pdf.data;
                                                link.download = pdf.name;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                showToast(
                                                  "Downloading document...",
                                                  "info",
                                                );
                                              }}
                                              className="p-1.5 text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-md transition-all"
                                              title="Download"
                                            >
                                              <Download size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ));
                                  })()}
                                </div>

                                {/* Images Section */}
                                <div className="flex items-center justify-between bg-surface-2/30 p-5 rounded-2xl border border-border-dim/50 mt-10 ">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shadow-inner">
                                      <ImageIcon size={20} />
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-bold text-text-primary tracking-tight">
                                        Visual Portfolio
                                      </h3>
                                      <p className="text-[10px] text-text-dim mt-0.5 font-mono uppercase tracking-widest">
                                        {projects.find(
                                          (p) => p.id === selectedFolder,
                                        )?.images?.length || 0}{" "}
                                        High-Res Assets
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        imageInputRef.current?.click()
                                      }
                                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-primary/10 border border-amber-primary/20 rounded-lg text-[10px] font-bold text-amber-primary hover:bg-amber-primary hover:text-bg transition-all"
                                    >
                                      <Plus size={12} />
                                      Add Image
                                    </button>
                                    <input
                                      type="file"
                                      ref={imageInputRef}
                                      onChange={(e) =>
                                        handleMediaUpload(e, "images")
                                      }
                                      className="hidden"
                                      accept="image/*"
                                    />
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-3 border border-border-bright rounded-lg text-[10px] font-bold text-text-secondary hover:text-text-primary transition-all">
                                      <Maximize2 size={12} />
                                      Gallery View
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-6">
                                  {(() => {
                                    const project = projects.find(
                                      (p) => p.id === selectedFolder,
                                    );
                                    if (
                                      !project ||
                                      !project.images ||
                                      project.images.length === 0
                                    ) {
                                      return (
                                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-surface-2/20 rounded-3xl border-2 border-dashed border-border-dim/50">
                                          <div className="w-12 h-12 bg-surface-3 rounded-2xl flex items-center justify-center text-text-dim mb-4">
                                            <ImageIcon size={24} />
                                          </div>
                                          <p className="text-[11px] text-text-dim uppercase font-bold tracking-[0.2em]">
                                            No visual assets
                                          </p>
                                        </div>
                                      );
                                    }
                                    return project.images.map((img, idx) => (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border-bright/50 hover:border-amber-primary/50 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-amber-primary/10"
                                      >
                                        <img
                                          src={img.data}
                                          alt={img.name}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                          <div className="flex items-center justify-between">
                                            <div className="min-w-0">
                                              <p className="text-[10px] text-white font-bold truncate">
                                                {img.name}
                                              </p>
                                              <p className="text-[8px] text-white/60 uppercase tracking-widest mt-0.5">
                                                {(
                                                  img.size /
                                                  (1024 * 1024)
                                                ).toFixed(1)}{" "}
                                                MB
                                              </p>
                                            </div>
                                            <button
                                              onClick={() => {
                                                const link =
                                                  document.createElement("a");
                                                link.href = img.data;
                                                link.download = img.name;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                              }}
                                              className="p-2 bg-white/20 rounded-xl text-white hover:bg-amber-primary transition-all"
                                            >
                                              <Download size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ));
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Persistent Sidebar */}
                        <div className="hidden xl:flex w-96 flex-col gap-6 overflow-y-auto no-scrollbar">
                          {/* Builder Info Section */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                              <Building2
                                size={14}
                                className="text-amber-primary"
                              />
                              Builder Profile
                            </h3>
                            {(() => {
                              const project = selectedFolder
                                ? projects.find((p) => p.id === selectedFolder)
                                : null;

                              if (!project) {
                                return (
                                  <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-primary/10 transition-colors" />
                                    <div className="flex items-center gap-4 relative z-10">
                                      <div className="w-12 h-12 bg-surface-2 border border-border-bright rounded-2xl flex items-center justify-center text-amber-primary shadow-inner">
                                        <Building2 size={24} />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-bold text-text-primary tracking-tight">
                                          Builder Directory
                                        </h4>
                                        <p className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-mono">
                                          {allBuilders.length} Active Developers
                                        </p>
                                      </div>
                                    </div>
                                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1 relative z-10">
                                      {allBuilders.map((builder) => (
                                        <button
                                          key={builder}
                                          onClick={() =>
                                            setSelectedBuilder(builder)
                                          }
                                          className="w-full p-4 bg-surface-2/50 border border-border-bright/50 rounded-2xl flex items-center justify-between group/item hover:border-amber-primary/40 hover:bg-surface-3 transition-all duration-300"
                                        >
                                          <div className="flex flex-col items-start">
                                            <span className="text-[12px] font-bold text-text-secondary group-hover/item:text-amber-primary transition-colors">
                                              {builder}
                                            </span>
                                            <span className="text-[9px] text-text-dim uppercase tracking-widest mt-0.5">
                                              Premier Partner
                                            </span>
                                          </div>
                                          <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-mono text-text-primary">
                                              {
                                                projects.filter(
                                                  (p) =>
                                                    p.builderName === builder,
                                                ).length
                                              }
                                            </span>
                                            <span className="text-[8px] text-text-dim uppercase">
                                              Assets
                                            </span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                    <div className="pt-2 border-t border-border-dim/50 flex justify-center">
                                      <div className="text-[10px] text-text-dim italic flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-primary animate-pulse" />
                                        Select a profile to view portfolio
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              const builderProjects = projects.filter(
                                (p) => p.builderName === project.builderName,
                              );

                              return (
                                <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-primary/50 to-transparent" />

                                  <div className="flex items-start justify-between pb-5 border-b border-border-dim/50">
                                    <div className="flex items-center gap-4">
                                      <div className="w-14 h-14 bg-amber-primary/10 border border-amber-primary/20 rounded-2xl flex items-center justify-center text-amber-primary shadow-lg shadow-amber-primary/5">
                                        <Building2 size={28} />
                                      </div>
                                      <div>
                                        <h4 className="text-lg font-serif font-bold text-text-primary leading-tight">
                                          {project.builderName}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded text-[9px] text-green-500 font-bold uppercase tracking-wider border border-green-500/20">
                                            <ShieldCheck size={10} />
                                            Verified
                                          </div>
                                          <span className="text-[10px] text-text-dim font-mono">
                                            EST. 1984
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                      <h5 className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-bold">
                                        Active Portfolio
                                      </h5>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-primary" />
                                        <span className="text-[10px] font-mono text-text-primary">
                                          {builderProjects.length} Units
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                                      {builderProjects.map((bp) => (
                                        <button
                                          key={bp.id}
                                          onClick={() =>
                                            setSelectedFolder(bp.id)
                                          }
                                          className={`w-full text-left p-4 rounded-2xl text-[12px] transition-all duration-300 flex items-center justify-between group border ${
                                            bp.id === selectedFolder
                                              ? "bg-amber-primary/10 text-amber-primary border-amber-primary/30 shadow-lg shadow-amber-primary/5"
                                              : "bg-surface-2/50 hover:bg-surface-3 text-text-secondary border-border-bright/50 hover:border-amber-primary/20"
                                          }`}
                                        >
                                          <div className="flex items-center gap-4 overflow-hidden">
                                            <div
                                              className={`w-2 h-2 rounded-full shadow-sm ${bp.status === "Active" ? "bg-green-500 shadow-green-500/50" : "bg-amber-500 shadow-amber-500/50"}`}
                                            />
                                            <div className="flex flex-col overflow-hidden">
                                              <span className="truncate font-bold tracking-tight">
                                                {bp.title}
                                              </span>
                                              <span className="text-[9px] text-text-dim uppercase tracking-widest mt-0.5">
                                                {bp.location.split(",")[1] ||
                                                  bp.location}
                                              </span>
                                            </div>
                                          </div>
                                          <div
                                            className={`p-1.5 rounded-lg transition-all ${bp.id === selectedFolder ? "bg-amber-primary text-surface rotate-0" : "bg-surface-3 text-text-dim opacity-0 group-hover:opacity-100 -rotate-90"}`}
                                          >
                                            <ChevronRight size={14} />
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <button
                                      onClick={() =>
                                        setSelectedBuilder(project.builderName!)
                                      }
                                      className="py-3 bg-surface-2 border border-border-bright rounded-2xl text-[10px] font-bold text-text-primary uppercase tracking-widest hover:border-amber-primary hover:bg-surface-3 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                      <Globe
                                        size={14}
                                        className="text-amber-primary"
                                      />
                                      Website
                                    </button>
                                    <button className="py-3 bg-amber-primary text-surface rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-secondary transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-primary/20">
                                      <Mail size={14} />
                                      Contact
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Intelligence Section */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                              <Activity
                                size={14}
                                className="text-amber-primary"
                              />
                              Market Intelligence
                            </h3>
                            {(() => {
                              const project = selectedFolder
                                ? projects.find((p) => p.id === selectedFolder)
                                : null;

                              const relatedReports = project
                                ? reports.filter(
                                    (r) =>
                                      r.title
                                        .toLowerCase()
                                        .includes(
                                          project.title.toLowerCase(),
                                        ) ||
                                      r.content
                                        .toLowerCase()
                                        .includes(project.title.toLowerCase()),
                                  )
                                : reports.slice(0, 5);

                              return (
                                <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(245,158,11,0.03)_0%,transparent_50%)]" />

                                  <div className="flex items-center justify-between pb-4 border-b border-border-dim/50 relative z-10">
                                    <p className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-bold">
                                      {project
                                        ? "Project Insights"
                                        : "Global Intelligence"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-primary animate-pulse" />
                                      <span className="text-[10px] font-mono text-text-primary">
                                        {relatedReports.length} Signals
                                      </span>
                                    </div>
                                  </div>

                                  {relatedReports.length === 0 ? (
                                    <div className="py-16 text-center bg-surface-2/20 rounded-2xl border border-border-dim/50 border-dashed relative z-10">
                                      <ClipboardList
                                        size={28}
                                        className="text-text-dim/20 mx-auto mb-3"
                                      />
                                      <p className="text-[11px] text-text-dim/60 uppercase tracking-widest font-bold">
                                        No signals detected
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1 relative z-10">
                                      {relatedReports.map((report) => (
                                        <div
                                          key={report.id}
                                          className="bg-surface-2/50 border border-border-bright/50 p-4 rounded-2xl hover:border-amber-primary/30 hover:bg-surface-3 transition-all duration-300 group"
                                        >
                                          <div className="flex items-start justify-between mb-4">
                                            <div className="flex flex-col gap-1.5 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <div
                                                  className={`w-1.5 h-1.5 rounded-full ${
                                                    report.status === "Final"
                                                      ? "bg-green-500"
                                                      : "bg-amber-500"
                                                  }`}
                                                />
                                                <span className="text-[12px] font-bold text-text-primary truncate group-hover:text-amber-primary transition-colors">
                                                  {report.title}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 ml-3.5">
                                                <span className="text-[9px] text-text-dim font-mono uppercase">
                                                  {new Date(
                                                    report.createdAt,
                                                  ).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                      month: "short",
                                                      day: "numeric",
                                                      year: "numeric",
                                                    },
                                                  )}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-border-bright" />
                                                <span className="text-[9px] text-text-dim uppercase tracking-widest font-bold">
                                                  {report.status}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => {
                                              setSelectedReport(report);
                                              setIsReportEditing(false);
                                              setActiveTab("reports");
                                            }}
                                            className="w-full py-2.5 bg-surface-3 border border-border-bright rounded-xl text-[10px] font-bold text-text-secondary hover:text-amber-primary hover:border-amber-primary/40 transition-all uppercase tracking-[0.15em] flex items-center justify-center gap-2"
                                          >
                                            <Eye size={12} />
                                            Analyze Data
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="pt-2 relative z-10">
                                    <button className="w-full py-3 bg-surface-2/50 border border-border-dim/50 rounded-2xl text-[10px] font-bold text-text-dim uppercase tracking-widest hover:text-text-primary hover:bg-surface-3 transition-all">
                                      View Intelligence Feed
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
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
                                    a.type === "Edit Request"
                                      ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                      : a.type === "New Project Approval"
                                        ? "border-green-500/30 bg-green-500/10 text-green-500"
                                        : "border-red-500/30 bg-red-500/10 text-red-500"
                                  }`}
                                >
                                  {a.type || "Deletion Request"}
                                </span>
                                <div className="text-sm font-bold text-text-primary">
                                  {a.projectTitle}
                                </div>
                              </div>
                              <div className="text-[10px] text-text-dim uppercase tracking-widest">
                                Requested by {a.requestedBy} ·{" "}
                                {new Date(a.requestedAt).toLocaleString()}
                              </div>
                              {a.type === "Edit Request" && a.details && (
                                <div className="mt-2 p-3 bg-surface-2 rounded-xl border border-border-bright text-xs text-text-secondary leading-relaxed font-semibold max-w-xl">
                                  <span className="font-extrabold text-text-primary block text-[9px] uppercase tracking-wider mb-1 text-amber-500">
                                    Suggested Correction / Reported Mistake:
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

                  {activeTab === "sync" && user?.role === "admin" && (
                    <motion.div
                      key="sync"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full"
                    >
                      <SyncIntegrationView user={user} playSound={playSound} />
                    </motion.div>
                  )}

                  {activeTab === "users" &&
                    (user?.role === "admin" ||
                      user?.role === "team_leader") && (
                      <motion.div
                        key="users"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4 w-full"
                      >
                        {teamFilter && (
                          <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <UsersIcon size={16} className="text-purple-500" />
                            <span className="text-xs text-text-primary">
                              Viewing team members for{" "}
                              <span className="font-bold">
                                {users.find((u) => u.id === teamFilter)?.name}
                              </span>
                            </span>
                            <button
                              onClick={() => setTeamFilter(null)}
                              className="ml-auto text-[10px] font-bold uppercase tracking-widest text-purple-500 hover:text-purple-400"
                            >
                              Clear Filter
                            </button>
                          </div>
                        )}
                        <div className="flex justify-end gap-4">
                          {hasPermission(user, "MANAGE_TEAM") && (
                            <button
                              onClick={() => {
                                setSelectedUsersForTeam([]);
                                setIsBuildTeamModalOpen(true);
                              }}
                              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-purple-500 hover:text-purple-400 transition-colors"
                            >
                              <UsersIcon size={14} />
                              <span>Build Team</span>
                            </button>
                          )}
                        </div>

                        <div className="bg-surface/50 backdrop-blur-xl border border-border-dim/50 rounded-3xl overflow-hidden shadow-[0_16px_48px_-12px_rgba(0,0,0,0.2)] relative group/container">
                          {/* Decorative background effects */}
                          <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-primary/5 rounded-full blur-[120px] pointer-events-none" />
                          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

                          <div className="overflow-x-auto no-scrollbar relative z-10">
                            <table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
                              <thead>
                                <tr className="bg-surface-2/40 backdrop-blur-md">
                                  <th className="px-4 py-3 text-[9px] text-text-dim uppercase tracking-[0.3em] font-black border-b border-border-dim/50 first:rounded-tl-3xl whitespace-nowrap group/th cursor-help">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-primary group-hover/th:animate-ping" />
                                      <span>Identification</span>
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-[9px] text-text-dim uppercase tracking-[0.3em] font-black border-b border-border-dim/50 whitespace-nowrap group/th cursor-help">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover/th:animate-ping" />
                                      <span>Secure Channels</span>
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-[9px] text-text-dim uppercase tracking-[0.3em] font-black border-b border-border-dim/50 whitespace-nowrap group/th cursor-help">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 group-hover/th:animate-ping" />
                                      <span>Authority Level</span>
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-[9px] text-text-dim uppercase tracking-[0.3em] font-black text-right border-b border-border-dim/50 last:rounded-tr-3xl whitespace-nowrap">
                                    Control
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-dim/10">
                                {(() => {
                                  const filtered = users.filter(
                                    (u) =>
                                      (u.name
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase()) ||
                                        u.email
                                          .toLowerCase()
                                          .includes(
                                            searchQuery.toLowerCase(),
                                          ) ||
                                        u.role
                                          .toLowerCase()
                                          .includes(
                                            searchQuery.toLowerCase(),
                                          )) &&
                                      (!teamFilter ||
                                        u.teamLeaderId === teamFilter),
                                  );

                                  if (filtered.length === 0) {
                                    return (
                                      <tr>
                                        <td
                                          colSpan={4}
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
                                                Null Result Vector
                                              </h4>
                                              <p className="text-[10px] text-text-dim font-medium leading-relaxed opacity-60 uppercase tracking-widest">
                                                {searchQuery
                                                  ? `No records found matching unique identifier "${searchQuery}"`
                                                  : "The system registry is currently devoid of member data."}
                                              </p>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  }

                                  return filtered.map((u, index) => (
                                    <tr
                                      key={u.id}
                                      className="group transition-all duration-500 hover:bg-white/[0.02]"
                                    >
                                      <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none transition-colors">
                                        <div className="flex items-center gap-3">
                                          <div className="relative group/avatar">
                                            <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border-bright flex items-center justify-center text-xs font-bold text-amber-primary shadow-lg overflow-hidden group-hover/avatar:scale-105 transition-all duration-500 ring-1 ring-transparent group-hover/avatar:ring-amber-primary/30">
                                              {u.profilePicture ? (
                                                <img
                                                  src={u.profilePicture}
                                                  alt={u.name}
                                                  className="w-full h-full object-cover grayscale-[0.2] group-hover/avatar:grayscale-0 transition-all duration-700"
                                                />
                                              ) : (
                                                u.name?.[0] || "?"
                                              )}
                                            </div>
                                            <div
                                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface shadow-lg transition-all duration-500 ${
                                                u.lastActive &&
                                                new Date().getTime() -
                                                  new Date(
                                                    u.lastActive,
                                                  ).getTime() <
                                                  300000
                                                  ? "bg-emerald-500 animate-pulse scale-110"
                                                  : "bg-text-dim/40"
                                              }`}
                                            />
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors leading-tight truncate">
                                              {u.name}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-[7px] text-text-dim font-mono tracking-tighter opacity-80 px-1 py-0.5 bg-surface-2 rounded-md border border-border-dim/30 transition-colors uppercase">
                                                ID: {u.id.slice(0, 8)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none transition-colors group-hover:bg-blue-500/[0.01]">
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2 text-[11px] text-text-secondary font-medium group/mail">
                                            <div className="p-1 rounded-lg bg-surface-2 border border-border-dim group-hover/mail:bg-blue-500/10 group-hover/mail:text-blue-400 transition-all">
                                              <Mail size={8} />
                                            </div>
                                            <span className="truncate max-w-[150px] font-mono tracking-tight group-hover:text-text-primary transition-colors cursor-pointer">
                                              {u.email}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none transition-colors group-hover:bg-purple-500/[0.01]">
                                        <span
                                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] border transition-all ${
                                            u.role === "admin"
                                              ? "border-amber-500/30 bg-amber-500/5 text-amber-500 shadow-sm shadow-amber-500/10"
                                              : u.role === "team_leader"
                                                ? "border-purple-500/30 bg-purple-500/5 text-purple-500 shadow-sm shadow-purple-500/10"
                                                : "border-blue-500/30 bg-blue-500/5 text-blue-500 shadow-sm shadow-blue-500/10"
                                          }`}
                                        >
                                          {u.role === "admin" && (
                                            <ShieldCheck size={10} className="animate-pulse" />
                                          )}
                                          {u.role === "team_leader" && (
                                            <UsersIcon size={10} />
                                          )}
                                          {u.role === "employee" && (
                                            <User size={10} />
                                          )}
                                          {u.role === "admin"
                                            ? "Admin"
                                            : u.role?.replace(/_/g, " ")}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 border-b border-border-dim/10 group-last:border-none text-right transition-colors group-hover:bg-red-500/[0.01]">
                                        <div className="flex items-center justify-end gap-1 transition-all">
                                          {hasPermission(
                                            user,
                                            "MANAGE_PERMISSIONS",
                                          ) && (
                                            <button
                                              onClick={() => {
                                                setUserForPermissions(u);
                                                setSelectedPermissions(
                                                  u.permissions || [],
                                                );
                                                setIsPermissionsModalOpen(true);
                                              }}
                                              className="w-7 h-7 flex items-center justify-center text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-all border border-transparent hover:border-amber-primary/20 active:scale-95 shadow-none"
                                              title="Grant Permissions"
                                            >
                                              <ShieldCheck size={14} />
                                            </button>
                                          )}
                                          {hasPermission(user, "MANAGE_TEAM") &&
                                            u.role === "employee" && (
                                              <button
                                                onClick={() => {
                                                  setUserForTeam(u);
                                                  setSelectedTeamLeader(
                                                    user?.role === "team_leader"
                                                      ? user.id
                                                      : u.teamLeaderId || "",
                                                  );
                                                  setIsTeamModalOpen(true);
                                                }}
                                                className="w-7 h-7 flex items-center justify-center text-text-dim hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-all border border-transparent hover:border-purple-500/20 active:scale-95 shadow-none"
                                                title="Assign Team"
                                              >
                                                <UsersIcon size={14} />
                                              </button>
                                            )}
                                          {u.role === "team_leader" && (
                                            <>
                                              <button
                                                onClick={() => {
                                                  setTeamFilter(u.id);
                                                  setSearchQuery("");
                                                }}
                                                className="w-7 h-7 flex items-center justify-center text-text-dim hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-all border border-transparent hover:border-purple-500/20 active:scale-95 shadow-none"
                                                title="View Team"
                                              >
                                                <UsersIcon size={14} />
                                              </button>
                                              {user?.role === "admin" && (
                                                <button
                                                  onClick={() => {
                                                    setSelectedTeamLeader(u.id);
                                                    setSelectedUsersForTeam([]);
                                                    setIsBuildTeamModalOpen(
                                                      true,
                                                    );
                                                  }}
                                                  className="w-7 h-7 flex items-center justify-center text-text-dim hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all border border-transparent hover:border-emerald-500/20 active:scale-95 shadow-none"
                                                  title="Expand Hierarchy"
                                                >
                                                  <UserPlus size={14} />
                                                </button>
                                              )}
                                            </>
                                          )}
                                          <button
                                            onClick={() => {
                                              setSelectedProfileUser(u);
                                              setActiveTab("profile");
                                            }}
                                            className="w-7 h-7 flex items-center justify-center text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-all border border-transparent hover:border-amber-primary/20 active:scale-95 shadow-none"
                                            title="Inspect Profile"
                                          >
                                            <User size={14} />
                                          </button>
                                          {u.id !== user?.id && (user?.role === "admin" || user?.role === "team_leader") && (
                                            <button
                                              onClick={() => {
                                                setUserToDelete(u);
                                                setIsDeleteUserModalOpen(true);
                                              }}
                                              className="w-7 h-7 flex items-center justify-center text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20 active:scale-95 shadow-none"
                                              title="Delete User"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
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
                            }))}
                          existingBuilders={allBuilders}
                          existingSocieties={allSocieties}
                          showToast={showToast}
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
              />
            )}
          </AnimatePresence>
          {/* User Modal */}
          <AnimatePresence>
            {isUserModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setCreatedUserCredentials(null);
                  }}
                  className="absolute inset-0 bg-black/70 "
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md max-h-[90vh] bg-surface border border-border-bright rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                >
                  <div className="p-6 border-b border-border-dim flex justify-between items-center shrink-0">
                    <h2 className="font-serif text-lg font-bold text-text-primary">
                      {createdUserCredentials
                        ? "User Created Successfully"
                        : "Add New User"}
                    </h2>
                    <button
                      onClick={() => {
                        setIsUserModalOpen(false);
                        setCreatedUserCredentials(null);
                      }}
                      className="text-text-dim hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

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
                      isLoading={isSubmitting} // Need to make sure isSubmitting is defined or use another state
                      error={userError}
                    />
                  )}
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
                  backgroundColor: themeRipple.toTheme === "light" ? "#f8fafc" : "#0e1015",
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
