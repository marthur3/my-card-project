export interface User {
  id: string;
  email: string;
  name?: string;
  credits: number;
  tier: 'free' | 'premium';
  createdAt: Date;
  lastLoginAt: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'usage' | 'bonus';
  description: string;
  createdAt: Date;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  isPopular?: boolean;
  description: string;
}
