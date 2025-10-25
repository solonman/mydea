import React from 'react';
import type { Project, BriefHistoryItem } from '../types';

interface ProjectDetailsProps {
    project: Project;
    onStartNewBrief: (projectId: string) => void;
    onViewBrief: (brief: BriefHistoryItem) => void;
    onDeleteBrief: (projectId: string, briefId: string) => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onStartNewBrief, onViewBrief, onDeleteBrief }) => {

    const handleDelete = (briefId: string) => {
        if (window.confirm("您确定要删除这个创意任务及其所有方案吗？此操作无法撤销。")) {
            onDeleteBrief(project.id, briefId);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-700">
                <div>
                    <h2 className="text-3xl font-bold">{project.name}</h2>
                    <p className="text-gray-400">项目下的所有创意任务</p>
                </div>
                 <button 
                    onClick={() => onStartNewBrief(project.id)}
                    className="mt-4 sm:mt-0 w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg"
                >
                    + 开启新创意
                </button>
            </div>
            
            <div className="space-y-4">
                {project.briefs && project.briefs.length > 0 ? (
                    project.briefs.slice().reverse().map(brief => (
                        <div key={brief.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col sm:flex-row justify-between items-start gap-4">
                           <div className="flex-grow">
                             <p className="font-semibold text-purple-300 text-sm">{brief.initialBrief.type}</p>
                             <p className="text-lg text-gray-200 truncate">{brief.initialBrief.text}</p>
                             <p className="text-xs text-gray-500 mt-1">创建于: {new Date(brief.createdAt).toLocaleString()}</p>
                           </div>
                           <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                                <button onClick={() => onViewBrief(brief)} className="w-1/2 sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">查看</button>
                                <button onClick={() => handleDelete(brief.id)} className="w-1/2 sm:w-auto px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors">删除</button>
                           </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 px-6 bg-gray-800/50 rounded-xl border border-dashed border-gray-600">
                        <h3 className="text-xl font-semibold text-gray-300">该项目下暂无创意任务</h3>
                        <p className="text-gray-500 mt-2">点击“开启新创意”来开始吧！</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProjectDetails;