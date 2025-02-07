export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export const login = async (email: string, password: string): Promise<AuthResult> => {
  // TODO: Implement actual auth logic
  return { success: true, userId: 'mock-user-id' };
};

export const signup = async (email: string, password: string): Promise<AuthResult> => {
  // TODO: Implement actual signup logic
  return { success: true, userId: 'new-user-id' };
};

export const validateCredentials = (email: string, password: string): boolean => {
  return email.includes('@') && password.length >= 8;
};
