export interface Project {
  id: string;
  title: string;
  builderName: string;
  projectType: 'Residential' | 'Commercial';
  subType: string;
  type: string; // Keeping for backward compatibility or general categorization
  configuration?: string;
  possessionStatus: 'Ready to Move' | 'Under Construction' | 'New Launch';
  projectSize?: string;
  towersAndFloors?: string;
  noOfTowers?: string;
  noOfFloors?: string;
  totalUnits?: string;
  sizeRange?: string;
  possessionDate?: string;
  launchDate?: string;
  reraNumber: string;
  price: number;
  location: string;
  status: 'Active' | 'Sold' | 'Pending' | 'PENDING_DELETE';
  area: string;
  bathrooms?: string;
  sector?: string;
  microMarket?: string;
  coordinates?: { lat: number; lng: number };
  pdfs?: { name: string; size: number; data: string }[];
  images?: { name: string; size: number; data: string }[];
  paymentPlans?: any;
  createdAt: string;
  updatedAt?: string;
  assignedTo?: string;
}
