import React, { useState, useEffect, useRef } from "react";
import { PdfUpload, PdfFile } from "./PdfUpload";
import { ImageUpload, ImageFile } from "./ImageUpload";
import { VideoUpload, VideoFile } from "./VideoUpload";
import {
  Trash2,
  AlertCircle,
  Loader2,
  User,
  Building2,
  MapPin,
  LocateFixed,
  Home,
  Maximize2,
  IndianRupee,
  Percent,
  Calendar,
  Layers,
  CheckCircle2,
  Sparkles,
  Bath,
  Info,
  Key,
  FileText,
  Video,
  ChevronDown,
} from "lucide-react";
import { geminiService } from "../services/geminiService";
import { CustomSelect } from "./CustomSelect";

export interface ProjectFormData {
  title: string;
  builderName: string;
  projectType: "Residential" | "Commercial";
  subType: string;
  type: string;
  configuration?: string;
  possessionStatus: "Ready to Move" | "Under Construction" | "New Launch";
  possessionDate?: string;
  launchDate?: string;
  projectSize?: string;
  towersAndFloors?: string;
  noOfTowers?: string;
  noOfFloors?: string;
  totalUnits?: string;
  sizeRange?: string;
  reraNumber: string;
  price: number | "";
  priceUnit: "Lacs" | "Cr";
  area: string;
  location: string;
  sector?: string;
  microMarket?: string;
  coordinates?: { lat: number; lng: number };
  bathrooms: string;
  pdfs: PdfFile[];
  images: { name: string; size: number; data: string }[];
  videos?: { name: string; size: number; src: string }[];
  assignedTo?: string;
  paymentPlans?: {
    plp: {
      enabled: boolean;
      type: string;
      bookingPercentage: string;
      constructionPercentage: string;
      possessionPercentage: string;
      durationMonths?: string;
      notes?: string;
      hasMilestones?: boolean;
      milestones?: {
        stage: string;
        percentage: string;
        timeline?: string;
        status?: string;
      }[];
    };
    clp: {
      enabled: boolean;
      type: string;
      stages: {
        stage: string;
        percentage: string;
        timeline?: string;
        chargeType?: string;
        status?: "Completed" | "In Progress" | "Not Started";
      }[];
      notes?: string;
    };
    subvention: {
      enabled: boolean;
      type: string;
      bookingPercentage: string;
      bankFinancedPercentage: string;
      fundingBank?: string;
      noEmiPeriodMonths?: string;
      subsidyRate?: string;
      notes?: string;
      noEmiTriggerType?: string;
      eligibleUnits?: string;
      maxLoanAmount?: string;
      preEmiInterestBornePercent?: string;
    };
  };
  bhkDetails?: Record<
    string,
    {
      sizeSqft: string;
      superAreaSqft?: string;
      carpetAreaSqft?: string;
      price: string;
      priceUnit: "Lacs" | "Cr";
      floorPlan: any[];
    }
  >;
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  existingTitles?: string[];
  existingBuilders?: string[];
  showToast?: (
    message: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;
  users?: { id: string; name: string }[];
}

const normalizeSubType = (sub: string | undefined): string => {
  if (!sub) return "Apartments";
  const s = sub.trim().toUpperCase();
  if (s === "FLATS" || s === "APARTMENT" || s === "APARTMENTS")
    return "Apartments";
  if (s === "VILLA" || s === "VILLAS") return "Villas";
  if (s === "INDEPENDENT FLOOR" || s === "INDEPENDENT FLOORS")
    return "Independent Floors";
  if (s === "PLOT" || s === "PLOTS" || s === "PLOT/LAND") return "Plots";
  if (s === "INDUSTRIAL PLOT" || s === "INDUSTRIAL PLOTS") return "Industrial Plots";
  if (s === "SHOP" || s === "SHOPS") return "Shops";
  if (s === "OFFICE" || s === "OFFICES") return "Offices";
  if (s === "KIOSK" || s === "KIOSKS") return "Kiosks";
  if (s === "STUDIO APARTMENT" || s === "STUDIO APARTMENTS")
    return "Studio Apartments";
  return sub;
};

const isBhkApplicable = (type: string): boolean => {
  return ["Apartments", "Villas", "Independent Floors"].includes(type);
};

export const defaultPaymentPlans = {
  plp: {
    enabled: false,
    type: "30:30:40",
    bookingPercentage: "30",
    constructionPercentage: "30",
    possessionPercentage: "40",
    durationMonths: "",
    notes: "",
    hasMilestones: false,
    milestones: [
      { stage: "Token Booking Amount / Sign-up", percentage: "10", timeline: "At Booking", status: "Completed" },
      { stage: "Casting of Ground Floor Floor Slab", percentage: "20", timeline: "Within 6 Months", status: "Not Started" },
      { stage: "Superstructure Slabs & Envelope Cast", percentage: "30", timeline: "Within 12 Months", status: "Not Started" },
      { stage: "Finishing & Possession Key Handover", percentage: "40", timeline: "On Possession", status: "Not Started" }
    ],
  },
  clp: {
    enabled: false,
    type: "20:40:40",
    stages: [
      { stage: "Booking Amount / Advance", percentage: "20", timeline: "At Booking", chargeType: "BSP Only", status: "Completed" as const },
      { stage: "Excavation & Plinth Work Completion", percentage: "20", timeline: "Within 3 Months", chargeType: "BSP Only", status: "Not Started" as const },
      { stage: "Superstructure / Mid-rise Slabs Completion", percentage: "20", timeline: "Within 9 Months", chargeType: "BSP + Parking", status: "Not Started" as const },
      { stage: "Outer Brickwork & Internal Plastering", percentage: "20", timeline: "Within 15 Months", chargeType: "BSP Only", status: "Not Started" as const },
      { stage: "Finished Handover / Possession", percentage: "20", timeline: "On Possession", chargeType: "All Remaining", status: "Not Started" as const },
    ],
    notes: "",
  },
  subvention: {
    enabled: false,
    type: "10:90",
    bookingPercentage: "10",
    bankFinancedPercentage: "90",
    fundingBank: "",
    noEmiPeriodMonths: "",
    subsidyRate: "100",
    notes: "",
    noEmiTriggerType: "Possession-Linked",
    eligibleUnits: "All Configurations",
    maxLoanAmount: "Up to 80% LTV",
    preEmiInterestBornePercent: "100",
  },
};

export const MICRO_MARKET_DATA: Record<string, { lat: number; lng: number; sectors: string[]; addresses: string[] }> = {
  "Dwarka Expressway": {
    lat: 28.4905,
    lng: 76.9531,
    sectors: [
      "Sector 37C", "Sector 37D", "Sector 84", "Sector 85", "Sector 86", "Sector 88",
      "Sector 89", "Sector 99", "Sector 102", "Sector 103", "Sector 104", "Sector 105",
      "Sector 106", "Sector 107", "Sector 108", "Sector 109", "Sector 110", "Sector 111",
      "Sector 112", "Sector 113"
    ],
    addresses: [
      "Dwarka Expressway, Gurugram, Haryana, India",
      "Sector 109, Dwarka Expressway, Gurugram, Haryana, India",
      "Sector 113, Dwarka Expressway, Gurugram, Haryana, India",
      "Sector 104, Dwarka Expressway, Gurugram, Haryana, India",
      "Sector 106, Dwarka Expressway, Gurugram, Haryana, India",
      "Sector 111, Dwarka Expressway, Gurugram, Haryana, India",
      "Sector 112, Dwarka Expressway, Gurugram, Haryana, India",
      "Sector 37D, Near Dwarka Expressway, Gurugram, Haryana, India",
      "Sector 89, Dwarka Expressway, Gurugram, Haryana, India"
    ]
  },
  "New Gurgaon": {
    lat: 28.4116,
    lng: 76.9427,
    sectors: [
      "Sector 76", "Sector 77", "Sector 78", "Sector 79", "Sector 80", "Sector 81",
      "Sector 82", "Sector 82A", "Sector 83", "Sector 84", "Sector 85", "Sector 86", "Sector 90",
      "Sector 91", "Sector 92", "Sector 93", "Sector 95"
    ],
    addresses: [
      "Sector 82, Near NH-8, Gurugram, Haryana, India",
      "Sector 83, New Gurgaon, Gurugram, Haryana, India",
      "Sector 79, New Gurgaon, Gurugram, Haryana, India",
      "Sector 81, New Gurgaon, Gurugram, Haryana, India",
      "Sector 90, New Gurgaon, Gurugram, Haryana, India",
      "Sector 92, New Gurgaon, Gurugram, Haryana, India",
      "Sector 85, New Gurgaon, Gurugram, Haryana, India",
      "Sector 76, New Gurgaon, Gurugram, Haryana, India"
    ]
  },
  "Golf Course Road": {
    lat: 28.4419,
    lng: 77.0984,
    sectors: [
      "Sector 26", "Sector 27", "Sector 28", "Sector 42", "Sector 43", "Sector 53",
      "Sector 54", "Sector 55", "Sector 56"
    ],
    addresses: [
      "Golf Course Road, Sector 54, Gurugram, Haryana, India",
      "Golf Course Road, Sector 53, Gurugram, Haryana, India",
      "Golf Course Road, Sector 43, Gurugram, Haryana, India",
      "DLF Phase 5, Golf Course Road, Gurugram, Haryana, India",
      "DLF Phase 1, Near Golf Course Road, Gurugram, Haryana, India",
      "Sun City, Sector 54, Gurugram, Haryana, India"
    ]
  },
  "Golf course Road Extension": {
    lat: 28.4061,
    lng: 77.0872,
    sectors: [
      "Sector 58", "Sector 59", "Sector 60", "Sector 61", "Sector 62", "Sector 63",
      "Sector 63A", "Sector 64", "Sector 65", "Sector 66", "Sector 67", "Sector 67A", "Sector 68", "Sector 69"
    ],
    addresses: [
      "Golf Course Road Extension, Sector 65, Gurugram, Haryana, India",
      "Golf Course Road Extension, Sector 62, Gurugram, Haryana, India",
      "Golf Course Road Extension, Sector 63, Gurugram, Haryana, India",
      "Golf Course Road Extension, Sector 66, Gurugram, Haryana, India",
      "Golf Course Road Extension, Sector 58, Gurugram, Haryana, India",
      "Sector 67, Golf Course Extension Road, Gurugram, Haryana, India"
    ]
  },
  "Southern Peripheral Road": {
    lat: 28.3995,
    lng: 77.0392,
    sectors: [
      "Sector 69", "Sector 70", "Sector 70A", "Sector 71", "Sector 72", "Sector 73",
      "Sector 74", "Sector 74A", "Sector 75"
    ],
    addresses: [
      "Southern Peripheral Road, Sector 70, Gurugram, Haryana, India",
      "Southern Peripheral Road, Sector 69, Gurugram, Haryana, India",
      "Sector 70A, SPR, Gurugram, Haryana, India",
      "Sector 71, SPR, Gurugram, Haryana, India",
      "SPR Link Road, Sector 73, Gurugram, Haryana, India"
    ]
  },
  "South of Gurgaon (SOHNA)": {
    lat: 28.2494,
    lng: 77.0163,
    sectors: [
      "Sohna Sector 1", "Sohna Sector 2", "Sohna Sector 4", "Sohna Sector 5", "Sohna Sector 11",
      "Sohna Sector 14", "Sohna Sector 17", "Sohna Sector 32", "Sohna Sector 33", "Sohna Sector 34",
      "Sohna Sector 35", "Sohna Sector 36"
    ],
    addresses: [
      "Sohna Road, Sohna, Gurugram, Haryana, India",
      "Sector 33, Sohna, Gurugram, Haryana, India",
      "Sector 36, Sohna, Gurugram, Haryana, India",
      "Sector 2, Sohna, Gurugram, Haryana, India",
      "Sohna Sector 5, Foothills, Gurugram, Haryana, India"
    ]
  }
};

export const getPresetSectors = (market: string, query?: string): any[] => {
  const data = MICRO_MARKET_DATA[market];
  if (!data) return [];
  let list = data.sectors;
  if (query && query.trim().length > 0) {
    const q = query.toLowerCase();
    list = list.filter((sec) => sec.toLowerCase().includes(q));
  }
  return list.map((sec, idx) => ({
    place_id: `preset-sector-${idx}`,
    display_name: `${sec}, ${market}, Gurugram, Haryana, India`,
    lat: String(data.lat),
    lon: String(data.lng)
  }));
};

export const getPresetAddresses = (market: string, query?: string): any[] => {
  const data = MICRO_MARKET_DATA[market];
  if (!data) return [];
  let list = data.addresses;
  if (query && query.trim().length > 0) {
    const q = query.toLowerCase();
    list = list.filter((addr) => addr.toLowerCase().includes(q));
  }
  return list.map((addr, idx) => ({
    place_id: `preset-address-${idx}`,
    display_name: addr,
    lat: String(data.lat),
    lon: String(data.lng)
  }));
};

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  existingTitles = [],
  existingBuilders = [],
  showToast,
  users = [],
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const selectedFromDropdownRef = useRef(false);

