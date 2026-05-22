export interface Project {
  id: string;
  title: string;
  builderName: string;
  projectType: 'Residential' | 'Commercial';
  subType: string;
  type: string; // Keeping for backward compatibility or general categorization
  configuration?: string;
  possessionStatus: 'Ready to Move' | 'Under Construction' | 'New Launch';
  launchDate?: string;
  reraNumber: string;
  price: number;
  location: string;
  status: 'Active' | 'Sold' | 'Pending' | 'PENDING_DELETE';
  area: string;
  bathrooms?: string;
  coordinates?: { lat: number; lng: number };
  pdfs?: { name: string; size: number; data: string }[];
  images?: { name: string; size: number; data: string }[];
  createdAt: string;
  updatedAt?: string;
  assignedTo?: string;
}
