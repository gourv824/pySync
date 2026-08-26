export interface UserCredentials {
  username: string;
  password?: string;
  temporaryPassword?: string;
  email?: string;
  name?: string;
  role?: string;
  loginLink?: string;
}

export interface CredentialActionResponse {
  success: boolean;
  message: string;
}

