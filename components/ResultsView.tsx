
import React, { useState } from 'react';
import type { InspirationCase, CreativeProposal } from '../types';
import LoadingSpinner from './LoadingSpinner';

// A simple markdown renderer
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const html = text
        .replace(/\n/g, '<br />')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const HistoricalVersionModal: React.FC<{ 
    proposal: Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'>, 
    onClose: () => void,
    onPromoteAndExecute: (versionToPromote: Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'>) => Promise<void>,
    isProcessing: boolean
}> = ({ proposal, onClose, onPromoteAndExecute, isProcessing }) => {
    const [isExecuting, setIsExecuting] = useState(false);

    const handlePromote = async () => {
        if(window.confirm(`您确定要选择 V${proposal.version} 作为最终版本并生成执行方案吗？这将会创建一个新的版本。`)) {
            setIsExecuting(true);
            await onPromoteAndExecute(proposal);
            setIsExecuting(false);
            onClose();
        }
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-8 max-w-2xl w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-400">{`版本 ${proposal.version}: ${proposal.conceptTitle}`}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>
                 <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 mb-6">
                    <div>
                        <h4 className="font-semibold text-gray-200">核心创意</h4>
                        <p className="text-gray-300">{proposal.coreIdea}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-200">创意详述</h4>
                        <p className="text-gray-300">{proposal.detailedDescription}</p>
                    </div>
                    <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700">
                        <h4 className="font-semibold text-gray-200">应用示例</h4>
                        <p className="text-gray-300 italic">"{proposal.example}"</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-200">为什么会奏效</h4>
                        <p className="text-gray-300">{proposal.whyItWorks}</p>
                    </div>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-700">
                     <button 
                        onClick={handlePromote} 
                        disabled={isProcessing || isExecuting} 
                        className="w-full px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                     >
                      {isExecuting ? <><LoadingSpinner className="w-4 h-4 mr-2"/>正在处理...</> : `选用 V${proposal.version} 并执行`}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ProposalCard: React.FC<{ 
  proposal: CreativeProposal; 
  index: number; 
  onOptimize: (proposal: CreativeProposal, feedback: string) => Promise<void>;
  onExecute: (proposal: CreativeProposal) => Promise<void>;
  onPromoteAndExecute: (currentProposal: CreativeProposal, versionToPromote: Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'>) => Promise<void>;
  isProcessing: boolean;
}> = ({ proposal, index, onOptimize, onExecute, onPromoteAndExecute, isProcessing }) => {
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'> | null>(null);
  
  const handleOptimizeClick = () => setShowOptimizer(true);
  const handleCancel = () => {
    setShowOptimizer(false);
    setFeedback('');
  };
  
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    await onOptimize(proposal, feedback);
    setShowOptimizer(false);
    setFeedback('');
  };
  
  const handleExecute = async () => {
      if(window.confirm("确定要将此方案定稿并生成执行细则吗？定稿后将无法再进行优化。")) {
          setIsExecuting(true);
          await onExecute(proposal);
          setIsExecuting(false);
      }
  }

  return (
    <>
    {viewingHistory && (
        <HistoricalVersionModal 
            proposal={viewingHistory} 
            onClose={() => setViewingHistory(null)} 
            onPromoteAndExecute={(version) => onPromoteAndExecute(proposal, version)}
            isProcessing={isProcessing}
        />
    )}
    <div className="bg-gray-800/80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 p-8 transition-shadow duration-300 hover:shadow-purple-500/20">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-blue-400">{`方案 ${index + 1}: ${proposal.conceptTitle}`}</h3>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${proposal.isFinalized ? 'bg-green-500/20 text-green-300' : 'bg-purple-500/20 text-purple-300'}`}>
            V{proposal.version}{proposal.isFinalized ? ' (已定稿)' : ''}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-200">核心创意</h4>
          <p className="text-gray-300">{proposal.coreIdea}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-200">创意详述</h4>
          <p className="text-gray-300">{proposal.detailedDescription}</p>
        </div>
        <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700">
          <h4 className="font-semibold text-gray-200">应用示例</h4>
          <p className="text-gray-300 italic">"{proposal.example}"</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-200">为什么会奏效</h4>
          <p className="text-gray-300">{proposal.whyItWorks}</p>
        </div>
      </div>
      
       {proposal.history && proposal.history.length > 0 && (
         <details className="mt-4">
           <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">查看历史版本</summary>
           <div className="mt-2 space-y-2 p-3 bg-gray-900 rounded-lg">
             {proposal.history.slice().reverse().map(ver => (
               <div key={ver.version} className="p-2 border-b border-gray-700 last:border-b-0">
                 <button onClick={() => setViewingHistory(ver)} className="w-full text-left hover:bg-gray-800/50 p-1 rounded">
                    <p className="font-bold text-sm text-gray-300">V{ver.version}: {ver.conceptTitle}</p>
                    <p className="text-xs text-gray-400 truncate">{ver.coreIdea}</p>
                 </button>
               </div>
             ))}
           </div>
         </details>
       )}

      {proposal.isFinalized && proposal.executionDetails ? (
        <div className="mt-6 p-4 bg-green-900/30 rounded-lg border border-green-500/50">
            <h4 className="font-bold text-lg text-green-300 mb-2">{proposal.executionDetails.title}</h4>
            <div className="text-gray-200 prose prose-sm max-w-none prose-strong:text-gray-100">
               <SimpleMarkdown text={proposal.executionDetails.content} />
            </div>
        </div>
      ) : (
          <>
            {!showOptimizer ? (
             <div className="mt-6 flex justify-end gap-4">
                <button onClick={handleOptimizeClick} disabled={isProcessing || isExecuting} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
                  优化此方案...
                </button>
                 <button onClick={handleExecute} disabled={isProcessing || isExecuting} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center">
                  {isExecuting ? <><LoadingSpinner className="w-4 h-4 mr-2"/>正在生成...</> : '定稿并执行'}
                </button>
            </div>
            ) : (
            <form onSubmit={handleSubmitFeedback} className="mt-6 p-4 bg-gray-900 rounded-lg border border-purple-500/50">
              <label htmlFor={`feedback-${proposal.id}`} className="block text-sm font-medium text-gray-300 mb-2">请输入您的修改意见：</label>
              <textarea 
                id={`feedback-${proposal.id}`}
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-1 focus:ring-purple-400"
                placeholder="例如: “这个想法不错，但能让文案更幽默一点吗？”"
              />
              <div className="flex justify-end gap-3 mt-3">
                <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500">取消</button>
                <button type="submit" disabled={isProcessing || !feedback.trim()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center">
                  {isProcessing ? <><LoadingSpinner className="w-4 h-4 mr-2"/> 正在优化...</> : '提交优化'}
                </button>
              </div>
            </form>
            )}
          </>
      )}
    </div>
    </>
  );
};

interface ResultsViewProps {
  inspirations: InspirationCase[];
  proposals: CreativeProposal[];
  onFinish: () => void;
  onOptimize: (proposal: CreativeProposal, feedback: string) => Promise<void>;
  onExecute: (proposal: CreativeProposal) => Promise<void>;
  onPromoteAndExecute: (currentProposal: CreativeProposal, versionToPromote: Omit<CreativeProposal, 'history'|'isFinalized'|'executionDetails'>) => Promise<void>;
  isProcessing: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ inspirations, proposals, onFinish, onOptimize, onExecute, onPromoteAndExecute, isProcessing }) => {
  return (
    <div className="space-y-16 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">全球灵感探索</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {inspirations.map((item, index) => (
            <div key={index} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 transform hover:-translate-y-2 transition-transform duration-300">
              <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover"/>
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-100">{item.title}</h3>
                <p className="text-sm text-purple-300 mt-2">✨ 创意亮点:</p>
                <p className="text-gray-300 mt-1">{item.highlight}</p>
                 {item.sourceUrl && (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs mt-3 inline-block">
                    查看来源 &rarr;
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">为您生成的创意方案</h2>
        <div className="space-y-8">
          {proposals.map((proposal, index) => (
            <ProposalCard 
              key={proposal.id + proposal.version} 
              proposal={proposal} 
              index={index} 
              onOptimize={onOptimize} 
              onExecute={onExecute} 
              onPromoteAndExecute={onPromoteAndExecute}
              isProcessing={isProcessing} 
            />
          ))}
        </div>
      </div>
      
      <div className="text-center pt-8">
        <button
            onClick={onFinish}
            className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
           完成并保存
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
