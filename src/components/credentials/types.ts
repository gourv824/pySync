export interface UserCredentials {
  username: string;
  password?: string;
  temporaryPassword?: string;
}

export interface CredentialActionResponse {
  success: boolean;
  message: string;
}
