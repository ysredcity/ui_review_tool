
import React, { useState, useEffect, useRef } from 'react';
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

  const deleteIssue = (issueId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发选中事件
    if (window.confirm('确定要移除此差异项吗？')) {
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
      title: '发现新差异',
      description: '请描述具体的视觉不一致...',
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
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700 mt-1">
              <button onClick={() => setViewMode('side-by-side')} className={`px-2 py-1 text-[9px] font-bold rounded ${viewMode === 'side-by-side' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>对比视图</button>
              <button onClick={() => setViewMode('overlay')} className={`px-2 py-1 text-[9px] font-bold rounded ${viewMode === 'overlay' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>叠层视图</button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end">
             <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">审核进度 {completionRate}%</div>
             <div className="w-40 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
             </div>
          </div>
          <button onClick={addIssue} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95">
            + 手动标记差异
          </button>
        </div>
      </header>

      {/* Canvas Preview Area */}
      <div className="flex-1 bg-slate-950 flex overflow-auto p-4 md:p-8 gap-8 items-start justify-center relative scrollbar-hide">
        {viewMode === 'side-by-side' ? (
          <div className="flex flex-col md:flex-row gap-12 min-w-max">
            <div className="bg-white rounded-2xl shadow-2xl p-4">
              <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest text-center border-b pb-1">Design Standard</div>
              <img src={project.designImage} className="max-w-[85vw] md:max-w-[40vw] h-auto rounded-lg" alt="设计稿" />
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-4">
              <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest text-center border-b pb-1">Live Implementation</div>
              <img src={project.devImage} className="max-w-[85vw] md:max-w-[40vw] h-auto rounded-lg" alt="开发稿" />
            </div>
          </div>
        ) : (
          <div className="relative bg-white rounded-2xl p-4 shadow-2xl mx-auto ring-1 ring-white/10">
            <img src={project.designImage} className="max-w-[85vw] md:max-w-[75vw] h-auto rounded-lg" alt="底图" />
            <img 
              src={project.devImage} 
              className="absolute top-4 left-4 w-[calc(100%-32px)] h-auto block mix-blend-difference rounded-lg" 
              style={{ opacity: overlayOpacity }} 
              alt="叠层" 
            />
            <div className="absolute top-8 right-8 bg-slate-900/80 backdrop-blur p-3 rounded-2xl border border-white/10 w-40">
               <div className="text-[10px] font-black text-white/50 uppercase mb-2">叠层透明度</div>
               <input type="range" min="0" max="1" step="0.1" value={overlayOpacity} onChange={e => setOverlayOpacity(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
            </div>
          </div>
        )}
      </div>

      {/* Multi-Panel Control Area */}
      <div className={`bg-white border-t border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-500 ease-in-out shadow-[0_-10px_40px_rgba(0,0,0,0.1)] ${isPanelCollapsed ? 'h-16' : 'h-[400px] md:h-[500px]'}`}>
        <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between shrink-0 bg-slate-50/50">
          <h2 className="font-black text-slate-900 text-sm md:text-base flex items-center gap-3">
            差异记录清单 <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-mono">{project.issues.length}</span>
          </h2>
          <button onClick={() => setIsPanelCollapsed(!isPanelCollapsed)} className="p-2 text-slate-400 hover:bg-white hover:text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-slate-200">
            <svg className={`w-5 h-5 transition-transform duration-300 ${isPanelCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={2.5}/></svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar List */}
          <div className="w-72 md:w-80 border-r border-slate-100 overflow-y-auto bg-slate-50/30">
            {project.issues.map(issue => (
              <div
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className={`group relative p-4 flex gap-3 cursor-pointer transition-all border-l-4 ${selectedIssueId === issue.id ? 'bg-white border-indigo-600 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-200'}`}
              >
                <div className="w-12 h-12 shrink-0 rounded-lg border border-slate-100 bg-slate-100 bg-cover bg-center overflow-hidden flex items-center justify-center shadow-inner" style={issue.screenshot ? { backgroundImage: `url(${issue.screenshot})` } : {}}>
                  {!issue.screenshot && <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2}/></svg>}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className={`text-xs font-bold truncate ${selectedIssueId === issue.id ? 'text-indigo-600' : 'text-slate-700'}`}>{issue.title}</h3>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${issue.severity === IssueSeverity.HIGH ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{issue.severity}</span>
                    {issue.decision && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black uppercase">已处理</span>}
                  </div>
                </div>
                {/* Delete Button */}
                <button 
                  onClick={(e) => deleteIssue(issue.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除此项"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
                </button>
              </div>
            ))}
          </div>

          {/* Issue Detail View */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white relative">
            {selectedIssue ? (
              <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Local Screenshot Area */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       问题局部截图
                       <span className="normal-case font-medium text-slate-300">(可选)</span>
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video w-full rounded-2xl border-2 border-dashed border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/10 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center group relative shadow-inner"
                    >
                      {selectedIssue.screenshot ? (
                        <>
                          <img src={selectedIssue.screenshot} className="w-full h-full object-contain" alt="差异截图" />
                          <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-xs font-bold">更换截图</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={1.5}/></svg>
                          <span className="text-[11px] font-bold text-slate-400 uppercase">点击上传此处差异的局部截图</span>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScreenshotUpload} />
                    </div>
                  </div>

                  {/* Core Meta Information */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">差异名称</label>
                      <input 
                        className="w-full text-xl font-black text-slate-800 border-b-2 border-slate-100 focus:border-indigo-600 outline-none pb-2 transition-all bg-transparent"
                        placeholder="输入差异项标题..."
                        value={selectedIssue.title}
                        onChange={e => updateIssue(selectedIssue.id, { title: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">问题类型</label>
                        <select 
                          className="w-full bg-slate-50 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 outline-none border border-slate-100 focus:border-indigo-600"
                          value={selectedIssue.type}
                          onChange={e => updateIssue(selectedIssue.id, { type: e.target.value as IssueType })}
                        >
                          {Object.values(IssueType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">严重程度</label>
                        <select 
                          className={`w-full px-3 py-2 rounded-lg text-xs font-bold outline-none border ${selectedIssue.severity === IssueSeverity.HIGH ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-700 border-slate-100 focus:border-indigo-600'}`}
                          value={selectedIssue.severity}
                          onChange={e => updateIssue(selectedIssue.id, { severity: e.target.value as IssueSeverity })}
                        >
                          {Object.values(IssueSeverity).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Values Comparison Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100 group">
                      <div className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">设计预期 (Design Value)</div>
                      <input 
                        className="w-full bg-transparent text-sm font-bold text-indigo-900 outline-none border-b border-transparent group-hover:border-indigo-200 focus:border-indigo-500 pb-1"
                        value={selectedIssue.designValue || ''}
                        placeholder="输入设计规范值..."
                        onChange={e => updateIssue(selectedIssue.id, { designValue: e.target.value })}
                      />
                   </div>
                   <div className="p-5 bg-red-50/40 rounded-2xl border border-red-100 group">
                      <div className="text-[10px] font-black text-red-400 uppercase mb-2 tracking-widest">实际实现 (Dev Value)</div>
                      <input 
                        className="w-full bg-transparent text-sm font-bold text-red-900 outline-none border-b border-transparent group-hover:border-red-200 focus:border-red-500 pb-1"
                        value={selectedIssue.devValue || ''}
                        placeholder="输入开发实现值..."
                        onChange={e => updateIssue(selectedIssue.id, { devValue: e.target.value })}
                      />
                   </div>
                </div>

                {/* Description & Decision */}
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">详细差异说明</label>
                    <textarea 
                      rows={3}
                      className="w-full bg-slate-50/80 p-4 rounded-xl text-xs font-medium text-slate-600 outline-none border border-slate-100 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all"
                      placeholder="详细说明此处的视觉差异细节..."
                      value={selectedIssue.description}
                      onChange={e => updateIssue(selectedIssue.id, { description: e.target.value })}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">走查结论与处理意见</label>
                    <div className="flex flex-wrap gap-3">
                      {Object.values(AuditDecision).map(d => (
                        <button 
                          key={d} 
                          onClick={() => updateIssue(selectedIssue.id, { decision: d })}
                          className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all border-2 ${selectedIssue.decision === d ? 'bg-slate-900 border-slate-900 text-white shadow-xl -translate-y-0.5' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-200">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={1.5}/></svg>
                <div className="font-black uppercase tracking-[0.2em] text-xs opacity-50">请从左侧选择差异项进行审核</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DifferenceAuditView;
