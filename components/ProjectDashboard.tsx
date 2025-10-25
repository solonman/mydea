import React, { useState } from 'react';
import type { User } from '../types';

interface ProjectDashboardProps {
  user: User;
  onCreateProject: (projectName: string) => void;
  onViewProject: (projectId: string) => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ user, onCreateProject, onViewProject }) => {
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
    }
  };
  
  const projects = user.projects;

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-4">欢迎回来, {user.username}!</h2>
      <p className="text-center text-gray-400 mb-10">在这里管理您的创意项目</p>
      
      {/* New Project Form */}
      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700 mb-10">
        <form onSubmit={handleCreateProject} className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="输入新项目名称..."
            className="flex-grow w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500"
            aria-label="New project name"
          />
          <button
            type="submit"
            disabled={!newProjectName.trim()}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50"
          >
            创建新项目
          </button>
        </form>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">您的项目</h3>
        {projects && projects.length > 0 ? (
          projects.map(project => (
            <div key={project.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-purple-500/50 transition-colors">
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-100">{project.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{project.briefs.length} 个创意任务</p>
              </div>
              <button 
                onClick={() => onViewProject(project.id)}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                查看详情
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 px-6 bg-gray-800 rounded-xl border border-dashed border-gray-600">
            <h3 className="text-xl font-semibold text-gray-300">还没有项目</h3>
            <p className="text-gray-500 mt-2">创建一个新项目来开始您的第一个创意吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;
