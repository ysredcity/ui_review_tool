
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

  // 初始化选中项
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
      
      // 更新外部状态
      onUpdateIssues(remainingIssues);
      
      // 如果删除的是当前选中的项，则切换到另一个项
      if (selectedIssueId === issueId) {
        if (remainingIssues.length > 0) {
          setSelectedIssueId(remainingIssues[0].id);
        } else {
          setSelectedIssueId(null);
        }
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
    XLSX.writeFile(workbook, `${project.name}_UI走查报告_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const completionRate = Math.round(
    (project.issues.filter(i => i.decision).length / Math.max(project.issues.length, 1)) * 100
  );

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-50 overflow-hidden font-['Noto_Sans_SC']">
      {/* Header */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg" title="回到项目列表">
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
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">走查进度</div>
             <div className="w-40 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${completionRate}%` }}></div>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportExcel}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold border border-slate-600 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出报告
            </button>
            <button 
              onClick={onFinish}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
            >
              完成并关闭
            </button>
          </div>
        </div>
      </header>

      {/* Top Section: Images View */}
      <div className="flex-1 bg-slate-950 flex overflow-auto p-8 gap-8 items-start justify-center relative scrollbar-hide">
        {viewMode === 'side-by-side' ? (
          <div className="flex gap-8 min-w-max">
            <div className="flex flex-col items-center">
              <div className="text-slate-500 text-[10px] font-bold uppercase mb-4 tracking-widest px-3 py-1 bg-slate-900 rounded-full border border-slate-800">设计稿 (Source)</div>
              <div className="bg-white rounded-lg shadow-2xl p-4 overflow-hidden">
                <img src={project.designImage} className="max-w-[45vw] h-auto block" alt="设计" />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-slate-500 text-[10px] font-bold uppercase mb-4 tracking-widest px-3 py-1 bg-slate-900 rounded-full border border-slate-800">开发截图 (Actual)</div>
              <div className="bg-white rounded-lg shadow-2xl p-4 overflow-hidden">
                <img src={project.devImage} className="max-w-[45vw] h-auto block" alt="实现" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative bg-white rounded-lg p-4 shadow-2xl mx-auto">
            <img src={project.designImage} className="max-w-[80vw] h-auto block" alt="设计底图" />
            <img 
              src={project.devImage} 
              className="absolute top-4 left-4 w-[calc(100%-32px)] h-auto block mix-blend-difference pointer-events-none"
              style={{ opacity: overlayOpacity }}
              alt="开发覆盖图"
            />
            <div className="absolute top-8 right-8 bg-indigo-600 text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-lg border border-indigo-400/30">
              差值模式
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Audit Panel */}
      <div 
        className={`bg-white border-t border-slate-200 flex flex-col shrink-0 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] z-10 transition-all duration-300 ease-in-out overflow-hidden ${
          isPanelCollapsed ? 'h-14' : 'h-[400px]'
        }`}
      >
        {/* Panel Toolbar / Header */}
        <div className="h-14 bg-white border-b border-slate-100 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              差异项概览 <span className="ml-1 px-1.5 py-0.5 bg-slate-100 rounded-md text-xs font-mono">{project.issues.length}</span>
            </h2>
            {isPanelCollapsed && selectedIssue && (
               <div className="hidden md:flex items-center gap-3 animate-fade-in">
                  <span className="text-slate-300 text-xs">|</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">{selectedIssue.type}</span>
                  <span className="text-sm text-slate-600 font-medium truncate max-w-[300px]">{selectedIssue.title}</span>
               </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={addIssue}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2.5}/></svg>
              手动标记
            </button>
            <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
            <button 
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-all"
              title={isPanelCollapsed ? "展开面板" : "收起面板"}
            >
              <svg 
                className={`w-6 h-6 transition-transform duration-300 ${isPanelCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Bottom-Left: Discrepancy List Navigation */}
          <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200/50">
              {project.issues.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">暂无差异点</div>
              ) : (
                project.issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => {
                      setSelectedIssueId(issue.id);
                      if (isPanelCollapsed) setIsPanelCollapsed(false);
                    }}
                    className={`group w-full text-left p-4 transition-all relative cursor-pointer ${
                      selectedIssueId === issue.id 
                        ? 'bg-white border-l-4 border-l-indigo-600 shadow-sm' 
                        : 'hover:bg-slate-100 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
                        issue.severity === IssueSeverity.HIGH ? 'bg-red-100 text-red-600' : 
                        issue.severity === IssueSeverity.MEDIUM ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {issue.type} · {issue.severity}
                      </span>
                      <button 
                        onClick={(e) => deleteIssue(issue.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all p-1 rounded-md border border-transparent hover:border-red-100"
                        title="快捷删除"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-semibold text-sm truncate flex-1 ${selectedIssueId === issue.id ? 'text-indigo-600' : 'text-slate-800'}`}>{issue.title}</h3>
                      {issue.decision && (
                        <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 shrink-0">
                          {issue.decision}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 leading-relaxed">{issue.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom-Right: Selected Discrepancy Details Form */}
          <div className="flex-1 bg-white overflow-y-auto">
            {selectedIssue ? (
              <div className="p-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedIssue.severity === IssueSeverity.HIGH ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                      selectedIssue.severity === IssueSeverity.MEDIUM ? 'bg-amber-500' : 'bg-blue-500'
                    }`}></div>
                    <h3 className="font-bold text-slate-900 text-xl tracking-tight">走查项详细设置</h3>
                  </div>
                  <button 
                    onClick={(e) => deleteIssue(selectedIssue.id, e)} 
                    className="flex items-center gap-2 text-slate-400 hover:text-red-600 transition-all text-sm font-medium px-4 py-2 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
                    删除此走查项
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
                  {/* Left Column: Core Info */}
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">差异标题</label>
                      <input 
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={selectedIssue.title}
                        onChange={(e) => updateIssue(selectedIssue.id, { title: e.target.value })}
                        placeholder="输入简短的问题描述"
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">设计标准 (Standard)</label>
                        <div className="bg-indigo-50/50 text-indigo-700 p-3 rounded-lg border border-indigo-100 text-xs font-mono min-h-[44px] flex items-center">
                          {selectedIssue.designValue || '未指定'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">当前实现 (Actual)</label>
                        <div className="bg-red-50/50 text-red-700 p-3 rounded-lg border border-red-100 text-xs font-mono min-h-[44px] flex items-center">
                          {selectedIssue.devValue || '未指定'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">具体差异描述</label>
                      <textarea 
                        rows={3}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none leading-relaxed"
                        value={selectedIssue.description}
                        onChange={(e) => updateIssue(selectedIssue.id, { description: e.target.value })}
                        placeholder="详细描述视觉差异的具体位置和内容..."
                      />
                    </div>
                  </div>

                  {/* Right Column: Decisions & Notes */}
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">走查决策 (Audit Decision)</label>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.values(AuditDecision).map(d => (
                          <button
                            key={d}
                            onClick={() => updateIssue(selectedIssue.id, { decision: d })}
                            className={`py-2.5 text-[10px] font-bold uppercase rounded-xl border transition-all active:scale-95 ${
                              selectedIssue.decision === d 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">分类 & 严重级别</label>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <select 
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={selectedIssue.type}
                            onChange={(e) => updateIssue(selectedIssue.id, { type: e.target.value as IssueType })}
                          >
                            {Object.values(IssueType).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="flex-1">
                          <select 
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={selectedIssue.severity}
                            onChange={(e) => updateIssue(selectedIssue.id, { severity: e.target.value as IssueSeverity })}
                          >
                            {Object.values(IssueSeverity).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">备注 / 修改建议 (开发者可见)</label>
                      <input 
                        placeholder="例如：请检查全局间距配置，目前偏移了 4px..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={selectedIssue.note || ''}
                        onChange={(e) => updateIssue(selectedIssue.id, { note: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 flex-col gap-4">
                <svg className="w-16 h-16 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth={1.5}/></svg>
                <p className="text-sm font-medium">从左侧选择一个差异项开始详细核对</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DifferenceAuditView;
