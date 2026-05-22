export interface Report {
  id: string;
  title: string;
  content: string;
  assignedTo: string;
  status: 'Draft' | 'Final' | 'Archived';
  createdAt: string;
  updatedAt: string;
}
