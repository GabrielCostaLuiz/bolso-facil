import type { UnifiedTransaction } from "@/app/(application)/dashboard/[id]/transactions/_types";

export function calcSummaryChange(
  transaction: Omit<UnifiedTransaction, "date" | "month" | "year" | "id" | "user_id" | "created_at" > & {
    date?: undefined | string | Date;
    month: number | string;
    year: number | string;
    id?: string;
    user_id?: string;
    created_at?: string;
  },
  isRevert = false
) {
  let incomeChange = 0;
  let expenseChange = 0;
  let balanceChange = 0;

  const multiplier = isRevert ? -1 : 1;

  if (transaction.type === "income") {
    incomeChange += transaction.amount * multiplier;
    balanceChange += transaction.amount * multiplier;
  } else {
    expenseChange += transaction.amount * multiplier;
    balanceChange -= transaction.amount * multiplier;
  }

  return { incomeChange, expenseChange, balanceChange };
}