  const [sectorSuggestions, setSectorSuggestions] = useState<any[]>([]);
  const [isSearchingSector, setIsSearchingSector] = useState(false);
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const selectedSectorFromDropdownRef = useRef(false);

  const [formData, setFormData] = useState<ProjectFormData>(() => {
    // Draft loading has been removed so that "Project Entry" always starts completely empty on open
    return {
      title: initialData?.title || "",
      builderName: initialData?.builderName || "",
      projectType: initialData?.projectType || "Residential",
      subType: normalizeSubType(initialData?.subType),
      type: initialData?.type || "Apartments",
      configuration: initialData?.configuration || "",
      possessionStatus:
        (initialData?.possessionStatus as any) || "Ready to Move",
      possessionDate: initialData?.possessionDate || "",
      launchDate: initialData?.launchDate || "",
      projectSize: initialData?.projectSize || "",
      towersAndFloors: initialData?.towersAndFloors || "",
      noOfTowers:
        initialData?.noOfTowers ||
        (() => {
          if (initialData?.towersAndFloors) {
            const match = initialData.towersAndFloors.match(/(\d+)\s*Towers?/i);
            return match ? match[1] : "";
          }
          return "";
        })(),
      noOfFloors:
        initialData?.noOfFloors ||
        (() => {
          if (initialData?.towersAndFloors) {
            const match = initialData.towersAndFloors.match(
              /(?:G\+)?(\d+)\s*Floors?/i,
            );
            if (match) return match[1];
            const matchG = initialData.towersAndFloors.match(/G\+(\d+)/i);
            return matchG ? matchG[1] : "";
          }
          return "";
        })(),
      totalUnits: initialData?.totalUnits || "",
      sizeRange: initialData?.sizeRange || "",
      reraNumber: initialData?.reraNumber || "",
      price: initialData?.price ?? "",
      priceUnit: initialData?.priceUnit || "Lacs",
      area: initialData?.area?.toString() || "",
      location: initialData?.location || "",
      sector: (initialData as any)?.sector || "",
      microMarket: (initialData as any)?.microMarket || "",
      coordinates: initialData?.coordinates || undefined,
      bathrooms: initialData?.bathrooms || "",
      pdfs: initialData?.pdfs || [],
      images: initialData?.images || [],
      videos: initialData?.videos || [],
      assignedTo: initialData?.assignedTo || "",
      paymentPlans: initialData?.paymentPlans || defaultPaymentPlans,
    };
  });

