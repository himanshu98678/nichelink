export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar: string;
  community: string;
}

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: '1',
    quote: 'I finally found a community where the conversations are actually relevant to the work I do.',
    author: 'Alex Morgan',
    role: 'SaaS Developer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    community: 'SaaS Developers'
  },
  {
    id: '2',
    quote: 'NicheLink helped me meet designers and developers for my side project within 48 hours of joining.',
    author: 'Sarah Chen',
    role: 'Product Designer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    community: 'UI/UX Designers'
  },
  {
    id: '3',
    quote: 'The niche communities are much more useful to me than a huge generic social network with endless feed noise.',
    author: 'Daniel Reed',
    role: 'Remote Founder',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    community: 'Startup Founders'
  }
];
