
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Project, UIIssue, IssueSeverity, AuditDecision, IssueType } from '../types';

interface DifferenceAuditViewProps {
  project: Project;
  onUpdateIssues: (issues: UIIssue[]) => void;
  onBack: () => void;
  onFinish: () => void;
}

const DifferenceAuditView: React.FC<DifferenceAuditViewProps> = ({ project, onUpdateIssues, onBack, onFinish }) => {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

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

  const deleteIssue = (issueId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); 
    }
    
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

  const handleExportExcel = () => {
    if (project.issues.length === 0) {
      alert('暂无差异项可供导出');
      return;
    }

    const data = project.issues.map((issue, index) => ({
      '编号': index + 1,
      '差异标题': issue.title,
      '差异分类': issue.type,
      '严重程度': issue.severity,
      '走查决策': issue.decision || '待定',
      '设计标准': issue.designValue || '-',
      '实际实现': issue.devValue || '-',
      '详细描述': issue.description,
      '修改建议': issue.note || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UI走查报告");
    XLSX.writeFile(workbook, `${project.name}_报告.xlsx`);
  };

  const handleExportToBase = () => {
    // 模拟导出到多维表格逻辑
    const confirmed = window.confirm('准备将走查数据同步至飞书多维表格 / Notion Base？');
    if (confirmed) {
      alert('数据同步指令已发送。同步完成后，您可以在对应的协作文档中查收结果。');
      // 实际应用中这里会调用后端 Webhook 或飞书/Notion API
    }
  };

  const completionRate = Math.round(
    (project.issues.filter(i => i.decision).length / Math.max(project.issues.length, 1)) * 100
  );

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-50 overflow-hidden font-['Noto_Sans_SC']">
      {/* Header */}
      <header className="h-20 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-xl" title="退出并放弃">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7" strokeWidth={2.5}/></svg>
          </button>
          <div>
            <h1 className="text-white font-bold leading-none mb-1">{project.name}</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                <button 
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === 'side-by-side' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                >
                  左右对比
                </button>
                <button 
                  onClick={() => setViewMode('overlay')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === 'overlay' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                >
                  重叠模式
                </button>
              </div>
              {viewMode === 'overlay' && (
                <div className="flex items-center gap-2 ml-1">
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={overlayOpacity} 
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex flex-col items-end mr-4">
             <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1.5">审核完成度 {completionRate}%</div>
             <div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${completionRate}%` }}></div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportExcel}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-600 transition-all flex items-center gap-2 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2}/></svg>
              导出 Excel
            </button>
            <button 
              onClick={handleExportToBase}
              className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-2.5 rounded-xl text-sm font-bold border border-blue-600/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth={2}/></svg>
              同步多维表格
            </button>
            <button 
              onClick={onFinish}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-indigo-900/20 active:scale-95 transition-all"
            >
              完成并退出
            </button>
          </div>
        </div>
      </header>

      {/* Top Section: Images View */}
      <div className="flex-1 bg-slate-950 flex overflow-auto p-8 gap-8 items-start justify-center relative scrollbar-hide">
        {viewMode === 'side-by-side' ? (
          <div className="flex gap-10 min-w-max">
            <div className="flex flex-col items-center">
              <div className="text-slate-500 text-[10px] font-black uppercase mb-4 tracking-[0.2em] px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800 shadow-inner">Design Standard</div>
              <div className="bg-white rounded-2xl shadow-2xl p-4 ring-1 ring-white/10">
                <img src={project.designImage} className="max-w-[42vw] h-auto block rounded-lg" alt="设计" />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-slate-500 text-[10px] font-black uppercase mb-4 tracking-[0.2em] px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800 shadow-inner">Actual Dev</div>
              <div className="bg-white rounded-2xl shadow-2xl p-4 ring-1 ring-white/10">
                <img src={project.devImage} className="max-w-[42vw] h-auto block rounded-lg" alt="实现" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative bg-white rounded-2xl p-4 shadow-2xl mx-auto ring-1 ring-white/10">
            <img src={project.designImage} className="max-w-[75vw] h-auto block rounded-lg" alt="设计底图" />
            <img 
              src={project.devImage} 
              className="absolute top-4 left-4 w-[calc(100%-32px)] h-auto block mix-blend-difference pointer-events-none rounded-lg"
              style={{ opacity: overlayOpacity }}
              alt="开发覆盖图"
            />
            <div className="absolute top-8 right-8 bg-indigo-600 text-white text-[10px] px-4 py-2 rounded-full font-black shadow-2xl border border-indigo-400/30 uppercase tracking-widest">
              Difference Engine Active
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Audit Panel */}
      <div 
        className={`bg-white border-t border-slate-200 flex flex-col shrink-0 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] z-10 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${
          isPanelCollapsed ? 'h-16' : 'h-[440px]'
        }`}
      >
        <div className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-8">
            <h2 className="font-black text-slate-900 text-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              差异分析报告 <span className="ml-1 text-slate-300 font-mono text-sm">{project.issues.length} Items</span>
            </h2>
            {isPanelCollapsed && selectedIssue && (
               <div className="hidden lg:flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="h-4 w-px bg-slate-200"></div>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{selectedIssue.type}</span>
                  <span className="text-sm text-slate-600 font-bold truncate max-w-[400px]">{selectedIssue.title}</span>
               </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={addIssue}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-100 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3}/></svg>
              标记新差异
            </button>
            <button 
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-xl transition-all"
            >
              <svg 
                className={`w-6 h-6 transition-transform duration-500 ${isPanelCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-96 border-r border-slate-100 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {project.issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 p-8 text-center">
                  <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2}/></svg>
                  <p className="text-xs font-bold uppercase tracking-widest">No Issues Found</p>
                </div>
              ) : (
                project.issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => {
                      setSelectedIssueId(issue.id);
                      if (isPanelCollapsed) setIsPanelCollapsed(false);
                    }}
                    className={`group w-full text-left p-5 transition-all relative cursor-pointer ${
                      selectedIssueId === issue.id 
                        ? 'bg-white border-l-[6px] border-l-indigo-600 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]' 
                        : 'hover:bg-slate-100 border-l-[6px] border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-[0.1em] ${
                        issue.severity === IssueSeverity.HIGH ? 'bg-red-100 text-red-600 border border-red-200' : 
                        issue.severity === IssueSeverity.MEDIUM ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-blue-100 text-blue-600 border border-blue-200'
                      }`}>
                        {issue.type} · {issue.severity}
                      </span>
                      <button 
                        onClick={(e) => deleteIssue(issue.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
                      </button>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={`font-bold text-sm leading-snug flex-1 ${selectedIssueId === issue.id ? 'text-indigo-600' : 'text-slate-800'}`}>{issue.title}</h3>
                      {issue.decision && (
                        <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0 uppercase tracking-tighter">
                          {issue.decision}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 bg-white overflow-y-auto scroll-smooth">
            {selectedIssue ? (
              <div className="p-10 max-w-4xl">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${
                      selectedIssue.severity === IssueSeverity.HIGH ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 
                      selectedIssue.severity === IssueSeverity.MEDIUM ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-blue-500'
                    }`}></div>
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">修订走查详情</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">问题标题 (Subject)</label>
                      <input 
                        className="w-full border-b-2 border-slate-100 focus:border-indigo-600 py-3 text-lg font-bold text-slate-800 outline-none transition-all placeholder:text-slate-200"
                        value={selectedIssue.title}
                        onChange={(e) => updateIssue(selectedIssue.id, { title: e.target.value })}
                        placeholder="输入简短描述..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">设计预期</label>
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-xs font-bold text-indigo-700 min-h-[60px] flex items-center shadow-sm">
                          {selectedIssue.designValue || 'AI 尚未识别具体数值'}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">实际现状</label>
                        <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-xs font-bold text-red-700 min-h-[60px] flex items-center shadow-sm">
                          {selectedIssue.devValue || 'AI 尚未识别具体数值'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">差异化说明</label>
                      <textarea 
                        rows={4}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 text-sm font-medium text-slate-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all resize-none leading-relaxed"
                        value={selectedIssue.description}
                        onChange={(e) => updateIssue(selectedIssue.id, { description: e.target.value })}
                        placeholder="在此补充更详尽的走查发现..."
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase mb-4 block tracking-widest">走查结论 (Decision)</label>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.values(AuditDecision).map(d => (
                          <button
                            key={d}
                            onClick={() => updateIssue(selectedIssue.id, { decision: d })}
                            className={`flex items-center justify-between px-6 py-4 rounded-2xl border-2 font-bold transition-all active:scale-95 ${
                              selectedIssue.decision === d 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                                : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                            }`}
                          >
                            <span className="text-xs uppercase tracking-widest">{d}</span>
                            {selectedIssue.decision === d && (
                              <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">问题分类</label>
                        <select 
                          className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                          value={selectedIssue.type}
                          onChange={(e) => updateIssue(selectedIssue.id, { type: e.target.value as IssueType })}
                        >
                          {Object.values(IssueType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">优先级</label>
                        <select 
                          className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                          value={selectedIssue.severity}
                          onChange={(e) => updateIssue(selectedIssue.id, { severity: e.target.value as IssueSeverity })}
                        >
                          {Object.values(IssueSeverity).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">修订建议 (Optional)</label>
                      <input 
                        placeholder="输入建议的修改路径或技术参考..."
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                        value={selectedIssue.note || ''}
                        onChange={(e) => updateIssue(selectedIssue.id, { note: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 flex-col gap-6 p-20 text-center">
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                  <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={1.5}/></svg>
                </div>
                <div>
                  <h4 className="text-slate-900 font-black text-lg mb-2">选择一个走查项</h4>
                  <p className="text-sm font-medium text-slate-400 max-w-xs">请从左侧列表选择 AI 识别的差异点，进行细节核对与决策。</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DifferenceAuditView;
