export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'employee' | 'team leader';
  passwordHash: string;
  mustResetPassword?: boolean;
  createdAt: string;
  updatedAt: string;
  lastActive?: string | null;
  profilePicture?: string;
}
