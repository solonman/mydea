
import React, { useState, useCallback, useEffect } from 'react';
import { Stage, Brief, RefinementData, InspirationCase, CreativeProposal, GeneratingStatus, Project, BriefHistoryItem, User } from './types';
import Header from './components/Header';
import BriefRefinement from './components/BriefRefinement';
import GeneratingView from './components/GeneratingView';
import ResultsView from './components/ResultsView';
import LoginScreen from './components/LoginScreen';
import ProjectDashboard from './components/ProjectDashboard';
import ProjectDetails from './components/ProjectDetails';
import HomeScreen from './components/HomeScreen';
import * as db from './services/databaseService';
import { refineBrief, generateCreativePackage, optimizeProposal, generateExecutionPlan } from './services/geminiService';
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

const App: React.FC = () => {
  const [stage, setStage] = useState<Stage>(Stage.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null);
  const [returnToProjectId, setReturnToProjectId] = useState<string | null>(null); // 记录需要返回的项目 ID

  const [currentRun, setCurrentRun] = useState<Partial<BriefHistoryItem> | null>(null);
  const [refinementData, setRefinementData] = useState<RefinementData | null>(null);
  const [generatingStatus, setGeneratingStatus] = useState<GeneratingStatus>('analyzing');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  
  // Session check on initial render
  useEffect(() => {
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
            setStage(Stage.HOME);
          }
        }
      } catch (error) {
        logger.error('Auth check failed', error as Error);
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
  }, []);

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
    if (currentUser) {
       const updatedUser = db.deleteBrief(currentUser.username, projectId, briefId);
       setCurrentUser(updatedUser);
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
    setActiveProjectId(projectId);
    setReturnToProjectId(projectId); // 记录返回的项目 ID
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
      const result = await refineBrief(submittedBrief.text, submittedBrief.type);
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
      const { inspirations, proposals } = await generateCreativePackage(fullBrief, projectContext, setGeneratingStatus);
      const proposalsWithIds: CreativeProposal[] = proposals.map(p => ({ 
          ...p, 
          id: crypto.randomUUID(),
          version: 1,
          isFinalized: false,
          executionDetails: null
      }));
      setCurrentRun(prev => ({ ...prev, inspirations, proposals: proposalsWithIds }));
      setStage(Stage.RESULTS);
    } catch(e) {
       console.error(e);
       setError('抱歉，生成创意方案时出错了。请返回并重试。');
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
      const oldVersion = { ...proposal, history: undefined, isFinalized: false, executionDetails: null };
      const newProposal: CreativeProposal = {
        ...optimizedData,
        id: proposal.id, // Keep same ID
        version: proposal.version + 1,
        history: [ ...(proposal.history || []), oldVersion ],
        isFinalized: false,
        executionDetails: null,
      };

      const updatedProposals = currentRun.proposals.map(p => p.id === proposal.id ? newProposal : p);
      setCurrentRun(prev => ({...prev, proposals: updatedProposals}));
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
    const allHistory = [ ...(currentProposal.history || []), { ...currentProposal, history: undefined, isFinalized: false, executionDetails: null } ];

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
  
  const handleFinish = async () => {
    if (currentUser && activeProjectId && currentRun?.id && currentRun.initialBrief && currentRun.refinedBriefText && currentRun.proposals) {
      const completeRun = currentRun as BriefHistoryItem;
      
      try {
        // 保存到 Supabase（如果已登录）
        if (supabaseUser) {
          const { createBrief } = await import('./services/supabase');
          await createBrief({
            project_id: activeProjectId,
            initial_brief: completeRun.initialBrief,
            refined_brief_text: completeRun.refinedBriefText,
            inspirations: completeRun.inspirations,
            proposals: completeRun.proposals,
            status: 'completed',
          });
          logger.info('Brief saved to Supabase', { briefId: completeRun.id });
        }
        
        // 同时保存到 localStorage（向后兼容）
        const updatedUser = db.addOrUpdateBrief(currentUser.username, activeProjectId, completeRun);
        setCurrentUser(updatedUser);
        
      } catch (error) {
        logger.error('Failed to save brief', error as Error);
        // 即使保存失败，也继续执行（用户可以稍后重试）
        const errorMsg = error instanceof Error ? error.message : '保存失败';
        setError(`保存创意任务时出错：${errorMsg}。数据已保存到本地缓存。`);
      }
    }
    resetState();
    setStage(Stage.HOME);
  };
   
  const handleViewBriefResults = (brief: BriefHistoryItem, projectId: string) => {
      setActiveProjectId(projectId);
      setCurrentRun(brief);
      setActiveBriefId(brief.id);
      setStage(Stage.RESULTS);
  };

  const handleBackToHome = () => {
    // 如果当前在项目详情页，返回到项目列表
    if (stage === Stage.PROJECT_DETAILS) {
      setActiveProjectId(null);
      setStage(Stage.PROJECT_DASHBOARD);
      return;
    }
    
    // 如果有返回项目 ID，返回到项目详情页
    if (returnToProjectId) {
      setActiveProjectId(returnToProjectId);
      setStage(Stage.PROJECT_DETAILS);
      setReturnToProjectId(null);
    } else {
      resetState();
      setStage(Stage.HOME);
    }
  }

  const renderContent = () => {
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
        const project = currentUser?.projects.find(p => p.id === activeProjectId);
        // If project not found in localStorage but we have activeProjectId, create a minimal project object
        const projectToShow = project || (activeProjectId ? {
          id: activeProjectId,
          name: '项目详情',
          briefs: [],
          createdAt: new Date().toISOString()
        } as Project : null);
        return projectToShow && <ProjectDetails project={projectToShow} supabaseUser={supabaseUser} onStartNewBrief={handleStartNewBriefFromProject} onViewBrief={(b) => handleViewBriefResults(b, projectToShow.id)} onDeleteBrief={handleDeleteBrief} />;
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
              onFinish={handleFinish} 
              onOptimize={handleOptimizeProposal}
              onExecute={handleFinalizeAndExecute}
              onPromoteAndExecute={handlePromoteAndExecuteVersion}
              isProcessing={isLoading}
            />
        ) : <GeneratingView status="finished" />;
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
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        {showHeader && <Header onNavigateToDashboard={handleNavigateToDashboard} onLogout={handleLogout} onBackToHome={handleBackToHome} currentStage={stage} user={currentUser} returnToProjectId={returnToProjectId} />}
        <main className={showHeader ? "" : "mt-8"}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
