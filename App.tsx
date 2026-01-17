
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
        <div className="relative flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-slate-950">
          {/* Background Tech Elements */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Mesh Gradient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse opacity-50"></div>
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] opacity-30"></div>
            
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.15]" 
              style={{ 
                backgroundImage: `radial-gradient(#4f46e5 0.5px, transparent 0.5px), radial-gradient(#4f46e5 0.5px, #020617 0.5px)`,
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 20px 20px'
              }}
            ></div>

            {/* Scanning Line Animation */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent animate-[scan_4s_linear_infinite]"></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center max-w-4xl w-full animate-in fade-in zoom-in-95 duration-700">
            {/* Logo Section */}
            <div className="relative mb-12 group">
              <div className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative flex items-center justify-center w-24 h-24 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                <svg className="w-12 h-12 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {/* Decorative Pixel Corners */}
                <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-indigo-400/50 rounded-full"></div>
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-indigo-400/50 rounded-full"></div>
              </div>
            </div>

            {/* Text Section */}
            <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500 text-center leading-tight">
              PIXEL GUARD <span className="text-indigo-500 italic">AI</span>
            </h1>
            
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-14 leading-relaxed font-medium text-center">
              基于大语言模型的视觉走查专家。毫秒级比对设计稿与开发截图，<br className="hidden md:block" /> 自动识别间距、布局及排版差异。
            </p>

            {/* CTA Button */}
            <div className="relative group">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              
              <button 
                onClick={startNewAudit}
                className="relative flex items-center justify-center gap-4 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-6 rounded-2xl font-black text-2xl transition-all shadow-2xl active:scale-95 border border-indigo-400/20"
              >
                开始走查任务
                <svg className="w-6 h-6 animate-[bounce-x_1.5s_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            {/* Features Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full px-4">
              <div className="flex flex-col items-center p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-indigo-400 mb-3">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-1">极速比对</h3>
                <p className="text-slate-500 text-xs text-center">Gemini 3 Flash 实时响应</p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-indigo-400 mb-3">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944a11.955 11.955 0 01-8.618 3.04m12.426 13.911a11.969 11.969 0 005.192-10.893 11.97 11.97 0 00-11.002-8.381c-.134 0-.267 0-.4 0a11.97 11.97 0 00-11.002 8.381 11.969 11.969 0 005.192 10.893l5.81 3.42 5.81-3.42z" /></svg>
                </div>
                <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-1">像素级精确</h3>
                <p className="text-slate-500 text-xs text-center">多维度视觉一致性分析</p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-indigo-400 mb-3">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-1">导出报告</h3>
                <p className="text-slate-500 text-xs text-center">支持 Excel 与多维表格同步</p>
              </div>
            </div>
          </div>

          {/* Footer Logo */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-30 pointer-events-none">
             <div className="flex items-center gap-3">
                <div className="w-10 h-[1px] bg-slate-700"></div>
                <span className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">Powered by Google Gemini</span>
                <div className="w-10 h-[1px] bg-slate-700"></div>
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

      {/* Animation Definitions */}
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};

export default App;
