import React, { useState, useEffect, Component, useRef } from 'react';
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
 Database as DatabaseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import Markdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

import { ProjectForm } from './components/ProjectForm';
import { ResalePropertyForm } from './components/ResalePropertyForm';
import ProjectMapView from './components/ProjectMapView';
import { PdfFile } from './components/PdfUpload';
import { CredentialManager } from './components/credentials/CredentialManager';
import { CredentialForm } from './components/credentials/CredentialForm';
import { CredentialGenerationCard } from './components/credentials/CredentialGenerationCard';
import { LoginForm, ForgotPasswordForm } from './components/credentials/AuthScreens';

// --- Types ---
type Role = 'admin' | 'employee' | 'team_leader';

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
 possessionStatus: 'Ready to Move' | 'Under Construction' | 'New Launch';
 price: number;
 location: string;
 status: 'Active' | 'Sold' | 'Pending' | 'PENDING_DELETE';
 isFavorite?: boolean;
 area: string;
 bathrooms?: string;
 coordinates?: { lat: number; lng: number };
 builderName?: string;
 projectType?: 'Residential' | 'Commercial';
 subType?: string;
 launchDate?: string;
 possessionDate?: string;
 reraNumber: string;
 pdfs?: { name: string; size: number; data: string }[];
 images?: { name: string; size: number; data: string }[];
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
 possessionStatus: 'Ready to Move' | 'Under Construction';
 possessionDate?: string;
 bathrooms?: string;
 price: number;
 isNegotiable: 'YES' | 'NO';
 floorNumber: string;
 propertyAge: string;
 constructionYear?: number;
 reraNumber?: string;
 floorPlan?: PdfFile[];
 images?: { name: string; size: number; data: string }[];
 brokeragePercentage: number;
 contactNumber?: string;
 coordinates?: { lat: number; lng: number };
 status: 'Active' | 'Sold' | 'Pending' | 'PENDING_DELETE';
 createdAt: string;
}

interface Report {
 id: string;
 title: string;
 content: string;
 assignedTo: string;
 status: 'Draft' | 'Final' | 'Archived';
 createdAt: string;
 updatedAt: string;
}

// --- Permissions ---
const ROLE_PERMISSIONS: Record<string, string[]> = {
 admin: ['MANAGE_USERS', 'VIEW_PROJECTS', 'ADD_PROJECTS', 'EDIT_PROJECTS', 'DELETE_PROJECTS', 'APPROVE_DELETIONS', 'VIEW_LOGS', 'VIEW_STATS', 'VIEW_RESALE', 'ADD_RESALE', 'EDIT_RESALE', 'DELETE_RESALE', 'MANAGE_PERMISSIONS', 'MANAGE_TEAM', 'VIEW_REPORTS', 'ADD_REPORTS', 'EDIT_REPORTS', 'DELETE_REPORTS'],
 team_leader: ['VIEW_PROJECTS', 'ADD_PROJECTS', 'EDIT_PROJECTS', 'REQUEST_DELETION', 'VIEW_STATS', 'VIEW_RESALE', 'ADD_RESALE', 'EDIT_RESALE', 'MANAGE_TEAM', 'VIEW_REPORTS', 'ADD_REPORTS', 'EDIT_REPORTS', 'DELETE_REPORTS'],
 employee: ['VIEW_PROJECTS', 'VIEW_RESALE', 'ADD_PROJECTS', 'EDIT_PROJECTS', 'REQUEST_DELETION', 'VIEW_REPORTS', 'EDIT_REPORTS']
};

