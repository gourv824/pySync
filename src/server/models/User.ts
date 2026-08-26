export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'employee' | 'team leader' | 'team_leader';
  passwordHash: string;
  status?: 'Active' | 'Pending Approval' | 'Rejected' | 'Pending';
  phoneNumber?: string;
  mustResetPassword?: boolean;
  createdAt: string;
  updatedAt: string;
  lastActive?: string | null;
  profilePicture?: string;
}
