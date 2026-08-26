import React, { useState, useEffect } from "react";
import { reverseGeocode } from "../lib/geocoding";
import { PdfUpload, PdfFile } from "./PdfUpload";
import { ImageUpload, ImageFile } from "./ImageUpload";
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
  Info,
  Sparkles,
  FileText,
  ChevronDown,
} from "lucide-react";
import { geminiService } from "../services/geminiService";
import { CustomSelect } from "./CustomSelect";

export interface ResalePropertyFormData {
  transactionGuid?: string;
  transactionDate?: string;
  propertyHolderName: string;
  societyName: string;
  location: string;
  builderName: string;
  propertyType: string;
  sizeSqft: number | "";
  bhk: string;
  possessionStatus: "Ready to Move" | "Under Construction";
  possessionDate?: string;
  bathrooms: string;
  price: number | "";
  priceUnit: "Lacs" | "Cr";
  isNegotiable: "YES" | "NO";
  floorNumber: string;
  propertyAge: string;
  constructionYear: number | "";
  reraNumber?: string;
  floorPlan: PdfFile[];
  images: ImageFile[];
  brokeragePercentage: number | "";
  contactNumber: string;
  bhkDetails?: Record<
    string,
    {
      sizeSqft: string;
      price: string;
      priceUnit: "Lacs" | "Cr";
      floorPlan: any[];
    }
  >;
}

