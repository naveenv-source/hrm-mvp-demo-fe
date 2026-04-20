"use client";
import { useState } from 'react';
import { apiRequest } from '@/lib/proxy';

export default function AdminPage() {
  const [formData, setFormData] = useState({
    email: '', password: '', role: 'user', credits: 10, phone_number: '', company_name: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: 'Creating...', type: 'info' });
    const params = new URLSearchParams({
      email: formData.email, password: formData.password,
      role: formData.role, credits: formData.credits.toString(),
      ...(formData.phone_number && { phone_number: formData.phone_number }),
      ...(formData.company_name && { company_name: formData.company_name }),
    });
    const res = await apiRequest(`/api/v1/auth/register?${params.toString()}`, { method: 'POST' });
    if (res?.ok) {
      setMessage({ text: 'User created successfully!', type: 'success' });
      setFormData({ email: '', password: '', role: 'user', credits: 10, phone_number: '', company_name: '' });
    } else {
      const err = res ? await res.json() : null;
      setMessage({ text: err?.detail || 'Failed to create user.', type: 'error' });
    }
  };

  const f = (key: string, value: any) => setFormData({ ...formData, [key]: value });

  const inputCls = "w-full px-3.5 py-2.5 border-[1.5px] border-[#C7D2FE] rounded-xl text-sm text-[#1E1B4B] bg-white placeholder-[#818CF8] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
  const labelCls = "block text-[11px] font-medium text-[#3730A3] uppercase tracking-wide mb-1.5";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-xl font-medium text-[#1E1B4B]">User management</h1>
        <p className="text-[#6366F1] text-sm mt-1">Create accounts, assign roles, and allocate credits.</p>
      </div>

      <div className="bg-white border border-[#E0E7FF] rounded-2xl p-6 md:p-8">
        <form onSubmit={handleCreateUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" required className={inputCls} placeholder="user@company.com"
                value={formData.email} onChange={e => f('email', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Password *</label>
              <input type="password" required className={inputCls} placeholder="Min. 8 characters"
                value={formData.password} onChange={e => f('password', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Phone number</label>
              <input type="tel" className={inputCls} placeholder="+91 98765 43210"
                value={formData.phone_number} onChange={e => f('phone_number', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Company name</label>
              <input type="text" className={inputCls} placeholder="Acme Inc."
                value={formData.company_name} onChange={e => f('company_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select className={inputCls} value={formData.role} onChange={e => f('role', e.target.value)}>
                <option value="user">Standard user</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Starting credits</label>
              <input type="number" className={inputCls}
                value={formData.credits} onChange={e => f('credits', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {message.text && (
            <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
              message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE]'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit"
              className="px-8 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors">
              Register user
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}