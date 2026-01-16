
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus } from './types';
import ProjectList from './components/ProjectList';
import AuditWorkflow from './components/AuditWorkflow';
import DifferenceAuditView from './components/DifferenceAuditView';

const STORAGE_KEY = 'pixelguard_projects_v1';

const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: '登录页面视觉改版 V2',
    status: ProjectStatus.PENDING_AUDIT,
    updatedAt: new Date().toISOString(),
    issues: [],
  },
  {
    id: 'p2',
    name: '官网首页大改版',
    status: ProjectStatus.COMPLETED,
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    issues: [],
    score: 82
  }
];

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_PROJECTS;
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'audit'>('list');

  // 持久化存储
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleCreateProject = () => {
    const newProject: Project = {
      id: `p-${Date.now()}`,
      name: '未命名走查项目',
      status: ProjectStatus.DRAFT,
      updatedAt: new Date().toISOString(),
      issues: [],
    };
    setProjects([newProject, ...projects]);
    setActiveProjectId(newProject.id);
    setView('detail');
  };

  const handleUpdateProject = (updates: Partial<Project>) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ));
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('确定要删除这个项目吗？所有相关的走查记录和图片数据都将被永久移除。')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
        setView('list');
      }
    }
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    const project = projects.find(p => p.id === id);
    if (project) {
      // 如果已经有走查结果（无论是在进行中还是已完成），直接进入走查视图
      if ((project.issues && project.issues.length > 0) || project.status === ProjectStatus.COMPLETED) {
        setView('audit');
      } else {
        setView('detail');
      }
    }
  };

  const navigateToList = () => {
    setActiveProjectId(null);
    setView('list');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      {view === 'list' && (
        <ProjectList 
          projects={projects} 
          onSelectProject={handleSelectProject}
          onDeleteProject={handleDeleteProject}
          onCreateProject={handleCreateProject}
        />
      )}

      {view === 'detail' && activeProject && (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={navigateToList} className="text-slate-400 hover:text-indigo-600 transition-colors" title="回到列表">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2}/></svg>
              </button>
              <h1 className="text-xl font-bold text-slate-900">{activeProject.name}</h1>
            </div>
            {activeProject.status === ProjectStatus.PENDING_AUDIT && (
              <button 
                onClick={() => setView('audit')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:bg-indigo-700 transition-all"
              >
                进入走查视图
              </button>
            )}
          </header>
          <div className="flex-1 overflow-y-auto">
             <AuditWorkflow 
              project={activeProject} 
              onUpdateProject={handleUpdateProject}
              onStartAudit={() => setView('audit')}
            />
          </div>
        </div>
      )}

      {view === 'audit' && activeProject && (
        <DifferenceAuditView 
          project={activeProject}
          onUpdateIssues={(issues) => handleUpdateProject({ issues })}
          onBack={navigateToList}
          onFinish={() => {
            handleUpdateProject({ status: ProjectStatus.COMPLETED });
            navigateToList();
          }}
        />
      )}
    </div>
  );
};

export default App;
