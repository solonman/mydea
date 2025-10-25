import React, { useState } from 'react';
import type { Brief, CreativeType } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface CreativeBriefInputProps {
  onSubmit: (brief: Brief) => void;
  isLoading: boolean;
}

const CREATIVE_TYPES: CreativeType[] = ["Slogan", "社交媒体文案", "平面设计", "视频创意", "公关活动", "品牌命名"];

const CreativeBriefInput: React.FC<CreativeBriefInputProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [selectedType, setSelectedType] = useState<CreativeType>('Slogan');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSubmit({ text, type: selectedType });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700">
      <form onSubmit={handleSubmit}>
        <label htmlFor="creative-brief" className="block text-xl font-medium text-gray-100 mb-4">
          请告诉我你的创意需求是什么？
        </label>
        <textarea
          id="creative-brief"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow duration-200 placeholder-gray-500"
          placeholder="例如：为我的咖啡品牌 “WakeUp” 写一个新的 Slogan，它主打高品质阿拉比卡豆和城市白领市场。"
        />
        
        <div className="mt-6">
          <p className="text-md font-medium text-gray-300 mb-3">选择创意类型：</p>
          <div className="flex flex-wrap gap-3">
            {CREATIVE_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 text-sm rounded-full transition-all duration-200 ${
                  selectedType === type
                    ? 'bg-purple-600 text-white font-semibold shadow-lg ring-2 ring-purple-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? <LoadingSpinner /> : '生成创意'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreativeBriefInput;