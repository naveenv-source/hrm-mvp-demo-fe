"use client";
import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/proxy';

type Candidate = {
  id: number; name: string | null; email: string | null; phone_number: string | null;
  key_role: string | null; experience_years: string | null; skills: string[] | null;
  education: any[] | null; linkedin_url: string | null; github_url: string | null;
  status: string | null; investigation_mode: string | null;
  resume_blob_url: string; parsed_md_url: string | null; dossier_md_url: string | null;
  metadata_json: any;
};
type Job = { id: number; title: string; description: string };

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3.5 bg-[#EEF2FF] rounded-full w-3/4" />
        </td>
      ))}
    </tr>
  );
}

const statusBadge = (status: string | null) => {
  const s = status || 'pending';
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    processing: 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]',
    completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    failed: 'bg-red-50 text-red-800 border-red-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${map[s] || 'bg-[#F0F2FF] text-[#4338CA] border-[#C7D2FE]'} ${s === 'processing' ? 'animate-pulse' : ''}`}>
      {s === 'processing' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />}
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

const inputCls = "w-full px-3.5 py-2.5 border-[1.5px] border-[#C7D2FE] rounded-xl text-sm text-[#1E1B4B] bg-white placeholder-[#818CF8] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const labelCls = "block text-[11px] font-medium text-[#3730A3] uppercase tracking-wide mb-1.5";
const modalOverlay = "fixed inset-0 bg-[#1E1B4B]/60 flex items-center justify-center z-50 p-4";
const modalCard = "bg-white w-full rounded-2xl shadow-2xl border border-[#E0E7FF]";

export default function CandidatePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadModal, setUploadModal] = useState(false);
  const [investigationMode, setInvestigationMode] = useState('normal');
  const [uploadResult, setUploadResult] = useState<{ count: number; files: string[] } | null>(null);
  const [shortlistModal, setShortlistModal] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);
  const [skillModal, setSkillModal] = useState<string[] | null>(null);
  const [metadataModal, setMetadataModal] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasProcessing = candidates.some(c => c.status === 'processing' || c.status === 'pending');

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (!hasProcessing) return;
    const iv = setInterval(() => loadData(), 8000);
    return () => clearInterval(iv);
  }, [hasProcessing]);

  const loadData = async (manualRefresh = false) => {
    if (manualRefresh) setIsRefreshing(true);
    try {
      const [candRes, jobRes, credRes] = await Promise.all([
        apiRequest('/api/v1/candidates/'),
        apiRequest('/api/v1/jobs/'),
        apiRequest('/api/v1/users/credits'),
      ]);
      if (candRes?.ok) setCandidates(await candRes.json());
      if (jobRes?.ok) setJobs(await jobRes.json());
      if (credRes?.ok) { const d = await credRes.json(); setCredits(d.credits); }
    } catch (err: any) { setError('Failed to load: ' + (err.message || 'Unknown')); }
    setLoading(false);
    if (manualRefresh) setIsRefreshing(false);
  };

  const handleDownload = async (candId: number, type: string) => {
    try {
      const res = await apiRequest(`/api/v1/candidates/${candId}/download/${type}`);
      if (res?.ok) { const data = await res.json(); window.open(data.url, '_blank'); }
      else alert(`Failed to download ${type}.`);
    } catch { alert(`Error downloading ${type}.`); }
  };

  const refreshCredits = async () => {
    const res = await apiRequest('/api/v1/users/credits');
    if (res?.ok) {
      const d = await res.json();
      setCredits(d.credits);
      localStorage.setItem('credits', d.credits.toString());
      if ((window as any).__refreshCredits) (window as any).__refreshCredits();
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (credits < files.length) { setError(`Need ${files.length} credits. You have ${credits}.`); return; }
    setUploading(true); setError(''); setSuccess('');
    let uploaded = 0; const fileNames: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const sasRes = await apiRequest(`/api/v1/candidates/upload-sas?filename=${encodeURIComponent(file.name)}`, { method: 'POST' });
        if (!sasRes?.ok) throw new Error('SAS URL failed');
        const sasData = await sasRes.json();
        const upRes = await fetch(sasData.upload_url, { method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type || 'application/octet-stream' }, body: file });
        if (!upRes.ok) throw new Error('Blob upload failed');
        const procRes = await apiRequest(`/api/v1/candidates/${sasData.candidate_id}/process?action=EXTRACT&mode=${investigationMode}`, { method: 'POST' });
        if (!procRes?.ok) throw new Error('Process trigger failed');
        uploaded++; fileNames.push(file.name);
      } catch (err: any) { setError(`Failed: ${file.name} — ${err.message}`); }
    }
    if (uploaded > 0) {
      setUploadResult({ count: uploaded, files: fileNames });
      setUploadModal(false);
      await refreshCredits();
      await loadData();
    }
    setUploading(false);
  };

  const handleShortlist = async () => {
    if (!selectedJob || selectedCandidates.length === 0) return;
    const creditsNeeded = selectedCandidates.length * 0.5;
    if (credits < creditsNeeded) { setError(`Need ${creditsNeeded} credits. You have ${credits}.`); return; }
    const parsed = selectedCandidates.filter(id => {
      const c = candidates.find(x => x.id === id);
      return c?.status === 'completed' && c?.dossier_md_url;
    });
    if (parsed.length !== selectedCandidates.length) { setError('Only fully-parsed candidates can be shortlisted.'); return; }
    setError(''); let queued = 0;
    for (const candId of parsed) {
      try { const res = await apiRequest(`/api/v1/candidates/${candId}/shortlist?job_id=${selectedJob}`, { method: 'POST' }); if (res?.ok) queued++; } catch {}
    }
    if (queued > 0) { setSuccess(`${queued} candidate(s) queued for shortlisting!`); await refreshCredits(); }
    setShortlistModal(false); setSelectedCandidates([]); setSelectedJob(null);
  };

  const toggleCandidate = (id: number) =>
    setSelectedCandidates(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const parsedCandidates = candidates.filter(c => c.status === 'completed');

  const initials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium text-[#1E1B4B]">Candidate pipeline</h1>
          <p className="text-sm text-[#6366F1] mt-1">
            {candidates.length} total · {parsedCandidates.length} parsed ·{' '}
            <span className={`font-medium ${credits < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{credits} credits</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {parsedCandidates.length > 0 && jobs.length > 0 && (
            <button onClick={() => setShortlistModal(true)} disabled={isRefreshing || uploading}
              className="px-4 py-2 bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE] rounded-xl text-sm font-medium hover:bg-[#DDD6FE] transition disabled:opacity-50">
              ⚡ Shortlist
            </button>
          )}
          <button onClick={() => setUploadModal(true)} disabled={isRefreshing || uploading}
            className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition disabled:opacity-50">
            + Upload resumes
          </button>
          <button onClick={() => loadData(true)} disabled={isRefreshing || uploading}
            className="px-4 py-2 bg-white border border-[#C7D2FE] text-[#4338CA] rounded-xl text-sm font-medium hover:bg-[#EEF2FF] transition disabled:opacity-50">
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-3 text-lg leading-none">×</button>
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex justify-between items-center">
          {success}
          <button onClick={() => setSuccess('')} className="text-emerald-500 ml-3 text-lg leading-none">×</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#E0E7FF] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[860px]">
            <thead>
              <tr className="bg-[#F0F2FF] border-b border-[#E0E7FF]">
                {/* Added 'Data' to this list */}
                {['Name', 'Phone', 'Role', 'Exp', 'Skills', 'Links', 'Data', 'Status', 'Files', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] font-medium text-[#4338CA] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2FF]">
              {loading && candidates.length === 0
                ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                : candidates.length === 0
                ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="text-[#C7D2FE] text-4xl mb-3">📄</div>
                      <div className="text-[#6366F1] text-sm font-medium">No candidates yet</div>
                      <div className="text-[#818CF8] text-xs mt-1">Upload resumes to get started</div>
                    </td>
                  </tr>
                )
                : candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8F9FF] transition-colors">
                    <td className="px-4 py-3.5">
                      <button onClick={() => setDetailCandidate(c)} className="flex items-center gap-2.5 text-left group">
                        <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[10px] font-medium text-[#4338CA] flex-shrink-0">
                          {initials(c.name)}
                        </div>
                        <div>
                          <div className="font-medium text-[#1E1B4B] group-hover:text-indigo-600 transition-colors">
                            {c.name || <span className="text-[#818CF8] italic text-xs">Processing...</span>}
                          </div>
                          <div className="text-[11px] text-[#818CF8] truncate max-w-[160px]">{c.email || '—'}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-[#4338CA] text-xs whitespace-nowrap">{c.phone_number || '—'}</td>
                    <td className="px-4 py-3.5 text-[#1E1B4B] text-xs whitespace-nowrap">{c.key_role || '—'}</td>
                    <td className="px-4 py-3.5 text-[#4338CA] text-xs whitespace-nowrap font-medium">{c.experience_years ? `${c.experience_years} yr` : '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[180px] cursor-pointer"
                        onClick={() => c.skills?.length && setSkillModal(c.skills)}>
                        {(c.skills || []).slice(0, 2).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#EEF2FF] text-[#3730A3] rounded text-[10px] font-medium">{s}</span>
                        ))}
                        {(c.skills || []).length > 2 && (
                          <span className="px-2 py-0.5 bg-[#F0F2FF] text-[#6366F1] rounded text-[10px]">+{(c.skills || []).length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener" className="text-[#6366F1] hover:text-[#4338CA] text-[11px] font-medium">LinkedIn</a>}
                        {c.github_url && <a href={c.github_url} target="_blank" rel="noopener" className="text-[#4338CA] hover:text-[#1E1B4B] text-[11px] font-medium">GitHub</a>}
                        {!c.linkedin_url && !c.github_url && <span className="text-[#C7D2FE] text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button 
                        onClick={() => setMetadataModal(c.metadata_json?.profile)} 
                        disabled={!c.metadata_json?.profile} 
                        className="px-2 py-1 bg-[#F0F2FF] text-[#4338CA] border border-[#C7D2FE] rounded text-[10px] font-medium hover:bg-[#EEF2FF] transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {c.metadata_json?.profile ? 'View JSON' : '—'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        {c.resume_blob_url && (
                          <button onClick={() => handleDownload(c.id, 'resume')}
                            className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-medium hover:bg-amber-100 transition"
                            title="Resume PDF">PDF</button>
                        )}
                        {c.parsed_md_url && (
                          <button onClick={() => handleDownload(c.id, 'parsed')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-medium hover:bg-emerald-100 transition"
                            title="Parsed Markdown">MD</button>
                        )}
                        {c.dossier_md_url && (
                          <button onClick={() => handleDownload(c.id, 'dossier')}
                            className="px-2 py-1 bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE] rounded text-[10px] font-medium hover:bg-[#DDD6FE] transition"
                            title="AI Dossier">AI</button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={async () => {
                        if (confirm('Delete this candidate?')) {
                          await apiRequest(`/api/v1/candidates/${c.id}`, { method: 'DELETE' });
                          await loadData();
                        }
                      }} className="text-[11px] text-red-400 hover:text-red-600 font-medium transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {uploadModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-md p-7`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-medium text-[#1E1B4B]">Upload resumes</h2>
                <p className="text-[#818CF8] text-xs mt-1">PDF or DOCX · 1 credit per file</p>
              </div>
              <button onClick={() => setUploadModal(false)} className="text-[#C7D2FE] hover:text-[#6366F1] text-xl leading-none">×</button>
            </div>
            <div className="mb-5">
              <label className={labelCls}>Investigation mode</label>
              <select className={inputCls} value={investigationMode} onChange={e => setInvestigationMode(e.target.value)} disabled={uploading}>
                <option value="normal">Normal — standard web search</option>
                <option value="advanced">Advanced — deep GitHub / LinkedIn analysis</option>
              </select>
            </div>
            <div className="bg-[#EEF2FF] border border-[#C7D2FE] px-4 py-3 rounded-xl text-sm text-[#3730A3] font-medium mb-5">
              Cost: 1 credit per resume
            </div>
            <div className="flex gap-3">
              <button onClick={() => setUploadModal(false)}
                className="flex-1 py-2.5 border border-[#C7D2FE] text-[#4338CA] rounded-xl text-sm font-medium hover:bg-[#EEF2FF] transition">
                Cancel
              </button>
              <label className={`flex-1 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium text-center cursor-pointer hover:bg-indigo-600 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? 'Uploading...' : 'Select files'}
                <input type="file" className="hidden" accept=".pdf,.docx" multiple
                  onChange={e => handleUpload(e.target.files)} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD SUCCESS MODAL */}
      {uploadResult && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-md p-7 text-center`}>
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4.5 4.5L16 6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-lg font-medium text-[#1E1B4B] mb-1">{uploadResult.count} resume{uploadResult.count > 1 ? 's' : ''} uploaded</h2>
            <p className="text-[#818CF8] text-sm mb-4">Processing started. Results appear in a few minutes.</p>
            <div className="bg-[#F0F2FF] rounded-xl p-4 mb-4 text-left max-h-36 overflow-y-auto">
              {uploadResult.files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 py-1 text-sm text-[#4338CA]">
                  <span className="text-emerald-500 text-xs">✓</span> {f}
                </div>
              ))}
            </div>
            <div className="bg-[#EEF2FF] rounded-xl p-3 mb-5 text-xs text-[#4338CA]">
              Status auto-refreshes every 8 seconds — no need to reload.
            </div>
            <button onClick={() => setUploadResult(null)}
              className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAIL MODAL */}
      {detailCandidate && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-2xl max-h-[90vh] flex flex-col`}>
            <div className="px-6 py-5 border-b border-[#E0E7FF] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#EEF2FF] flex items-center justify-center text-sm font-medium text-[#4338CA] flex-shrink-0">
                  {initials(detailCandidate.name)}
                </div>
                <div>
                  <h2 className="text-base font-medium text-[#1E1B4B]">{detailCandidate.name || 'Processing...'}</h2>
                  <p className="text-xs text-[#818CF8]">{detailCandidate.email} · {detailCandidate.phone_number || 'No phone'}</p>
                </div>
              </div>
              <button onClick={() => setDetailCandidate(null)} className="text-[#C7D2FE] hover:text-[#6366F1] text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Role', value: detailCandidate.key_role },
                  { label: 'Experience', value: detailCandidate.experience_years ? `${detailCandidate.experience_years} years` : null },
                  { label: 'Status', value: detailCandidate.status },
                  { label: 'Mode', value: detailCandidate.investigation_mode },
                ].map((item, i) => (
                  <div key={i} className="bg-[#F0F2FF] rounded-xl p-3">
                    <div className="text-[10px] text-[#6366F1] uppercase tracking-wide mb-1">{item.label}</div>
                    <div className="text-sm font-medium text-[#1E1B4B]">{item.value || '—'}</div>
                  </div>
                ))}
              </div>

              {detailCandidate.skills && detailCandidate.skills.length > 0 && (
                <div>
                  <div className="text-[10px] text-[#6366F1] uppercase tracking-wide mb-2">Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detailCandidate.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#EEF2FF] text-[#3730A3] rounded-lg text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {detailCandidate.education && detailCandidate.education.length > 0 && (
                <div>
                  <div className="text-[10px] text-[#6366F1] uppercase tracking-wide mb-2">Education</div>
                  {detailCandidate.education.map((edu: any, i: number) => (
                    <div key={i} className="bg-[#F0F2FF] rounded-xl p-3 mb-2">
                      <div className="font-medium text-sm text-[#1E1B4B]">{edu.Degree || edu.degree || '—'}</div>
                      <div className="text-xs text-[#6366F1] mt-0.5">
                        {edu.Institution || edu.institution || ''} {edu.Graduation_Year ? `· ${edu.Graduation_Year}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {detailCandidate.linkedin_url && (
                  <a href={detailCandidate.linkedin_url} target="_blank" rel="noopener"
                    className="px-4 py-2 bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE] rounded-lg text-sm font-medium hover:bg-[#E0E7FF] transition">
                    LinkedIn ↗
                  </a>
                )}
                {detailCandidate.github_url && (
                  <a href={detailCandidate.github_url} target="_blank" rel="noopener"
                    className="px-4 py-2 bg-[#F0F2FF] text-[#4338CA] border border-[#C7D2FE] rounded-lg text-sm font-medium hover:bg-[#E0E7FF] transition">
                    GitHub ↗
                  </a>
                )}
              </div>

              <div>
                <div className="text-[10px] text-[#6366F1] uppercase tracking-wide mb-3">Documents</div>
                <div className="space-y-2">
                  {[
                    { label: 'Original resume', type: 'resume', url: detailCandidate.resume_blob_url, btnLabel: 'Download PDF', cls: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
                    { label: 'Parsed markdown', type: 'parsed', url: detailCandidate.parsed_md_url, btnLabel: 'Download MD', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
                    { label: 'AI dossier', type: 'dossier', url: detailCandidate.dossier_md_url, btnLabel: 'Download MD', cls: 'bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE] hover:bg-[#DDD6FE]' },
                  ].map(({ label, type, url, btnLabel, cls }) => (
                    <div key={type} className="flex items-center justify-between py-2 border-b border-[#F0F2FF] last:border-0">
                      <span className="text-sm text-[#1E1B4B]">{label}</span>
                      {url
                        ? <button onClick={() => handleDownload(detailCandidate.id, type)}
                            className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition ${cls}`}>{btnLabel}</button>
                        : <span className="text-xs text-[#C7D2FE]">Not available</span>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {detailCandidate.metadata_json?.profile && (
                <details>
                  <summary className="text-[11px] text-[#6366F1] uppercase tracking-wide cursor-pointer hover:text-[#4338CA] transition select-none">
                    Extracted JSON profile ▾
                  </summary>
                  <pre className="mt-2 bg-[#1E1B4B] text-[#A5B4FC] text-xs rounded-xl p-4 overflow-x-auto max-h-56 font-mono">
                    {JSON.stringify(detailCandidate.metadata_json.profile, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHORTLIST MODAL */}
      {shortlistModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-lg max-h-[90vh] flex flex-col`}>
            <div className="px-6 py-5 border-b border-[#E0E7FF]">
              <h2 className="text-lg font-medium text-[#1E1B4B]">Shortlist candidates</h2>
              <p className="text-xs text-[#818CF8] mt-1">Select parsed candidates and a target job.</p>
            </div>
            <div className="px-6 py-5 flex-1 overflow-y-auto space-y-5">
              <div>
                <label className={labelCls}>Target job</label>
                <select className={inputCls} value={selectedJob || ''} onChange={e => setSelectedJob(Number(e.target.value))}>
                  <option value="">Select a job...</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Candidates · {selectedCandidates.length} selected · {(selectedCandidates.length * 0.5).toFixed(1)} cr</label>
                <div className="border border-[#E0E7FF] rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  {parsedCandidates.map(c => (
                    <label key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FF] cursor-pointer border-b border-[#F0F2FF] last:border-0 transition-colors">
                      <input type="checkbox" checked={selectedCandidates.includes(c.id)}
                        onChange={() => toggleCandidate(c.id)}
                        className="w-4 h-4 rounded border-[#C7D2FE] accent-indigo-500" />
                      <div className="w-7 h-7 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[10px] font-medium text-[#4338CA] flex-shrink-0">
                        {initials(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[#1E1B4B] truncate">{c.name || 'Unknown'}</div>
                        <div className="text-xs text-[#818CF8] truncate">{c.key_role || c.email || '—'}</div>
                      </div>
                    </label>
                  ))}
                  {parsedCandidates.length === 0 && (
                    <p className="text-sm text-[#818CF8] p-4 text-center">No parsed candidates available.</p>
                  )}
                </div>
              </div>
              {selectedCandidates.length > 0 && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  credits >= selectedCandidates.length * 0.5
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  Cost: {(selectedCandidates.length * 0.5).toFixed(1)} cr · Balance: {credits.toFixed(1)} cr
                  {credits < selectedCandidates.length * 0.5 && ' · Insufficient credits'}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[#E0E7FF] flex gap-3">
              <button onClick={() => { setShortlistModal(false); setSelectedCandidates([]); setSelectedJob(null); }}
                className="flex-1 py-2.5 border border-[#C7D2FE] text-[#4338CA] rounded-xl text-sm font-medium hover:bg-[#EEF2FF] transition">
                Cancel
              </button>
              <button onClick={handleShortlist}
                disabled={!selectedJob || selectedCandidates.length === 0 || credits < selectedCandidates.length * 0.5}
                className="flex-1 py-2.5 bg-[#5B21B6] text-white rounded-xl text-sm font-medium hover:bg-[#4C1D95] disabled:opacity-40 transition">
                Shortlist {selectedCandidates.length > 0 ? `(${selectedCandidates.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SKILL MODAL */}
      {skillModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-md p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium text-[#1E1B4B]">All skills</h2>
              <button onClick={() => setSkillModal(null)} className="text-[#C7D2FE] hover:text-[#6366F1] text-xl leading-none">×</button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
              {skillModal.map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE] rounded-lg text-sm font-medium">{s}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* METADATA MODAL */}
      {metadataModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-2xl max-h-[90vh] flex flex-col p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium text-[#1E1B4B]">Extracted profile JSON</h2>
              <button onClick={() => setMetadataModal(null)} className="text-[#C7D2FE] hover:text-[#6366F1] text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-auto bg-[#1E1B4B] rounded-xl p-4 relative group">
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(metadataModal, null, 2)); }}
                className="absolute top-3 right-3 px-3 py-1 bg-white/10 hover:bg-white/20 text-[#A5B4FC] rounded text-xs font-medium transition opacity-0 group-hover:opacity-100">
                Copy
              </button>
              <pre className="text-[#A5B4FC] text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(metadataModal, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}