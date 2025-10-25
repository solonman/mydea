export enum Stage {
  LOGIN,
  HOME, // New default screen after login
  PROJECT_DASHBOARD,
  PROJECT_DETAILS,
  BRIEF_INPUT,
  BRIEF_REFINEMENT,
  GENERATING,
  RESULTS,
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

export interface User {
    username: string;
    projects: Project[];
}