'use client';

import type { HouseholdUserName } from '@/lib/household';

const TOKEN_KEY = 'ga_access_token';
const USER_KEY = 'ga_current_user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getCurrentUser(): HouseholdUserName {
  if (typeof window === 'undefined') return 'Jakub';
  const u = localStorage.getItem(USER_KEY);
  return u === 'Mirka' ? 'Mirka' : 'Jakub';
}

export function setCurrentUser(user: HouseholdUserName) {
  localStorage.setItem(USER_KEY, user);
}

export function authHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } }).error?.message ||
      (data as { message?: string }).message ||
      res.statusText;
    throw new Error(message);
  }
  return data as T;
}

export interface ListItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  added_by: string;
  added_at: string;
  notes: string | null;
  is_checked: boolean;
}

export interface CurrentListResponse {
  id: string;
  household_id: string;
  status: string;
  updated_at: string;
  items: ListItem[];
}

export async function fetchCurrentList(): Promise<CurrentListResponse> {
  return apiFetch('/list/current');
}

export async function addItems(
  items: { name: string; category?: string; quantity?: number; unit?: string; notes?: string }[],
  addedBy: HouseholdUserName
) {
  return apiFetch('/list/items', {
    method: 'POST',
    body: JSON.stringify({ items, added_by: addedBy }),
  });
}

export async function deleteItem(id: string) {
  return apiFetch(`/list/items/${id}`, { method: 'DELETE' });
}

export async function archiveList(opts: {
  ordered_from?: 'Lunys' | 'Tesco' | 'Both';
  notes?: string;
  archived_by?: HouseholdUserName;
}) {
  return apiFetch('/list/archive', {
    method: 'POST',
    body: JSON.stringify(opts),
  });
}

export interface HistorySummary {
  id: string;
  archived_at: string;
  archived_by: string;
  ordered_from: string | null;
  total_items: number;
  notes: string | null;
}

export async function fetchHistory(limit = 20, offset = 0) {
  return apiFetch<{
    data: HistorySummary[];
    meta: { total: number; limit: number; offset: number };
  }>(`/history?limit=${limit}&offset=${offset}`);
}

export interface TescoProposalLine {
  id: string;
  shopping_item_id: string | null;
  raw_name: string;
  quantity: number;
  unit: string | null;
  search_query: string;
  tesco_product_name: string | null;
  tesco_price: number | null;
  tesco_product_url: string | null;
  confidence: number | null;
  status: string;
  fail_reason: string | null;
}

export interface TescoProposal {
  id: string;
  status: string;
  estimated_total: number | null;
  cart_url: string | null;
  error_message: string | null;
  lines: TescoProposalLine[];
}

export async function prepareTescoProposal() {
  return apiFetch<{ proposal: TescoProposal }>('/tesco/prepare', { method: 'POST', body: '{}' });
}

export async function fetchTescoProposal() {
  return apiFetch<{ proposal: TescoProposal | null }>('/tesco/proposal');
}

export async function fetchTescoSession() {
  return apiFetch<{ connected: boolean; hint: string | null }>('/tesco/session');
}

export async function updateTescoLine(
  lineId: string,
  data: { search_query?: string; quantity?: number; status?: string }
) {
  return apiFetch(`/tesco/proposal/lines/${lineId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export interface TescoSearchLink {
  line_id: string;
  raw_name: string;
  search_query: string;
  url: string;
}

export async function approveTescoProposal(approvedBy: HouseholdUserName) {
  return apiFetch<{
    proposal: TescoProposal;
    cart_url?: string;
    message?: string;
    mode?: 'manual' | 'automated';
    search_urls?: TescoSearchLink[];
  }>('/tesco/approve', {
    method: 'POST',
    body: JSON.stringify({ approved_by: approvedBy }),
  });
}

export async function fetchHistoryDetail(id: string) {
  return apiFetch<{
    id: string;
    archived_at: string;
    archived_by: string;
    ordered_from: string | null;
    notes: string | null;
    total_items: number;
    items: { name: string; category: string; added_by: string; quantity: number | null; unit: string | null; notes: string | null }[];
  }>(`/history/${id}`);
}