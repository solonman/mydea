
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

const App: React.FC = () => {
  const [stage, setStage] = useState<Stage>(Stage.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null);

  const [currentRun, setCurrentRun] = useState<Partial<BriefHistoryItem> | null>(null);
  const [refinementData, setRefinementData] = useState<RefinementData | null>(null);
  const [generatingStatus, setGeneratingStatus] = useState<GeneratingStatus>('analyzing');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Session check on initial render
  useEffect(() => {
    const sessionUser = db.getSessionUser();
    if (sessionUser) {
      handleLogin(sessionUser.username);
    }
  }, []);

  const resetState = () => {
    setActiveProjectId(null);
    setActiveBriefId(null);
    setCurrentRun(null);
    setRefinementData(null);
    setError(null);
    setIsLoading(false);
  };
  
  const handleLogin = (username: string) => {
    const user = db.getUser(username);
    if (user) {
      setCurrentUser(user);
      db.setSessionUser(user);
      setStage(Stage.HOME);
    } else {
      setError("用户不存在");
    }
  };

  const handleRegister = (username: string) => {
    if (db.getUser(username)) {
      setError("用户名已存在");
      return;
    }
    const newUser = db.createUser(username);
    setCurrentUser(newUser);
    db.setSessionUser(newUser);
    setStage(Stage.HOME);
  };

  const handleLogout = () => {
    db.clearSession();
    setCurrentUser(null);
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
    // This flow is now handled by the home screen
    handleBackToHome();
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
  
  const handleFinish = () => {
    if (currentUser && activeProjectId && currentRun?.id && currentRun.initialBrief && currentRun.refinedBriefText && currentRun.proposals) {
      const completeRun = currentRun as BriefHistoryItem;
      const updatedUser = db.addOrUpdateBrief(currentUser.username, activeProjectId, completeRun);
      setCurrentUser(updatedUser);
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
    resetState();
    setStage(Stage.HOME);
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
        return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />;
      case Stage.HOME:
        return currentUser && <HomeScreen user={currentUser} onCreateProject={handleCreateProject} onBriefSubmit={handleBriefSubmit} isLoading={isLoading}/>;
      case Stage.PROJECT_DASHBOARD:
        return currentUser && <ProjectDashboard user={currentUser} onCreateProject={handleCreateProject} onViewProject={handleViewProject} />;
      case Stage.PROJECT_DETAILS:
        const project = currentUser?.projects.find(p => p.id === activeProjectId);
        return project && <ProjectDetails project={project} onStartNewBrief={handleStartNewBriefFromProject} onViewBrief={(b) => handleViewBriefResults(b, project.id)} onDeleteBrief={handleDeleteBrief} />;
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
        return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />;
    }
  };
  
  const showHeader = stage !== Stage.LOGIN;

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        {showHeader && <Header onNavigateToDashboard={handleNavigateToDashboard} onLogout={handleLogout} onBackToHome={handleBackToHome} currentStage={stage} user={currentUser} />}
        <main className="mt-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
