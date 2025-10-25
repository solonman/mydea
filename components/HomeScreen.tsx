
import React, { useState, useEffect } from 'react';
import type { User, Brief, Project } from '../types';
import CreativeBriefInput from './CreativeBriefInput';

interface HomeScreenProps {
  user: User;
  onCreateProject: (projectName: string) => Project;
  onBriefSubmit: (brief: Brief, projectId: string) => void;
  isLoading: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, onCreateProject, onBriefSubmit, isLoading }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Set default project on load
  useEffect(() => {
    if (user.projects && user.projects.length > 0) {
      setSelectedProjectId(user.projects[0].id);
      setShowNewProjectInput(false);
    } else {
      setSelectedProjectId('new');
      setShowNewProjectInput(true); // Show input by default if no projects exist
    }
  }, [user.projects]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedProjectId(value);
    if (value === 'new') {
      setShowNewProjectInput(true);
    } else {
      setShowNewProjectInput(false);
    }
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject = onCreateProject(newProjectName.trim());
      setSelectedProjectId(newProject.id);
      setNewProjectName('');
      setShowNewProjectInput(false);
    }
  };

  const handleSubmitBrief = (brief: Brief) => {
    let projectIdToSubmit = selectedProjectId;

    // Handle case where 'new' is selected and name is typed
    if (selectedProjectId === 'new') {
       if (!newProjectName.trim()) {
           alert("请为您的新项目命名。");
           return;
       }
       const newProject = onCreateProject(newProjectName.trim());
       // Update state to reflect the newly created project
       setSelectedProjectId(newProject.id);
       setNewProjectName('');
       setShowNewProjectInput(false);
       projectIdToSubmit = newProject.id;
    }
    
    if (projectIdToSubmit && projectIdToSubmit !== 'new') {
        onBriefSubmit(brief, projectIdToSubmit);
    }
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in text-center">
        <h2 className="text-3xl font-bold mb-2">你好, {user.username}!</h2>
        <p className="text-gray-400 mb-8">准备好激发下一个绝妙创意了吗？</p>

        {/* Project Selector */}
        <div className="mb-6 bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-center gap-4 max-w-2xl mx-auto">
            <label htmlFor="project-select" className="text-gray-300 font-medium flex-shrink-0">归属项目:</label>
            <select
                id="project-select"
                value={selectedProjectId}
                onChange={handleProjectChange}
                className="flex-grow w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500"
            >
                {user.projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="new">+ 新建项目</option>
            </select>
        </div>

        {showNewProjectInput && (
             <div className="mb-6 flex items-center gap-2 max-w-2xl mx-auto animate-fade-in">
                <input 
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="输入新项目名称..."
                    className="flex-grow w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
                 {selectedProjectId === 'new' && (
                    <button 
                        onClick={handleCreateProject} 
                        className="px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
                        title="创建项目"
                    >
                        创建
                    </button>
                 )}
             </div>
        )}

        {/* Creative Brief Input */}
        <CreativeBriefInput onSubmit={handleSubmitBrief} isLoading={isLoading} />
    </div>
  );
};

export default HomeScreen;