const PERMISSION_CATEGORIES = [
 {
 name: 'User Management',
 permissions: ['MANAGE_USERS', 'MANAGE_PERMISSIONS', 'MANAGE_TEAM']
 },
 {
 name: 'Project Management',
 permissions: ['VIEW_PROJECTS', 'ADD_PROJECTS', 'EDIT_PROJECTS', 'DELETE_PROJECTS', 'APPROVE_DELETIONS', 'REQUEST_DELETION']
 },
 {
 name: 'Listing Projects Management',
 permissions: ['VIEW_RESALE', 'ADD_RESALE', 'EDIT_RESALE', 'DELETE_RESALE']
 },
 {
 name: 'Report Management',
 permissions: ['VIEW_REPORTS', 'ADD_REPORTS', 'EDIT_REPORTS', 'DELETE_REPORTS']
 },
 {
 name: 'System & Analytics',
 permissions: ['VIEW_LOGS', 'VIEW_STATS']
 }
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
 ? 'bg-amber-primary/10 border border-amber-primary/30 text-amber-primary' 
 : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary border border-transparent'
 }`}
 >
 <Icon size={18} className={active ? 'text-amber-primary' : 'text-text-dim group-hover:text-text-secondary'} />
 <span className="text-[13px] font-medium">{label}</span>
 {badge > 0 && (
 <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px]">
 {badge}
 </span>
 )}
 </button>
);

const KpiCard = ({ label, value, sub, icon: Icon, trend, color = 'amber' }: any) => {
 const colorClasses: any = {
 amber: 'text-amber-primary bg-amber-primary/10 border-amber-primary/20',
 blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
 green: 'text-green-500 bg-green-500/10 border-green-500/20',
 purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
 red: 'text-red-500 bg-red-500/10 border-red-500/20',
 };

 return (
 <motion.div 
 whileHover={{ y: -4, transition: { duration: 0.2 } }}
 className="bg-3d border-3d shadow-3d p-6 rounded-[24px] relative overflow-hidden group"
 >
 {/* Scanning Line Animation */}
 <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
 <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-amber-primary/10 to-transparent " />
 </div>

 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/10 transition-all" />
 
 <div className="flex items-start justify-between mb-4">
 <div className={`p-3 rounded-xl border ${colorClasses[color] || colorClasses.amber} transition-transform group-hover:scale-110`}>
 {Icon && <Icon size={20} />}
 </div>
 {trend && (
 <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${trend > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
 {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
 </div>
 )}
 </div>

 <div className="space-y-1">
 <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-bold">{label}</div>
 <div className="flex items-baseline gap-2">
 <div className="text-3xl font-serif font-bold text-text-primary tracking-tight">{value}</div>
 </div>
 <div className="text-[10px] text-text-secondary font-medium flex items-center gap-1.5 mt-2">
 <div className={`w-1.5 h-1.5 rounded-full ${trend && trend > 0 ? 'bg-green-500 animate-pulse' : 'bg-amber-primary'}`} />
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
 {Icon && <Icon size={16} className="text-amber-primary drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />}
 {title}
 </h3>
 <div className="relative z-10">{action}</div>
 </div>
 <div className="p-6 relative z-10">
 {children}
 </div>
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
 <h1 className="text-2xl font-serif font-bold text-text-primary">Something went wrong</h1>
 <p className="text-sm text-text-secondary leading-relaxed">
 An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
 </p>
 <div className="bg-surface-2 p-4 rounded-xl border border-border-dim text-left overflow-auto max-h-40">
 <code className="text-[10px] text-red-400 font-mono">{this.state.error?.toString()}</code>
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
 type: 'success' | 'error' | 'info' | 'warning';
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
 warning: <AlertTriangle size={18} className="text-orange-500" />
 };

 const colors = {
 success: 'border-green-500/30 bg-green-500/5 text-green-500',
 error: 'border-red-500/30 bg-red-500/5 text-red-500',
 info: 'border-amber-primary/30 bg-amber-primary/5 text-amber-primary',
 warning: 'border-orange-500/30 bg-orange-500/5 text-orange-500'
 };

 const progressColors = {
 success: 'bg-green-500',
 error: 'bg-red-500',
 info: 'bg-amber-primary',
 warning: 'bg-orange-500'
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
 initial={{ width: '100%' }}
 animate={{ width: '0%' }}
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

const ProjectCard = ({ project, onClick, onEdit, onDelete, hasEditPermission, hasDeletePermission, isSelected, onSelect }: any) => (
 <motion.div 
 whileHover={{ y: -6 }}
 onClick={() => onClick(project)}
 className={`bg-surface border rounded-2xl overflow-hidden group flex flex-col h-full transition-all duration-500 relative cursor-pointer ${
 isSelected ? 'ring-2 ring-amber-primary border-amber-primary shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 
 'border-border-dim hover:border-amber-primary/40 hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)]'
 }`}
 >
 {/* Selection Checkbox */}
 <div 
 className={`absolute top-3 left-3 z-30 w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
 isSelected ? 'bg-amber-primary border-amber-primary' : 'bg-black/40 border-white/20 hover:border-white/60 '
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
 src={project.images && project.images.length > 0 ? project.images[0].data : `https://picsum.photos/seed/${project.title}/800/600`} 
 alt={project.title}
 referrerPolicy="no-referrer"
 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
 />

 {/* Status Badge */}
 <div className="absolute bottom-2 left-2 z-20">
 <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border flex items-center gap-1 ${
 project.status === 'Active' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' :
 project.status === 'PENDING_DELETE' ? 'border-red-500/50 bg-red-500/10 text-red-400' :
 'border-amber-500/50 bg-amber-500/10 text-amber-400'
 }`}>
 {project.status === 'Active' && (
 <span className="flex h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
 )}
 {project.status}
 </span>
 </div>

 {/* Price Overlay */}
 <div className="absolute bottom-2 right-2 z-20">
 <div className="bg-bg/80 border border-white/10 px-2 py-1 rounded-lg shadow-xl">
 <p className="text-[6px] text-text-dim uppercase tracking-widest font-black mb-0.5">Starting From</p>
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
 <span className="text-[8px] text-amber-primary font-black uppercase tracking-widest">{project.type.replace('FLATS', 'Apartments').replace('Apartment', 'Apartments')}</span>
 <span className="w-1 h-1 rounded-full bg-border-bright" />
 <span className="text-[8px] text-text-dim font-bold uppercase tracking-widest">
 {project.possessionStatus}
 {project.possessionDate && ` • ${new Date(project.possessionDate).toLocaleDateString()}`}
 </span>
 </div>
 <h3 className="text-sm font-serif font-bold text-text-primary group-hover:text-amber-primary transition-colors line-clamp-1">
 {project.title}
 </h3>
 <div className="flex items-center gap-1 mt-0.5 text-text-dim group-hover:text-text-secondary transition-colors">
 <MapPin size={8} className="text-amber-primary/60" />
 <span className="text-[9px] font-medium truncate">{project.location}</span>
 </div>
 </div>

 {/* Property Specs Grid */}
 <div className="grid grid-cols-3 gap-1 py-2 border-y border-border-dim/30 mb-2">
 <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-surface-2/50 border border-border-dim/20">
 <Maximize2 size={10} className="text-amber-primary mb-0.5" />
 <span className="text-[8px] font-mono font-bold text-text-primary">{project.area}</span>
 <span className="text-[6px] text-text-dim uppercase font-black tracking-tighter">Sq.Ft</span>
 </div>
 <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-surface-2/50 border border-border-dim/20">
 <Home size={10} className="text-amber-primary mb-0.5" />
 <span className="text-[8px] font-mono font-bold text-text-primary truncate max-w-full px-1">
 {(project.configuration || project.bhk || 'N/A').replace('5BHK', 'Penthouse')}
 </span>
 <span className="text-[6px] text-text-dim uppercase font-black tracking-tighter">BHK</span>
 </div>
 <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-surface-2/50 border border-border-dim/20">
 <Bath size={10} className="text-amber-primary mb-0.5" />
 <span className="text-[8px] font-mono font-bold text-text-primary">{project.bathrooms || 2}</span>
 <span className="text-[6px] text-text-dim uppercase font-black tracking-tighter">Baths</span>
 </div>
 </div>

 {/* Footer Actions */}
 <div className="mt-auto flex items-center justify-between">
 <div className="flex items-center gap-1.5">
 <div className="relative">
 <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-primary to-amber-secondary flex items-center justify-center text-[8px] font-black text-bg border-2 border-surface shadow-lg">
 {project.assignedTo?.charAt(0) || 'U'}
 </div>
 <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-surface rounded-full" />
 </div>
 <div className="flex flex-col">
 <span className="text-[6px] text-text-dim uppercase font-black tracking-widest leading-none">Manager</span>
 <span className="text-[8px] text-text-primary font-bold leading-none">{project.assignedTo || 'Unassigned'}</span>
 </div>
 </div>

 <div className="flex items-center gap-0.5">
 <button 
 onClick={(e) => { e.stopPropagation(); onClick(project); }}
 className="p-1 text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-all group/btn"
 title="View Details"
 >
 <Eye size={12} className="group-hover/btn:scale-110 transition-transform" />
 </button>
 {hasEditPermission && (
 <button 
 onClick={(e) => { e.stopPropagation(); onEdit(project); }}
 className="p-1 text-text-dim hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group/btn"
 title="Edit Project"
 >
 <Edit size={12} className="group-hover/btn:scale-110 transition-transform" />
 </button>
 )}
 {hasDeletePermission && (
 <button 
 onClick={(e) => { e.stopPropagation(); onDelete(project); }}
 className="p-1 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all group/btn"
 title="Delete Project"
 >
 <Trash2 size={12} className="group-hover/btn:scale-110 transition-transform" />
 </button>
 )}
 </div>
 </div>
 </div>
 </motion.div>
);

const BuilderDetailModal = ({ builderName, projects, onClose, onProjectClick, user }: { builderName: string, projects: Project[], onClose: () => void, onProjectClick?: (project: Project) => void, user: User | null }) => {
 const builderProjects = projects.filter(p => p.builderName === builderName);
 const totalArea = builderProjects.reduce((acc, p) => acc + (parseInt(p.area.replace(/,/g, '')) || 0), 0);
 const avgPrice = builderProjects.reduce((acc, p) => acc + p.price, 0) / builderProjects.length;

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
 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-primary">Developer Profile</span>
 <div className="h-px w-8 bg-amber-primary/30" />
 </div>
 <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary tracking-tight leading-tight">
 {builderName}
 </h2>
 </div>
 
 <p className="text-text-dim text-[11px] leading-relaxed font-medium whitespace-pre-line opacity-80">
 {builderName === 'M3M' ? (
 "Founded in 2010, M3M India has quickly risen as one of India’s most dynamic and innovative real estate developers, built on the values of ethical governance, transparency, commitment, and passion for excellence.\n\nWith a forward-looking vision crafted by Founder Chairman Sh. Basant Bansal and Promoters Sh. Roop Bansal and Sh. Pankaj Bansal, M3M India has become a transformative force in the luxury residential and retail real estate sector. Today, M3M stands as a symbol of sophistication and innovation, setting new benchmarks across India."
 ) : builderName === 'DLF' ? (
 "Founded in 1946 by Chaudhary Raghvendra Singh, DLF began with the development of 22 urban colonies in Delhi. In 1985, the company expanded into the then-unknown region of Gurugram, creating exceptional living and working spaces for India’s emerging global professionals. Today, DLF is the largest publicly listed real estate company in India, with residential, commercial, and retail properties spanning 15 states and 24 cities.\n\nOur diverse verticals reflect our dedication to developing ecosystems for India’s evolving needs. However, our true foundation lies in our employees, customers, stakeholders, and shareholders. We invest in spearheading innovation through empowerment and optimism, to build the foundation of India’s future grounded in the legacy of our past."
 ) : (
 "A premier real estate developer committed to delivering high-quality residential and commercial spaces with a focus on innovation and sustainability."
 )}
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
 { label: 'Total Projects', value: builderProjects.length, icon: LayoutGrid, color: 'text-amber-primary', bg: 'bg-amber-primary/5' },
 { label: 'Area Delivered', value: `${(totalArea / 1000000).toFixed(1)}M SQ FT`, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/5' },
 { label: 'Avg. Value', value: formatPrice(avgPrice), icon: IndianRupee, color: 'text-green-400', bg: 'bg-green-400/5' }
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
 <div className="text-xl font-serif font-bold text-text-primary">{stat.value}</div>
 </motion.div>
 ))}
 </div>

 {/* Portfolio Showcase */}
 <div className="space-y-8">
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <div className="space-y-1">
 <h3 className="text-2xl font-serif font-bold text-text-primary">Project Portfolio</h3>
 <p className="text-xs text-text-dim">Selection of active developments</p>
 </div>
 <div className="flex items-center gap-3 px-3 py-1.5 bg-surface-2 rounded-lg border border-border-bright">
 <span className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Listings</span>
 <div className="w-px h-3 bg-border-dim" />
 <span className="text-[10px] font-mono font-bold text-amber-primary">{builderProjects.length}</span>
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
 src={p.images && p.images.length > 0 ? p.images[0].data : `https://picsum.photos/seed/${p.id}/800/500`} 
 alt={p.title}
 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
 referrerPolicy="no-referrer"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-surface-2 via-transparent to-transparent" />
 <div className="absolute top-3 right-3">
 <span className={`text-[7px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest ${
 p.status === 'Active' ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400' : 'border-amber-500/30 bg-amber-500/20 text-amber-400'
 }`}>
 {p.status}
 </span>
 </div>
 </div>
 <div className="p-5 space-y-3">
 <div className="space-y-0.5">
 <h4 className="text-sm font-bold text-text-primary group-hover:text-amber-primary transition-colors line-clamp-1">{p.title}</h4>
 <div className="flex items-center gap-1.5 text-[9px] text-text-dim font-medium">
 <MapPin size={10} className="text-amber-primary" />
 {p.location}
 </div>
 </div>
 <div className="flex items-center justify-between pt-3 border-t border-border-dim/30">
 <div className="space-y-0.5">
 <p className="text-[7px] text-text-dim uppercase font-black tracking-widest">From</p>
 <div className="text-xs font-mono font-bold text-text-primary">{formatPrice(p.price)}</div>
 </div>
 <div className="text-right">
 <p className="text-[7px] text-text-dim uppercase font-black tracking-widest">Type</p>
 <div className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">{p.type}</div>
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
 <span className="text-[8px] uppercase font-black tracking-widest">Updated</span>
 <span className="text-[10px] font-mono">{new Date().toLocaleDateString()}</span>
 </div>
 <div className="w-px h-6 bg-border-dim" />
 <div className="flex flex-col">
 <span className="text-[8px] uppercase font-black tracking-widest">ID</span>
 <span className="text-[10px] font-mono">B-{builderName.slice(0, 3).toUpperCase()}</span>
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
 hasCreatePermission
}: { 
 project: Project, 
 onClose: () => void, 
 showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, 
 onViewBuilder: (name: string) => void,
 onEdit?: (p: Project) => void,
 onDelete?: (p: Project) => void,
 onCreate?: () => void,
 hasEditPermission?: boolean,
 hasDeletePermission?: boolean,
 hasCreatePermission?: boolean
}) => {
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
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
 className="relative w-full max-w-6xl h-full max-h-[95vh] sm:max-h-[90vh] bg-surface border border-border-dim rounded-2xl sm:rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col z-50"
 >
 {/* Close Button */}
 <button 
 onClick={onClose}
 className="absolute top-6 right-6 z-30 p-3 bg-surface/40 hover:bg-amber-primary text-white hover:text-bg rounded-full border border-white/10 transition-all group"
 >
 <X size={18} className="group-hover:rotate-90 transition-transform" />
 </button>

 <div className="flex-1 overflow-y-auto no-scrollbar">
 <div className="w-full max-w-none">
 {/* Hero Section */}
 <div className="relative h-[400px] sm:h-[600px] w-full overflow-hidden">
 <motion.img 
 initial={{ scale: 1.1 }}
 animate={{ scale: 1 }}
 transition={{ duration: 1.5, ease: "easeOut" }}
 src={project.images && project.images.length > 0 ? project.images[0].data : `https://picsum.photos/seed/${project.title}/1920/1080`} 
 alt={project.title}
 referrerPolicy="no-referrer"
 className="w-full h-full object-cover"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
 <div className="absolute inset-0 bg-gradient-to-r from-surface/60 via-transparent to-transparent" />
 
 <div className="absolute bottom-0 left-0 w-full p-8 sm:p-12 space-y-6">
 <div className="flex flex-wrap items-center gap-3">
 <motion.span 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 className={`text-[9px] px-3 py-1 rounded-full border font-black uppercase tracking-[0.3em] ${
 project.status === 'Active' ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' :
 project.status === 'PENDING_DELETE' ? 'border-red-500/50 bg-red-500/20 text-red-400' :
 'border-amber-500/50 bg-amber-500/20 text-amber-400'
 }`}
 >
 {project.status}
 </motion.span>
 <motion.span 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.1 }}
 className="text-[9px] px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/90 font-black uppercase tracking-[0.3em] "
 >
 {project.projectType}
 </motion.span>
 </div>
 
 <div className="space-y-3 max-w-3xl">
 <motion.h2 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="text-3xl sm:text-5xl font-serif font-bold text-text-primary tracking-tight leading-[1.1]"
 >
 {project.title}
 </motion.h2>
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="flex items-center gap-2 text-amber-primary font-serif italic text-lg sm:text-xl opacity-90"
 >
 <MapPin size={18} strokeWidth={1.5} />
 {project.location}
 </motion.div>
 </div>
 </div>
 </div>

 {/* Content Grid */}
 <div className="p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
 {/* Left Column: Stats & Description */}
 <div className="lg:col-span-8 space-y-12">
 {/* Bento Stats */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 { label: 'Investment', value: formatPrice(project.price), icon: IndianRupee, color: 'text-amber-primary', bg: 'bg-amber-primary/5' },
 { label: 'Area', value: `${project.area} SQ FT`, icon: LayoutGrid, color: 'text-blue-400', bg: 'bg-blue-400/5' },
 { label: 'Config', value: (project.configuration || 'N/A').replace('5BHK', 'Penthouse'), icon: Home, color: 'text-purple-400', bg: 'bg-purple-400/5' },
 { label: 'Possession', value: (() => {
 if (!project.possessionDate) return project.possessionStatus;
 const target = new Date(project.possessionDate);
 const now = new Date();
 const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
 const dateStr = target.toLocaleDateString();
 if (diffDays > 0) return `${project.possessionStatus} (${diffDays}d left)`;
 if (diffDays === 0) return 'Ready Today';
 return `${project.possessionStatus} (${dateStr})`;
 })(), icon: Calendar, color: 'text-green-400', bg: 'bg-green-400/5' }
 ].map((stat, i) => (
 <motion.div 
 key={i} 
 whileHover={{ y: -3 }}
 className={`${stat.bg} p-6 rounded-2xl border border-border-bright space-y-3 group transition-all`}
 >
 <div className="flex items-center gap-2 text-[8px] text-text-dim uppercase tracking-[0.25em] font-black group-hover:text-text-primary transition-colors">
 <stat.icon size={12} className={stat.color} />
 {stat.label}
 </div>
 <div className="text-base font-serif font-bold text-text-primary">{stat.value}</div>
 </motion.div>
 ))}
 </div>

 {/* Gallery Section */}
 {project.images && project.images.length > 1 && (
 <div className="space-y-8">
 <div className="flex items-center justify-between">
 <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
 <div className="w-6 h-px bg-amber-primary/30" />
 Visual Portfolio
 </h3>
 <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest">{project.images.length - 1} Views</span>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
 {project.images.slice(1).map((img, idx) => (
 <motion.div 
 key={idx} 
 whileHover={{ scale: 1.02 }}
 className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border-bright group cursor-pointer shadow-lg"
 >
 <img src={img.data} alt={img.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 ">
 <Maximize2 size={16} className="text-white" />
 <span className="text-[8px] text-white font-black uppercase tracking-widest">Expand</span>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 )}

 <div className="h-px bg-gradient-to-r from-border-dim/50 via-border-dim to-transparent w-full" />

 {/* Specifications & Management */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
 <div className="space-y-8">
 <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
 <div className="w-6 h-px bg-amber-primary/30" />
 Specifications
 </h3>
 <div className="space-y-2">
 {[
 { label: 'Type', value: project.type.replace('FLATS', 'Apartments').replace('Apartment', 'Apartments'), icon: Building },
 { label: 'Sub-Type', value: project.subType?.replace('FLATS', 'Apartments').replace('Apartment', 'Apartments') || 'N/A', icon: Layout },
 { label: 'Bathrooms', value: project.bathrooms ? `${project.bathrooms} Units` : 'N/A', icon: Bath },
 { label: 'Launch', value: project.launchDate ? new Date(project.launchDate).toLocaleDateString() : 'N/A', icon: Clock }
 ].map((item, i) => (
 <div key={i} className="flex justify-between items-center p-4 bg-surface-2/50 border border-border-bright rounded-xl hover:bg-surface-2 transition-colors group">
 <div className="flex items-center gap-2.5">
 <item.icon size={12} className="text-text-dim group-hover:text-amber-primary transition-colors" />
 <span className="text-[9px] text-text-dim uppercase font-black tracking-widest">{item.label}</span>
 </div>
 <span className="text-xs font-bold text-text-primary">{item.value}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="space-y-8">
 <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
 <div className="w-6 h-px bg-amber-primary/30" />
 Management
 </h3>
 <div className="bg-surface-2 rounded-2xl p-6 border border-border-bright space-y-6 relative overflow-hidden">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-amber-primary/10 flex items-center justify-center text-amber-primary border border-amber-primary/20 shadow-lg">
 <User size={24} strokeWidth={1.5} />
 </div>
 <div>
 <div className="text-[8px] text-text-dim uppercase font-black tracking-widest mb-0.5">Manager</div>
 <div className="text-base font-serif font-bold text-text-primary">{project.assignedTo || 'Unassigned'}</div>
 </div>
 </div>
 
 <div className="pt-4 border-t border-border-dim/50 space-y-4">
 <div className="text-[8px] text-text-dim uppercase font-black tracking-widest">Quick Actions</div>
 <div className="grid grid-cols-2 gap-2">
 {hasEditPermission && onEdit && (
 <button 
 onClick={() => { onEdit(project); onClose(); }}
 className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all"
 >
 <Edit size={14} /> Edit
 </button>
 )}
 {hasDeletePermission && onDelete && (
 <button 
 onClick={() => { onDelete(project); onClose(); }}
 className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
 >
 <Trash2 size={14} /> Delete
 </button>
 )}
 {hasCreatePermission && (
 <button 
 onClick={() => {
 if (onCreate) {
 onCreate();
 onClose();
 }
 }}
 className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-green-500 hover:text-white transition-all col-span-2"
 >
 <Plus size={14} /> Create Project
 </button>
 )}
 </div>
 </div>

 <div className="space-y-2 pt-4">
 <div className="text-[8px] text-text-dim uppercase font-black tracking-widest">Asset ID</div>
 <div className="flex items-center justify-between bg-surface-3 p-3 rounded-lg border border-border-bright font-mono text-[10px] text-text-secondary group">
 {project.id.slice(0, 16)}...
 <button 
 onClick={() => {
 navigator.clipboard.writeText(project.id);
 showToast('ID Copied', 'success');
 }}
 className="text-text-dim hover:text-amber-primary transition-colors p-1.5 hover:bg-amber-primary/10 rounded-md"
 >
 <ClipboardList size={14} />
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column: Builder & Downloads */}
 <div className="lg:col-span-4 space-y-10">
 {/* Builder Card */}
 <div className="bg-surface-2 rounded-3xl p-6 border border-border-bright relative overflow-hidden group shadow-xl">
 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-primary/5 rounded-full -mr-16 -mt-16 blur-[60px] group-hover:bg-amber-primary/10 transition-all duration-700" />
 <div className="relative z-10 space-y-6">
 <div className="space-y-4">
 <div className="w-14 h-14 bg-surface-3 rounded-2xl flex items-center justify-center text-amber-primary border border-border-bright shadow-lg group-hover:scale-110 transition-transform duration-500">
 <Building2 size={28} strokeWidth={1.5} />
 </div>
 <div className="space-y-1">
 <h4 className="text-xl font-serif font-bold text-text-primary leading-tight">{project.builderName || 'General Builder'}</h4>
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
 <span className="text-[9px] text-amber-primary font-black uppercase tracking-[0.2em]">Verified Partner</span>
 </div>
 </div>
 </div>
 <p className="text-[10px] text-text-dim leading-relaxed font-medium opacity-80 line-clamp-3">
 {project.builderName === 'M3M' ? (
 "Founded in 2010, M3M India has quickly risen as one of India’s most dynamic and innovative real estate developers, built on the values of ethical governance, transparency, commitment, and passion for excellence."
 ) : project.builderName === 'DLF' ? (
 "Founded in 1946 by Chaudhary Raghvendra Singh, DLF began with the development of 22 urban colonies in Delhi. Today, DLF is the largest publicly listed real estate company in India."
 ) : (
 `A premier developer recognized for architectural innovation and commitment to delivering exceptional living experiences in the ${project.location} sector.`
 )}
 </p>
 <button 
 onClick={() => onViewBuilder(project.builderName || 'General Builder')}
 className="w-full py-3.5 bg-surface-3 border border-border-bright rounded-xl text-[9px] font-black text-text-primary uppercase tracking-[0.25em] hover:border-amber-primary hover:bg-amber-primary hover:text-bg transition-all duration-300 shadow-md"
 >
 View Profile
 </button>
 </div>
 </div>

 {/* Downloads Section */}
 <div className="space-y-6">
 <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
 <div className="w-6 h-px bg-amber-primary/30" />
 Documentation
 </h3>
 <div className="space-y-3">
 {(() => {
 const uniquePdfs: any[] = [];
 const seenNames = new Set();
 if (project.pdfs) {
 project.pdfs.forEach(pdf => {
 if (!seenNames.has(pdf.name)) {
 seenNames.add(pdf.name);
 uniquePdfs.push(pdf);
 }
 });
 }
 
 return uniquePdfs.length > 0 ? (
 uniquePdfs.map((pdf, idx) => (
 <motion.button 
 whileHover={{ x: 5 }}
 key={idx}
 onClick={() => {
 const link = document.createElement('a');
 link.href = pdf.data;
 link.download = pdf.name;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 showToast('Preparing download...', 'info');
 }}
 className="w-full flex items-center justify-between p-4 bg-surface-2 border border-border-bright rounded-2xl hover:border-amber-primary/50 hover:bg-surface-3 transition-all group text-left shadow-md"
 >
 <div className="flex items-center gap-4 overflow-hidden">
 <div className="bg-red-500/10 p-3 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
 <FileText size={18} strokeWidth={1.5} />
 </div>
 <div className="flex flex-col overflow-hidden">
 <span className="text-xs font-bold text-text-primary truncate group-hover:text-amber-primary transition-colors">{pdf.name}</span>
 <span className="text-[8px] text-text-dim font-mono uppercase tracking-widest">{(pdf.size / 1024 / 1024).toFixed(2)} MB</span>
 </div>
 </div>
 <Download size={14} className="text-text-dim group-hover:text-amber-primary transition-colors" />
 </motion.button>
 ))
 ) : (
 <div className="p-8 border-2 border-dashed border-border-dim rounded-2xl text-center space-y-3 bg-surface-2/30">
 <FileX size={24} className="text-text-dim/20 mx-auto" />
 <p className="text-[10px] text-text-dim font-medium italic">No assets available.</p>
 </div>
 );
 })()}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="p-8 sm:p-10 border-t border-border-dim bg-surface-2">
 <div className="w-full max-w-none flex flex-col sm:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-8">
 <div className="flex flex-col gap-0.5">
 <span className="text-[8px] uppercase font-black tracking-[0.2em] text-text-dim">Status</span>
 <div className="flex items-center gap-1.5">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
 <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Active</span>
 </div>
 </div>
 <div className="w-px h-8 bg-border-dim" />
 <div className="flex flex-col gap-0.5">
 <span className="text-[8px] uppercase font-black tracking-[0.2em] text-text-dim">Sync</span>
 <span className="text-[10px] font-mono font-bold text-text-primary">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
 </div>
 </div>
 
 <div className="flex items-center gap-3 w-full sm:w-auto">
 {hasEditPermission && onEdit && (
 <button 
 onClick={() => {
 onEdit(project);
 onClose();
 }}
 className="flex-1 sm:flex-none px-6 py-4 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10 active:scale-95 flex items-center justify-center gap-2"
 >
 <Edit size={14} />
 Edit Project
 </button>
 )}
 {hasDeletePermission && onDelete && (
 <button 
 onClick={() => {
 onDelete(project);
 onClose();
 }}
 className="flex-1 sm:flex-none px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 active:scale-95 flex items-center justify-center gap-2"
 >
 <Trash2 size={14} />
 Delete
 </button>
 )}
 <button 
 onClick={onClose}
 className="flex-1 sm:flex-none px-12 py-4 bg-amber-primary text-bg rounded-xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-amber-secondary transition-all shadow-xl shadow-amber-primary/20 active:scale-95"
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

const ResalePropertyDetailModal = ({ property, onClose, showToast, onViewBuilder }: { property: ResaleProperty, onClose: () => void, showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, onViewBuilder: (name: string) => void }) => {
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
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
 className="relative w-full max-w-6xl h-full max-h-[95vh] sm:max-h-[90vh] bg-surface border border-border-dim rounded-2xl sm:rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col z-50"
 >
 {/* Close Button */}
 <button 
 onClick={onClose}
 className="absolute top-8 right-8 z-30 p-3 bg-surface/20 hover:bg-surface-3 text-white rounded-full border border-white/10 transition-all group"
 >
 <X size={24} className="group-hover:rotate-90 transition-transform" />
 </button>

 <div className="flex-1 overflow-y-auto no-scrollbar">
 <div className="w-full max-w-none">
 {/* Hero Section */}
 <div className="relative h-[450px] sm:h-[650px] w-full">
 <img 
 src={property.images && property.images.length > 0 ? property.images[0].data : `https://picsum.photos/seed/${property.societyName}/1920/1080`} 
 alt={property.societyName}
 referrerPolicy="no-referrer"
 className="w-full h-full object-cover"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
 
 <div className="absolute bottom-0 left-0 w-full p-8 sm:p-12 space-y-6">
 <div className="flex flex-wrap items-center gap-3">
 <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-[0.2em] ${
 property.status === 'Active' ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' :
 property.status === 'Sold' ? 'border-red-500/50 bg-red-500/20 text-red-400' :
 'border-amber-500/50 bg-amber-500/20 text-amber-400'
 }`}>
 {property.status}
 </span>
 <span className="text-[10px] px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 font-black uppercase tracking-[0.2em] ">
 LISTING PROJECT
 </span>
 </div>
 
 <div className="space-y-2">
 <h2 className="text-4xl sm:text-6xl font-serif font-bold text-text-primary tracking-tight leading-none">
 {property.societyName}
 </h2>
 <div className="flex items-center gap-2 text-amber-primary font-serif italic text-lg sm:text-xl">
 <MapPin size={20} />
 {property.location}
 </div>
 </div>
 </div>
 </div>

 {/* Content Grid */}
 <div className="p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
 {/* Left Column: Stats & Description */}
 <div className="lg:col-span-8 space-y-12">
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
 {[
 { label: 'Price', value: formatPrice(property.price), icon: IndianRupee, color: 'text-amber-primary' },
 { label: 'Total Area', value: `${property.sizeSqft} SQ FT`, icon: LayoutGrid, color: 'text-blue-400' },
 { label: 'Configuration', value: property.bhk.includes('BHK') || property.bhk.includes('Penthouse') ? property.bhk : `${property.bhk} BHK`, icon: Home, color: 'text-purple-400' },
 { label: 'Bathrooms', value: property.bathrooms || 'N/A', icon: Bath, color: 'text-cyan-400' },
 { label: 'Property Age', value: property.propertyAge || 'N/A', icon: Clock, color: 'text-green-400' },
 { label: 'Construction Year', value: property.constructionYear || 'N/A', icon: Calendar, color: 'text-orange-400' }
 ].map((stat, i) => (
 <div key={i} className="space-y-2">
 <div className="flex items-center gap-2 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black">
 <stat.icon size={12} className={stat.color} />
 {stat.label}
 </div>
 <div className="text-lg font-bold text-text-primary">{stat.value}</div>
 </div>
 ))}
 </div>

 {property.images && property.images.length > 1 && (
 <div className="space-y-6">
 <h3 className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-3">
 <ImageIcon size={16} className="text-amber-primary" />
 Property Gallery
 </h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
 {property.images.slice(1).map((img, idx) => (
 <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-border-dim group cursor-pointer">
 <img src={img.data} alt={img.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
 <Maximize2 size={24} className="text-white" />
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 <div className="h-px bg-border-dim/50 w-full" />

 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
 <div className="space-y-6">
 <h3 className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-3">
 <Activity size={16} className="text-amber-primary" />
 Property Specifications
 </h3>
 <div className="space-y-4">
 {[
 { label: 'Property Type', value: property.propertyType },
 { label: 'Floor Number', value: property.floorNumber || 'N/A' },
 { label: 'Negotiable', value: property.isNegotiable },
 { label: 'Brokerage', value: `${property.brokeragePercentage}%` },
 { label: 'Listed On', value: new Date(property.createdAt).toLocaleDateString() }
 ].map((item, i) => (
 <div key={i} className="flex justify-between items-center py-3 border-b border-border-dim/30 last:border-0">
 <span className="text-[10px] text-text-dim uppercase font-bold">{item.label}</span>
 <span className="text-sm font-bold text-text-primary">{item.value}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="space-y-6">
 <h3 className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-3">
 <User size={16} className="text-amber-primary" />
 Ownership Details
 </h3>
 <div className="bg-surface-2 rounded-2xl p-6 border border-border-bright space-y-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-amber-primary/10 flex items-center justify-center text-amber-primary">
 <User size={24} />
 </div>
 <div>
 <div className="text-[9px] text-text-dim uppercase font-bold">Property Holder</div>
 <div className="text-sm font-bold text-text-primary">{property.propertyHolderName}</div>
 </div>
 </div>
 <div className="space-y-2">
 <div className="text-[9px] text-text-dim uppercase font-bold">Contact Number</div>
 <div className="flex items-center justify-between bg-surface-3 p-3 rounded-lg border border-border-bright font-mono text-[10px] text-text-secondary">
 {property.contactNumber || 'Not Provided'}
 {property.contactNumber && (
 <button 
 onClick={() => {
 navigator.clipboard.writeText(property.contactNumber!);
 showToast('Number Copied', 'success');
 }}
 className="text-amber-primary hover:text-amber-secondary"
 >
 <ClipboardList size={14} />
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column: Builder & Downloads */}
 <div className="lg:col-span-4 space-y-10">
 {/* Builder Card */}
 <div className="bg-surface-2 rounded-3xl p-8 border border-border-bright relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-primary/10 transition-all" />
 <div className="relative z-10 space-y-6">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 bg-amber-primary/10 rounded-2xl flex items-center justify-center text-amber-primary border border-amber-primary/20">
 <Building2 size={32} />
 </div>
 <div>
 <h4 className="text-lg font-bold text-text-primary">{property.builderName || 'General Builder'}</h4>
 <div className="flex items-center gap-2 mt-1">
 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
 <span className="text-[10px] text-amber-primary font-bold uppercase tracking-widest">Original Builder</span>
 </div>
 </div>
 </div>
 <p className="text-xs text-text-secondary leading-relaxed">
 The original developer of this society, known for quality construction and premium amenities in {property.location}.
 </p>
 <button 
 onClick={() => onViewBuilder(property.builderName || 'General Builder')}
 className="w-full py-3 bg-surface-3 border border-border-bright rounded-xl text-[10px] font-bold text-text-primary uppercase tracking-widest hover:border-amber-primary transition-all"
 >
 View Builder Portfolio
 </button>
 </div>
 </div>

 {/* Downloads */}
 <div className="space-y-6">
 <h3 className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-3">
 <Download size={16} className="text-amber-primary" />
 Property Documents
 </h3>
 <div className="space-y-3">
 {property.floorPlan && property.floorPlan.length > 0 ? (
 property.floorPlan.map((pdf, idx) => (
 <motion.button 
 whileHover={{ x: 4 }}
 key={idx}
 onClick={() => {
 const link = document.createElement('a');
 link.href = pdf.data;
 link.download = pdf.name;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 showToast('Downloading document...', 'info');
 }}
 className="w-full flex items-center justify-between p-4 bg-surface-2 border border-border-bright rounded-2xl hover:border-amber-primary/50 hover:bg-surface-3 transition-all group text-left"
 >
 <div className="flex items-center gap-4 overflow-hidden">
 <div className="bg-red-500/10 p-3 rounded-xl text-red-500 group-hover:scale-110 transition-transform">
 <FileText size={20} />
 </div>
 <div className="flex flex-col overflow-hidden">
 <span className="text-xs font-bold text-text-primary truncate group-hover:text-amber-primary transition-colors">{pdf.name}</span>
 <span className="text-[9px] text-text-dim font-mono uppercase">{(pdf.size / 1024).toFixed(1)} KB • PDF</span>
 </div>
 </div>
 <Download size={16} className="text-text-dim group-hover:text-amber-primary transition-colors" />
 </motion.button>
 ))
 ) : (
 <div className="p-8 text-center bg-surface-2 rounded-2xl border border-border-dim border-dashed">
 <FileQuestion size={24} className="text-text-dim/30 mx-auto mb-2" />
 <p className="text-[10px] text-text-dim italic">No documents available for this property.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="p-8 sm:p-10 border-t border-border-dim bg-surface-2">
 <div className="w-full max-w-none flex flex-col sm:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-8">
 <div className="flex flex-col gap-0.5">
 <span className="text-[8px] uppercase font-black tracking-[0.2em] text-text-dim">Status</span>
 <div className="flex items-center gap-1.5">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
 <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Active</span>
 </div>
 </div>
 <div className="w-px h-8 bg-border-dim" />
 <div className="flex flex-col gap-0.5">
 <span className="text-[8px] uppercase font-black tracking-[0.2em] text-text-dim">Sync</span>
 <span className="text-[10px] font-mono font-bold text-text-primary">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
 </div>
 </div>
 
 <button 
 onClick={onClose}
 className="w-full sm:w-auto px-12 py-4 bg-amber-primary text-bg rounded-xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-amber-secondary transition-all shadow-xl shadow-amber-primary/20 active:scale-95"
 >
 Close Property Details
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 );
};

const ProfileView = ({ user, onUpdate, isSelf, onBack, currentUserRole, showToast, autoSave, onResetCredentials }: { user: User | null, onUpdate: (data: Partial<User>) => void, isSelf: boolean, onBack?: () => void, currentUserRole: Role, showToast: (msg: string, type?: any) => void, autoSave: boolean, onResetCredentials: (id: string) => Promise<void> }) => {
 const [formData, setFormData] = useState({ 
 name: user?.name || '', 
 email: user?.email || '', 
 role: user?.role || 'employee', 
 profilePicture: user?.profilePicture || '',
 phoneNumber: user?.phoneNumber || ''
 });
 const [isEditing, setIsEditing] = useState(false);
 const canChangeRole = currentUserRole === 'admin';
 const permissions = user ? (ROLE_PERMISSIONS[user.role] || []) : [];
 const previewPermissions = formData.role ? (ROLE_PERMISSIONS[formData.role] || []) : [];

 useEffect(() => {
 if (user) {
 setFormData({ 
 name: user.name, 
 email: user.email, 
 role: user.role, 
 profilePicture: user.profilePicture || '',
 phoneNumber: user.phoneNumber || ''
 });
 }
 }, [user]);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 // Validate file type
 const validTypes = ['image/jpeg', 'image/jpg', 'image/svg+xml'];
 if (!validTypes.includes(file.type)) {
 showToast('Please upload only JPEG or SVG images', 'error');
 return;
 }
 
 const reader = new FileReader();
 reader.onloadend = () => {
 setFormData({...formData, profilePicture: reader.result as string});
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
 {isSelf ? 'My Profile' : 'User Profile'}
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
 <img src={formData.profilePicture} alt={user?.name || 'User'} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center bg-amber-primary/10">
 {user?.name?.[0] || '?'}
 </div>
 )}
 
 {isEditing && (
 <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ">
 <ImageIcon size={24} className="text-white mb-1" />
 <span className="text-[8px] text-white font-bold uppercase tracking-widest">Change</span>
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
 <div className={`w-3 h-3 rounded-full ${
 user?.lastActive && (new Date().getTime() - new Date(user.lastActive).getTime() < 300000)
 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
 : 'bg-text-dim'
 }`} />
 </div>
 </div>
 
 <div className="flex-1 text-center md:text-left space-y-3 w-full">
 <div>
 <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight break-words">{user?.name || 'Unknown User'}</h2>
 <p className="text-[10px] md:text-xs text-text-dim font-mono mt-1 break-all">{user?.email}</p>
 </div>
 <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
 <span className="px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-amber-primary/10 text-amber-primary border border-amber-primary/20">
 {user?.role === 'admin' ? 'Super Admin' : (user?.role?.replace('_', ' ') || 'Employee')}
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
 <h3 className="text-base md:text-lg font-bold text-text-primary tracking-tight">Edit Information</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
 <div className="space-y-2">
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Full Name</label>
 <input 
 value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})}
 onBlur={handleBlur}
 className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-primary transition-all"
 required
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Email Address</label>
 <input 
 type="email"
 value={formData.email}
 onChange={e => setFormData({...formData, email: e.target.value})}
 onBlur={handleBlur}
 className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-primary transition-all"
 required
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Phone Number</label>
 <input 
 type="tel"
 value={formData.phoneNumber}
 onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
 onBlur={handleBlur}
 placeholder="Enter phone number"
 className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-primary transition-all"
 required
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Profile Picture</label>
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-surface-2 border border-border-bright overflow-hidden flex-shrink-0">
 {formData.profilePicture ? (
 <img src={formData.profilePicture} alt="Preview" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-text-dim">
 <ImageIcon size={20} />
 </div>
 )}
 </div>
 <label className="flex-1">
 <div className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-xs text-text-secondary cursor-pointer hover:border-amber-primary transition-all flex items-center justify-between">
 <span>{formData.profilePicture ? 'Change Image' : 'Choose JPEG or SVG'}</span>
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
 <p className="text-[9px] text-text-dim italic">Supported formats: JPEG, JPG, SVG only.</p>
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
 <h3 className="text-base md:text-lg font-bold text-text-primary tracking-tight">Account Details</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
 <div className="space-y-1">
 <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Full Name</div>
 <div className="text-sm text-text-primary">{user.name}</div>
 </div>
 <div className="space-y-1">
 <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Email Address</div>
 <div className="text-sm text-text-primary">{user.email}</div>
 </div>
 <div className="space-y-1">
 <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Phone Number</div>
 <div className="text-sm text-text-primary">{user.phoneNumber || 'Not provided'}</div>
 </div>
 </div>
 
 {user.permissions && user.permissions.length > 0 && (
 <div className="space-y-4 pt-6 border-t border-border-dim">
 <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Permissions</div>
 <div className="flex flex-wrap gap-2">
 {user.permissions.map(p => (
 <span key={p} className="px-3 py-1.5 bg-surface-2 border border-border-bright rounded-full text-[10px] font-mono text-text-secondary">
 {p?.replace(/_/g, ' ')}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Recent Activity */}
 <div className="bg-surface border border-border-dim p-6 rounded-2xl shadow-sm space-y-6">
 <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest border-b border-border-dim pb-4">Recent Activity</h3>
 <div className="space-y-4 max-h-64 overflow-y-auto pr-2" aria-live="polite">
 <div className="text-sm text-text-dim italic">Activity log will appear here.</div>
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
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Role Assignment</label>
 <select 
 value={formData.role}
 onChange={e => setFormData({...formData, role: e.target.value as Role})}
 className="w-full bg-surface-2 border border-border-bright rounded-lg px-4 py-2.5 text-sm outline-none focus:border-amber-primary transition-all"
 >
 <option value="employee">Employee</option>
 <option value="team_leader">Team Leader</option>
 <option value="admin">Super Admin</option>
 </select>
 {isSelf && user?.role === 'admin' && (
 <p className="text-[9px] text-amber-500/70 italic mt-1">Note: Changing your own role may restrict your access.</p>
 )}
 </div>
 
 <div className="space-y-2">
 <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold flex justify-between">
 <span>Preview Permissions</span>
 <span className="text-amber-primary lowercase font-mono">({formData.role})</span>
 </div>
 <div className="flex flex-col gap-2">
 {PERMISSION_CATEGORIES.map(category => {
 const rolePerms = previewPermissions.filter(p => category.permissions.includes(p));
 if (rolePerms.length === 0) return null;
 return (
 <div key={category.name} className="space-y-1">
 <div className="text-[8px] text-amber-primary/70 uppercase tracking-widest font-bold">{category.name}</div>
 <div className="flex flex-wrap gap-1.5">
 {rolePerms.map(p => (
 <span key={p} className="bg-amber-primary/5 px-1.5 py-0.5 rounded border border-amber-primary/20 text-[8px] font-mono text-amber-primary tracking-tight">
 {p?.replace(/_/g, ' ')}
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
 <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Current Role</div>
 <div className="text-sm text-text-primary capitalize">{user.role}</div>
 </div>
 <div className="space-y-2">
 <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Permissions</div>
 <div className="flex flex-col gap-2">
 {PERMISSION_CATEGORIES.map(category => {
 const rolePerms = permissions.filter(p => category.permissions.includes(p));
 if (rolePerms.length === 0) return null;
 return (
 <div key={category.name} className="space-y-1">
 <div className="text-[8px] text-amber-primary/70 uppercase tracking-widest font-bold">{category.name}</div>
 <div className="flex flex-wrap gap-2">
 {rolePerms.map(p => (
 <span key={p} className="bg-surface-2 px-2 py-1 rounded border border-border-bright text-[9px] font-mono text-text-secondary tracking-tight">
 {p?.replace(/_/g, ' ')}
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
 <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Internal ID</div>
 <div className="text-xs font-mono text-text-primary bg-surface-2 px-3 py-1.5 rounded border border-border-bright inline-block">{user.id}</div>
 </div>
 <div className="space-y-1">
 <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Username</div>
 <div className="text-xs font-mono text-amber-primary bg-surface-2 px-3 py-1.5 rounded border border-border-bright inline-block">{user.username}</div>
 </div>
 <div className="space-y-1">
 <div className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Last Active</div>
 <div className="text-xs text-text-primary">
 {user.lastActive && (new Date().getTime() - new Date(user.lastActive).getTime() < 300000)
 ? <span className="text-green-500 font-medium">Active Now</span>
 : user.lastActive 
 ? new Date(user.lastActive).toLocaleString()
 : 'Never active'
 }
 </div>
 </div>
 </div>
 </div>

 <div className="p-5 bg-amber-primary/5 rounded-xl border border-amber-primary/10">
 <div className="flex items-center gap-2 text-amber-primary mb-2">
 <AlertCircle size={14} />
 <span className="text-[10px] font-bold uppercase tracking-widest">Compliance Note</span>
 </div>
 <p className="text-[10px] text-text-dim leading-relaxed">
 All profile modifications are logged in the system audit trail. Ensure changes comply with the organizational data privacy policy.
 </p>
 </div>
 </aside>
 </div>
 </motion.div>
 );
};

const LogsView = ({ logs, user, isLive: initialLive = true, onExport }: { logs: any[], user?: any, isLive?: boolean, onExport?: (logs: any[]) => void }) => {
 const [filter, setFilter] = useState('ALL');
 const [specificAction, setSpecificAction] = useState('ALL');
 const [userSearch, setUserSearch] = useState('');
 const [keywordSearch, setKeywordSearch] = useState('');
 const [dateFrom, setDateFrom] = useState('');
 const [dateTo, setDateTo] = useState('');
 const [showFilters, setShowFilters] = useState(false);
 const [sortBy, setSortBy] = useState('timestamp');
 const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
 const [selectedLog, setSelectedLog] = useState<any>(null);
 const [isLive, setIsLive] = useState(initialLive);

 const actionCategories = [
 { label: 'All Activities', value: 'ALL' },
 { label: 'Logins & Signups', value: 'AUTH', actions: ['LOGIN', 'SIGNUP', 'LOGIN_FAILED', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS'] },
 { label: 'Project Entries', value: 'PROJECTS', actions: ['ADD_PROJECT', 'EDIT_PROJECT', 'DELETE', 'DELETE_REQ', 'APPROVE', 'REJECT', 'AUTO_UPDATE'] },
 { label: 'Resale Entries', value: 'RESALE', actions: ['ADD_RESALE', 'EDIT_RESALE', 'DELETE_RESALE'] },
 { label: 'User Management', value: 'USERS', actions: ['DELETE_USER', 'PERMISSIONS_UPDATED', 'TEAM_ASSIGNMENT'] },
 ];

 const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort();

 const filteredLogs = logs.filter(log => {
 const matchesCategory = filter === 'ALL' || 
 actionCategories.find(c => c.value === filter)?.actions?.includes(log.action);
 const matchesSpecificAction = specificAction === 'ALL' || log.action === specificAction;
 
 const matchesUser = !userSearch || log.user.toLowerCase().includes(userSearch.toLowerCase());
 const matchesKeyword = !keywordSearch || 
 (log.summary && log.summary.toLowerCase().includes(keywordSearch.toLowerCase())) || 
 (log.action && log.action.toLowerCase().includes(keywordSearch.toLowerCase()));
 
 const logDate = new Date(log.timestamp);
 const matchesDateFrom = !dateFrom || logDate >= new Date(dateFrom);
 const matchesDateTo = !dateTo || logDate <= new Date(dateTo);

 return matchesCategory && matchesSpecificAction && matchesUser && matchesKeyword && matchesDateFrom && matchesDateTo;
 });

 const sortedLogs = [...filteredLogs].sort((a, b) => {
 const valA = a[sortBy as keyof typeof a];
 const valB = b[sortBy as keyof typeof b];
 if (sortOrder === 'asc') return valA > valB ? 1 : -1;
 return valA < valB ? 1 : -1;
 });

 const handleExport = () => {
 if (onExport) {
 onExport(sortedLogs);
 return;
 }
 const headers = ['Timestamp', 'User', 'Action', 'Summary'];
 const csvContent = [
 headers.join(','),
 ...sortedLogs.map(log => [
 new Date(log.timestamp).toLocaleString(),
 `"${log.user}"`,
 `"${log.action}"`,
 `"${log.summary.replace(/"/g, '""')}"`
 ].join(','))
 ].join('\n');

 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
 const link = document.createElement('a');
 const url = URL.createObjectURL(blob);
 link.setAttribute('href', url);
 link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
 link.style.visibility = 'hidden';
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 const toggleSort = (field: string) => {
 if (sortBy === field) {
 setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
 } else {
 setSortBy(field);
 setSortOrder('desc');
 }
 };

 const activeFiltersCount = [
 filter !== 'ALL',
 specificAction !== 'ALL',
 !!userSearch,
 !!keywordSearch,
 !!dateFrom,
 !!dateTo
 ].filter(Boolean).length;

 return (
 <div className="space-y-6 w-full max-w-none">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="flex flex-col">
 <h1 className="text-2xl font-serif font-bold text-text-primary">Audit Logs</h1>
 <div className="flex items-center gap-2 mt-1">
 <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-text-dim'}`} />
 <span className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Live Monitoring Active</span>
 </div>
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
 ? 'bg-amber-primary border-amber-primary text-bg shadow-lg shadow-amber-primary/20' 
 : 'bg-surface-2 border-border-dim text-text-secondary hover:border-amber-primary/50'
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
 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">Filter Options</h4>
 {(filter !== 'ALL' || userSearch || dateFrom || dateTo || specificAction !== 'ALL' || keywordSearch) && (
 <button 
 onClick={() => {
 setFilter('ALL');
 setSpecificAction('ALL');
 setUserSearch('');
 setKeywordSearch('');
 setDateFrom('');
 setDateTo('');
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
 <label className="text-[9px] text-text-dim uppercase tracking-wider font-black">Action Category</label>
 <select 
 value={filter}
 onChange={(e) => setFilter(e.target.value)}
 className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-2.5 text-xs text-text-primary outline-none focus:border-amber-primary transition-colors"
 >
 {actionCategories.map(cat => (
 <option key={cat.value} value={cat.value}>{cat.label}</option>
 ))}
 </select>
 </div>

 <div className="space-y-2">
 <label className="text-[9px] text-text-dim uppercase tracking-wider font-black">Specific Action (CRUD)</label>
 <select 
 value={specificAction}
 onChange={(e) => setSpecificAction(e.target.value)}
 className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-2.5 text-xs text-text-primary outline-none focus:border-amber-primary transition-colors"
 >
 <option value="ALL">All Actions</option>
 {uniqueActions.map(action => (
 <option key={action} value={action}>{action}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[9px] text-text-dim uppercase tracking-wider font-black">Search Summary Keyword</label>
 <div className="relative">
 <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
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
 <label className="text-[9px] text-text-dim uppercase tracking-wider font-black">Search User</label>
 <div className="relative">
 <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
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
 <label className="text-[9px] text-text-dim uppercase tracking-wider font-black">Date & Time Range</label>
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
 <table className="w-full text-left text-xs">
 <thead className="bg-surface-2 border-b border-border-dim">
 <tr>
 <th 
 className="px-6 py-4 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors"
 onClick={() => toggleSort('timestamp')}
 >
 <div className="flex items-center gap-2">
 Timestamp
 {sortBy === 'timestamp' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
 </div>
 </th>
 <th 
 className="px-6 py-4 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors"
 onClick={() => toggleSort('user')}
 >
 <div className="flex items-center gap-2">
 User
 {sortBy === 'user' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
 </div>
 </th>
 <th 
 className="px-6 py-4 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors"
 onClick={() => toggleSort('action')}
 >
 <div className="flex items-center gap-2">
 Action
 {sortBy === 'action' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
 </div>
 </th>
 <th 
 className="px-6 py-4 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors"
 onClick={() => toggleSort('summary')}
 >
 <div className="flex items-center gap-2">
 Summary
 {sortBy === 'summary' && <span className="text-amber-primary">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
 </div>
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border-dim">
 {sortedLogs.map(log => (
 <tr 
 key={log.id} 
 className="hover:bg-surface-2 transition-colors cursor-pointer"
 onClick={() => setSelectedLog(log)}
 >
 <td className="px-6 py-4 text-text-secondary font-mono whitespace-nowrap">
 <div className="flex flex-col">
 <span>{new Date(log.timestamp).toLocaleDateString()}</span>
 <span className="text-[10px] text-text-dim">{new Date(log.timestamp).toLocaleTimeString()}</span>
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
 <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
 log.action?.includes('DELETE') || log.action?.includes('REJECT') || log.action?.includes('FAILED') ? 'bg-red-500/10 text-red-500' :
 log.action?.includes('ADD') || log.action?.includes('APPROVE') || log.action?.includes('SIGNUP') ? 'bg-green-500/10 text-green-500' :
 log.action?.includes('EDIT') || log.action?.includes('UPDATE') ? 'bg-blue-500/10 text-blue-500' :
 'bg-amber-500/10 text-amber-500'
 }`}>
 {log.action?.replace(/_/g, ' ')}
 </span>
 </td>
 <td className="px-6 py-4 text-text-secondary min-w-[200px] whitespace-normal" title={log.summary}>
 <div className="line-clamp-1">{log.summary}</div>
 </td>
 </tr>
 ))}
 {sortedLogs.length === 0 && (
 <tr>
 <td colSpan={4} className="px-6 py-12 text-center text-text-dim italic">
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
 <h3 className="text-lg font-bold text-text-primary">Log Details</h3>
 <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">ID: {selectedLog.id}</p>
 </div>
 </div>
 <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-surface rounded-full transition-colors text-text-dim hover:text-text-primary">
 <X size={20} />
 </button>
 </div>
 
 <div className="p-6 space-y-6">
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-1">
 <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">Timestamp</p>
 <p className="text-sm font-mono text-text-primary">{new Date(selectedLog.timestamp).toLocaleString()}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">User</p>
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-amber-primary/10 flex items-center justify-center text-[10px] font-bold text-amber-primary">
 {selectedLog.user.charAt(0).toUpperCase()}
 </div>
 <p className="text-sm font-bold text-text-primary">{selectedLog.user}</p>
 </div>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">Action</p>
 <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
 selectedLog.action?.includes('DELETE') || selectedLog.action?.includes('REJECT') || selectedLog.action?.includes('FAILED') ? 'bg-red-500/10 text-red-500' :
 selectedLog.action?.includes('ADD') || selectedLog.action?.includes('APPROVE') || selectedLog.action?.includes('SIGNUP') ? 'bg-green-500/10 text-green-500' :
 selectedLog.action?.includes('EDIT') || selectedLog.action?.includes('UPDATE') ? 'bg-blue-500/10 text-blue-500' :
 'bg-amber-500/10 text-amber-500'
 }`}>
 {selectedLog.action?.replace(/_/g, ' ')}
 </span>
 </div>
 </div>

 <div className="space-y-2">
 <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">Summary</p>
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

const ReportsView = ({ reports, users, onUpdate, onCreate, onDelete, user, selectedReport, setSelectedReport, isEditing, setIsEditing }: any) => {
 const [searchQuery, setSearchQuery] = useState('');
 const [statusFilter, setStatusFilter] = useState('All');
 const [assigneeFilter, setAssigneeFilter] = useState('All');
 const [dateFrom, setDateFrom] = useState('');
 const [dateTo, setDateTo] = useState('');
 const [dateType, setDateType] = useState<'createdAt' | 'updatedAt'>('updatedAt');
 const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
 const [sortBy, setSortBy] = useState('updatedAt');
 const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
 const [reportToDelete, setReportToDelete] = useState<any>(null);

 const filteredReports = reports.filter((r: Report) => {
 const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
 r.content.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
 const matchesAssignee = assigneeFilter === 'All' || r.assignedTo === assigneeFilter;
 
 const reportDate = new Date(r[dateType]);
 const matchesDateFrom = !dateFrom || reportDate >= new Date(dateFrom);
 const matchesDateTo = !dateTo || reportDate <= new Date(dateTo + 'T23:59:59');

 return matchesSearch && matchesStatus && matchesAssignee && matchesDateFrom && matchesDateTo;
 }).sort((a: any, b: any) => {
 const valA = a[sortBy];
 const valB = b[sortBy];
 if (sortOrder === 'asc') return valA > valB ? 1 : -1;
 return valA < valB ? 1 : -1;
 });

 const handleCreate = () => {
 const newReport = {
 title: 'New Report',
 content: '',
 assignedTo: user?.name || 'Unassigned',
 status: 'Draft'
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
 <h2 className="text-lg font-bold text-text-primary tracking-tight">Reports Management</h2>
 <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Create and manage internal reports</p>
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
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
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
 ? 'bg-amber-primary border-amber-primary text-bg shadow-lg shadow-amber-primary/20' 
 : 'bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50'
 }`}
 >
 <Filter size={14} />
 {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
 </button>
 </div>

 <AnimatePresence>
 {showAdvancedFilters && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="overflow-hidden"
 >
 <div className="p-4 bg-surface-2/50 border border-border-dim rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="space-y-1.5">
 <label className="text-[9px] text-text-dim uppercase font-black tracking-widest">Status</label>
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
 <label className="text-[9px] text-text-dim uppercase font-black tracking-widest">Assignee</label>
 <select 
 value={assigneeFilter}
 onChange={(e) => setAssigneeFilter(e.target.value)}
 className="w-full bg-surface border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary"
 >
 <option value="All">All Assignees</option>
 {Array.from(new Set(reports.map((r: Report) => r.assignedTo))).map((name: any) => (
 <option key={name} value={name}>{name}</option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="text-[9px] text-text-dim uppercase font-black tracking-widest">Date Type</label>
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
 <label className="text-[9px] text-text-dim uppercase font-black tracking-widest">Date Range</label>
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
 setStatusFilter('All');
 setAssigneeFilter('All');
 setDateFrom('');
 setDateTo('');
 setSearchQuery('');
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
 <table className="w-full text-left text-xs">
 <thead className="bg-surface-2 border-b border-border-dim">
 <tr>
 <th className="px-4 py-3 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap">Title</th>
 <th className="px-4 py-3 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap">Assigned To</th>
 <th className="px-4 py-3 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap">Status</th>
 <th className="px-4 py-3 font-bold text-text-dim uppercase tracking-widest whitespace-nowrap">Updated</th>
 <th className="px-4 py-3 whitespace-nowrap"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border-dim">
 {filteredReports.map((report: Report) => (
 <tr 
 key={report.id} 
 onClick={() => { setSelectedReport(report); setIsEditing(false); }}
 className={`hover:bg-surface-2 transition-colors cursor-pointer ${selectedReport?.id === report.id ? 'bg-amber-primary/5' : ''}`}
 >
 <td className="px-4 py-3 font-medium text-text-primary whitespace-normal min-w-[150px]">{report.title}</td>
 <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{report.assignedTo}</td>
 <td className="px-4 py-3 whitespace-nowrap">
 <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider ${
 report.status === 'Final' ? 'bg-green-500/10 text-green-500' :
 report.status === 'Draft' ? 'bg-blue-500/10 text-blue-500' :
 'bg-text-dim/10 text-text-dim'
 }`}>
 {report.status}
 </span>
 </td>
 <td className="px-4 py-3 text-text-dim font-mono text-[10px] whitespace-nowrap">
 {new Date(report.updatedAt).toLocaleDateString()}
 </td>
 <td className="px-4 py-3 text-right whitespace-nowrap">
 {(user?.role === 'admin' || user?.role === 'team_leader') && (
 <button 
 onClick={(e) => { e.stopPropagation(); setReportToDelete(report); }}
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
 <td colSpan={5} className="px-4 py-12 text-center text-text-dim italic">No reports found.</td>
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
 key={selectedReport.id + (isEditing ? '-edit' : '-view')}
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
 <h3 className="text-lg font-bold text-text-primary">{selectedReport.title}</h3>
 <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Report Details</p>
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
 <p className="text-[9px] text-text-dim uppercase font-bold">Assigned To</p>
 <p className="text-xs text-text-primary font-medium">{selectedReport.assignedTo}</p>
 </div>
 <div>
 <p className="text-[9px] text-text-dim uppercase font-bold">Status</p>
 <p className="text-xs text-text-primary font-medium">{selectedReport.status}</p>
 </div>
 <div>
 <p className="text-[9px] text-text-dim uppercase font-bold">Created At</p>
 <p className="text-xs text-text-dim font-mono">{new Date(selectedReport.createdAt).toLocaleString()}</p>
 </div>
 <div>
 <p className="text-[9px] text-text-dim uppercase font-bold">Last Updated</p>
 <p className="text-xs text-text-dim font-mono">{new Date(selectedReport.updatedAt).toLocaleString()}</p>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto no-scrollbar">
 <p className="text-[9px] text-text-dim uppercase font-bold mb-2">Content</p>
 <div className="text-xs text-text-secondary leading-relaxed prose prose-invert prose-sm max-w-none">
 {selectedReport.content ? (
 <Markdown>{selectedReport.content}</Markdown>
 ) : (
 'No content provided.'
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
 <p className="text-sm font-bold text-text-primary">No Report Selected</p>
 <p className="text-xs text-text-dim">Select a report from the list to view or edit details.</p>
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
 <h3 className="text-lg font-bold text-text-primary mb-2">Delete Report?</h3>
 <p className="text-xs text-text-secondary leading-relaxed mb-6">
 Are you sure you want to delete <span className="text-text-primary font-bold">"{reportToDelete.title}"</span>? 
 This action cannot be undone.
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
 status: report.status
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
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Title</label>
 <input 
 type="text"
 value={formData.title}
 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
 className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Assigned To</label>
 <select 
 value={formData.assignedTo}
 onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
 className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary"
 >
 <option value="Unassigned">Unassigned</option>
 {users.map((u: any) => (
 <option key={u.id} value={u.name}>{u.name}</option>
 ))}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Status</label>
 <select 
 value={formData.status}
 onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
 className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary"
 >
 <option value="Draft">Draft</option>
 <option value="Final">Final</option>
 <option value="Archived">Archived</option>
 </select>
 </div>
 </div>

 <div className="space-y-1.5 flex-1 flex flex-col min-h-[400px]">
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Content</label>
 <div className="flex-1 bg-surface-2 border border-border-bright rounded-lg overflow-hidden editor-container">
 <SimpleMDE 
 value={formData.content}
 onChange={(value) => setFormData({ ...formData, content: value })}
 options={{
 spellChecker: false,
 placeholder: "Write report content here...",
 status: false,
 toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview", "guide"]
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
 playSound
}: any) => {
 const [activeTab, setActiveTab] = useState('account');

 if (!isOpen) return null;

 const languages = ['English', 'Spanish', 'Hindi', 'French', 'German'];
 
 const translations: Record<string, Record<string, string>> = {
 English: { 
 settings: 'Settings', 
 preferences: 'Preferences', 
 appearance: 'Appearance', 
 language: 'Language', 
 accent: 'Accent Color',
 theme: 'Theme',
 font: 'Font Style',
 fontSize: 'Font Size',
 motion: 'Reduced Motion'
 },
 Spanish: { 
 settings: 'Ajustes', 
 preferences: 'Preferencias', 
 appearance: 'Apariencia', 
 language: 'Idioma', 
 accent: 'Color de Acento',
 theme: 'Tema',
 font: 'Estilo de Fuente',
 fontSize: 'Tamaño de Fuente',
 motion: 'Movimiento Reducido'
 },
 Hindi: { 
 settings: 'सेटिग्स', 
 preferences: 'वरीयताएँ', 
 appearance: 'दिखावट', 
 language: 'भाषा', 
 accent: 'एक्सेन्ट रंग',
 theme: 'थीम',
 font: 'फ़ॉन्ट शैली',
 fontSize: 'फ़ॉन्ट आकार',
 motion: 'कम गति'
 }
 };

 const t = (key: string) => {
 return translations[language]?.[key] || translations['English'][key] || key;
 };

 const colors = [
 { id: 'amber', class: 'bg-amber-primary' },
 { id: 'blue', class: 'bg-blue-500' },
 { id: 'green', class: 'bg-emerald-500' },
 { id: 'purple', class: 'bg-purple-500' },
 { id: 'red', class: 'bg-rose-500' }
 ];

 const handleToggle = (setter: any, value: boolean) => {
 setter(!value);
 playSound('click');
 };

 const tabs = [
 { id: 'account', label: 'Account', icon: User },
 { id: 'preferences', label: 'Preferences', icon: Settings },
 { id: 'appearance', label: 'Appearance', icon: Palette },
 { id: 'help', label: 'Help', icon: HelpCircle },
 { id: 'system', label: 'System & About', icon: Info }
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
 <h2 className="text-lg font-bold text-text-primary">{t('settings')}</h2>
 </div>
 <button onClick={onClose} className="md:hidden text-text-dim hover:text-text-primary transition-colors">
 <X size={20} />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-1 flex flex-row md:flex-col gap-2 md:gap-0 overflow-x-auto custom-scrollbar">
 {tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => { setActiveTab(tab.id); playSound('click'); }}
 className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
 activeTab === tab.id 
 ? 'bg-amber-primary/10 text-amber-primary' 
 : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
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
 <button onClick={onClose} className="p-2 bg-surface-2 border border-border-dim rounded-lg text-text-dim hover:text-text-primary hover:border-border-bright transition-all">
 <X size={18} />
 </button>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
 <div className="max-w-2xl mx-auto space-y-8">
 {activeTab === 'account' && (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
 <div>
 <h3 className="text-xl font-bold text-text-primary mb-1">Account Profile</h3>
 <p className="text-sm text-text-dim">Manage your personal information and role.</p>
 </div>
 
 <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-surface-2 rounded-2xl border border-border-bright">
 <div className="w-24 h-24 rounded-full bg-amber-primary/20 flex items-center justify-center text-4xl text-amber-primary font-bold overflow-hidden border-2 border-amber-primary/30 shadow-lg shrink-0">
 {user?.profilePicture ? (
 <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
 ) : (
 user?.name?.charAt(0) || 'U'
 )}
 </div>
 <div className="flex-1 text-center sm:text-left">
 <h4 className="text-xl font-bold text-text-primary">{user?.name}</h4>
 <p className="text-sm text-text-secondary mb-3">{user?.email}</p>
 <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20 bg-amber-500/5 text-amber-500">
 {user?.role === 'admin' ? 'Super Admin' : user?.role?.replace('_', ' ')}
 </span>
 </div>
 <button 
 onClick={() => { onProfileClick(); onClose(); playSound('click'); }}
 className="w-full sm:w-auto px-5 py-2.5 bg-amber-primary text-bg rounded-xl text-sm font-bold hover:bg-amber-secondary transition-all shadow-lg shadow-amber-primary/20"
 >
 Edit Profile
 </button>
 </div>
 </motion.div>
 )}

 {activeTab === 'help' && (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
 <div>
 <h3 className="text-xl font-bold text-text-primary mb-1">Help & Support</h3>
 <p className="text-sm text-text-dim">Get assistance or find answers to common questions.</p>
 </div>

 <div className="space-y-4">
 <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim">
 <h4 className="text-sm font-bold text-text-primary mb-3">Frequently Asked Questions</h4>
 <div className="space-y-3">
 <div className="p-4 bg-surface-3 rounded-xl">
 <p className="text-sm font-bold text-text-primary">How do I add a project?</p>
 <p className="text-xs text-text-dim mt-1">Navigate to the Projects tab and click the "Add Project" button.</p>
 </div>
 <div className="p-4 bg-surface-3 rounded-xl">
 <p className="text-sm font-bold text-text-primary">How do I update my profile?</p>
 <p className="text-xs text-text-dim mt-1">Go to Settings &gt; Account and click "Edit Profile".</p>
 </div>
 </div>
 </div>

 <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim">
 <h4 className="text-sm font-bold text-text-primary mb-3">Contact Support</h4>
 <p className="text-xs text-text-dim mb-4">Need further assistance? Reach out to our support team.</p>
 <a href="mailto:support@example.com" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-primary text-bg rounded-xl text-xs font-bold hover:bg-amber-secondary transition-all">
 <Mail size={14} />
 Email Support
 </a>
 </div>
 </div>
 </motion.div>
 )}

 {activeTab === 'preferences' && (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
 <div>
 <h3 className="text-xl font-bold text-text-primary mb-1">App Preferences</h3>
 <p className="text-sm text-text-dim">Customize how the application behaves.</p>
 </div>

 <div className="space-y-4">
 <div className="flex items-center justify-between p-4 sm:p-5 bg-surface-2 rounded-2xl border border-border-dim hover:border-border-bright transition-colors">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-surface-3 rounded-xl text-text-secondary">
 <Bell size={20} />
 </div>
 <div>
 <p className="text-sm font-bold text-text-primary">Notifications</p>
 <p className="text-xs text-text-dim">Receive real-time alerts and updates</p>
 </div>
 </div>
 <button 
 onClick={() => handleToggle(setNotificationsEnabled, notificationsEnabled)}
 className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-amber-primary' : 'bg-surface-3 border border-border-dim'}`}
 >
 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
 </button>
 </div>

 <div className="flex items-center justify-between p-4 sm:p-5 bg-surface-2 rounded-2xl border border-border-dim hover:border-border-bright transition-colors">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-surface-3 rounded-xl text-text-secondary">
 <Layers size={20} />
 </div>
 <div>
 <p className="text-sm font-bold text-text-primary">Compact Mode</p>
 <p className="text-xs text-text-dim">Reduce spacing in tables and lists</p>
 </div>
 </div>
 <button 
 onClick={() => handleToggle(setCompactMode, compactMode)}
 className={`w-12 h-6 rounded-full transition-colors relative ${compactMode ? 'bg-amber-primary' : 'bg-surface-3 border border-border-dim'}`}
 >
 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${compactMode ? 'left-7' : 'left-1'}`} />
 </button>
 </div>

 <div className="flex items-center justify-between p-4 sm:p-5 bg-surface-2 rounded-2xl border border-border-dim hover:border-border-bright transition-colors">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-surface-3 rounded-xl text-text-secondary">
 <Save size={20} />
 </div>
 <div>
 <p className="text-sm font-bold text-text-primary">Auto-save Changes</p>
 <p className="text-xs text-text-dim">Save edits automatically without prompting</p>
 </div>
 </div>
 <button 
 onClick={() => handleToggle(setAutoSave, autoSave)}
 className={`w-12 h-6 rounded-full transition-colors relative ${autoSave ? 'bg-amber-primary' : 'bg-surface-3 border border-border-dim'}`}
 >
 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${autoSave ? 'left-7' : 'left-1'}`} />
 </button>
 </div>

 <div className="flex items-center justify-between p-4 sm:p-5 bg-surface-2 rounded-2xl border border-border-dim hover:border-border-bright transition-colors">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-surface-3 rounded-xl text-text-secondary">
 <Volume2 size={20} />
 </div>
 <div>
 <p className="text-sm font-bold text-text-primary">Sound Effects</p>
 <p className="text-xs text-text-dim">Play sounds on clicks and interactions</p>
 </div>
 </div>
 <button 
 onClick={() => handleToggle(setSoundEffects, soundEffects)}
 className={`w-12 h-6 rounded-full transition-colors relative ${soundEffects ? 'bg-amber-primary' : 'bg-surface-3 border border-border-dim'}`}
 >
 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${soundEffects ? 'left-7' : 'left-1'}`} />
 </button>
 </div>
 </div>
 </motion.div>
 )}

 {activeTab === 'appearance' && (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
 <div>
 <h3 className="text-xl font-bold text-text-primary mb-1">Appearance</h3>
 <p className="text-sm text-text-dim">Customize the look and feel of the app.</p>
 </div>

 <div className="space-y-6">
 <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim space-y-4">
 <div className="flex items-center gap-3 mb-2">
 <Globe size={18} className="text-text-secondary" />
 <h4 className="text-sm font-bold text-text-primary">{t('language')}</h4>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {languages.map(lang => (
 <button
 key={lang}
 onClick={() => { setLanguage(lang); playSound('click'); }}
 className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
 language === lang 
 ? 'bg-amber-primary/10 border-amber-primary text-amber-primary shadow-sm shadow-amber-primary/10' 
 : 'bg-surface border-border-dim text-text-secondary hover:border-border-bright hover:text-text-primary'
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
 <h4 className="text-sm font-bold text-text-primary">{t('accent')}</h4>
 </div>
 <div className="flex flex-wrap gap-4">
 {colors.map(color => (
 <button
 key={color.id}
 onClick={() => { setAccentColor(color.id); playSound('click'); }}
 className={`w-10 h-10 rounded-full transition-all ring-offset-4 ring-offset-surface-2 ${color.class} ${
 accentColor === color.id ? 'ring-2 ring-amber-primary scale-110 shadow-lg' : 'opacity-70 hover:opacity-100 hover:scale-105'
 }`}
 />
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="p-5 bg-surface-2 rounded-2xl border border-border-dim space-y-4">
 <div className="flex items-center gap-3 mb-2">
 <Moon size={18} className="text-text-secondary" />
 <h4 className="text-sm font-bold text-text-primary">{t('theme')}</h4>
 </div>
 <div className="flex gap-3">
 {['dark', 'light'].map(tOption => (
 <button
 key={tOption}
 onClick={() => { setTheme(tOption); playSound('click'); }}
 className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all border capitalize ${
 theme === tOption 
 ? 'bg-amber-primary/10 border-amber-primary text-amber-primary shadow-sm' 
 : 'bg-surface border-border-dim text-text-secondary hover:border-border-bright'
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
 <h4 className="text-sm font-bold text-text-primary">{t('font')}</h4>
 </div>
 <div className="flex gap-3">
 {['mono', 'sans'].map(f => (
 <button
 key={f}
 onClick={() => { setFontFamily(f); playSound('click'); }}
 className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all border capitalize ${
 fontFamily === f 
 ? 'bg-amber-primary/10 border-amber-primary text-amber-primary shadow-sm' 
 : 'bg-surface border-border-dim text-text-secondary hover:border-border-bright'
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
 <h4 className="text-sm font-bold text-text-primary">{t('fontSize')}</h4>
 </div>
 <div className="flex gap-2 bg-surface p-1 rounded-xl border border-border-dim">
 {['small', 'medium', 'large'].map(s => (
 <button
 key={s}
 onClick={() => { setFontSize(s); playSound('click'); }}
 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
 fontSize === s 
 ? 'bg-surface-3 text-text-primary shadow-sm' 
 : 'text-text-dim hover:text-text-secondary'
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
 <p className="text-sm font-bold text-text-primary">{t('motion')}</p>
 <p className="text-xs text-text-dim">Disable animations for better performance</p>
 </div>
 </div>
 <button 
 onClick={() => handleToggle(setReducedMotion, reducedMotion)}
 className={`w-12 h-6 rounded-full transition-colors relative ${reducedMotion ? 'bg-amber-primary' : 'bg-surface-3 border border-border-dim'}`}
 >
 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${reducedMotion ? 'left-7' : 'left-1'}`} />
 </button>
 </div>
 </div>
 </motion.div>
 )}

 {activeTab === 'system' && (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
 <div>
 <h3 className="text-xl font-bold text-text-primary mb-1">System & About</h3>
 <p className="text-sm text-text-dim">Application information and system controls.</p>
 </div>

 <div className="p-6 bg-surface-2 rounded-2xl border border-border-dim space-y-6">
 <div className="flex items-center gap-4 pb-6 border-b border-border-dim">
 <div className="w-16 h-16 bg-amber-primary/20 rounded-2xl border border-amber-primary/30 flex items-center justify-center">
 <Building2 size={32} className="text-amber-primary" />
 </div>
 <div>
 <h4 className="text-xl font-black text-text-primary tracking-tight">PySync</h4>
 <p className="text-sm text-text-secondary">Real Estate Data Platform</p>
 </div>
 </div>

 <div className="space-y-4">
 <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-dim">
 <span className="text-sm text-text-secondary">App Version</span>
 <span className="text-sm text-text-primary font-mono font-bold bg-surface-3 px-2 py-1 rounded-md">v2.4.0-stable</span>
 </div>
 <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-dim">
 <span className="text-sm text-text-secondary">Build Date</span>
 <span className="text-sm text-text-primary font-mono font-bold bg-surface-3 px-2 py-1 rounded-md">April 2026</span>
 </div>
 <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-dim">
 <span className="text-sm text-text-secondary">Environment</span>
 <span className="text-sm text-green-500 font-mono font-bold bg-green-500/10 px-2 py-1 rounded-md">Production</span>
 </div>
 </div>

 <div className="pt-4">
 <p className="text-sm text-text-dim leading-relaxed">
 PySync is a comprehensive real estate data platform designed for modern teams. 
 Built with precision and performance in mind to streamline your workflow.
 </p>
 </div>
 </div>

 <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/20 space-y-4">
 <div className="flex items-center gap-3">
 <AlertTriangle size={20} className="text-red-500" />
 <h4 className="text-sm font-bold text-red-500">Danger Zone</h4>
 </div>
 <p className="text-xs text-text-dim">
 Resetting to defaults will clear all your local preferences and reload the application.
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
const DatabaseExplorer = ({ showToast, request }: { showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, request: (url: string, options?: RequestInit) => Promise<any> }) => {
 const [tables, setTables] = useState<string[]>([]);
 const [selectedTable, setSelectedTable] = useState<string | null>(null);
 const [tableData, setTableData] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchTables();
 }, []);

 const fetchTables = async () => {
 try {
 const res = await request('/api/database/tables');
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
 return <div className="flex-1 flex justify-center items-center h-full"><Loader2 className="animate-spin text-amber-primary" size={32} /></div>;
 }

 return (
 <div className="flex flex-col h-full bg-surface p-4 md:p-6 w-full">
 <div className="flex items-center gap-3 mb-6 shrink-0">
 <div className="p-3 rounded-xl bg-amber-primary/10">
 <DatabaseIcon className="text-amber-primary" size={24} />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-text-primary capitalize tracking-wider">Database Explorer</h1>
 <p className="text-xs text-text-dim">System Data Explorer</p>
 </div>
 </div>

 <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
 {/* Tables Sidebar */}
 <div className="w-full md:w-64 max-h-48 md:max-h-none bg-surface-2 rounded-xl border border-border-dim shadow-sm flex flex-col overflow-hidden shrink-0">
 <div className="p-4 border-b border-border-dim bg-surface">
 <h2 className="text-xs font-bold text-text-primary uppercase tracking-widest">Collections</h2>
 </div>
 <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
 {tables.map(table => (
 <button
 key={table}
 onClick={() => fetchTableData(table)}
 className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 flex items-center justify-between ${
 selectedTable === table ? 'bg-amber-primary/10 text-amber-primary' : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
 }`}
 >
 <span className="truncate capitalize">{table}</span>
 <DatabaseIcon size={14} className={selectedTable === table ? 'text-amber-primary' : 'opacity-30'} />
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
 <span className="uppercase tracking-widest text-text-dim text-[10px]">Table:</span> 
 <span className="text-amber-primary capitalize">{selectedTable}</span>
 </h2>
 <span className="text-xs font-mono text-amber-primary bg-amber-primary/10 px-2 py-1 rounded border border-amber-primary/20">{tableData.length} records</span>
 </div>
 
 <div className="flex-1 overflow-auto bg-surface relative custom-scrollbar">
 {loading ? (
 <div className="absolute inset-0 flex justify-center items-center bg-surface/50 z-20">
 <Loader2 className="animate-spin text-amber-primary" size={32} />
 </div>
 ) : tableData.length === 0 ? (
 <div className="flex justify-center items-center h-full text-text-dim italic text-sm">No data found in this table.</div>
 ) : (
 <div className="min-w-max p-4">
 <table className="w-full text-left border-collapse bg-surface-2 rounded-xl overflow-hidden border border-border-dim shadow-sm">
 <thead className="bg-surface border-b border-border-dim">
 <tr>
 {Object.keys(tableData[0] || {}).map(key => (
 <th key={key} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-primary border-r border-border-dim last:border-r-0 whitespace-nowrap">
 {key}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {tableData.map((row, i) => (
 <tr key={row.id || i} className="border-b border-border-dim last:border-b-0 hover:bg-surface-3 transition-colors">
 {Object.keys(tableData[0] || {}).map(key => {
 const val = row[key];
 let displayVal = val;
 if (typeof val === 'object' && val !== null) {
 displayVal = Array.isArray(val) ? `[Array(${val.length})]` : '{Object}';
 }
 if (typeof displayVal === 'string' && displayVal.length > 40 && !displayVal.startsWith('data:image')) {
 displayVal = displayVal.substring(0, 40) + '...';
 } else if (typeof displayVal === 'string' && displayVal.startsWith('data:image')) {
 displayVal = '[Base64 Image Data]';
 }
 
 return (
 <td key={key} title={typeof val === 'string' ? val : JSON.stringify(val)} className="px-4 py-3 text-xs text-text-dim font-mono max-w-[200px] truncate border-r border-border-dim/50 last:border-r-0">
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
 <h3 className="text-lg font-bold text-text-primary mb-2">No Table Selected</h3>
 <p className="text-sm">Select a table from the sidebar to view its raw contents.</p>
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
 return !!localStorage.getItem('token') && !!localStorage.getItem('user');
 });
 const [user, setUser] = useState<User | null>(() => {
 try {
 const stored = localStorage.getItem('user');
 return stored ? JSON.parse(stored) : null;
 } catch {
 return null;
 }
 });
 const [activeTab, setActiveTab] = useState(() => {
 const savedUser = localStorage.getItem('user');
 if (savedUser) {
 try {
 const u = JSON.parse(savedUser);
 if (u.role === 'admin') return 'dashboard';
 } catch {}
 }
 return 'dashboard';
 });
 const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const [teamFilter, setTeamFilter] = useState<string | null>(null);
 const [assignedToFilter, setAssignedToFilter] = useState<string>('All');
 const [statusFilter, setStatusFilter] = useState<string[]>(['All']);
 const [possessionFilter, setPossessionFilter] = useState<string[]>(['All']);
 const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
 const [bathroomsFilter, setBathroomsFilter] = useState<number[]>([]);
 const [priceRangeFilter, setPriceRangeFilter] = useState<[number, number]>([0, 1000000000]);
 const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
 const [sortBy, setSortBy] = useState(() => localStorage.getItem('defaultProjectSort') || 'id');
 const [viewMode, setViewMode] = useState<'table' | 'grid' | 'map'>('grid');
 const [projects, setProjects] = useState<Project[]>([]);
 const [resaleProperties, setResaleProperties] = useState<ResaleProperty[]>([]);
 const [reports, setReports] = useState<Report[]>([]);
 const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, folders: 0, liveUsers: 0, totalProperties: 0, totalLogs: 0, teamLeaders: 0 });
 const [approvals, setApprovals] = useState<any[]>([]);
 const [notifications, setNotifications] = useState<any[]>([]);
 const [logs, setLogs] = useState<any[]>([]);
 const [showNotifications, setShowNotifications] = useState(false);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [users, setUsers] = useState<User[]>([]);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [entryType, setEntryType] = useState<'project' | 'resale'>('project');
 const [editingProject, setEditingProject] = useState<Project | null>(null);
 const [editingResale, setEditingResale] = useState<ResaleProperty | null>(null);
 const [isAddingResale, setIsAddingResale] = useState(false);
 const [selectedResale, setSelectedResale] = useState<ResaleProperty | null>(null);
 const [resaleToDelete, setResaleToDelete] = useState<ResaleProperty | null>(null);
 const [isUserModalOpen, setIsUserModalOpen] = useState(false);
 const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
 const [userToDelete, setUserToDelete] = useState<User | null>(null);
 const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
 const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
 const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
 const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
 const [isBuildTeamModalOpen, setIsBuildTeamModalOpen] = useState(false);
 const [selectedUsersForTeam, setSelectedUsersForTeam] = useState<string[]>([]);
 const [userForPermissions, setUserForPermissions] = useState<User | null>(null);
 const [userForTeam, setUserForTeam] = useState<User | null>(null);
 const [completingTaskId, setCompletingTaskId] = useState<{id: string, action: 'approve' | 'reject'} | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const imageInputRef = useRef<HTMLInputElement>(null);

 const allBuilders = Array.from(new Set([
 ...projects.map(p => p.builderName),
 ...resaleProperties.map(p => p.builderName)
 ].filter(Boolean)));

 const allSocieties = Array.from(new Set(resaleProperties.map(p => p.societyName).filter(Boolean)));

 const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pdfs' | 'images') => {
 const file = e.target.files?.[0];
 if (!file || !selectedFolder) return;

 const reader = new FileReader();
 reader.onloadend = async () => {
 const base64String = reader.result as string;
 const project = projects.find(p => p.id === selectedFolder);
 if (!project) return;

 const newItem = {
 name: file.name,
 size: file.size,
 data: base64String
 };

 const updatedItems = [...(project[type] || []), newItem];

 try {
 const response = await request(`/api/projects/${project.id}?role=${user?.role}&userName=${user?.name}`, {
 method: 'PATCH',
 body: JSON.stringify({ 
 [type]: updatedItems
 })
 });

 if (response) {
 setProjects(prev => prev.map(p => p.id === project.id ? response : p));
 showToast(`${type === 'pdfs' ? 'File' : 'Image'} uploaded successfully`, 'success');
 }
 } catch (error) {
 console.error('Upload failed:', error);
 showToast(`Failed to upload ${type === 'pdfs' ? 'file' : 'image'}`, 'error');
 }
 };
 reader.readAsDataURL(file);
 e.target.value = '';
 };

 const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
 const [selectedTeamLeader, setSelectedTeamLeader] = useState<string>('');
 const [selectedProject, setSelectedProject] = useState<Project | null>(null);
 const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
 const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
 const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
 const [bulkStatus, setBulkStatus] = useState('Active');
 const [selectedBuilder, setSelectedBuilder] = useState<string | null>(null);
 const [newProp, setNewProp] = useState({ title: '', type: 'Apartment', price: 0, location: '', area: '' });
 const [lastSavedUser, setLastSavedUser] = useState<Date | null>(null);
 const [newUser, setNewUser] = useState(() => {
 const savedDraft = localStorage.getItem('draft_user');
 if (savedDraft) {
 try {
 return JSON.parse(savedDraft);
 } catch (e) {
 console.warn("Could not parse draft user", e);
 }
 }
 return { name: '', email: '', role: 'employee' as Role, phoneNumber: '' };
 });

 useEffect(() => {
 localStorage.setItem('draft_user', JSON.stringify(newUser));
 setLastSavedUser(new Date());
 }, [newUser]);
 const [createdUserCredentials, setCreatedUserCredentials] = useState<{username: string, password: string} | null>(null);
 const [userError, setUserError] = useState('');
 const [loginForm, setLoginForm] = useState({ email: 'admin@pysync.local', password: 'password123' });
 const [loginError, setLoginError] = useState('');
 const [isLoggingIn, setIsLoggingIn] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [showPassword, setShowPassword] = useState(false);
 const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
 const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('notificationsEnabled') !== 'false');
 const [compactMode, setCompactMode] = useState(() => localStorage.getItem('compactMode') === 'true');
 const [autoSave, setAutoSave] = useState(() => localStorage.getItem('autoSave') !== 'false');
 const [soundEffects, setSoundEffects] = useState(() => localStorage.getItem('soundEffects') !== 'false');
 const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'English');
 const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || 'amber');
 const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
 const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('fontFamily') || 'mono');
 const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'medium');
 const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('reducedMotion') === 'true');
 const [selectedReport, setSelectedReport] = useState<Report | null>(null);
 const [isReportEditing, setIsReportEditing] = useState(false);
 const [showFullReport, setShowFullReport] = useState(false);

 useEffect(() => {
 localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
 localStorage.setItem('compactMode', compactMode.toString());
 localStorage.setItem('autoSave', autoSave.toString());
 localStorage.setItem('soundEffects', soundEffects.toString());
 localStorage.setItem('language', language);
 localStorage.setItem('accentColor', accentColor);
 localStorage.setItem('theme', theme);
 localStorage.setItem('fontFamily', fontFamily);
 localStorage.setItem('fontSize', fontSize);
 localStorage.setItem('reducedMotion', reducedMotion.toString());
 }, [notificationsEnabled, compactMode, autoSave, soundEffects, language, accentColor, theme, fontFamily, fontSize, reducedMotion]);

 useEffect(() => {
 const root = document.documentElement;
 root.classList.toggle('light', theme === 'light');
 root.style.setProperty('--font-family', fontFamily === 'mono' ? '"DM Mono", ui-monospace, monospace' : 'ui-sans-serif, system-ui, sans-serif');
 root.style.setProperty('--motion-duration', reducedMotion ? '0s' : '0.2s');
 
 const fontSizes: Record<string, string> = {
 small: '14px',
 medium: '16px',
 large: '18px'
 };
 root.style.fontSize = fontSizes[fontSize] || '16px';
 
 const colors: Record<string, { primary: string, secondary: string }> = {
 amber: { primary: '#f59e0b', secondary: '#fbbf24' },
 blue: { primary: '#3b82f6', secondary: '#60a5fa' },
 green: { primary: '#10b981', secondary: '#34d399' },
 purple: { primary: '#8b5cf6', secondary: '#a78bfa' },
 red: { primary: '#f43f5e', secondary: '#fb7185' }
 };
 
 const selected = colors[accentColor] || colors.amber;
 root.style.setProperty('--accent-primary', selected.primary);
 root.style.setProperty('--accent-secondary', selected.secondary);
 }, [accentColor, theme, fontFamily, fontSize, reducedMotion]);

 const playSound = (type: 'click' | 'success' | 'error' | 'notify' = 'click') => {
 if (!soundEffects) return;
 
 const frequencies: Record<string, number> = {
 click: 440,
 success: 880,
 error: 220,
 notify: 660
 };
 
 try {
 const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
 const oscillator = audioCtx.createOscillator();
 const gainNode = audioCtx.createGain();
 
 oscillator.type = 'sine';
 oscillator.frequency.setValueAtTime(frequencies[type], audioCtx.currentTime);
 
 gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
 gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
 
 oscillator.connect(gainNode);
 gainNode.connect(audioCtx.destination);
 
 oscillator.start();
 oscillator.stop(audioCtx.currentTime + 0.1);
 } catch (e) {
 console.warn('AudioContext not supported or blocked');
 }
 };

 const [forgotPassword, setForgotPassword] = useState(false);
 const [resetToken, setResetToken] = useState('');
 const [resetPasswordForm, setResetPasswordForm] = useState({ password: '', confirmPassword: '' });
 const [resetSuccess, setResetSuccess] = useState(false);
 const [forgotEmail, setForgotEmail] = useState('');
 const [forgotMessage, setForgotMessage] = useState('');
 const [isSendingReset, setIsSendingReset] = useState(false);
 const [isResetting, setIsResetting] = useState(false);

 const validatePassword = (password: string): string | null => {
 if (password.length < 12) return "Password must be at least 12 characters long";
 if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
 if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
 if (!/\d/.test(password)) return "Password must contain at least one digit";
 if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
 return null;
 };

 const [toasts, setToasts] = useState<any[]>([]);
 const [isSearchFocused, setIsSearchFocused] = useState(false);
 const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

 useEffect(() => {
 const params = new URLSearchParams(window.location.search);
 const token = params.get('token');
 if (token) {
 setResetToken(token);
 // Clear the token from the URL without reloading
 window.history.replaceState({}, document.title, window.location.pathname);
 }
 }, []);

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 setIsSearchFocused(false);
 (document.activeElement as HTMLElement)?.blur();
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
 const id = Math.random().toString(36).substr(2, 9);
 setToasts(prev => [...prev, { id, message, type }]);
 
 if (type === 'success') playSound('success');
 else if (type === 'error') playSound('error');
 else playSound('notify');
 };

 const removeToast = (id: string) => {
 setToasts(prev => prev.filter(t => t.id !== id));
 };

 const request = async (url: string, options: RequestInit = {}) => {
 const headers = new Headers(options.headers || {});
 
 // Attempt to attach token authorization
 const token = localStorage.getItem('token');
 if (token) {
 if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
 }
 
 // Keep old headers for backwards compatibility or fallback if needed
 if (user) {
 if (!headers.has('x-user-role')) headers.set('x-user-role', user.role);
 if (!headers.has('x-user-name')) headers.set('x-user-name', user.name);
 if (!headers.has('x-user-id')) headers.set('x-user-id', user.id);
 }

 try {
 const response = await fetch(url, { ...options, headers });
 
 if (response.status === 401) {
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 setIsLoggedIn(false);
 setUser(null);
 showToast("Session expired. Please log in again.", 'error');
 throw new Error("Unauthorized");
 }

 let data;
 const contentType = response.headers.get("content-type");
 if (contentType && contentType.includes("application/json")) {
 data = await response.json();
 } else {
 data = { error: `Server error: ${response.status} ${response.statusText}` };
 }
 
 if (!response.ok) {
 let errorMessage = data.error || data.message;
 
 if (!errorMessage) {
 switch (response.status) {
 case 400:
 errorMessage = "Bad Request: Please check your input and try again.";
 break;
 case 403:
 errorMessage = "Forbidden: You do not have permission to perform this action.";
 break;
 case 404:
 errorMessage = "Not Found: The requested resource could not be found.";
 break;
 case 429:
 errorMessage = "Too Many Requests: Please slow down and try again later.";
 break;
 case 500:
 errorMessage = "Internal Server Error: Something went wrong on our end.";
 break;
 default:
 errorMessage = `Request failed with status ${response.status}`;
 }
 }
 throw new Error(errorMessage);
 }
 
 return data;
 } catch (err: any) {
 if (err.message !== "Unauthorized") {
 console.error(`API Error (${url}):`, err);
 showToast(err.message || "An unexpected error occurred", 'error');
 }
 throw err;
 }
 };

 useEffect(() => {
 if (isLoggedIn) {
 refreshData();
 }
 }, [isLoggedIn, activeTab]);

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
 const token = localStorage.getItem('token');
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
 if (data.type === 'NEW_NOTIFICATION') {
 fetchNotifications();
 showToast('New notification received', 'info');
 } else if (data.type === 'USER_CREATED') {
 setUsers(prev => [...prev, data.user]);
 } else if (data.type === 'USER_DELETED') {
 setUsers(prev => prev.filter(u => u.id !== data.userId));
 } else if (data.type === 'USER_UPDATED') {
 setUsers(prev => prev.map(u => u.id === data.user.id ? data.user : u));
  } else if (data.type === 'NEW_LOG') {
    setLogs(prev => {
      if (prev.some(l => l.id === data.log.id)) return prev;
      return [data.log, ...prev].slice(0, 100);
    });
    refreshData();
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
 const data = await request('/api/notifications', {
 headers: { 
 'x-user-role': user.role,
 'x-user-name': user.name
 }
 });
 setNotifications(Array.isArray(data) ? data : []);
 } catch (err) {
 // Error handled by request helper
 }
 };

 const markAsRead = async (id: string) => {
 if (!user) return;
 try {
 await request(`/api/notifications/${id}/read`, {
 method: 'POST',
 headers: { 'x-user-name': user.name }
 });
 fetchNotifications();
 showToast('Notification marked as read', 'info');
 } catch (err) {
 // Error handled by request helper
 }
 };

 const markAllAsRead = async () => {
 if (!user) return;
 try {
 await request('/api/notifications/read-all', {
 method: 'POST',
 headers: { 'x-user-name': user.name }
 });
 fetchNotifications();
 } catch (err) {
 // Error handled by request helper
 }
 };


 const refreshData = async () => {
 try {
 const promises = [];
 if (hasPermission(user, 'VIEW_STATS')) promises.push(fetchStats());
 promises.push(fetchProjects());
 promises.push(fetchResaleProperties());
 promises.push(fetchReports());
 promises.push(fetchApprovals());
 promises.push(fetchNotifications());
 if (hasPermission(user, 'MANAGE_USERS') || hasPermission(user, 'MANAGE_TEAM') || hasPermission(user, 'ADD_PROJECTS') || hasPermission(user, 'EDIT_PROJECTS')) {
 promises.push(fetchUsers());
 }
 if (hasPermission(user, 'VIEW_LOGS') || hasPermission(user, 'VIEW_REPORTS')) {
 promises.push(fetchLogs());
 }
 await Promise.all(promises);
 } catch (err) {
 console.error("Refresh failed:", err);
 }
 };

 const fetchUsers = async () => {
 try {
 const data = await request('/api/users', {
 headers: { 'x-user-role': user?.role || '' }
 });
 setUsers(data);
 } catch (err) {
 // Error handled by request helper
 }
 };

 const fetchLogs = async () => {
 if (!hasPermission(user, 'VIEW_LOGS') && !hasPermission(user, 'VIEW_REPORTS')) return;
 try {
 const data = await request('/api/logs', {
 headers: { 'x-user-role': user?.role || '' }
 });
 setLogs(data);
 } catch (err) {
 // Error handled by request helper
 }
 };

 const fetchStats = async () => {
 try {
 const data = await request('/api/stats', {
 headers: { 'x-user-role': user?.role || '' }
 });
 setStats(data);
 } catch (err) {
 // Error handled by request helper
 }
 };

 const createReport = async (reportData: any) => {
 try {
 const data = await request('/api/reports', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...reportData, userName: user?.name })
 });
 setReports(prev => [...prev, data]);
 showToast('Report created successfully', 'success');
 return data;
 } catch (err) {
 throw err;
 }
 };

 const updateReport = async (id: string, reportData: any) => {
 try {
 const data = await request(`/api/reports/${id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...reportData, userName: user?.name })
 });
 setReports(prev => prev.map(r => r.id === id ? data : r));
 showToast('Report updated successfully', 'success');
 return data;
 } catch (err) {
 throw err;
 }
 };

 const deleteReport = async (id: string) => {
 try {
 await request(`/api/reports/${id}?userName=${user?.name}`, {
 method: 'DELETE'
 });
 setReports(prev => prev.filter(r => r.id !== id));
 if (selectedReport?.id === id) {
 setSelectedReport(null);
 }
 showToast('Report deleted successfully', 'success');
 } catch (err) {
 // Error handled by request helper
 }
 };

 const fetchProjects = async () => {
 try {
 const data = await request('/api/projects', {
 headers: { 'x-user-role': user?.role || '' }
 });
 setProjects(data);
 } catch (err) {
 // Error handled by request helper
 }
 };

 const fetchResaleProperties = async () => {
 try {
 const data = await request('/api/resale-properties', {
 headers: { 'x-user-role': user?.role || '' }
 });
 setResaleProperties(data);
 } catch (err) {
 // Error handled by request helper
 }
 };

 const fetchReports = async () => {
 if (!hasPermission(user, 'VIEW_REPORTS')) return;
 try {
 const data = await request('/api/reports', {
 headers: { 'x-user-role': user?.role || '' }
 });
 setReports(data);
 } catch (err) {
 // Error handled by request helper
 }
 };

 const fetchApprovals = async () => {
 try {
 const data = await request('/api/approvals', {
 headers: { 'x-user-role': user?.role || '' }
 });
 setApprovals(data);
 } catch (err) {
 // Error handled by request helper
 }
 };

 const handleAddProject = async (formData: any) => {
 try {
 const { price, priceUnit, ...rest } = formData;
 const actualPrice = priceUnit === 'Lacs' ? Number(price) * 100000 : Number(price) * 10000000;
 
 await request('/api/projects', {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'x-user-role': user?.role || ''
 },
 body: JSON.stringify({ ...rest, price: actualPrice, userName: user?.name })
 });
 setIsModalOpen(false);
 showToast("Project added successfully", 'success');
 refreshData();
 } catch (err) {
 // Error handled by request helper
 }
 };

 const handleEditProject = async (formData: any) => {
 try {
 if (!editingProject) return;
 const { price, priceUnit, ...rest } = formData;
 const actualPrice = priceUnit === 'Lacs' ? Number(price) * 100000 : Number(price) * 10000000;
 
 await request(`/api/projects/${editingProject.id}`, {
 method: 'PUT',
 headers: { 
 'Content-Type': 'application/json',
 'x-user-role': user?.role || ''
 },
 body: JSON.stringify({ ...rest, price: actualPrice, userName: user?.name })
 });
 setEditingProject(null);
 setIsModalOpen(false);
 showToast("Project updated successfully", 'success');
 refreshData();
 } catch (err) {
 // Error handled by request helper
 }
 };

 const handleAddResale = async (formData: any) => {
 try {
 const { price, priceUnit, ...rest } = formData;
 const actualPrice = priceUnit === 'Lacs' ? Number(price) * 100000 : Number(price) * 10000000;
 
 await request('/api/resale-properties', {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'x-user-role': user?.role || ''
 },
 body: JSON.stringify({ ...rest, price: actualPrice, userName: user?.name })
 });
 setIsAddingResale(false);
 showToast("Listing Project added successfully", 'success');
 refreshData();
 } catch (err) {
 // Error handled by request helper
 }
 };

 const handleEditResale = async (formData: any) => {
 try {
 if (!editingResale) return;
 const { price, priceUnit, ...rest } = formData;
 const actualPrice = priceUnit === 'Lacs' ? Number(price) * 100000 : Number(price) * 10000000;

 await request(`/api/resale-properties/${editingResale.id}`, {
 method: 'PUT',
 headers: { 
 'Content-Type': 'application/json',
 'x-user-role': user?.role || ''
 },
 body: JSON.stringify({ ...rest, price: actualPrice, userName: user?.name })
 });
 setEditingResale(null);
 showToast("Listing Project updated successfully", 'success');
 refreshData();
 } catch (err) {
 // Error handled by request helper
 }
 };

 const handleDeleteResale = async (id: string) => {
 try {
 await request(`/api/resale-properties/${id}?role=${user?.role}&userName=${user?.name}`, {
 method: 'DELETE',
 headers: { 'x-user-role': user?.role || '' }
 });
 showToast("Listing Project deleted successfully", 'success');
 refreshData();
 } catch (err) {
 // Error handled by request helper
 }
 };

 const handleDeleteProject = async (id: string) => {
 try {
 await request(`/api/projects/${id}?role=${user?.role}&userName=${user?.name}`, {
 method: 'DELETE',
 headers: { 'x-user-role': user?.role || '' }
 });
 showToast(hasPermission(user, 'DELETE_PROJECTS') ? "Project deleted successfully" : "Deletion request sent successfully", 'success');
 refreshData();
 } catch (err) {
 // Error handled by request helper
 }
 };

 const handleBulkDelete = async () => {
 try {
 await Promise.all(selectedProjectIds.map(id => 
 request(`/api/projects/${id}?role=${user?.role}&userName=${user?.name}`, {
 method: 'DELETE',
 headers: { 'x-user-role': user?.role || '' }
 })
 ));
 
 showToast(`Successfully processed ${selectedProjectIds.length} projects`, 'success');
 setSelectedProjectIds([]);
 setIsBulkDeleteModalOpen(false);
 refreshData();
 } catch (error) {
 showToast("Failed to process some projects", 'error');
 }
 };

 const handleBulkStatusChange = async () => {
 try {
 await Promise.all(selectedProjectIds.map(id => {
 const project = projects.find(p => p.id === id);
 if (!project) return Promise.resolve();
 return request(`/api/projects/${id}`, { 
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...project, status: bulkStatus })
 });
 }));
 
 showToast(`Updated status for ${selectedProjectIds.length} projects`, 'success');
 setSelectedProjectIds([]);
 setIsBulkStatusModalOpen(false);
 refreshData();
 } catch (error) {
 showToast("Failed to update status for some projects", 'error');
 }
 };

 const handleApproval = async (id: string, action: 'approve' | 'reject') => {
 try {
 setCompletingTaskId({ id, action });
 // Add a small delay for visual feedback if it's very fast
 const startTime = Date.now();
 
 await request(`/api/approvals/${id}/action`, {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'x-user-role': user?.role || ''
 },
 body: JSON.stringify({ action, userName: user?.name })
 });
 
 const endTime = Date.now();
 const elapsed = endTime - startTime;
 if (elapsed < 600) {
 await new Promise(resolve => setTimeout(resolve, 600 - elapsed));
 }

 showToast(`Request ${action}d successfully`, 'success');
 refreshData();
 } catch (err) {
 // Error handled by request helper
 } finally {
 setCompletingTaskId(null);
 }
 };

 const handleAddUser = async (formData: any) => {
 setUserError('');
 setIsSubmitting(true);
 try {
 const data = await request('/api/users', {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'x-user-role': user?.role || ''
 },
 body: JSON.stringify({ ...formData, adminName: user?.name })
 });
 setCreatedUserCredentials({ username: data.username, password: data.password });
 setNewUser({ name: '', email: '', role: 'employee', phoneNumber: '' });
 localStorage.removeItem('draft_user');
 showToast("User created successfully", 'success');
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
 const data = await request(`/api/users/${targetUserId}/reset-credentials`, {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'x-user-role': user?.role || ''
 }
 });
 showToast("Credentials reset successfully. Please use the new temporary password.", 'success');
 if (data.credentials) {
 setCreatedUserCredentials(data.credentials);
 setIsUserModalOpen(true);
 }
 } catch (err: any) {
 showToast(err.message, 'error');
 throw err;
 }
 };

 const handleUpdatePermissions = async () => {
 if (!userForPermissions) return;
 try {
 await request(`/api/users/${userForPermissions.id}/permissions`, {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'x-user-role': user?.role || '',
 'x-user-id': user?.id || ''
 },
 body: JSON.stringify({ permissions: selectedPermissions, adminName: user?.name })
 });
 setIsPermissionsModalOpen(false);
 setUserForPermissions(null);
 showToast("Permissions updated successfully", 'success');
 refreshData();
 } catch (err) {
 // Error handled by request helper
 }
 };

 const handleAssignTeam = async () => {
 if (!userForTeam) return;
 try {
 await request(`/api/users/${userForTeam.id}/assign-team`, {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'x-user-role': user?.role || '',
 'x-user-id': user?.id || ''
 },
 body: JSON.stringify({ teamLeaderId: selectedTeamLeader, leaderName: user?.name })
 });
 setIsTeamModalOpen(false);
 setUserForTeam(null);
 showToast("Team assigned successfully", 'success');
 refreshData();
 } catch (err) {
 // Error handled by request helper
 }
 };

 const handleBulkAssignTeam = async () => {
 if (selectedUsersForTeam.length === 0) {
 showToast("Please select at least one user", 'error');
 return;
 }
 
 const targetLeaderId = selectedTeamLeader || user?.id;
 const targetLeaderName = users.find(u => u.id === targetLeaderId)?.name || user?.name;

 try {
 await request(`/api/users/bulk-assign-team`, {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'x-user-role': user?.role || '',
 'x-user-id': user?.id || ''
 },
 body: JSON.stringify({ 
 userIds: selectedUsersForTeam, 
 teamLeaderId: targetLeaderId, 
 leaderName: targetLeaderName 
 })
 });
 setIsBuildTeamModalOpen(false);
 setSelectedUsersForTeam([]);
 setSelectedTeamLeader('');
 showToast(`Successfully assigned ${selectedUsersForTeam.length} users to the team`, 'success');
 refreshData();
 } catch (err) {
 // Error handled by request helper
 }
 };

 const handleDeleteUser = async () => {
 if (!userToDelete) return;
 try {
 await request(`/api/users/${userToDelete.id}?adminName=${user?.name}`, {
 method: 'DELETE',
 headers: { 'x-user-role': user?.role || '' }
 });
 setIsDeleteUserModalOpen(false);
 setUserToDelete(null);
 showToast("User deleted successfully", 'success');
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
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ 
 ...updatedData, 
 adminName: user?.name,
 requesterRole: user?.role,
 requesterId: user?.id
 })
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
 showToast("Profile updated successfully", 'success');
 } catch (err: any) {
 // Error handled by request helper
 }
 };

 const handleLogin = async (overrideForm?: {email: string, password: string}) => {
 setLoginError('');
 setIsLoggingIn(true);
 const formToSubmit = overrideForm || loginForm;
 try {
 const responseBody = await request(`${window.location.origin}/api/auth/login`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(formToSubmit)
 });
 // Login logic
 const authUser = responseBody.user;
 const authToken = responseBody.token;

 localStorage.setItem('token', authToken);
 localStorage.setItem('user', JSON.stringify(authUser));

 setUser(authUser);
 setIsLoggedIn(true);
 if (authUser.role === 'admin') {
 setActiveTab('dashboard');
 } else {
 setActiveTab('dashboard');
 }
 showToast(`Welcome back, ${authUser.name}`, 'success');
 } catch (err: any) {
 setLoginError(err.message);
 } finally {
 setIsLoggingIn(false);
 }
 };

 const handleForgotPassword = async () => {
 setForgotMessage('');
 setIsSendingReset(true);
 try {
 const data = await request('/api/auth/forgot-password', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email: forgotEmail })
 });
 setForgotMessage(data.message);
 showToast(data.message, 'info');
 } catch (err: any) {
 setForgotMessage(err.message);
 } finally {
 setIsSendingReset(false);
 }
 };

 const handleResetPassword = async () => {
 setLoginError('');
 
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
 await request('/api/auth/reset-password', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ token: resetToken, newPassword: resetPasswordForm.password })
 });
 setResetSuccess(true);
 setResetToken('');
 setForgotPassword(false);
 showToast("Password reset successfully", 'success');
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
 setBathroomsFilter(bathroomsFilter.filter(c => c !== count));
 } else {
 setBathroomsFilter([...bathroomsFilter, count]);
 }
 };

 const toggleStatusFilter = (status: string) => {
 setStatusFilter([status]);
 };

 return (
 <ErrorBoundary>
   {!isLoggedIn ? (
  <div className="min-h-screen bg-bg flex flex-col justify-between items-center p-4 relative overflow-hidden">
 {/* Grid Background */}
 <div className="absolute inset-0 opacity-10 pointer-events-none" 
 style={{ backgroundImage: 'radial-gradient(circle, #2e3548 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
 
   <div className="flex-grow flex items-center justify-center w-full z-10 my-4 md:my-8">
  <motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="w-full max-w-md bg-3d border-3d p-6 sm:p-10 rounded-[32px] relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(255,255,255,0.05)]"
  >
 <div className="flex items-center justify-between mb-10">
 <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-black">Secure Ingress · v1.2</div>
 <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-2 border border-border-bright">
 <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
 <span className="text-[8px] font-mono text-text-secondary uppercase">System Operational</span>
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
 Initialize your new secure credentials below. Ensure your password meets the security requirements.
 </p>
 </div>

 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-[10px] text-text-dim uppercase tracking-widest font-black ml-1">New Password</label>
 <input 
 type="password"
 value={resetPasswordForm.password}
 onChange={e => setResetPasswordForm({...resetPasswordForm, password: e.target.value})}
 className="w-full bg-surface-2 border border-border-bright p-4 rounded-2xl font-mono text-sm text-text-primary focus:border-amber-primary outline-none transition-all"
 placeholder="••••••••••••"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] text-text-dim uppercase tracking-widest font-black ml-1">Confirm Identity</label>
 <input 
 type="password"
 value={resetPasswordForm.confirmPassword}
 onChange={e => setResetPasswordForm({...resetPasswordForm, confirmPassword: e.target.value})}
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
 {isResetting ? 'Processing Update...' : 'Update & Authenticate'}
 </button>
 <button 
 onClick={() => setResetToken('')}
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
 setForgotMessage('');
 }}
 onSendReset={handleForgotPassword}
 isLoading={isSendingReset}
 message={forgotMessage}
 />
 </motion.div>
 ) : (
 <motion.div
 key="login"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 >
 <div className="space-y-2 mb-8">
 <h2 className="text-3xl font-serif font-black text-text-primary tracking-tight">Welcome Back</h2>
 <p className="text-xs text-text-dim">Authenticate to access the administrative panel.</p>
 </div>
 <LoginForm 
 onLogin={handleLogin}
 onForgotPassword={() => setForgotPassword(true)}
 isLoading={isLoggingIn}
 error={loginError}
 />

 <div className="mt-8 space-y-4 pt-6 border-t border-border-dim/30">
 <div className="flex items-center gap-2 px-1">
 <div className="h-px flex-1 bg-border-dim/30"></div>
 <span className="text-[9px] text-text-dim uppercase tracking-[0.2em] font-black">Quick Auth</span>
 <div className="h-px flex-1 bg-border-dim/30"></div>
 </div>
 <div className="grid grid-cols-3 gap-2">
 <button 
 onClick={() => {
 const form = { email: 'admin@pysync.local', password: 'password123' };
 setLoginForm(form);
 handleLogin(form);
 }}
 className="flex flex-col items-center gap-2 p-3 bg-surface-2 border border-border-bright rounded-xl hover:border-amber-primary/50 transition-all group"
 >
 <ShieldCheck size={16} className="text-text-dim group-hover:text-amber-primary transition-colors" />
 <span className="text-[8px] font-black uppercase text-text-dim group-hover:text-text-primary">Admin</span>
 </button>
 <button 
 onClick={() => {
 const form = { email: 'leader@pysync.local', password: 'password123' };
 setLoginForm(form);
 handleLogin(form);
 }}
 className="flex flex-col items-center gap-2 p-3 bg-surface-2 border border-border-bright rounded-xl hover:border-amber-primary/50 transition-all group"
 >
 <ShieldCheck size={16} className="text-text-dim group-hover:text-amber-primary transition-colors" />
 <span className="text-[8px] font-black uppercase text-text-dim group-hover:text-text-primary">Leader</span>
 </button>
 <button 
 onClick={() => {
 const form = { email: 'employee@pysync.local', password: 'password123' };
 setLoginForm(form);
 handleLogin(form);
 }}
 className="flex flex-col items-center gap-2 p-3 bg-surface-2 border border-border-bright rounded-xl hover:border-amber-primary/50 transition-all group"
 >
 <ShieldCheck size={16} className="text-text-dim group-hover:text-amber-primary transition-colors" />
 <span className="text-[8px] font-black uppercase text-text-dim group-hover:text-text-primary">Staff</span>
 </button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 
 <div className="mt-12 pt-8 border-t border-border-dim flex justify-between items-center text-[9px] text-text-dim uppercase tracking-widest font-black">
  <span>Security Audited</span>
  <span className="flex items-center gap-1.5">
  <Clock size={10} /> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
        <span className="text-border-dim/40 font-light font-sans">|</span>
        <span className="font-semibold text-text-dim">&copy; {new Date().getFullYear()}</span>
        <span className="text-border-dim/40 font-light font-sans">|</span>
        <span className="text-text-dim/80 font-medium">
          Platform by <span className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150 cursor-pointer">Propertyards.com</span>
        </span>
      </div>

      {/* Essential pages in the same single line */}
      <div className="flex items-center justify-center gap-3.5">
        <a href="#" className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150">Privacy</a>
        <span className="text-border-dim/40 font-light">•</span>
        <a href="#" className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150">Terms</a>
      </div>
    </div>
  </footer>
  </div>
  ) : (
 <div className="flex w-full h-screen bg-bg overflow-hidden relative">
 {/* Animated Background Grid */}
 <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
 style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
 
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
 <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 bg-3d-inverse border-r border-black/50 shadow-3d flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
 <div className="p-6 border-b border-black/50 flex items-baseline justify-between gap-2 relative z-10">
 <div className="flex items-baseline gap-2">
 <motion.span 
 whileHover={{ 
 scale: 1.05, 
 x: 5,
 filter: "drop-shadow(0 0 8px rgba(245,158,11,0.4))"
 }}
 className="font-serif text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-primary via-amber-500 to-amber-600 tracking-tighter cursor-default transition-all"
 >
 pySync
 </motion.span>
 </div>
 <button className="md:hidden text-text-dim hover:text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>
 <X size={20} />
 </button>
 </div>
 
 <div className="flex-1 px-3 py-6 space-y-8 overflow-y-auto no-scrollbar">
 <div className="space-y-1">
 <div className="px-4 text-[9px] text-text-dim uppercase tracking-[0.2em] mb-3">Main</div>
 <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
 {user?.role === 'team_leader' && (
 <SidebarItem icon={UsersIcon} label="My Team" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setTeamFilter(user.id); setIsMobileMenuOpen(false); }} />
 )}
 <SidebarItem icon={Building2} label="Project" active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }} badge={projects.length} />
 <SidebarItem icon={ClipboardList} label="Listing Projects" active={activeTab === 'resale'} onClick={() => { setActiveTab('resale'); setIsMobileMenuOpen(false); }} badge={resaleProperties.length} />
 <SidebarItem icon={FolderOpen} label="Media Folders" active={activeTab === 'media'} onClick={() => { setActiveTab('media'); setIsMobileMenuOpen(false); }} />
 </div>
 
 <div className="space-y-1">
 <div className="px-4 text-[9px] text-text-dim uppercase tracking-[0.2em] mb-3">Workflow</div>
 <SidebarItem icon={Clock} label="Approvals" active={activeTab === 'approvals'} onClick={() => { setActiveTab('approvals'); setIsMobileMenuOpen(false); }} badge={approvals.length} />
  <SidebarItem icon={UsersIcon} label="Users Management" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setSearchQuery(''); setTeamFilter(null); setIsMobileMenuOpen(false); playSound('click'); }} />
  <SidebarItem icon={Activity} label="System Audit Logs" active={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); setIsMobileMenuOpen(false); playSound('click'); }} />
 
 </div>

 {/* System Health Monitor */}
 <div className="px-4 pt-4">
 <div className="p-3 bg-surface-2/50 border border-border-dim rounded-xl space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[8px] text-text-dim uppercase tracking-widest font-bold">System Health</span>
 <span className="text-[8px] text-green-500 font-bold">99.9%</span>
 </div>
 <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: "0%" }}
 animate={{ width: "99.9%" }}
 transition={{ duration: 2, ease: "easeOut" }}
 className="h-full bg-gradient-to-r from-amber-primary to-green-500"
 />
 </div>
 <div className="flex items-center gap-2">
 <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
 <span className="text-[7px] text-text-dim font-mono truncate">DB_SYNC_ACTIVE: {new Date().toLocaleTimeString()}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="p-4 border-t border-border-dim">
 <button 
 onClick={() => { setActiveTab('profile'); setSelectedProfileUser(null); setIsMobileMenuOpen(false); }}
 className="w-full flex items-center gap-3 p-3 bg-surface-2 rounded-xl border border-border-bright hover:border-amber-primary transition-all group"
 >
 <div className="relative">
 <div className="w-9 h-9 rounded-full bg-amber-primary/20 border border-amber-primary flex items-center justify-center text-amber-primary font-bold group-hover:bg-amber-primary group-hover:text-bg transition-all overflow-hidden">
 {user?.profilePicture ? (
 <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
 ) : (
 user?.name?.[0] || '?'
 )}
 </div>
 <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-surface rounded-full flex items-center justify-center border border-border-dim">
 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
 </div>
 </div>
 <div className="flex-1 overflow-hidden text-left">
 <div className="text-xs font-bold text-text-primary truncate">{user?.name}</div>
 <div className="text-[10px] text-text-dim uppercase tracking-wider">
 {user?.role === 'admin' ? 'Super Admin' : user?.role === 'team_leader' ? 'Team Leader' : 'Employee'}
 </div>
 </div>
 </button>
 </div>
 </aside>

 {/* Main Content */}
 <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative bg-bg">
 <header className="h-16 bg-3d border-b border-black/50 shadow-3d flex items-center justify-between px-4 sm:px-8 shrink-0 w-full relative z-10">
 <div className="flex items-center gap-4">
 <button className="md:hidden text-text-dim hover:text-amber-primary" onClick={() => setIsMobileMenuOpen(true)}>
 <Menu size={20} />
 </button>
 <div>
 <h1 className="font-serif text-lg sm:text-xl font-bold text-text-primary capitalize">
 {activeTab === 'profile' ? (selectedProfileUser ? `${selectedProfileUser?.name || 'User'}'s Profile` : 'My Profile') : activeTab}
 </h1>
 <p className="hidden sm:block text-[11px] text-text-dim">Real Estate Data Platform</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border-bright rounded-full">
 <div className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-primary opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-primary"></span>
 </div>
 <span className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-bold">Live Syncing</span>
 </div>
 <div 
 className="relative"
 onMouseEnter={() => setShowNotifications(true)}
 onMouseLeave={() => setShowNotifications(false)}
 >
 <button 
 onClick={() => setShowNotifications(!showNotifications)} 
 className="p-2 sm:p-3 text-text-dim hover:text-amber-primary transition-colors relative group"
 >
 <Bell size={20} className={notifications.filter(n => !n.readBy.includes(user?.name || '')).length > 0 ? '' : 'group-hover:scale-110 transition-transform'} />
 {notifications.filter(n => !n.readBy.includes(user?.name || '')).length > 0 && (
 <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
 )}
 </button>
 <AnimatePresence>
 {showNotifications && (
 <motion.div 
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 transition={{ duration: 0.2 }}
 className="absolute -right-12 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-surface border border-border-dim rounded-2xl shadow-2xl z-50 overflow-hidden"
 >
 <div className="p-4 border-b border-border-dim flex justify-between items-center bg-surface-2/80 ">
 <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
 <Bell size={16} className="text-amber-primary" />
 Notifications
 {notifications.filter(n => !n.readBy.includes(user?.name || '')).length > 0 && (
 <span className="bg-amber-primary text-bg text-[10px] px-2 py-0.5 rounded-full font-bold">
 {notifications.filter(n => !n.readBy.includes(user?.name || '')).length} New
 </span>
 )}
 </h3>
 <button 
 onClick={() => {
 markAllAsRead();
 showToast('All notifications marked as read', 'info');
 }} 
 className="text-[10px] text-text-dim hover:text-amber-primary uppercase tracking-widest font-bold transition-colors"
 >
 Mark all read
 </button>
 </div>
 <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
 {notifications.length === 0 ? (
 <div className="p-12 text-center flex flex-col items-center gap-3">
 <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-text-dim/50">
 <Bell size={24} />
 </div>
 <div className="text-text-dim text-xs font-medium">You're all caught up!</div>
 </div>
 ) : (
 notifications.map(n => (
 <motion.div 
 key={n.id} 
 whileHover={{ backgroundColor: 'rgba(245, 158, 11, 0.05)' }}
 onClick={() => markAsRead(n.id)} 
 className={`p-4 border-b border-border-dim/50 cursor-pointer transition-colors relative ${!n.readBy.includes(user?.name || '') ? 'bg-amber-primary/[0.02]' : 'hover:bg-surface-2'}`}
 >
 {!n.readBy.includes(user?.name || '') && (
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-primary" />
 )}
 <div className="flex gap-4">
 <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${!n.readBy.includes(user?.name || '') ? 'bg-amber-primary shadow-amber-primary/50' : 'bg-border-bright'}`} />
 <div className="flex-1">
 <div className={`text-xs mb-1 ${!n.readBy.includes(user?.name || '') ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}>
 {n.title}
 </div>
 <div className="text-[11px] text-text-dim leading-relaxed">{n.message}</div>
 <div className="text-[9px] text-text-dim/70 mt-2 font-mono uppercase tracking-wider">
 {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
 </div>
 </div>
 </div>
 </motion.div>
 ))
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 {activeTab === 'profile' && selectedProfileUser && (
 <button 
 onClick={() => {
 setActiveTab('users');
 setSelectedProfileUser(null);
 }}
 className="text-xs font-bold text-amber-primary hover:underline flex items-center gap-1"
 >
 <ChevronRight size={14} className="rotate-180" /> Back to Users
 </button>
 )}
 <div className="relative group">
 <div className={`flex items-center gap-2 bg-surface-2 border transition-all duration-200 rounded-xl px-2 sm:px-4 py-2 ${isSearchFocused ? 'border-amber-primary ring-4 ring-amber-primary/10 w-40 sm:w-96' : 'border-border-bright w-24 sm:w-64'}`}>
 <Search size={16} className={`${isSearchFocused ? 'text-amber-primary' : 'text-text-dim'} shrink-0`} />
 <input 
 type="text" 
 placeholder="Search..." 
 value={searchQuery}
 onFocus={() => setIsSearchFocused(true)}
 onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="bg-transparent border-none outline-none text-xs text-text-primary w-full font-medium placeholder:text-text-dim/50" 
 />
 {searchQuery && (
 <button 
 onClick={() => setSearchQuery('')}
 className="text-text-dim hover:text-text-primary transition-colors"
 >
 <X size={14} />
 </button>
 )}
 </div>
 </div>
 {activeTab === 'users' && hasPermission(user, 'MANAGE_USERS') ? (
 <button 
 onClick={() => {
 setUserError('');
 setIsUserModalOpen(true);
 }}
 className="bg-amber-primary text-bg px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-amber-secondary transition-all"
 >
 <UserPlus size={16} /> <span className="hidden sm:inline">Add User</span>
 </button>
 ) : activeTab === 'resale' ? (
  <button 
  onClick={() => {
  setEditingResale(null);
  setEntryType('resale');
  setIsModalOpen(true);
  }}
  className="bg-amber-primary text-bg px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-amber-secondary transition-all"
  >
  <Plus size={16} /> <span className="hidden sm:inline">Add Listing</span>
  </button>
  ) : (activeTab === 'dashboard' || activeTab === 'projects') ? (
  <button 
  onClick={() => {
  setEditingProject(null);
  setIsModalOpen(true);
  }}
  className="bg-amber-primary text-bg px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-amber-secondary transition-all"
  >
  <Plus size={16} /> <span className="hidden sm:inline">Project</span>
  </button>
  ) : null}
 <button 
 onClick={() => setIsLogoutModalOpen(true)}
 className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors border border-red-500/20 hover:border-red-500/50 rounded-lg uppercase tracking-widest"
 >
 <LogOut size={14} /> <span className="hidden sm:inline">Sign Out</span>
 </button>
 <button 
 onClick={() => setIsSettingsModalOpen(true)}
 className="flex items-center gap-2 p-1.5 pr-3 text-text-dim hover:text-amber-primary transition-colors border border-border-dim hover:border-amber-primary/30 rounded-lg group"
 title="Settings"
 >
 <div className="w-6 h-6 rounded-full bg-amber-primary/20 flex items-center justify-center text-[10px] font-bold text-amber-primary overflow-hidden border border-amber-primary/10 group-hover:border-amber-primary/30 transition-all">
 {user?.profilePicture ? (
 <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
 ) : (
 user?.name?.charAt(0) || 'U'
 )}
 </div>
 <Settings size={14} />
 </button>
 </div>
 </header>

 <div className="flex-1 min-w-0 flex overflow-hidden bg-bg">
 <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
 <AnimatePresence mode="wait">
 {activeTab === 'database' && (
 <DatabaseExplorer showToast={showToast} request={request} />
 )}
 {user?.role === 'admin' && activeTab === 'admin_panel' && (
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
 <h1 className="text-3xl font-serif font-bold text-text-primary tracking-tight">Super Admin Control Center</h1>
 <p className="text-sm text-text-dim">Global system administration, user governance, and security auditing.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <KpiCard label="Total Users" value={users.length} icon={UsersIcon} color="amber" sub="Platform-wide active accounts" />
 <KpiCard label="Security Logs" value={logs.length} icon={Activity} color="red" sub={`${logs.length > 100 ? 'Review required' : 'System healthy'}`} />
 <KpiCard label="Approval Queue" value={approvals.length} icon={Clock} color="purple" sub="Pending supervisor actions" />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <DashboardSection 
 title="Administrative Quick Links" 
 icon={ShieldCheck}
 >
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <button 
 onClick={() => setActiveTab('users')}
 className="p-4 rounded-xl border border-border-dim/50 bg-surface-2 hover:border-amber-primary/50 transition-all text-left group"
 >
 <UsersIcon size={24} className="text-amber-primary mb-3 group-hover:scale-110 transition-transform" />
 <h3 className="text-sm font-bold text-text-primary">Manage Users</h3>
 <p className="text-[10px] text-text-dim">Create, edit, and assign roles to system members.</p>
 </button>
 <button 
 onClick={() => setActiveTab('logs')}
 className="p-4 rounded-xl border border-border-dim/50 bg-surface-2 hover:border-amber-primary/50 transition-all text-left group"
 >
 <Activity size={24} className="text-red-500 mb-3 group-hover:scale-110 transition-transform" />
 <h3 className="text-sm font-bold text-text-primary">Audit Logs</h3>
 <p className="text-[10px] text-text-dim">Monitor all system actions and transitions.</p>
 </button>
 <button 
 onClick={() => setActiveTab('database')}
 className="p-4 rounded-xl border border-border-dim/50 bg-surface-2 hover:border-amber-primary/50 transition-all text-left group"
 >
 <DatabaseIcon size={24} className="text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
 <h3 className="text-sm font-bold text-text-primary">Database Tool</h3>
 <p className="text-[10px] text-text-dim">Direct access to raw system data tables.</p>
 </button>
 <button 
 onClick={() => setActiveTab('approvals')}
 className="p-4 rounded-xl border border-border-dim/50 bg-surface-2 hover:border-amber-primary/50 transition-all text-left group"
 >
 <Clock size={24} className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
 <h3 className="text-sm font-bold text-text-primary">Approvals Queue</h3>
 <p className="text-[10px] text-text-dim">Review and authorize sensitive data requests.</p>
 </button>
 </div>
 </DashboardSection>

 <DashboardSection title="Recent System Activity" icon={Activity}>
 <div className="space-y-4">
 {logs.slice(0, 5).map(log => (
 <div key={log.id} className="flex items-start gap-3 text-xs">
 <div className="w-1.5 h-1.5 rounded-full bg-amber-primary mt-1.5 shrink-0" />
 <div>
 <span className="font-bold text-text-primary">{log.action}:</span>{' '}
 <span className="text-text-secondary">{log.summary}</span>
 <div className="text-[9px] text-text-dim mt-0.5">{new Date(log.timestamp).toLocaleString()}</div>
 </div>
 </div>
 ))}
 <button 
 onClick={() => setActiveTab('logs')}
 className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim hover:text-amber-primary transition-colors border-t border-border-dim/30 mt-2"
 >
 View Full System History
 </button>
 </div>
 </DashboardSection>
 </div>
 </motion.div>
 )}

 {activeTab === 'dashboard' && (
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
 <span className="text-amber-primary">{user?.name?.split(' ')[0]}</span>
 </h2>
 <p className="text-sm text-text-secondary max-w-md leading-relaxed">
 Your real estate portfolio is performing at peak efficiency. 
 You have <span className="text-text-primary font-bold">{stats.pending} tasks</span> requiring your immediate attention today.
 </p>
 <div className="flex items-center gap-4 pt-2">
 <button 
 onClick={() => setActiveTab('projects')}
 className="px-6 py-3 bg-amber-primary text-bg rounded-xl text-xs font-bold hover:bg-amber-secondary transition-all shadow-lg shadow-amber-primary/20 flex items-center gap-2"
 >
 Explore Projects <ChevronRight size={16} />
 </button>
 <div className="flex -space-x-3">
 {users.slice(0, 4).map((u, i) => (
 <div key={i} className="w-10 h-10 rounded-full border-4 border-surface bg-surface-3 flex items-center justify-center text-xs font-bold text-text-dim overflow-hidden">
 {u.profilePicture ? <img src={u.profilePicture} className="w-full h-full object-cover" /> : u.name[0]}
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
 <div className="text-2xl font-serif font-bold text-text-primary">{stats.liveUsers}</div>
 <div className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Active Users</div>
 <div className="w-8 h-1 bg-green-500 rounded-full mt-1 animate-pulse" />
 </div>
 <div className="bg-surface/40 border border-border-bright p-6 rounded-2xl flex flex-col items-center text-center gap-2">
 <div className="text-2xl font-serif font-bold text-text-primary">{stats.totalProperties}</div>
 <div className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Listings</div>
 <div className="w-8 h-1 bg-amber-primary rounded-full mt-1" />
 </div>
 </div>
 </div>
 </motion.div>

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

 {user?.role === 'admin' && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
 <KpiCard label="Live Users" value={stats.liveUsers} sub="Online Now" icon={User} color="green" />
 <KpiCard label="Team Leaders" value={stats.teamLeaders} sub="Active Leaders" icon={UsersIcon} color="blue" />
 <KpiCard label="Approvals" value={stats.pending} sub="Workflow Tasks" icon={ShieldCheck} color="purple" />
 <KpiCard label="Total Properties" value={stats.totalProperties} sub="All Listings" icon={Home} color="amber" />
 <KpiCard label="Audit Logs" value={stats.totalLogs} sub="System Events" icon={Activity} color="red" />
 </div>
 )}

 <DashboardSection title="Recent Projects" icon={Building2} action={<button onClick={() => setActiveTab('projects')} className="text-[10px] text-amber-primary hover:underline uppercase tracking-widest font-bold">View All</button>}>
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
 setActiveTab('projects');
 }}
 >
 <div className="flex justify-between items-start mb-2">
 <div className="text-[10px] font-mono text-text-dim">{project.id.slice(0, 8)}</div>
 <div className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ${project.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-amber-primary/10 text-amber-primary'}`}>
 {project.status}
 </div>
 </div>
 <h4 className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors truncate">{project.title}</h4>
 <p className="text-[10px] text-text-dim truncate">{project.location}</p>
 <div className="mt-3 pt-3 border-t border-border-dim/30 flex justify-between items-center">
 <span className="text-[10px] font-bold text-amber-primary">₹{(project.price / 10000000).toFixed(2)} Cr</span>
 <span className="text-[9px] text-text-dim uppercase tracking-widest font-bold">{project.type?.replace('FLATS', 'Apartments').replace('Apartment', 'Apartments')}</span>
 </div>
 </motion.div>
 ))}
 {projects.length === 0 && (
 <div className="col-span-full py-12 text-center">
 <Building2 size={32} className="text-text-dim/20 mx-auto mb-2" />
 <p className="text-xs text-text-dim italic">No projects found in database.</p>
 </div>
 )}
 </div>
 </DashboardSection>

 <DashboardSection title="Project Analytics" icon={BarChartIcon}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-surface-2/20 rounded-2xl">
 <div className="flex flex-col items-center bg-surface border border-border-dim rounded-2xl p-6 shadow-sm hover:border-amber-primary/30 transition-all">
 <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-6">Listing Status Breakdown</h4>
 <div className="w-full h-64">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={[
 { name: 'Active', count: projects.filter(p => p.status === 'Active').length },
 { name: 'Sold', count: projects.filter(p => p.status === 'Sold').length },
 { name: 'Pending', count: projects.filter(p => p.status === 'PENDING_DELETE').length },
 ]}>
 <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border-dim/30" vertical={false} />
 <XAxis dataKey="name" stroke="currentColor" className="text-text-dim text-[9px] font-bold" tickLine={false} axisLine={false} />
 <YAxis stroke="currentColor" className="text-text-dim text-[9px] font-bold" tickLine={false} axisLine={false} allowDecimals={false} />
 <Tooltip 
 cursor={{ fill: 'var(--amber-primary)', opacity: 0.05 }}
 contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-dim)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
 itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
 />
 <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
 <Cell fill="#F59E0B" />
 <Cell fill="#10B981" />
 <Cell fill="#8B5CF6" />
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 
 <div className="flex flex-col items-center bg-surface border border-border-dim rounded-2xl p-6 shadow-sm hover:border-blue-500/30 transition-all">
 <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-6">Possession Timelines</h4>
 <div className="w-full h-64">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={[
 { name: 'Ready to Move', count: projects.filter(p => p.possessionStatus === 'Ready to Move').length },
 { name: 'Under Construction', count: projects.filter(p => p.possessionStatus === 'Under Construction').length },
 { name: 'New Launch', count: projects.filter(p => p.possessionStatus === 'New Launch').length },
 ].filter(d => d.count > 0)}
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
 contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-dim)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
 itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
 />
 <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 </DashboardSection>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-8">
 {user?.role === 'admin' ? (
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
 <button onClick={() => setActiveTab('approvals')} className="text-[10px] text-amber-primary hover:underline uppercase tracking-widest font-bold">Queue</button>
 }
 >
 <div className="space-y-3">
 {approvals.slice(0, 3).map((app, idx) => (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.05 }}
 key={app.id} 
 className="flex items-center justify-between p-3.5 bg-surface-2/50 border border-border-bright rounded-xl hover:border-amber-primary/30 transition-all cursor-pointer"
 onClick={() => { setActiveTab('approvals'); playSound('click'); }}
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-amber-primary/10 flex items-center justify-center text-amber-primary shrink-0">
 <ShieldCheck size={14} />
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider truncate">{app.type?.replace(/_/g, ' ')}</span>
 <span className="text-[9px] text-text-dim truncate">By {app.requestedBy}</span>
 </div>
 </div>
 <div className="w-2 h-2 rounded-full bg-amber-primary animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)] shrink-0" />
 </motion.div>
 ))}
 </div>
 </DashboardSection>
 ) : (
 <DashboardSection title="Approvals" icon={ShieldCheck}>
 <div className="h-full flex flex-col items-center justify-center py-10 bg-surface-2/30 rounded-2xl border border-dashed border-border-dim/50 border-spacing-4">
 <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-2">
 <Check size={20} />
 </div>
 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim">Queue Clear</span>
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
 <button onClick={() => setActiveTab('users')} className="text-[10px] text-amber-primary hover:underline uppercase tracking-widest font-bold">Team</button>
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
 onClick={() => { setActiveTab('users'); playSound('click'); }}
 >
 <div className="flex items-center gap-3">
 {u.profilePicture ? (
 <img src={u.profilePicture} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-border-bright" />
 ) : (
 <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-[9px] font-black text-text-primary">
 {u.name[0]}
 </div>
 )}
 <div className="flex flex-col min-w-0">
 <span className="text-[11px] font-bold text-text-primary group-hover:text-amber-primary transition-colors truncate">{u.name}</span>
 <span className="text-[8px] text-text-dim uppercase tracking-widest font-bold">{u.role}</span>
 </div>
 </div>
 <div className={`w-1.5 h-1.5 rounded-full ${idx < 2 ? 'bg-green-500' : 'bg-surface-3'}`} />
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
 <button onClick={() => setActiveTab('logs')} className="text-[10px] text-amber-primary hover:underline uppercase tracking-widest font-bold">View History</button>
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
 onClick={() => { setActiveTab('logs'); playSound('click'); }}
 >
 <div className="flex items-center gap-4">
 <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-text-dim group-hover:text-amber-primary transition-colors">
 <Activity size={14} />
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors uppercase tracking-wider">{log.action?.replace(/_/g, ' ')}</span>
 <span className="text-[10px] text-text-dim italic line-clamp-1">{log.summary}</span>
 </div>
 </div>
 <div className="text-right shrink-0">
 <div className="text-[10px] text-text-secondary font-bold">{log.user}</div>
 <div className="text-[9px] text-text-dim font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
 </div>
 </motion.div>
 ))}
 {logs.length === 0 && (
 <div className="flex flex-col items-center justify-center py-10 text-center">
 <Activity size={32} className="text-text-dim/20 mb-2" />
 <p className="text-xs text-text-dim italic">No activity recorded yet.</p>
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
 <h3 className="text-2xl font-serif font-bold text-text-primary">Welcome to PySync</h3>
 <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
 Your personalized real estate command center. Use the sidebar to navigate through projects, resale listings, and media assets.
 </p>
 </div>
 <button 
 onClick={() => setActiveTab('projects')}
 className="px-8 py-3 bg-surface-2 border border-border-bright rounded-xl text-xs font-bold text-text-primary hover:border-amber-primary transition-all relative z-10"
 >
 Get Started
 </button>
 </div>
 )}
 </div>
 
 <div className="space-y-8">

 <DashboardSection title="System Health" icon={Activity}>
 <div className="space-y-6">
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Storage Connection</span>
 <span className="text-[9px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/30 font-bold">STABLE</span>
 </div>
 <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: '100%' }}
 className="h-full bg-green-500"
 />
 </div>
 </div>

 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Storage Capacity</span>
 <span className="text-[10px] text-text-primary font-mono font-bold">1.2 GB / 10 GB</span>
 </div>
 <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: '12%' }}
 className="h-full bg-amber-primary"
 />
 </div>
 <p className="text-[9px] text-text-dim italic text-right">12% of total quota used</p>
 </div>

 <div className="pt-4 border-t border-border-dim/30 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-green-500" />
 <span className="text-[11px] text-text-secondary">Database Engine</span>
 </div>
 <span className="text-[10px] font-mono text-text-dim">v5.4.2</span>
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-green-500" />
 <span className="text-[11px] text-text-secondary">Auth Service</span>
 </div>
 <span className="text-[10px] font-mono text-text-dim">Active</span>
 </div>
 </div>
 </div>
 </DashboardSection>

 <div className="bg-gradient-to-br from-amber-primary to-amber-secondary p-6 rounded-2xl text-bg shadow-xl shadow-amber-primary/20 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
 <div className="relative z-10 space-y-4">
 <div className="p-2 bg-white/20 rounded-lg w-fit">
 <ShieldCheck size={20} />
 </div>
 <div className="space-y-1">
 <h4 className="text-sm font-bold uppercase tracking-wider">Pro Tip</h4>
 <p className="text-[11px] leading-relaxed opacity-90">
 Use the global search (⌘+K) to quickly find any project or resale listing across all buckets.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {activeTab === 'logs' && <LogsView logs={logs} />}
 {activeTab === 'projects' && (
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
 onClick={() => setViewMode('grid')}
 className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-primary text-bg shadow-lg shadow-amber-primary/20' : 'text-text-dim hover:text-text-primary'}`}
 >
 <LayoutGrid size={18} />
 </button>
 <button 
 onClick={() => setViewMode('table')}
 className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-amber-primary text-bg shadow-lg shadow-amber-primary/20' : 'text-text-dim hover:text-text-primary'}`}
 >
 <List size={18} />
 </button>
 <button 
 onClick={() => setViewMode('map')}
 className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-amber-primary text-bg shadow-lg shadow-amber-primary/20' : 'text-text-dim hover:text-text-primary'}`}
 >
 <MapPin size={18} />
 </button>
 </div>

 <div className="h-8 w-px bg-border-dim hidden lg:block" />

 <div className="flex items-center gap-3">
 <span className="text-[10px] text-text-dim uppercase tracking-widest font-black">Status</span>
 <div className="flex flex-wrap gap-1.5">
 {['All', 'Active', 'Sold', 'Pending', 'PENDING_DELETE'].map(status => (
 <button
 key={status}
 onClick={() => toggleStatusFilter(status)}
 className={`px-3 py-1.5 rounded-lg text-[10px] border transition-all font-bold uppercase tracking-wider ${
 statusFilter.includes(status)
 ? 'bg-amber-primary border-amber-primary text-bg shadow-md shadow-amber-primary/10'
 : 'bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50'
 }`}
 >
 {status === 'PENDING_DELETE' ? 'Del Req' : status}
 </button>
 ))}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-4 w-full lg:w-auto">
 <div className="flex-1 lg:flex-none relative">
 <select 
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value)}
 className="w-full lg:w-48 bg-surface-2 border border-border-bright rounded-xl px-4 py-2 text-xs text-text-primary outline-none focus:border-amber-primary appearance-none font-bold"
 >
 <option value="id">ID (Default)</option>
 <option value="title-asc">Title (A-Z)</option>
 <option value="title-desc">Title (Z-A)</option>
 <option value="price-asc">Price (Low-High)</option>
 <option value="price-desc">Price (High-Low)</option>
 <option value="location-asc">Location (A-Z)</option>
 </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-text-dim pointer-events-none" />
 </div>
 <button
 onClick={() => {
 const filtered = projects.filter(p => 
 (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
 (statusFilter.includes('All') || statusFilter.includes(p.status)) &&
 (possessionFilter.includes('All') || possessionFilter.includes(p.possessionStatus)) &&
 (assignedToFilter === 'All' || p.assignedTo === assignedToFilter) &&
 (bathroomsFilter.length === 0 || (p.bathrooms && String(p.bathrooms).split(', ').some(b => bathroomsFilter.includes(Number(b))))) &&
 (p.price >= priceRangeFilter[0] && p.price <= priceRangeFilter[1])
 );

 const csvContent = "data:text/csv;charset=utf-8," 
 + "ID,Title,Type,Configuration,Possession,Location,Price,Status,Builder,Area,Bathrooms,Assigned To,Created At\n"
 + filtered.map(p => `${p.id},"${p.title}","${p.type}","${p.configuration}","${p.possessionStatus}","${p.location}",${p.price},"${p.status}","${p.builderName || ''}","${p.area || ''}","${p.bathrooms || ''}","${p.assignedTo || ''}","${p.createdAt || ''}"`).join("\n");
 
 const encodedUri = encodeURI(csvContent);
 const link = document.createElement("a");
 link.setAttribute("href", encodedUri);
 link.setAttribute("download", `pysync_projects_${new Date().toISOString().split('T')[0]}.csv`);
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
 onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
 className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${
 showAdvancedFilters 
 ? 'bg-amber-primary border-amber-primary text-bg shadow-lg shadow-amber-primary/20' 
 : 'bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50'
 }`}
 >
 <Filter size={14} /> {showAdvancedFilters ? 'Hide' : 'Filters'}
 </button>
 </div>
 </div>

 {showAdvancedFilters && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-surface p-8 border border-border-dim rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-4 gap-8"
 >
 <div className="space-y-4">
 <div className="flex items-center gap-2 text-amber-primary">
 <User size={16} />
 <span className="text-[10px] font-black uppercase tracking-widest">Assigned Manager</span>
 </div>
 <select 
 value={assignedToFilter}
 onChange={(e) => setAssignedToFilter(e.target.value)}
 className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-primary font-medium"
 >
 <option value="All">All Managers</option>
 {Array.from(new Set(projects.map(p => p.assignedTo).filter(Boolean))).map(name => (
 <option key={name} value={name}>{name}</option>
 ))}
 </select>
 </div>

 <div className="space-y-4">
 <div className="flex items-center gap-2 text-amber-primary">
 <Clock size={16} />
 <span className="text-[10px] font-black uppercase tracking-widest">Possession</span>
 </div>
 <div className="flex flex-wrap gap-2">
 {['All', 'Ready to Move', 'Under Construction', 'New Launch'].map(status => (
 <button
 key={status}
 onClick={() => togglePossessionFilter(status)}
 className={`px-3 py-2 rounded-xl text-[10px] border transition-all font-bold ${
 possessionFilter.includes(status)
 ? 'bg-amber-primary border-amber-primary text-bg shadow-md'
 : 'bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50'
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
 <span className="text-[10px] font-black uppercase tracking-widest">Bathrooms</span>
 </div>
 <div className="flex flex-wrap gap-2">
 {[1, 2, 3, 4, 5].map(count => (
 <button
 key={count}
 onClick={() => toggleBathroomFilter(count)}
 className={`w-10 h-10 rounded-xl text-[10px] border flex items-center justify-center transition-all font-bold ${
 bathroomsFilter.includes(count)
 ? 'bg-amber-primary border-amber-primary text-bg shadow-md'
 : 'bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50'
 }`}
 >
 {count}+
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-4">
 <div className="flex items-center gap-2 text-amber-primary">
 <IndianRupee size={16} />
 <span className="text-[10px] font-black uppercase tracking-widest">Price Range (Lakhs)</span>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1">
 <label className="text-[8px] text-text-dim uppercase font-black">Min</label>
 <input 
 type="number"
 value={priceRangeFilter[0] / 100000}
 onChange={(e) => setPriceRangeFilter([Number(e.target.value) * 100000, priceRangeFilter[1]])}
 className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary font-mono"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[8px] text-text-dim uppercase font-black">Max</label>
 <input 
 type="number"
 value={priceRangeFilter[1] / 100000}
 onChange={(e) => setPriceRangeFilter([priceRangeFilter[0], Number(e.target.value) * 100000])}
 className="w-full bg-surface-2 border border-border-bright rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-amber-primary font-mono"
 />
 </div>
 </div>
 <button 
 onClick={() => {
 setPriceRangeFilter([0, 1000000000]);
 setPossessionFilter(['All']);
 setBathroomsFilter([]);
 setAssignedToFilter('All');
 }}
 className="text-[9px] text-amber-primary hover:underline uppercase font-black tracking-widest"
 >
 Reset Filters
 </button>
 </div>
 </motion.div>
 )}

 {viewMode === 'map' ? (
 <ProjectMapView 
 items={projects.filter(p => 
 (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
 (statusFilter.includes('All') || statusFilter.includes(p.status)) &&
 (possessionFilter.includes('All') || possessionFilter.includes(p.possessionStatus)) &&
 (assignedToFilter === 'All' || p.assignedTo === assignedToFilter) &&
 (bathroomsFilter.length === 0 || (p.bathrooms && String(p.bathrooms).split(', ').some(b => bathroomsFilter.includes(Number(b))))) &&
 (p.price >= priceRangeFilter[0] && p.price <= priceRangeFilter[1])
 )} 
 onSelectItem={(id) => {
 const p = projects.find(proj => proj.id === id);
 if (p) setSelectedProject(p);
 }}
 type="project"
 />
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
 {(() => {
 let filtered = projects.filter(p => 
 (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
 (statusFilter.includes('All') || statusFilter.includes(p.status)) &&
 (possessionFilter.includes('All') || possessionFilter.includes(p.possessionStatus)) &&
 (assignedToFilter === 'All' || p.assignedTo === assignedToFilter) &&
 (bathroomsFilter.length === 0 || (p.bathrooms && String(p.bathrooms).split(', ').some(b => bathroomsFilter.includes(Number(b))))) &&
 (p.price >= priceRangeFilter[0] && p.price <= priceRangeFilter[1])
 );

 if (sortBy === 'price-asc') {
 filtered = [...filtered].sort((a, b) => a.price - b.price);
 } else if (sortBy === 'price-desc') {
 filtered = [...filtered].sort((a, b) => b.price - a.price);
 } else if (sortBy === 'location-asc') {
 filtered = [...filtered].sort((a, b) => a.location.localeCompare(b.location));
 } else if (sortBy === 'location-desc') {
 filtered = [...filtered].sort((a, b) => b.location.localeCompare(a.location));
 } else if (sortBy === 'title-asc') {
 filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
 } else if (sortBy === 'title-desc') {
 filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title));
 } else if (sortBy === 'builder-asc') {
 filtered = [...filtered].sort((a, b) => (a.builderName || '').localeCompare(b.builderName || ''));
 } else if (sortBy === 'builder-desc') {
 filtered = [...filtered].sort((a, b) => (b.builderName || '').localeCompare(a.builderName || ''));
 }
 
 if (filtered.length === 0) {
 return (
 <div className="col-span-full py-24 text-center space-y-4 bg-surface border border-border-dim rounded-2xl border-dashed">
 <div className="p-4 bg-surface-2 rounded-full w-fit mx-auto text-text-dim">
 <Search size={32} />
 </div>
 <p className="text-sm font-bold text-text-primary">No projects found</p>
 <p className="text-xs text-text-dim">Try adjusting your filters or search query.</p>
 </div>
 );
 }

 return filtered.map(p => (
 <ProjectCard 
 key={p.id}
 project={p}
 onClick={setSelectedProject}
 onEdit={(p: any) => { setEditingProject(p); setIsModalOpen(true); }}
 onDelete={setProjectToDelete}
 hasEditPermission={true}
 hasDeletePermission={true}
 isSelected={selectedProjectIds.includes(p.id)}
 onSelect={(id: string) => {
 setSelectedProjectIds(prev => 
 prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
 );
 }}
 />
 ));
 })()}
 </div>
 ) : (
 <div className="bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-xl">
 <div className="overflow-x-auto no-scrollbar">
 <table className="w-full text-left border-separate border-spacing-0">
 <thead>
 <tr className="bg-surface-2/30">
 <th className="px-6 py-4 w-12 border-b border-border-dim first:rounded-tl-2xl">
 <div 
 className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
 projects.length > 0 && selectedProjectIds.length === projects.length ? 'bg-amber-primary border-amber-primary' : 'bg-surface-3 border-border-bright hover:border-amber-primary/50'
 }`}
 onClick={() => {
 if (selectedProjectIds.length === projects.length) {
 setSelectedProjectIds([]);
 } else {
 setSelectedProjectIds(projects.map(p => p.id));
 }
 }}
 >
 {selectedProjectIds.length === projects.length && projects.length > 0 && <Check size={12} className="text-bg font-black" />}
 {selectedProjectIds.length > 0 && selectedProjectIds.length < projects.length && <div className="w-2 h-0.5 bg-amber-primary" />}
 </div>
 </th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim">
 <div className="flex items-center gap-2">
 <Zap size={12} className="text-amber-primary/50" />
 Ref ID
 </div>
 </th>
 <th 
 className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim cursor-pointer hover:text-text-primary transition-colors hover:bg-surface-3/30"
 onClick={() => setSortBy(sortBy === 'title-asc' ? 'title-desc' : 'title-asc')}
 >
 <div className="flex items-center gap-2">
 <Building2 size={12} className="text-amber-primary/50" />
 Project Title {sortBy === 'title-asc' ? '↑' : sortBy === 'title-desc' ? '↓' : ''}
 </div>
 </th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim hidden sm:table-cell">
 <div className="flex items-center gap-2">
 <Layers size={12} className="text-amber-primary/50" />
 Type
 </div>
 </th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim hidden md:table-cell">
 <div className="flex items-center gap-2">
 <Clock size={12} className="text-amber-primary/50" />
 Possession
 </div>
 </th>
 <th 
 className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim hidden lg:table-cell cursor-pointer hover:text-text-primary transition-colors hover:bg-surface-3/30"
 onClick={() => setSortBy(sortBy === 'location-asc' ? 'location-desc' : 'location-asc')}
 >
 <div className="flex items-center gap-2">
 <MapPin size={12} className="text-amber-primary/50" />
 Location {sortBy === 'location-asc' ? '↑' : sortBy === 'location-desc' ? '↓' : ''}
 </div>
 </th>
 <th 
 className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim cursor-pointer hover:text-text-primary transition-colors hover:bg-surface-3/30"
 onClick={() => setSortBy(sortBy === 'price-asc' ? 'price-desc' : 'price-asc')}
 >
 <div className="flex items-center gap-2">
 <IndianRupee size={12} className="text-amber-primary/50" />
 Price {sortBy === 'price-asc' ? '↑' : sortBy === 'price-desc' ? '↓' : ''}
 </div>
 </th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim">
 <div className="flex items-center gap-2">
 <Activity size={12} className="text-amber-primary/50" />
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
 let filtered = projects.filter(p => 
 (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.type.replace('FLATS', 'Apartments').replace('Apartment', 'Apartments').toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
 (statusFilter.includes('All') || statusFilter.includes(p.status)) &&
 (possessionFilter.includes('All') || possessionFilter.includes(p.possessionStatus)) &&
 (assignedToFilter === 'All' || p.assignedTo === assignedToFilter) &&
 (bathroomsFilter.length === 0 || (p.bathrooms && String(p.bathrooms).split(', ').some(b => bathroomsFilter.includes(Number(b))))) &&
 (p.price >= priceRangeFilter[0] && p.price <= priceRangeFilter[1])
 );

 if (sortBy === 'price-asc') {
 filtered = [...filtered].sort((a, b) => a.price - b.price);
 } else if (sortBy === 'price-desc') {
 filtered = [...filtered].sort((a, b) => b.price - a.price);
 } else if (sortBy === 'location-asc') {
 filtered = [...filtered].sort((a, b) => a.location.localeCompare(b.location));
 } else if (sortBy === 'location-desc') {
 filtered = [...filtered].sort((a, b) => b.location.localeCompare(a.location));
 } else if (sortBy === 'title-asc') {
 filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
 } else if (sortBy === 'title-desc') {
 filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title));
 }
 
 if (filtered.length === 0) {
 return (
 <tr>
 <td colSpan={8} className="p-16 text-center text-text-dim text-xs italic">
 No projects matching the current filters.
 </td>
 </tr>
 );
 }

 return filtered.map((p, index) => (
 <tr 
 key={p.id} 
 onClick={() => setSelectedProject(p)}
 className={`group transition-all duration-300 cursor-pointer ${
 selectedProjectIds.includes(p.id) ? 'bg-amber-primary/[0.03]' :
 index % 2 === 0 ? 'bg-surface' : 'bg-surface-2/20'
 } hover:bg-surface-3/80`}
 >
 <td className="px-6 py-4 border-b border-border-dim/30">
 <div 
 className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
 selectedProjectIds.includes(p.id) ? 'bg-amber-primary border-amber-primary' : 'bg-surface-3 border-border-bright hover:border-amber-primary/50'
 }`}
 onClick={(e) => {
 e.stopPropagation();
 setSelectedProjectIds(prev => 
 prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id]
 );
 }}
 >
 {selectedProjectIds.includes(p.id) && <Check size={12} className="text-bg font-black" />}
 </div>
 </td>
 <td className="px-6 py-4 border-b border-border-dim/30 font-mono text-[10px] text-text-dim uppercase tracking-wider relative">
 {p.status === 'Active' && (
 <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-r-full shadow-[2px_0_10px_rgba(16,185,129,0.5)]" />
 )}
 {p.id.slice(0, 8)}
 </td>
 <td className="px-6 py-4 border-b border-border-dim/30 min-w-[240px]">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-text-primary group-hover:text-amber-primary transition-colors leading-tight">{p.title}</span>
 <span className="text-[9px] text-text-dim uppercase tracking-[0.15em] font-bold mt-1 opacity-70">{p.builderName || 'General'}</span>
 </div>
 </td>
 <td className="px-6 py-4 border-b border-border-dim/30 text-xs text-text-secondary hidden sm:table-cell font-medium">
 <div className="flex flex-col">
 <span className="text-text-primary font-semibold">{p.type.replace('FLATS', 'Apartments').replace('Apartment', 'Apartments')}</span>
 <span className="text-[10px] text-text-dim">{(p.configuration || 'Standard').replace('5BHK', 'Penthouse')}</span>
 </div>
 </td>
 <td className="px-6 py-4 border-b border-border-dim/30 hidden md:table-cell">
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
 p.possessionStatus === 'Ready to Move' ? 'border-green-500/20 bg-green-500/5 text-green-500' :
 p.possessionStatus === 'Under Construction' ? 'border-amber-500/20 bg-amber-500/5 text-amber-500' :
 'border-blue-500/20 bg-blue-500/5 text-blue-500'
 }`}>
 <div className={`w-1 h-1 rounded-full mr-1.5 ${
 p.possessionStatus === 'Ready to Move' ? 'bg-green-500' :
 p.possessionStatus === 'Under Construction' ? 'bg-amber-500' :
 'bg-blue-500'
 }`} />
 {p.possessionStatus}
 </span>
 {p.possessionDate && (
 <div className="flex flex-col text-[8px] pl-1 border-l border-border-dim/50 ml-1 mt-1">
 <span className="text-text-dim uppercase font-bold tracking-tighter">
 {p.possessionStatus === 'Ready to Move' ? 'Ready Since' : 'Expected'}
 </span>
 <span className="text-text-secondary font-bold">
 {(() => {
 const target = new Date(p.possessionDate);
 const now = new Date();
 const diffTime = target.getTime() - now.getTime();
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
 if (diffDays > 0) return `${diffDays}d left (${target.toLocaleDateString()})`;
 if (diffDays === 0) return 'Ready Today';
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
 <span className="text-xs text-text-dim group-hover/loc:text-text-primary group-hover/loc:underline transition-all line-clamp-1">{p.location}</span>
 </a>
 </td>
 <td className="px-6 py-4 border-b border-border-dim/30">
 <div className="flex flex-col">
 <span className="text-sm font-mono font-black text-text-primary">{formatPrice(p.price)}</span>
 <span className="text-[9px] text-text-dim uppercase font-bold tracking-tighter">Total Value</span>
 </div>
 </td>
 <td className="px-6 py-4 border-b border-border-dim/30">
 <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${
 p.status === 'Active' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)]' :
 p.status === 'PENDING_DELETE' ? 'border-red-500/20 bg-red-500/5 text-red-500' :
 'border-amber-500/20 bg-amber-500/5 text-amber-500'
 }`}>
 {p.status === 'Active' && (
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
  onClick={() => setSelectedProject(p)}
  className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-all"
  title="Quick View"
  >
  <Eye size={14} />
  </button>
  <button 
  onClick={(e) => { e.stopPropagation(); setEditingProject(p); setIsModalOpen(true); }}
  className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
  title="Edit Project"
  >
  <Edit size={14} />
  </button>
  <button 
  onClick={(e) => { e.stopPropagation(); setProjectToDelete(p); }}
  className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
  title="Delete Project"
  >
  <Trash2 size={14} />
  </button>
  </div>
  </td>
 </tr>
 ));
 })()}
 </tbody>
 </table>
 </div>
 </div>
 )}

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
 <span className="text-xs font-bold text-text-primary uppercase tracking-widest shrink-0">Selected</span>
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

 {activeTab === 'resale' && (
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
 onClick={() => setViewMode('grid')}
 className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-primary text-bg shadow-lg shadow-amber-primary/20' : 'text-text-dim hover:text-text-primary'}`}
 >
 <LayoutGrid size={18} />
 </button>
 <button 
 onClick={() => setViewMode('table')}
 className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-amber-primary text-bg shadow-lg shadow-amber-primary/20' : 'text-text-dim hover:text-text-primary'}`}
 >
 <List size={18} />
 </button>
 <button 
 onClick={() => setViewMode('map')}
 className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-amber-primary text-bg shadow-lg shadow-amber-primary/20' : 'text-text-dim hover:text-text-primary'}`}
 >
 <MapPin size={18} />
 </button>
 </div>

 <div className="h-8 w-px bg-border-dim hidden lg:block" />

 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
 <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Status:</span>
 <div className="flex flex-wrap gap-1">
 {['All', 'Active', 'Sold', 'Pending', 'PENDING_DELETE'].map(status => (
 <button
 key={status}
 onClick={() => toggleStatusFilter(status)}
 className={`px-2 py-1 rounded text-[10px] border transition-all ${
 statusFilter.includes(status)
 ? 'bg-amber-primary border-amber-primary text-bg font-bold'
 : 'bg-surface-2 border-border-bright text-text-dim hover:border-amber-primary/50'
 }`}
 >
 {status === 'PENDING_DELETE' ? 'Del Req' : status}
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
 const filtered = resaleProperties.filter(p => 
 (p.propertyHolderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.societyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
 (statusFilter.includes('All') || statusFilter.includes(p.status))
 );

 const csvContent = "data:text/csv;charset=utf-8," 
 + "ID,Holder Name,Society,Location,Builder,Type,Size(Sqft),BHK,Price,Negotiable,Floor,Age,Possession Status,Possession Date,Status\n"
 + filtered.map(p => `${p.id},"${p.propertyHolderName}","${p.societyName}","${p.location}","${p.builderName}","${p.propertyType.replace('FLATS', 'Apartments').replace('Apartment', 'Apartments')}",${p.sizeSqft},"${p.bhk.includes('BHK') || p.bhk.includes('Penthouse') ? p.bhk.replace('5BHK', 'Penthouse') : `${p.bhk} BHK`}",${p.price},${p.isNegotiable},"${p.floorNumber}","${p.propertyAge}","${p.possessionStatus || 'N/A'}","${p.possessionDate || 'N/A'}",${p.status}`).join("\n");
 
 const encodedUri = encodeURI(csvContent);
 const link = document.createElement("a");
 link.setAttribute("href", encodedUri);
 link.setAttribute("download", `pysync_resale_${new Date().toISOString().split('T')[0]}.csv`);
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

 {viewMode === 'map' ? (
 <ProjectMapView 
 items={resaleProperties.filter(p => 
 (p.propertyHolderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.societyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
 (statusFilter.includes('All') || statusFilter.includes(p.status))
 )} 
 onSelectItem={(id) => {
 const p = resaleProperties.find(prop => prop.id === id);
 if (p) setSelectedResale(p);
 }}
 type="resale"
 />
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
 {resaleProperties.filter(p => 
 (p.propertyHolderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.societyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
 (statusFilter.includes('All') || statusFilter.includes(p.status))
 ).map((p) => (
 <div 
 key={p.id}
 onClick={() => setSelectedResale(p)}
 className="bg-surface border border-border-dim rounded-2xl overflow-hidden hover:border-amber-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-xl"
 >
 <div className="aspect-video bg-surface-2 relative overflow-hidden">
 {p.images && p.images.length > 0 ? (
 <img src={p.images[0].data} alt={p.societyName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-text-dim/20">
 <Home size={48} />
 </div>
 )}
 <div className="absolute top-3 right-3 bg-bg/80 px-2 py-1 rounded-lg text-[10px] font-bold text-amber-primary border border-border-dim uppercase tracking-wider">
 {p.propertyType.replace('FLATS', 'Apartments').replace('Apartment', 'Apartments')}
 </div>
 </div>
 <div className="p-4 space-y-3">
 <div>
 <h3 className="font-bold text-text-primary group-hover:text-amber-primary transition-colors line-clamp-1">{p.societyName}</h3>
 <p className="text-[10px] text-text-dim flex items-center gap-1 mt-1 font-medium">
 <MapPin size={10} /> {p.location}
 </p>
 </div>
 <div className="flex items-center justify-between pt-3 border-t border-border-dim/50">
 <span className="text-sm font-black text-text-primary">{formatPrice(p.price)}</span>
 <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
 {p.bhk.includes('BHK') || p.bhk.includes('Penthouse') ? p.bhk.replace('5BHK', 'Penthouse') : `${p.bhk} BHK`}
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] ">
 <div className="overflow-x-auto no-scrollbar">
 <table className="w-full text-left border-separate border-spacing-0">
 <thead>
 <tr className="bg-surface-2/30">
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim first:rounded-tl-2xl">Society & Holder</th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black hidden sm:table-cell border-b border-border-dim">Configuration</th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black hidden md:table-cell border-b border-border-dim">Possession</th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black hidden md:table-cell border-b border-border-dim">Location</th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim">Price</th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim">Status</th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black text-right border-b border-border-dim last:rounded-tr-2xl">Actions</th>
 </tr>
 </thead>
 <tbody>
 {(() => {
 const filtered = resaleProperties.filter(p => 
 (p.propertyHolderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.societyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.propertyType.toLowerCase().includes(searchQuery.toLowerCase()) ||
 p.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
 (statusFilter.includes('All') || statusFilter.includes(p.status)) &&
 (possessionFilter.includes('All') || possessionFilter.includes(p.possessionStatus))
 );

 if (filtered.length === 0) {
 return (
 <tr>
 <td colSpan={6} className="p-20 text-center">
 <div className="flex flex-col items-center gap-4">
 <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center text-text-dim/30">
 <Search size={32} />
 </div>
 <div className="space-y-1">
 <p className="text-sm font-bold text-text-primary">No listing projects found</p>
 <p className="text-[10px] text-text-dim uppercase tracking-widest">Try adjusting your filters or search query</p>
 </div>
 </div>
 </td>
 </tr>
 );
 }

 return filtered.map((p, index) => {
 const cellPadding = compactMode ? 'px-6 py-3' : 'px-6 py-4';
 return (
 <tr 
 key={p.id} 
 className={`group transition-all duration-300 ${
 index % 2 === 0 ? 'bg-surface' : 'bg-surface-2/20'
 } hover:bg-surface-3/80 cursor-pointer relative`}
 onClick={() => setSelectedResale(p)}
 >
 <td className={`${cellPadding} border-b border-border-dim/30 relative overflow-hidden min-w-[240px]`}>
 {/* Scanning Line Animation */}
 <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-amber-primary/5 to-transparent " />
 </div>
 <div className="flex items-center gap-4 relative z-10">
 <div className="w-10 h-10 rounded-xl bg-amber-primary/10 flex items-center justify-center text-amber-primary border border-amber-primary/20 group-hover:scale-110 transition-transform shrink-0">
 <Home size={20} />
 </div>
 <div className="flex flex-col">
 <span className="text-sm font-bold text-text-primary group-hover:text-amber-primary transition-colors leading-tight">{p.societyName}</span>
 <span className="text-[10px] text-text-dim font-medium mt-1">{p.propertyHolderName}</span>
 </div>
 </div>
 </td>
 <td className={`${cellPadding} border-b border-border-dim/30 hidden sm:table-cell`}>
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-text-primary">{p.bhk.includes('BHK') || p.bhk.includes('Penthouse') ? p.bhk.replace('5BHK', 'Penthouse') : `${p.bhk} BHK`} • {p.propertyType.replace('FLATS', 'Apartments').replace('Apartment', 'Apartments')}</span>
 <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono">{p.sizeSqft} SQ FT {p.bathrooms ? `• ${p.bathrooms} Baths` : ''}</span>
 </div>
 </td>
 <td className={`${cellPadding} border-b border-border-dim/30 hidden md:table-cell`}>
 <div className="flex flex-col">
 <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-border-dim mb-1 ${
 p.possessionStatus === 'Ready to Move' ? 'text-green-500 bg-green-500/5' : 'text-amber-500 bg-amber-500/5'
 }`}>
 {p.possessionStatus || 'N/A'}
 </span>
 {p.possessionDate && (
 <span className="text-[9px] text-text-dim font-bold">
 {(() => {
 const target = new Date(p.possessionDate);
 const now = new Date();
 const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
 if (diffDays > 0) return `${diffDays}d Left`;
 if (diffDays === 0) return 'Ready Today';
 return target.toLocaleDateString();
 })()}
 </span>
 )}
 </div>
 </td>
 <td className={`${cellPadding} border-b border-border-dim/30 hidden md:table-cell min-w-[180px]`}>
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
 <span className="text-xs text-text-dim group-hover/loc:text-text-primary group-hover/loc:underline transition-all line-clamp-1">{p.location}</span>
 </a>
 </td>
 <td className={`${cellPadding} border-b border-border-dim/30`}>
 <div className="flex flex-col">
 <span className="text-sm font-mono font-black text-text-primary">{formatPrice(p.price)}</span>
 <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-tighter">{p.isNegotiable}</span>
 </div>
 </td>
 <td className={`${cellPadding} border-b border-border-dim/30`}>
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
 p.status === 'Active' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' :
 p.status === 'Sold' ? 'border-blue-500/20 bg-blue-500/5 text-blue-500' :
 p.status === 'PENDING_DELETE' ? 'border-red-500/20 bg-red-500/5 text-red-500' :
 'border-amber-500/20 bg-amber-500/5 text-amber-500'
 }`}>
 <div className={`w-1 h-1 rounded-full ${
 p.status === 'Active' ? 'bg-emerald-500' :
 p.status === 'Sold' ? 'bg-blue-500' :
 'bg-amber-500'
 }`} />
 {p.status}
 </span>
 </td>
 <td className={`${cellPadding} border-b border-border-dim/30 text-right`}>
  <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
  <button 
  onClick={(e) => { e.stopPropagation(); setSelectedResale(p); }}
  className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-all"
  title="View Details"
  >
  <Eye size={14} />
  </button>
  <button 
  onClick={(e) => { 
  e.stopPropagation(); 
  setEditingResale(p); 
  setEntryType('resale');
  setIsModalOpen(true);
  }}
  className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
  title="Edit Property"
  >
  <Edit size={14} />
  </button>
  <button 
  onClick={(e) => { e.stopPropagation(); setResaleToDelete(p); }}
  className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
  title="Delete Property"
  >
  <Trash2 size={14} />
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
 </div>
 )}
 </motion.div>
 )}

 {activeTab === 'media' && (
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
 <FolderOpen className="text-amber-primary" size={24} />
 </div>
 Media Explorer
 </h2>
 <p className="text-xs text-text-dim mt-1">Manage and browse project assets across cloud storage buckets</p>
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
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors" size={14} />
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
 <ChevronRight size={14} className="text-text-dim/30" />
 <span className="text-amber-primary truncate max-w-[200px] bg-amber-primary/10 px-2 py-0.5 rounded">
 {projects.find(p => p.id === selectedFolder)?.title}
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
 <h3 className="text-xl font-bold text-text-primary">Activity Reports</h3>
 </div>
 </div>
 <LogsView 
 logs={logs} 
 user={user} 
 isLive={true} 
 onExport={(exportLogs) => {
 const csvContent = "Timestamp,User,Action,Summary\n" + 
 exportLogs.map(l => `${new Date(l.timestamp).toLocaleString()},"${l.user}","${l.action}","${l.summary}"`).join("\n");
 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
 const link = document.createElement('a');
 const url = URL.createObjectURL(blob);
 link.setAttribute('href', url);
 link.setAttribute('download', `full_report_${new Date().toISOString().split('T')[0]}.csv`);
 link.style.visibility = 'hidden';
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 }}
 />
 </div>
 ) : !selectedFolder ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
 {projects.map(p => (
 <motion.button 
 whileHover={{ y: -4, scale: 1.02 }}
 key={p.id}
 onClick={() => setSelectedFolder(p.id)}
 className="flex flex-col items-start p-6 rounded-2xl border border-border-dim bg-surface hover:border-amber-primary/50 hover:shadow-xl hover:shadow-amber-primary/10 transition-all group relative overflow-hidden text-left"
 >
 <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-primary/5 rounded-full blur-3xl group-hover:bg-amber-primary/15 transition-colors duration-500" />
 
 <div className="flex items-start justify-between w-full mb-6 relative z-10">
 <div className="relative w-10 h-10">
 <Folder size={40} className="text-amber-primary/70 group-hover:opacity-0 transition-opacity duration-300 absolute top-0 left-0" />
 <FolderOpen size={40} className="text-amber-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-0 left-0" />
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
 <h3 className="text-base font-bold text-text-primary line-clamp-1 group-hover:text-amber-primary transition-colors">{p.title}</h3>
 <div className="flex items-center gap-2 text-[11px] text-text-dim font-medium">
 <span className="truncate max-w-[120px]">{p.builderName || 'General'}</span>
 <span className="w-1 h-1 rounded-full bg-border-bright" />
 <span className="font-mono uppercase tracking-wider">{p.id.slice(0, 6)}</span>
 </div>
 </div>

 <div className="mt-6 pt-4 border-t border-border-dim/50 w-full flex items-center justify-between relative z-10">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2 text-[10px] text-text-dim uppercase tracking-widest font-bold">
 <Clock size={12} />
 Updated Recently
 </div>
 <div className="text-[9px] text-text-dim/60 font-mono">
 Created: {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
 </div>
 </div>
 <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center group-hover:bg-amber-primary group-hover:text-bg transition-colors">
 <ChevronRight size={14} className="translate-x-0 group-hover:translate-x-0.5 transition-transform" />
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
 <Settings size={18} className="text-blue-500" />
 </div>
 <h3 className="text-sm font-bold text-text-primary">Project Actions</h3>
 </div>
 
 <div className="flex items-center gap-2">
 <button 
 onClick={() => setSelectedProject(projects.find(p => p.id === selectedFolder) || null)}
 className="flex items-center gap-2 bg-surface-2 border border-border-bright text-text-primary px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:border-amber-primary hover:text-amber-primary transition-all"
 >
 <Eye size={14} /> View Details
 </button>
 {hasPermission(user, 'EDIT_PROJECTS') && (user?.role === 'admin' || user?.role === 'team_leader') && (
 <button 
 onClick={() => {
 const p = projects.find(p => p.id === selectedFolder);
 if (p) { setEditingProject(p); setIsModalOpen(true); }
 }}
 className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all"
 >
 <Edit size={14} /> Edit
 </button>
 )}
 {(hasPermission(user, 'DELETE_PROJECTS') || hasPermission(user, 'REQUEST_DELETION')) && (user?.role === 'admin' || user?.role === 'team_leader') && (
 <button 
 onClick={() => {
 const p = projects.find(p => p.id === selectedFolder);
 if (p) setProjectToDelete(p);
 }}
 className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
 >
 <Trash2 size={14} /> Delete
 </button>
 )}
 {hasPermission(user, 'ADD_PROJECTS') && (
 <button 
 onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
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
 <FileText size={18} className="text-amber-primary" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-text-primary">Project Documents</h3>
 <p className="text-[10px] text-text-dim mt-0.5">
 {projects.find(p => p.id === selectedFolder)?.pdfs?.length || 0} Files available
 </p>
 </div>
 </div>
 <button 
 onClick={() => fileInputRef.current?.click()}
 className="flex items-center gap-2 bg-amber-primary text-bg px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-secondary transition-colors shadow-lg shadow-amber-primary/20"
 >
 <Plus size={14} />
 Upload File
 </button>
 <input 
 type="file" 
 ref={fileInputRef} 
 onChange={(e) => handleMediaUpload(e, 'pdfs')} 
 className="hidden" 
 accept=".pdf"
 />
 </div>
 
 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
 {(() => {
 const project = projects.find(p => p.id === selectedFolder);
 if (!project || !project.pdfs || project.pdfs.length === 0) {
 return (
 <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-surface-2/30 rounded-2xl border-2 border-dashed border-border-dim hover:border-amber-primary/30 hover:bg-surface-2/50 transition-all cursor-pointer group">
 <div className="p-5 bg-surface-3 rounded-full mb-4 group-hover:scale-110 group-hover:bg-amber-primary/10 transition-all">
 <FileQuestion size={40} className="text-text-dim group-hover:text-amber-primary transition-colors" />
 </div>
 <h3 className="text-sm font-bold text-text-primary mb-1">No Documents Found</h3>
 <p className="text-xs text-text-secondary max-w-[250px] mb-6">This project has no uploaded PDF documents. Click below or drag and drop to upload.</p>
 <button 
 onClick={() => fileInputRef.current?.click()}
 className="px-6 py-2.5 bg-surface border border-border-bright rounded-xl text-xs font-bold text-text-primary hover:border-amber-primary hover:text-amber-primary transition-all shadow-sm"
 >
 Browse Files
 </button>
 </div>
 );
 }
 
 const uniquePdfs: any[] = [];
 const seenNames = new Set();
 project.pdfs.forEach(pdf => {
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
 <span className="text-sm font-bold text-text-primary truncate group-hover:text-amber-primary transition-colors" title={pdf.name}>{pdf.name}</span>
 <div className="flex items-center gap-2 mt-1.5">
 <span className="text-[10px] text-text-dim font-mono bg-surface-2 px-1.5 py-0.5 rounded">{(pdf.size / 1024 / 1024).toFixed(2)} MB</span>
 <span className="w-1 h-1 rounded-full bg-border-bright" />
 <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">PDF</span>
 </div>
 </div>
 </div>
 <div className="px-4 py-3 bg-surface-2/50 border-t border-border-dim/50 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
 <span className="text-[9px] text-text-dim font-mono">Added recently</span>
 <div className="flex items-center gap-1">
 <button 
 className="p-1.5 text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-md transition-all"
 title="Preview"
 >
 <Eye size={14} />
 </button>
 <button 
 onClick={() => {
 const link = document.createElement('a');
 link.href = pdf.data;
 link.download = pdf.name;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 showToast('Downloading document...', 'info');
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
 <h3 className="text-sm font-bold text-text-primary tracking-tight">Visual Portfolio</h3>
 <p className="text-[10px] text-text-dim mt-0.5 font-mono uppercase tracking-widest">
 {projects.find(p => p.id === selectedFolder)?.images?.length || 0} High-Res Assets
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => imageInputRef.current?.click()}
 className="flex items-center gap-2 px-3 py-1.5 bg-amber-primary/10 border border-amber-primary/20 rounded-lg text-[10px] font-bold text-amber-primary hover:bg-amber-primary hover:text-bg transition-all"
 >
 <Plus size={12} />
 Add Image
 </button>
 <input 
 type="file" 
 ref={imageInputRef} 
 onChange={(e) => handleMediaUpload(e, 'images')} 
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
 const project = projects.find(p => p.id === selectedFolder);
 if (!project || !project.images || project.images.length === 0) {
 return (
 <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-surface-2/20 rounded-3xl border-2 border-dashed border-border-dim/50">
 <div className="w-12 h-12 bg-surface-3 rounded-2xl flex items-center justify-center text-text-dim mb-4">
 <ImageIcon size={24} />
 </div>
 <p className="text-[11px] text-text-dim uppercase font-bold tracking-[0.2em]">No visual assets</p>
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
 <img src={img.data} alt={img.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
 <div className="flex items-center justify-between">
 <div className="min-w-0">
 <p className="text-[10px] text-white font-bold truncate">{img.name}</p>
 <p className="text-[8px] text-white/60 uppercase tracking-widest mt-0.5">{(img.size / (1024 * 1024)).toFixed(1)} MB</p>
 </div>
 <button 
 onClick={() => {
 const link = document.createElement('a');
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
 <Building2 size={14} className="text-amber-primary" />
 Builder Profile
 </h3>
 {(() => {
 const project = selectedFolder ? projects.find(p => p.id === selectedFolder) : null;
 
 if (!project) {
 return (
 <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-primary/10 transition-colors" />
 <div className="flex items-center gap-4 relative z-10">
 <div className="w-12 h-12 bg-surface-2 border border-border-bright rounded-2xl flex items-center justify-center text-amber-primary shadow-inner">
 <Building2 size={24} />
 </div>
 <div>
 <h4 className="text-sm font-bold text-text-primary tracking-tight">Builder Directory</h4>
 <p className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-mono">{allBuilders.length} Active Developers</p>
 </div>
 </div>
 <div className="space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1 relative z-10">
 {allBuilders.map(builder => (
 <button 
 key={builder} 
 onClick={() => setSelectedBuilder(builder)}
 className="w-full p-4 bg-surface-2/50 border border-border-bright/50 rounded-2xl flex items-center justify-between group/item hover:border-amber-primary/40 hover:bg-surface-3 transition-all duration-300"
 >
 <div className="flex flex-col items-start">
 <span className="text-[12px] font-bold text-text-secondary group-hover/item:text-amber-primary transition-colors">{builder}</span>
 <span className="text-[9px] text-text-dim uppercase tracking-widest mt-0.5">Premier Partner</span>
 </div>
 <div className="flex flex-col items-end">
 <span className="text-[10px] font-mono text-text-primary">{projects.filter(p => p.builderName === builder).length}</span>
 <span className="text-[8px] text-text-dim uppercase">Assets</span>
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
 
 const builderProjects = projects.filter(p => p.builderName === project.builderName);
 
 return (
 <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-primary/50 to-transparent" />
 
 <div className="flex items-start justify-between pb-5 border-b border-border-dim/50">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 bg-amber-primary/10 border border-amber-primary/20 rounded-2xl flex items-center justify-center text-amber-primary shadow-lg shadow-amber-primary/5">
 <Building2 size={28} />
 </div>
 <div>
 <h4 className="text-lg font-serif font-bold text-text-primary leading-tight">{project.builderName}</h4>
 <div className="flex items-center gap-2 mt-1">
 <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded text-[9px] text-green-500 font-bold uppercase tracking-wider border border-green-500/20">
 <ShieldCheck size={10} />
 Verified
 </div>
 <span className="text-[10px] text-text-dim font-mono">EST. 1984</span>
 </div>
 </div>
 </div>
 </div>
 
 <div className="space-y-4">
 <div className="flex items-center justify-between px-1">
 <h5 className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-bold">Active Portfolio</h5>
 <div className="flex items-center gap-1.5">
 <div className="w-1.5 h-1.5 rounded-full bg-amber-primary" />
 <span className="text-[10px] font-mono text-text-primary">{builderProjects.length} Units</span>
 </div>
 </div>
 
 <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
 {builderProjects.map(bp => (
 <button
 key={bp.id}
 onClick={() => setSelectedFolder(bp.id)}
 className={`w-full text-left p-4 rounded-2xl text-[12px] transition-all duration-300 flex items-center justify-between group border ${
 bp.id === selectedFolder 
 ? 'bg-amber-primary/10 text-amber-primary border-amber-primary/30 shadow-lg shadow-amber-primary/5' 
 : 'bg-surface-2/50 hover:bg-surface-3 text-text-secondary border-border-bright/50 hover:border-amber-primary/20'
 }`}
 >
 <div className="flex items-center gap-4 overflow-hidden">
 <div className={`w-2 h-2 rounded-full shadow-sm ${bp.status === 'Active' ? 'bg-green-500 shadow-green-500/50' : 'bg-amber-500 shadow-amber-500/50'}`} />
 <div className="flex flex-col overflow-hidden">
 <span className="truncate font-bold tracking-tight">{bp.title}</span>
 <span className="text-[9px] text-text-dim uppercase tracking-widest mt-0.5">{bp.location.split(',')[1] || bp.location}</span>
 </div>
 </div>
 <div className={`p-1.5 rounded-lg transition-all ${bp.id === selectedFolder ? 'bg-amber-primary text-surface rotate-0' : 'bg-surface-3 text-text-dim opacity-0 group-hover:opacity-100 -rotate-90'}`}>
 <ChevronRight size={14} />
 </div>
 </button>
 ))}
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-3">
 <button 
 onClick={() => setSelectedBuilder(project.builderName!)}
 className="py-3 bg-surface-2 border border-border-bright rounded-2xl text-[10px] font-bold text-text-primary uppercase tracking-widest hover:border-amber-primary hover:bg-surface-3 transition-all flex items-center justify-center gap-2 shadow-sm"
 >
 <Globe size={14} className="text-amber-primary" />
 Website
 </button>
 <button 
 className="py-3 bg-amber-primary text-surface rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-secondary transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-primary/20"
 >
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
 <Activity size={14} className="text-amber-primary" />
 Market Intelligence
 </h3>
 {(() => {
 const project = selectedFolder ? projects.find(p => p.id === selectedFolder) : null;
 
 const relatedReports = project 
 ? reports.filter(r => 
 r.title.toLowerCase().includes(project.title.toLowerCase()) || 
 r.content.toLowerCase().includes(project.title.toLowerCase())
 )
 : reports.slice(0, 5);

 return (
 <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(245,158,11,0.03)_0%,transparent_50%)]" />
 
 <div className="flex items-center justify-between pb-4 border-b border-border-dim/50 relative z-10">
 <p className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-bold">
 {project ? 'Project Insights' : 'Global Intelligence'}
 </p>
 <div className="flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-amber-primary animate-pulse" />
 <span className="text-[10px] font-mono text-text-primary">{relatedReports.length} Signals</span>
 </div>
 </div>

 {relatedReports.length === 0 ? (
 <div className="py-16 text-center bg-surface-2/20 rounded-2xl border border-border-dim/50 border-dashed relative z-10">
 <ClipboardList size={28} className="text-text-dim/20 mx-auto mb-3" />
 <p className="text-[11px] text-text-dim/60 uppercase tracking-widest font-bold">No signals detected</p>
 </div>
 ) : (
 <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1 relative z-10">
 {relatedReports.map(report => (
 <div key={report.id} className="bg-surface-2/50 border border-border-bright/50 p-4 rounded-2xl hover:border-amber-primary/30 hover:bg-surface-3 transition-all duration-300 group">
 <div className="flex items-start justify-between mb-4">
 <div className="flex flex-col gap-1.5 min-w-0">
 <div className="flex items-center gap-2">
 <div className={`w-1.5 h-1.5 rounded-full ${
 report.status === 'Final' ? 'bg-green-500' : 'bg-amber-500'
 }`} />
 <span className="text-[12px] font-bold text-text-primary truncate group-hover:text-amber-primary transition-colors">{report.title}</span>
 </div>
 <div className="flex items-center gap-2 ml-3.5">
 <span className="text-[9px] text-text-dim font-mono uppercase">{new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
 <span className="w-1 h-1 rounded-full bg-border-bright" />
 <span className="text-[9px] text-text-dim uppercase tracking-widest font-bold">{report.status}</span>
 </div>
 </div>
 </div>
 <button 
 onClick={() => {
 setSelectedReport(report);
 setIsReportEditing(false);
 setActiveTab('reports');
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

 {activeTab === 'approvals' && (
 <motion.div 
 key="approvals"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="space-y-4 w-full"
 >
 <AnimatePresence mode="popLayout">
 {approvals.map(a => (
 <motion.div 
 layout
 key={a.id} 
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ 
 opacity: 0, 
 x: completingTaskId?.id === a.id ? (completingTaskId.action === 'approve' ? 20 : -20) : 0,
 scale: 0.95,
 filter: "blur(4px)"
 }}
 transition={{ duration: 0.35, ease: "anticipate" }}
 className={`relative bg-surface border border-border-dim p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden transition-colors duration-500 ${
 completingTaskId?.id === a.id 
 ? completingTaskId.action === 'approve' ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'
 : ''
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
 className={`p-4 rounded-full ${completingTaskId.action === 'approve' ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}
 >
 {completingTaskId.action === 'approve' ? <Check size={32} strokeWidth={3} /> : <X size={32} strokeWidth={3} />}
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 <div className="relative z-0">
 <div className="text-sm font-bold text-text-primary">{a.projectTitle}</div>
 <div className="text-[10px] text-text-dim uppercase tracking-widest mt-1">
 Requested by {a.requestedBy} · {new Date(a.requestedAt).toLocaleString()}
 </div>
 </div>
 {hasPermission(user, 'APPROVE_DELETIONS') ? (
 <div className="flex gap-2 w-full sm:w-auto relative z-0">
 <button 
 disabled={!!completingTaskId}
 onClick={() => handleApproval(a.id, 'approve')}
 className="flex-1 sm:flex-none bg-green-500/10 text-green-500 border border-green-500/30 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-green-500 hover:text-bg transition-all disabled:opacity-50"
 >
 Approve
 </button>
 <button 
 disabled={!!completingTaskId}
 onClick={() => handleApproval(a.id, 'reject')}
 className="flex-1 sm:flex-none bg-red-500/10 text-red-500 border border-red-500/30 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-bg transition-all disabled:opacity-50"
 >
 Reject
 </button>
 </div>
 ) : (
 <span className="text-[10px] text-text-dim uppercase tracking-widest italic">Awaiting Admin Signature</span>
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

 {activeTab === 'reports' && (
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

 {activeTab === 'users' && (user?.role === 'admin' || user?.role === 'team_leader') && (
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
 Viewing team members for <span className="font-bold">{users.find(u => u.id === teamFilter)?.name}</span>
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
 {hasPermission(user, 'MANAGE_TEAM') && (
 <button
 onClick={() => {
 setSelectedUsersForTeam([]);
 setIsBuildTeamModalOpen(true);
 }}
 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-purple-500 hover:text-purple-400 transition-colors"
 title="Build your team"
 >
 <UsersIcon size={14} /> Build Team
 </button>
 )}
 
 </div>
 <div className="bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-xl">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
 <thead>
 <tr className="bg-surface-2/30">
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim first:rounded-tl-2xl whitespace-nowrap">User Profile</th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim whitespace-nowrap">Contact Info</th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim whitespace-nowrap">System Role</th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black border-b border-border-dim whitespace-nowrap">Team Assignment</th>
 <th className="px-6 py-4 text-[10px] text-text-dim uppercase tracking-[0.2em] font-black text-right border-b border-border-dim last:rounded-tr-2xl whitespace-nowrap">Actions</th>
 </tr>
 </thead>
 <tbody>
 {(() => {
 const filtered = users.filter(u => 
 (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
 u.role.toLowerCase().includes(searchQuery.toLowerCase())) &&
 (!teamFilter || u.teamLeaderId === teamFilter)
 );

 if (filtered.length === 0) {
 return (
 <tr>
 <td colSpan={5} className="p-12 text-center text-text-dim text-xs italic">
 {searchQuery ? `No users matching "${searchQuery}"` : "No users found."}
 </td>
 </tr>
 );
 }

 return filtered.map((u, index) => (
 <tr 
 key={u.id} 
 className={`group transition-all duration-300 ${
 index % 2 === 0 ? 'bg-surface' : 'bg-surface-2/20'
 } hover:bg-surface-3/80 relative`}
 >
 <td className="px-6 py-4 border-b border-border-dim/30">
 <div className="flex items-center gap-4">
 <div className="relative">
 <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border-bright flex items-center justify-center text-sm font-bold text-amber-primary shadow-inner overflow-hidden group-hover:scale-110 transition-transform">
 {u.profilePicture ? (
 <img src={u.profilePicture} alt={u.name} className="w-full h-full object-cover" />
 ) : (
 u.name?.[0] || '?'
 )}
 </div>
 <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${
 u.lastActive && (new Date().getTime() - new Date(u.lastActive).getTime() < 300000)
 ? 'bg-green-500' 
 : 'bg-text-dim'
 }`} />
 </div>
 <div className="flex flex-col">
 <span className="text-sm font-bold text-text-primary group-hover:text-amber-primary transition-colors leading-tight">{u.name}</span>
 <span className="text-[10px] text-text-dim font-mono opacity-70 mt-0.5">ID: {u.id.slice(0, 8)}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 border-b border-border-dim/30">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
 <Mail size={12} className="text-text-dim" />
 {u.email}
 </div>
 {u.lastActive && (
 <div className="flex items-center gap-2 text-[9px] text-text-dim uppercase tracking-widest">
 <Clock size={10} />
 {new Date(u.lastActive).toLocaleDateString()}
 </div>
 )}
 </div>
 </td>
 <td className="px-6 py-4 border-b border-border-dim/30">
 <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
 u.role === 'admin' ? 'border-amber-500/20 bg-amber-500/5 text-amber-500' : 
 u.role === 'team_leader' ? 'border-purple-500/20 bg-purple-500/5 text-purple-500' :
 'border-blue-500/20 bg-blue-500/5 text-blue-500'
 }`}>
 {u.role === 'admin' && <ShieldCheck size={12} />}
 {u.role === 'team_leader' && <UsersIcon size={12} />}
 {u.role === 'employee' && <User size={12} />}
 {u.role === 'admin' ? 'Super Admin' : u.role?.replace(/_/g, ' ')}
 </span>
 </td>
 <td className="px-6 py-4 border-b border-border-dim/30">
 {u.teamLeaderId ? (
 <div className="flex items-center gap-3 bg-surface-2/50 p-2 rounded-xl border border-border-bright w-fit">
 <div className="w-6 h-6 rounded-lg bg-surface border border-border-dim flex items-center justify-center text-[10px] font-bold text-purple-500 shadow-sm">
 {users.find(l => l.id === u.teamLeaderId)?.name?.[0] || '?'}
 </div>
 <div className="flex flex-col">
 <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold leading-none mb-1">Reports To</span>
 <span className="text-xs text-text-primary font-medium leading-none">
 {users.find(l => l.id === u.teamLeaderId)?.name || 'Unknown'}
 </span>
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-2 text-text-dim/50 bg-surface-2/30 p-2 rounded-xl border border-border-dim/30 w-fit">
 <div className="w-6 h-6 rounded-lg bg-surface-3 flex items-center justify-center">
 <Minus size={12} />
 </div>
 <span className="text-[10px] italic uppercase tracking-widest font-bold">Unassigned</span>
 </div>
 )}
 </td>
 <td className="px-6 py-4 border-b border-border-dim/30 text-right">
 <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
 {hasPermission(user, 'MANAGE_PERMISSIONS') && (
 <button 
 onClick={() => {
 setUserForPermissions(u);
 setSelectedPermissions(u.permissions || []);
 setIsPermissionsModalOpen(true);
 }}
 className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-all"
 title="Grant Permissions"
 >
 <ShieldCheck size={14} />
 </button>
 )}
 {hasPermission(user, 'MANAGE_TEAM') && u.role === 'employee' && (
 <button 
 onClick={() => {
 setUserForTeam(u);
 setSelectedTeamLeader(user?.role === 'team_leader' ? user.id : (u.teamLeaderId || ''));
 setIsTeamModalOpen(true);
 }}
 className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-all"
 title="Assign Team"
 >
 <UsersIcon size={14} />
 </button>
 )}
 {u.role === 'team_leader' && (
 <>
 <button 
 onClick={() => {
 setTeamFilter(u.id);
 setSearchQuery('');
 }}
 className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-all"
 title="View Team"
 >
 <UsersIcon size={14} />
 </button>
 {user?.role === 'admin' && (
 <button 
 onClick={() => {
 setSelectedTeamLeader(u.id);
 setSelectedUsersForTeam([]);
 setIsBuildTeamModalOpen(true);
 }}
 className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
 title="Build Team"
 >
 <UserPlus size={14} />
 </button>
 )}
 </>
 )}
 {user?.role === 'admin' && u.id !== user.id && (
 <button 
 onClick={() => { setUserToDelete(u); setIsDeleteUserModalOpen(true); }}
 className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
 title="Delete User"
 >
 <Trash2 size={14} />
 </button>
 )}
 <button 
 onClick={() => {
 setSelectedProfileUser(u);
 setActiveTab('profile');
 }}
 className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-amber-primary hover:bg-amber-primary/10 rounded-lg transition-all"
 title="View Profile"
 >
 <User size={14} />
 </button>
 {u.id !== user?.id && (
 <button 
 onClick={() => {
 setUserToDelete(u);
 setIsDeleteUserModalOpen(true);
 }}
 className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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

 {activeTab === 'profile' && (
 <div className="w-full h-full">
 <ProfileView 
 user={selectedProfileUser || user!} 
 onUpdate={handleUpdateProfile}
 isSelf={!selectedProfileUser || selectedProfileUser.id === user?.id}
 currentUserRole={user?.role || 'employee'}
 showToast={showToast}
 autoSave={autoSave}
 onResetCredentials={handleResetCredentials}
 onBack={() => {
 setSelectedProfileUser(null);
 setActiveTab('users');
 }}
 />
 </div>
 )}
 </AnimatePresence>
 </div>
 </div>
   <footer className="shrink-0 w-full border-t border-border-dim/30 bg-bg/40 backdrop-blur-md py-4 px-4 sm:px-6 z-40 relative">
     <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[9px] uppercase tracking-[0.22em] text-text-dim text-center sm:text-left select-none">
       {/* Sleek minimalist line logo & essential copyright on the left */}
       <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
         <span className="text-[10px] font-black text-text-primary tracking-[0.24em] flex items-center gap-1.5">
           <span className="w-1 h-1 rounded-full bg-amber-primary inline-block min-w-[4px]" />
           PYSYNC
         </span>
         <span className="text-border-dim/40 font-light font-sans">|</span>
         <span className="font-semibold text-text-dim">&copy; {new Date().getFullYear()}</span>
         <span className="text-border-dim/40 font-light font-sans">|</span>
         <span className="text-text-dim/80 font-medium">
           Platform by <span className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150 cursor-pointer">Propertyards.com</span>
         </span>
       </div>

       {/* Essential pages in the same single line */}
       <div className="flex items-center justify-center gap-3.5">
         <a href="#" className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150">Privacy</a>
         <span className="text-border-dim/40 font-light">•</span>
         <a href="#" className="text-text-secondary hover:text-amber-primary font-bold transition-all duration-150">Terms</a>
       </div>
     </div>
   </footer>
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
 {editingProject ? 'Edit Project' : editingResale ? 'Edit Listing Projects' : entryType === 'project' ? 'Add Project' : 'Add Listing Projects'}
 </h2>
 <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Listing Management</p>
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
 <div className="flex justify-center mb-6">
 <div className="bg-surface-3 p-1.5 rounded-2xl flex items-center border border-amber-primary/30 shadow-lg shadow-amber-primary/10">
 <button
 onClick={() => setEntryType('project')}
 className={`px-8 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${entryType === 'project' ? 'bg-amber-primary text-bg shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105 z-10' : 'text-text-dim hover:text-text-primary hover:bg-surface-2'}`}
 >
 <Building2 size={16} className="inline mr-2" />
 Project Entry
 </button>
 <button
 onClick={() => setEntryType('resale')}
 className={`px-8 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${entryType === 'resale' ? 'bg-amber-primary text-bg shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105 z-10' : 'text-text-dim hover:text-text-primary hover:bg-surface-2'}`}
 >
 <ClipboardList size={16} className="inline mr-2" />
 Listing Projects
 </button>
 </div>
 </div>
 )}

 {editingResale || entryType === 'resale' ? (
 <ResalePropertyForm 
 initialData={editingResale ? {
 ...editingResale,
 price: editingResale.price >= 10000000 ? Number(editingResale.price) / 10000000 : Number(editingResale.price) / 100000,
 priceUnit: editingResale.price >= 10000000 ? 'Cr' : 'Lacs'
 } : undefined}
 onSubmit={editingResale ? handleEditResale : handleAddResale}
 onCancel={() => {
 setIsModalOpen(false);
 setEditingResale(null);
 }}
 existingProperties={resaleProperties.filter(p => !editingResale || p.id !== editingResale.id).map(p => ({
 societyName: p.societyName,
 bhk: p.bhk,
 floorNumber: p.floorNumber,
 location: p.location
 }))}
 existingBuilders={allBuilders}
 existingSocieties={allSocieties}
 showToast={showToast}
 />
 ) : (
 <ProjectForm 
 initialData={editingProject ? {
 ...editingProject,
 price: editingProject.price >= 10000000 ? editingProject.price / 10000000 : editingProject.price / 100000,
 priceUnit: editingProject.price >= 10000000 ? 'Cr' : 'Lacs'
 } : undefined}
 onSubmit={editingProject ? handleEditProject : handleAddProject}
 onCancel={() => {
 setIsModalOpen(false);
 setEditingProject(null);
 }}
 existingTitles={projects.filter(p => p.id !== editingProject?.id).map(p => p.title)}
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
 onEdit={(p: any) => { setEditingProject(p); setIsModalOpen(true); }}
 onDelete={setProjectToDelete}
 onCreate={() => { setEditingProject(null); setIsModalOpen(true); }}
 hasEditPermission={hasPermission(user, 'EDIT_PROJECTS') && (user?.role === 'admin' || user?.role === 'team_leader')}
 hasDeletePermission={(hasPermission(user, 'DELETE_PROJECTS') || hasPermission(user, 'REQUEST_DELETION')) && (user?.role === 'admin' || user?.role === 'team_leader')}
 hasCreatePermission={hasPermission(user, 'ADD_PROJECTS')}
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
 {createdUserCredentials ? 'User Created Successfully' : 'Add New User'}
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
 onCopySuccess={(msg) => showToast(msg, 'info')}
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
 <h2 className="text-lg font-bold text-text-primary">Grant Permissions</h2>
 <p className="text-[10px] text-text-dim uppercase tracking-widest">User: {userForPermissions.name}</p>
 </div>
 <button onClick={() => setIsPermissionsModalOpen(false)} className="text-text-dim hover:text-red-500 transition-colors">✕</button>
 </div>
 <div className="p-6 overflow-y-auto space-y-6">
 {PERMISSION_CATEGORIES.map(category => (
 <div key={category.name} className="space-y-3">
 <h3 className="text-[10px] text-amber-primary uppercase tracking-[0.2em] font-black flex items-center gap-2">
 <div className="w-1 h-1 bg-amber-primary rounded-full" />
 {category.name}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {category.permissions.map(perm => (
 <label key={perm} className="flex items-center gap-3 p-3 rounded-xl border border-border-bright hover:border-amber-primary/50 cursor-pointer transition-all group">
 <input 
 type="checkbox" 
 checked={selectedPermissions.includes(perm)}
 onChange={(e) => {
 if (e.target.checked) {
 setSelectedPermissions([...selectedPermissions, perm]);
 } else {
 setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
 }
 }}
 className="w-4 h-4 rounded border-border-bright text-amber-primary focus:ring-amber-primary bg-surface-2"
 />
 <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">
 {perm?.replace(/_/g, ' ')}
 </span>
 </label>
 ))}
 </div>
 </div>
 ))}
 </div>
 <div className="p-6 bg-surface-2 border-t border-border-dim flex justify-end gap-3">
 <button onClick={() => setIsPermissionsModalOpen(false)} className="px-6 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
 <button onClick={handleUpdatePermissions} className="bg-amber-primary text-bg px-8 py-2 rounded-lg text-xs font-bold hover:bg-amber-secondary transition-all">Save Permissions</button>
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
 setSelectedTeamLeader('');
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
 Build Team {selectedTeamLeader ? `for ${users.find(u => u.id === selectedTeamLeader)?.name}` : ''}
 </h2>
 <p className="text-[10px] text-text-dim uppercase tracking-widest">Select employees to assign to the team</p>
 </div>
 <button onClick={() => {
 setIsBuildTeamModalOpen(false);
 setSelectedTeamLeader('');
 }} className="text-text-dim hover:text-red-500 transition-colors">✕</button>
 </div>
 
 <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
 <div className="space-y-4">
 {users.filter(u => u.role === 'employee' && u.teamLeaderId !== (selectedTeamLeader || user?.id)).length === 0 ? (
 <div className="text-center p-8 border border-dashed border-border-dim rounded-xl text-text-dim text-xs italic">
 No unassigned employees available to add to this team.
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {users.filter(u => u.role === 'employee' && u.teamLeaderId !== (selectedTeamLeader || user?.id)).map(u => (
 <label 
 key={u.id} 
 className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
 selectedUsersForTeam.includes(u.id) 
 ? 'bg-purple-500/10 border-purple-500' 
 : 'bg-surface-2 border-border-bright hover:border-purple-500/50'
 }`}
 >
 <input 
 type="checkbox" 
 className="hidden"
 checked={selectedUsersForTeam.includes(u.id)}
 onChange={(e) => {
 if (e.target.checked) {
 setSelectedUsersForTeam(prev => [...prev, u.id]);
 } else {
 setSelectedUsersForTeam(prev => prev.filter(id => id !== u.id));
 }
 }}
 />
 <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
 selectedUsersForTeam.includes(u.id) ? 'bg-purple-500 text-white' : 'border border-border-dim bg-surface'
 }`}>
 {selectedUsersForTeam.includes(u.id) && <Check size={12} />}
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-xs font-bold text-text-primary truncate">{u.name}</div>
 <div className="text-[10px] text-text-dim truncate">{u.email}</div>
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
 {selectedUsersForTeam.length} user{selectedUsersForTeam.length !== 1 ? 's' : ''} selected
 </div>
 <div className="flex gap-3">
 <button onClick={() => {
 setIsBuildTeamModalOpen(false);
 setSelectedTeamLeader('');
 }} className="px-6 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
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
 <h2 className="text-lg font-bold text-text-primary">Assign Team</h2>
 <p className="text-[10px] text-text-dim uppercase tracking-widest">User: {userForTeam.name}</p>
 </div>
 <button onClick={() => setIsTeamModalOpen(false)} className="text-text-dim hover:text-red-500 transition-colors">✕</button>
 </div>
 <div className="p-8 space-y-6">
 <div className="space-y-2">
 <label className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Select Team Leader</label>
 {user?.role === 'admin' ? (
 <select 
 value={selectedTeamLeader}
 onChange={(e) => setSelectedTeamLeader(e.target.value)}
 className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-primary transition-all"
 >
 <option value="">No Team Leader</option>
 {users.filter(u => u.role === 'team_leader' || u.role === 'admin').map(leader => (
 <option key={leader.id} value={leader.id}>{leader.name} ({leader.role === 'admin' ? 'Super Admin' : leader.role?.replace(/_/g, ' ')})</option>
 ))}
 </select>
 ) : (
 <div className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-3 text-sm text-text-primary">
 {user?.name} (You)
 </div>
 )}
 </div>
 <p className="text-[11px] text-text-secondary italic leading-relaxed">
 {user?.role === 'admin' 
 ? "Assigning a team leader allows them to view and manage this user's activity."
 : "Assigning this user to your team will allow you to view and manage their activity."}
 </p>
 </div>
 <div className="p-6 bg-surface-2 border-t border-border-dim flex justify-end gap-3">
 <button onClick={() => setIsTeamModalOpen(false)} className="px-6 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
 <button onClick={handleAssignTeam} className="bg-amber-primary text-bg px-8 py-2 rounded-lg text-xs font-bold hover:bg-amber-secondary transition-all">Confirm Assignment</button>
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
 <h2 className="font-serif text-xl font-bold text-text-primary mb-2">Delete User?</h2>
 <p className="text-sm text-text-secondary leading-relaxed mb-8">
 Are you sure you want to delete <span className="text-text-primary font-bold">{userToDelete.name}</span>? 
 This action cannot be undone and all associated logs will remain for audit purposes.
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
 Are you sure you want to delete this project? This action cannot be undone.
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
 hasPermission(user, 'DELETE_PROJECTS') 
 ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
 : 'bg-amber-primary hover:bg-amber-secondary shadow-amber-primary/20'
 }`}
 >
 {hasPermission(user, 'DELETE_PROJECTS') ? 'Confirm Delete' : 'Confirm Request'}
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
 Are you sure you want to delete these projects? This action cannot be undone.
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
 {toasts.map(toast => (
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
 <button onClick={() => setIsBulkStatusModalOpen(false)} className="text-text-dim hover:text-red-500 transition-colors">
 <X size={20} />
 </button>
 </div>
 
 <p className="text-xs text-text-secondary mb-6">
 Updating status for <span className="text-amber-primary font-bold">{selectedProjectIds.length}</span> selected projects.
 </p>

 <div className="space-y-4 mb-8">
 {['Active', 'Sold', 'Pending'].map(status => (
 <button
 key={status}
 onClick={() => setBulkStatus(status)}
 className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
 bulkStatus === status 
 ? 'border-amber-primary bg-amber-primary/5 text-amber-primary' 
 : 'border-border-dim bg-surface-2 text-text-secondary hover:border-amber-primary/50'
 }`}
 >
 <span className="text-sm font-bold uppercase tracking-widest">{status}</span>
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
 <h2 className="text-xl font-bold text-text-primary">Sign Out</h2>
 <p className="text-sm text-text-secondary">Are you sure you want to log out of your account?</p>
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
    await request('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error("Logout error", err);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pysync_token');
    setIsLoggedIn(false);
    setUser(null);
    setActiveTab('dashboard');
    setIsLogoutModalOpen(false);
    showToast("Logged out successfully", 'info');
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
 setTheme={setTheme}
 fontFamily={fontFamily}
 setFontFamily={setFontFamily}
 fontSize={fontSize}
 setFontSize={setFontSize}
 reducedMotion={reducedMotion}
 setReducedMotion={setReducedMotion}
 user={user}
 onProfileClick={() => {
 setSelectedProfileUser(user);
 setActiveTab('profile');
 }}
 playSound={playSound}
 />
 </div>
 )}
 </ErrorBoundary>
 );
}
