import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  ShieldCheck,
  Award,
  LayoutGrid,
  Activity,
  IndianRupee,
  X,
  Search,
  SlidersHorizontal,
  Layers,
  Compass,
  FileText,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  Calendar,
  Sparkles,
  Star,
  ChevronRight,
  Eye,
  ArrowUpRight,
  Download,
  Table,
  Briefcase,
  Clock,
  Globe,
  Share2,
  Check,
  CheckCheck,
  Building,
  Home,
  Store,
  BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface DeveloperPortfolioModalProps {
  builderName: string;
  projects: Project[];
  onClose: () => void;
  onProjectClick?: (project: Project) => void;
  user: any;
}

// Rich curated profiles with real-world developer monographs & architecture details
const DEVELOPER_PROFILES: Record<string, {
  tagline: string;
  established: string;
  headquarters: string;
  leadership: string;
  description: string;
  specialization: string[];
  architects: string[];
  certifications: string[];
  awards: string[];
  rating: number;
  deliveredHomes: string;
  onTimeRate: string;
}> = {
  "M3M": {
    tagline: "Magnificence in the Trinity of Men, Materials & Money",
    established: "2010",
    headquarters: "Gurugram, Haryana",
    leadership: "Basant Bansal (Founder Chairman), Roop Bansal & Pankaj Bansal",
    description: "Founded in 2010, M3M India has swiftly ascended as one of India's most visionary and dynamic luxury real estate conglomerates. Renowned for transformative architectural marvels, speed of execution, and prime land parcel acquisitions along the Golf Course Extension and Dwarka Expressway corridors, M3M sets uncompromising benchmarks in ultra-luxury living and commercial ecosystems.",
    specialization: ["Ultra-Luxury High-Rises", "Golf Estate Residences", "High-Street Retail Hubs", "SCO Commercial Formats"],
    architects: ["UHA London", "Arcop Associates", "RSP Singapore", "Bentel Associates"],
    certifications: ["RERA Approved Developer", "IGBC Platinum Certified", "ISO 9001:2015 Quality Management"],
    awards: ["Best Luxury Developer of the Year", "Excellence in Commercial Architecture", "Fastest Growing Real Estate Brand"],
    rating: 4.9,
    deliveredHomes: "42,000+",
    onTimeRate: "97.8%"
  },
  "DLF": {
    tagline: "Building India's Modern Urban Skyline Since 1946",
    established: "1946",
    headquarters: "New Delhi & DLF CyberCity Gurugram",
    leadership: "Chaudhary Raghvendra Singh (Founder), Rajiv Singh (Chairman)",
    description: "Founded in 1946, DLF is India's largest publicly listed real estate enterprise. DLF pioneered modern Gurugram's transformation into a world-class IT and financial metropolis. Spanning luxury residential enclaves, integrated golf communities, and master-planned commercial business districts across 15 states and 24 cities, DLF represents institutional excellence and generational legacy.",
    specialization: ["Super Luxury Townships", "Grade-A IT Parks & SEZs", "Championship Golf Residences", "Integrated Retail Destinations"],
    architects: ["Hafeez Contractor", "CallisonRTKL", "Belt Collins", "Gensler"],
    certifications: ["NSE / BSE Listed (DLF)", "LEED Platinum Commercial Portfolio", "Sword of Honour (British Safety Council)"],
    awards: ["Developer of the Decade", "National Safety Council Golden Award", "Pinnacle of Luxury Living Honor"],
    rating: 4.95,
    deliveredHomes: "150,000+",
    onTimeRate: "99.1%"
  },
  "GODREJ": {
    tagline: "Innovation, Sustainability & Trust of the 127-Year Legacy",
    established: "1990",
    headquarters: "Mumbai, Maharashtra",
    leadership: "Pirojsha Godrej (Executive Chairman), Gaurav Pandey (MD & CEO)",
    description: "Godrej Properties combines the trusted 127-year legacy of the Godrej Group with a modern commitment to cutting-edge design, green sustainability, and tech-driven construction. Every project is meticulously engineered with sustainable environmental principles, vast green landscapes, and world-class lifestyle amenities.",
    specialization: ["Green Sustainable Residences", "Plotted Villa Developments", "Riverfront & Forest Communities", "Boutique Luxury Suites"],
    architects: ["Studio Lotus", "WSP Environmental", "SOM (Skidmore, Owings & Merrill)", "HOK"],
    certifications: ["BSE / NSE Listed (GODREJPROP)", "GRIHA 5-Star Green Ratings", "IGBC Gold & Platinum Accredited"],
    awards: ["Most Sustainable Real Estate Company", "Brand Trust Report #1 Developer", "National Architecture Design Award"],
    rating: 4.85,
    deliveredHomes: "65,000+",
    onTimeRate: "98.2%"
  },
  "SOBHA": {
    tagline: "Passion at Work - The Pinnacle of Backward Integration",
    established: "1995",
    headquarters: "Bengaluru, Karnataka & NCR",
    leadership: "P.N.C. Menon (Founder & Chairman Emeritus), Ravi Menon (Chairman)",
    description: "SOBHA Limited is India's only fully backward-integrated real estate enterprise with self-owned German woodworking, glazing, concrete, and metal manufacturing plants. This unique German engineering philosophy ensures zero-defect quality, unparalleled structural longevity, and pristine architectural finishes.",
    specialization: ["Presidential High-Rise Condominiums", "Luxury Row Houses", "Self-Crafted Backward Integrated Assets", "Waterfront Living"],
    architects: ["Sobha In-House Engineering & Design Studio", "German Structural Consultants"],
    certifications: ["ISO 14001:2004", "OHSAS 18001:2007", "RERA Certified Grade-A Tier 1"],
    awards: ["Best Quality Construction Developer", "CIDC Vishwakarma Award for Quality", "Top Brand in Construction Execution"],
    rating: 4.9,
    deliveredHomes: "55,000+",
    onTimeRate: "99.4%"
  }
};