  useEffect(() => {
    // If the address was selected from dropdown, do not run the query again.
    if (selectedFromDropdownRef.current) {
      selectedFromDropdownRef.current = false;
      return;
    }

    if (!formData.location || formData.location.trim().length < 3) {
      if (formData.microMarket) {
        setAddressSuggestions(getPresetAddresses(formData.microMarket));
      } else {
        setAddressSuggestions([]);
      }
      return;
    }

    // Do not run external query if we are showing generic "Fetching location of..." message
    if (formData.location.startsWith("Fetching location of ")) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        let searchQuery = formData.location;
        if (formData.microMarket) {
          if (!searchQuery.toLowerCase().includes("gurugram")) {
            if (formData.microMarket === "South of Gurgaon (SOHNA)") {
              searchQuery = `${searchQuery}, Sohna, Gurugram, Haryana`;
            } else {
              searchQuery = `${searchQuery}, ${formData.microMarket}, Gurugram, Haryana`;
            }
          }
        } else {
          searchQuery = searchQuery + ", Haryana";
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&accept-language=en&countrycodes=in&q=${encodeURIComponent(
            searchQuery
          )}`
        );
        if (response.ok) {
          const data = await response.json();
          // Safe fallback checking to ensure results belong to Haryana state
          const haryanaResults = (data || []).filter((item: any) =>
            item.display_name?.toLowerCase().includes("haryana")
          );
          
          const apiResults = haryanaResults.length > 0 ? haryanaResults : (data || []);
          
          // Merge API results with presets
          const presets = formData.microMarket ? getPresetAddresses(formData.microMarket, formData.location) : [];
          const seen = new Set();
          const combined = [...presets];
          presets.forEach(p => seen.add(p.display_name.toLowerCase()));
          
          apiResults.forEach((apiItem: any) => {
            if (!seen.has(apiItem.display_name.toLowerCase())) {
              seen.add(apiItem.display_name.toLowerCase());
              combined.push(apiItem);
            }
          });

          setAddressSuggestions(combined);
        }
      } catch (err) {
        console.error("Failed to fetch location suggestions:", err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500); // 500ms debounce time

    return () => clearTimeout(timer);
  }, [formData.location, formData.microMarket]);

  useEffect(() => {
    // If the sector was selected from dropdown, do not run the query again.
    if (selectedSectorFromDropdownRef.current) {
      selectedSectorFromDropdownRef.current = false;
      return;
    }

    if (!formData.sector || formData.sector.trim().length < 3) {
      if (formData.microMarket) {
        setSectorSuggestions(getPresetSectors(formData.microMarket));
      } else {
        setSectorSuggestions([]);
      }
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSector(true);
      try {
        let searchQuery = formData.sector;
        if (formData.microMarket) {
          if (!searchQuery.toLowerCase().includes("gurugram")) {
            if (formData.microMarket === "South of Gurgaon (SOHNA)") {
              searchQuery = `${searchQuery}, Sohna, Gurugram, Haryana`;
            } else {
              searchQuery = `${searchQuery}, ${formData.microMarket}, Gurugram, Haryana`;
            }
          }
        } else {
          searchQuery = searchQuery + ", Haryana";
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&accept-language=en&countrycodes=in&q=${encodeURIComponent(
            searchQuery
          )}`
        );
        if (response.ok) {
          const data = await response.json();
          // Safe fallback checking to ensure results belong to Haryana state
          const haryanaResults = (data || []).filter((item: any) =>
            item.display_name?.toLowerCase().includes("haryana")
          );
          
          const apiResults = haryanaResults.length > 0 ? haryanaResults : (data || []);
          
          // Merge API results with presets
          const presets = formData.microMarket ? getPresetSectors(formData.microMarket, formData.sector) : [];
          const seen = new Set();
          const combined = [...presets];
          presets.forEach(p => seen.add(p.display_name.toLowerCase()));
          
          apiResults.forEach((apiItem: any) => {
            if (!seen.has(apiItem.display_name.toLowerCase())) {
              seen.add(apiItem.display_name.toLowerCase());
              combined.push(apiItem);
            }
          });

          setSectorSuggestions(combined);
        }
      } catch (err) {
        console.error("Failed to fetch sector suggestions:", err);
      } finally {
        setIsSearchingSector(false);
      }
    }, 500); // 500ms debounce time

    return () => clearTimeout(timer);
  }, [formData.sector, formData.microMarket]);

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProjectFormData, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ProjectFormData, boolean>>
  >({});

  const validateField = (name: keyof ProjectFormData, value: any) => {
    let error = "";
    switch (name) {
      case "title":
        if (!value) error = "Title is required";
        else if (value.length < 5)
          error = "Title must be at least 5 characters";
        else if (value.length > 100)
          error = "Title must be less than 100 characters";
        else if (existingTitles.includes(value) && value !== initialData?.title)
          error = "Project with this title already exists";
        break;
      case "builderName":
        if (!value) error = "Builder Name is required";
        break;
      case "reraNumber":
        if (!value) error = "RERA Number is required";
        break;
      case "pdfs":
        if (!value || value.length === 0)
          error = "At least one PDF document is required";
        break;
      case "location":
        if (!value) error = "Location is required";
        break;
      case "microMarket":
        if (!value) error = "Micro Market selection is required";
        break;
      case "projectType":
        if (!value) error = "Project type is required";
        break;
      case "subType":
        if (!value) error = "Sub-type is required";
        break;
      case "possessionStatus":
        if (!value) error = "Possession status is required";
        break;
      case "launchDate":
        if (formData.possessionStatus === "New Launch" && !value) {
          error = "Launch date is required for New Launch projects";
        }
        break;
      case "configuration":
        if (isBhkApplicable(formData.subType) && !value) {
          error = "Configuration (BHK) is required";
        }
        break;
      case "price":
        if (isBhkApplicable(formData.subType)) {
          error = "";
        } else {
          if (value === "" || value === null) error = "Price is required";
          else if (isNaN(Number(value))) error = "Price must be a number";
          else if (Number(value) <= 0)
            error = "Price must be greater than zero";
          else if (formData.priceUnit === "Lacs" && Number(value) >= 100)
            error = "Use Cr for values 100 Lacs and above";
        }
        break;
      case "area":
        if (isBhkApplicable(formData.subType)) {
          error = "";
        } else {
          if (!value) error = "Area is required";
        }
        break;
    }
    return error;
  };

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast?.("Geolocation is not supported by your browser", "error");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();

          if (data && data.display_name) {
            setFormData((prev) => ({ ...prev, location: data.display_name }));
          } else {
            setFormData((prev) => ({
              ...prev,
              location: `${latitude}, ${longitude}`,
            }));
          }
          if (touched.location) {
            setErrors((prev) => ({ ...prev, location: "" }));
          }
          showToast?.("Location detected successfully", "success");
        } catch (error) {
          console.error("Error Reverse Geocoding:", error);
          setFormData((prev) => ({
            ...prev,
            location: `${latitude}, ${longitude}`,
          }));
          if (touched.location) {
            setErrors((prev) => ({ ...prev, location: "" }));
          }
          showToast?.(
            "Location detected, but address lookup failed",
            "warning",
          );
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        showToast?.(`Error detecting location: ${error.message}`, "error");
      },
    );
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    let parsedValue: any = value;

    if (name === "price") {
      parsedValue = value === "" ? "" : Number(value);
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: parsedValue };
      if (name === "subType") {
        newData.type = parsedValue;
      }
      return newData;
    });

    if (touched[name as keyof ProjectFormData]) {
      const error = validateField(name as keyof ProjectFormData, parsedValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      priceUnit: e.target.value as "Lacs" | "Cr",
    }));
  };

  const handleMicroMarketChange = async (market: string) => {
    setFormData((prev) => ({
      ...prev,
      microMarket: market,
      sector: "",
      location: market ? "Fetching location of " + market + "..." : "",
    }));

    setTouched((prev) => ({ ...prev, microMarket: true }));
    setErrors((prev) => ({ ...prev, microMarket: "" }));

    if (!market) {
      setFormData((prev) => ({
        ...prev,
        location: "",
        coordinates: undefined,
      }));
      return;
    }

    setIsSearchingLocation(true);
    try {
      let searchQuery = market;
      if (market === "South of Gurgaon (SOHNA)") {
        searchQuery = "Sohna, Gurugram";
      } else {
        searchQuery = `${market}, Gurugram`;
      }
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&accept-language=en&countrycodes=in&q=${encodeURIComponent(
          searchQuery + ", Haryana"
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        const haryanaResults = (data || []).filter((item: any) =>
          item.display_name?.toLowerCase().includes("haryana")
        );
        const bestResult = haryanaResults[0] || data?.[0];
        if (bestResult) {
          selectedFromDropdownRef.current = true;
          setFormData((prev) => ({
            ...prev,
            location: bestResult.display_name,
            coordinates: {
              lat: parseFloat(bestResult.lat),
              lng: parseFloat(bestResult.lon),
            },
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            location: `${market}, Gurugram, Haryana, India`,
          }));
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          location: `${market}, Gurugram, Haryana, India`,
        }));
      }
    } catch (err) {
      console.error("Failed to auto-fetch micro market location:", err);
      setFormData((prev) => ({
        ...prev,
        location: `${market}, Gurugram, Haryana, India`,
      }));
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(
      name as keyof ProjectFormData,
      formData[name as keyof ProjectFormData],
    );
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate all fields
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof ProjectFormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    // Mark all as touched
    const allTouched: any = {};
    (Object.keys(formData) as Array<keyof ProjectFormData>).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (isValid) {
      try {
        setIsSubmitting(true);
        let submissionData = { ...formData };
        if (formData.noOfTowers || formData.noOfFloors) {
          const towersStr = formData.noOfTowers
            ? `${formData.noOfTowers} Towers`
            : "";
          const floorsStr = formData.noOfFloors
            ? `G+${formData.noOfFloors} Floors`
            : "";
          submissionData.towersAndFloors = [towersStr, floorsStr]
            .filter(Boolean)
            .join(", ");
        }
        if (isBhkApplicable(formData.subType)) {
          const details = Object.entries(formData.bhkDetails || {}).filter(
            ([key]) => formData.configuration?.split(", ").includes(key),
          );

          const sizes = details.map(([_, v]) => v.sizeSqft).filter(Boolean);
          submissionData.area = sizes.join(", ");

          const prices = details
            .map(([_, v]) => ({
              price: Number(v.price),
              unit: v.priceUnit,
            }))
            .filter((p) => !isNaN(p.price) && p.price > 0);

          if (prices.length > 0) {
            const firstPrice = prices[0];
            submissionData.price = firstPrice.price;
            submissionData.priceUnit = firstPrice.unit;
          } else {
            submissionData.price = "";
          }
        }
        await onSubmit(submissionData);
        if (!initialData) {
          localStorage.removeItem("draft_project");
        }
      } catch (err) {
        console.error("Form submission error:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Scroll to top to show error summary
      const errorSummary = document.getElementById("error-summary");
      if (errorSummary) {
        errorSummary.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        const formElement = e.currentTarget as HTMLFormElement;
        formElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const residentialSubTypes = [
    "Apartments",
    "Villas",
    "Independent Floors",
    "Plots",
  ];
  const commercialSubTypes = [
    "Shops",
    "Offices",
    "Kiosks",
    "Industrial Plots",
    "Studio Apartments",
  ];

  const bhkConfigurations: Record<string, string[]> = {
    "1BHK": ["1BHK", "1BHK + 1T"],
    "2BHK": ["2BHK", "2BHK + 2T"],
    "3BHK": ["3BHK + 2T", "3BHK + 2T + Servent room", "3BHK + 3T + Utility"],
    "4BHK": [
      "4BHK + 2T + Utility",
      "4BHK + 3T + Servent",
      "4BHK + 3T + Family Lounge + Sarvent",
      "4BHK + 4T + Utility",
    ],
    Penthouse: [
      "5BHK/Penthouse + 6T + Utility",
      "Penthouse + Terrace",
      "Luxury Penthouse",
    ],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Quick Suggestions Section */}
      <div className="mb-8 space-y-4">
        <div className="bg-amber-primary/5 border border-amber-primary/20 rounded-2xl p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-primary/5 rounded-full -mr-16 -mt-16 blur-[40px]" />
          <div className="relative z-10 flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-black text-amber-primary uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="animate-pulse" /> Suggested
                  Builders
                </h5>
                <span className="text-[9px] text-text-dim uppercase font-bold">
                  {existingBuilders.length} total
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {existingBuilders.length > 0 ? (
                  existingBuilders.slice(0, 30).map((builder, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          builderName: builder,
                        }));
                        setTouched((prev) => ({ ...prev, builderName: true }));
                        setErrors((prev) => ({ ...prev, builderName: "" }));
                      }}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border whitespace-nowrap ${
                        formData.builderName === builder
                          ? "bg-amber-primary text-bg border-amber-primary shadow-lg shadow-amber-primary/20"
                          : "bg-surface border-border-dim text-text-secondary hover:border-amber-primary/40 hover:text-amber-primary"
                      }`}
                    >
                      {builder}
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-text-dim italic py-2">
                    No existing builders found
                  </p>
                )}
              </div>
            </div>

            <div className="w-px bg-border-dim/30 hidden md:block" />

            <div className="md:w-1/2 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-black text-amber-primary uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="animate-pulse" /> Suggested
                  Projects
                </h5>
                <span className="text-[9px] text-text-dim uppercase font-bold">
                  {existingTitles.length} total
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {existingTitles.length > 0 ? (
                  existingTitles.slice(0, 30).map((title, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, title }));
                        setTouched((prev) => ({ ...prev, title: true }));
                        setErrors((prev) => ({ ...prev, title: "" }));
                      }}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border whitespace-nowrap ${
                        formData.title === title
                          ? "bg-amber-primary text-bg border-amber-primary shadow-lg shadow-amber-primary/20"
                          : "bg-surface border-border-dim text-text-secondary hover:border-amber-primary/40 hover:text-amber-primary"
                      }`}
                    >
                      {title}
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-text-dim italic py-2">
                    No existing projects found
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(errors).some((k) => errors[k as keyof ProjectFormData]) && (
        <div
          id="error-summary"
          className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
          role="alert"
        >
          <AlertCircle size={16} />
          <span className="font-bold uppercase tracking-wider">
            Please fix the errors below before saving.
          </span>
        </div>
      )}

      {/* Section 1: Basic Details */}
      <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 text-amber-primary border-b border-border-dim pb-3 mb-4">
          <Info size={18} />
          <h4 className="text-xs font-bold uppercase tracking-[0.15em]">
            Basic Details
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="title"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Building2 size={12} className="text-amber-primary/70" /> Project
              Title <span className="text-amber-primary">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Building2 size={14} />
              </div>
              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
                className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${
                  errors.title && touched.title
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border-bright focus:border-amber-primary focus:bg-surface-3"
                }`}
                placeholder="e.g. Luxury 3BHK Apartment in Downtown"
                maxLength={100}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              {errors.title && touched.title && (
                <p
                  id="title-error"
                  className="text-[9px] text-red-400 flex items-center gap-1"
                >
                  <AlertCircle size={10} /> {errors.title}
                </p>
              )}
              <div className="text-[9px] text-text-dim ml-auto">
                {formData.title.length}/100
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="builderName"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <User size={12} className="text-amber-primary/70" /> Builder Name{" "}
              <span className="text-amber-primary">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <User size={14} />
              </div>
              <input
                id="builderName"
                name="builderName"
                value={formData.builderName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${
                  errors.builderName && touched.builderName
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border-bright focus:border-amber-primary focus:bg-surface-3"
                }`}
                placeholder="e.g. DLF, Godrej Properties"
                list="builder-names-list"
              />
              <datalist id="builder-names-list">
                {existingBuilders.map((builder, idx) => (
                  <option key={idx} value={builder} />
                ))}
              </datalist>
            </div>
            {errors.builderName && touched.builderName && (
              <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.builderName}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reraNumber"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <FileText size={12} className="text-amber-primary/70" /> RERA
              Number <span className="text-amber-primary">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <FileText size={14} />
              </div>
              <input
                id="reraNumber"
                name="reraNumber"
                value={formData.reraNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${
                  errors.reraNumber && touched.reraNumber
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border-bright focus:border-amber-primary focus:bg-surface-3"
                }`}
                placeholder="e.g. UPRERAPRJ123456"
              />
            </div>
            {errors.reraNumber && touched.reraNumber && (
              <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.reraNumber}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="projectType"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Building2 size={12} className="text-amber-primary/70" /> Project
              Type <span className="text-amber-primary">*</span>
            </label>
            <div className="flex gap-2">
              {["Residential", "Commercial"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const newType = type as "Residential" | "Commercial";
                    setFormData((prev) => ({
                      ...prev,
                      projectType: newType,
                      subType:
                        newType === "Residential" ? "Apartments" : "Shops",
                    }));
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${formData.projectType === type ? "bg-amber-primary text-bg border-amber-primary" : "bg-surface-2 text-text-dim border-border-bright hover:border-amber-primary/50"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="subType"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Layers size={12} className="text-amber-primary/70" /> Sub-Type{" "}
              <span className="text-amber-primary">*</span>
            </label>
            <CustomSelect
              id="subType"
              value={formData.subType || ""}
              onChange={(val) => handleChange({ target: { name: "subType", value: val } } as any)}
              options={formData.projectType === "Residential" ? residentialSubTypes : commercialSubTypes}
              placeholder="Select Sub-Type..."
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="possessionStatus"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Key size={12} className="text-amber-primary/70" /> Possession
              Status <span className="text-amber-primary">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["Ready to Move", "Under Construction", "New Launch"].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      const e = {
                        target: { name: "possessionStatus", value: status },
                      } as any;
                      handleChange(e);
                    }}
                    className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${formData.possessionStatus === status ? "bg-amber-primary text-bg border-amber-primary" : "bg-surface-2 text-text-dim border-border-bright hover:border-amber-primary/50"}`}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
          </div>

          {(formData.possessionStatus === "Ready to Move" ||
            formData.possessionStatus === "Under Construction") && (
            <div className="space-y-2">
              <label
                htmlFor="possessionDate"
                className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
              >
                <Calendar size={12} className="text-amber-primary/70" />{" "}
                {formData.possessionStatus === "Ready to Move"
                  ? "Ready Since"
                  : "Expected Possession"}{" "}
                <span className="text-amber-primary">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                  <Calendar size={14} />
                </div>
                <input
                  id="possessionDate"
                  name="possessionDate"
                  type="date"
                  value={formData.possessionDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${
                    errors.possessionDate && touched.possessionDate
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-border-bright focus:border-amber-primary focus:bg-surface-3"
                  }`}
                />
              </div>
            </div>
          )}

          {formData.possessionStatus === "New Launch" && (
            <div className="space-y-2">
              <label
                htmlFor="launchDate"
                className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
              >
                <Calendar size={12} className="text-amber-primary/70" /> Launch
                Date <span className="text-amber-primary">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                  <Calendar size={14} />
                </div>
                <input
                  id="launchDate"
                  name="launchDate"
                  type="date"
                  value={formData.launchDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${
                    errors.launchDate && touched.launchDate
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-border-bright focus:border-amber-primary focus:bg-surface-3"
                  }`}
                />
              </div>
              {errors.launchDate && touched.launchDate && (
                <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.launchDate}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Property Configuration */}
      <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 text-amber-primary border-b border-border-dim pb-3 mb-4">
          <Home size={18} />
          <h4 className="text-xs font-bold uppercase tracking-[0.15em]">
            Property Configuration
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 border-b border-border-dim pb-5 mb-5">
          <div className="space-y-2">
            <label
              htmlFor="projectSize"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Layers size={12} className="text-amber-primary/70" /> Land Parcel
              (Acres)
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Sparkles size={14} />
              </div>
              <input
                id="projectSize"
                name="projectSize"
                type="text"
                placeholder="e.g. 5, 10.5"
                value={formData.projectSize || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-amber-primary focus:bg-surface-3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="noOfTowers"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Building2 size={12} className="text-amber-primary/70" /> No. of
              Towers
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Building2 size={14} />
              </div>
              <input
                id="noOfTowers"
                name="noOfTowers"
                type="text"
                placeholder="e.g. 10"
                value={formData.noOfTowers || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-amber-primary focus:bg-surface-3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="noOfFloors"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Building2 size={12} className="text-amber-primary/70" /> No. of
              Floors
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Building2 size={14} />
              </div>
              <input
                id="noOfFloors"
                name="noOfFloors"
                type="text"
                placeholder="e.g. G+15"
                value={formData.noOfFloors || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-amber-primary focus:bg-surface-3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="totalUnits"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Home size={12} className="text-amber-primary/70" /> Total Units
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Home size={14} />
              </div>
              <input
                id="totalUnits"
                name="totalUnits"
                type="text"
                placeholder="e.g. 500"
                value={formData.totalUnits || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-amber-primary focus:bg-surface-3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="sizeRange"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Maximize2 size={12} className="text-amber-primary/70" /> Unit
              Size (Sq.Ft.)
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Maximize2 size={14} />
              </div>
              <input
                id="sizeRange"
                name="sizeRange"
                type="text"
                placeholder="e.g. 1200 - 1500"
                value={formData.sizeRange || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-amber-primary focus:bg-surface-3"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
          {(formData.subType === "Apartments" ||
            formData.subType === "Villas" ||
            formData.subType === "Independent Floors") && (
            <div className="space-y-4">
              <label
                htmlFor="configuration"
                className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
              >
                <Home size={12} className="text-amber-primary/70" />{" "}
                Configuration (BHK Options){" "}
                <span className="text-amber-primary">*</span>
              </label>

              <div className="space-y-6">
                {(Object.keys(bhkConfigurations) as string[]).map((bhkType) => {
                  const selectedInGroup = bhkConfigurations[bhkType].filter(
                    (config) =>
                      formData.configuration?.split(", ").includes(config),
                  );
                  return (
                    <div key={bhkType} className="space-y-2">
                      <h5 className="text-[9px] font-black text-amber-primary uppercase tracking-widest">
                        {bhkType} Options
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {bhkConfigurations[bhkType].map((config) => {
                          const isSelected = formData.configuration
                            ?.split(", ")
                            .includes(config);
                          return (
                            <button
                              key={config}
                              type="button"
                              onClick={() => {
                                let newConfig = formData.configuration
                                  ? formData.configuration
                                      .split(", ")
                                      .filter(Boolean)
                                  : [];
                                if (isSelected) {
                                  newConfig = newConfig.filter(
                                    (c) => c !== config,
                                  );
                                } else {
                                  newConfig.push(config);
                                }
                                // Replace 5BHK with Penthouse label if it's strictly 5BHK
                                const formattedConfig = newConfig.map((c) =>
                                  c === "5BHK" ? "Penthouse" : c,
                                );
                                const e = {
                                  target: {
                                    name: "configuration",
                                    value: formattedConfig.join(", "),
                                  },
                                } as any;
                                handleChange(e);
                              }}
                              className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${isSelected ? "bg-amber-primary text-bg border-amber-primary shadow-lg shadow-amber-primary/10 scale-[1.02]" : "bg-surface-2 text-text-dim border-border-bright hover:border-amber-primary/50"}`}
                            >
                              {config}
                            </button>
                          );
                        })}
                      </div>
                      {/* Inline Details for Selected BHKs */}
                      {selectedInGroup.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 mt-3">
                          {selectedInGroup.map((config) => (
                            <div
                              key={config + "-details"}
                              className="p-4 bg-surface-2/40 border border-border-bright rounded-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2"
                            >
                              <div className="flex items-center gap-2 border-b border-border-dim/50 pb-2">
                                <Home
                                  size={14}
                                  className="text-amber-primary"
                                />
                                <h6 className="text-[11px] font-bold text-text-primary uppercase tracking-widest">
                                  {config} Details
                                </h6>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Column 1: Price */}
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider flex justify-between">
                                    <span>Price (Investment)</span>
                                    {formData.bhkDetails?.[config]?.price && (
                                      <span className="text-amber-primary">
                                        ₹
                                        {(formData.bhkDetails[config]
                                          .priceUnit === "Lacs"
                                          ? Number(
                                              formData.bhkDetails[config].price,
                                            ) * 100000
                                          : Number(
                                              formData.bhkDetails[config].price,
                                            ) * 10000000
                                        ).toLocaleString()}
                                      </span>
                                    )}
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      placeholder="e.g. 1.5"
                                      className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary focus:bg-surface-3 transition-colors"
                                      value={
                                        formData.bhkDetails?.[config]?.price ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          bhkDetails: {
                                            ...(prev.bhkDetails || {}),
                                            [config]: {
                                              ...(prev.bhkDetails?.[config] || {
                                                sizeSqft: "",
                                                superAreaSqft: "",
                                                carpetAreaSqft: "",
                                                price: "",
                                                priceUnit: "Lacs",
                                                floorPlan: [],
                                              }),
                                              price: e.target.value,
                                            },
                                          },
                                        }))
                                      }
                                    />
                                    <CustomSelect
                                      variant="nested"
                                      value={formData.bhkDetails?.[config]?.priceUnit || "Lacs"}
                                      onChange={(val) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          bhkDetails: {
                                            ...(prev.bhkDetails || {}),
                                            [config]: {
                                              ...(prev.bhkDetails?.[config] || {
                                                sizeSqft: "",
                                                superAreaSqft: "",
                                                carpetAreaSqft: "",
                                                price: "",
                                                priceUnit: "Lacs" as const,
                                                floorPlan: [],
                                              }),
                                              priceUnit: val as "Lacs" | "Cr",
                                            },
                                          },
                                        }))
                                      }
                                      options={["Lacs", "Cr"]}
                                      className="w-24"
                                    />
                                  </div>
                                </div>

                                {/* Column 2: Floor Plan */}
                                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                                  <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                                    Floor Plan Preview (Images)
                                  </label>
                                  <ImageUpload
                                    images={
                                      formData.bhkDetails?.[config]
                                        ?.floorPlan || []
                                    }
                                    onChange={(images) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        bhkDetails: {
                                          ...(prev.bhkDetails || {}),
                                          [config]: {
                                            ...(prev.bhkDetails?.[config] || {
                                              sizeSqft: "",
                                              superAreaSqft: "",
                                              carpetAreaSqft: "",
                                              price: "",
                                              priceUnit: "Lacs",
                                              floorPlan: [],
                                            }),
                                            floorPlan: images,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </div>

                                {/* Column 3: Unit Size */}
                                <div className="space-y-1.5 sm:col-span-1">
                                  <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider block">
                                    Unit Size (Sq.Ft.)
                                  </label>
                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div className="space-y-1">
                                      <span className="text-[8px] font-bold text-text-dim/80 uppercase tracking-widest block">SUPER AREA</span>
                                      <input
                                        type="number"
                                        placeholder="Super Area"
                                        className="w-full bg-surface border border-border-bright rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-amber-primary focus:bg-surface-3 transition-colors"
                                        value={
                                          formData.bhkDetails?.[config]?.superAreaSqft ||
                                          ""
                                        }
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setFormData((prev) => {
                                            const bhk = prev.bhkDetails?.[config] || {
                                              sizeSqft: "",
                                              superAreaSqft: "",
                                              carpetAreaSqft: "",
                                              price: "",
                                              priceUnit: "Lacs",
                                              floorPlan: [],
                                            };
                                            const computedSizeSqft = val || bhk.carpetAreaSqft || "";
                                            return {
                                              ...prev,
                                              bhkDetails: {
                                                ...(prev.bhkDetails || {}),
                                                [config]: {
                                                  ...bhk,
                                                  superAreaSqft: val,
                                                  sizeSqft: computedSizeSqft,
                                                },
                                              },
                                            };
                                          });
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[8px] font-bold text-text-dim/80 uppercase tracking-widest block">CARPET AREA</span>
                                      <input
                                        type="number"
                                        placeholder="Carpet Area"
                                        className="w-full bg-surface border border-border-bright rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-amber-primary focus:bg-surface-3 transition-colors"
                                        value={
                                          formData.bhkDetails?.[config]?.carpetAreaSqft ||
                                          ""
                                        }
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setFormData((prev) => {
                                            const bhk = prev.bhkDetails?.[config] || {
                                              sizeSqft: "",
                                              superAreaSqft: "",
                                              carpetAreaSqft: "",
                                              price: "",
                                              priceUnit: "Lacs",
                                              floorPlan: [],
                                            };
                                            const computedSizeSqft = bhk.superAreaSqft || val || "";
                                            return {
                                              ...prev,
                                              bhkDetails: {
                                                ...(prev.bhkDetails || {}),
                                                [config]: {
                                                  ...bhk,
                                                  carpetAreaSqft: val,
                                                  sizeSqft: computedSizeSqft,
                                                },
                                              },
                                            };
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.configuration && touched.configuration && (
                <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.configuration}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section: Payment Plans */}
      <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 text-amber-primary border-b border-border-dim pb-3 mb-4">
          <Percent size={18} />
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] flex-1">
            Payment Plans
          </h4>
          <span className="text-[10px] text-text-dim uppercase font-semibold">
            Configure flexible payment structures
          </span>
        </div>

        <div className="space-y-6">
          <p className="text-xs text-text-dim leading-relaxed">
            Select and configure the payment plans available for this project. Buyers will be able to review these details on the project showcase page.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PLP Card Toggle */}
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => {
                  const currentPlp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                  const newEnabled = !currentPlp.enabled;
                  const currentClp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                  const currentSub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                  return {
                    ...prev,
                    paymentPlans: {
                      ...(prev.paymentPlans || defaultPaymentPlans),
                      plp: {
                        ...currentPlp,
                        enabled: newEnabled,
                      },
                      ...(newEnabled ? {
                        clp: {
                          ...currentClp,
                          enabled: false,
                        },
                        subvention: {
                          ...currentSub,
                          enabled: false,
                        },
                      } : {}),
                    },
                  };
                });
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                formData.paymentPlans?.plp?.enabled
                  ? "border-amber-primary bg-amber-primary/5 shadow-md"
                  : "border-border-bright bg-surface-2 hover:border-amber-primary/30"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                  PLP (Possession-Linked)
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    formData.paymentPlans?.plp?.enabled ? "bg-amber-primary" : "bg-text-dim/30"
                  }`}
                />
              </div>
              <span className="text-[10px] text-text-secondary">
                Pay a fraction during booking & construction, and the rest on possession.
              </span>
            </button>

            {/* CLP Card Toggle */}
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => {
                  const currentClp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                  const newEnabled = !currentClp.enabled;
                  const currentPlp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                  const currentSub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                  return {
                    ...prev,
                    paymentPlans: {
                      ...(prev.paymentPlans || defaultPaymentPlans),
                      clp: {
                        ...currentClp,
                        enabled: newEnabled,
                      },
                      ...(newEnabled ? {
                        plp: {
                          ...currentPlp,
                          enabled: false,
                        },
                        subvention: {
                          ...currentSub,
                          enabled: false,
                        },
                      } : {}),
                    },
                  };
                });
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                formData.paymentPlans?.clp?.enabled
                  ? "border-amber-primary bg-amber-primary/5 shadow-md"
                  : "border-border-bright bg-surface-2 hover:border-amber-primary/30"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                  CLP (Construction-Linked)
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    formData.paymentPlans?.clp?.enabled ? "bg-amber-primary" : "bg-text-dim/30"
                  }`}
                />
              </div>
              <span className="text-[10px] text-text-secondary">
                Instalments connected directly with step-by-step construction milestones.
              </span>
            </button>

            {/* SUBVENTION Card Toggle */}
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => {
                  const currentSub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                  const newEnabled = !currentSub.enabled;
                  const currentPlp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                  const currentClp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                  return {
                    ...prev,
                    paymentPlans: {
                      ...(prev.paymentPlans || defaultPaymentPlans),
                      subvention: {
                        ...currentSub,
                        enabled: newEnabled,
                      },
                      ...(newEnabled ? {
                        plp: {
                          ...currentPlp,
                          enabled: false,
                        },
                        clp: {
                          ...currentClp,
                          enabled: false,
                        },
                      } : {}),
                    },
                  };
                });
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                formData.paymentPlans?.subvention?.enabled
                  ? "border-amber-primary bg-amber-primary/5 shadow-md"
                  : "border-border-bright bg-surface-2 hover:border-amber-primary/30"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                  SUBVENTION PLAN
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    formData.paymentPlans?.subvention?.enabled ? "bg-amber-primary" : "bg-text-dim/30"
                  }`}
                />
              </div>
              <span className="text-[10px] text-text-secondary">
                No-EMI scheme funded via bank partners. Interest covered by builder till possession.
              </span>
            </button>
          </div>

          {/* Form details rendered when enabled */}
          {(formData.paymentPlans?.plp?.enabled ||
            formData.paymentPlans?.clp?.enabled ||
            formData.paymentPlans?.subvention?.enabled) && (
            <div className="space-y-6 pt-4 border-t border-border-dim/40">
              
              {/* PLP Details Form */}
              {formData.paymentPlans?.plp?.enabled && (
                <div className="p-5 bg-surface-2/40 border border-border-bright rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 border-b border-border-dim/50 pb-2">
                    <span className="w-4 h-4 rounded-full bg-amber-primary/20 text-amber-primary flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    <h5 className="text-[11px] font-black text-text-primary uppercase tracking-widest">
                      Possession-Linked Plan (PLP) Setup
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        Select Ratio Structure
                      </label>
                      <CustomSelect
                        variant="nested"
                        value={formData.paymentPlans?.plp?.type || "Custom"}
                        onChange={(val) => {
                          setFormData((prev) => {
                            const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                            let b = plp.bookingPercentage;
                            let c = plp.constructionPercentage;
                            let p = plp.possessionPercentage;
                            let hasMilestones = plp.hasMilestones;
                            let milestones = plp.milestones;

                            if (val === "30:30:40") { 
                              b = "30"; c = "30"; p = "40"; 
                              hasMilestones = false;
                            }
                            else if (val === "10:20:70") { 
                              b = "10"; c = "20"; p = "70"; 
                              hasMilestones = false;
                            }
                            else if (val === "35:25:40") { 
                              b = "35"; c = "25"; p = "40"; 
                              hasMilestones = false;
                            }
                            else if (val === "20:65:15") { 
                              b = "20"; c = "65"; p = "15"; 
                              hasMilestones = false;
                            }
                            else if (val === "20*5") {
                              b = "20"; c = "60"; p = "20";
                              hasMilestones = true;
                              milestones = [
                                { stage: "Booking / Token Stage", percentage: "20", timeline: "At Booking", status: "Completed" },
                                { stage: "Plinth / Ground Floor Casting Stage", percentage: "20", timeline: "Within 6 Months", status: "Not Started" },
                                { stage: "Superstructure Slabs Complete Stage", percentage: "20", timeline: "Within 12 Months", status: "Not Started" },
                                { stage: "Brickwork, Plaster & MEP Stage", percentage: "20", timeline: "Within 18 Months", status: "Not Started" },
                                { stage: "Finishing & Possession Key Handover Stage", percentage: "20", timeline: "On Possession", status: "Not Started" }
                              ];
                            }
                            else if (val === "25*4") {
                              b = "25"; c = "50"; p = "25";
                              hasMilestones = true;
                              milestones = [
                                { stage: "Booking / Token Stage", percentage: "25", timeline: "At Booking", status: "Completed" },
                                { stage: "Superstructure Slabs & Envelope Cast Stage", percentage: "25", timeline: "Within 8 Months", status: "Not Started" },
                                { stage: "Internal Finishes & Service MEP Stage", percentage: "25", timeline: "Within 14 Months", status: "Not Started" },
                                { stage: "Keys Handover / Finished Possession Stage", percentage: "25", timeline: "On Possession", status: "Not Started" }
                              ];
                            }

                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                plp: {
                                  ...plp,
                                  type: val,
                                  bookingPercentage: b,
                                  constructionPercentage: c,
                                  possessionPercentage: p,
                                  hasMilestones,
                                  milestones,
                                },
                              },
                            };
                          });
                        }}
                        options={[
                          { value: "30:30:40", label: "30:30:40 (Popular)", desc: "30% Booking, 30% Construction, 40% Possession" },
                          { value: "10:20:70", label: "10:20:70 (Premium)", desc: "10% Booking, 20% Construction, 70% Possession" },
                          { value: "35:25:40", label: "35:25:40 (Pre-launch)", desc: "35% Booking, 25% Construction, 40% Possession" },
                          { value: "20:65:15", label: "20:65:15 (Sub-linked)", desc: "20% Booking, 65% Construction, 15% Possession" },
                          { value: "20*5", label: "20*5 Plan (5 x 20%)", desc: "5 Milestones of 20% each" },
                          { value: "25*4", label: "25*4 Plan (4 x 25%)", desc: "4 Milestones of 25% each" },
                          { value: "Custom", label: "Custom Ratio", desc: "Manually specify percentages" }
                        ]}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        Booking Amt (%)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        disabled={formData.paymentPlans?.plp?.type !== "Custom"}
                        className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary transition-colors disabled:opacity-60"
                        value={formData.paymentPlans?.plp?.bookingPercentage || ""}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                plp: {
                                  ...plp,
                                  bookingPercentage: e.target.value,
                                },
                              },
                            };
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        Interim/Construction (%)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        disabled={formData.paymentPlans?.plp?.type !== "Custom"}
                        className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary transition-colors disabled:opacity-60"
                        value={formData.paymentPlans?.plp?.constructionPercentage || ""}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                plp: {
                                  ...plp,
                                  constructionPercentage: e.target.value,
                                },
                              },
                            };
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        On Possession (%)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 40"
                        disabled={formData.paymentPlans?.plp?.type !== "Custom"}
                        className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary transition-colors disabled:opacity-60"
                        value={formData.paymentPlans?.plp?.possessionPercentage || ""}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                plp: {
                                  ...plp,
                                  possessionPercentage: e.target.value,
                                },
                              },
                            };
                          });
                        }}
                      />
                    </div>



                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider flex justify-between">
                        <span>Ratio Validation</span>
                        {(() => {
                          const sum =
                            Number(formData.paymentPlans?.plp?.bookingPercentage || 0) +
                            Number(formData.paymentPlans?.plp?.constructionPercentage || 0) +
                            Number(formData.paymentPlans?.plp?.possessionPercentage || 0);
                          return (
                            <span className={sum === 100 ? "text-green-400 font-bold" : "text-amber-primary font-bold"}>
                              Total: {sum}% {sum === 100 ? "✓" : "⚠️ Needs 100%"}
                            </span>
                          );
                        })()}
                      </label>
                      <div className="w-full bg-surface rounded-xl overflow-hidden h-6 border border-border-bright flex p-0.5">
                        <div
                          style={{ width: `${Math.min(100, Number(formData.paymentPlans?.plp?.bookingPercentage || 0))}%` }}
                          className="bg-amber-primary h-full transition-all duration-300 rounded-s flex items-center justify-center text-[8px] text-bg font-black overflow-hidden"
                          title="Booking"
                        >
                          {Number(formData.paymentPlans?.plp?.bookingPercentage || 0) > 10 && `${formData.paymentPlans?.plp?.bookingPercentage}%`}
                        </div>
                        <div
                          style={{ width: `${Math.min(100, Number(formData.paymentPlans?.plp?.constructionPercentage || 0))}%` }}
                          className="bg-zinc-400 h-full transition-all duration-300 flex items-center justify-center text-[8px] text-bg font-black overflow-hidden"
                          title="Construction"
                        >
                          {Number(formData.paymentPlans?.plp?.constructionPercentage || 0) > 10 && `${formData.paymentPlans?.plp?.constructionPercentage}%`}
                        </div>
                        <div
                          style={{ width: `${Math.min(100, Number(formData.paymentPlans?.plp?.possessionPercentage || 0))}%` }}
                          className="bg-green-500 h-full transition-all duration-300 rounded-e flex items-center justify-center text-[8px] text-white font-black overflow-hidden"
                          title="Possession"
                        >
                          {Number(formData.paymentPlans?.plp?.possessionPercentage || 0) > 10 && `${formData.paymentPlans?.plp?.possessionPercentage}%`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestone option within PLP */}
                  <div className="pt-3 border-t border-border-dim/30 space-y-4">
                    <div className="flex items-center justify-between bg-surface p-3.5 rounded-xl border border-border-bright/50">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Milestone-Linked Option</span>
                        <p className="text-[9px] text-text-dim">Break the Possession-Linked Plan into specific milestone stages</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => {
                            const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                            const currentVal = !plp.hasMilestones;
                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                plp: {
                                  ...plp,
                                  hasMilestones: currentVal,
                                  milestones: plp.milestones || [
                                    { stage: "Token Booking Amount / Sign-up", percentage: "10", timeline: "At Booking", status: "Completed" },
                                    { stage: "Casting of Ground Floor Floor Slab", percentage: "20", timeline: "Within 6 Months", status: "Not Started" },
                                    { stage: "Superstructure Slabs & Envelope Cast", percentage: "30", timeline: "Within 12 Months", status: "Not Started" },
                                    { stage: "Finishing & Possession Key Handover", percentage: "40", timeline: "On Possession", status: "Not Started" }
                                  ]
                                }
                              }
                            };
                          });
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                          formData.paymentPlans?.plp?.hasMilestones ? "bg-amber-primary" : "bg-text-dim/30"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${
                            formData.paymentPlans?.plp?.hasMilestones ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {formData.paymentPlans?.plp?.hasMilestones && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border-bright/50">
                          <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Configure PLP Milestones</span>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const sum = (formData.paymentPlans?.plp?.milestones || []).reduce(
                                (acc: number, curr: any) => acc + Number(curr.percentage || 0),
                                0
                              );
                              return (
                                <span className={`text-[9px] font-bold uppercase ${sum === 100 ? "text-green-400" : "text-amber-primary"}`}>
                                  Total: {sum}% {sum === 100 ? "✓" : "⚠️ Must add up to 100%"}
                                </span>
                              );
                            })()}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => {
                                  const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                                  const list = plp.milestones || [];
                                  return {
                                    ...prev,
                                    paymentPlans: {
                                      ...(prev.paymentPlans || defaultPaymentPlans),
                                      plp: {
                                        ...plp,
                                        milestones: [...list, { stage: "New PLP Milestone", percentage: "10", timeline: "", status: "Not Started" }]
                                      }
                                    }
                                  };
                                });
                              }}
                              className="px-2.5 py-1 text-[9px] font-bold text-amber-primary border border-amber-primary/30 rounded-lg hover:bg-amber-primary/5 transition-colors font-sans"
                            >
                              + Add Milestone
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {(formData.paymentPlans?.plp?.milestones || []).map((ms: any, index: number) => (
                            <div
                              key={index}
                              className="bg-surface border border-border-bright rounded-xl p-3.5 space-y-2.5 relative"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono text-text-amber font-bold">PLP Milestone {index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => {
                                      const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                                      const filtered = (plp.milestones || []).filter((_: any, i: number) => i !== index);
                                      return {
                                        ...prev,
                                        paymentPlans: {
                                          ...(prev.paymentPlans || defaultPaymentPlans),
                                          plp: {
                                            ...plp,
                                            milestones: filtered
                                          }
                                        }
                                      };
                                    });
                                  }}
                                  className="text-red-400 hover:text-red-500 hover:bg-red-500/5 p-1 rounded-lg transition-colors flex items-center gap-1 text-[8.5px]"
                                >
                                  <Trash2 size={11} />
                                  <span>Remove</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                                <div className="md:col-span-6 space-y-1">
                                  <label className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Milestone Description</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. On pouring of 4th floor slab"
                                    className="w-full bg-surface-2 border border-border-bright rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-primary transition-colors text-white"
                                    value={ms.stage || ""}
                                    onChange={(e) => {
                                      setFormData((prev) => {
                                        const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                                        const updated = [...(plp.milestones || [])];
                                        updated[index] = { ...updated[index], stage: e.target.value };
                                        return {
                                          ...prev,
                                          paymentPlans: {
                                            ...(prev.paymentPlans || defaultPaymentPlans),
                                            plp: {
                                              ...plp,
                                              milestones: updated
                                            }
                                          }
                                        };
                                      });
                                    }}
                                  />
                                </div>

                                <div className="md:col-span-3 space-y-1">
                                  <label className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Payment (%)</label>
                                  <input
                                    type="number"
                                    placeholder="e.g. 15"
                                    className="w-full bg-surface-2 border border-border-bright rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-primary transition-colors text-white"
                                    value={ms.percentage || ""}
                                    onChange={(e) => {
                                      setFormData((prev) => {
                                        const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                                        const updated = [...(plp.milestones || [])];
                                        updated[index] = { ...updated[index], percentage: e.target.value };
                                        return {
                                          ...prev,
                                          paymentPlans: {
                                            ...(prev.paymentPlans || defaultPaymentPlans),
                                            plp: {
                                              ...plp,
                                              milestones: updated
                                            }
                                          }
                                        };
                                      });
                                    }}
                                  />
                                </div>

                                <div className="md:col-span-3 space-y-1">
                                  <label className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Timeline / Trigger</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Month 14"
                                    className="w-full bg-surface-2 border border-border-bright rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-primary transition-colors text-white"
                                    value={ms.timeline || ""}
                                    onChange={(e) => {
                                      setFormData((prev) => {
                                        const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                                        const updated = [...(plp.milestones || [])];
                                        updated[index] = { ...updated[index], timeline: e.target.value };
                                        return {
                                          ...prev,
                                          paymentPlans: {
                                            ...(prev.paymentPlans || defaultPaymentPlans),
                                            plp: {
                                              ...plp,
                                              milestones: updated
                                            }
                                          }
                                        };
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                      Additional Terms / Notes
                    </label>
                    <textarea
                      placeholder="Enter specific possession linked details e.g., '10% on casting of ground floor slab...'"
                      rows={2}
                      className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary transition-colors resize-none"
                      value={formData.paymentPlans?.plp?.notes || ""}
                      onChange={(e) => {
                        setFormData((prev) => {
                          const plp = prev.paymentPlans?.plp || defaultPaymentPlans.plp;
                          return {
                            ...prev,
                            paymentPlans: {
                              ...(prev.paymentPlans || defaultPaymentPlans),
                              plp: {
                                ...plp,
                                notes: e.target.value,
                              },
                            },
                          };
                        });
                      }}
                    />
                  </div>
                </div>
              )}

              {/* CLP Details Form */}
              {formData.paymentPlans?.clp?.enabled && (
                <div className="p-5 bg-surface-2/40 border border-border-bright rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-border-dim/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-primary/20 text-amber-primary flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      <h5 className="text-[11px] font-black text-text-primary uppercase tracking-widest">
                        Construction-Linked Plan (CLP) Setup
                      </h5>
                    </div>
                    {(() => {
                      const sum = (formData.paymentPlans?.clp?.stages || []).reduce(
                        (acc, curr) => acc + Number(curr.percentage || 0),
                        0,
                      );
                      return (
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                          sum === 100 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-amber-primary/10 text-amber-primary border border-amber-primary/20"
                        }`}>
                          Milestones Total: {sum}% {sum === 100 ? "✓" : "⚠️ Needs 100%"}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        Select Preset CLP Structure
                      </label>
                      <CustomSelect
                        variant="nested"
                        value={formData.paymentPlans?.clp?.type || "Custom"}
                        onChange={(val) => {
                          setFormData((prev) => {
                            const clp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                            let stages = clp.stages;

                            if (val === "20:40:40") {
                              stages = [
                                { stage: "Booking Amount / Advance", percentage: "20", timeline: "At Booking", chargeType: "BSP Only", status: "Completed" as const },
                                { stage: "Foundation & Superstructure", percentage: "40", timeline: "Within 12 Months", chargeType: "BSP + Parking", status: "Not Started" as const },
                                { stage: "Finishing & Possession Handover", percentage: "40", timeline: "On Handover", chargeType: "All Remaining", status: "Not Started" as const },
                              ];
                            } else if (val === "10:25:15:50") {
                              stages = [
                                { stage: "Booking Amount", percentage: "10", timeline: "At Booking", chargeType: "BSP Only", status: "Completed" as const },
                                { stage: "Foundation & Plinth Construction", percentage: "25", timeline: "Within 6 Months", chargeType: "BSP Only", status: "Not Started" as const },
                                { stage: "Floor Slabs Casting", percentage: "15", timeline: "Within 12 Months", chargeType: "BSP Only", status: "Not Started" as const },
                                { stage: "On Handover / Possession", percentage: "50", timeline: "On Handover", chargeType: "All Remaining", status: "Not Started" as const },
                              ];
                            } else if (val === "15:15:40:30") {
                              stages = [
                                { stage: "On Booking / Registration", percentage: "15", timeline: "At Booking", chargeType: "BSP Only", status: "Completed" as const },
                                { stage: "Ground Level Foundation Completed", percentage: "15", timeline: "Within 4 Months", chargeType: "BSP Only", status: "Not Started" as const },
                                { stage: "Structural Slabs & Skeletons", percentage: "40", timeline: "Within 14 Months", chargeType: "BSP + Parking", status: "Not Started" as const },
                                { stage: "Fittings, Finishings & Handover", percentage: "30", timeline: "On Possession", chargeType: "All Remaining", status: "Not Started" as const },
                              ];
                            }

                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                clp: {
                                  ...clp,
                                  type: val,
                                  stages,
                                },
                              },
                            };
                          });
                        }}
                        options={[
                          { value: "20:40:40", label: "3-Step (20:40:40)", desc: "20% Booking, 40% Foundation, 40% Handover" },
                          { value: "10:25:15:50", label: "4-Step (10:25:15:50)", desc: "10% Booking, 25% Plinth, 15% Slabs, 50% Handover" },
                          { value: "15:15:40:30", label: "4-Step (15:15:40:30)", desc: "15% Booking, 15% Plinth, 40% Slabs, 30% Handover" },
                          { value: "Custom", label: "Custom Stages / Milestones", desc: "Manually build custom dynamic stages" }
                        ]}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => {
                          const clp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                          return {
                            ...prev,
                            paymentPlans: {
                              ...(prev.paymentPlans || defaultPaymentPlans),
                              clp: {
                                ...clp,
                                type: "Custom",
                                stages: [...clp.stages, { stage: "New Milestone", percentage: "10", timeline: "", chargeType: "BSP Only", status: "Not Started" }],
                              },
                            },
                          };
                        });
                      }}
                      className="md:col-span-2 px-4 py-2 border border-dashed border-amber-primary/40 text-amber-primary hover:bg-amber-primary/5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors h-9"
                    >
                      + Add Custom CLP Milestone
                    </button>
                  </div>

                  {/* Stage Editor List */}
                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                    {(formData.paymentPlans?.clp?.stages || []).map((stageItem, index) => (
                      <div
                        key={index}
                        className="bg-surface border border-border-bright/60 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-1 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-border-bright pb-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-surface-2 text-text-amber w-6 h-6 flex items-center justify-center rounded-lg font-black shrink-0 border border-amber-primary/20">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Milestone Stage</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => {
                                const clp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                                const updatedStages = clp.stages.filter((_, idx) => idx !== index);
                                return {
                                  ...prev,
                                  paymentPlans: {
                                    ...(prev.paymentPlans || defaultPaymentPlans),
                                    clp: {
                                      ...clp,
                                      type: "Custom",
                                      stages: updatedStages,
                                    },
                                  },
                                };
                              });
                            }}
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/5 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[10px]"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          {/* Stage Name */}
                          <div className="md:col-span-6 space-y-1">
                            <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Stage / Milestone Description</label>
                            <input
                              type="text"
                              placeholder="e.g. Excavation & Plinth Work Completion"
                              className="w-full bg-surface-2 border border-border-bright rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-primary transition-colors text-text-primary"
                              value={stageItem.stage}
                              onChange={(e) => {
                                const newText = e.target.value;
                                setFormData((prev) => {
                                  const clp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                                  const updatedStages = [...clp.stages];
                                  updatedStages[index] = { ...updatedStages[index], stage: newText };
                                  return {
                                    ...prev,
                                    paymentPlans: {
                                      ...(prev.paymentPlans || defaultPaymentPlans),
                                      clp: {
                                        ...clp,
                                        stages: updatedStages,
                                      },
                                    },
                                  };
                                });
                              }}
                            />
                          </div>

                          {/* Percentage Payment */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Payment %</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder="%"
                                className="w-full bg-surface-2 border border-border-bright rounded-lg px-2.5 py-1.5 text-xs text-center outline-none focus:border-amber-primary transition-colors font-bold text-text-primary"
                                value={stageItem.percentage}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setFormData((prev) => {
                                    const clp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                                    const updatedStages = [...clp.stages];
                                    updatedStages[index] = { ...updatedStages[index], percentage: newVal };
                                    return {
                                      ...prev,
                                      paymentPlans: {
                                        ...(prev.paymentPlans || defaultPaymentPlans),
                                        clp: {
                                          ...clp,
                                          stages: updatedStages,
                                        },
                                      },
                                    };
                                  });
                                }}
                              />
                              <span className="text-xs text-text-dim font-bold">%</span>
                            </div>
                          </div>

                          {/* Timeline / Frame */}
                          <div className="md:col-span-4 space-y-1">
                            <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Estimated Timeline</label>
                            <input
                              type="text"
                              placeholder="e.g. Within 6 months / Oct 2026"
                              className="w-full bg-surface-2 border border-border-bright rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-primary transition-colors text-text-primary"
                              value={stageItem.timeline || ""}
                              onChange={(e) => {
                                const newText = e.target.value;
                                setFormData((prev) => {
                                  const clp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                                  const updatedStages = [...clp.stages];
                                  updatedStages[index] = { ...updatedStages[index], timeline: newText };
                                  return {
                                    ...prev,
                                    paymentPlans: {
                                      ...(prev.paymentPlans || defaultPaymentPlans),
                                      clp: {
                                        ...clp,
                                        stages: updatedStages,
                                      },
                                    },
                                  };
                                });
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {/* Premium Charge Inclusion Type */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Charges Applicable</label>
                              <CustomSelect
                                variant="nested"
                                value={stageItem.chargeType || "BSP Only"}
                                onChange={(val) => {
                                  setFormData((prev) => {
                                    const clp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                                    const updatedStages = [...clp.stages];
                                    updatedStages[index] = { ...updatedStages[index], chargeType: val };
                                    return {
                                      ...prev,
                                      paymentPlans: {
                                        ...(prev.paymentPlans || defaultPaymentPlans),
                                        clp: {
                                          ...clp,
                                          stages: updatedStages,
                                        },
                                      },
                                    };
                                  });
                                }}
                                options={[
                                  { value: "BSP Only", label: "Basic Sale Price (BSP) Only" },
                                  { value: "BSP + Parking", label: "BSP + Car Parking Charges" },
                                  { value: "BSP + PLC", label: "BSP + Preferential Location Charges (PLC)" },
                                  { value: "BSP + Parking + PLC", label: "BSP + Parking + PLC" },
                                  { value: "All Remaining", label: "All Remaining & Additional Charges" },
                                  { value: "All Inclusive", label: "All Inclusive (100% Fully Loaded)" }
                                ]}
                              />
                          </div>

                          {/* Milestone Progress Status */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Current Milestone Status</label>
                            <div className="flex gap-2">
                              {(["Not Started", "In Progress", "Completed"] as const).map((statusVal) => {
                                const isActive = (stageItem.status || "Not Started") === statusVal;
                                const colors = {
                                  "Not Started": isActive
                                    ? "bg-slate-500/10 text-slate-300 border-slate-500/30"
                                    : "bg-surface-2 text-text-dim border-border-bright/40 hover:bg-surface-3",
                                  "In Progress": isActive
                                    ? "bg-amber-primary/15 text-amber-primary border-amber-primary/35"
                                    : "bg-surface-2 text-text-dim border-border-bright/40 hover:bg-surface-3",
                                  "Completed": isActive
                                    ? "bg-green-500/15 text-green-400 border-green-500/30 font-semibold"
                                    : "bg-surface-2 text-text-dim border-border-bright/40 hover:bg-surface-3",
                                };
                                return (
                                  <button
                                    key={statusVal}
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => {
                                        const clp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                                        const updatedStages = [...clp.stages];
                                        updatedStages[index] = { ...updatedStages[index], status: statusVal };
                                        return {
                                          ...prev,
                                          paymentPlans: {
                                            ...(prev.paymentPlans || defaultPaymentPlans),
                                            clp: {
                                              ...clp,
                                              stages: updatedStages,
                                            },
                                          },
                                        };
                                      });
                                    }}
                                    className={`flex-1 text-[10px] py-1 px-1.5 rounded-lg border text-center transition-all ${colors[statusVal]}`}
                                  >
                                    {statusVal}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                      CLP Additional Notes
                    </label>
                    <textarea
                      placeholder="Specify customized rules for construction demands, late payments etc."
                      rows={2}
                      className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary transition-colors resize-none"
                      value={formData.paymentPlans?.clp?.notes || ""}
                      onChange={(e) => {
                        setFormData((prev) => {
                          const clp = prev.paymentPlans?.clp || defaultPaymentPlans.clp;
                          return {
                            ...prev,
                            paymentPlans: {
                              ...(prev.paymentPlans || defaultPaymentPlans),
                              clp: {
                                ...clp,
                                notes: e.target.value,
                              },
                            },
                          };
                        });
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Subvention Details Form */}
              {formData.paymentPlans?.subvention?.enabled && (
                <div className="p-5 bg-surface-2/40 border border-border-bright rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 border-b border-border-dim/50 pb-2">
                    <span className="w-4 h-4 rounded-full bg-amber-primary/20 text-amber-primary flex items-center justify-center text-[10px] font-black">
                      3
                    </span>
                    <h5 className="text-[11px] font-black text-text-primary uppercase tracking-widest">
                      Subvention Plan Setup
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        Select Downpayment Ratio
                      </label>
                      <CustomSelect
                        variant="nested"
                        value={formData.paymentPlans?.subvention?.type || "Custom"}
                        onChange={(val) => {
                          setFormData((prev) => {
                            const sub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                            let b = sub.bookingPercentage;
                            let f = sub.bankFinancedPercentage;

                            if (val === "10:90") { b = "10"; f = "90"; }
                            else if (val === "15:85") { b = "15"; f = "85"; }

                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                subvention: {
                                  ...sub,
                                  type: val,
                                  bookingPercentage: b,
                                  bankFinancedPercentage: f,
                                },
                              },
                            };
                          });
                        }}
                        options={[
                          { value: "10:90", label: "10:90 (10% Own, 90% Bank)", desc: "10% Booking Downpayment, 90% Financed" },
                          { value: "15:85", label: "15:85 (15% Own, 85% Bank)", desc: "15% Booking Downpayment, 85% Financed" },
                          { value: "Custom", label: "Custom Ratio", desc: "Specify custom own & financed ratios" }
                        ]}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        Downpayment / Booking (%)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        disabled={formData.paymentPlans?.subvention?.type !== "Custom"}
                        className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary transition-colors disabled:opacity-60"
                        value={formData.paymentPlans?.subvention?.bookingPercentage || ""}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const sub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                subvention: {
                                  ...sub,
                                  bookingPercentage: e.target.value,
                                },
                              },
                            };
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        Bank Financed Loan (%)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 90"
                        disabled={formData.paymentPlans?.subvention?.type !== "Custom"}
                        className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary transition-colors disabled:opacity-60"
                        value={formData.paymentPlans?.subvention?.bankFinancedPercentage || ""}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const sub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                subvention: {
                                  ...sub,
                                  bankFinancedPercentage: e.target.value,
                                },
                              },
                            };
                          });
                        }}
                      />
                    </div>

                    {/* LIVE RATIO VISUAL SPLIT BAR */}
                    {(() => {
                      const booking = Number(formData.paymentPlans?.subvention?.bookingPercentage || 0);
                      const bank = Number(formData.paymentPlans?.subvention?.bankFinancedPercentage || 0);
                      const sum = booking + bank;
                      return (
                        <div className="md:col-span-3 space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-text-dim px-1 font-mono">
                            <span className="flex items-center gap-1.5">Ratio Allocation Visualizer: <strong className="text-amber-primary">Own {booking}%</strong> vs <strong className="text-emerald-400">Bank {bank}%</strong></span>
                            <span>Total Spanned: {sum}%</span>
                          </div>
                          <div className="w-full h-4 bg-surface rounded-full overflow-hidden border border-border-bright flex shadow-inner">
                            {booking > 0 && (
                              <div
                                style={{ width: `${Math.min(100, Math.max(0, (booking / (sum || 100)) * 100))}%` }}
                                className="bg-amber-primary h-full flex items-center justify-center text-[9px] font-black text-black transition-all duration-300"
                              >
                                {booking >= 10 && `Own Cont. (${booking}%)`}
                              </div>
                            )}
                            {bank > 0 && (
                              <div
                                style={{ width: `${Math.min(100, Math.max(0, (bank / (sum || 100)) * 100))}%` }}
                                className="bg-emerald-500 h-full flex items-center justify-center text-[9px] font-black text-white transition-all duration-300"
                              >
                                {bank >= 10 && `Mortgage Financed (${bank}%)`}
                              </div>
                            )}
                          </div>
                          {sum !== 100 && (
                            <p className="text-[10px] text-amber-primary flex items-center gap-1 font-medium animate-pulse">
                              <AlertCircle size={12} /> Ratio allocation totals {sum}%. For standard housing subventions, the combined percentage must equal 100%.
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* BANK MULTI-TAG TOGGLES */}
                    <div className="md:col-span-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                          Approved Funding Banks
                        </label>
                        <span className="text-[9px] text-text-dim font-mono italic">Quick Select Tags</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. HDFC, SBI, ICICI"
                        className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary transition-colors font-medium text-text-primary"
                        value={formData.paymentPlans?.subvention?.fundingBank || ""}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const sub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                subvention: {
                                  ...sub,
                                  fundingBank: e.target.value,
                                },
                              },
                            };
                          });
                        }}
                      />
                      {(() => {
                        const currentBanks = (formData.paymentPlans?.subvention?.fundingBank || "")
                          .split(",")
                          .map((b) => b.trim())
                          .filter(Boolean);
                        const suggestedBanks = ["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "LIC HFL", "IDFC First", "Bajaj Housing"];
                        return (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {suggestedBanks.map((b) => {
                              const isSelected = currentBanks.some(cb => cb.toLowerCase() === b.toLowerCase() || cb.toLowerCase().includes(b.split(" ")[0].toLowerCase()));
                              return (
                                <button
                                  key={b}
                                  type="button"
                                  onClick={() => {
                                    let newList;
                                    const matchIndex = currentBanks.findIndex(cb => cb.toLowerCase() === b.toLowerCase() || cb.toLowerCase().includes(b.split(" ")[0].toLowerCase()));
                                    if (matchIndex >= 0) {
                                      newList = currentBanks.filter((_, i) => i !== matchIndex);
                                    } else {
                                      newList = [...currentBanks, b];
                                    }
                                    setFormData((prev) => {
                                      const sub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                                      return {
                                        ...prev,
                                        paymentPlans: {
                                          ...(prev.paymentPlans || defaultPaymentPlans),
                                          subvention: {
                                            ...sub,
                                            fundingBank: newList.join(", "),
                                          },
                                        },
                                      };
                                    });
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold select-none transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 border shadow-sm scale-95"
                                      : "bg-surface border border-border-bright text-text-dim hover:text-text-primary hover:border-border-bright"
                                  }`}
                                >
                                  {isSelected ? `✓ ${b}` : `+ ${b}`}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>



                    {/* SUBSIDY RATE, MAX LTV, ELIGIBLE UNITS */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        Builder Subsidy Rate (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="e.g. 100"
                          className="w-full bg-surface border border-border-bright rounded-xl pl-3 pr-8 py-2 text-xs outline-none focus:border-amber-primary transition-colors text-text-primary font-bold"
                          value={formData.paymentPlans?.subvention?.subsidyRate || ""}
                          onChange={(e) => {
                            setFormData((prev) => {
                              const sub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                              return {
                                ...prev,
                                paymentPlans: {
                                  ...(prev.paymentPlans || defaultPaymentPlans),
                                  subvention: {
                                    ...sub,
                                    subsidyRate: e.target.value,
                                  },
                                },
                              };
                            });
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-dim">%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        Max Financing LTV Limit
                      </label>
                      <CustomSelect
                        variant="nested"
                        value={formData.paymentPlans?.subvention?.maxLoanAmount || "Up to 80% LTV"}
                        onChange={(val) => {
                          setFormData((prev) => {
                            const sub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                subvention: {
                                  ...sub,
                                  maxLoanAmount: val,
                                },
                              },
                            };
                          });
                        }}
                        options={[
                          { value: "Up to 75% LTV", label: "Up to 75% LTV", desc: "For budget or specific bank funding" },
                          { value: "Up to 80% LTV", label: "Up to 80% LTV (Standard)", desc: "Standard banking LTV limit" },
                          { value: "Up to 85% LTV", label: "Up to 85% LTV", desc: "Extended LTV by selected lenders" },
                          { value: "Up to 90% LTV", label: "Up to 90% LTV", desc: "Maximum allowable bank financing" },
                          { value: "No Loan Limit", label: "No Cap / Any Eligible", desc: "No ceiling on eligibility" }
                        ]}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        Eligible Configurations
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. All Units, Only 3 BHK & 4 BHK"
                        className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary transition-colors"
                        value={formData.paymentPlans?.subvention?.eligibleUnits || ""}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const sub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                            return {
                              ...prev,
                              paymentPlans: {
                                ...(prev.paymentPlans || defaultPaymentPlans),
                                subvention: {
                                  ...sub,
                                  eligibleUnits: e.target.value,
                                },
                              },
                            };
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                      Subvention Additional Terms
                    </label>
                    <textarea
                      placeholder="Detail who pays the interest during delay, bank approval terms etc."
                      rows={2}
                      className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary transition-colors resize-none mb-1"
                      value={formData.paymentPlans?.subvention?.notes || ""}
                      onChange={(e) => {
                        setFormData((prev) => {
                          const sub = prev.paymentPlans?.subvention || defaultPaymentPlans.subvention;
                          return {
                            ...prev,
                            paymentPlans: {
                              ...(prev.paymentPlans || defaultPaymentPlans),
                              subvention: {
                                ...sub,
                                notes: e.target.value,
                              },
                            },
                          };
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Location */}
      <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 text-amber-primary border-b border-border-dim pb-3 mb-4">
          <MapPin size={18} />
          <h4 className="text-xs font-bold uppercase tracking-[0.15em]">
            Location
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* MICRO MARKETS Select dropdown */}
          <div className="md:col-span-2 space-y-2">
            <label
              htmlFor="microMarket"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Sparkles size={12} className="text-amber-primary/70" /> Micro Markets <span className="text-amber-primary">*</span>
            </label>
            <CustomSelect
              id="microMarket"
              value={formData.microMarket || ""}
              onChange={(val) => handleMicroMarketChange(val)}
              error={!!(errors.microMarket && touched.microMarket)}
              placeholder="Choose Micro Market..."
              options={[
                { value: "Dwarka Expressway", label: "Dwarka Expressway", desc: "Fast-growing high-rise residential corridor" },
                { value: "New Gurgaon", label: "New Gurgaon", desc: "Well-planned sector developments near NH-8" },
                { value: "Golf Course Road", label: "Golf Course Road", desc: "Ultra-luxury residential and prime commercial hub" },
                { value: "Golf course Road Extension", label: "Golf course Road Extension", desc: "Premium mixed-use developments and luxury villas" },
                { value: "Southern Peripheral Road", label: "Southern Peripheral Road", desc: "Strategic link corridor with high growth potential" },
                { value: "South of Gurgaon (SOHNA)", label: "South of Gurgaon (SOHNA)", desc: "Scenic foothills area with mid-segment housing" }
              ]}
            />
            {errors.microMarket && touched.microMarket && (
              <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.microMarket}
              </p>
            )}
            {!formData.microMarket && (
              <p className="text-[9.5px] text-amber-500/90 font-medium mt-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 flex items-center gap-1.5">
                <Info size={12} className="shrink-0 animate-pulse text-amber-400" />
                Please select a Micro Market first to enable Sector and Address input fields.
              </p>
            )}
          </div>

          {/* Sector Input Field */}
          <div className="space-y-2 relative">
            <label
              htmlFor="sector"
              className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
            >
              <Building2 size={12} className="text-amber-primary/70" /> Sector
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Building2 size={14} />
              </div>
              <input
                id="sector"
                name="sector"
                value={formData.sector || ""}
                disabled={!formData.microMarket}
                onChange={(e) => {
                  const val = e.target.value;
                  selectedSectorFromDropdownRef.current = false;
                  setFormData((prev) => ({
                    ...prev,
                    sector: val,
                  }));
                  setShowSectorDropdown(true);
                  if (formData.microMarket) {
                    setSectorSuggestions(getPresetSectors(formData.microMarket, val));
                  }
                }}
                onFocus={() => {
                  setShowSectorDropdown(true);
                  if (formData.microMarket) {
                    setSectorSuggestions(getPresetSectors(formData.microMarket, formData.sector));
                  }
                }}
                onBlur={() => {
                  // Small delay to allow list clicks to run
                  setTimeout(() => setShowSectorDropdown(false), 250);
                }}
                className={`w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none transition-all focus:border-amber-primary focus:bg-surface-3 ${
                  !formData.microMarket ? "opacity-50 cursor-not-allowed bg-surface-2/30" : ""
                }`}
                placeholder={!formData.microMarket ? "Choose Micro Market first" : "e.g. Sector 62"}
              />
              {isSearchingSector && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={14} className="animate-spin text-amber-primary" />
                </div>
              )}
            </div>

            {/* Sector Results autolist autocomplete matches dropdown */}
            {showSectorDropdown && sectorSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-3 border border-border-bright rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-border-dim/40 animate-in fade-in slide-in-from-top-1">
                {sectorSuggestions.map((suggestion, index) => {
                  const parts = suggestion.display_name.split(',');
                  const cleanSector = parts.slice(0, 3).map((p: string) => p.trim()).join(', ');

                  return (
                    <button
                      key={`${suggestion.place_id}-${index}`}
                      type="button"
                      onMouseDown={() => {
                        selectedSectorFromDropdownRef.current = true;
                        setFormData((prev) => {
                          const updated: any = {
                            ...prev,
                            sector: cleanSector,
                          };
                          if (suggestion.lat && suggestion.lon) {
                            updated.coordinates = {
                              lat: parseFloat(suggestion.lat),
                              lng: parseFloat(suggestion.lon),
                            };
                          }
                          return updated;
                        });
                        setShowSectorDropdown(false);
                        setSectorSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-amber-primary/10 hover:text-white transition-all text-xs font-medium text-text-dim flex gap-2 items-start"
                    >
                      <Building2 size={14} className="text-amber-primary shrink-0 mt-0.5" />
                      <span>{suggestion.display_name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Address / Location Autocomplete Search Field */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <label
                htmlFor="location"
                className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
              >
                <MapPin size={12} className="text-amber-primary/70" /> Address{" "}
                <span className="text-amber-primary">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isDetectingLocation || !formData.microMarket}
                className="text-[10px] text-amber-primary hover:text-amber-primary/80 uppercase tracking-wider font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {isDetectingLocation ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <LocateFixed size={12} />
                )}
                Auto-detect Location
              </button>
            </div>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <MapPin size={14} />
              </div>
              <input
                id="location"
                name="location"
                value={formData.location}
                disabled={!formData.microMarket}
                onChange={(e) => {
                  const val = e.target.value;
                  selectedFromDropdownRef.current = false;
                  handleChange(e);
                  setShowAddressDropdown(true);
                  if (formData.microMarket) {
                    setAddressSuggestions(getPresetAddresses(formData.microMarket, val));
                  }
                }}
                onFocus={() => {
                  setShowAddressDropdown(true);
                  if (formData.microMarket) {
                    setAddressSuggestions(getPresetAddresses(formData.microMarket, formData.location));
                  }
                }}
                onBlur={() => {
                  // Small delay to allow list clicks to run
                  setTimeout(() => setShowAddressDropdown(false), 250);
                  handleBlur({ target: { name: "location" } } as any);
                }}
                aria-invalid={!!errors.location}
                aria-describedby={
                  errors.location ? "location-error" : undefined
                }
                className={`w-full bg-surface-2 border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none transition-all ${
                  !formData.microMarket ? "opacity-50 cursor-not-allowed bg-surface-2/30" : ""
                } ${
                  errors.location && touched.location
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border-bright focus:border-amber-primary focus:bg-surface-3"
                }`}
                placeholder={!formData.microMarket ? "Choose Micro Market first" : "e.g. Golf Course Road, Gurgaon"}
              />
              {isSearchingLocation && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                   <Loader2 size={14} className="animate-spin text-amber-primary" />
                </div>
              )}
            </div>

            {/* Results autolist autocomplete matches dropdown */}
            {showAddressDropdown && addressSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-3 border border-border-bright rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-border-dim/40 animate-in fade-in slide-in-from-top-1">
                {addressSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.place_id}-${index}`}
                    type="button"
                    onMouseDown={() => {
                      selectedFromDropdownRef.current = true;
                      setFormData((prev) => ({
                        ...prev,
                        location: suggestion.display_name,
                        coordinates: {
                          lat: parseFloat(suggestion.lat),
                          lng: parseFloat(suggestion.lon),
                        },
                      }));
                      setShowAddressDropdown(false);
                      setAddressSuggestions([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-amber-primary/10 hover:text-white transition-all text-xs font-medium text-text-dim flex gap-2 items-start"
                  >
                    <MapPin size={14} className="text-amber-primary shrink-0 mt-0.5" />
                    <span>{suggestion.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            {errors.location && touched.location && (
              <p
                id="location-error"
                className="text-[9px] text-red-400 mt-1 flex items-center gap-1"
              >
                <AlertCircle size={10} /> {errors.location}
              </p>
            )}
          </div>

          {!isBhkApplicable(formData.subType) && (
            <div className="space-y-2">
              <label
                htmlFor="price"
                className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5"
              >
                <IndianRupee size={12} className="text-amber-primary/70" />{" "}
                Price <span className="text-amber-primary">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                    <IndianRupee size={14} />
                  </div>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!errors.price}
                    aria-describedby={errors.price ? "price-error" : undefined}
                    className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${
                      errors.price && touched.price
                        ? "border-red-500/50 bg-red-500/5"
                        : "border-border-bright focus:border-amber-primary focus:bg-surface-3"
                    }`}
                    placeholder="e.g. 1.5"
                  />
                </div>
                <div className="w-24 shrink-0">
                  <CustomSelect
                    variant="nested"
                    value={formData.priceUnit}
                    onChange={(val) => {
                      setFormData((prev) => ({
                        ...prev,
                        priceUnit: val as "Lacs" | "Cr",
                      }));
                    }}
                    options={[
                      { value: "Lacs", label: "Lacs" },
                      { value: "Cr", label: "Cr" }
                    ]}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {[40, 50, 60, 75, 90, 1.2, 1.5, 2.5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      const unit = val < 10 ? "Cr" : "Lacs";
                      setFormData((prev) => ({
                        ...prev,
                        price: val,
                        priceUnit: unit,
                      }));
                    }}
                    className="px-2 py-1 bg-surface-3 border border-border-bright rounded-lg text-[9px] text-text-dim hover:border-amber-primary hover:text-amber-primary transition-all"
                  >
                    {val} {val < 10 ? "Cr" : "L"}
                  </button>
                ))}
              </div>
              {formData.price && !errors.price && (
                <div className="text-[9px] text-amber-primary/70 font-medium mt-1">
                  Calculated: ₹
                  {(formData.priceUnit === "Lacs"
                    ? Number(formData.price) * 100000
                    : Number(formData.price) * 10000000
                  ).toLocaleString()}
                </div>
              )}
              {errors.price && touched.price && (
                <p
                  id="price-error"
                  className="text-[9px] text-red-400 mt-1 flex items-center gap-1"
                >
                  <AlertCircle size={10} /> {errors.price}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Media & Documents */}
      <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 text-amber-primary border-b border-border-dim pb-3 mb-4">
          <Layers size={18} />
          <h4 className="text-xs font-bold uppercase tracking-[0.15em]">
            Media & Documents
          </h4>
        </div>

        <div>
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5 mb-4">
            <FileText size={12} className="text-amber-primary/70" /> Project
            Documents (PDF) <span className="text-amber-primary">*</span>
          </label>
          <PdfUpload
            pdfs={formData.pdfs}
            onError={(msg) => showToast?.(msg, "error")}
            onChange={(newPdfs) => {
              setFormData((prev) => ({ ...prev, pdfs: newPdfs }));
              if (touched.pdfs) {
                const error = validateField("pdfs", newPdfs);
                setErrors((prev) => ({ ...prev, pdfs: error }));
              }
            }}
          />
          {errors.pdfs && touched.pdfs && (
            <p className="text-[9px] text-red-400 mt-3 flex items-center gap-1">
              <AlertCircle size={10} /> {errors.pdfs}
            </p>
          )}
        </div>

        <div className="mt-6">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5 mb-4">
            <Layers size={12} className="text-amber-primary/70" /> Project
            Images
          </label>
          <ImageUpload
            images={formData.images}
            onError={(msg) => showToast?.(msg, "error")}
            onChange={(newImages) => {
              setFormData((prev) => ({ ...prev, images: newImages }));
            }}
          />
        </div>

        <div className="mt-6">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5 mb-2">
            <Video size={12} className="text-amber-primary/70" /> Project Videos (All Formats up to 1GB)
          </label>
          <p className="text-[10px] text-text-dim mb-4 leading-relaxed">
            Upload project videos (MP4, MKV, MOV, AVI, etc.) up to a maximum size of 1GB per file.
          </p>
          <VideoUpload
            videos={formData.videos || []}
            onError={(msg) => showToast?.(msg, "error")}
            onChange={(newVideos) => {
              setFormData((prev) => ({ ...prev, videos: newVideos }));
            }}
          />
        </div>
      </div>

      <div className="pt-6 border-t border-border-dim flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-[9px] text-text-dim uppercase tracking-widest font-bold">
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-all rounded-xl hover:bg-surface-2 border border-border-bright sm:border-transparent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto bg-amber-primary text-bg px-10 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-amber-primary/20 flex items-center justify-center gap-2 ${
              isSubmitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-amber-secondary hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {isSubmitting ? "Saving Changes..." : "Save Project"}
          </button>
        </div>
      </div>
    </form>
  );
};
