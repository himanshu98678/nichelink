export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: 'what-is-nichelink',
    question: 'What is NicheLink?',
    answer: 'NicheLink is a specialized professional community platform built for remote workers, engineers, designers, and builders. Unlike traditional, noisy social networks, NicheLink organizes members into focused niche hubs where you can hold high-signal discussions, find co-founders, discover remote jobs, and collaborate on projects.'
  },
  {
    id: 'who-is-nichelink-for',
    question: 'Who is NicheLink for?',
    answer: 'NicheLink is designed for remote professionals—including SaaS developers, AI engineers, UI/UX designers, digital nomads, technical writers, freelancers, and startup founders—who seek meaningful peer networking without generic algorithmic noise.'
  },
  {
    id: 'is-nichelink-free',
    question: 'Is NicheLink free?',
    answer: 'Yes! NicheLink offers a generous Free tier that lets you explore public communities, read in-depth discussions, create a verified professional profile, join open hubs, and discover projects and job opportunities.'
  },
  {
    id: 'what-do-i-get-with-pro',
    question: 'What do I get with Pro?',
    answer: 'Pro ($12/month) unlocks full platform capabilities: create posts and discussion threads, send unlimited 1-on-1 private messages, access exclusive vetted Pro communities, apply directly on Project Match, and get highlighted candidate status on the Remote Job Board.'
  },
  {
    id: 'can-i-message-other-members',
    question: 'Can I message other members?',
    answer: 'Pro members can initiate direct 1-on-1 private messages with any member across their joined communities. Free members can receive and respond to incoming messages.'
  },
  {
    id: 'how-does-project-match-work',
    question: 'How does Project Match work?',
    answer: 'Project Match connects members based on complementary skill sets and shared project goals. Whether you are building a micro-SaaS, open-source tool, or design system, you can post a project listing detailing required skills and target roles to find collaborators.'
  },
  {
    id: 'can-i-join-multiple-communities',
    question: 'Can I join multiple communities?',
    answer: 'Absolutely. You can join as many public communities as match your career skills, stack, or interests (e.g. SaaS Developers, AI Engineers, and Freelancers simultaneously).'
  },
  {
    id: 'can-i-create-my-own-community',
    question: 'Can I create my own community?',
    answer: 'Pro members and team accounts can request or initiate new niche community hubs. Each proposed community undergoes brief moderation to maintain high quality and signal.'
  },
  {
    id: 'can-i-cancel-pro-anytime',
    question: 'Can I cancel Pro anytime?',
    answer: 'Yes, you can upgrade, downgrade, or cancel your Pro membership at any time with a single click from your account settings—no long-term contracts required.'
  }
];
