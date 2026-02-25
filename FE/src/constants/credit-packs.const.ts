import type { CreditPack } from '@/types/credit.type'

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 50000, // 50,000 VND
    priceUSD: 2,
    features: [
      '10 AI generations',
      'Basic quality mode',
      'Email support',
      '30-day validity'
    ]
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 50,
    price: 200000, // 200,000 VND (20% discount)
    priceUSD: 8,
    popular: true,
    badge: 'Best Value',
    features: [
      '50 AI generations',
      'All quality modes',
      'Priority support',
      '60-day validity',
      'Save 20%'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 100,
    price: 350000, // 350,000 VND (30% discount)
    priceUSD: 14,
    features: [
      '100 AI generations',
      'All quality modes',
      'Priority support',
      '90-day validity',
      'Save 30%'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 500,
    price: 1500000, // 1,500,000 VND (40% discount)
    priceUSD: 60,
    badge: 'Premium',
    features: [
      '500 AI generations',
      'All quality modes',
      '24/7 Priority support',
      'No expiration',
      'Save 40%',
      'Dedicated account manager'
    ]
  }
]

