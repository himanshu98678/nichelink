import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Shield, Sparkles, Zap, X, Info, Layers, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const RbacRoleBanner: React.FC = () => {
  const { userRole, setUserRole, setIsCheckoutOpen } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showRoleInfoModal, setShowRoleInfoModal] = useState(false);
  const location = useLocation();

  // Hide RBAC banner on public landing and auth entry pages
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-2xl hover:bg-slate-800 transition-all flex items-center space-x-2 border border-slate-700 cursor-pointer"
      >
        <Shield className="w-4 h-4 text-amber-400" />
        <span>RBAC: {userRole}</span>
      </button>
    );
  }

  const roleColors: Record<UserRole, string> = {
    Guest: 'bg-slate-100 text-slate-800 border-slate-300',
    FreeMember: 'bg-blue-50 text-blue-800 border-blue-200',
    ProMember: 'bg-indigo-600 text-white border-indigo-500 shadow-xs',
    Admin: 'bg-purple-700 text-white border-purple-500 shadow-xs',
  };

  return (
    <>
      <div className="bg-slate-900 text-white border-b border-slate-800 py-2 px-3 sm:px-6 relative z-40 text-xs shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          
          {/* Active Role Info */}
          <div className="flex items-center space-x-2.5">
            <span className="flex items-center text-amber-400 font-extrabold uppercase tracking-widest text-[10px]">
              <Shield className="w-3.5 h-3.5 mr-1" />
              RBAC Live Mode:
            </span>

            {/* Role Selectors */}
            <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
              {(['Guest', 'FreeMember', 'ProMember', 'Admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRole(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    userRole === r ? roleColors[r] : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowRoleInfoModal(true)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md cursor-pointer"
              title="View Role Matrix Specs"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-2">
            {userRole !== 'ProMember' && userRole !== 'Admin' && (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white px-3 py-1 rounded-lg text-[11px] font-extrabold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Open Billing Setup</span>
              </button>
            )}

            <button
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Role Matrix Modal */}
      {showRoleInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-900">Role-Based Access Control (RBAC) Specs</h3>
              </div>
              <button
                onClick={() => setShowRoleInfoModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              <p className="leading-relaxed">
                NicheLink enforces security middleware checking JWT claims and user roles. Switch roles at any time in the banner above to test permissions in real time:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block text-slate-600">Guest</span>
                  <p className="text-xs text-slate-600">Read-only access to public landing page and communities showcase. Cannot post or DM.</p>
                </div>

                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-1.5">
                  <span className="font-bold text-blue-900 text-xs uppercase tracking-wider block">FreeMember</span>
                  <p className="text-xs text-blue-800">Can join public tribes, create standard posts, read discussions, and send standard direct messages.</p>
                </div>

                <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 space-y-1.5">
                  <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider block">ProMember ($19/mo)</span>
                  <p className="text-xs text-indigo-900">Full post CRUD, rich formatting & media attachments, unlimited DMs, Pro-Only Communities, and Project Match posting.</p>
                </div>

                <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200/80 space-y-1.5">
                  <span className="font-bold text-purple-900 text-xs uppercase tracking-wider block">Admin</span>
                  <p className="text-xs text-purple-900">Community creation rights, full platform moderation, post & comment deletion, system analytics access.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowRoleInfoModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
