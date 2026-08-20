import { Community } from '../types';

export type { Community };

export const COMMUNITIES_DATA: Community[] = [
  {
    id: 'saas-developers',
    name: 'SaaS Developers',
    members: '8.2K Members',
    memberCount: '8.2K Members',
    description: 'Connecting founders, full-stack engineers, and cloud architects building modern SaaS products.',
    category: 'Engineering',
    iconName: 'Code2',
    activeNowCount: '142 Online Now',
    featured: true,
    tags: ['Micro-SaaS', 'TypeScript', 'Stripe', 'Cloud'],
    recentTopic: 'Best practices for multi-tenant database isolation in 2026',
    featuredProject: 'Open Source Multi-Tenant Toolkit',
    activityLevel: 'Very Active',
    isJoined: true,
    isProOnly: false,
    rules: [
      'Maintain constructive technical discussions.',
      'No unsolicited commercial cold-DM spam.',
      'Share code snippets with syntax highlighting.'
    ]
  },
  {
    id: 'ai-engineers',
    name: 'AI Engineers',
    members: '12.4K Members',
    memberCount: '12.4K Members',
    description: 'LLMs, prompt engineering, fine-tuning, and machine learning infrastructure practitioners.',
    category: 'AI & Data',
    iconName: 'Cpu',
    activeNowCount: '318 Online Now',
    featured: true,
    tags: ['PyTorch', 'LLMs', 'RAG', 'Vector DBs'],
    recentTopic: 'Evaluating local vs hosted model inference latency',
    featuredProject: 'Local Multimodal Voice Agent',
    activityLevel: 'Extremely Active',
    isJoined: true,
    isProOnly: true,
    rules: [
      'Focus on technical AI architecture and benchmark data.',
      'Disclose training datasets and model specs when sharing benchmarks.',
      'Respect API quota and rate limiting best practices.'
    ]
  },
  {
    id: 'ui-ux-designers',
    name: 'UI/UX Designers',
    members: '6.8K Members',
    memberCount: '6.8K Members',
    description: 'Product designers, design system leads, and UX researchers sharing crafts & teardowns.',
    category: 'Design',
    iconName: 'Palette',
    activeNowCount: '95 Online Now',
    featured: true,
    tags: ['Figma', 'Design Systems', 'UX Research', 'Micro-interactions'],
    recentTopic: 'Figma variables workflow for complex multi-brand themes',
    featuredProject: 'Neumorphic SaaS UI Kit',
    activityLevel: 'Active',
    isJoined: false,
    isProOnly: false,
    rules: [
      'Include high-resolution previews or Figma links when sharing teardowns.',
      'Provide constructive design feedback using standard UX frameworks.',
      'Credit original visual creators.'
    ]
  },
  {
    id: 'digital-nomads',
    name: 'Digital Nomads',
    members: '9.1K Members',
    memberCount: '9.1K Members',
    description: 'Remote professionals navigating location independence, tax strategies, and co-living hubs.',
    category: 'Lifestyle',
    iconName: 'Globe',
    activeNowCount: '180 Online Now',
    featured: true,
    tags: ['Remote Work', 'Coliving', 'Tax Expat', 'Travel'],
    recentTopic: 'Top 5 European tech hubs for 2026 autumn digital nomads',
    featuredProject: 'Global Async Nomads Directory',
    activityLevel: 'Active',
    isJoined: false,
    isProOnly: false,
    rules: [
      'Verify visa and tax information with qualified professionals.',
      'Share honest internet speed tests and workspace reviews.',
      'Respect local communities and remote culture.'
    ]
  },
  {
    id: 'technical-writers',
    name: 'Technical Writers',
    members: '4.7K Members',
    memberCount: '4.7K Members',
    description: 'API docs specialists, developer advocates, and technical bloggers honing clear documentation.',
    category: 'Content & Docs',
    iconName: 'BookOpen',
    activeNowCount: '64 Online Now',
    featured: true,
    tags: ['Docs-as-Code', 'OpenAPI', 'Developer Relations', 'Markdown'],
    recentTopic: 'Automating SDK documentation pipelines with GitHub Actions',
    featuredProject: 'Interactive Swagger API Generator',
    activityLevel: 'Active',
    isJoined: false,
    isProOnly: false,
    rules: [
      'Focus on clarity, accuracy, and developer usability.',
      'Use standard Markdown and Docs-as-Code guidelines.',
      'Peer review documentation drafts graciously.'
    ]
  },
  {
    id: 'freelancers',
    name: 'Freelancers',
    members: '11.2K Members',
    memberCount: '11.2K Members',
    description: 'Independent contractors, agency owners, and consultants sharing rates, clients, and contracts.',
    category: 'Business',
    iconName: 'Briefcase',
    activeNowCount: '210 Online Now',
    featured: true,
    tags: ['Client Work', 'Value Pricing', 'Contracts', 'Growth'],
    recentTopic: 'How to transition from hourly billing to value-based project retainers',
    featuredProject: 'Value-Based Client Retainer Template',
    activityLevel: 'Very Active',
    isJoined: false,
    isProOnly: false,
    rules: [
      'Keep rate and contract discussions transparent and respectful.',
      'No client bashing; redact sensitive client details.',
      'Share actionable pricing playbooks.'
    ]
  },
  {
    id: 'startup-founders',
    name: 'Startup Founders',
    members: '14.1K Members',
    memberCount: '14.1K Members',
    description: 'Early-stage bootstrappers and VC-backed founders sharing pitch decks, hiring, and growth tactics.',
    category: 'Business',
    iconName: 'Rocket',
    activeNowCount: '275 Online Now',
    featured: false,
    tags: ['Bootstrapping', 'Fundraising', 'Growth', 'Hiring'],
    recentTopic: 'Navigating seed round term sheets in today’s remote investment landscape',
    featuredProject: 'Micro-SaaS Pitch Deck Vault',
    activityLevel: 'Very Active',
    isJoined: false,
    isProOnly: true,
    rules: [
      'Maintain strict confidentiality for unreleased product decks.',
      'Provide candid, peer-reviewed pitch feedback.',
      'Focus on sustainable unit economics.'
    ]
  },
  {
    id: 'remote-workers',
    name: 'Remote Workers',
    members: '18.5K Members',
    memberCount: '18.5K Members',
    description: 'Async productivity enthusiasts, remote managers, and distributed team champions.',
    category: 'Lifestyle',
    iconName: 'Shield',
    activeNowCount: '410 Online Now',
    featured: false,
    tags: ['Async Work', 'Home Office', 'Burnout Prevention', 'Tools'],
    recentTopic: 'Establishing effective asynchronous communication standards across 4 time zones',
    featuredProject: 'Asynchronous Work OS Playbook',
    activityLevel: 'Extremely Active',
    isJoined: false,
    isProOnly: false,
    rules: [
      'Promote healthy work-life integration and mental wellbeing.',
      'Share practical async tooling setups.',
      'Support remote team leaders and individual contributors.'
    ]
  }
];

