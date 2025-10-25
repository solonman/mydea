
import React from 'react';
import { GeneratingStatus } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface GeneratingViewProps {
  status: GeneratingStatus;
}

const statusMessages: Record<GeneratingStatus, string> = {
  analyzing: "正在分析您的需求...",
  inspiring: "正在全球范围内搜索灵感...",
  creating: "正在为您量身打造创意方案...",
  finished: "生成完毕！"
};

const GeneratingView: React.FC<GeneratingViewProps> = ({ status }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 animate-fade-in">
      <LoadingSpinner className="w-16 h-16" />
      <h2 className="text-2xl font-bold mt-8 text-gray-100">{statusMessages[status]}</h2>
      <p className="text-gray-400 mt-2">请稍候，顶级的创意需要一点时间酝酿。</p>
      
      <div className="w-full max-w-md mt-10">
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-900/50">
            <div
              style={{ width: `${status === 'analyzing' ? '10%' : status === 'inspiring' ? '40%' : '80%'}` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratingView;
