
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Project, UIIssue, IssueSeverity, AuditDecision, IssueType } from '../types';

interface DifferenceAuditViewProps {
  project: Project;
  onUpdateIssues: (issues: UIIssue[]) => void;
  onBack: () => void;
}

const DifferenceAuditView: React.FC<DifferenceAuditViewProps> = ({ project, onUpdateIssues, onBack }) => {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedIssueId && project.issues.length > 0) {
      setSelectedIssueId(project.issues[0].id);
    }
  }, [project.issues, selectedIssueId]);

  const selectedIssue = project.issues.find(i => i.id === selectedIssueId);

  const updateIssue = (issueId: string, updates: Partial<UIIssue>) => {
    const newIssues = project.issues.map(i => i.id === issueId ? { ...i, ...updates } : i);
    onUpdateIssues(newIssues);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedIssueId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateIssue(selectedIssueId, { screenshot: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteIssue = (issueId: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (window.confirm('确定要删除这条差异记录吗？')) {
      const remainingIssues = project.issues.filter(i => i.id !== issueId);
      onUpdateIssues(remainingIssues);
      if (selectedIssueId === issueId) {
        setSelectedIssueId(remainingIssues.length > 0 ? remainingIssues[0].id : null);
      }
    }
  };

  const addIssue = () => {
    const newIssue: UIIssue = {
      id: `manual-${Date.now()}`,
      title: '手动标记差异',
      description: '请描述这里的视觉差异...',
      type: IssueType.LAYOUT,
      severity: IssueSeverity.MEDIUM,
    };
    onUpdateIssues([newIssue, ...project.issues]);
    setSelectedIssueId(newIssue.id);
    setIsPanelCollapsed(false);
  };

  const completionRate = Math.round(
    (project.issues.filter(i => i.decision).length / Math.max(project.issues.length, 1)) * 100
  );

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-50 overflow-hidden font-['Noto_Sans_SC']">
      {/* Header */}
      <header className="h-20 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-xl">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7" strokeWidth={2.5}/></svg>
          </button>
          <div>
            <h1 className="text-white font-bold text-sm md:text-base">{project.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                <button onClick={() => setViewMode('side-by-side')} className={`px-2 py-1 text-[9px] font-bold rounded ${viewMode === 'side-by-side' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>对比模式</button>
                <button onClick={() => setViewMode('overlay')} className={`px-2 py-1 text-[9px] font-bold rounded ${viewMode === 'overlay' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>叠层模式</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end mr-4">
             <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1.5">审核完成度 {completionRate}%</div>
             <div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
             </div>
          </div>
          <button onClick={addIssue} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/20 active:scale-95 transition-all">
            标记新差异
          </button>
        </div>
      </header>

      {/* Main Preview Area */}
      <div className="flex-1 bg-slate-950 flex overflow-auto p-4 md:p-8 gap-4 md:gap-10 items-start justify-center relative scrollbar-hide">
        {viewMode === 'side-by-side' ? (
          <div className="flex flex-col md:flex-row gap-8 min-w-max">
            <div className="bg-white rounded-2xl shadow-2xl p-4 ring-1 ring-white/10">
              <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest text-center">Design Standard</div>
              <img src={project.designImage} className="max-w-[80vw] md:max-w-[40vw] h-auto rounded" alt="设计稿" />
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-4 ring-1 ring-white/10">
              <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest text-center">Development Implementation</div>
              <img src={project.devImage} className="max-w-[80vw] md:max-w-[40vw] h-auto rounded" alt="开发稿" />
            </div>
          </div>
        ) : (
          <div className="relative bg-white rounded-2xl p-4 shadow-2xl mx-auto ring-1 ring-white/10">
            <img src={project.designImage} className="max-w-[85vw] md:max-w-[75vw] h-auto rounded" alt="底图" />
            <img src={project.devImage} className="absolute top-4 left-4 w-[calc(100%-32px)] h-auto block mix-blend-difference rounded" style={{ opacity: overlayOpacity }} alt="叠层" />
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div className={`bg-white border-t border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-500 ${isPanelCollapsed ? 'h-16' : 'h-[360px] md:h-[450px]'}`}>
        <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between shrink-0">
          <h2 className="font-black text-slate-900 text-sm md:text-base flex items-center gap-2">
            差异清单 <span className="text-indigo-600 font-mono text-xs">{project.issues.length} Items</span>
          </h2>
          <button onClick={() => setIsPanelCollapsed(!isPanelCollapsed)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
            <svg className={`w-5 h-5 transition-transform ${isPanelCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={2.5}/></svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* List */}
          <div className="w-72 md:w-96 border-r border-slate-100 overflow-y-auto bg-slate-50">
            {project.issues.map(issue => (
              <div
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className={`p-4 flex gap-4 cursor-pointer transition-all border-l-4 ${selectedIssueId === issue.id ? 'bg-white border-indigo-600 shadow-sm' : 'border-transparent hover:bg-slate-100'}`}
              >
                {/* 列表中的缩略图 */}
                <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-lg border border-slate-200 bg-slate-200 bg-cover bg-center overflow-hidden flex items-center justify-center" style={issue.screenshot ? { backgroundImage: `url(${issue.screenshot})` } : {}}>
                  {!issue.screenshot && <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={1.5}/></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs md:text-sm font-bold truncate text-slate-800">{issue.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black">{issue.type}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black ${issue.severity === IssueSeverity.HIGH ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{issue.severity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
            {selectedIssue ? (
              <div className="max-w-3xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Screenshot Field */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">差异点截图 (局部)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video w-full rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center relative"
                    >
                      {selectedIssue.screenshot ? (
                        <img src={selectedIssue.screenshot} className="w-full h-full object-contain" alt="差异截图" />
                      ) : (
                        <div className="text-center p-4">
                          <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2}/></svg>
                          <span className="text-[10px] font-bold text-slate-400">点击上传局部截图</span>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScreenshotUpload} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">差异标题</label>
                      <input 
                        className="w-full text-base md:text-lg font-bold text-slate-800 border-b-2 border-slate-100 focus:border-indigo-600 outline-none pb-2 transition-all"
                        value={selectedIssue.title}
                        onChange={e => updateIssue(selectedIssue.id, { title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">走查结论</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(AuditDecision).map(d => (
                          <button 
                            key={d} 
                            onClick={() => updateIssue(selectedIssue.id, { decision: d })}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${selectedIssue.decision === d ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <div className="text-[10px] font-black text-indigo-400 uppercase mb-2">设计预期</div>
                      <div className="text-xs font-bold text-indigo-900">{selectedIssue.designValue || '-'}</div>
                   </div>
                   <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                      <div className="text-[10px] font-black text-red-400 uppercase mb-2">实际实现</div>
                      <div className="text-xs font-bold text-red-900">{selectedIssue.devValue || '-'}</div>
                   </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">详细说明</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-slate-50 p-4 rounded-xl text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-600/10 border border-transparent focus:border-indigo-600 transition-all"
                    value={selectedIssue.description}
                    onChange={e => updateIssue(selectedIssue.id, { description: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs">请选择一个差异项</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DifferenceAuditView;
