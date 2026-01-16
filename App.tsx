
import React, { useState } from 'react';
import { Project, ProjectStatus } from './types';
import ProjectList from './components/ProjectList';
import AuditWorkflow from './components/AuditWorkflow';
import DifferenceAuditView from './components/DifferenceAuditView';

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
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'audit'>('list');

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
          onSelectProject={(id) => { setActiveProjectId(id); setView('detail'); }}
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
          onBack={() => setView('detail')}
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
