export interface ResaleProperty {
  id: string;
  propertyHolderName: string;
  societyName: string;
  location: string;
  builderName: string;
  propertyType: string;
  sizeSqft: number;
  bhk: string;
  bathrooms?: string;
  price: number;
  isNegotiable: 'YES' | 'NO';
  floorNumber: string;
  propertyAge: string;
  constructionYear?: number;
  contactNumber?: string;
  reraNumber?: string;
  floorPlan?: { name: string; size: number; data: string }[];
  images?: { name: string; size: number; data: string }[];
  brokeragePercentage: number;
  coordinates?: { lat: number; lng: number };
  status: 'Active' | 'Sold' | 'Pending' | 'PENDING_DELETE';
  createdAt: string;
  updatedAt?: string;
}
