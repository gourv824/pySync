import React, { useState, useEffect, useRef } from 'react';
import { PdfUpload, PdfFile } from './PdfUpload';
import { ImageUpload, ImageFile } from './ImageUpload';
import { Trash2, AlertCircle, Loader2, User, Building2, MapPin, Home, Maximize2, IndianRupee, Percent, Calendar, Layers, CheckCircle2, Sparkles, Bath, Info, Key, FileText } from 'lucide-react';
import { geminiService } from '../services/geminiService';

export interface ProjectFormData {
 title: string;
 builderName: string;
 projectType: 'Residential' | 'Commercial';
 subType: string;
 type: string;
 configuration?: string;
 possessionStatus: 'Ready to Move' | 'Under Construction' | 'New Launch';
 possessionDate?: string;
 launchDate?: string;
 reraNumber: string;
 price: number | '';
 priceUnit: 'Lacs' | 'Cr';
 area: string;
 location: string;
 bathrooms: string;
 pdfs: PdfFile[];
 images: { name: string; size: number; data: string }[];
 assignedTo?: string;
 bhkDetails?: Record<string, { sizeSqft: string; price: string; priceUnit: 'Lacs' | 'Cr'; floorPlan: any[] }>;
}

interface ProjectFormProps {
 initialData?: Partial<ProjectFormData>;
 onSubmit: (data: ProjectFormData) => void;
 onCancel: () => void;
 existingTitles?: string[];
 existingBuilders?: string[];
 showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
 users?: { id: string, name: string }[];
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, onSubmit, onCancel, existingTitles = [], existingBuilders = [], showToast, users = [] }) => {
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [formData, setFormData] = useState<ProjectFormData>(() => {
 if (!initialData) {
 const savedDraft = localStorage.getItem('draft_project');
 if (savedDraft) {
 try {
 const parsed = JSON.parse(savedDraft);
 return {
 ...parsed,
 pdfs: parsed.pdfs || [],
 images: parsed.images || []
 };
 } catch (e) {
 console.error("Failed to parse draft project", e);
 }
 }
 }
 return {
 title: initialData?.title || '',
 builderName: initialData?.builderName || '',
 projectType: initialData?.projectType || 'Residential',
 subType: initialData?.subType || 'Apartments',
 type: initialData?.type || 'Apartments',
 configuration: initialData?.configuration || '',
 possessionStatus: (initialData?.possessionStatus as any) || 'Ready to Move',
 possessionDate: initialData?.possessionDate || '',
 launchDate: initialData?.launchDate || '',
 reraNumber: initialData?.reraNumber || '',
 price: initialData?.price ?? '',
 priceUnit: initialData?.priceUnit || 'Lacs',
 area: initialData?.area?.toString() || '',
 location: initialData?.location || '',
 bathrooms: initialData?.bathrooms || '',
 pdfs: initialData?.pdfs || [],
 images: initialData?.images || [],
 assignedTo: initialData?.assignedTo || ''
 };
 });

 const [lastSaved, setLastSaved] = useState<Date | null>(null);

 useEffect(() => {
 if (!initialData) {
 try {
 localStorage.setItem('draft_project', JSON.stringify(formData));
 setLastSaved(new Date());
 } catch (e) {
 console.warn("Could not save draft to localStorage, possibly due to size limits", e);
 }
 }
 }, [formData, initialData]);

 const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});
 const [touched, setTouched] = useState<Partial<Record<keyof ProjectFormData, boolean>>>({});

 const validateField = (name: keyof ProjectFormData, value: any) => {
 let error = '';
 switch (name) {
 case 'title':
 if (!value) error = 'Title is required';
 else if (value.length < 5) error = 'Title must be at least 5 characters';
 else if (value.length > 100) error = 'Title must be less than 100 characters';
 else if (existingTitles.includes(value) && value !== initialData?.title) error = 'Project with this title already exists';
 break;
 case 'builderName':
 if (!value) error = 'Builder Name is required';
 break;
 case 'reraNumber':
 if (!value) error = 'RERA Number is required';
 break;
 case 'pdfs':
 if (!value || value.length === 0) error = 'At least one PDF document is required';
 break;
 case 'location':
 if (!value) error = 'Location is required';
 break;
 case 'projectType':
 if (!value) error = 'Project type is required';
 break;
 case 'subType':
 if (!value) error = 'Sub-type is required';
 break;
 case 'possessionStatus':
 if (!value) error = 'Possession status is required';
 break;
 case 'launchDate':
 if (formData.possessionStatus === 'New Launch' && !value) {
 error = 'Launch date is required for New Launch projects';
 }
 break;
 case 'configuration':
 if ((formData.subType === 'Apartments' || formData.subType === 'Villas' || formData.subType === 'Independent Floors') && !value) {
 error = 'Configuration (BHK) is required';
 }
 break;
 case 'price':
 if (value === '' || value === null) error = 'Price is required';
 else if (isNaN(Number(value))) error = 'Price must be a number';
 else if (Number(value) <= 0) error = 'Price must be greater than zero';
 else if (formData.priceUnit === 'Lacs' && Number(value) >= 100) error = 'Use Cr for values 100 Lacs and above';
 break;
 case 'area':
 if (!value) error = 'Area is required';
 break;
 }
 return error;
 };

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target;
 let parsedValue: any = value;
 
 if (name === 'price') {
 parsedValue = value === '' ? '' : Number(value);
 }

 setFormData(prev => {
 const newData = { ...prev, [name]: parsedValue };
 if (name === 'subType') {
 newData.type = parsedValue;
 }
 return newData;
 });
 
 if (touched[name as keyof ProjectFormData]) {
 const error = validateField(name as keyof ProjectFormData, parsedValue);
 setErrors(prev => ({ ...prev, [name]: error }));
 }
 };

 const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
 setFormData(prev => ({ ...prev, priceUnit: e.target.value as 'Lacs' | 'Cr' }));
 };

 const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target;
 setTouched(prev => ({ ...prev, [name]: true }));
 const error = validateField(name as keyof ProjectFormData, formData[name as keyof ProjectFormData]);
 setErrors(prev => ({ ...prev, [name]: error }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (isSubmitting) return;
 
 // Validate all fields
 const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};
 let isValid = true;
 
 (Object.keys(formData) as Array<keyof ProjectFormData>).forEach(key => {
 const error = validateField(key, formData[key]);
 if (error) {
 newErrors[key] = error;
 isValid = false;
 }
 });

 setErrors(newErrors);
 
 // Mark all as touched
 const allTouched: any = {};
 (Object.keys(formData) as Array<keyof ProjectFormData>).forEach(key => {
 allTouched[key] = true;
 });
 setTouched(allTouched);

 if (isValid) {
 try {
 setIsSubmitting(true);
 await onSubmit(formData);
 if (!initialData) {
 localStorage.removeItem('draft_project');
 }
 } catch (err) {
 console.error("Form submission error:", err);
 } finally {
 setIsSubmitting(false);
 }
 } else {
 // Scroll to top to show error summary
 const errorSummary = document.getElementById('error-summary');
 if (errorSummary) {
 errorSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
 } else {
 const formElement = e.currentTarget as HTMLFormElement;
 formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }
 }
 };

 const residentialSubTypes = ['Apartments', 'Villas', 'Independent Floors', 'Plots'];
 const commercialSubTypes = ['Shops', 'Offices', 'Kiosks', 'Plots', 'Studio Apartments'];

 const bhkConfigurations: Record<string, string[]> = {
 '1BHK': ['1BHK', '1BHK + 1T'],
 '2BHK': ['2BHK', '2BHK + 2T'],
 '3BHK': [
 '3BHK + 2T',
 '3BHK + 2T + Servent room',
 '3BHK + 3T + Utility'
 ],
 '4BHK': [
 '4BHK + 2T + Utility',
 '4BHK + 3T + Servent',
 '4BHK + 3T + Family Lounge + Sarvent',
 '4BHK + 4T + Utility'
 ],
 'Penthouse': [
 '5BHK/Penthouse + 6T + Utility',
 'Penthouse + Terrace',
 'Luxury Penthouse'
 ]
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
 <Sparkles size={14} className="animate-pulse" /> Suggested Builders
 </h5>
 <span className="text-[9px] text-text-dim uppercase font-bold">{existingBuilders.length} total</span>
 </div>
 <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
 {existingBuilders.length > 0 ? (
 existingBuilders.slice(0, 30).map((builder, idx) => (
 <button
 key={idx}
 type="button"
 onClick={() => {
 setFormData(prev => ({ ...prev, builderName: builder }));
 setTouched(prev => ({ ...prev, builderName: true }));
 setErrors(prev => ({ ...prev, builderName: '' }));
 }}
 className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border whitespace-nowrap ${
 formData.builderName === builder 
 ? 'bg-amber-primary text-bg border-amber-primary shadow-lg shadow-amber-primary/20' 
 : 'bg-surface border-border-dim text-text-secondary hover:border-amber-primary/40 hover:text-amber-primary'
 }`}
 >
 {builder}
 </button>
 ))
 ) : (
 <p className="text-[10px] text-text-dim italic py-2">No existing builders found</p>
 )}
 </div>
 </div>
 
 <div className="w-px bg-border-dim/30 hidden md:block" />
 
 <div className="md:w-1/2 space-y-4">
 <div className="flex items-center justify-between">
 <h5 className="text-[10px] font-black text-amber-primary uppercase tracking-widest flex items-center gap-2">
 <Sparkles size={14} className="animate-pulse" /> Similar Projects
 </h5>
 <span className="text-[9px] text-text-dim uppercase font-bold">{existingTitles.length} total</span>
 </div>
 <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
 {existingTitles.length > 0 ? (
 existingTitles.slice(0, 30).map((title, idx) => (
 <button
 key={idx}
 type="button"
 onClick={() => {
 setFormData(prev => ({ ...prev, title }));
 setTouched(prev => ({ ...prev, title: true }));
 setErrors(prev => ({ ...prev, title: '' }));
 }}
 className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border whitespace-nowrap ${
 formData.title === title 
 ? 'bg-amber-primary text-bg border-amber-primary shadow-lg shadow-amber-primary/20' 
 : 'bg-surface border-border-dim text-text-secondary hover:border-amber-primary/40 hover:text-amber-primary'
 }`}
 >
 {title}
 </button>
 ))
 ) : (
 <p className="text-[10px] text-text-dim italic py-2">No existing projects found</p>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>

 {Object.keys(errors).some(k => errors[k as keyof ProjectFormData]) && (
 <div id="error-summary" className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300" role="alert">
 <AlertCircle size={16} />
 <span className="font-bold uppercase tracking-wider">Please fix the errors below before saving.</span>
 </div>
 )}

 {/* Section 1: Basic Details */}
 <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-5 shadow-sm">
 <div className="flex items-center gap-2 text-amber-primary border-b border-border-dim pb-3 mb-4">
 <Info size={18} />
 <h4 className="text-xs font-bold uppercase tracking-[0.15em]">Basic Details</h4>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-1.5 md:col-span-2">
 <label htmlFor="title" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <Building2 size={12} className="text-amber-primary/70" /> Project Title <span className="text-amber-primary">*</span>
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
 errors.title && touched.title ? 'border-red-500/50 bg-red-500/5' : 'border-border-bright focus:border-amber-primary focus:bg-surface-3'
 }`}
 placeholder="e.g. Luxury 3BHK Apartment in Downtown"
 maxLength={100}
 />
 </div>
 <div className="flex justify-between items-center mt-1">
 {errors.title && touched.title && (
 <p id="title-error" className="text-[9px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {errors.title}</p>
 )}
 <div className="text-[9px] text-text-dim ml-auto">{formData.title.length}/100</div>
 </div>
 </div>

 <div className="space-y-1.5">
 <label htmlFor="builderName" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <User size={12} className="text-amber-primary/70" /> Builder Name <span className="text-amber-primary">*</span>
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
 errors.builderName && touched.builderName ? 'border-red-500/50 bg-red-500/5' : 'border-border-bright focus:border-amber-primary focus:bg-surface-3'
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
 <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.builderName}</p>
 )}
 </div>

 <div className="space-y-1.5">
 <label htmlFor="assignedTo" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <User size={12} className="text-amber-primary/70" /> Assigned To
 </label>
 <div className="relative group">
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
 <User size={14} />
 </div>
 <select 
 id="assignedTo"
 name="assignedTo"
 value={formData.assignedTo}
 onChange={handleChange}
 className="w-full bg-surface-2 border border-border-bright rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-amber-primary focus:bg-surface-3 transition-all appearance-none cursor-pointer"
 >
 <option value="">Unassigned</option>
 {users.map(u => (
 <option key={u.id} value={u.name}>{u.name}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="space-y-1.5">
 <label htmlFor="reraNumber" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <FileText size={12} className="text-amber-primary/70" /> RERA Number <span className="text-amber-primary">*</span>
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
 errors.reraNumber && touched.reraNumber ? 'border-red-500/50 bg-red-500/5' : 'border-border-bright focus:border-amber-primary focus:bg-surface-3'
 }`}
 placeholder="e.g. UPRERAPRJ123456"
 />
 </div>
 {errors.reraNumber && touched.reraNumber && (
 <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.reraNumber}</p>
 )}
 </div>

 <div className="space-y-1.5">
 <label htmlFor="projectType" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <Building2 size={12} className="text-amber-primary/70" /> Project Type <span className="text-amber-primary">*</span>
 </label>
 <div className="flex gap-2">
 {['Residential', 'Commercial'].map(type => (
 <button
 key={type}
 type="button"
 onClick={() => {
 const newType = type as 'Residential' | 'Commercial';
 setFormData(prev => ({ 
 ...prev, 
 projectType: newType,
 subType: newType === 'Residential' ? 'Apartments' : 'Shops'
 }));
 }}
 className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${formData.projectType === type ? 'bg-amber-primary text-bg border-amber-primary' : 'bg-surface-2 text-text-dim border-border-bright hover:border-amber-primary/50'}`}
 >
 {type}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-1.5">
 <label htmlFor="subType" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <Layers size={12} className="text-amber-primary/70" /> Sub-Type <span className="text-amber-primary">*</span>
 </label>
 <select 
 id="subType"
 name="subType"
 value={formData.subType}
 onChange={handleChange}
 className="w-full bg-surface-2 border border-border-bright rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-primary focus:bg-surface-3 transition-all appearance-none cursor-pointer"
 >
 {(formData.projectType === 'Residential' ? residentialSubTypes : commercialSubTypes).map(type => (
 <option key={type} value={type}>{type}</option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label htmlFor="possessionStatus" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <Key size={12} className="text-amber-primary/70" /> Possession Status <span className="text-amber-primary">*</span>
 </label>
 <div className="flex flex-wrap gap-1.5">
 {['Ready to Move', 'Under Construction', 'New Launch'].map(status => (
 <button
 key={status}
 type="button"
 onClick={() => {
 const e = { target: { name: 'possessionStatus', value: status } } as any;
 handleChange(e);
 }}
 className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${formData.possessionStatus === status ? 'bg-amber-primary text-bg border-amber-primary' : 'bg-surface-2 text-text-dim border-border-bright hover:border-amber-primary/50'}`}
 >
 {status}
 </button>
 ))}
 </div>
 </div>

 {(formData.possessionStatus === 'Ready to Move' || formData.possessionStatus === 'Under Construction') && (
 <div className="space-y-2">
 <label htmlFor="possessionDate" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <Calendar size={12} className="text-amber-primary/70" /> {formData.possessionStatus === 'Ready to Move' ? 'Ready Since' : 'Expected Possession'} <span className="text-amber-primary">*</span>
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
 errors.possessionDate && touched.possessionDate ? 'border-red-500/50 bg-red-500/5' : 'border-border-bright focus:border-amber-primary focus:bg-surface-3'
 }`}
 />
 </div>
 </div>
 )}

 {formData.possessionStatus === 'New Launch' && (
 <div className="space-y-2">
 <label htmlFor="launchDate" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <Calendar size={12} className="text-amber-primary/70" /> Launch Date <span className="text-amber-primary">*</span>
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
 errors.launchDate && touched.launchDate ? 'border-red-500/50 bg-red-500/5' : 'border-border-bright focus:border-amber-primary focus:bg-surface-3'
 }`}
 />
 </div>
 {errors.launchDate && touched.launchDate && (
 <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.launchDate}</p>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Section 2: Property Configuration */}
 <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-5 shadow-sm">
 <div className="flex items-center gap-2 text-amber-primary border-b border-border-dim pb-3 mb-4">
 <Home size={18} />
 <h4 className="text-xs font-bold uppercase tracking-[0.15em]">Property Configuration</h4>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
 {(formData.subType === 'Apartments' || formData.subType === 'Villas' || formData.subType === 'Independent Floors') && (
 <div className="space-y-4">
 <label htmlFor="configuration" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <Home size={12} className="text-amber-primary/70" /> Configuration (BHK Options) <span className="text-amber-primary">*</span>
 </label>
 
 <div className="space-y-6">
 {(Object.keys(bhkConfigurations) as string[]).map(bhkType => {
 const selectedInGroup = bhkConfigurations[bhkType].filter(config => formData.configuration?.split(', ').includes(config));
 return (
 <div key={bhkType} className="space-y-2">
 <h5 className="text-[9px] font-black text-amber-primary uppercase tracking-widest">{bhkType} Options</h5>
 <div className="flex flex-wrap gap-2">
 {bhkConfigurations[bhkType].map(config => {
 const isSelected = formData.configuration?.split(', ').includes(config);
 return (
 <button
 key={config}
 type="button"
 onClick={() => {
 let newConfig = formData.configuration ? formData.configuration.split(', ').filter(Boolean) : [];
 if (isSelected) {
 newConfig = newConfig.filter(c => c !== config);
 } else {
 newConfig.push(config);
 }
 // Replace 5BHK with Penthouse label if it's strictly 5BHK
 const formattedConfig = newConfig.map(c => c === '5BHK' ? 'Penthouse' : c);
 const e = { target: { name: 'configuration', value: formattedConfig.join(', ') } } as any;
 handleChange(e);
 }}
 className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${isSelected ? 'bg-amber-primary text-bg border-amber-primary shadow-lg shadow-amber-primary/10 scale-[1.02]' : 'bg-surface-2 text-text-dim border-border-bright hover:border-amber-primary/50'}`}
 >
 {config}
 </button>
 );
 })}
 </div>
 {/* Inline Details for Selected BHKs */}
 {selectedInGroup.length > 0 && (
 <div className="grid grid-cols-1 gap-4 mt-3">
 {selectedInGroup.map(config => (
 <div key={config + "-details"} className="p-4 bg-surface-2/40 border border-border-bright rounded-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
 <div className="flex items-center gap-2 border-b border-border-dim/50 pb-2">
 <Home size={14} className="text-amber-primary" />
 <h6 className="text-[11px] font-bold text-text-primary uppercase tracking-widest">{config} Details</h6>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">SQFT (Size)</label>
 <input 
 type="number"
 placeholder="e.g. 1500"
 className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary focus:bg-surface-3 transition-colors"
 value={formData.bhkDetails?.[config]?.sizeSqft || ''}
 onChange={(e) => setFormData(prev => ({
 ...prev,
 bhkDetails: {
 ...(prev.bhkDetails || {}),
 [config]: {
 ...(prev.bhkDetails?.[config] || { sizeSqft: '', price: '', priceUnit: 'Lacs', floorPlan: [] }),
 sizeSqft: e.target.value
 }
 }
 }))}
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider flex justify-between">
 <span>Price</span>
 {formData.bhkDetails?.[config]?.price && (
 <span className="text-amber-primary">
 ₹{(formData.bhkDetails[config].priceUnit === 'Lacs' ? Number(formData.bhkDetails[config].price) * 100000 : Number(formData.bhkDetails[config].price) * 10000000).toLocaleString()}
 </span>
 )}
 </label>
 <div className="flex gap-2">
 <input 
 type="number"
 placeholder="e.g. 1.5"
 className="w-full bg-surface border border-border-bright rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-primary focus:bg-surface-3 transition-colors"
 value={formData.bhkDetails?.[config]?.price || ''}
 onChange={(e) => setFormData(prev => ({
 ...prev,
 bhkDetails: {
 ...(prev.bhkDetails || {}),
 [config]: {
 ...(prev.bhkDetails?.[config] || { sizeSqft: '', price: '', priceUnit: 'Lacs', floorPlan: [] }),
 price: e.target.value
 }
 }
 }))}
 />
 <select 
 className="bg-surface border border-border-bright rounded-xl px-2 text-xs outline-none focus:border-amber-primary cursor-pointer"
 value={formData.bhkDetails?.[config]?.priceUnit || 'Lacs'}
 onChange={(e) => setFormData(prev => ({
 ...prev,
 bhkDetails: {
 ...(prev.bhkDetails || {}),
 [config]: {
 ...(prev.bhkDetails?.[config] || { sizeSqft: '', price: '', priceUnit: 'Lacs', floorPlan: [] }),
 priceUnit: e.target.value as 'Lacs' | 'Cr'
 }
 }
 }))}
 >
 <option value="Lacs">Lacs</option>
 <option value="Cr">Cr</option>
 </select>
 </div>
 </div>
 <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
 <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Floor Plan Preview (Images)</label>
 <ImageUpload 
 images={formData.bhkDetails?.[config]?.floorPlan || []}
 onChange={(images) => setFormData(prev => ({
 ...prev,
 bhkDetails: {
 ...(prev.bhkDetails || {}),
 [config]: {
 ...(prev.bhkDetails?.[config] || { sizeSqft: '', price: '', priceUnit: 'Lacs', floorPlan: [] }),
 floorPlan: images
 }
 }
 }))}
 />
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )})}
 </div>
 {errors.configuration && touched.configuration && (
 <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.configuration}</p>
 )}
 </div>
 )}

 <div className="space-y-2">
 <label htmlFor="bathrooms" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <Bath size={12} className="text-amber-primary/70" /> Bathrooms <span className="text-amber-primary">*</span>
 </label>
 <div className="flex flex-wrap gap-2">
 {[1, 2, 3, 4, 5].map(n => {
 const val = n.toString();
 const isSelected = formData.bathrooms?.toString().split(', ').includes(val);
 return (
 <button
 key={n}
 type="button"
 onClick={() => {
 let newBaths = formData.bathrooms ? formData.bathrooms.toString().split(', ').filter(Boolean) : [];
 if (isSelected) {
 newBaths = newBaths.filter(b => b !== val);
 } else {
 newBaths.push(val);
 }
 const e = { target: { name: 'bathrooms', value: newBaths.join(', ') } } as any;
 handleChange(e);
 }}
 className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${isSelected ? 'bg-amber-primary text-bg border-amber-primary' : 'bg-surface-2 text-text-dim border-border-bright hover:border-amber-primary/50'}`}
 >
 {n}
 </button>
 );
 })}
 </div>
 {errors.bathrooms && touched.bathrooms && (
 <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.bathrooms}</p>
 )}
 </div>

 <div className="space-y-2 md:col-span-2">
 <label htmlFor="area" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <Maximize2 size={12} className="text-amber-primary/70" /> Area (sq ft) <span className="text-amber-primary">*</span>
 </label>
 <div className="relative group">
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
 <Maximize2 size={14} />
 </div>
 <input 
 id="area"
 name="area"
 type="text"
 value={formData.area}
 onChange={handleChange}
 onBlur={handleBlur}
 aria-invalid={!!errors.area}
 aria-describedby={errors.area ? "area-error" : undefined}
 className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${
 errors.area && touched.area ? 'border-red-500/50 bg-red-500/5' : 'border-border-bright focus:border-amber-primary focus:bg-surface-3'
 }`}
 placeholder="e.g. 1200, 1500, 1800"
 />
 </div>
 <div className="flex flex-wrap gap-1 mt-2">
 {[800, 1000, 1200, 1500, 1800, 2000, 2500].map(size => (
 <button
 key={size}
 type="button"
 onClick={() => {
 const currentSizes = formData.area.split(',').map(s => s.trim()).filter(Boolean);
 if (!currentSizes.includes(size.toString())) {
 const newArea = [...currentSizes, size.toString()].join(', ');
 setFormData(prev => ({ ...prev, area: newArea }));
 }
 }}
 className="px-2 py-1 bg-surface-3 border border-border-bright rounded-lg text-[9px] text-text-dim hover:border-amber-primary hover:text-amber-primary transition-all"
 >
 +{size}
 </button>
 ))}
 </div>
 <p className="text-[9px] text-text-dim italic mt-1">Separate multiple sizes with commas.</p>
 {errors.area && touched.area && (
 <p id="area-error" className="text-[9px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.area}</p>
 )}
 </div>
 </div>
 </div>

 {/* Section 3: Location & Pricing */}
 <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-5 shadow-sm">
 <div className="flex items-center gap-2 text-amber-primary border-b border-border-dim pb-3 mb-4">
 <MapPin size={18} />
 <h4 className="text-xs font-bold uppercase tracking-[0.15em]">Location & Pricing</h4>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2 md:col-span-2">
 <label htmlFor="location" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <MapPin size={12} className="text-amber-primary/70" /> Location <span className="text-amber-primary">*</span>
 </label>
 <div className="relative group">
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors">
 <MapPin size={14} />
 </div>
 <input 
 id="location"
 name="location"
 value={formData.location}
 onChange={handleChange}
 onBlur={handleBlur}
 aria-invalid={!!errors.location}
 aria-describedby={errors.location ? "location-error" : undefined}
 className={`w-full bg-surface-2 border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${
 errors.location && touched.location ? 'border-red-500/50 bg-red-500/5' : 'border-border-bright focus:border-amber-primary focus:bg-surface-3'
 }`}
 placeholder="e.g. Bandra West, Mumbai"
 />
 </div>
 {errors.location && touched.location && (
 <p id="location-error" className="text-[9px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.location}</p>
 )}
 </div>

 <div className="space-y-2">
 <label htmlFor="price" className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5">
 <IndianRupee size={12} className="text-amber-primary/70" /> Price <span className="text-amber-primary">*</span>
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
 errors.price && touched.price ? 'border-red-500/50 bg-red-500/5' : 'border-border-bright focus:border-amber-primary focus:bg-surface-3'
 }`}
 placeholder="e.g. 1.5"
 />
 </div>
 <select 
 name="priceUnit"
 value={formData.priceUnit}
 onChange={handleUnitChange}
 className="w-24 bg-surface-2 border border-border-bright rounded-xl px-2 py-2.5 text-xs outline-none focus:border-amber-primary cursor-pointer"
 >
 <option value="Lacs">Lacs</option>
 <option value="Cr">Cr</option>
 </select>
 </div>
 <div className="flex flex-wrap gap-1 mt-2">
 {[40, 50, 60, 75, 90, 1.2, 1.5, 2.5].map(val => (
 <button
 key={val}
 type="button"
 onClick={() => {
 const unit = val < 10 ? 'Cr' : 'Lacs';
 setFormData(prev => ({ ...prev, price: val, priceUnit: unit }));
 }}
 className="px-2 py-1 bg-surface-3 border border-border-bright rounded-lg text-[9px] text-text-dim hover:border-amber-primary hover:text-amber-primary transition-all"
 >
 {val} {val < 10 ? 'Cr' : 'L'}
 </button>
 ))}
 </div>
 {formData.price && !errors.price && (
 <div className="text-[9px] text-amber-primary/70 font-medium mt-1">
 Calculated: ₹{(formData.priceUnit === 'Lacs' ? Number(formData.price) * 100000 : Number(formData.price) * 10000000).toLocaleString()}
 </div>
 )}
 {errors.price && touched.price && (
 <p id="price-error" className="text-[9px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.price}</p>
 )}
 </div>

 </div>
 </div>

 {/* Section 4: Media & Documents */}
 <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-5 shadow-sm">
 <div className="flex items-center gap-2 text-amber-primary border-b border-border-dim pb-3 mb-4">
 <Layers size={18} />
 <h4 className="text-xs font-bold uppercase tracking-[0.15em]">Media & Documents</h4>
 </div>
 
 <div>
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5 mb-4">
 <FileText size={12} className="text-amber-primary/70" /> Project Documents (PDF) <span className="text-amber-primary">*</span>
 </label>
 <PdfUpload 
 pdfs={formData.pdfs} 
 onError={(msg) => showToast?.(msg, 'error')}
 onChange={(newPdfs) => {
 setFormData(prev => ({ ...prev, pdfs: newPdfs }));
 if (touched.pdfs) {
 const error = validateField('pdfs', newPdfs);
 setErrors(prev => ({ ...prev, pdfs: error }));
 }
 }} 
 />
 {errors.pdfs && touched.pdfs && (
 <p className="text-[9px] text-red-400 mt-3 flex items-center gap-1"><AlertCircle size={10} /> {errors.pdfs}</p>
 )}
 </div>

 <div className="mt-6">
 <label className="text-[10px] text-text-dim uppercase tracking-wider font-bold flex items-center gap-1.5 mb-4">
 <Layers size={12} className="text-amber-primary/70" /> Project Images
 </label>
 <ImageUpload 
 images={formData.images} 
 onError={(msg) => showToast?.(msg, 'error')}
 onChange={(newImages) => {
 setFormData(prev => ({ ...prev, images: newImages }));
 }} 
 />
 </div>
 </div>

 <div className="pt-6 border-t border-border-dim flex flex-col sm:flex-row justify-between items-center gap-4">
 <div className="flex items-center gap-2 text-[9px] text-text-dim uppercase tracking-widest font-bold">
 {lastSaved && !initialData && (
 <>
 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
 Draft saved at {lastSaved.toLocaleTimeString()}
 </>
 )}
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
 isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-amber-secondary hover:scale-[1.02] active:scale-[0.98]'
 }`}
 >
 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
 {isSubmitting ? 'Saving Changes...' : 'Save Project'}
 </button>
 </div>
 </div>
 </form>
 );
};
