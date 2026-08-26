import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Folder,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Eye,
  Plus,
  HardDrive,
  Check,
  Copy,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Building2,
  ShieldCheck,
  Activity,
  FileQuestion,
  UploadCloud,
  Layers,
  Calendar,
  Clock,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
  FolderArchive,
  Grid,
  List,
  Table as TableIcon,
  Globe,
  Mail,
  MapPin,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import JSZip from "jszip";

interface MediaItem {
  name: string;
  size: number;
  data: string;
  type?: "pdfs" | "images";
}

interface MediaExplorerProps {
  projects: any[];
  user: any;
  reports?: any[];
  logs?: any[];
  hasPermission: (user: any, permission: string) => boolean;
  setSelectedProject: (p: any) => void;
  setEditingProject?: (p: any) => void;
  setIsModalOpen?: (open: boolean) => void;
  setProjectToDelete?: (p: any) => void;
  setSelectedBuilder?: (builder: string) => void;
  setActiveTab?: (tab: string) => void;
  setSelectedReport?: (report: any) => void;
  setIsReportEditing?: (editing: boolean) => void;
  request: (url: string, options?: any) => Promise<any>;
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  playSound?: (type: string) => void;
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  LogsViewComponent?: React.ComponentType<any>;
}

export const MediaExplorer: React.FC<MediaExplorerProps> = ({
  projects,
  user,
  reports = [],
  logs = [],
  hasPermission,
  setSelectedProject,
  setEditingProject,
  setIsModalOpen,
  setProjectToDelete,
  setSelectedBuilder,
  setActiveTab,
  setSelectedReport,
  setIsReportEditing,
  request,
  showToast,
  playSound,
  setProjects,
  LogsViewComponent,
}) => {
  // State
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");
  const [insideViewMode, setInsideViewMode] = useState<"grid" | "gallery" | "table">("grid");
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<"all" | "pdfs" | "images">("all");
  const [builderFilter, setBuilderFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "files" | "size" | "recent">("recent");
  const [showFullReport, setShowFullReport] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Lightbox and Preview Modal
  const [previewMedia, setPreviewMedia] = useState<{
    item: MediaItem;
    category: "pdfs" | "images";
    index: number;
    total: number;
    projectTitle: string;
  } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);

  // PDF In-App Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<{ name: string; url: string } | null>(null);

  // File Inputs
  const generalFileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMediaKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable ||
          Boolean(target.closest("input, textarea, select, [contenteditable='true']")))
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (previewMedia || previewPdfUrl) return;

      const key = e.key.toLowerCase();
      if (key === "g") {
        if (selectedFolderId) {
          setInsideViewMode("grid");
        } else {
          setViewMode("grid");
        }
      } else if (key === "t") {
        if (selectedFolderId) {
          setInsideViewMode("table");
        } else {
          setViewMode("table");
        }
      }
    };
    window.addEventListener("keydown", handleMediaKeyDown);
    return () => window.removeEventListener("keydown", handleMediaKeyDown);
  }, [selectedFolderId, previewMedia, previewPdfUrl]);

  // Active Selected Project
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedFolderId) || null;
  }, [projects, selectedFolderId]);

  // Distinct Builders List
  const uniqueBuilders = useMemo(() => {
    const builders = Array.from(new Set(projects.map((p) => p.builderName).filter(Boolean)));
    return ["All", ...builders];
  }, [projects]);

  // Overall Global Storage Metrics
  const globalMetrics = useMemo(() => {
    let totalPdfCount = 0;
    let totalImageCount = 0;
    let totalBytes = 0;

    projects.forEach((p) => {
      if (p.pdfs && Array.isArray(p.pdfs)) {
        totalPdfCount += p.pdfs.length;
        p.pdfs.forEach((pdf: any) => {
          totalBytes += Number(pdf.size) || 0;
        });
      }
      if (p.images && Array.isArray(p.images)) {
        totalImageCount += p.images.length;
        p.images.forEach((img: any) => {
          totalBytes += Number(img.size) || 0;
        });
      }
    });

    const totalMB = totalBytes / (1024 * 1024);
    const formattedStorage =
      totalMB > 1024 ? `${(totalMB / 1024).toFixed(2)} GB` : `${totalMB.toFixed(1)} MB`;

    return {
      totalFolders: projects.length,
      totalPdfCount,
      totalImageCount,
      totalFiles: totalPdfCount + totalImageCount,
      totalBytes,
      formattedStorage,
    };
  }, [projects]);

  // Filtered and Sorted Projects for the Explorer View
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesBuilder = builderFilter === "All" || p.builderName === builderFilter;
        const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "has-docs" && p.pdfs?.length > 0) ||
          (statusFilter === "has-images" && p.images?.length > 0) ||
          (statusFilter === "empty" && (!p.pdfs || p.pdfs.length === 0) && (!p.images || p.images.length === 0)) ||
          p.possessionStatus === statusFilter;

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          p.title?.toLowerCase().includes(q) ||
          p.builderName?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.pdfs?.some((pdf: any) => pdf.name?.toLowerCase().includes(q)) ||
          p.images?.some((img: any) => img.name?.toLowerCase().includes(q));

        return matchesBuilder && matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "files") {
          const aCount = (a.pdfs?.length || 0) + (a.images?.length || 0);
          const bCount = (b.pdfs?.length || 0) + (b.images?.length || 0);
          return bCount - aCount;
        }
        if (sortBy === "size") {
          const aSize =
            (a.pdfs?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0) +
            (a.images?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0);
          const bSize =
            (b.pdfs?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0) +
            (b.images?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0);
          return bSize - aSize;
        }
        // recent
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return bDate - aDate;
      });
  }, [projects, builderFilter, statusFilter, searchQuery, sortBy]);

  // Project Specific Storage Metrics
  const activeProjectMetrics = useMemo(() => {
    if (!activeProject) return { pdfSizeMB: 0, imageSizeMB: 0, totalSizeMB: 0, totalFiles: 0 };
    const pdfSize = activeProject.pdfs?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0;
    const imageSize = activeProject.images?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0;
    const totalSize = pdfSize + imageSize;

    return {
      pdfSizeMB: (pdfSize / (1024 * 1024)).toFixed(1),
      imageSizeMB: (imageSize / (1024 * 1024)).toFixed(1),
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(1),
      totalFiles: (activeProject.pdfs?.length || 0) + (activeProject.images?.length || 0),
    };
  }, [activeProject]);

  // Handler for uploading files (supports multiple files)
  const processFilesUpload = async (files: FileList | File[], targetProjectId: string) => {
    const project = projects.find((p) => p.id === targetProjectId);
    if (!project || !files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    if (playSound) playSound("click");

    try {
      let updatedPdfs = [...(project.pdfs || [])];
      let updatedImages = [...(project.images || [])];
      let uploadedPdfCount = 0;
      let uploadedImgCount = 0;

      const fileArray = Array.from(files);
      const total = fileArray.length;

      for (let i = 0; i < total; i++) {
        const file = fileArray[i];
        const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
        const isImg = file.type.startsWith("image/");

        if (!isPdf && !isImg) {
          showToast(`Skipping unsupported file: ${file.name}`, "warning");
          continue;
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const newItem = {
          name: file.name,
          size: file.size,
          data: base64,
        };

        if (isPdf) {
          // avoid duplicate names in pdfs
          updatedPdfs = updatedPdfs.filter((p) => p.name !== file.name);
          updatedPdfs.push(newItem);
          uploadedPdfCount++;
        } else {
          // avoid duplicate names in images
          updatedImages = updatedImages.filter((img) => img.name !== file.name);
          updatedImages.push(newItem);
          uploadedImgCount++;
        }

        setUploadProgress(Math.round(((i + 1) / total) * 90));
      }

      // Save to server
      const response = await request(
        `/api/projects/${project.id}?role=${user?.role}&userName=${user?.name}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfs: updatedPdfs,
            images: updatedImages,
          }),
        },
      );

      if (response) {
        setProjects((prev) => prev.map((p) => (p.id === project.id ? response : p)));
        setUploadProgress(100);
        showToast(
          `Uploaded ${uploadedPdfCount > 0 ? `${uploadedPdfCount} document(s)` : ""} ${
            uploadedImgCount > 0 ? `${uploadedImgCount} image(s)` : ""
          } to "${project.title}"`,
          "success",
        );
        if (playSound) playSound("success");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Failed to upload assets. Please try again.", "error");
      if (playSound) playSound("error");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(null);
      }, 600);
    }
  };

  // Handler for file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, targetProjectId?: string) => {
    const pId = targetProjectId || selectedFolderId;
    if (!pId || !e.target.files) return;
    processFilesUpload(e.target.files, pId);
    e.target.value = "";
  };

  // Delete Media Item
  const handleDeleteItem = async (project: any, itemToDelete: MediaItem, category: "pdfs" | "images") => {
    if (!hasPermission(user, "DELETE_PROJECTS") && user?.role !== "admin") {
      showToast("You need administrator permissions to delete assets.", "warning");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${itemToDelete.name}" from ${project.title}?`)) {
      return;
    }

    const updatedList = (project[category] || []).filter((item: any) => item.name !== itemToDelete.name);

    try {
      const response = await request(
        `/api/projects/${project.id}?role=${user?.role}&userName=${user?.name}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            [category]: updatedList,
          }),
        },
      );

      if (response) {
        setProjects((prev) => prev.map((p) => (p.id === project.id ? response : p)));
        if (previewMedia?.item.name === itemToDelete.name) {
          setPreviewMedia(null);
        }
        showToast(`Asset "${itemToDelete.name}" deleted successfully.`, "info");
        if (playSound) playSound("click");
      }
    } catch (err) {
      console.error("Deletion error:", err);
      showToast("Failed to delete asset.", "error");
    }
  };

  // Download All Assets for a Project as a ZIP
  const handleDownloadAllZip = async (project: any) => {
    if (!project) return;
    const hasFiles = (project.pdfs?.length || 0) + (project.images?.length || 0) > 0;
    if (!hasFiles) {
      showToast("No assets available in this folder to download.", "info");
      return;
    }

    setIsZipping(true);
    showToast(`Generating ZIP package for "${project.title}"...`, "info");

    try {
      const zip = new JSZip();
      const folderName = `${project.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Media_Assets`;
      const rootZip = zip.folder(folderName) || zip;

      // Add PDFs
      if (project.pdfs && project.pdfs.length > 0) {
        const docsFolder = rootZip.folder("documents");
        project.pdfs.forEach((pdf: any) => {
          if (pdf.data && pdf.data.includes("base64,")) {
            const base64Data = pdf.data.split("base64,")[1];
            docsFolder?.file(pdf.name, base64Data, { base64: true });
          }
        });
      }

      // Add Images
      if (project.images && project.images.length > 0) {
        const imgFolder = rootZip.folder("images");
        project.images.forEach((img: any) => {
          if (img.data && img.data.includes("base64,")) {
            const base64Data = img.data.split("base64,")[1];
            imgFolder?.file(img.name, base64Data, { base64: true });
          }
        });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`ZIP package for "${project.title}" downloaded successfully!`, "success");
      if (playSound) playSound("success");
    } catch (err) {
      console.error("ZIP error:", err);
      showToast("Failed to generate ZIP bundle.", "error");
    } finally {
      setIsZipping(false);
    }
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewMedia || !activeProject) return;
      if (e.key === "Escape") {
        setPreviewMedia(null);
        setPreviewPdfUrl(null);
      } else if (e.key === "ArrowRight" && previewMedia.category === "images") {
        const imgs = activeProject.images || [];
        if (imgs.length > 1) {
          const nextIdx = (previewMedia.index + 1) % imgs.length;
          setPreviewMedia({
            item: imgs[nextIdx],
            category: "images",
            index: nextIdx,
            total: imgs.length,
            projectTitle: activeProject.title,
          });
          setLightboxZoom(1);
          setLightboxRotation(0);
        }
      } else if (e.key === "ArrowLeft" && previewMedia.category === "images") {
        const imgs = activeProject.images || [];
        if (imgs.length > 1) {
          const prevIdx = (previewMedia.index - 1 + imgs.length) % imgs.length;
          setPreviewMedia({
            item: imgs[prevIdx],
            category: "images",
            index: prevIdx,
            total: imgs.length,
            projectTitle: activeProject.title,
          });
          setLightboxZoom(1);
          setLightboxRotation(0);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewMedia, activeProject]);

  return (
    <div className="h-full flex flex-col gap-5 w-full max-w-none relative z-10 bg-bg">
      {/* Hidden File Inputs for Triggers */}
      <input
        type="file"
        ref={generalFileInputRef}
        onChange={(e) => handleFileInputChange(e)}
        multiple
        className="hidden"
        accept="image/*,.pdf"
      />
      <input
        type="file"
        ref={pdfInputRef}
        onChange={(e) => handleFileInputChange(e)}
        multiple
        className="hidden"
        accept=".pdf"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileInputChange(e)}
        multiple
        className="hidden"
        accept="image/*"
      />

      {/* TOP HEADER SECTION */}
      <div className="bg-surface/80 border border-border-dim/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-primary/20 to-amber-primary/5 border border-amber-primary/30 flex items-center justify-center text-amber-primary shadow-inner shadow-amber-primary/20">
              <FolderArchive size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                  Media Folders Explorer
                </h1>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Centralized high-res media vaults, verified architectural drawings, and marketing brochures
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowFullReport(!showFullReport)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer ${
                showFullReport
                  ? "bg-amber-primary text-bg border-amber-primary shadow-amber-primary/20 font-black"
                  : "bg-surface-2 hover:bg-surface-3 text-text-secondary border-border-bright"
              }`}
            >
              <Activity size={13} />
              <span>{showFullReport ? "Close Logs" : "Activity Logs"}</span>
            </button>
          </div>
        </div>

        {/* Global Storage & Asset Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border-dim/40">
          <div className="bg-surface-2/40 border border-border-dim/40 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-primary/10 text-amber-primary flex items-center justify-center shrink-0">
              <Folder size={16} />
            </div>
            <div>
              <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Total Folders</div>
              <div className="text-sm font-mono font-black text-text-primary">{globalMetrics.totalFolders}</div>
            </div>
          </div>

          <div className="bg-surface-2/40 border border-border-dim/40 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Images & Renders</div>
              <div className="text-sm font-mono font-black text-text-primary">{globalMetrics.totalImageCount}</div>
            </div>
          </div>

          <div className="bg-surface-2/40 border border-border-dim/40 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold">PDF Documents</div>
              <div className="text-sm font-mono font-black text-text-primary">{globalMetrics.totalPdfCount}</div>
            </div>
          </div>

          <div className="bg-surface-2/40 border border-border-dim/40 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <HardDrive size={16} />
            </div>
            <div>
              <div className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Storage Allocated</div>
              <div className="text-sm font-mono font-black text-text-primary">{globalMetrics.formattedStorage}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Uploading Progress Overlay */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-primary/10 border border-amber-primary/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg backdrop-blur-md"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-primary text-bg flex items-center justify-center animate-spin shrink-0">
            <RefreshCw size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-text-primary mb-1">
              <span>Syncing & Uploading Media Assets to MinIO Storage...</span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-surface-3 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-primary h-full transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress || 20}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* MAIN CONTENT AREA: Explorer + Inspector */}
      <div className="flex flex-1 gap-5 overflow-hidden min-h-[620px]">
        {/* Explorer Workspace Window */}
        <div className="bg-surface border border-border-dim rounded-2xl flex flex-col overflow-hidden flex-1 shadow-2xl">
          {/* Explorer Navigation & Controls Bar */}
          <div className="px-5 py-3.5 border-b border-border-dim flex flex-wrap justify-between items-center gap-3 bg-surface-2/60 backdrop-blur-md">
            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  !selectedFolderId
                    ? "bg-amber-primary/15 text-amber-primary font-black"
                    : "text-text-dim hover:text-text-primary hover:bg-surface-3"
                }`}
              >
                <Layers size={14} />
                <span>Media Root</span>
              </button>

              {activeProject && (
                <>
                  <ChevronRight size={14} className="text-text-dim/40" />
                  <span className="text-text-dim text-[11px] font-medium hidden sm:inline">
                    {activeProject.builderName || "Builder Vault"}
                  </span>
                  <ChevronRight size={14} className="text-text-dim/40 hidden sm:inline" />
                  <div className="relative group">
                    <span className="bg-amber-primary/15 text-amber-primary font-black px-2.5 py-1 rounded-lg border border-amber-primary/30 max-w-[200px] truncate inline-block">
                      {activeProject.title}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* View and Folder Controls */}
            <div className="flex items-center gap-2">
              {selectedFolderId ? (
                <>
                  {/* Inside Folder View layout toggles */}
                  <div className="flex items-center bg-surface-3 p-1 rounded-xl border border-border-bright text-text-dim">
                    <button
                      onClick={() => setInsideViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-all ${
                        insideViewMode === "grid"
                          ? "bg-amber-primary text-bg font-bold shadow-sm"
                          : "hover:text-text-primary"
                      }`}
                      title="Cards Grid (Press 'G')"
                    >
                      <Grid size={13} />
                    </button>
                    <button
                      onClick={() => setInsideViewMode("gallery")}
                      className={`p-1.5 rounded-lg transition-all ${
                        insideViewMode === "gallery"
                          ? "bg-amber-primary text-bg font-bold shadow-sm"
                          : "hover:text-text-primary"
                      }`}
                      title="Gallery Layout"
                    >
                      <ImageIcon size={13} />
                    </button>
                    <button
                      onClick={() => setInsideViewMode("table")}
                      className={`p-1.5 rounded-lg transition-all ${
                        insideViewMode === "table"
                          ? "bg-amber-primary text-bg font-bold shadow-sm"
                          : "hover:text-text-primary"
                      }`}
                      title="Table List (Press 'T')"
                    >
                      <TableIcon size={13} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDownloadAllZip(activeProject)}
                    disabled={isZipping}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 hover:bg-surface-3/80 border border-border-bright text-text-secondary hover:text-text-primary rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    title="Download entire project folder as ZIP"
                  >
                    <FolderArchive size={13} className="text-amber-primary" />
                    <span className="hidden md:inline">{isZipping ? "Packaging..." : "ZIP Folder"}</span>
                  </button>

                  <button
                    onClick={() => setSelectedFolderId(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 hover:bg-amber-primary hover:text-bg border border-border-bright text-text-dim hover:border-amber-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                    <span>Back</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Root Explorer View Mode Switches */}
                  <div className="flex items-center bg-surface-3 p-1 rounded-xl border border-border-bright text-text-dim">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-all ${
                        viewMode === "grid"
                          ? "bg-amber-primary text-bg font-bold shadow-sm"
                          : "hover:text-text-primary"
                      }`}
                      title="Grid View (Press 'G')"
                    >
                      <Grid size={13} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-lg transition-all ${
                        viewMode === "list"
                          ? "bg-amber-primary text-bg font-bold shadow-sm"
                          : "hover:text-text-primary"
                      }`}
                      title="List View"
                    >
                      <List size={13} />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-1.5 rounded-lg transition-all ${
                        viewMode === "table"
                          ? "bg-amber-primary text-bg font-bold shadow-sm"
                          : "hover:text-text-primary"
                      }`}
                      title="Table View (Press 'T')"
                    >
                      <TableIcon size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Root Search & Filtering Toolbar (Shown when in Root View) */}
          {!selectedFolderId && !showFullReport && (
            <div className="px-5 py-3 border-b border-border-dim/60 bg-surface/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search folder title, builder, or file name..."
                    className="w-full bg-surface-2 border border-border-dim rounded-xl pl-9 pr-8 py-1.5 text-xs text-text-primary placeholder:text-text-dim outline-none focus:border-amber-primary/60 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Builder Filter */}
                <select
                  value={builderFilter}
                  onChange={(e) => setBuilderFilter(e.target.value)}
                  className="bg-surface-2 border border-border-dim rounded-xl px-3 py-1.5 text-xs text-text-secondary outline-none focus:border-amber-primary/60 cursor-pointer"
                >
                  {uniqueBuilders.map((b) => (
                    <option key={b} value={b} className="bg-surface">
                      {b === "All" ? "All Builders" : b}
                    </option>
                  ))}
                </select>

                {/* Status / Asset Type Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-surface-2 border border-border-dim rounded-xl px-3 py-1.5 text-xs text-text-secondary outline-none focus:border-amber-primary/60 cursor-pointer"
                >
                  <option value="All">All Contents</option>
                  <option value="has-docs">Has PDF Documents</option>
                  <option value="has-images">Has High-Res Images</option>
                  <option value="empty">Empty Folders</option>
                  <option value="Ready to Move">Ready to Move</option>
                  <option value="Under Construction">Under Construction</option>
                </select>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 text-xs text-text-dim">
                <ArrowUpDown size={13} />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-surface-2 border border-border-dim rounded-xl px-2.5 py-1.5 text-xs text-text-secondary outline-none focus:border-amber-primary/60 cursor-pointer"
                >
                  <option value="recent">Recently Created</option>
                  <option value="name">Name (A - Z)</option>
                  <option value="files">Most Files</option>
                  <option value="size">Largest Storage Size</option>
                </select>
              </div>
            </div>
          )}

          {/* WORKSPACE BODY VIEW */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar bg-bg/30">
            {showFullReport ? (
              /* Full Activity Logs View */
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-border-dim">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowFullReport(false)}
                      className="p-2 bg-surface-2 hover:bg-surface-3 rounded-xl transition-colors text-text-dim hover:text-text-primary border border-border-bright"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div>
                      <h3 className="text-lg font-black text-text-primary">Media Activity & Audit Reports</h3>
                      <p className="text-xs text-text-dim">Tracking all cloud sync events, media additions, and modifications</p>
                    </div>
                  </div>
                </div>

                {LogsViewComponent ? (
                  <LogsViewComponent
                    logs={logs}
                    user={user}
                    isLive={true}
                    onExport={(exportLogs: any[]) => {
                      const csvContent =
                        "Timestamp,User,Action,Summary\n" +
                        exportLogs
                          .map(
                            (l) =>
                              `${new Date(l.timestamp).toLocaleString()},"${l.user}","${l.action}","${l.summary}"`,
                          )
                          .join("\n");
                      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                      const link = document.createElement("a");
                      const url = URL.createObjectURL(blob);
                      link.setAttribute("href", url);
                      link.setAttribute(
                        "download",
                        `media_full_report_${new Date().toISOString().split("T")[0]}.csv`,
                      );
                      link.style.visibility = "hidden";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    {logs.slice(0, 20).map((log, idx) => (
                      <div key={idx} className="p-3.5 bg-surface-2 border border-border-bright rounded-xl text-xs flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Activity size={14} className="text-amber-primary" />
                          <div>
                            <span className="font-bold text-text-primary">{log.user || "System"}</span>
                            <span className="text-text-dim ml-2 font-mono">[{log.action}]</span>
                            <div className="text-text-secondary mt-0.5">{log.summary || log.description}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-text-dim font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : !selectedFolderId ? (
              /* ROOT FOLDER EXPLORER VIEW */
              <div>
                {filteredProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border-bright flex items-center justify-center text-text-dim mb-4">
                      <Folder size={32} className="text-amber-primary/40" />
                    </div>
                    <h3 className="text-base font-bold text-text-primary mb-1">No media folders match your filter</h3>
                    <p className="text-xs text-text-dim max-w-sm mb-5">
                      Try resetting your search query or selecting "All Builders" to discover project media vaults.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setBuilderFilter("All");
                        setStatusFilter("All");
                      }}
                      className="px-4 py-2 bg-amber-primary text-bg rounded-xl text-xs font-black hover:bg-amber-secondary transition-all shadow-md"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : viewMode === "grid" ? (
                  /* CARD GRID VIEW */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredProjects.map((p) => {
                      const pdfCount = p.pdfs?.length || 0;
                      const imgCount = p.images?.length || 0;
                      const totalCount = pdfCount + imgCount;
                      const projectSizeBytes =
                        (p.pdfs?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0) +
                        (p.images?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0);
                      const projectSizeMB = (projectSizeBytes / (1024 * 1024)).toFixed(1);

                      return (
                        <motion.div
                          whileHover={{ y: -5, scale: 1.01 }}
                          key={p.id}
                          className="group relative flex flex-col bg-surface border border-border-dim hover:border-amber-primary/50 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-amber-primary/10 transition-all duration-300 text-left overflow-hidden cursor-pointer"
                          onClick={() => setSelectedFolderId(p.id)}
                        >
                          {/* Ambient Glow */}
                          <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-primary/5 rounded-full blur-3xl group-hover:bg-amber-primary/20 transition-colors duration-500 pointer-events-none" />

                          {/* Top Folder Header */}
                          <div className="flex items-start justify-between w-full mb-4 relative z-10">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-xl bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center text-amber-primary group-hover:scale-110 group-hover:bg-amber-primary group-hover:text-bg transition-all duration-300 shadow-sm">
                                <FolderOpen size={24} />
                              </div>
                              {totalCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-primary text-bg font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                                  {totalCount}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {pdfCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                                  <FileText size={10} />
                                  {pdfCount}
                                </span>
                              )}
                              {imgCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                  <ImageIcon size={10} />
                                  {imgCount}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Project Details */}
                          <div className="space-y-1.5 relative z-10 flex-1">
                            <h3 className="text-sm font-bold text-text-primary line-clamp-1 group-hover:text-amber-primary transition-colors">
                              {p.title}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] text-text-dim">
                              <span className="truncate max-w-[130px] font-medium text-text-secondary">
                                {p.builderName || "General Vault"}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-border-bright" />
                              <span className="font-mono text-[10px] uppercase tracking-wider">{p.id.slice(0, 6)}</span>
                            </div>
                          </div>

                          {/* Image Thumbnail Preview Strip */}
                          {p.images && p.images.length > 0 ? (
                            <div className="flex items-center gap-1.5 my-3.5 relative z-10">
                              {p.images.slice(0, 3).map((img: any, i: number) => (
                                <div
                                  key={i}
                                  className="w-10 h-10 rounded-lg overflow-hidden border border-border-bright/60 bg-surface-2 shrink-0 group-hover:border-amber-primary/40 transition-colors"
                                >
                                  <img
                                    src={img.data}
                                    alt={img.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                </div>
                              ))}
                              {p.images.length > 3 && (
                                <div className="w-10 h-10 rounded-lg bg-surface-3 border border-border-bright flex items-center justify-center text-[10px] font-mono font-bold text-text-dim shrink-0">
                                  +{p.images.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="my-3.5 h-10 rounded-lg border border-dashed border-border-dim/80 bg-surface-2/30 flex items-center justify-center text-[10px] text-text-dim uppercase tracking-wider font-bold relative z-10">
                              No visual assets yet
                            </div>
                          )}

                          {/* Footer Info */}
                          <div className="pt-3 border-t border-border-dim/50 flex items-center justify-between relative z-10 text-[10px] text-text-dim">
                            <span className="font-mono">{projectSizeMB} MB</span>
                            <div className="flex items-center gap-1 text-amber-primary font-bold group-hover:translate-x-1 transition-transform">
                              <span>Open Vault</span>
                              <ChevronRight size={12} />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : viewMode === "list" ? (
                  /* COMPACT LIST VIEW */
                  <div className="space-y-2.5">
                    {filteredProjects.map((p) => {
                      const pdfCount = p.pdfs?.length || 0;
                      const imgCount = p.images?.length || 0;
                      const totalCount = pdfCount + imgCount;
                      const projectSizeBytes =
                        (p.pdfs?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0) +
                        (p.images?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0);

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedFolderId(p.id)}
                          className="flex items-center justify-between p-3.5 bg-surface border border-border-dim hover:border-amber-primary/40 hover:bg-surface-2 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-amber-primary/10 text-amber-primary flex items-center justify-center group-hover:bg-amber-primary group-hover:text-bg transition-colors shrink-0">
                              <Folder size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-text-primary truncate group-hover:text-amber-primary transition-colors">
                                {p.title}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-text-dim">
                                <span>{p.builderName || "General"}</span>
                                <span>•</span>
                                <span>{p.location}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-red-500/10 text-red-400">
                                {pdfCount} PDFs
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-500/10 text-blue-400">
                                {imgCount} Images
                              </span>
                              <span className="font-mono text-xs text-text-dim min-w-[60px] text-right">
                                {(projectSizeBytes / (1024 * 1024)).toFixed(1)} MB
                              </span>
                            </div>
                            <ChevronRight size={14} className="text-text-dim group-hover:text-amber-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* TABLE VIEW */
                  <div className="overflow-x-auto rounded-xl border border-border-dim bg-surface">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-2/80 text-text-dim uppercase tracking-wider font-bold border-b border-border-dim text-[10px]">
                        <tr>
                          <th className="p-3.5 pl-4">Folder / Project</th>
                          <th className="p-3.5">Builder</th>
                          <th className="p-3.5 text-center">PDFs</th>
                          <th className="p-3.5 text-center">Images</th>
                          <th className="p-3.5">Size</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dim/40">
                        {filteredProjects.map((p) => {
                          const pdfCount = p.pdfs?.length || 0;
                          const imgCount = p.images?.length || 0;
                          const projectSizeBytes =
                            (p.pdfs?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0) +
                            (p.images?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0);

                          return (
                            <tr
                              key={p.id}
                              onClick={() => setSelectedFolderId(p.id)}
                              className="hover:bg-surface-2/50 cursor-pointer transition-colors"
                            >
                              <td className="p-3.5 pl-4 font-bold text-text-primary flex items-center gap-2">
                                <Folder size={14} className="text-amber-primary" />
                                <span>{p.title}</span>
                              </td>
                              <td className="p-3.5 text-text-secondary">{p.builderName || "—"}</td>
                              <td className="p-3.5 text-center font-mono">{pdfCount}</td>
                              <td className="p-3.5 text-center font-mono">{imgCount}</td>
                              <td className="p-3.5 font-mono text-text-dim">{(projectSizeBytes / (1024 * 1024)).toFixed(1)} MB</td>
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-surface-3 text-text-secondary border border-border-bright">
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-right pr-4">
                                <button className="text-amber-primary hover:underline font-bold text-xs">
                                  Open
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* INSIDE A FOLDER (ACTIVE PROJECT MEDIA VAULT) */
              <div className="space-y-6">
                {/* Project Header Banner inside folder */}
                {activeProject && (
                  <div className="bg-surface-2/70 border border-border-bright rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-primary/10 border border-amber-primary/30 flex items-center justify-center text-amber-primary shrink-0 shadow-inner">
                        <FolderOpen size={30} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
                            {activeProject.title}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-primary/15 border border-amber-primary/30 text-amber-primary">
                            {activeProject.possessionStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-dim mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 size={12} className="text-amber-primary" />
                            {activeProject.builderName || "Direct Owner"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {activeProject.location}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-text-secondary">
                            {activeProjectMetrics.totalFiles} Assets ({activeProjectMetrics.totalSizeMB} MB)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fast Actions inside Folder */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedProject(activeProject)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 hover:bg-surface border border-border-bright text-text-primary rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>View Project</span>
                      </button>

                      {hasPermission(user, "EDIT_PROJECTS") && user?.role === "admin" && setEditingProject && setIsModalOpen && (
                        <button
                          onClick={() => {
                            setEditingProject(activeProject);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <span>Edit</span>
                        </button>
                      )}

                      <button
                        onClick={() => generalFileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-primary hover:bg-amber-secondary text-bg font-black rounded-xl text-xs transition-all shadow-md shadow-amber-primary/20 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Upload Files</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && activeProject) {
                      processFilesUpload(e.dataTransfer.files, activeProject.id);
                    }
                  }}
                  onClick={() => generalFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 group ${
                    isDragOver
                      ? "border-amber-primary bg-amber-primary/10 scale-[1.01]"
                      : "border-border-dim/80 hover:border-amber-primary/50 bg-surface-2/30 hover:bg-surface-2/60"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-surface-3 group-hover:bg-amber-primary group-hover:text-bg text-amber-primary flex items-center justify-center transition-all duration-300 shadow-sm">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary group-hover:text-amber-primary transition-colors">
                      Drag and drop PDF documents or images here, or click to browse
                    </h4>
                    <p className="text-[10px] text-text-dim mt-0.5">
                      Supports PDF, PNG, JPG, WEBP, and SVG (Automatic folder categorization & MinIO cloud synchronization)
                    </p>
                  </div>
                </div>

                {/* Tabbed Asset Filter Buttons */}
                <div className="flex items-center justify-between border-b border-border-dim pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedAssetCategory("all")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedAssetCategory === "all"
                          ? "bg-amber-primary text-bg font-black shadow-sm"
                          : "bg-surface-2 text-text-dim hover:text-text-primary"
                      }`}
                    >
                      All Assets ({activeProjectMetrics.totalFiles})
                    </button>
                    <button
                      onClick={() => setSelectedAssetCategory("pdfs")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedAssetCategory === "pdfs"
                          ? "bg-red-500 text-white font-black shadow-sm"
                          : "bg-surface-2 text-text-dim hover:text-text-primary"
                      }`}
                    >
                      <FileText size={12} />
                      <span>PDF Documents ({activeProject?.pdfs?.length || 0})</span>
                    </button>
                    <button
                      onClick={() => setSelectedAssetCategory("images")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedAssetCategory === "images"
                          ? "bg-blue-500 text-white font-black shadow-sm"
                          : "bg-surface-2 text-text-dim hover:text-text-primary"
                      }`}
                    >
                      <ImageIcon size={12} />
                      <span>Visual Gallery ({activeProject?.images?.length || 0})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => pdfInputRef.current?.click()}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 px-2.5 py-1 bg-red-500/10 rounded-lg border border-red-500/20 transition-all cursor-pointer"
                    >
                      <Plus size={12} /> Add PDF
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20 transition-all cursor-pointer"
                    >
                      <Plus size={12} /> Add Image
                    </button>
                  </div>
                </div>

                {/* PDF DOCUMENTS SECTION */}
                {(selectedAssetCategory === "all" || selectedAssetCategory === "pdfs") && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                          <FileText size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary">Official Project Documents</h3>
                          <p className="text-[10px] text-text-dim">Brochures, legal compliance, floorplans & cost sheets</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-text-dim font-bold">
                        {activeProject?.pdfs?.length || 0} Files ({activeProjectMetrics.pdfSizeMB} MB)
                      </span>
                    </div>

                    {(!activeProject?.pdfs || activeProject.pdfs.length === 0) ? (
                      <div className="p-8 text-center bg-surface-2/30 rounded-2xl border border-dashed border-border-dim flex flex-col items-center justify-center">
                        <FileQuestion size={32} className="text-text-dim mb-2 opacity-50" />
                        <p className="text-xs font-bold text-text-secondary">No PDF documents uploaded yet</p>
                        <p className="text-[10px] text-text-dim mt-0.5">Add project brochures, price lists, or floorplans</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeProject.pdfs.map((pdf: any, idx: number) => {
                          const sizeMB = (pdf.size / (1024 * 1024)).toFixed(2);
                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={idx}
                              className="group bg-surface border border-border-bright hover:border-red-500/40 rounded-2xl p-4 transition-all shadow-sm hover:shadow-xl flex flex-col justify-between"
                            >
                              <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                  <FileText size={22} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-text-primary truncate group-hover:text-red-400 transition-colors" title={pdf.name}>
                                    {pdf.name}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[10px] text-text-dim mt-1 font-mono">
                                    <span className="bg-surface-3 px-1.5 py-0.5 rounded font-bold">{sizeMB} MB</span>
                                    <span>•</span>
                                    <span className="text-red-400 font-bold uppercase">PDF Document</span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-border-dim/60 flex items-center justify-between">
                                <button
                                  onClick={() => setPreviewPdfUrl({ name: pdf.name, url: pdf.data })}
                                  className="text-[11px] font-bold text-text-dim hover:text-text-primary flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-surface-2 transition-all cursor-pointer"
                                >
                                  <Eye size={12} />
                                  <span>Preview</span>
                                </button>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      const link = document.createElement("a");
                                      link.href = pdf.data;
                                      link.download = pdf.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="p-1.5 text-text-dim hover:text-amber-primary hover:bg-surface-2 rounded-lg transition-all"
                                    title="Download File"
                                  >
                                    <Download size={14} />
                                  </button>
                                  {hasPermission(user, "DELETE_PROJECTS") && (
                                    <button
                                      onClick={() => handleDeleteItem(activeProject, pdf, "pdfs")}
                                      className="p-1.5 text-text-dim hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                      title="Delete PDF"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* IMAGES & RENDERS SECTION */}
                {(selectedAssetCategory === "all" || selectedAssetCategory === "images") && (
                  <div className="space-y-4 pt-4 border-t border-border-dim/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                          <ImageIcon size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary">Visual Gallery & Architectural Renders</h3>
                          <p className="text-[10px] text-text-dim">High-resolution elevation renders, master plans, and site photos</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-text-dim font-bold">
                        {activeProject?.images?.length || 0} Assets ({activeProjectMetrics.imageSizeMB} MB)
                      </span>
                    </div>

                    {(!activeProject?.images || activeProject.images.length === 0) ? (
                      <div className="p-8 text-center bg-surface-2/30 rounded-2xl border border-dashed border-border-dim flex flex-col items-center justify-center">
                        <ImageIcon size={32} className="text-text-dim mb-2 opacity-50" />
                        <p className="text-xs font-bold text-text-secondary">No visual assets uploaded yet</p>
                        <p className="text-[10px] text-text-dim mt-0.5">Upload photos, elevation perspectives, and layouts</p>
                      </div>
                    ) : (
                      <div
                        className={
                          insideViewMode === "gallery"
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                        }
                      >
                        {activeProject.images.map((img: any, idx: number) => {
                          const sizeMB = (img.size / (1024 * 1024)).toFixed(1);
                          return (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              key={idx}
                              className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border-bright hover:border-amber-primary/60 transition-all duration-300 shadow-md hover:shadow-2xl bg-surface-2"
                            >
                              <img
                                src={img.data}
                                alt={img.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() =>
                                      setPreviewMedia({
                                        item: img,
                                        category: "images",
                                        index: idx,
                                        total: activeProject.images.length,
                                        projectTitle: activeProject.title,
                                      })
                                    }
                                    className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-amber-primary hover:text-bg transition-all"
                                    title="View Fullscreen"
                                  >
                                    <Maximize2 size={13} />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold text-white truncate" title={img.name}>
                                      {img.name}
                                    </p>
                                    <p className="text-[9px] font-mono text-white/70">{sizeMB} MB</p>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = img.data;
                                        link.download = img.name;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      className="p-1.5 bg-white/20 hover:bg-amber-primary hover:text-bg rounded-lg text-white transition-all"
                                      title="Download Image"
                                    >
                                      <Download size={12} />
                                    </button>
                                    {hasPermission(user, "DELETE_PROJECTS") && (
                                      <button
                                        onClick={() => handleDeleteItem(activeProject, img, "images")}
                                        className="p-1.5 bg-red-500/30 hover:bg-red-500 rounded-lg text-white transition-all"
                                        title="Delete Image"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      <AnimatePresence>
        {previewMedia && previewMedia.category === "images" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
            onClick={() => setPreviewMedia(null)}
          >
            {/* Top Lightbox Controls */}
            <div
              className="flex items-center justify-between relative z-10 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{previewMedia.item.name}</span>
                  <span className="text-xs font-mono text-white/50">
                    ({previewMedia.index + 1} of {previewMedia.total})
                  </span>
                </h3>
                <p className="text-[10px] text-amber-primary font-mono">{previewMedia.projectTitle}</p>
              </div>

              <div className="flex items-center gap-2 bg-surface/80 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                <button
                  onClick={() => setLightboxZoom((prev) => Math.max(0.5, prev - 0.25))}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono text-white/80 px-1 font-bold">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  onClick={() => setLightboxZoom((prev) => Math.min(3, prev + 0.25))}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setLightboxRotation((prev) => (prev + 90) % 360)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Rotate Image"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = previewMedia.item.data;
                    link.download = previewMedia.item.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="p-2 text-amber-primary hover:bg-amber-primary hover:text-bg rounded-lg transition-all"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Close (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Center Canvas */}
            <div
              className="flex-1 flex items-center justify-center relative overflow-hidden py-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev Button */}
              {previewMedia.total > 1 && (
                <button
                  onClick={() => {
                    if (!activeProject?.images) return;
                    const imgs = activeProject.images;
                    const prevIdx = (previewMedia.index - 1 + imgs.length) % imgs.length;
                    setPreviewMedia({
                      item: imgs[prevIdx],
                      category: "images",
                      index: prevIdx,
                      total: imgs.length,
                      projectTitle: activeProject.title,
                    });
                    setLightboxZoom(1);
                    setLightboxRotation(0);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-amber-primary hover:text-bg text-white rounded-full transition-all backdrop-blur-md shadow-xl z-20 cursor-pointer"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Image with zoom/rotation */}
              <div className="max-w-5xl max-h-[75vh] transition-transform duration-200 flex items-center justify-center">
                <img
                  src={previewMedia.item.data}
                  alt={previewMedia.item.name}
                  style={{
                    transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                  }}
                  className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
                />
              </div>

              {/* Next Button */}
              {previewMedia.total > 1 && (
                <button
                  onClick={() => {
                    if (!activeProject?.images) return;
                    const imgs = activeProject.images;
                    const nextIdx = (previewMedia.index + 1) % imgs.length;
                    setPreviewMedia({
                      item: imgs[nextIdx],
                      category: "images",
                      index: nextIdx,
                      total: imgs.length,
                      projectTitle: activeProject.title,
                    });
                    setLightboxZoom(1);
                    setLightboxRotation(0);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-amber-primary hover:text-bg text-white rounded-full transition-all backdrop-blur-md shadow-xl z-20 cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Bottom Details Footer */}
            <div
              className="flex items-center justify-between text-xs text-white/70 bg-surface/60 p-3 rounded-xl border border-white/10 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4">
                <span>
                  Size: {(previewMedia.item.size / (1024 * 1024)).toFixed(2)} MB
                </span>
                <span>•</span>
                <span>Type: High-Res Raster / Architectural Photo</span>
              </div>
              <div className="text-[10px] text-white/50 font-mono">
                Press Left/Right arrows to navigate, Esc to exit
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF VIEWER MODAL */}
      <AnimatePresence>
        {previewPdfUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setPreviewPdfUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-surface border border-border-dim rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-border-dim flex justify-between items-center bg-surface-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary truncate max-w-md">
                      {previewPdfUrl.name}
                    </h3>
                    <p className="text-[10px] text-text-dim">Document Reader & Vector Preview</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = previewPdfUrl.url;
                      link.download = previewPdfUrl.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-primary hover:bg-amber-secondary text-bg font-black rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setPreviewPdfUrl(null)}
                    className="p-2 text-text-dim hover:text-text-primary hover:bg-surface-3 rounded-xl transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-black/20 p-2">
                <iframe
                  src={previewPdfUrl.url}
                  title={previewPdfUrl.name}
                  className="w-full h-full rounded-xl border border-border-dim/50 bg-[#FFFDD0]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
