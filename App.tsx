  import React, { useState, useCallback, useEffect } from 'react';
import { Stage, Brief, RefinementData, InspirationCase, CreativeProposal, GeneratingStatus, Project, BriefHistoryItem, User, Language } from './types';
import { LanguageContext } from './i18n/useLanguage';
import { t } from './i18n/useLanguage';
import Header from './components/Header';
import BriefRefinement from './components/BriefRefinement';
import GeneratingView from './components/GeneratingView';
import UserSettings from './components/UserSettings';
import ResultsView from './components/ResultsView';
import LoginScreen from './components/LoginScreen';
import ProjectDashboard from './components/ProjectDashboard';
import ProjectDetails from './components/ProjectDetails';
import HomeScreen from './components/HomeScreen';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import * as db from './services/databaseService';
import { 
  getOrCreateUser, 
  signUpWithEmail,
  signInWithEmail,
  getWeChatLoginUrl,
  getCurrentAuthUser,
  onAuthStateChange,
  signOut as supabaseSignOut,
  type User as SupabaseUser,
  type AuthUser 
} from './services/supabase';
import { logger } from './utils/errors';
import { refineBrief, generateCreativePackage, optimizeProposal, generateExecutionPlan } from './services/geminiService';
import { cleanCreativeProposal, cleanProposalArray, cleanRefinementExpression } from './utils/dataCleanup';

  const App: React.FC = () => {
    const [stage, setStage] = useState<Stage>(Stage.LOGIN);
    const [language, setLanguage] = useState<Language>('zh');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [isAppInitialized, setIsAppInitialized] = useState(false); // 应用初始化标记
    
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeBriefId, setActiveBriefId] = useState<string | null>(null);
    const [returnToProjectId, setReturnToProjectId] = useState<string | null>(null); // 记录需要返回的项目 ID

    const [currentRun, setCurrentRun] = useState<Partial<BriefHistoryItem> | null>(null);
    const [refinementData, setRefinementData] = useState<RefinementData | null>(null);
    const [generatingStatus, setGeneratingStatus] = useState<GeneratingStatus>('analyzing');
    
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [showTermsOfService, setShowTermsOfService] = useState(false);
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
    
    // Session check on initial render - 仅执行一次
    useEffect(() => {
      // 防止应用在标签页失焦后重复初始化
      if (isAppInitialized) {
        return;
      }
      
      // 检查是否有 Supabase 认证会话
      const checkAuth = async () => {
        try {
          const user = await getCurrentAuthUser();
          if (user) {
            setAuthUser(user);
            // 从用户元数据中获取用户名
            const username = user.user_metadata.username || user.email.split('@')[0];
            await handleAutoLogin(username, user.id);
          } else {
            // 尝试 localStorage
            const sessionUser = db.getSessionUser();
            if (sessionUser) {
              setCurrentUser(sessionUser);
              // 从用户设置中读取语言偏好
              if (sessionUser.language) {
                setLanguage(sessionUser.language);
              }
              setStage(Stage.HOME);
            }
          }
        } catch (error) {
          logger.error('Auth check failed', error as Error);
        } finally {
          // 标记初始化已完成，防止重复执行
          setIsAppInitialized(true);
        }
      };

      checkAuth();

      // 监听认证状态变化
      const unsubscribe = onAuthStateChange(async (user) => {
        setAuthUser(user);
        if (user) {
          const username = user.user_metadata.username || user.email.split('@')[0];
          await handleAutoLogin(username, user.id);
        } else {
          setCurrentUser(null);
          setSupabaseUser(null);
          setStage(Stage.LOGIN);
        }
      });

      return () => unsubscribe();
    }, [isAppInitialized]);

    // Load user from Supabase when user logs in
    useEffect(() => {
      if (supabaseUser && currentUser) {
        logger.info('User logged in with Supabase', { 
          userId: supabaseUser.id, 
          username: supabaseUser.username 
        });
      }
    }, [supabaseUser, currentUser]);

    const resetState = () => {
      setActiveProjectId(null);
      setActiveBriefId(null);
      setCurrentRun(null);
      setRefinementData(null);
      setError(null);
      setIsLoading(false);
      setReturnToProjectId(null); // 清除返回项目 ID
    };
    
    // 自动登录（从认证会话恢复）
    const handleAutoLogin = async (username: string, authUserId: string) => {
      try {
        // 获取 Supabase 用户
        const sbUser = await getOrCreateUser(username);
        setSupabaseUser(sbUser);
        
        // 获取 localStorage 用户
        const user = db.getUser(username);
        if (user) {
          setCurrentUser(user);
          db.setSessionUser(user);
          // 从用户设置中读取语言偏好
          if (user.language) {
            setLanguage(user.language);
          }
        } else {
          const newUser = db.createUser(username);
          setCurrentUser(newUser);
          db.setSessionUser(newUser);
        }
        
        setStage(Stage.HOME);
        logger.info('User auto-logged in', { username, authUserId });
      } catch (error: any) {
        logger.error('Auto-login failed', error);
      }
    };

    // 邮箱注册
    const handleEmailSignUp = async (email: string, password: string, username: string) => {
      try {
        setIsLoading(true);
        setError(null);
        
        logger.info('User attempting email signup', { email, username });
        
        const authUser = await signUpWithEmail({ email, password, username });
        setAuthUser(authUser);
        
        // 显示验证提示
        if (!authUser.email_confirmed_at) {
          setError('注册成功！请检查您的邮箱并点击验证链接。');
          return;
        }
        
        // 如果邮箱已验证，直接登录
        await handleAutoLogin(username, authUser.id);
        
      } catch (error: any) {
        logger.error('Email signup failed', error);
        setError(error.userMessage || '注册失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };

    // 邮箱登录
    const handleEmailSignIn = async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);
        
        logger.info('User attempting email signin', { email });
        
        const authUser = await signInWithEmail({ email, password });
        setAuthUser(authUser);
        
        // 检查邮箱是否验证
        if (!authUser.email_confirmed_at) {
          setError('请先验证您的邮箱后再登录。');
          return;
        }
        
        const username = authUser.user_metadata.username || email.split('@')[0];
        await handleAutoLogin(username, authUser.id);
        
      } catch (error: any) {
        logger.error('Email signin failed', error);
        setError(error.userMessage || '登录失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };

    // 微信登录
    const handleWeChatLogin = () => {
      try {
        logger.info('Initiating WeChat login');
        
        // 获取微信登录 URL
        const wechatUrl = getWeChatLoginUrl({
          appId: import.meta.env.VITE_WECHAT_APP_ID || 'YOUR_WECHAT_APP_ID',
          redirectUri: `${window.location.origin}/auth/wechat/callback`,
          state: crypto.randomUUID(),
        });
        
        // 跳转到微信扫码页面
        window.location.href = wechatUrl;
        
      } catch (error: any) {
        logger.error('WeChat login initiation failed', error);
        setError('微信登录开启失败，请重试');
      }
    };

    const handleLogout = async () => {
      logger.info('User logging out', { username: currentUser?.username });
      
      // 清理 Supabase 认证
      if (authUser) {
        try {
          await supabaseSignOut();
        } catch (error) {
          logger.error('Supabase signout failed', error as Error);
        }
      }
      
      // 清理本地存储
      db.clearSession();
      setCurrentUser(null);
      setSupabaseUser(null);
      setAuthUser(null);
      resetState();
      setStage(Stage.LOGIN);
    };
    
    const handleCreateProject = (projectName: string): Project => {
      if (currentUser) {
        const { updatedUser, newProject } = db.addProject(currentUser.username, projectName);
        setCurrentUser(updatedUser);
        return newProject;
      }
      throw new Error("No current user");
    };

    const handleDeleteBrief = (projectId: string, briefId: string) => {
      try {
        if (currentUser) {
          // 只有当项目存在于本地用户对象时才删除本地数据
          const projectExists = currentUser.projects.some(p => p.id === projectId);
          if (projectExists) {
            const updatedUser = db.deleteBrief(currentUser.username, projectId, briefId);
            setCurrentUser(updatedUser);
          } else {
            // 项目不在本地（可能是从 Supabase 加载的），不删除本地数据
            console.log('Project not in local database, skipping local deletion');
          }
        }
      } catch (error) {
        console.error('Failed to delete brief locally:', error);
        // 不中断，Supabase 删除会在 ProjectDetails 中处理
      }
    };
    
    const handleViewProject = (projectId: string) => {
      setActiveProjectId(projectId);
      setStage(Stage.PROJECT_DETAILS);
    };
    
    const handleNavigateToDashboard = () => {
      // No longer resets state, allowing return to home easily
      setStage(Stage.PROJECT_DASHBOARD);
    }

    const handleStartNewBriefFromProject = (projectId: string) => {
      setReturnToProjectId(projectId); // 记录返回的项目 ID
      setActiveProjectId(projectId);
      setStage(Stage.HOME);
    };

    const handleBriefSubmit = useCallback(async (submittedBrief: Brief, projectId: string) => {
      setIsLoading(true);
      setError(null);
      
      const newBriefId = crypto.randomUUID();
      setActiveBriefId(newBriefId);
      setActiveProjectId(projectId);
      setCurrentRun({ id: newBriefId, createdAt: new Date().toISOString(), initialBrief: submittedBrief });
      setStage(Stage.BRIEF_REFINEMENT);

      try {
        // Get project name for context
        const project = currentUser?.projects.find(p => p.id === projectId);
        const projectName = project?.name;
        const result = await refineBrief(submittedBrief.text, submittedBrief.type, projectName);
        setRefinementData(result);
      } catch (e) {
        console.error(e);
        setError('抱歉，分析您的需求时出错了。请稍后重试。');
        setStage(Stage.HOME);
      } finally {
        setIsLoading(false);
      }
    }, []);
    
    const handleRefinementSubmit = useCallback(async (answers: string) => {
      if (!currentRun?.initialBrief || !currentUser || !activeProjectId) return;
      setIsLoading(true);
      setError(null);
      setStage(Stage.GENERATING);

      const fullBrief = `Initial Request: ${currentRun.initialBrief.text}\nCreative Type: ${currentRun.initialBrief.type}\nAdditional Details: ${answers}`;
      setCurrentRun(prev => ({ ...prev, refinedBriefText: fullBrief }));

      const project = currentUser.projects.find(p => p.id === activeProjectId);
      const projectContext = project ? `This task is part of the project: "${project.name}".` : '';

      try {
        const { inspirations, proposals } = await generateCreativePackage(fullBrief, currentRun.initialBrief.type, projectContext, setGeneratingStatus);
        const cleanedProposals = cleanProposalArray(proposals);
        const proposalsWithIds: CreativeProposal[] = cleanedProposals.map(p => ({ 
            ...p, 
            id: crypto.randomUUID(),
            version: 1,
            history: [],
            isFinalized: false,
            executionDetails: null
        }));
        const updatedRun = { ...currentRun, inspirations, proposals: proposalsWithIds, refinedBriefText: fullBrief } as BriefHistoryItem;
        setCurrentRun(updatedRun);
        
        // 自动保存初次的生成结果
        try {
          await autoSaveBrief(updatedRun);
        } catch (saveError) {
          // 一样失败也不中断流程，只记录错误
          console.error('Failed to save initial generation:', saveError);
          logger.error('Failed to save initial generation to storage', saveError as Error);
        }
        
        setStage(Stage.RESULTS);
      } catch(e) {
         console.error(e);
         // 检查是否是AI服务过载错误
         if (e instanceof Error && (e.message.includes('503') || e.message.toLowerCase().includes('overloaded'))) {
           setError('抱歉，AI服务当前过载，请稍等几分钟后重试。');
         } else {
           setError('抱歉，生成创意方案时出错了。请返回并重试。');
         }
         setStage(Stage.BRIEF_REFINEMENT);
      } finally {
          setIsLoading(false);
      }
    }, [currentRun, currentUser, activeProjectId]);
    
    const handleOptimizeProposal = async (proposal: CreativeProposal, feedback: string) => {
      if (!currentRun?.proposals || !currentRun.refinedBriefText) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const optimizedData = await optimizeProposal(proposal, feedback, currentRun.refinedBriefText);
        const cleanedOptimized = cleanCreativeProposal(optimizedData);
        // 保存旧版本，整个 history 应该一并保留
        const oldVersion = { ...proposal, history: proposal.history || [], isFinalized: false, executionDetails: null, refinement: undefined };
        const newProposal: CreativeProposal = {
          ...cleanedOptimized,
          id: proposal.id, // Keep same ID
          version: proposal.version + 1,
          history: [ ...(proposal.history || []), oldVersion ],
          isFinalized: false,
          executionDetails: null,
        };

        const updatedProposals = currentRun.proposals.map(p => p.id === proposal.id ? newProposal : p);
        const updatedRun = {... currentRun, proposals: updatedProposals};
        setCurrentRun(updatedRun);
        
        // 自动保存到 localStorage 和 Supabase
        try {
          await autoSaveBrief(updatedRun);
        } catch (saveError) {
          // 一杨失敗也不中断流程，只记录错误
          console.error('Failed to save optimization:', saveError);
          logger.error('Failed to save optimization to storage', saveError as Error);
        }
      } catch(e) {
        console.error(e);
        setError('抱歉，优化方案时出错了，请重试。');
      } finally {
        setIsLoading(false);
      }
    };

    const executeProposal = async (proposalToExecute: CreativeProposal): Promise<CreativeProposal | null> => {
      if (!currentRun?.initialBrief || !currentRun.refinedBriefText) {
         throw new Error('无法执行：缺少创意简报上下文。请尝试重新开始此任务。');
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const executionPlan = await generateExecutionPlan(proposalToExecute, currentRun.initialBrief.type, currentRun.refinedBriefText);
        const finalProposal: CreativeProposal = {
          ...proposalToExecute,
          isFinalized: true,
          executionDetails: executionPlan,
        };
        return finalProposal;
      } catch (e) {
        console.error(e);
        // Re-throw the error to be caught by the calling function
        throw new Error("生成执行方案时出错，请重试。");
      } finally {
        setIsLoading(false);
      }
    };

    const handleFinalizeAndExecute = async (proposal: CreativeProposal) => {
      try {
          const finalProposal = await executeProposal(proposal);
          if (finalProposal && currentRun?.proposals) {
              const updatedProposals = currentRun.proposals.map(p => p.id === proposal.id ? finalProposal : p);
              setCurrentRun(prev => ({ ...prev, proposals: updatedProposals }));
          }
      } catch (e: any) {
          setError(e.message || '生成执行方案时发生未知错误。');
      }
    };

    const handlePromoteAndExecuteVersion = async (currentProposal: CreativeProposal, versionToPromote: Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'>) => {
      if (!currentRun?.proposals) return;

      const newVersionNumber = currentProposal.version + 1;
      const allHistory = [ ...(currentProposal.history || []), { ...currentProposal, history: currentProposal.history, isFinalized: false, executionDetails: null } ];

      const proposalToExecute: CreativeProposal = {
        ...versionToPromote,
        id: currentProposal.id, // Keep the same ID for the proposal "thread"
        version: newVersionNumber,
        history: allHistory,
        isFinalized: false, // will be finalized by executeProposal
        executionDetails: null,
      };
      
      try {
          const finalProposal = await executeProposal(proposalToExecute);
          if (finalProposal) {
             const updatedProposals = currentRun.proposals.map(p => p.id === currentProposal.id ? finalProposal : p);
             setCurrentRun(prev => ({...prev, proposals: updatedProposals }));
          }
      } catch (e: any) {
          setError(e.message || '从历史版本生成执行方案时发生未知错误。');
      }
    };

    // ... existing code ...
    const handleSaveRefinement = async (proposal: CreativeProposal, refinement: any) => {
      if (!currentRun?.proposals) return;

      try {
        setIsLoading(true);
        
        // 清理细化数据以确保所有字符串字段都是字符串
        const cleanedRefinement = cleanRefinementExpression(refinement);
        
        // 判断是否需要备份v1版本
        // 条件：还没有refinementV1，且：
        // 1. 还没有refinement（首次生成），或
        // 2. 当前refinement不是v2版本（表示这是v1原始版本）
        const isFirstGeneration = !proposal.refinement;
        let refinementV1 = proposal.refinementV1;
        
        if (!refinementV1) {
          // 宜一次生成或绑定v1版本，池存一份次作为v1原始版本
          refinementV1 = isFirstGeneration ? cleanedRefinement : proposal.refinement;
        }
        
        // 保存细化内容到当前版本，不创建新版本
        const updatedProposal: CreativeProposal = {
          ...proposal,
          refinement: { ...cleanedRefinement, isUserModified: isFirstGeneration ? false : true },
          refinementV1: refinementV1,  // 保存或维持v1版本
        };

        const updatedProposals = currentRun.proposals.map(p => p.id === proposal.id ? updatedProposal : p);
        const updatedRun = {... currentRun, proposals: updatedProposals};
        setCurrentRun(updatedRun);
        
        // 自动保存到 localStorage 和 Supabase
        try {
          await autoSaveBrief(updatedRun);
        } catch (saveError) {
          // 一杨失敗也不中断流程，只记录错误
          console.error('Failed to save refinement:', saveError);
          logger.error('Failed to save refinement to storage', saveError as Error);
        }
      } catch(e) {
        console.error(e);
        setError('保存细化内容时出错，请重试。');
      } finally {
        setIsLoading(false);
      }
    };
    
    // 自动保存函数
    const autoSaveBrief = async (runData: Partial<BriefHistoryItem>) => {
      if (!currentUser || !activeProjectId || !runData.id) return;
      
      try {
        // 保存到 Supabase（如果已登录）
        if (supabaseUser) {
          try {
            const { createBrief } = await import('./services/supabase');
            await createBrief({
              project_id: activeProjectId,
              initial_brief: runData.initialBrief!,
              refined_brief_text: runData.refinedBriefText!,
              inspirations: runData.inspirations || [],
              proposals: runData.proposals || [],
              status: 'in_progress',
            });
            logger.info('Brief auto-saved to Supabase', { briefId: runData.id });
          } catch (supabaseError) {
            logger.error('Failed to auto-save brief to Supabase', supabaseError as Error);
          }
        }
        
        // 同时保存到 localStorage（向后兼容）
        try {
          if (runData.initialBrief && runData.refinedBriefText && runData.proposals) {
            db.addOrUpdateBrief(currentUser.username, activeProjectId, runData as BriefHistoryItem);
          }
        } catch (localStorageError) {
          logger.error('Failed to auto-save brief to localStorage', localStorageError as Error);
        }
      } catch (error) {
        logger.error('Error during auto-save', error as Error);
      }
    };
    
    const handleFinish = async () => {
      // 先保存项目ID返回信息（在状态更新前保存）
      const shouldReturnToProject = !!returnToProjectId;
      const projectIdToReturn = returnToProjectId;
      
      // 手动重置状态
      setActiveBriefId(null);
      setCurrentRun(null);
      setRefinementData(null);
      setIsLoading(false);
      
      // 根据是否有项目返回 ID 来决定是何页面
      if (shouldReturnToProject && projectIdToReturn) {
        setActiveProjectId(projectIdToReturn);
        setReturnToProjectId(null); // 清除返回标记
        setStage(Stage.PROJECT_DETAILS);
      } else {
        setActiveProjectId(null);
        setReturnToProjectId(null);
        setStage(Stage.HOME);
      }
    };
     
    const handleViewBriefResults = (brief: BriefHistoryItem, projectId: string) => {
        setActiveProjectId(projectId);
        setReturnToProjectId(projectId); // 设置返回项目 ID，保证返回按钮正常工作
        setCurrentRun(brief);
        setActiveBriefId(brief.id);
        setStage(Stage.RESULTS);
    };

    const handleNavigateToSettings = () => {
      setStage(Stage.SETTINGS);
    };

    const handleSaveSettings = async (updatedUser: User) => {
      try {
        // 更新 localStorage 中的用户信息
        const updatedUserInDb = db.updateUser(currentUser!.username, updatedUser);
        setCurrentUser(updatedUserInDb);
        
        // 更新语言状态
        if (updatedUser.language) {
          setLanguage(updatedUser.language);
        }
        
        // 如果已登录 Supabase，也更新 Supabase 中的用户信息
        if (supabaseUser) {
          // TODO: 实现 Supabase 用户信息更新
        }
        
        return updatedUserInDb;
      } catch (error) {
        console.error('保存设置失败:', error);
        throw error;
      }
    };

    const handleBackToHome = () => {
      // 如果当前在项目详情页，返回到项目列表
      if (stage === Stage.PROJECT_DETAILS) {
        setActiveProjectId(null);
        setStage(Stage.PROJECT_DASHBOARD);
        return;
      }
      
      // 如果当前在主页且有返回项目 ID，返回到项目详情页
      if (stage === Stage.HOME && returnToProjectId) {
        setActiveProjectId(returnToProjectId);
        setStage(Stage.PROJECT_DETAILS);
        setReturnToProjectId(null);
        return;
      }
      
      // 如果当前在需求分析页或创意结果页，且有返回项目 ID，返回到项目详情页
      if ((stage === Stage.BRIEF_REFINEMENT || stage === Stage.RESULTS) && returnToProjectId) {
        setActiveProjectId(returnToProjectId);
        setStage(Stage.PROJECT_DETAILS);
        setReturnToProjectId(null);
        return;
      }
      
      // 默认返回主页
      resetState();
      setStage(Stage.HOME);
    }

    const renderContent = () => {
      if (showTermsOfService) {
        return <TermsOfService onBack={() => setShowTermsOfService(false)} />;
      }
      
      if (showPrivacyPolicy) {
        return <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />;
      }
      
      if (error) {
        return (
          <div className="text-center p-4 my-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg animate-fade-in">
            <p className="font-semibold">操作失败</p>
            <p className="text-sm mt-1">{error}</p>
            <button onClick={() => { setError(null); }} className="mt-4 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">知道了</button>
          </div>
        );
      }
      
      switch (stage) {
        case Stage.LOGIN:
          return <LoginScreen 
            onEmailSignUp={handleEmailSignUp} 
            onEmailSignIn={handleEmailSignIn}
            onWeChatLogin={handleWeChatLogin}
            isLoading={isLoading} 
          />;
        case Stage.HOME:
          return currentUser && <HomeScreen user={currentUser} supabaseUser={supabaseUser} onCreateProject={handleCreateProject} onBriefSubmit={handleBriefSubmit} isLoading={isLoading} activeProjectId={activeProjectId} isProjectLocked={!!returnToProjectId} />;
        case Stage.PROJECT_DASHBOARD:
          return currentUser && <ProjectDashboard user={currentUser} supabaseUser={supabaseUser} onCreateProject={handleCreateProject} onViewProject={handleViewProject} />;
        case Stage.PROJECT_DETAILS:
          // 优先使用 activeProjectId 从当前用户的项目列表中查找
          let project = currentUser?.projects.find(p => p.id === activeProjectId);
          // 如果本地找不到但有 activeProjectId，创建最小项目对象
          // ProjectDetails 会通过 useBriefs hook 从 Supabase 加载任务
          const projectToDisplay = project || (activeProjectId ? {
            id: activeProjectId,
            name: '项目详情',
            briefs: [],
            createdAt: new Date().toISOString()
          } as Project : null);
          return projectToDisplay && <ProjectDetails project={projectToDisplay} supabaseUser={supabaseUser} onStartNewBrief={handleStartNewBriefFromProject} onViewBrief={(b) => handleViewBriefResults(b, projectToDisplay.id)} onDeleteBrief={handleDeleteBrief} />;
        case Stage.BRIEF_REFINEMENT:
          return refinementData && currentRun?.initialBrief ? (
            <BriefRefinement brief={currentRun.initialBrief} refinementData={refinementData} onSubmit={handleRefinementSubmit} isLoading={isLoading} />
          ) : <GeneratingView status="analyzing" />;
        case Stage.GENERATING:
          return <GeneratingView status={generatingStatus} />;
        case Stage.RESULTS:
          return currentRun?.inspirations && currentRun?.proposals ? (
              <ResultsView 
                inspirations={currentRun.inspirations} 
                proposals={currentRun.proposals} 
                onOptimize={handleOptimizeProposal}
                onExecute={handleFinalizeAndExecute}
                onPromoteAndExecute={handlePromoteAndExecuteVersion}
                onRefinementSave={handleSaveRefinement}
                creativeType={currentRun.initialBrief?.type}
                contextBrief={currentRun.refinedBriefText}
                isProcessing={isLoading}
              />
          ) : <GeneratingView status="finished" />;
        case Stage.SETTINGS:
          return currentUser && (
            <UserSettings 
              user={currentUser} 
              onSave={handleSaveSettings} 
              onCancel={() => setStage(Stage.HOME)} 
              onShowTermsOfService={() => setShowTermsOfService(true)}
              onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)}
            />
          );
        default:
          return <LoginScreen 
            onEmailSignUp={handleEmailSignUp} 
            onEmailSignIn={handleEmailSignIn}
            onWeChatLogin={handleWeChatLogin}
            isLoading={isLoading} 
          />;
      }
    };
    
    const showHeader = stage !== Stage.LOGIN;

    return (
      <LanguageContext.Provider value={{
        language,
        setLanguage,
        t: (key, replacements) => t(language, key, replacements)
      }}>
        <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-5xl mx-auto">
            {showHeader && <Header onNavigateToDashboard={handleNavigateToDashboard} onLogout={handleLogout} onBackToHome={handleBackToHome} currentStage={stage} user={currentUser} returnToProjectId={returnToProjectId} onNavigateToSettings={handleNavigateToSettings} />}
            <main className={showHeader ? "" : "mt-8"}>
              {renderContent()}
            </main>
          </div>
        </div>
      </LanguageContext.Provider>
    );
  };

  export default App;
