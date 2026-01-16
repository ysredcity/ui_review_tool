
import React, { useState } from 'react';
import { Project, UIIssue, IssueSeverity, AuditDecision, IssueType } from '../types';

interface DifferenceAuditViewProps {
  project: Project;
  onUpdateIssues: (issues: UIIssue[]) => void;
  onBack: () => void;
  onFinish: () => void;
}

const DifferenceAuditView: React.FC<DifferenceAuditViewProps> = ({ project, onUpdateIssues, onBack, onFinish }) => {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(project.issues[0]?.id || null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  const selectedIssue = project.issues.find(i => i.id === selectedIssueId);

  const updateIssue = (issueId: string, updates: Partial<UIIssue>) => {
    const newIssues = project.issues.map(i => i.id === issueId ? { ...i, ...updates } : i);
    onUpdateIssues(newIssues);
  };

  const deleteIssue = (issueId: string) => {
    if (confirm('确定要删除这条差异记录吗？')) {
      const newIssues = project.issues.filter(i => i.id !== issueId);
      onUpdateIssues(newIssues);
      if (selectedIssueId === issueId) setSelectedIssueId(newIssues[0]?.id || null);
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
  };

  const completionRate = Math.round(
    (project.issues.filter(i => i.decision).length / Math.max(project.issues.length, 1)) * 100
  );

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors" title="返回">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7" strokeWidth={2}/></svg>
          </button>
          <h1 className="text-white font-semibold">{project.name} - UI 走查</h1>
          <div className="h-6 w-[1px] bg-slate-700 mx-2"></div>
          <div className="flex items-center bg-slate-900 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'side-by-side' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              左右对比
            </button>
            <button 
              onClick={() => setViewMode('overlay')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'overlay' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              重叠对比
            </button>
          </div>
          {viewMode === 'overlay' && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">透明度</span>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={overlayOpacity} 
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
             <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">走查进度</div>
             <div className="w-32 h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
             </div>
          </div>
          <button 
            onClick={onFinish}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20"
          >
            完成走查
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Images View */}
        <div className="flex-1 bg-slate-950 flex overflow-auto p-8 gap-8 items-start relative scrollbar-hide">
          {viewMode === 'side-by-side' ? (
            <>
              <div className="flex-1 min-w-[400px]">
                <div className="text-slate-500 text-[10px] font-bold uppercase mb-4 tracking-widest text-center">设计稿 (Source)</div>
                <div className="bg-white rounded-lg shadow-2xl p-4 mx-auto inline-block min-w-full">
                  <img src={project.designImage} className="w-full h-auto block" alt="设计" />
                </div>
              </div>
              <div className="flex-1 min-w-[400px]">
                <div className="text-slate-500 text-[10px] font-bold uppercase mb-4 tracking-widest text-center">开发截图 (Actual)</div>
                <div className="bg-white rounded-lg shadow-2xl p-4 mx-auto inline-block min-w-full">
                  <img src={project.devImage} className="w-full h-auto block" alt="实现" />
                </div>
              </div>
            </>
          ) : (
            <div className="mx-auto relative bg-white rounded-lg p-4 shadow-2xl">
              <img src={project.designImage} className="w-full h-auto block" alt="设计底图" />
              <img 
                src={project.devImage} 
                className="absolute top-4 left-4 w-[calc(100%-32px)] h-auto block mix-blend-difference pointer-events-none"
                style={{ opacity: overlayOpacity }}
                alt="开发覆盖图"
              />
              <div className="absolute top-6 right-6 bg-slate-900/80 text-white text-[10px] px-2 py-1 rounded font-bold">差值混合模式</div>
            </div>
          )}
        </div>

        {/* Right: Panel */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl shrink-0 overflow-hidden">
          {/* List Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
             <h2 className="font-bold text-slate-800">差异点列表 ({project.issues.length})</h2>
             <button 
               onClick={addIssue}
               className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
               title="添加差异"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2}/></svg>
             </button>
          </div>

          {/* Issue List */}
          <div className="flex-1 overflow-y-auto bg-slate-50 divide-y divide-slate-100">
            {project.issues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className={`w-full text-left p-4 transition-all ${
                  selectedIssueId === issue.id ? 'bg-white border-l-4 border-l-indigo-600 shadow-sm' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${
                    issue.severity === IssueSeverity.HIGH ? 'bg-red-100 text-red-600' : 
                    issue.severity === IssueSeverity.MEDIUM ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {issue.type} · {issue.severity}
                  </span>
                  {issue.decision && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {issue.decision}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-800 text-sm truncate">{issue.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{issue.description}</p>
              </button>
            ))}
          </div>

          {/* Details Panel */}
          {selectedIssue && (
            <div className="h-[480px] bg-white border-t border-slate-200 shrink-0 flex flex-col overflow-y-auto">
               <div className="p-5 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">详情说明</h3>
                    <button onClick={() => deleteIssue(selectedIssue.id)} className="text-slate-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">问题标题</label>
                      <input 
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedIssue.title}
                        onChange={(e) => updateIssue(selectedIssue.id, { title: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">设计稿数值</label>
                        <div className="bg-indigo-50 text-indigo-700 p-2 rounded border border-indigo-100 text-xs font-mono min-h-[32px]">
                          {selectedIssue.designValue || '未指定'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">开发实现值</label>
                        <div className="bg-red-50 text-red-700 p-2 rounded border border-red-100 text-xs font-mono min-h-[32px]">
                          {selectedIssue.devValue || '未指定'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">具体描述</label>
                      <textarea 
                        rows={3}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedIssue.description}
                        onChange={(e) => updateIssue(selectedIssue.id, { description: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">走查决策</label>
                      <div className="flex gap-2">
                        {Object.values(AuditDecision).map(d => (
                          <button
                            key={d}
                            onClick={() => updateIssue(selectedIssue.id, { decision: d })}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                              selectedIssue.decision === d 
                                ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">备注 / 给开发的留言</label>
                      <input 
                        placeholder="例如：请加粗字体或调整间距..."
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedIssue.note || ''}
                        onChange={(e) => updateIssue(selectedIssue.id, { note: e.target.value })}
                      />
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DifferenceAuditView;
