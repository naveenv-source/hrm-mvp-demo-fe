// app/login/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/proxy';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res || !res.ok) {
        const errorData = res ? await res.json() : null;
        throw new Error(errorData?.detail || 'Invalid email or password');
      }
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('credits', data.credits.toString());
      router.push('/dashboard/candidates');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FF] font-sans">

      {/* Left panel - Restored Original Text with 25% High-Res Layout */}
      <div className="hidden md:flex md:w-[30%] lg:w-[25%] bg-[#1E1B4B] flex-col justify-between p-10">
        <div
          onClick={() => router.push('/')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1.5" fill="white"/>
              <rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="3" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <span className="text-[#E0E7FF] font-medium text-base truncate">Workfolio HRM</span>
        </div>

        <div>
          <h1 className="text-[#E0E7FF] text-2xl font-medium leading-snug mb-3">
            Hire with<br />absolute certainty.
          </h1>
          <p className="text-[#818CF8] text-sm leading-relaxed">
            Analyzes candidates, <br /> uncovers real fit, <br /> and points you to the right ones.
          </p>
        </div>

        <div className="space-y-3">
          {[
            'Auto-generated candidate dossiers',
            'Complete profiles, no manual input',
            'JD-based shortlisting',
            'Every decision, clearly explained',
          ].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-[#A5B4FC] text-sm">{f}</span>
            </div>
          ))}
        </div>

        <div className="text-[#C7D2FE] text-sm">
          Analyze and shortlist candidates today, manage everything soon
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">

        {/* Mobile brand */}
        <div
            onClick={() => router.push('/')}
            className="md:hidden absolute top-6 left-6 flex items-center gap-2 cursor-pointer"
          >
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1.5" fill="white"/>
              <rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="3" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <span className="text-[#1E1B4B] font-medium text-sm">Workfolio HRM</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-[#1E1B4B] text-2xl font-medium mb-1">Welcome back</h2>
          <p className="text-[#4338CA] text-sm mb-7">Sign in to your HRM portal</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-2.5 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[#3730A3] mb-1.5">
                Work email
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="#6366F1" strokeWidth="1.3"/>
                  <path d="M1.5 5.5L8 9.5L14.5 5.5" stroke="#6366F1" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#C7D2FE] rounded-[10px] text-sm text-[#1E1B4B] bg-white placeholder-[#818CF8] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#3730A3] mb-1.5">
                Password
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#6366F1" strokeWidth="1.3"/>
                  <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="#6366F1" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="8" cy="10.5" r="1" fill="#6366F1"/>
                </svg>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#C7D2FE] rounded-[10px] text-sm text-[#1E1B4B] bg-white placeholder-[#818CF8] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-sm font-medium rounded-[10px] transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Contact Support Footer */}
          <div className="mt-10 text-center border-t border-[#E0E7FF] pt-6">
            <p className="text-[12px] text-[#6366F1]">
              Looking for platform access?
            </p>
            <p className="text-[12px] text-[#818CF8] mt-1">
              For demo credentials, reach out to <a href="mailto:talkto@agentsfactory.io" className="text-indigo-600 font-medium hover:underline transition-all">talkto@agentsfactory.io</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}