interface ResalePropertyFormProps {
  initialData?: Partial<ResalePropertyFormData>;
  onSubmit: (data: ResalePropertyFormData) => void;
  onCancel: () => void;
  existingProperties?: {
    societyName: string;
    bhk: string;
    floorNumber: string;
    location: string;
    propertyHolderName?: string;
  }[];
  existingBuilders?: string[];
  existingSocieties?: string[];
  showToast?: (
    message: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;
  assignedRegion?: string;
}

const isBhkApplicable = (type: string): boolean => {
  return [
    "Apartments",
    "Villas",
    "Independent Floors",
    "Studio Apartments",
  ].includes(type);
};

const generateGUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const ResalePropertyForm: React.FC<ResalePropertyFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  existingProperties = [],
  existingBuilders = [],
  existingSocieties = [],
  showToast,
  assignedRegion,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ResalePropertyFormData>(() => {
    // Draft loading has been removed so that Listing Projects form always starts completely empty on open
    return {
      transactionGuid: initialData?.transactionGuid || generateGUID(),
      transactionDate: initialData?.transactionDate || new Date().toISOString().split('T')[0],
      propertyHolderName: initialData?.propertyHolderName || "",
      societyName: initialData?.societyName || "",
      location: initialData?.location || "",
      builderName: initialData?.builderName || "",
      propertyType: initialData?.propertyType || "Apartments",
      possessionStatus: initialData?.possessionStatus || "Ready to Move",
      possessionDate: initialData?.possessionDate || "",
      sizeSqft: initialData?.sizeSqft ?? "",
      bhk: initialData?.bhk || "",
      bathrooms: initialData?.bathrooms || "",
      price: initialData?.price ?? "",
      priceUnit: initialData?.priceUnit || "Lacs",
      isNegotiable: initialData?.isNegotiable || "NO",
      floorNumber: initialData?.floorNumber || "",
      propertyAge: initialData?.propertyAge || "",
      constructionYear: initialData?.constructionYear ?? "",
      reraNumber: initialData?.reraNumber || "",
      floorPlan: initialData?.floorPlan || [],
      images: initialData?.images || [],
      brokeragePercentage: initialData?.brokeragePercentage ?? "",
      contactNumber: initialData?.contactNumber || "",
    };
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ResalePropertyFormData, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ResalePropertyFormData, boolean>>
  >({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [regionConfirmed, setRegionConfirmed] = useState(false);
  const [showRegionAlert, setShowRegionAlert] = useState(false);

  const isOutsideRegion = React.useMemo(() => {
    if (!assignedRegion || !formData.location) return false;
    return !formData.location.toLowerCase().includes(assignedRegion.toLowerCase());
  }, [formData.location, assignedRegion]);

  const stepsList = [
    "Basic Information",
    "Property Details",
    "Pricing & Terms",
    "Media & Document",
  ];

  const isStepValid = (step: number): boolean => {
    const stepFields: Record<number, Array<keyof ResalePropertyFormData>> = {
      1: ["propertyHolderName", "societyName", "location", "builderName", "contactNumber", "transactionDate"],
      2: ["bhk", "sizeSqft"],
      3: ["price", "brokeragePercentage"],
      4: []
    };
    
    const fieldsToValidate = stepFields[step] || [];
    let stepIsValid = true;
    const newErrors = { ...errors };
    const newTouched = { ...touched };

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        stepIsValid = false;
      } else {
        newErrors[field] = "";
      }
      newTouched[field] = true;
    });

    setErrors(newErrors);
    setTouched(newTouched);
    return stepIsValid;
  };

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
          const data = await reverseGeocode(latitude, longitude);

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
          console.error("Error reverse geocoding resale location:", error);
          setFormData((prev) => ({
            ...prev,
            location: `${latitude}, ${longitude}`,
          }));
          if (touched.location) {
            setErrors((prev) => ({ ...prev, location: "" }));
          }
          showToast?.(
            "Location detected, details reverse-geocoding failed",
            "warning",
          );
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        showToast?.(
          "Could not obtain geolocation. Please enter name manually.",
          "error",
        );
        setIsDetectingLocation(false);
      },
    );
  };

  const validateField = (name: keyof ResalePropertyFormData, value: any) => {
    let error = "";
    switch (name) {
      case "propertyHolderName":
        if (!value) error = "Property holder name is required";
        break;
      case "societyName":
        if (!value) error = "Society name is required";
        break;
      case "location":
        if (!value) error = "Location is required";
        break;
      case "builderName":
        if (!value) error = "Builder name is required";
        break;
      case "contactNumber":
        if (!value) error = "Contact number is required";
        break;
      case "sizeSqft":
        if (isBhkApplicable(formData.propertyType)) {
          error = "";
        } else {
          if (value === "" || value === null) error = "Size is required";
          else if (isNaN(Number(value))) error = "Size must be a number";
        }
        break;
      case "bhk":
        if (!isBhkApplicable(formData.propertyType)) {
          error = "";
        } else {
          if (value === "" || value === null) error = "BHK is required";
        }
        break;
      case "price":
        if (isBhkApplicable(formData.propertyType)) {
          error = "";
        } else {
          if (value === "" || value === null) error = "Price is required";
          else if (isNaN(Number(value))) error = "Price must be a number";
        }
        break;
      case "brokeragePercentage":
        if (value !== "" && value !== null && isNaN(Number(value)))
          error = "Brokerage must be a number";
        break;
    }
    return error;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    let parsedValue: any = value;

    if (
      ["sizeSqft", "price", "brokeragePercentage", "constructionYear"].includes(
        name,
      )
    ) {
      parsedValue = value === "" ? "" : Number(value);
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: parsedValue };
      if (name === "constructionYear" && parsedValue !== "") {
        const currentYear = new Date().getFullYear();
        const age = currentYear - parsedValue;
        newData.propertyAge = age >= 0 ? `${age} years` : "0 years";
      }
      return newData;
    });

    if (touched[name as keyof ResalePropertyFormData]) {
      const error = validateField(
        name as keyof ResalePropertyFormData,
        parsedValue,
      );
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(
      name as keyof ResalePropertyFormData,
      formData[name as keyof ResalePropertyFormData],
    );
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const executeSubmit = async () => {
    try {
      setIsSubmitting(true);
      const submissionData = { ...formData };
      if (isBhkApplicable(formData.propertyType)) {
        const details = Object.entries(formData.bhkDetails || {}).filter(
          ([key]) => formData.bhk?.toString().split(", ").includes(key),
        );

        const sizes = details
          .map(([_, v]) => Number(v.sizeSqft))
          .filter((s) => !isNaN(s) && s > 0);
        submissionData.sizeSqft = sizes.length > 0 ? sizes[0] : "";

        const prices = details
          .map(([_, v]) => ({
            price: Number(v.price),
            unit: v.priceUnit,
          }))
          .filter((p) => !isNaN(p.price) && p.price > 0);

        if (prices.length > 0) {
          submissionData.price = prices[0].price;
          submissionData.priceUnit = prices[0].unit;
        } else {
          submissionData.price = "";
        }
      } else {
        // Clear out bhkDetails if BHK is not applicable
        submissionData.bhk = "";
        submissionData.bhkDetails = {};
      }
      if (submissionData.brokeragePercentage === "") {
        submissionData.brokeragePercentage = 0;
      }
      await onSubmit(submissionData);
      if (!initialData) {
        localStorage.removeItem("draft_resale");
      }
    } catch (err) {
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Partial<Record<keyof ResalePropertyFormData, string>> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof ResalePropertyFormData>).forEach(
      (key) => {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      },
    );

    setErrors(newErrors);

    // Duplicate check
    const isDuplicate = existingProperties.some(
      (p) =>
        (p.societyName?.toLowerCase() || '') === (formData.societyName?.toLowerCase() || '') &&
        p.bhk === formData.bhk &&
        (p.floorNumber?.toLowerCase() || '') === (formData.floorNumber?.toLowerCase() || '') &&
        (p.location?.toLowerCase() || '') === (formData.location?.toLowerCase() || '') &&
        (p.propertyHolderName?.toLowerCase() || '') === (formData.propertyHolderName?.toLowerCase() || ''),
    );

    if (isDuplicate) {
      setErrors((prev) => ({
        ...prev,
        societyName:
          "A property in this society with the same BHK and floor number already exists.",
      }));
      isValid = false;
    }

    const allTouched: any = {};
    (Object.keys(formData) as Array<keyof ResalePropertyFormData>).forEach(
      (key) => {
        allTouched[key] = true;
      },
    );
    setTouched(allTouched);

    if (isValid) {
      if (isOutsideRegion && !regionConfirmed) {
        setShowRegionAlert(true);
        return;
      }
      await executeSubmit();
    } else {
      // Find the first step that contains an error and switch to it
      const stepFields: Record<number, Array<keyof ResalePropertyFormData>> = {
        1: ["propertyHolderName", "societyName", "location", "builderName", "contactNumber", "transactionDate"],
        2: ["bhk", "sizeSqft"],
        3: ["price", "brokeragePercentage"],
        4: []
      };

      for (let s = 1; s <= 4; s++) {
        const fields = stepFields[s] || [];
        const hasErrorInStep = fields.some((f) => !!newErrors[f]);
        if (hasErrorInStep) {
          setCurrentStep(s);
          break;
        }
      }

      // Scroll to top of the form
      const headerElement = document.getElementById("resale-form-header");
      if (headerElement) {
        headerElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Dynamic Progressive Stepper */}
        <div id="resale-form-header" className="bg-surface border border-border-dim rounded-2xl p-4 md:p-6 mb-6 shadow-sm">
          {/* Transaction GUID Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-dim/50 pb-4 mb-5 gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-primary" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Transaction Mode</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-text-dim bg-surface-2 px-3 py-1.5 rounded-xl border border-border-bright w-fit">
            <span className="font-sans text-[9px] uppercase font-bold text-amber-primary">Transaction GUID:</span>
            <span className="select-all">{formData.transactionGuid}</span>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-primary">Step {currentStep} of 4</span>
              <h4 className="text-sm font-bold text-text-primary">{stepsList[currentStep - 1]}</h4>
            </div>
            <div className="text-[11px] font-mono text-text-dim">
              {Math.round((currentStep / 4) * 100)}% Complete
            </div>
          </div>
          <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden border border-border-bright/20">
            <div
              className="bg-amber-primary h-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border-dim/50 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-amber-primary/80 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />
          
          {stepsList.map((stepName, index) => {
            const stepNum = index + 1;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;
            
            return (
              <button
                key={stepNum}
                type="button"
                onClick={() => {
                  if (stepNum < currentStep) {
                    setCurrentStep(stepNum);
                  } else if (stepNum > currentStep) {
                    let valid = true;
                    for (let s = currentStep; s < stepNum; s++) {
                      if (!isStepValid(s)) {
                        valid = false;
                        break;
                      }
                    }
                    if (valid) {
                      setCurrentStep(stepNum);
                    }
                  }
                }}
                className="relative z-10 flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 ${
                    isActive
                      ? "bg-bg border-amber-primary text-amber-primary shadow-lg shadow-amber-primary/20 scale-110"
                      : isCompleted
                      ? "bg-amber-primary border-amber-primary text-bg"
                      : "bg-surface-2 border-border-bright text-text-dim group-hover:border-text-dim"
                  }`}
                >
                  {isCompleted ? "✓" : stepNum}
                </div>
                <span
                  className={`mt-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isActive
                      ? "text-amber-primary"
                      : isCompleted
                      ? "text-text-secondary"
                      : "text-text-dim group-hover:text-text-secondary"
                  }`}
                >
                  {stepName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Summary Alert */}
      {Object.keys(errors).some((key) => touched[key as keyof ResalePropertyFormData] && !!errors[key as keyof ResalePropertyFormData]) && (
        <div
          id="error-summary"
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-xs flex items-center gap-2 font-sans"
        >
          <AlertCircle size={16} />
          <span className="font-bold uppercase tracking-wider">
            Please fix the errors below before saving.
          </span>
        </div>
      )}

      {/* Step 1 Container */}
      <div style={{ display: currentStep === 1 ? 'block' : 'none' }} className="space-y-5">
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
                  <Sparkles size={14} className="animate-pulse" /> Popular
                  Societies
                </h5>
                <span className="text-[9px] text-text-dim uppercase font-bold">
                  {existingSocieties.length} total
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {existingSocieties.length > 0 ? (
                  existingSocieties.slice(0, 30).map((society, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          societyName: society,
                        }));
                        setTouched((prev) => ({ ...prev, societyName: true }));
                        setErrors((prev) => ({ ...prev, societyName: "" }));
                      }}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border whitespace-nowrap ${
                        formData.societyName === society
                          ? "bg-amber-primary text-bg border-amber-primary shadow-lg shadow-amber-primary/20"
                          : "bg-surface border-border-dim text-text-secondary hover:border-amber-primary/40 hover:text-amber-primary"
                      }`}
                    >
                      {society}
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-text-dim italic py-2">
                    No existing societies found
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-primary/80">
          <User size={16} />
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Basic Information
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              Property Holder Name <span className="text-amber-primary">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <User size={14} />
              </div>
              <input
                name="propertyHolderName"
                value={formData.propertyHolderName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Full name of the owner"
                className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${errors.propertyHolderName && touched.propertyHolderName ? "border-red-500/50 bg-red-500/5" : "border-border-bright focus:border-amber-primary focus:bg-surface-3"}`}
              />
            </div>
            {errors.propertyHolderName && touched.propertyHolderName && (
              <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.propertyHolderName}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              Transaction Date <span className="text-amber-primary">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Calendar size={14} />
              </div>
              <input
                name="transactionDate"
                type="date"
                value={formData.transactionDate}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all focus:border-amber-primary focus:bg-surface-3"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              Society Name <span className="text-amber-primary">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Building2 size={14} />
              </div>
              <input
                name="societyName"
                value={formData.societyName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. DLF Magnolias"
                className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${errors.societyName && touched.societyName ? "border-red-500/50 bg-red-500/5" : "border-border-bright focus:border-amber-primary focus:bg-surface-3"}`}
                list="society-names-list"
              />
              <datalist id="society-names-list">
                {existingSocieties.map((society, idx) => (
                  <option key={idx} value={society} />
                ))}
              </datalist>
            </div>
            {errors.societyName && touched.societyName && (
              <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.societyName}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
                Location <span className="text-amber-primary">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isDetectingLocation}
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
                name="location"
                value={formData.location}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Sector or Area Name"
                className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${errors.location && touched.location ? "border-red-500/50 bg-red-500/5" : "border-border-bright focus:border-amber-primary focus:bg-surface-3"}`}
              />
            </div>
            {errors.location && touched.location && (
              <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.location}
              </p>
            )}
            {isOutsideRegion && assignedRegion && !errors.location && (
              <p className="text-[10px] text-amber-primary/95 mt-1.5 flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-lg">
                <AlertCircle size={12} className="shrink-0 animate-pulse text-amber-primary" />
                <span>
                  Notice: Location falls outside of your current assigned region (
                  <span className="font-bold text-text-primary">{assignedRegion}</span>
                  ).
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              Builder Name <span className="text-amber-primary">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Building2 size={14} />
              </div>
              <input
                name="builderName"
                value={formData.builderName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. DLF, Emaar"
                className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${errors.builderName && touched.builderName ? "border-red-500/50 bg-red-500/5" : "border-border-bright focus:border-amber-primary focus:bg-surface-3"}`}
                list="resale-builder-names-list"
              />
              <datalist id="resale-builder-names-list">
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

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              RERA Number{" "}
              <span className="text-[9px] font-normal text-text-dim">
                (Optional)
              </span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <FileText size={14} />
              </div>
              <input
                name="reraNumber"
                value={formData.reraNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. UPRERAPRJ123456"
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all focus:border-amber-primary focus:bg-surface-3"
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              Contact Number <span className="text-amber-primary">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Info size={14} />
              </div>
              <input
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Owner/Broker contact"
                className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${errors.contactNumber && touched.contactNumber ? "border-red-500/50 bg-red-500/5" : "border-border-bright focus:border-amber-primary focus:bg-surface-3"}`}
              />
            </div>
            {errors.contactNumber && touched.contactNumber && (
              <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.contactNumber}
              </p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Step 2 Container */}
      <div style={{ display: currentStep === 2 ? 'block' : 'none' }} className="space-y-5">
        {/* Section 2: Property Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-primary/80">
          <Home size={16} />
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Property Details
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
              Property Type
            </label>
            <CustomSelect
              id="propertyType"
              value={formData.propertyType}
              onChange={(val) => {
                setFormData((prev) => ({ ...prev, propertyType: val }));
              }}
              options={[
                { value: "Apartments", label: "Apartments", desc: "Multi-family residential apartments" },
                { value: "Villas", label: "Villas", desc: "Private independent luxury villas" },
                { value: "Independent Floors", label: "Independent Floors", desc: "Low-rise builder floors" },
                { value: "Shops", label: "Shops", desc: "Retail spaces and commercial stores" },
                { value: "Offices", label: "Offices", desc: "Professional workspaces and suites" },
                { value: "Kiosks", label: "Kiosks", desc: "Small retail booths or food stalls" },
                { value: "Plots", label: "Plots", desc: "Residential or commercial vacant ground" },
                { value: "Studio Apartments", label: "Studio Apartments", desc: "Compact single-room residential layouts" }
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
              Possession Status
            </label>
            <CustomSelect
              id="possessionStatus"
              value={formData.possessionStatus}
              onChange={(val) => {
                setFormData((prev) => ({ ...prev, possessionStatus: val as any }));
              }}
              options={[
                { value: "Ready to Move", label: "Ready to Move", desc: "Completed and immediately ready for occupancy" },
                { value: "Under Construction", label: "Under Construction", desc: "Ongoing developmental or building phase" }
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
              {formData.possessionStatus === "Ready to Move"
                ? "Ready Since"
                : "Expected Possession"}
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Calendar size={14} />
              </div>
              <input
                name="possessionDate"
                type="date"
                value={formData.possessionDate}
                onChange={handleChange}
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-amber-primary focus:bg-surface-3 transition-all"
              />
            </div>
          </div>

          {isBhkApplicable(formData.propertyType) && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
                BHK & Configuration{" "}
                <span className="text-amber-primary">*</span>
              </label>
              <div className="space-y-4">
                {[
                  { label: "1 BHK", options: ["1 BHK", "1 BHK + 1T"] },
                  { label: "2 BHK", options: ["2 BHK", "2 BHK + 2T"] },
                  {
                    label: "3 BHK",
                    options: [
                      "3BHK + 2T",
                      "3BHK + 2T + Servent room",
                      "3BHK + 3T + Utility",
                    ],
                  },
                  {
                    label: "4 BHK",
                    options: [
                      "4BHK + 2T + Utility",
                      "4BHK + 3T + Servent",
                      "4BHK + 3T + Family Lounge + Sarvent",
                      "4BHK + 4T + Utility",
                    ],
                  },
                  {
                    label: "Penthouse",
                    options: [
                      "5BHK/Penthouse + 6T + Utility",
                      "Penthouse + Terrace",
                      "Luxury Penthouse",
                    ],
                  },
                ].map((group) => {
                  const selectedInGroup = group.options.filter((opt) =>
                    formData.bhk?.toString().split(", ").includes(opt),
                  );
                  return (
                    <div key={group.label} className="space-y-1.5">
                      <h5 className="text-[9px] font-black text-amber-primary uppercase tracking-widest opacity-70">
                        {group.label}
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {group.options.map((opt) => {
                          const isSelected = formData.bhk
                            ?.toString()
                            .split(", ")
                            .includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                let newBhk = formData.bhk
                                  ? formData.bhk
                                      .toString()
                                      .split(", ")
                                      .filter(Boolean)
                                  : [];
                                if (isSelected) {
                                  newBhk = newBhk.filter((b) => b !== opt);
                                } else {
                                  newBhk.push(opt);
                                }
                                const e = {
                                  target: {
                                    name: "bhk",
                                    value: newBhk.join(", "),
                                  },
                                } as any;
                                handleChange(e);
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${isSelected ? "bg-amber-primary text-bg border-amber-primary shadow-md" : "bg-surface-2 text-text-dim border-border-bright hover:border-amber-primary/50"}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {/* Inline Details for Selected BHKs */}
                      {selectedInGroup.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 mt-3">
                          {selectedInGroup.map((opt) => (
                            <div
                              key={opt + "-details"}
                              className="p-4 bg-surface-2/40 border border-border-bright rounded-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2"
                            >
                              <div className="flex items-center gap-2 border-b border-border-dim/50 pb-2">
                                <Home
                                  size={14}
                                  className="text-amber-primary"
                                />
                                <h6 className="text-[11px] font-bold text-text-primary uppercase tracking-widest">
                                  {opt} Details
                                </h6>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider flex justify-between">
                                    <span>Price</span>
                                    {formData.bhkDetails?.[opt]?.price && (
                                      <span className="text-amber-primary">
                                        ₹
                                        {(formData.bhkDetails[opt].priceUnit ===
                                        "Lacs"
                                          ? Number(
                                              formData.bhkDetails[opt].price,
                                            ) * 100000
                                          : Number(
                                              formData.bhkDetails[opt].price,
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
                                        formData.bhkDetails?.[opt]?.price || ""
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          bhkDetails: {
                                            ...(prev.bhkDetails || {}),
                                            [opt]: {
                                              ...(prev.bhkDetails?.[opt] || {
                                                sizeSqft: "",
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
                                    <div className="w-24 shrink-0">
                                      <CustomSelect
                                        variant="nested"
                                        value={
                                          formData.bhkDetails?.[opt]
                                            ?.priceUnit || "Lacs"
                                        }
                                        onChange={(val) =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            bhkDetails: {
                                              ...(prev.bhkDetails || {}),
                                              [opt]: {
                                                ...(prev.bhkDetails?.[opt] || {
                                                  sizeSqft: "",
                                                  price: "",
                                                  priceUnit: "Lacs",
                                                  floorPlan: [],
                                                }),
                                                priceUnit: val as "Lacs" | "Cr",
                                              },
                                            },
                                          }))
                                        }
                                        options={[
                                          { value: "Lacs", label: "Lacs" },
                                          { value: "Cr", label: "Cr" },
                                        ]}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                                  <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                                    Floor Plan Preview (Images)
                                  </label>
                                  <ImageUpload
                                    images={
                                      formData.bhkDetails?.[opt]?.floorPlan ||
                                      []
                                    }
                                    onChange={(images) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        bhkDetails: {
                                          ...(prev.bhkDetails || {}),
                                          [opt]: {
                                            ...(prev.bhkDetails?.[opt] || {
                                              sizeSqft: "",
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
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                                    Size (Sq.Ft.)
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="e.g. 1500"
                                    className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary focus:bg-surface-3 transition-colors"
                                    value={
                                      formData.bhkDetails?.[opt]?.sizeSqft || ""
                                    }
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        bhkDetails: {
                                          ...(prev.bhkDetails || {}),
                                          [opt]: {
                                            ...(prev.bhkDetails?.[opt] || {
                                              sizeSqft: "",
                                              price: "",
                                              priceUnit: "Lacs",
                                              floorPlan: [],
                                            }),
                                            sizeSqft: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                  />
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
              {errors.bhk && touched.bhk && (
                <p className="text-[9px] text-red-400 mt-1">{errors.bhk}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              Bathrooms
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => {
                const val = n.toString();
                const isSelected = formData.bathrooms
                  ?.toString()
                  .split(", ")
                  .includes(val);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      let newBaths = formData.bathrooms
                        ? formData.bathrooms
                            .toString()
                            .split(", ")
                            .filter(Boolean)
                        : [];
                      if (isSelected) {
                        newBaths = newBaths.filter((b) => b !== val);
                      } else {
                        newBaths.push(val);
                      }
                      const e = {
                        target: {
                          name: "bathrooms",
                          value: newBaths.join(", "),
                        },
                      } as any;
                      handleChange(e);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${isSelected ? "bg-amber-primary text-bg border-amber-primary" : "bg-surface-2 text-text-dim border-border-bright hover:border-amber-primary/50"}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {!isBhkApplicable(formData.propertyType) && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
                Size (Sq.Ft.) <span className="text-amber-primary">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                  <Maximize2 size={14} />
                </div>
                <input
                  name="sizeSqft"
                  type="number"
                  value={formData.sizeSqft}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 1200"
                  className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${errors.sizeSqft && touched.sizeSqft ? "border-red-500/50 bg-red-500/5" : "border-border-bright focus:border-amber-primary focus:bg-surface-3"}`}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[800, 1000, 1200, 1500, 1800, 2200, 2500].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      const e = {
                        target: { name: "sizeSqft", value: size.toString() },
                      } as any;
                      handleChange(e);
                    }}
                    className="px-2 py-0.5 bg-surface-3 border border-border-bright rounded-lg text-[9px] text-text-dim hover:border-amber-primary hover:text-amber-primary transition-all"
                  >
                    {size}
                  </button>
                ))}
              </div>
              {errors.sizeSqft && touched.sizeSqft && (
                <p className="text-[9px] text-red-400 mt-1">
                  {errors.sizeSqft}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              Floor Number
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Layers size={14} />
              </div>
              <input
                name="floorNumber"
                value={formData.floorNumber}
                onChange={handleChange}
                placeholder="e.g. 5th of 12"
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-amber-primary focus:bg-surface-3 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              Construction Year
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Calendar size={14} />
              </div>
              <input
                name="constructionYear"
                type="number"
                value={formData.constructionYear}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 2020"
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-amber-primary focus:bg-surface-3 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              Age of Property
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Calendar size={14} />
              </div>
              <input
                name="propertyAge"
                value={formData.propertyAge}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 2 years"
                className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-amber-primary focus:bg-surface-3 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Step 3 Container */}
      <div style={{ display: currentStep === 3 ? 'block' : 'none' }} className="space-y-5">
        {/* Section 3: Pricing & Terms */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-primary/80">
          <IndianRupee size={16} />
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Pricing & Terms
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {!isBhkApplicable(formData.propertyType) && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
                Price <span className="text-amber-primary">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                    <IndianRupee size={14} />
                  </div>
                  <input
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${errors.price && touched.price ? "border-red-500/50 bg-red-500/5" : "border-border-bright focus:border-amber-primary focus:bg-surface-3"}`}
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
              <div className="flex flex-wrap gap-1 mt-1.5">
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
                    className="px-2 py-0.5 bg-surface-3 border border-border-bright rounded-lg text-[9px] text-text-dim hover:border-amber-primary hover:text-amber-primary transition-all"
                  >
                    {val} {val < 10 ? "Cr" : "L"}
                  </button>
                ))}
              </div>
              {errors.price && touched.price && (
                <p className="text-[9px] text-red-400 mt-1">{errors.price}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
              Negotiable?
            </label>
            <div className="flex gap-2">
              {["YES", "NO"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    const e = {
                      target: { name: "isNegotiable", value: option },
                    } as any;
                    handleChange(e);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${formData.isNegotiable === option ? "bg-amber-primary text-bg border-amber-primary" : "bg-surface-2 text-text-dim border-border-bright hover:border-amber-primary/50"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-2">
              Brokerage (%) <span className="text-amber-primary">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
                <Percent size={14} />
              </div>
              <input
                name="brokeragePercentage"
                type="number"
                step="0.1"
                value={formData.brokeragePercentage}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${errors.brokeragePercentage && touched.brokeragePercentage ? "border-red-500/50 bg-red-500/5" : "border-border-bright focus:border-amber-primary focus:bg-surface-3"}`}
              />
            </div>
            <div className="flex gap-1 mt-1.5">
              {[0, 0.5, 1, 1.5, 2].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const e = {
                      target: {
                        name: "brokeragePercentage",
                        value: p.toString(),
                      },
                    } as any;
                    handleChange(e);
                  }}
                  className="px-2 py-0.5 bg-surface-3 border border-border-bright rounded-lg text-[9px] text-text-dim hover:border-amber-primary hover:text-amber-primary transition-all"
                >
                  {p}%
                </button>
              ))}
            </div>
            {errors.brokeragePercentage && touched.brokeragePercentage && (
              <p className="text-[9px] text-red-400 mt-1">
                {errors.brokeragePercentage}
              </p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Step 4 Container */}
      <div style={{ display: currentStep === 4 ? 'block' : 'none' }} className="space-y-5">
        <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-primary/80">
          <Layers size={16} />
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Media & Documents
          </h4>
        </div>
        <div className="bg-surface-2/50 border border-border-dim rounded-2xl p-4">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold block mb-2">
            Floor Plan (PDF)
          </label>
          <PdfUpload
            pdfs={formData.floorPlan}
            onError={(msg) => showToast?.(msg, "error")}
            onChange={(pdfs) =>
              setFormData((prev) => ({ ...prev, floorPlan: pdfs }))
            }
          />
        </div>

        <div className="bg-surface-2/50 border border-border-dim rounded-2xl p-4 mt-4">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold block mb-2">
            Property Images
          </label>
          <ImageUpload
            images={formData.images}
            onError={(msg) => showToast?.(msg, "error")}
            onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
          />
        </div>
      </div>
      </div>

      <div className="pt-4 border-t border-border-dim flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Left: Cancel button */}
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-all rounded-xl hover:bg-surface-2 border border-border-bright"
        >
          Cancel
        </button>

        {/* Right: Step controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => {
                setCurrentStep((prev) => Math.max(1, prev - 1));
                const formTop = document.getElementById("resale-form-header");
                if (formTop) {
                  formTop.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-all rounded-xl hover:bg-surface-2 border border-border-bright"
            >
              Back
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (isStepValid(currentStep)) {
                  setCurrentStep((prev) => Math.min(4, prev + 1));
                  const formTop = document.getElementById("resale-form-header");
                  if (formTop) {
                    formTop.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                } else {
                  showToast?.("Please complete the required fields in this step", "error");
                }
              }}
              className="w-full sm:w-auto bg-amber-primary text-bg px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-amber-primary/20 hover:bg-amber-secondary hover:scale-[1.02] active:scale-[0.98]"
            >
              Next Step
            </button>
          ) : (
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
              {isSubmitting ? "Saving Changes..." : "Save Listing"}
            </button>
          )}
        </div>
      </div>
    </form>

    {showRegionAlert && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md">
        <div className="bg-surface border border-amber-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-amber-600" />
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-primary shrink-0 animate-pulse">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-1">
                Region Mismatch Warning
              </h3>
              <p className="text-xs text-text-dim leading-relaxed">
                The property location falls outside of your current assigned region:
              </p>
              <div className="mt-2.5 px-3 py-2 bg-surface-2 border border-border-bright rounded-xl text-xs font-bold text-text-primary flex items-center justify-between">
                <span>Assigned Region:</span>
                <span className="text-amber-primary uppercase tracking-wider">{assignedRegion}</span>
              </div>
              <div className="mt-2 px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-red-400">
                <span className="font-semibold text-text-primary">Listed:</span> {formData.location}
              </div>
            </div>
          </div>

          <p className="text-xs text-text-dim mb-6 leading-relaxed">
            Are you sure you want to proceed and save this resale property listing anyway? This will override regional restrictions.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowRegionAlert(false);
                setRegionConfirmed(false);
              }}
              className="flex-1 px-5 py-3 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-all bg-surface-2 border border-border-bright hover:bg-surface-3"
            >
              Go Back & Edit
            </button>
            <button
              type="button"
              onClick={async () => {
                setShowRegionAlert(false);
                setRegionConfirmed(true);
                // Wait briefly then submit
                setTimeout(async () => {
                  await executeSubmit();
                }, 100);
              }}
              className="flex-1 px-5 py-3 rounded-xl text-xs font-bold text-bg bg-amber-primary hover:bg-amber-secondary transition-all shadow-lg shadow-amber-primary/20"
            >
              Confirm & Proceed
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};
