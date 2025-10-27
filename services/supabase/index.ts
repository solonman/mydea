/**
 * Supabase 服务统一导出
 * 
 * 使用示例:
 * import { createUser, createProject, createBrief } from './services/supabase';
 */

// 客户端
export { supabase } from './client';
export type { Database, TypedSupabaseClient } from './client';

// 认证服务
export {
  signUpWithEmail,
  signInWithEmail,
  resendVerificationEmail,
  getWeChatLoginUrl,
  handleWeChatCallback,
  signOut,
  getCurrentAuthUser,
  onAuthStateChange,
} from './authService';
export type {
  EmailSignUpInput,
  EmailSignInInput,
  AuthUser,
  WeChatConfig,
} from './authService';

// 用户服务
export {
  createUser,
  getUserByUsername,
  getUserById,
  updateUser,
  getOrCreateUser,
  deleteUser,
} from './userService';
export type { User, CreateUserInput, UpdateUserInput } from './userService';

// 项目服务
export {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  permanentlyDeleteProject,
  getProjectStats,
} from './projectService';
export type { 
  Project, 
  ProjectStatus, 
  CreateProjectInput, 
  UpdateProjectInput 
} from './projectService';

// 创意任务服务
export {
  createBrief,
  getBriefs,
  getBriefById,
  updateBrief,
  updateBriefProposals,
  archiveBrief,
  deleteBrief,
  getBriefStats,
} from './briefService';
export type {
  DbBrief,
  BriefStatus,
  CreateBriefInput,
  UpdateBriefInput,
} from './briefService';
