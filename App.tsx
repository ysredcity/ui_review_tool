
import React, { useState } from 'react';
import { Project, ProjectStatus } from './types';
import AuditWorkflow from './components/AuditWorkflow';
import DifferenceAuditView from './components/DifferenceAuditView';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'upload' | 'audit'>('landing');
  const [currentAudit, setCurrentAudit] = useState<Project | null>(null);

  const startNewAudit = () => {
    const newProject: Project = {
      id: `audit-${Date.now()}`,
      name: `UI 走查 - ${new Date().toLocaleDateString()}`,
      status: ProjectStatus.DRAFT,
      updatedAt: new Date().toISOString(),
      issues: [],
    };
    setCurrentAudit(newProject);
    setView('upload');
  };

  const handleUpdateAudit = (updates: Partial<Project>) => {
    setCurrentAudit(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
  };

  const resetToLanding = () => {
    if (view === 'audit' && !window.confirm('确定要返回首页吗？未导出的走查数据将会丢失。')) {
      return;
    }
    setCurrentAudit(null);
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter','Noto_Sans_SC',sans-serif]">
      {view === 'landing' && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-600 text-white shadow-2xl shadow-indigo-200">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">像素卫士 AI</h1>
          <p className="text-slate-500 text-lg max-w-lg mb-12 leading-relaxed">
            专业的 UI 设计还原度走查助手。上传设计稿与开发截图，由 Gemini AI 自动识别差异并导出标准化报告。
          </p>
          <button 
            onClick={startNewAudit}
            className="group relative flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1 active:translate-y-0"
          >
            开始走查
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <div className="mt-20 flex gap-12 grayscale opacity-40">
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Powered By</div>
              <div className="text-lg font-bold text-slate-900">Gemini 3 Flash</div>
            </div>
          </div>
        </div>
      )}

      {view === 'upload' && currentAudit && (
        <div className="min-h-screen flex flex-col">
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button onClick={resetToLanding} className="text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-slate-100 transition-all">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2}/></svg>
              </button>
              <h1 className="text-xl font-bold text-slate-900">新建走查任务</h1>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">
             <AuditWorkflow 
              project={currentAudit} 
              onUpdateProject={handleUpdateAudit}
              onStartAudit={() => setView('audit')}
            />
          </div>
        </div>
      )}

      {view === 'audit' && currentAudit && (
        <DifferenceAuditView 
          project={currentAudit}
          onUpdateIssues={(issues) => handleUpdateAudit({ issues })}
          onBack={resetToLanding}
        />
      )}
    </div>
  );
};

export default App;
