export enum Stage {
  LOGIN,
  HOME, // New default screen after login
  PROJECT_DASHBOARD,
  PROJECT_DETAILS,
  BRIEF_INPUT,
  BRIEF_REFINEMENT,
  GENERATING,
  RESULTS,
  SETTINGS, // 用户设置页面
}

export type CreativeType = "Slogan" | "社交媒体文案" | "平面设计" | "视频创意" | "公关活动" | "品牌命名";

export interface Brief {
  text: string;
  type: CreativeType;
}

export interface RefinementData {
  summary: string;
  questions: string[];
}

export interface InspirationCase {
  title: string;
  highlight: string;
  imageUrl: string;
  sourceUrl?: string;
  // 新增字段用于提升相关性
  category?: string;              // 创意分类（如：Slogan、平面设计等）
  relevanceScore?: number;        // 相关性评分 0-100
  detailedDescription?: string;   // 案例详细描述
  keyInsights?: string;           // 核心洞察
  targetAudience?: string;        // 目标人群
  industry?: string;              // 所属行业
}

export interface ExecutionDetails {
    title: string;
    content: string;
}

export interface CreativeProposal {
  id: string; 
  conceptTitle: string;
  coreIdea: string;
  detailedDescription: string;
  example: string;
  whyItWorks: string;
  version: number;
  history?: Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'>[];
  isFinalized: boolean;
  executionDetails: ExecutionDetails | null;
}

export type GeneratingStatus = "analyzing" | "inspiring" | "creating" | "finished";


export interface BriefHistoryItem {
  id: string;
  createdAt: string;
  initialBrief: Brief;
  refinedBriefText: string;
  inspirations: InspirationCase[];
  proposals: CreativeProposal[];
}

export interface Project {
  id:string;
  name: string;
  briefs: BriefHistoryItem[];
}

export type UserRole = 'user' | 'admin';

export type Language = 'zh' | 'en'; // 支持的语言

export interface User {
    username: string;
    projects: Project[];
    role?: UserRole; // 用户角色，默认为普通用户
    avatar?: string; // 头像URL
    language?: Language; // 语言偏好
}