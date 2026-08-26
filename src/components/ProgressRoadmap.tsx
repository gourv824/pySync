import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  HardHat,
  Layers,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Building,
  Flag,
  Target,
  Timer,
  Activity,
  ChevronRight,
  Info,
  Check,
  CheckCircle,
} from "lucide-react";

export interface ProgressRoadmapProps {
  project: {
    id: string;
    title: string;
    possessionStatus?: "Ready to Move" | "Under Construction" | "New Launch" | string;
    possessionDate?: string;
    launchDate?: string;
    createdAt?: string;
    noOfTowers?: string;
    noOfFloors?: string;
    reraNumber?: string;
    builderName?: string;
  };
  className?: string;
}

export interface PhaseMilestone {
  id: number;
  phaseName: string;
  shortLabel: string;
  category: string;
  description: string;
  keyDeliverables: string[];
  estimatedTimeframe: string;
  weight: number; // Cumulative percentage threshold
}

const PHASES: PhaseMilestone[] = [
  {
    id: 1,
    phaseName: "Site Prep & Foundation",
    shortLabel: "Foundation",
    category: "Substructure",
    description: "Soil investigation, deep excavation, raft casting, and basement retention piling.",
    keyDeliverables: [
      "Site geo-technical surveying & boundary clearance",
      "Basement excavation & soil reinforcement",
      "Piling work & deep raft foundation casting",
      "Subterranean waterproofing & drain lines",
    ],
    estimatedTimeframe: "Months 1 - 6",
    weight: 18,
  },
  {
    id: 2,
    phaseName: "Superstructure & Plinth",
    shortLabel: "Structure",
    category: "RCC Frame",
    description: "Plinth beam tie-ins, shear walls, vertical structural columns, and floor slab casting.",
    keyDeliverables: [
      "Plinth beam structural tie-ins & podium slabs",
      "High-tensile rebar column framing",
      "Floor-by-floor concrete slab casting",
      "Lift core & emergency stairwell construction",
    ],
    estimatedTimeframe: "Months 7 - 18",
    weight: 38,
  },
  {
    id: 3,
    phaseName: "Brickwork & Masonry",
    shortLabel: "Masonry",
    category: "Enclosure",
    description: "Internal room partitions, AAC block masonry, external plastering, and weather barriers.",
    keyDeliverables: [
      "Autoclaved Aerated Concrete (AAC) wall partitions",
      "Exterior weather-proof cement plastering",
      "Door & window sub-frame structural anchoring",
      "Balcony parapet walls & safety core installations",
    ],
    estimatedTimeframe: "Months 19 - 26",
    weight: 58,
  },
  {
    id: 4,
    phaseName: "MEP & Facade Glazing",
    shortLabel: "MEP & Facade",
    category: "Services",
    description: "Mechanical, Electrical, Plumbing conduit integration, HVAC ducting, and facade envelope.",
    keyDeliverables: [
      "Firefighting suppression ring & sprinkler mainlines",
      "Concealed electrical conduit & circuit distribution",
      "Freshwater & wastewater piping risers",
      "Double-glazed acoustic glass exterior facade",
    ],
    estimatedTimeframe: "Months 27 - 34",
    weight: 76,
  },
  {
    id: 5,
    phaseName: "Finishing & Interiors",
    shortLabel: "Finishes",
    category: "Fitouts",
    description: "Vitrified tile flooring, premium wall putty & painting, sanitary fittings, and high-speed elevators.",
    keyDeliverables: [
      "Italian marble / vitrified floor tile laying",
      "Premium acrylic emulsion wall paint & false ceilings",
      "Imported CP sanitary ware & bathroom fitouts",
      "High-speed passenger & freight elevator commissioning",
    ],
    estimatedTimeframe: "Months 35 - 42",
    weight: 92,
  },
  {
    id: 6,
    phaseName: "Audit, OC & Handover",
    shortLabel: "Handover",
    category: "Possession",
    description: "Statutory inspections, Fire NOC, Occupancy Certificate (OC) receipt, and key handover.",
    keyDeliverables: [
      "Municipal authority structural audit & Fire NOC",
      "RERA compliance certificate & Occupancy Certificate (OC)",
      "Clubhouse & landscaped common area handover",
      "Formal key handover & buyer possession registration",
    ],
    estimatedTimeframe: "Handover Ready",
    weight: 100,
  },
];

