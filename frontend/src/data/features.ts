export interface Feature {
  id: string;
  name: string;
  description: string;
  iconName: string;
  linkText: string;
  badge?: string;
}

export const FEATURES_DATA: Feature[] = [
  {
    id: 'community-hubs',
    name: 'Community Hubs',
    description: 'Topic-focused spaces for targeted discussions without social noise and generic algorithms.',
    iconName: 'Users',
    linkText: 'Learn More →'
  },
  {
    id: 'discussion-boards',
    name: 'Discussion Boards',
    description: 'Asynchronous, deep-dive threads structured for real knowledge exchange and peer feedback.',
    iconName: 'MessageSquare',
    linkText: 'Learn More →'
  },
  {
    id: 'private-messaging',
    name: 'Private Messaging',
    description: 'Direct 1-on-1 encrypted messaging to build genuine professional relationships and network.',
    iconName: 'Send',
    linkText: 'Learn More →'
  },
  {
    id: 'project-match',
    name: 'Project Match',
    description: 'Turn ideas into real projects by finding professionals with complementary skill sets.',
    iconName: 'Layers',
    linkText: 'Learn More →',
    badge: 'Popular'
  },
  {
    id: 'remote-job-board',
    name: 'Remote Job Board',
    description: 'Curated high-signal remote job listings posted directly by hiring managers and founders.',
    iconName: 'Briefcase',
    linkText: 'Learn More →'
  },
  {
    id: 'pro-communities',
    name: 'Pro Communities',
    description: 'Exclusive vetted hubs for senior leads, verified founders, and specialized practitioners.',
    iconName: 'ShieldCheck',
    linkText: 'Learn More →',
    badge: 'Pro'
  }
];
