
export type BillStatus = "paid" | "pending" | "overdue";
export type BillCategory = "housing" | "utilities" | "transport" | "subscriptions" | "insurance" | "others";
export type RecurrenceType = "monthly" | "quarterly" | "semiannually" | "annually";

export interface IBillInstance {
  id: string;
  user_id: string;
  bill_id: string;
  amount: number | string;
  status: BillStatus;
  due_date: string;
  paid_at?: string | null;
  month: number;
  year: number;
  remember_day?: number | null;
  preferred_payment_day: number;
  created_at: string;
  updated_at: string;
  bill?: IBills;
}

export interface IBills {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  amount: number | string;
  category: BillCategory;
  status: BillStatus;
  is_active: boolean;
  recurrence_type: RecurrenceType;
  preferred_payment_day: number;
  day: string; // Day of the month for the next due date
  reminder_days?: number | null;
  last_paid_date?: string | null;
  created_at: string;
  updated_at: string;
  
  // Campos para compatibilidade com a interface antiga
  userId?: string;
  dueDate: string;
  recurrenceType: RecurrenceType;
  isActive?: boolean;
  lastPaidDate?: string;
  reminderDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBillData {
  name: string;
  description?: string;
  amount: number;
  category: "housing" | "utilities" | "transport" | "subscriptions" | "insurance" | "others";
  dueDate: string;
  recurrenceType: "monthly" | "quarterly" | "semiannually" | "annually";
  reminderDays?: number;
}

export interface UpdateBillData extends Partial<CreateBillData> {
  id: string;
  status?: "paid" | "pending" | "overdue";
  isActive?: boolean;
  lastPaidDate?: Date | string;
}

export interface BillFilters {
  status?: "all" | "paid" | "pending" | "overdue";
  category?: "all" | "housing" | "utilities" | "transport" | "subscriptions" | "insurance" | "others";
  searchTerm?: string;
}