import type { CategoryKeys } from "@/constants/categories-defaults";

export interface GetTransactionsParams {
  limit?: number;
  month: string;
  year: string;
  startDate?: string;
  endDate?: string;
  type?: "week" | "month" | "year" | "custom";
}

export interface UnifiedTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: CategoryKeys;
  description?: string | undefined;
  type: "expense" | "income";
  created_at: string;
  updated_at?: string; // só existe nas bills
  day?: number; // só existe nas bills
  month: number;
  year: number;
  date?: string; // só existe nas normal transactions
  is_bill?: boolean; // só existe nas bills
  bill_id?: string; // só existe nas bills
}