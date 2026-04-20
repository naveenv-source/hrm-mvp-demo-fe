"use client";
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/proxy';

type Job = { id: number; title: string; description: string; requirements_json: any; created_at: string; has_evaluations?: boolean };
type Eval = { id: number; job_id: number; candidate_id: number; status: string | null; candidate_name: string | null; candidate_email: string | null; job_title: string | null; resume_snapshot_url: string | null; dossier_snapshot_url: string | null; selection_status: string; fit_score: number | null; reasoning_json: any; detailed_scoring_json: any; created_at: string };
type Cand = { id: number; name: string | null; email: string | null; key_role: string | null; status: string | null; dossier_md_url: string | null };

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E0E7FF] rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-[#EEF2FF] rounded-full w-2/3 mb-3" />
      <div className="h-3 bg-[#F0F2FF] rounded-full w-full mb-2" />
      <div className="h-3 bg-[#F0F2FF] rounded-full w-1/2" />
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 border-[1.5px] border-[#C7D2FE] rounded-xl text-sm text-[#1E1B4B] bg-white placeholder-[#818CF8] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const labelCls = "block text-[11px] font-medium text-[#3730A3] uppercase tracking-wide mb-1.5";
const modalOverlay = "fixed inset-0 bg-[#1E1B4B]/60 flex items-center justify-center z-50 p-4";
const modalCard = "bg-white w-full rounded-2xl shadow-2xl border border-[#E0E7FF]";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Cand[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [viewJobId, setViewJobId] = useState<number | null>(null);
  const [evals, setEvals] = useState<Eval[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [detailEval, setDetailEval] = useState<Eval | null>(null);
  const [uploadJobId, setUploadJobId] = useState<number | null>(null);
  const [shortlistJobId, setShortlistJobId] = useState<number | null>(null);
  const [selCands, setSelCands] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadResult, setUploadResult] = useState<{ count: number; files: string[] } | null>(null);
  const [investigationMode, setInvestigationMode] = useState('normal');
  const [maxCandidates, setMaxCandidates] = useState(50);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!viewJobId || !evals.some(e => e.status === 'pending' || e.status === 'processing')) return;
    const iv = setInterval(() => loadEvals(viewJobId), 8000);
    return () => clearInterval(iv);
  }, [viewJobId, evals]);

  const loadData = async (manualRefresh = false) => {
    if (manualRefresh) setIsRefreshing(true);
    setLoading(true);
    try {
      const [jR, cR, crR] = await Promise.all([
        apiRequest('/api/v1/jobs/'),
        apiRequest('/api/v1/candidates/'),
        apiRequest('/api/v1/users/credits'),
      ]);
      if (jR?.ok) setJobs(await jR.json());
      if (cR?.ok) setCandidates(await cR.json());
      if (crR?.ok) { const d = await crR.json(); setCredits(d.credits); }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
    if (manualRefresh) setIsRefreshing(false);
  };

  const refreshCredits = async () => {
    const r = await apiRequest('/api/v1/users/credits');
    if (r?.ok) { const d = await r.json(); setCredits(d.credits); if ((window as any).__refreshCredits) (window as any).__refreshCredits(); }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    const r = await apiRequest('/api/v1/jobs/', { method: 'POST', body: JSON.stringify({ title: newTitle, description: newDesc }) });
    if (r?.ok) { setSuccess('Job created!'); setCreateModal(false); setNewTitle(''); setNewDesc(''); await loadData(); }
    else { const e = r ? await r.json() : null; setError(e?.detail || 'Failed to create job.'); }
  };

  const loadEvals = async (jobId: number) => {
    setEvalLoading(true); setViewJobId(jobId);
    const r = await apiRequest(`/api/v1/jobs/${jobId}/evaluations`);
    if (r?.ok) setEvals(await r.json());
    setEvalLoading(false);
  };

  const handleUploadAndShortlist = async (files: FileList | null, jobId: number) => {
    if (!files?.length) return;
    const cost = files.length * 1.5;
    if (credits < cost) { setError(`Need ${cost} credits (1.5/file). Have ${credits}.`); return; }
    setUploading(true); setError(''); let done = 0; const names: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const sR = await apiRequest(`/api/v1/candidates/upload-sas?filename=${encodeURIComponent(f.name)}`, { method: 'POST' });
        if (!sR?.ok) throw new Error('SAS failed');
        const sd = await sR.json();
        const uR = await fetch(sd.upload_url, { method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': f.type || 'application/octet-stream' }, body: f });
        if (!uR.ok) throw new Error('Upload failed');
        const pR = await apiRequest(`/api/v1/candidates/${sd.candidate_id}/process?action=FULL_PIPELINE&job_id=${jobId}&mode=${investigationMode}&max_candidates=${maxCandidates}`, { method: 'POST' });
        if (!pR?.ok) throw new Error('Trigger failed');
        done++; names.push(f.name);
      } catch (e: any) { setError(`${f.name}: ${e.message}`); }
    }
    if (done > 0) { setUploadResult({ count: done, files: names }); await refreshCredits(); await loadData(); }
    setUploading(false); setUploadJobId(null);
  };

  const handleShortlistExisting = async (jobId: number) => {
    const cost = selCands.length * 0.5;
    if (credits < cost) { setError(`Need ${cost} credits. Have ${credits}.`); return; }
    const parsed = selCands.filter(id => { const c = candidates.find(x => x.id === id); return c?.status === 'completed' && c?.dossier_md_url; });
    if (parsed.length !== selCands.length) { setError('Only parsed candidates can be shortlisted.'); return; }
    let q = 0;
    for (const cid of parsed) {
      const r = await apiRequest(`/api/v1/candidates/${cid}/shortlist?job_id=${jobId}&max_candidates=${maxCandidates}`, { method: 'POST' });
      if (r?.ok) q++;
    }
    if (q > 0) { setSuccess(`${q} queued!`); await refreshCredits(); }
    setShortlistJobId(null); setSelCands([]);
  };

  const selBadgeCls = (s: string) =>
    s.includes('Shortlisted') || s === 'Selected' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
    s.includes('Rejected') ? 'bg-red-50 text-red-800 border-red-200' :
    s.includes('Processing') || s === 'Pending' ? 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]' :
    'bg-[#F0F2FF] text-[#4338CA] border-[#C7D2FE]';

  const initials = (name: string | null) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
  const parsedCands = candidates;

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium text-[#1E1B4B]">Job management</h1>
          <p className="text-sm text-[#6366F1] mt-1">
            {jobs.length} jobs · <span className={`font-medium ${credits < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{credits} credits</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreateModal(true)} disabled={isRefreshing || uploading}
            className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition disabled:opacity-50">
            + Create job
          </button>
          <button onClick={() => loadData(true)} disabled={isRefreshing || uploading}
            className="px-4 py-2 bg-white border border-[#C7D2FE] text-[#4338CA] rounded-xl text-sm font-medium hover:bg-[#EEF2FF] transition disabled:opacity-50">
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex justify-between">{error}<button onClick={() => setError('')} className="text-red-400 ml-3 text-lg leading-none">×</button></div>}
      {success && <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex justify-between">{success}<button onClick={() => setSuccess('')} className="ml-3 text-lg leading-none">×</button></div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white border border-[#E0E7FF] rounded-2xl p-20 text-center">
          <div className="text-[#C7D2FE] text-4xl mb-3">💼</div>
          <div className="text-[#6366F1] text-sm font-medium">No jobs yet</div>
          <div className="text-[#818CF8] text-xs mt-1">Create your first job posting to get started</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {jobs.map(job => (
            <div key={job.id} className="bg-white border border-[#E0E7FF] rounded-2xl p-5 hover:border-[#A5B4FC] transition-colors">
              <h3 className="text-sm font-medium text-[#1E1B4B] mb-2">{job.title}</h3>
              <p className="text-[#818CF8] text-xs leading-relaxed mb-4 line-clamp-3">{job.description}</p>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-[#F0F2FF]">
                <button onClick={() => loadEvals(job.id)} disabled={isRefreshing || uploading}
                  className="px-3 py-1.5 text-xs font-medium text-[#3730A3] bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg hover:bg-[#E0E7FF] disabled:opacity-50 transition">
                  Results
                </button>
                <button onClick={() => setShortlistJobId(job.id)}
                  disabled={isRefreshing || uploading || job.has_evaluations}
                  className="px-3 py-1.5 text-xs font-medium text-[#5B21B6] bg-[#EDE9FE] border border-[#DDD6FE] rounded-lg hover:bg-[#DDD6FE] disabled:opacity-50 disabled:bg-[#F0F2FF] disabled:text-[#C7D2FE] disabled:border-[#E0E7FF] transition">
                  ⚡ Shortlist
                </button>
                <button onClick={() => setUploadJobId(job.id)}
                  disabled={isRefreshing || uploading || job.has_evaluations}
                  className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 disabled:bg-[#F0F2FF] disabled:text-[#C7D2FE] disabled:border-[#E0E7FF] transition">
                  Upload + shortlist
                </button>
                <button onClick={async () => { if (confirm('Delete this job?')) { await apiRequest(`/api/v1/jobs/${job.id}`, { method: 'DELETE' }); await loadData(); }}}
                  disabled={isRefreshing || uploading}
                  className="px-3 py-1.5 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 ml-auto disabled:opacity-50 transition">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EVALUATIONS MODAL */}
      {viewJobId && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-5xl max-h-[90vh] flex flex-col`}>
            <div className="px-6 py-5 border-b border-[#E0E7FF] flex justify-between items-start">
              <div>
                <h2 className="text-base font-medium text-[#1E1B4B]">Shortlist results</h2>
                <p className="text-xs text-[#818CF8] mt-0.5">{jobs.find(j => j.id === viewJobId)?.title}</p>
              </div>
              <button onClick={() => { setViewJobId(null); setEvals([]); }} className="text-[#C7D2FE] hover:text-[#6366F1] text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {evalLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : evals.length === 0 ? (
                <p className="text-center text-[#818CF8] text-sm py-10">No evaluations yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[640px]">
                    <thead>
                      <tr className="bg-[#F0F2FF] border-b border-[#E0E7FF]">
                        {['Candidate', 'Score', 'Verdict', 'Status', 'Action'].map(h => (
                          <th key={h} className="px-4 py-3 text-[11px] font-medium text-[#4338CA] uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2FF]">
                      {evals.map(ev => (
                        <tr key={ev.id} className="hover:bg-[#F8F9FF] transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[10px] font-medium text-[#4338CA]">
                                {initials(ev.candidate_name)}
                              </div>
                              <div>
                                <div className="font-medium text-[#1E1B4B] text-sm">{ev.candidate_name || `#${ev.candidate_id}`}</div>
                                <div className="text-[11px] text-[#818CF8]">{ev.candidate_email || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-lg font-medium text-[#6366F1]">{ev.fit_score ?? '—'}</span>
                            <span className="text-xs text-[#818CF8]">/100</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium border ${selBadgeCls(ev.selection_status)}`}>
                              {ev.selection_status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {ev.status === 'processing' || ev.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-[#6366F1] animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                                Processing
                              </span>
                            ) : (
                              <span className="text-xs text-[#818CF8]">{ev.status}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <button onClick={() => setDetailEval(ev)} className="text-[#6366F1] text-xs font-medium hover:text-[#4338CA] transition">
                              Details →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EVAL DETAIL MODAL */}
      {detailEval && (
        <div className="fixed inset-0 bg-[#1E1B4B]/60 flex items-center justify-center z-[60] p-4">
          <div className={`${modalCard} max-w-2xl max-h-[90vh] flex flex-col`}>
            <div className="px-6 py-5 border-b border-[#E0E7FF] flex justify-between items-start">
              <div>
                <h2 className="text-base font-medium text-[#1E1B4B]">{detailEval.candidate_name || 'Candidate'}</h2>
                <p className="text-xs text-[#818CF8] mt-0.5">{detailEval.candidate_email}</p>
              </div>
              <button onClick={() => setDetailEval(null)} className="text-[#C7D2FE] hover:text-[#6366F1] text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 text-center">
                  <div className="text-3xl font-medium text-[#6366F1]">{detailEval.fit_score ?? '—'}</div>
                  <div className="text-xs text-[#818CF8] mt-1">Fit score / 100</div>
                </div>
                <div className={`rounded-xl p-4 text-center border ${selBadgeCls(detailEval.selection_status)}`}>
                  <div className="text-base font-medium">{detailEval.selection_status}</div>
                  <div className="text-xs mt-1 opacity-70">Verdict</div>
                </div>
              </div>

              {detailEval.reasoning_json && (
                <div>
                  <div className="text-[10px] text-[#6366F1] uppercase tracking-wide mb-3">AI reasoning</div>
                  {detailEval.reasoning_json.score_reasoning &&
                    Object.entries(detailEval.reasoning_json.score_reasoning).map(([k, v]) => (
                      <div key={k} className="bg-[#F0F2FF] border border-[#E0E7FF] rounded-xl p-3 mb-2">
                        <div className="text-[10px] font-medium text-[#6366F1] uppercase tracking-wide">{k.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-[#1E1B4B] mt-1">{String(v)}</div>
                      </div>
                    ))
                  }
                  {detailEval.reasoning_json.verdict_why && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                      {detailEval.reasoning_json.verdict_why}
                    </div>
                  )}
                </div>
              )}

              {detailEval.detailed_scoring_json?.phase2 && (
                <div>
                  <div className="text-[10px] text-[#6366F1] uppercase tracking-wide mb-3">Phase 2 scores</div>
                  {detailEval.detailed_scoring_json.phase2.scores && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {Object.entries(detailEval.detailed_scoring_json.phase2.scores).map(([k, v]) => (
                        <div key={k} className="bg-[#F0F2FF] rounded-xl p-3 flex justify-between items-center">
                          <span className="text-xs text-[#4338CA]">{k.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium text-[#6366F1]">{String(v)}/20</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {detailEval.detailed_scoring_json.phase2.the_golden_trait && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800 mb-2">
                      <span className="font-medium">Golden trait: </span>{detailEval.detailed_scoring_json.phase2.the_golden_trait}
                    </div>
                  )}
                  {detailEval.detailed_scoring_json.phase2.the_fatal_flaw && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800 mb-2">
                      <span className="font-medium">Fatal flaw: </span>{detailEval.detailed_scoring_json.phase2.the_fatal_flaw}
                    </div>
                  )}
                  {detailEval.detailed_scoring_json.phase2.interview_focus && (
                    <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3 text-sm text-[#3730A3]">
                      <span className="font-medium">Interview focus: </span>{detailEval.detailed_scoring_json.phase2.interview_focus}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {createModal && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-md p-7`}>
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-lg font-medium text-[#1E1B4B]">Create job</h2>
              <button onClick={() => { setCreateModal(false); setNewTitle(''); setNewDesc(''); }} className="text-[#C7D2FE] hover:text-[#6366F1] text-xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Job title</label>
                <input type="text" className={inputCls} placeholder="e.g. Senior React Developer"
                  value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className={`${inputCls} h-32 resize-none`} placeholder="Full job description including responsibilities, requirements..."
                  value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setCreateModal(false); setNewTitle(''); setNewDesc(''); }}
                  className="flex-1 py-2.5 border border-[#C7D2FE] text-[#4338CA] rounded-xl text-sm font-medium hover:bg-[#EEF2FF] transition">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={!newTitle.trim() || !newDesc.trim()}
                  className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 transition">
                  Create job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD+SHORTLIST MODAL */}
      {uploadJobId && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-md p-7`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-medium text-[#1E1B4B]">Upload & shortlist</h2>
                <p className="text-xs text-[#818CF8] mt-1">{jobs.find(j => j.id === uploadJobId)?.title}</p>
              </div>
              <button onClick={() => setUploadJobId(null)} className="text-[#C7D2FE] hover:text-[#6366F1] text-xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className={labelCls}>Investigation mode</label>
                <select className={inputCls} value={investigationMode} onChange={e => setInvestigationMode(e.target.value)} disabled={uploading}>
                  <option value="normal">Normal</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Max phase 2 candidates</label>
                <input type="number" min="1" className={inputCls}
                  value={maxCandidates} onChange={e => setMaxCandidates(parseInt(e.target.value) || 50)} disabled={uploading} />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl text-sm text-amber-800 font-medium mb-5">
              Cost: 1.5 credits per resume (parse + shortlist)
            </div>
            <div className="flex gap-3">
              <button onClick={() => setUploadJobId(null)}
                className="flex-1 py-2.5 border border-[#C7D2FE] text-[#4338CA] rounded-xl text-sm font-medium hover:bg-[#EEF2FF] transition">
                Cancel
              </button>
              <label className={`flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium text-center cursor-pointer hover:bg-amber-600 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? 'Uploading...' : 'Select files'}
                <input type="file" className="hidden" accept=".pdf,.docx" multiple
                  onChange={e => handleUploadAndShortlist(e.target.files, uploadJobId)} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SHORTLIST EXISTING MODAL */}
      {shortlistJobId && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-w-lg max-h-[90vh] flex flex-col`}>
            <div className="px-6 py-5 border-b border-[#E0E7FF]">
              <h2 className="text-base font-medium text-[#1E1B4B]">Shortlist candidates</h2>
              <p className="text-xs text-[#818CF8] mt-0.5">{jobs.find(j => j.id === shortlistJobId)?.title}</p>
            </div>
            <div className="px-6 py-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className={labelCls}>Max phase 2 candidates</label>
                <input type="number" min="1" className={inputCls}
                  value={maxCandidates} onChange={e => setMaxCandidates(parseInt(e.target.value) || 50)} />
                <p className="text-xs text-[#818CF8] mt-1.5">Phase 2 scoring stops once this limit is reached.</p>
              </div>
              <div>
                <label className={labelCls}>{selCands.length > 0 ? `${selCands.length} selected · ${(selCands.length * 0.5).toFixed(1)} cr` : 'Select candidates'}</label>
                <div className="border border-[#E0E7FF] rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  {parsedCands.map(c => {
                    const eligible = c.status === 'completed' && c.dossier_md_url;
                    return (
                      <label key={c.id} className={`flex items-center gap-3 px-4 py-3 border-b border-[#F0F2FF] last:border-0 transition-colors ${eligible ? 'hover:bg-[#F8F9FF] cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                        <input type="checkbox" disabled={!eligible} checked={selCands.includes(c.id)}
                          onChange={() => setSelCands(p => p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id])}
                          className="w-4 h-4 rounded border-[#C7D2FE] accent-indigo-500" />
                        <div className="w-7 h-7 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[10px] font-medium text-[#4338CA]">
                          {initials(c.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-[#1E1B4B] truncate">{c.name || 'Unknown'}{!eligible ? ' · not parsed' : ''}</div>
                          <div className="text-xs text-[#818CF8] truncate">{c.key_role || c.email || '—'}</div>
                        </div>
                      </label>
                    );
                  })}
                  {parsedCands.length === 0 && <p className="text-sm text-[#818CF8] p-4 text-center">No candidates.</p>}
                </div>
              </div>
              {selCands.length > 0 && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${credits >= selCands.length * 0.5 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                  Cost: {(selCands.length * 0.5).toFixed(1)} cr · Balance: {credits.toFixed(1)} cr
                  {credits < selCands.length * 0.5 && ' · Insufficient credits'}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[#E0E7FF] flex gap-3">
              <button onClick={() => { setShortlistJobId(null); setSelCands([]); }}
                className="flex-1 py-2.5 border border-[#C7D2FE] text-[#4338CA] rounded-xl text-sm font-medium hover:bg-[#EEF2FF] transition">
                Cancel
              </button>
              <button onClick={() => handleShortlistExisting(shortlistJobId)}
                disabled={selCands.length === 0 || credits < selCands.length * 0.5}
                className="flex-1 py-2.5 bg-[#5B21B6] text-white rounded-xl text-sm font-medium hover:bg-[#4C1D95] disabled:opacity-40 transition">
                Shortlist {selCands.length > 0 ? `(${selCands.length})` : ''}
              </button>
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
            <p className="text-[#818CF8] text-sm mb-4">Parse + shortlist processing started.</p>
            <div className="bg-[#F0F2FF] rounded-xl p-4 mb-4 text-left max-h-32 overflow-y-auto">
              {uploadResult.files.map((f, i) => (
                <div key={i} className="flex gap-2 py-1 text-sm text-[#4338CA]">
                  <span className="text-emerald-500 text-xs">✓</span>{f}
                </div>
              ))}
            </div>
            <button onClick={() => setUploadResult(null)}
              className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}