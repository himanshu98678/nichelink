export interface Project {
  id: string;
  title: string;
  skills: string[];
  lookingFor: string;
  description: string;
  creator: {
    name: string;
    role: string;
    avatar: string;
  };
  timeAgo: string;
}

export const PROJECTS_DATA: Project[] = [
  {
    id: 'saas-analytics-platform',
    title: 'Build a SaaS Analytics Platform',
    skills: ['React', 'Node.js', 'MongoDB'],
    lookingFor: 'Frontend Developer',
    description: 'An open-source real-time analytics dashboard built specifically for independent micro-SaaS builders and indie hackers.',
    creator: {
      name: 'Marcus Vance',
      role: 'Full-Stack Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    },
    timeAgo: 'Posted 2 hours ago'
  },
  {
    id: 'ui-ux-designer-docs',
    title: 'Looking for UI/UX Designer',
    skills: ['Figma', 'UX Research', 'Design Systems'],
    lookingFor: 'UI/UX Designer',
    description: 'Designing an AI-powered developer documentation hub with dark mode, component previews, and accessibility-first layouts.',
    creator: {
      name: 'Elena Rostova',
      role: 'Product Architect',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150'
    },
    timeAgo: 'Posted 5 hours ago'
  },
  {
    id: 'ai-code-reviewer',
    title: 'AI Code Reviewer Chrome Extension',
    skills: ['TypeScript', 'Gemini API', 'Tailwind'],
    lookingFor: 'Backend & AI Engineer',
    description: 'A browser extension that automatically provides inline architectural critiques and security audits on GitHub Pull Requests.',
    creator: {
      name: 'David Kim',
      role: 'AI Researcher',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
    },
    timeAgo: 'Posted 1 day ago'
  }
];