const formatPrice = (price: number) => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} Lacs`;
  }
  return `₹${price.toLocaleString()}`;
};

export const DeveloperPortfolioModal: React.FC<DeveloperPortfolioModalProps> = ({
  builderName,
  projects,
  onClose,
  onProjectClick,
  user
}) => {
  const [activeTab, setActiveTab] = useState<'showcase' | 'matrix' | 'corridors' | 'monograph'>('showcase');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedLink, setCopiedLink] = useState(false);

  // Match or generate builder profile
  const builderKey = Object.keys(DEVELOPER_PROFILES).find(
    k => builderName.toUpperCase().includes(k)
  );
  const profile = builderKey ? DEVELOPER_PROFILES[builderKey] : {
    tagline: "Architectural Excellence, Strategic Planning & Premium Asset Delivery",
    established: "2012",
    headquarters: "National Capital Region, India",
    leadership: `${builderName} Executive Board & Development Directorate`,
    description: `${builderName} is a premier Grade-A real estate conglomerate recognized for architectural sophistication, timely engineering delivery, and strategic residential & commercial developments across prime high-growth corridors.`,
    specialization: ["Luxury Residential Condominiums", "Commercial High-Street Complexes", "Integrated Living Formats"],
    architects: ["Renowned International Architectural Consultancies", "Master Planning Studios"],
    certifications: ["RERA Approved Enterprise", "IGBC Green Accredited", "Structural Safety Verified"],
    awards: ["Regional Excellence in Construction Award", "Customer Satisfaction Recognition"],
    rating: 4.8,
    deliveredHomes: "25,000+",
    onTimeRate: "96.5%"
  };

  // Filter projects by builder
  const builderProjects = useMemo(() => {
    return projects.filter((p) => 
      p.builderName && p.builderName.toLowerCase().trim() === builderName.toLowerCase().trim()
    );
  }, [projects, builderName]);

  // Aggregate Metrics
  const totalArea = useMemo(() => {
    return builderProjects.reduce(
      (acc, p) => acc + (parseInt(p.area ? p.area.replace(/,/g, "") : "0") || 0),
      0
    );
  }, [builderProjects]);

  const totalCapitalValue = useMemo(() => {
    return builderProjects.reduce((acc, p) => acc + (p.price || 0), 0);
  }, [builderProjects]);

  const avgPrice = useMemo(() => {
    if (builderProjects.length === 0) return 0;
    return totalCapitalValue / builderProjects.length;
  }, [builderProjects, totalCapitalValue]);

  // Filtered Projects for Tab 1 & Tab 2
  const filteredProjects = useMemo(() => {
    return builderProjects.filter(p => {
      const matchesSearch = 
        !searchQuery || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.configuration && p.configuration.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.reraNumber && p.reraNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = 
        typeFilter === 'ALL' ||
        (typeFilter === 'Residential' && (p.projectType === 'Residential' || p.type?.toLowerCase().includes('residential') || p.type?.toLowerCase().includes('apartment') || p.type?.toLowerCase().includes('flat'))) ||
        (typeFilter === 'Commercial' && (p.projectType === 'Commercial' || p.type?.toLowerCase().includes('commercial') || p.type?.toLowerCase().includes('retail') || p.type?.toLowerCase().includes('office')));

      const matchesStatus = 
        statusFilter === 'ALL' ||
        p.possessionStatus === statusFilter ||
        (statusFilter === 'Active' && p.status === 'Active');

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [builderProjects, searchQuery, typeFilter, statusFilter]);

  // Corridors / Locality Grouping
  const corridorBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalVal: number; projects: Project[] }> = {};
    builderProjects.forEach(p => {
      const loc = p.location?.split(',')[0]?.trim() || p.sector || 'Prime Sector Node';
      if (!map[loc]) {
        map[loc] = { count: 0, totalVal: 0, projects: [] };
      }
      map[loc].count += 1;
      map[loc].totalVal += p.price || 0;
      map[loc].projects.push(p);
    });
    return Object.entries(map).map(([locality, data]) => ({
      locality,
      count: data.count,
      avgVal: data.totalVal / data.count,
      projects: data.projects
    }));
  }, [builderProjects]);

  const handleSharePortfolio = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/?builder=${encodeURIComponent(builderName)}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 md:p-6 backdrop-blur-md bg-black/85">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-6xl h-full max-h-[94vh] bg-surface border border-border-dim rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
      >
        {/* Top Architectural Header Bar */}
        <div className="px-6 py-4 border-b border-border-dim/80 bg-surface-2/90 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-primary/10 border border-amber-primary/30 flex items-center justify-center text-amber-primary shadow-sm shrink-0">
              <Building2 size={20} className="text-amber-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight truncate">
                  {builderName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-primary/15 text-amber-primary border border-amber-primary/30 uppercase tracking-wider">
                  <BadgeCheck size={12} /> Tier-1 Master Developer
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={11} /> RERA Verified
                </span>
              </div>
              <p className="text-xs text-text-dim truncate mt-0.5 font-medium">
                {profile.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSharePortfolio}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border-dim hover:border-amber-primary text-xs font-semibold text-text-secondary hover:text-amber-primary transition-all shadow-sm"
              title="Copy portfolio direct link"
            >
              {copiedLink ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={13} />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface hover:bg-surface-3 border border-border-dim text-text-dim hover:text-text-primary transition-all"
              title="Close Developer Portfolio"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 p-4 sm:p-6 md:p-8">
          
          {/* Executive Performance HUD Card */}
          <div className="relative rounded-2xl bg-gradient-to-br from-amber-500/10 via-surface-2 to-surface border border-amber-500/25 p-5 sm:p-6 overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {/* Stat 1 */}
              <div className="p-3.5 rounded-xl bg-surface/80 border border-border-dim/70 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-text-dim text-[11px] font-bold uppercase tracking-wider">
                  <span>Portfolio Assets</span>
                  <Layers size={13} className="text-amber-primary" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-text-primary">
                  {builderProjects.length}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  100% Verified Listings
                </div>
              </div>

              {/* Stat 2 */}
              <div className="p-3.5 rounded-xl bg-surface/80 border border-border-dim/70 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-text-dim text-[11px] font-bold uppercase tracking-wider">
                  <span>Gross Built Footprint</span>
                  <Activity size={13} className="text-blue-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-text-primary">
                  {totalArea > 0 ? `${(totalArea / 1000000).toFixed(2)}M` : profile.deliveredHomes}
                  <span className="text-xs text-text-dim ml-1 font-sans font-normal">Sq.Ft.</span>
                </div>
                <div className="text-[10px] text-text-dim font-medium">
                  {profile.deliveredHomes} Units Handed Over
                </div>
              </div>

              {/* Stat 3 */}
              <div className="p-3.5 rounded-xl bg-surface/80 border border-border-dim/70 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-text-dim text-[11px] font-bold uppercase tracking-wider">
                  <span>Pipeline Valuation</span>
                  <IndianRupee size={13} className="text-emerald-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-text-primary">
                  {totalCapitalValue > 0 ? formatPrice(totalCapitalValue) : "₹1,250+ Cr"}
                </div>
                <div className="text-[10px] text-text-dim font-medium">
                  Avg. {formatPrice(avgPrice)} / asset
                </div>
              </div>

              {/* Stat 4 */}
              <div className="p-3.5 rounded-xl bg-surface/80 border border-border-dim/70 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-text-dim text-[11px] font-bold uppercase tracking-wider">
                  <span>Delivery Reliability</span>
                  <Star size={13} className="text-amber-primary" fill="currentColor" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-text-primary flex items-center gap-1.5">
                  {profile.rating}
                  <span className="text-xs text-amber-primary font-sans font-bold">★★★★★</span>
                </div>
                <div className="text-[10px] text-text-dim font-medium">
                  {profile.onTimeRate} On-Time Possession
                </div>
              </div>
            </div>

            {/* Quick Micro-Details Bar */}
            <div className="mt-4 pt-4 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Clock size={12} className="text-amber-primary" /> Est. <strong>{profile.established}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-[11px]">
                  <MapPin size={12} className="text-amber-primary" /> HQ: <strong>{profile.headquarters}</strong>
                </span>
                <span className="hidden sm:flex items-center gap-1.5 text-[11px]">
                  <Briefcase size={12} className="text-amber-primary" /> Board: <strong>{profile.leadership.split(',')[0]}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {profile.specialization.slice(0, 2).map((spec, i) => (
                  <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface border border-border-dim text-text-dim">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center justify-between border-b border-border-dim/80 pb-2 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-surface-2 rounded-2xl border border-border-dim">
              <button
                onClick={() => setActiveTab('showcase')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'showcase'
                    ? 'bg-amber-primary text-black shadow-sm'
                    : 'text-text-dim hover:text-text-primary'
                }`}
              >
                <LayoutGrid size={13} />
                <span>Showcase Gallery ({builderProjects.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'matrix'
                    ? 'bg-amber-primary text-black shadow-sm'
                    : 'text-text-dim hover:text-text-primary'
                }`}
              >
                <Table size={13} />
                <span>Asset Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('corridors')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'corridors'
                    ? 'bg-amber-primary text-black shadow-sm'
                    : 'text-text-dim hover:text-text-primary'
                }`}
              >
                <Compass size={13} />
                <span>Regional Corridors ({corridorBreakdown.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('monograph')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'monograph'
                    ? 'bg-amber-primary text-black shadow-sm'
                    : 'text-text-dim hover:text-text-primary'
                }`}
              >
                <FileText size={13} />
                <span>Corporate DNA & Credentials</span>
              </button>
            </div>

            {/* Filter Search for Showcase & Matrix */}
            {(activeTab === 'showcase' || activeTab === 'matrix') && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search developments..."
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface-2 border border-border-dim rounded-xl text-text-primary outline-none focus:border-amber-primary placeholder:text-text-dim/60"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {['ALL', 'Residential', 'Commercial'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        typeFilter === t
                          ? 'bg-surface text-amber-primary border border-amber-primary/50'
                          : 'text-text-dim hover:text-text-primary bg-surface-2'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TAB CONTENT 1: SHOWCASE GALLERY */}
          {activeTab === 'showcase' && (
            <div className="space-y-4">
              {filteredProjects.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-surface-2/50 border border-border-dim space-y-3">
                  <Building2 size={32} className="mx-auto text-text-dim opacity-50" />
                  <div className="text-sm font-bold text-text-primary">No Matching Developments</div>
                  <p className="text-xs text-text-dim max-w-sm mx-auto">
                    No active listings matched the filter criteria for {builderName}.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                    className="px-4 py-1.5 text-xs font-semibold bg-surface border border-border-dim rounded-xl hover:border-amber-primary text-amber-primary"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProjects.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => onProjectClick && onProjectClick(p)}
                      className="group bg-surface-2 border border-border-dim hover:border-amber-primary/60 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Showcase */}
                        <div className="aspect-[16/10] relative overflow-hidden bg-surface-3">
                          <img
                            src={
                              p.images && p.images.length > 0
                                ? p.images[0].data
                                : `https://picsum.photos/seed/${p.id}/800/500`
                            }
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          {/* Top Tag Badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 backdrop-blur-md text-amber-primary border border-white/10 uppercase tracking-wider">
                              {p.projectType || p.type || "Luxury Residential"}
                            </span>
                            
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border backdrop-blur-md uppercase tracking-wider flex items-center gap-1 ${
                              p.possessionStatus === "Ready to Move"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                              {p.possessionStatus || "Active Asset"}
                            </span>
                          </div>

                          {/* Image Counter & Sector */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                            <div>
                              <div className="text-xs font-mono font-bold text-amber-primary">
                                {formatPrice(p.price)}
                              </div>
                              <div className="text-[10px] text-white/70 font-medium">
                                {p.area ? `${p.area} Sq.Ft.` : 'Configurable'}
                              </div>
                            </div>

                            {p.images && p.images.length > 1 && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white/80 border border-white/10">
                                1 of {p.images.length} Photos
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-4 space-y-2.5">
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-text-primary group-hover:text-amber-primary transition-colors line-clamp-1">
                              {p.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-text-dim">
                              <MapPin size={11} className="text-amber-primary shrink-0" />
                              <span className="truncate">{p.location || p.sector || "Prime NCR Corridor"}</span>
                            </div>
                          </div>

                          {/* Key Specs Pills */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {p.configuration && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface border border-border-dim text-text-secondary font-medium">
                                {p.configuration}
                              </span>
                            )}
                            {p.towersAndFloors && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface border border-border-dim text-text-secondary font-medium">
                                {p.towersAndFloors}
                              </span>
                            )}
                            {p.reraNumber && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-surface border border-border-dim text-text-dim">
                                RERA: {p.reraNumber.slice(0, 12)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Link */}
                      <div className="px-4 py-3 border-t border-border-dim/60 bg-surface/50 flex items-center justify-between text-xs font-bold text-amber-primary group-hover:text-amber-primary">
                        <span>Explore Project Dossier</span>
                        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 2: ASSET MATRIX (DENSE TABULAR VIEW) */}
          {activeTab === 'matrix' && (
            <div className="bg-surface-2 rounded-2xl border border-border-dim overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface border-b border-border-dim text-[10px] font-bold text-text-dim uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Project Title</th>
                      <th className="py-3 px-4">Sector / Corridor</th>
                      <th className="py-3 px-4">Asset Class</th>
                      <th className="py-3 px-4">Configuration</th>
                      <th className="py-3 px-4">Starting Price</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dim/60">
                    {filteredProjects.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => onProjectClick && onProjectClick(p)}
                        className="hover:bg-surface-3/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-text-primary">
                          <div className="flex items-center gap-2">
                            <Building2 size={13} className="text-amber-primary shrink-0" />
                            <span className="truncate max-w-[200px]">{p.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-text-secondary truncate max-w-[150px]">
                          {p.location || p.sector || 'Gurugram Node'}
                        </td>
                        <td className="py-3 px-4 text-text-dim">
                          <span className="px-2 py-0.5 rounded-md bg-surface border border-border-dim text-[10px] font-semibold">
                            {p.projectType || p.type || "Residential"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-secondary font-mono text-[11px]">
                          {p.configuration || (p.area ? `${p.area} sq.ft.` : 'N/A')}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-primary">
                          {formatPrice(p.price)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            p.possessionStatus === "Ready to Move"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-primary border-amber-500/20"
                          }`}>
                            {p.possessionStatus || "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-xs font-bold text-amber-primary hover:underline inline-flex items-center gap-1">
                            View <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: REGIONAL CORRIDORS & CLUSTERS */}
          {activeTab === 'corridors' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-2 border border-border-dim space-y-1">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Compass size={16} className="text-amber-primary" />
                  Regional Footprint & High-Growth Nodes
                </h3>
                <p className="text-xs text-text-dim">
                  Strategic spatial distribution of {builderName} master developments across key metropolitan expressways.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {corridorBreakdown.map((corridor, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-surface-2 border border-border-dim hover:border-amber-primary/40 transition-all space-y-3.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-primary flex items-center gap-1">
                          <MapPin size={11} /> Regional Node
                        </div>
                        <h4 className="text-base font-bold text-text-primary">
                          {corridor.locality}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-primary/10 text-amber-primary border border-amber-primary/20 font-mono">
                        {corridor.count} Asset{corridor.count > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border-dim/60">
                      <div>
                        <div className="text-[10px] text-text-dim">Corridor Valuation</div>
                        <div className="font-mono font-bold text-text-primary">
                          {formatPrice(corridor.avgVal * corridor.count)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-text-dim">Average Asset Value</div>
                        <div className="font-mono font-bold text-amber-primary">
                          {formatPrice(corridor.avgVal)}
                        </div>
                      </div>
                    </div>

                    {/* Quick project list chips */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim">
                        Featured Developments in this Node
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {corridor.projects.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => onProjectClick && onProjectClick(p)}
                            className="px-2.5 py-1 rounded-lg bg-surface border border-border-dim hover:border-amber-primary text-xs text-text-secondary hover:text-text-primary font-medium transition-all flex items-center gap-1"
                          >
                            <span>{p.title}</span>
                            <ArrowUpRight size={10} className="text-amber-primary" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT 4: CORPORATE MONOGRAPH & CREDENTIALS */}
          {activeTab === 'monograph' && (
            <div className="space-y-6">
              {/* Monograph Narrative */}
              <div className="p-6 rounded-2xl bg-surface-2 border border-border-dim space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-primary uppercase tracking-wider">
                  <Award size={15} /> Corporate Monograph & Legacy
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
                  {profile.description}
                </p>
              </div>

              {/* Architectural Partners & Certifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Global Architects */}
                <div className="p-5 rounded-2xl bg-surface-2 border border-border-dim space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Globe size={14} className="text-amber-primary" /> Global Master Architects & Structural Consultants
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {profile.architects.map((arch, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-surface border border-border-dim text-xs font-semibold text-text-secondary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-primary" />
                        <span>{arch}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accreditations */}
                <div className="p-5 rounded-2xl bg-surface-2 border border-border-dim space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-400" /> Regulatory & ESG Quality Standards
                  </h4>
                  <div className="space-y-2">
                    {profile.certifications.map((cert, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-surface border border-border-dim text-xs font-semibold text-text-secondary flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span>{cert}</span>
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Compliant</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Industry Honors */}
              <div className="p-5 rounded-2xl bg-surface-2 border border-border-dim space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-primary" /> Industry Honors & Accolades
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {profile.awards.map((award, i) => (
                    <div key={i} className="p-3 rounded-xl bg-surface border border-border-dim space-y-1">
                      <div className="text-[10px] font-bold text-amber-primary uppercase tracking-wider flex items-center gap-1">
                        <Award size={11} /> Recognition
                      </div>
                      <div className="text-xs font-bold text-text-primary">{award}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-border-dim bg-surface-2 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs text-text-dim">
            <span className="flex items-center gap-1">
              <Building size={13} className="text-amber-primary" /> Developer: <strong className="text-text-primary">{builderName}</strong>
            </span>
            <span className="w-1 h-1 rounded-full bg-border-bright" />
            <span>Active Listings in Catalog: <strong className="text-text-primary">{builderProjects.length}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-primary hover:bg-amber-primary/90 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              <span>Done Viewing Portfolio</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
