import { UserProfile, Post, Community, Job, Project, ChatMessage } from '../types';
import { COMMUNITIES_DATA } from './communities';

export const currentUserProfile: UserProfile = {
  id: 'usr_1',
  name: 'Alex Rivera',
  username: '@alexrivera',
  userRole: 'ProMember',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'Senior Full Stack & AI Architect',
  company: 'Aether Cloud Solutions',
  location: 'San Francisco, CA (Remote)',
  bio: 'Building high-performance distributed systems & fine-tuned LLM interfaces. Passionate about open source, clean architecture, and empowering niche builder communities.',
  skills: ['TypeScript', 'React', 'Node.js', 'Python', 'PyTorch', 'GraphQL', 'TailwindCSS', 'System Design'],
  experience: [
    {
      role: 'Lead Staff Engineer',
      company: 'Aether Cloud Solutions',
      period: '2023 - Present',
    },
    {
      role: 'Senior Software Architect',
      company: 'Niche Tech Labs',
      period: '2021 - 2023',
    },
  ],
  education: [
    {
      degree: 'B.S. Computer Science & AI',
      school: 'Stanford University',
      year: '2017 - 2021',
    },
  ],
  portfolio: ['https://github.com/alexrivera-dev', 'https://alexrivera.io'],
  socialLinks: {
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
    website: 'https://alexrivera.io',
  },
  projectsCount: 14,
  connectionsCount: 842,
};

export const samplePosts: Post[] = [
  {
    id: 'post_1',
    author: {
      name: 'Sarah Chen',
      username: '@sarahchen_ai',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      role: 'AI Research Scientist @ DeepMind Hub',
    },
    timeAgo: '2 hours ago',
    content: 'Just deployed our new multi-modal search pipeline using vector embeddings and hybrid RAG! The context retrieval latency dropped from 450ms to 85ms. Check out the open project in the AI & Machine Learning community if you want to collaborate! 🚀✨',
    tags: ['AI', 'VectorDB', 'Python', 'MachineLearning'],
    likes: 128,
    comments: 24,
    shares: 15,
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'post_2',
    author: {
      name: 'Marcus Vance',
      username: '@marcus_ux',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Principal Product Designer',
    },
    timeAgo: '5 hours ago',
    content: 'When designing for complex SaaS workflows, micro-interactions and dark/light contrast rules make all the difference. Shared a detailed Figma component kit inside the Designers Community. Free to duplicate for NicheLink members!',
    tags: ['UIUX', 'Figma', 'ProductDesign', 'DesignSystems'],
    likes: 94,
    comments: 18,
    shares: 9,
    isLiked: true,
    isSaved: true,
  },
];

export const sampleCommunities: Community[] = COMMUNITIES_DATA;

export const sampleJobs: Job[] = [
  {
    id: 'job_1',
    title: 'Senior AI Frontend Engineer',
    company: 'NeuralFlow Labs',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    salary: '$140k - $180k + Equity',
    skills: ['React', 'TypeScript', 'TailwindCSS', 'WebSockets', 'Canvas API'],
    postedAgo: '1 day ago',
    applicantsCount: 'Actively Hiring',
  },
  {
    id: 'job_2',
    title: 'Lead Product Designer',
    company: 'Nexus Craft',
    logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&auto=format&fit=crop&q=80',
    location: 'San Francisco / Hybrid',
    type: 'Full-time',
    salary: '$150k - $190k',
    skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
    postedAgo: '3 hours ago',
    applicantsCount: 'Recently Posted',
  },
  {
    id: 'job_3',
    title: 'Backend Rust & Distributed Systems Engineer',
    company: 'Aether Protocol',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    location: 'Remote Worldwide',
    type: 'Contract / Full-time',
    salary: '$160k - $210k',
    skills: ['Rust', 'gRPC', 'Kubernetes', 'PostgreSQL', 'Distributed Systems'],
    postedAgo: 'Just now',
    applicantsCount: 'High Demand',
  },
];

export const sampleProjects: Project[] = [
  {
    id: 'proj_1',
    title: 'Open Source AI Code Review Assistant',
    description: 'Building an automated GitHub action tool that provides contextual code review and performance suggestions using open-source LLMs.',
    category: 'Developer Tooling',
    lead: {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    members: [
      { name: 'Alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { name: 'David', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { name: 'Priya', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    ],
    skills: ['Python', 'FastAPI', 'LangChain', 'React', 'Docker'],
    progress: 68,
    spotsOpen: 2,
    isJoined: false,
  },
  {
    id: 'proj_2',
    title: 'Zero-Knowledge Privacy Identity Protocol',
    description: 'Decentralized identity verification system giving professionals 100% control over verifiable credentials without revealing sensitive data.',
    category: 'Security & Web3',
    lead: {
      name: 'Dr. Aris Thorne',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    members: [
      { name: 'Elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
    ],
    skills: ['Rust', 'ZK-Snarks', 'Cryptography', 'TypeScript'],
    progress: 82,
    spotsOpen: 1,
    isJoined: true,
  },
];

export const sampleChatMessages: ChatMessage[] = [
  {
    id: 'msg_1',
    sender: 'professional',
    senderName: 'David Kim (Staff AI Architect)',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    text: 'Hey Alex! Loved your post on RAG optimization. We are building a high-throughput retrieval service for our startup and would love your input!',
    timestamp: '10:42 AM',
  },
  {
    id: 'msg_2',
    sender: 'you',
    senderName: 'You',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'Thanks David! Absolutely, I can share our benchmark scripts. Are you using Qdrant or Pgvector for your storage layer?',
    timestamp: '10:45 AM',
  },
  {
    id: 'msg_3',
    sender: 'community',
    senderName: 'AI & Machine Learning Hub',
    senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    text: '📢 Live Workshop starting in 15 mins: "Building Production Agents with Function Calling & Tool Specs". 42 members joined!',
    timestamp: '11:00 AM',
  },
];
