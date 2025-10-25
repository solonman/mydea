import React, { useState } from 'react';
import type { Brief, RefinementData } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface BriefRefinementProps {
  brief: Brief;
  refinementData: RefinementData;
  onSubmit: (answers: string) => void;
  isLoading: boolean;
}

const BriefRefinement: React.FC<BriefRefinementProps> = ({ brief, refinementData, onSubmit, isLoading }) => {
  const [answers, setAnswers] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onSubmit(answers);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700 animate-fade-in">
      <h2 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">智能需求分析与确认</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">您的初步需求 ({brief.type}):</h3>
          <p className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 text-gray-200 italic">"{brief.text}"</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">我的理解:</h3>
          <p className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 text-gray-200">{refinementData.summary}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">为了更好的创意，请您补充一些信息:</h3>
          <ul className="list-disc list-inside space-y-2 text-purple-300 mb-4 pl-2">
            {refinementData.questions.map((q, i) => (
              <li key={i}><span className="text-gray-200">{q}</span></li>
            ))}
          </ul>
          <textarea
            rows={5}
            value={answers}
            onChange={(e) => setAnswers(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow duration-200 placeholder-gray-500"
            placeholder="请在此处回答以上问题，信息越详细，创意越精准..."
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? <LoadingSpinner /> : '确认并生成灵感'}
        </button>
      </div>
    </div>
  );
};

export default BriefRefinement;
