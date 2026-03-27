export interface AgentStats {
  messages: number;
  tokens: number;
  cost: number;
  avgResponseTime: number;
}

export interface DailyHistory {
  date: string;
  messages: number;
  tokens: number;
  cost: number;
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  telegramBot: string;
  status: 'active' | 'idle' | 'error';
  stats: AgentStats;
  dailyHistory: DailyHistory[];
}

export interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  type: 'stage_change' | 'note' | 'agent_assigned' | 'meeting' | 'proposal';
  description: string;
  createdAt: string;
}

export interface DealValue {
  setup: number;
  monthly: number;
}

export interface Location {
  lat: number;
  lng: number;
  city: string;
}

export type DealStage = 'lead' | 'contacted' | 'diagnosis' | 'proposal' | 'building' | 'delivered';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Plan = 'starter' | 'business' | 'enterprise';
export type ClientStatus = 'active' | 'at-risk' | 'churned';
export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'blocked' | 'done';
export type ContentType = 'linkedin' | 'blog' | 'email' | 'case-study' | 'one-pager';
export type ContentStatus = 'planned' | 'draft' | 'review' | 'published';

export interface Deal {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  sector: string;
  stage: DealStage;
  value: DealValue;
  score: number;
  priority: Priority;
  assignedAgents: string[];
  notes: Note[];
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
  location: Location;
  daysInStage: number;
}

export interface MonthlyMetric {
  month: string;
  messages: number;
  escalations: number;
  responseTime: number;
  apiCost: number;
}

export interface Client {
  id: string;
  company: string;
  sector: string;
  plan: Plan;
  mrr: number;
  setupFee: number;
  agents: number;
  agentList: string[];
  health: number;
  startDate: string;
  renewalDate: string;
  status: ClientStatus;
  monthlyMetrics: MonthlyMetric[];
  location: Location;
  contact: string;
  email: string;
  phone: string;
  website: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedAgent: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  relatedDealId?: string;
  relatedClientId?: string;
  subtasks: Subtask[];
  labels: string[];
  createdAt: string;
  completedAt?: string;
  timeSpent?: number;
}

export interface ContentMetrics {
  impressions: number;
  engagement: number;
  clicks: number;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  status: ContentStatus;
  scheduledDate: string;
  publishedDate?: string;
  content?: string;
  metrics?: ContentMetrics;
  labels: string[];
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentEmoji: string;
  agentName: string;
  action: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  read: boolean;
  createdAt: string;
}

export interface Apartment {
  id: string;
  name: string;
  location: Location;
  status: 'occupied' | 'vacant' | 'maintenance';
}