export const ProgressRoadmap: React.FC<ProgressRoadmapProps> = ({
  project,
  className = "",
}) => {
  // Deterministic calculation based on project dates & possessionStatus
  const {
    progressPercentage,
    currentPhaseIndex,
    daysRemaining,
    formattedPossessionDate,
    formattedLaunchDate,
    scheduleStatus,
    isDelivered,
  } = useMemo(() => {
    const status = project.possessionStatus || "Under Construction";

    // 1. Ready to move / Completed
    if (status === "Ready to Move") {
      return {
        progressPercentage: 100,
        currentPhaseIndex: 5, // Last phase (Phase 6)
        daysRemaining: 0,
        formattedPossessionDate: project.possessionDate
          ? new Date(project.possessionDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "Ready to Move",
        formattedLaunchDate: project.launchDate
          ? new Date(project.launchDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "Completed",
        scheduleStatus: "Delivered & Ready for Possession",
        isDelivered: true,
      };
    }

    // 2. New Launch
    if (status === "New Launch") {
      let days = 730; // default ~2 years
      let targetFormatted = "Target Q4 2028";
      if (project.possessionDate) {
        const target = new Date(project.possessionDate);
        const now = new Date();
        const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) {
          days = diff;
          targetFormatted = target.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
        }
      }
      return {
        progressPercentage: 15,
        currentPhaseIndex: 0, // Phase 1
        daysRemaining: days,
        formattedPossessionDate: targetFormatted,
        formattedLaunchDate: project.launchDate
          ? new Date(project.launchDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "Newly Launched",
        scheduleStatus: "Initial Groundbreak Phase",
        isDelivered: false,
      };
    }

    // 3. Under Construction
    const now = new Date();
    let startDate: Date;
    if (project.launchDate) {
      startDate = new Date(project.launchDate);
    } else if (project.createdAt) {
      startDate = new Date(project.createdAt);
    } else {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 yr ago default
    }

    let endDate: Date;
    if (project.possessionDate) {
      endDate = new Date(project.possessionDate);
    } else {
      endDate = new Date(now.getTime() + 540 * 24 * 60 * 60 * 1000); // 1.5 yrs future default
    }

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let pct: number;
    if (totalDuration > 0 && elapsed > 0) {
      pct = Math.round((elapsed / totalDuration) * 100);
      pct = Math.max(8, Math.min(94, pct));
    } else {
      // Deterministic hash based on project id if dates are equal or ambiguous
      let seed = 0;
      for (let i = 0; i < (project.id || "").length; i++) {
        seed += (project.id || "").charCodeAt(i);
      }
      pct = 35 + (seed % 45); // between 35% and 80%
    }

    // If target date has already passed
    if (diffDays <= 0) {
      pct = 100;
    }

    // Determine current phase index based on weights
    let phaseIdx = 0;
    for (let i = 0; i < PHASES.length; i++) {
      if (pct <= PHASES[i].weight || i === PHASES.length - 1) {
        phaseIdx = i;
        break;
      }
    }

    return {
      progressPercentage: pct,
      currentPhaseIndex: phaseIdx,
      daysRemaining: Math.max(0, diffDays),
      formattedPossessionDate: project.possessionDate
        ? new Date(project.possessionDate).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : "Target Q3 2027",
      formattedLaunchDate: project.launchDate
        ? new Date(project.launchDate).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : "In Progress",
      scheduleStatus: diffDays > 0 ? "On Track (Active Milestone)" : "Nearing OC & Handover",
      isDelivered: pct >= 100,
    };
  }, [project]);

  // Selected phase node for deep inspection in drawer
  const [selectedPhaseId, setSelectedPhaseId] = useState<number>(
    PHASES[currentPhaseIndex]?.id || 1
  );

  // Keep selected phase synchronized with current active phase on project changes
  React.useEffect(() => {
    setSelectedPhaseId(PHASES[currentPhaseIndex]?.id || 1);
  }, [currentPhaseIndex]);

  const selectedPhase = useMemo(
    () => PHASES.find((p) => p.id === selectedPhaseId) || PHASES[0],
    [selectedPhaseId]
  );

  const isCurrentActive = selectedPhase.id === PHASES[currentPhaseIndex]?.id;
  const isPastCompleted = selectedPhase.id < (PHASES[currentPhaseIndex]?.id || 1);

  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111317] to-[#0A0C0E] p-5 sm:p-7 shadow-xl space-y-6 font-sans relative overflow-hidden ${className}`}
    >
      {/* Ambient background glow accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-500">
              <HardHat size={14} className="animate-pulse" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-amber-500">
              Construction Progress Roadmap
            </span>
            {isDelivered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-wider">
                <CheckCircle2 size={10} /> Handover Ready
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Phase {currentPhaseIndex + 1}: {PHASES[currentPhaseIndex]?.phaseName}</span>
            <span className="text-xs font-normal text-white/50 hidden sm:inline">
              ({PHASES[currentPhaseIndex]?.category})
            </span>
          </h3>
        </div>

        {/* Quick KPI stats strip */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target completion date pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono">
            <Calendar size={13} className="text-amber-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[8px] text-white/40 uppercase font-black tracking-wider">
                Target Possession
              </span>
              <span className="text-[11px] font-bold text-white">
                {formattedPossessionDate}
              </span>
            </div>
          </div>

          {/* Days remaining badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono">
            <Timer size={13} className="text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[8px] text-white/40 uppercase font-black tracking-wider">
                Timeline Horizon
              </span>
              <span className="text-[11px] font-bold text-emerald-400">
                {isDelivered ? "OC Completed" : `${daysRemaining} Days Left`}
              </span>
            </div>
          </div>

          {/* Overall Percentage Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono">
            <Activity size={13} className="animate-pulse" />
            <span className="text-sm font-black tracking-tight">
              {progressPercentage}%
            </span>
            <span className="text-[8px] uppercase tracking-wider font-bold text-amber-400/80">
              Built
            </span>
          </div>
        </div>
      </div>

      {/* Global Linear Progress Bar Indicator */}
      <div className="relative z-10 space-y-1.5">
        <div className="flex items-center justify-between text-[9px] font-mono text-white/50">
          <span className="flex items-center gap-1.5">
            <Flag size={10} className="text-amber-500" />
            <span>Launch: {formattedLaunchDate}</span>
          </span>
          <span className="text-amber-400/90 font-bold">
            {scheduleStatus}
          </span>
          <span className="flex items-center gap-1.5">
            <Target size={10} className="text-emerald-400" />
            <span>Handover: {formattedPossessionDate}</span>
          </span>
        </div>

        <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden p-0.5 border border-white/[0.08] relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full relative shadow-[0_0_12px_rgba(245,158,11,0.5)]"
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full animate-ping opacity-75" />
          </motion.div>
        </div>
      </div>

      {/* Horizontal Interactive Roadmap Stepper Track */}
      <div className="relative z-10 py-4 overflow-x-auto no-scrollbar">
        <div className="min-w-[620px] relative px-3">
          {/* Continuous Background Track Line */}
          <div className="absolute top-[26px] left-[40px] right-[40px] h-[3px] bg-white/[0.08] rounded-full z-0" />

          {/* Continuous Filled Gradient Track Line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `calc(${Math.min(
                100,
                (currentPhaseIndex / (PHASES.length - 1)) * 100 +
                  (progressPercentage > 0 && currentPhaseIndex < PHASES.length - 1 ? 8 : 0)
              )}% - 80px)`,
            }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute top-[26px] left-[40px] h-[3px] bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full z-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          />

          {/* Stepper Phase Nodes Grid */}
          <div className="grid grid-cols-6 gap-2 relative z-10">
            {PHASES.map((phase, idx) => {
              const isCompleted = idx < currentPhaseIndex || isDelivered;
              const isActive = idx === currentPhaseIndex && !isDelivered;
              const isSelected = selectedPhaseId === phase.id;

              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className="flex flex-col items-center text-center group cursor-pointer focus:outline-none transition-transform active:scale-95"
                >
                  {/* Step Node Icon/Badge */}
                  <div className="relative mb-2.5">
                    <motion.div
                      whileHover={{ scale: 1.12 }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-lg ${
                        isSelected
                          ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0A0C0E] scale-105"
                          : ""
                      } ${
                        isCompleted
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10"
                          : isActive
                          ? "bg-amber-500/20 border-amber-500/60 text-amber-400 shadow-amber-500/20 animate-pulse"
                          : "bg-[#14161A] border-white/10 text-white/40 hover:border-white/25 hover:text-white/70"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={18} className="stroke-[2.5]" />
                      ) : isActive ? (
                        <HardHat size={18} className="animate-bounce text-amber-400" />
                      ) : (
                        <span className="text-xs font-mono font-bold">0{phase.id}</span>
                      )}
                    </motion.div>

                    {/* Active phase badge floating dot */}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-[#0A0C0E]" />
                      </span>
                    )}
                  </div>

                  {/* Node Short Label */}
                  <span
                    className={`text-[11px] font-bold tracking-tight transition-colors line-clamp-1 ${
                      isSelected
                        ? "text-amber-400 font-extrabold"
                        : isCompleted
                        ? "text-white group-hover:text-emerald-400"
                        : isActive
                        ? "text-amber-400 font-extrabold"
                        : "text-white/50 group-hover:text-white/80"
                    }`}
                  >
                    {phase.shortLabel}
                  </span>

                  {/* Status Indicator Pill */}
                  <span
                    className={`text-[8px] font-mono uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-md font-bold transition-all ${
                      isCompleted
                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                        : isActive
                        ? "text-amber-300 bg-amber-500/15 border border-amber-500/30"
                        : "text-white/30 bg-white/[0.02] border border-white/[0.04]"
                    }`}
                  >
                    {isCompleted ? "Done" : isActive ? "Current" : `P0${phase.id}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Phase Detail Inspection Drawer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPhase.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-center ${
                  isPastCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : isCurrentActive
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                    : "bg-white/5 border-white/10 text-white/60"
                }`}
              >
                <Layers size={16} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-500">
                    Phase {selectedPhase.id} of 6 · {selectedPhase.category}
                  </span>
                  <span
                    className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                      isPastCompleted
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : isCurrentActive
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse"
                        : "bg-white/5 text-white/40 border-white/10"
                    }`}
                  >
                    {isPastCompleted
                      ? "Milestone Verified & Completed"
                      : isCurrentActive
                      ? "Active Construction Phase"
                      : "Upcoming Scope of Work"}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mt-0.5">
                  {selectedPhase.phaseName}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-white/60 sm:text-right">
              <Clock size={12} className="text-amber-500 shrink-0" />
              <span>Timeline: {selectedPhase.estimatedTimeframe}</span>
            </div>
          </div>

          <p className="text-xs text-white/70 leading-relaxed">
            {selectedPhase.description}
          </p>

          {/* Key Deliverables Checklist */}
          <div className="space-y-2 pt-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/40 block">
              Core Engineering Deliverables & Quality Gates
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedPhase.keyDeliverables.map((item, dIdx) => (
                <div
                  key={dIdx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#14161A]/60 border border-white/[0.04] text-xs text-white/80"
                >
                  <div
                    className={`mt-0.5 p-0.5 rounded-full shrink-0 ${
                      isPastCompleted
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isCurrentActive
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    <Check size={11} className="stroke-[2.5]" />
                  </div>
                  <span className="leading-snug text-[11px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom RERA & Assurance footer note */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-[9px] font-mono text-white/40">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={11} className="text-emerald-400" />
              <span>RERA Reg: {project.reraNumber || "Verified"} · Regular Architectural QA Audits</span>
            </span>
            <span className="text-amber-400/80">
              {project.builderName ? `Builder: ${project.builderName}` : "Audited Regional Quality Standards"}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
