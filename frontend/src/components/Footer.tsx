import React from 'react';
import { Link } from 'react-router-dom';
import { Network, Github, Twitter, Linkedin, MessageCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Network className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                NicheLink
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Professional communities for remote workers. Connecting SaaS developers, AI engineers, designers, and remote builders beyond the noise.
            </p>
            <div className="flex items-center space-x-3 text-slate-400 pt-2">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" aria-label="X (Twitter)">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" aria-label="Discord">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/communities" className="hover:text-white transition-colors">Communities</Link></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><Link to="/projects" className="hover:text-white transition-colors">Project Match</Link></li>
              <li><a href="#features" className="hover:text-white transition-colors">Jobs</a></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Resources & Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#faq" className="hover:text-white transition-colors">Help Center / FAQ</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Community Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 text-center text-xs text-slate-500">
          <p>© 2026 NicheLink. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
