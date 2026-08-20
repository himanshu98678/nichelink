export interface SubscriptionPlan {
  code: 'FREE' | 'PRO';
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    code: 'FREE',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'forever',
    features: [
      'Explore public communities',
      'Read discussions',
      'Basic profile',
      'Discover opportunities',
    ],
  },
  {
    code: 'PRO',
    name: 'Pro',
    price: 19,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Free',
      'Unlimited messaging',
      'Exclusive Pro communities',
      'Project Match posting',
      'Advanced networking',
    ],
  },
];
