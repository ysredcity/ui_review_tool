
import React from 'react';
import { Project, ProjectStatus } from '../types';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateProject: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onDeleteProject, onCreateProject }) => {
  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">项目走查</h1>
          <p className="text-slate-500 mt-1">管理并追踪您的 UI 还原度检查项目。</p>
        </div>
        <button
          onClick={onCreateProject}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建项目
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">项目名称</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">状态</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">最后更新</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                  暂无项目，开始您的第一次 UI 走查吧！
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">{project.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === ProjectStatus.COMPLETED 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => onSelectProject(project.id)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm group-hover:underline"
                      >
                        查看详情 →
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                        className="text-slate-300 hover:text-red-600 transition-colors p-1"
                        title="删除项目"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectList;
