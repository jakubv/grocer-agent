// Core types for GrocerAgent

export type Store = 'lunys' | 'tesco';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface RecurringItem {
  id: string;
  name: string;
  preferredStore: Store | 'either';
  quantity: number;
  unit?: string;
  frequency: 'weekly' | 'biweekly' | 'daily';
  notes?: string;
}

export interface SpendingLimits {
  lunysMaxPerOrder: number;
  tescoMaxPerOrder: number;
  maxPerDay: number;
  maxPerWeek: number;
  // Dedicated card limits (defense in depth)
  dedicatedCardDailyLimit: number;
  dedicatedCardWeeklyLimit: number;
}

export interface Order {
  id: string;
  createdAt: string;
  store: Store;
  totalAmount: number;
  deliveryDate: string;
  deliverySlot?: string;
  status: 'pending' | 'placed' | 'delivered' | 'cancelled' | 'failed';
  items: OrderItem[];
  confirmationEmail?: string;
  agentRunId?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  estimatedPrice?: number;
  actualPrice?: number;
}

export interface AgentRun {
  id: string;
  triggeredAt: string;
  triggerType: 'scheduled' | 'manual' | 'daily_topup';
  plannedLunysTotal?: number;
  plannedTescoTotal?: number;
  actualLunysTotal?: number;
  actualTescoTotal?: number;
  status: 'planning' | 'executing' | 'completed' | 'failed' | 'partially_completed';
  decisions: string[]; // What the agent was thinking
  error?: string;
}

export interface GroceryPreferences {
  id: string;
  householdSize: number;
  dietaryNotes?: string;
  favoriteBrands: string[];
  avoidBrands: string[];
  maxDeliveryFee?: number;
  preferredDeliveryDays: string[]; // e.g. ["tuesday", "friday"]
}