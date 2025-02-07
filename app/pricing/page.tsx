'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import type { CreditPackage } from '@/app/types/user';

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 9.99,
    description: 'Perfect for occasional use',
  },
  {
    id: 'pro',
    name: 'Professional',
    credits: 500,
    price: 39.99,
    isPopular: true,
    description: 'Best value for regular users',
  },
  {
    id: 'business',
    name: 'Business',
    credits: 2000,
    price: 149.99,
    description: 'For high-volume needs',
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    if (!session) {
      // Redirect to login
      return;
    }

    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        throw new Error('Purchase failed');
      }

      // Handle successful purchase
      // You might want to redirect to a success page or show a notification
    } catch (error) {
      console.error('Purchase error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Choose Your Credit Package</h1>
          <p className="text-xl text-gray-600">
            Purchase credits to use AI features and export your cards
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`
                relative bg-white rounded-lg shadow-lg p-8
                ${pkg.isPopular ? 'ring-2 ring-indigo-600' : ''}
              `}
            >
              {pkg.isPopular && (
                <div className="absolute top-0 right-0 -translate-y-1/2">
                  <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold">{pkg.name}</h3>
                <div className="mt-4 text-4xl font-bold">
                  ${pkg.price}
                </div>
                <div className="mt-2 text-gray-500">
                  {pkg.credits} Credits
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="ml-3">AI Message Generation</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="ml-3">Export to CSV</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="ml-3">Save Unlimited Drafts</span>
                </li>
              </ul>

              <Button
                onClick={() => handlePurchase(pkg.id)}
                className="mt-8 w-full"
                variant={pkg.isPopular ? 'default' : 'outline'}
              >
                Purchase Credits
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
