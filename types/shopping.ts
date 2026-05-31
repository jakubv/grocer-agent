// New types for the simpler Grocer shopping list flow

export interface ShoppingItem {
  id: string;
  name: string;
  category?: string;
  addedBy?: string; // 'Jakub' | 'Mirka' | 'Both'
  addedAt: string;
  notes?: string;
}

export interface ArchivedList {
  id: string;
  archivedAt: string;
  items: ShoppingItem[];
  totalItems: number;
  orderedFrom?: 'Lunys' | 'Tesco' | 'Both';
}