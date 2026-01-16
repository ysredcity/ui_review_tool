
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { analyzeUIComparison } from '../services/geminiService';

interface AuditWorkflowProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onStartAudit: () => void;
}

const AuditWorkflow: React.FC<AuditWorkflowProps> = ({ project, onUpdateProject, onStartAudit }) => {
  // 根据项目当前状态初始化步骤
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
        issues: results.map((r: any, idx: number) => ({ ...r, id: `ai-${idx}` })),
        status: ProjectStatus.PENDING_AUDIT
      });
      setStep(4);
    } catch (err) {
      setError("AI 分析失败。请检查 API Key 配置及网络连接。");
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${
                step >= s.num ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {s.num}
              </div>
              <span className={`mt-2 text-xs font-medium ${step >= s.num ? 'text-indigo-600' : 'text-slate-400'}`}>
                {s.title}
              </span>
              {s.num < 4 && (
                <div className={`absolute top-5 left-1/2 w-full h-[2px] ${step > s.num ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 min-h-[400px] flex flex-col items-center justify-center transition-all">
        {step === 1 && (
          <div className="text-center w-full">
            <div className="mb-6 inline-block p-4 bg-indigo-50 rounded-full text-indigo-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">第 1 步：上传设计稿</h2>
            <p className="text-slate-500 mb-8">请上传高保真设计图（如 Figma/Sketch 导出图）。</p>
            <label className="cursor-pointer bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all inline-block">
              选择文件
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'design')} />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="text-center w-full">
            <div className="mb-6 inline-block p-4 bg-emerald-50 rounded-full text-emerald-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">第 2 步：上传开发截图</h2>
            <p className="text-slate-500 mb-8">请上传实际开发的页面截图。</p>
            <label className="cursor-pointer bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all inline-block">
              选择截图
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'dev')} />
            </label>
            <button onClick={() => setStep(1)} className="block mx-auto mt-4 text-slate-400 hover:text-slate-600 text-sm">返回上一步</button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center w-full">
            <div className="flex gap-8 justify-center mb-10">
               <div className="text-center">
                  <div className="w-32 h-40 border rounded overflow-hidden bg-slate-100 mb-2 relative">
                    {project.designImage && <img src={project.designImage} className="object-cover w-full h-full" alt="设计稿" />}
                  </div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">设计标准</span>
               </div>
               <div className="flex items-center text-slate-200">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth={2}/></svg>
               </div>
               <div className="text-center">
                  <div className="w-32 h-40 border rounded overflow-hidden bg-slate-100 mb-2 relative">
                    {project.devImage && <img src={project.devImage} className="object-cover w-full h-full" alt="开发实现" />}
                  </div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">实现截图</span>
               </div>
            </div>

            {isAnalyzing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
                <p className="text-slate-600 font-medium">Gemini AI 正在深度扫描视觉差异...</p>
                <p className="text-slate-400 text-sm italic">正在分析间距、颜色及文字排版细节...</p>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <p className="text-red-500 font-medium">{error}</p>
                <button onClick={runAnalysis} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold">重试 AI 分析</button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800">已就绪</h2>
                <p className="text-slate-500 mb-8">点击下方按钮，开始自动检测 UI 不一致之处。</p>
                <button 
                  onClick={runAnalysis}
                  className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"
                >
                  开始比对分析
                </button>
                <button onClick={() => setStep(2)} className="block mx-auto mt-2 text-slate-400 hover:text-slate-600 text-xs">重新上传截图</button>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="text-center w-full">
             <div className="mb-6 inline-block p-4 bg-indigo-50 rounded-full text-indigo-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">分析完成！</h2>
            <p className="text-slate-500 mb-8">AI 发现了 <span className="text-indigo-600 font-bold">{project.issues.length}</span> 处潜在差异。</p>
            <div className="flex flex-col gap-3 items-center">
              <button 
                onClick={onStartAudit}
                className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                进入走查视图
              </button>
              <button 
                onClick={() => setStep(3)} 
                className="text-slate-400 hover:text-indigo-600 text-sm font-medium"
              >
                重新运行分析
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditWorkflow;
