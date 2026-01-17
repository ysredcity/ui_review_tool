
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { analyzeUIComparison } from '../services/geminiService';

interface AuditWorkflowProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onStartAudit: () => void;
}

const AuditWorkflow: React.FC<AuditWorkflowProps> = ({ project, onUpdateProject, onStartAudit }) => {
  const getInitialStep = () => {
    if (project.issues && project.issues.length > 0) return 4;
    if (project.designImage && project.devImage) return 3;
    if (project.designImage) return 2;
    return 1;
  };

  const [step, setStep] = useState(getInitialStep());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'design' | 'dev') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'design') {
          onUpdateProject({ designImage: base64 });
          setStep(2);
        } else {
          onUpdateProject({ devImage: base64 });
          setStep(3);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!project.designImage || !project.devImage) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const results = await analyzeUIComparison(project.designImage, project.devImage);
      onUpdateProject({
        issues: results.map((r: any, idx: number) => ({ ...r, id: `ai-${idx}-${Date.now()}` })),
        status: ProjectStatus.PENDING_AUDIT
      });
      setStep(4);
    } catch (err: any) {
      setError(err.message || "AI 分析失败，请检查配置或重试。");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const steps = [
    { num: 1, title: '上传设计稿' },
    { num: 2, title: '上传开发截图' },
    { num: 3, title: '自动比对' },
    { num: 4, title: '审核结果' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center flex-1 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-colors duration-500 ${
                step >= s.num ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {s.num}
              </div>
              <span className={`mt-2 text-[10px] font-black uppercase tracking-wider ${step >= s.num ? 'text-indigo-600' : 'text-slate-400'}`}>
                {s.title}
              </span>
              {s.num < 4 && (
                <div className={`absolute top-5 left-1/2 w-full h-[2px] ${step > s.num ? 'bg-indigo-600' : 'bg-slate-200'} transition-colors duration-500`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 min-h-[450px] flex flex-col items-center justify-center transition-all relative overflow-hidden">
        {/* Step Content */}
        {step === 1 && (
          <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 inline-block p-5 bg-indigo-50 rounded-3xl text-indigo-600 shadow-inner">
              <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={1.5} /></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">第 1 步：上传设计标准</h2>
            <p className="text-slate-500 mb-10 max-w-md mx-auto font-medium">请提供高保真视觉设计稿，Gemini 将以此作为基准像素进行扫描。</p>
            <label className="cursor-pointer bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:bg-indigo-600 transition-all inline-block active:scale-95 border border-white/10">
              选择本地文件
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'design')} />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 inline-block p-5 bg-emerald-50 rounded-3xl text-emerald-600 shadow-inner">
              <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth={1.5}/></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">第 2 步：上传实现截图</h2>
            <p className="text-slate-500 mb-10 max-w-md mx-auto font-medium">上传开发实现的页面截图，我们将自动寻找其与设计稿的微小偏离。</p>
            <label className="cursor-pointer bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:bg-emerald-500 transition-all inline-block active:scale-95 border border-white/10">
              开始上传截图
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'dev')} />
            </label>
            <button onClick={() => setStep(1)} className="block mx-auto mt-6 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors">← 返回重新上传设计稿</button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center w-full animate-in fade-in duration-500">
            <div className="flex gap-10 justify-center mb-12">
               <div className="group">
                  <div className="w-36 h-48 border-4 border-white rounded-2xl overflow-hidden shadow-2xl transition-transform group-hover:-rotate-3 group-hover:scale-105 duration-300">
                    {project.designImage && <img src={project.designImage} className="object-cover w-full h-full" alt="设计稿" />}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 block">DESIGN</span>
               </div>
               <div className="flex items-center text-slate-200">
                  <div className="bg-slate-50 p-3 rounded-full animate-pulse shadow-inner">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth={3}/></svg>
                  </div>
               </div>
               <div className="group">
                  <div className="w-36 h-48 border-4 border-white rounded-2xl overflow-hidden shadow-2xl transition-transform group-hover:rotate-3 group-hover:scale-105 duration-300">
                    {project.devImage && <img src={project.devImage} className="object-cover w-full h-full" alt="实现截图" />}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 block">REALITY</span>
               </div>
            </div>

            {isAnalyzing ? (
              <div className="space-y-6">
                <div className="relative h-2 w-64 mx-auto bg-slate-100 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-indigo-600 animate-[loading_1.5s_infinite]"></div>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-800 font-black text-lg">Gemini 3 Flash 深度扫描中...</p>
                  <p className="text-slate-400 text-xs italic">正在精确计算间距差异与视觉不一致点</p>
                </div>
              </div>
            ) : error ? (
              <div className="space-y-6">
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 max-w-sm mx-auto">
                   <p className="text-red-600 text-sm font-bold">{error}</p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <button onClick={runAnalysis} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all">重试 AI 扫描</button>
                  <button onClick={() => setStep(2)} className="text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest">重新上传截图</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 mb-2">准备就绪</h2>
                <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">两份视图已同步。AI 现在将通过像素级分析找出所有不一致之处。</p>
                <button 
                  onClick={runAnalysis}
                  className="bg-indigo-600 text-white px-12 py-5 rounded-3xl font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-500 hover:scale-105 transition-all active:scale-95"
                >
                  🚀 启动 AI 自动比对
                </button>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="text-center w-full animate-in zoom-in duration-500">
             <div className="mb-10 relative">
               <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-20 animate-pulse"></div>
               <div className="relative inline-block p-6 bg-emerald-50 rounded-[2.5rem] text-emerald-600 shadow-inner">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={1.5} /></svg>
               </div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">分析扫描完成</h2>
            <p className="text-slate-500 mb-12 font-medium">AI 成功识别了 <span className="text-indigo-600 font-black text-xl mx-1">{project.issues.length}</span> 处潜在的视觉差异。</p>
            <div className="flex flex-col gap-4 items-center">
              <button 
                onClick={onStartAudit}
                className="bg-slate-900 text-white px-14 py-5 rounded-3xl font-black text-lg shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
              >
                进入走查视图控制台
              </button>
              <button 
                onClick={() => setStep(3)} 
                className="text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors py-2"
              >
                重新运行 AI 深度分析
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes loading {
          0% { left: -100%; width: 50%; }
          50% { left: 0%; width: 100%; }
          100% { left: 100%; width: 50%; }
        }
      `}</style>
    </div>
  );
};

export default AuditWorkflow;
