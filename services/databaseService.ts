import { User, Project, BriefHistoryItem } from '../types';

const DB_KEY = 'mydea_db';
const SESSION_KEY = 'mydea_session';

// --- Database Initialization and Access ---

function getDb(): Record<string, User> {
  const dbString = localStorage.getItem(DB_KEY);
  return dbString ? JSON.parse(dbString) : {};
}

function saveDb(db: Record<string, User>) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// --- User Management ---

export function getUser(username: string): User | null {
  const db = getDb();
  return db[username] || null;
}

export function createUser(username: string, role: 'user' | 'admin' = 'user'): User {
  const db = getDb();
  if (db[username]) {
    throw new Error('User already exists');
  }
  const newUser: User = { username, projects: [], role };
  db[username] = newUser;
  saveDb(db);
  return newUser;
}

export function setUserRole(username: string, role: 'user' | 'admin'): User {
  const db = getDb();
  const user = db[username];
  if (!user) throw new Error('User not found');
  
  user.role = role;
  saveDb(db);
  setSessionUser(user);
  return user;
}

// --- Session Management ---

export function setSessionUser(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSessionUser(): User | null {
  const userString = localStorage.getItem(SESSION_KEY);
  return userString ? JSON.parse(userString) : null;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// --- Project Management ---

export function addProject(username: string, projectName: string): { updatedUser: User, newProject: Project } {
  const db = getDb();
  const user = db[username];
  if (!user) throw new Error('User not found');

  const newProject: Project = {
    id: crypto.randomUUID(),
    name: projectName,
    briefs: [],
  };

  user.projects.push(newProject);
  saveDb(db);
  setSessionUser(user); // Update session
  return { updatedUser: user, newProject };
}

// --- Brief Management ---

export function addOrUpdateBrief(username: string, projectId: string, brief: BriefHistoryItem): User {
  const db = getDb();
  const user = db[username];
  if (!user) throw new Error('User not found');
  
  const project = user.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const briefIndex = project.briefs.findIndex(b => b.id === brief.id);
  if (briefIndex > -1) {
    // Update existing brief
    project.briefs[briefIndex] = brief;
  } else {
    // Add new brief
    project.briefs.push(brief);
  }
  
  saveDb(db);
  setSessionUser(user);
  return user;
}


export function deleteBrief(username: string, projectId: string, briefId: string): User {
    const db = getDb();
    const user = db[username];
    if (!user) throw new Error('User not found');

    const project = user.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    project.briefs = project.briefs.filter(b => b.id !== briefId);
    
    saveDb(db);
    setSessionUser(user);
    return user;
}