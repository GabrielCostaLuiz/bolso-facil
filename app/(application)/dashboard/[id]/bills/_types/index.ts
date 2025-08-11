
export interface IBills {
  id: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  category: "housing" | "utilities" | "transport" | "subscriptions" | "insurance" | "others";
  status: "paid" | "pending" | "overdue";
  dueDate: Date | string;
  recurrenceType: "monthly" | "quarterly" | "semiannually" | "annually";
  isActive: boolean;
  lastPaidDate?: Date | string;
  nextDueDate?: Date | string;
  reminderDays?: number; // Dias antes do vencimento para lembrar
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateBillData {
  name: string;
  description?: string;
  amount: number;
  category: "housing" | "utilities" | "transport" | "subscriptions" | "insurance" | "others";
  dueDate: Date | string;
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