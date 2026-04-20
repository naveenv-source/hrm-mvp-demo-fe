"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/proxy';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (!token) { router.push('/login'); }
    else { setRole(userRole || 'user'); setAuthorized(true); fetchCredits(); }
  }, [router]);

  const fetchCredits = async () => {
    const cached = localStorage.getItem('credits');
    if (cached) setCredits(parseFloat(cached));
    const res = await apiRequest('/api/v1/users/credits');
    if (res?.ok) {
      const data = await res.json();
      setCredits(data.credits);
      localStorage.setItem('credits', data.credits.toString());
    }
  };

  useEffect(() => { (window as any).__refreshCredits = fetchCredits; }, []);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await apiRequest(`/api/v1/auth/logout?refresh_token=${refreshToken}`, { method: 'POST' });
    }
    localStorage.clear();
    router.push('/login');
  };

  if (!authorized) return (
    <div className="h-screen flex items-center justify-center bg-[#1E1B4B]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-[#A5B4FC] text-sm font-medium">Verifying session...</div>
      </div>
    </div>
  );

  const navItems = [
    {
      href: '/dashboard/candidates', label: 'Candidates',
      icon: (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      href: '/dashboard/jobs', label: 'Jobs',
      icon: (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FF]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-56
        bg-[#1E1B4B] flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Brand */}
        <div className="px-4 py-5 border-b border-white/[0.07] flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1.5" fill="white"/>
              <rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="3" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <span className="text-[#E0E7FF] font-medium text-sm">Workfolio HRM</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          <p className="text-[10px] font-medium text-[#4338CA] uppercase tracking-widest px-3 pb-2">Main</p>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-500 text-white font-medium'
                    : 'text-[#A5B4FC] hover:bg-white/[0.06] hover:text-[#E0E7FF]'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}

          {role === 'admin' && (
            <>
              <p className="text-[10px] font-medium text-[#4338CA] uppercase tracking-widest px-3 pt-4 pb-2">Admin</p>
              <Link
                href="/dashboard/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  pathname.startsWith('/dashboard/admin')
                    ? 'bg-indigo-500 text-white font-medium'
                    : 'text-[#A5B4FC] hover:bg-white/[0.06] hover:text-[#E0E7FF]'
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Admin panel
              </Link>
            </>
          )}
        </nav>

        {/* Credits + Logout */}
        <div className="p-3 border-t border-white/[0.07]">
          <div className="bg-indigo-500/[0.12] border border-indigo-500/25 rounded-xl p-3 mb-2">
            <div className="text-[10px] text-[#6366F1] uppercase tracking-widest mb-1">Credits balance</div>
            <div className="text-[22px] font-medium text-[#A5B4FC] leading-none">
              {credits !== null ? credits.toFixed(1) : '—'}
            </div>
            <div className="text-[10px] text-[#4338CA] mt-1.5">1 cr/parse · 0.5 cr/shortlist</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[#818CF8] hover:bg-red-500/10 hover:text-red-300 rounded-lg transition text-xs font-medium"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M10 8H2M6 5l-3 3 3 3M9 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E0E7FF]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-[#EEF2FF] rounded-lg text-[#4338CA]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1.5" fill="white"/>
              <rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="3" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.3"/>
            </svg>
            </div>
            <span className="text-sm font-medium text-[#1E1B4B]">Workfolio</span>
          </div>
          <div className="text-xs font-medium text-indigo-600 bg-[#EEF2FF] px-2.5 py-1 rounded-full">
            {credits !== null ? `${credits.toFixed(1)} credits` : '—'}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}