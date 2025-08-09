"use server";

import { revalidatePath } from "next/cache";
import type { TransactionFormData } from "@/components/dialog-transaction";
import type { CategoriesDefaultKeys } from "@/constants/categories-defaults";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { createClient } from "@/utils/db/supabase/server";
import { getSummary, updateSummary } from "./summary";

export interface ITransactions {
  id: string;
  title: string;
  created_at: string;
  amount: number;
  category: CategoriesDefaultKeys;
  description: string;
  type: "income" | "expense";
  date: string;
  user_id: string;
}

export async function getTransactions({
  limit,
}: {
  limit?: number;
} = {}): Promise<ITransactions[] | []> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }
  //   const cachedGetTransactions = unstable_cache(
  //     async () => {
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user?.sub)
    .order("created_at", { ascending: false });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

export async function createTransaction(transaction: TransactionFormData) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const { error } = await supabase.from("transactions").insert([
    {
      title: transaction.title,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      type: transaction.type,
      date: transaction.date,
      user_id: user?.sub,
    },
  ]);

  if (error) {
    throw error;
  }

  const summary = await getSummary();

  await updateSummary({
    total_income:
      transaction.type === "income"
        ? summary.total_income + transaction.amount
        : summary.total_income,
    total_expense:
      transaction.type === "expense"
        ? summary.total_expense + transaction.amount
        : summary.total_expense,
    total_balance:
      transaction.type === "income"
        ? summary.total_balance + transaction.amount
        : summary.total_balance - transaction.amount,
  });

  revalidatePath(`/dashboard/${user?.sub}`);
  return;
}

export async function deleteTransaction(transaction: ITransactions) {
  console.log(transaction);

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transaction.id)
    .eq("user_id", user?.sub)
    .single();

  if (error) {
    throw error;
  }

  const summary = await getSummary();

  await updateSummary({
    total_income:
      transaction.type === "income"
        ? summary.total_income - transaction.amount
        : summary.total_income,
    total_expense:
      transaction.type === "expense"
        ? summary.total_expense - transaction.amount
        : summary.total_expense,
    total_balance:
      transaction.type === "income"
        ? summary.total_balance - transaction.amount
        : summary.total_balance + transaction.amount,
  });

  revalidatePath(`/dashboard/${user?.sub}`);
  return;
}

export async function deleteMultipleTransactions(transactionIds: string[]) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const { data: transactionsToDelete, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user?.sub)
    .in("id", transactionIds);

  if (fetchError) {
    throw fetchError;
  }

  if (!transactionsToDelete || transactionsToDelete.length === 0) {
    throw new Error("Nenhuma transação encontrada para deletar");
  }

  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", user?.sub)
    .in("id", transactionIds);

  if (deleteError) {
    throw deleteError;
  }

  const summary = await getSummary();
  
  let incomeChange = 0;
  let expenseChange = 0;
  let balanceChange = 0;

  transactionsToDelete.forEach((transaction) => {
    if (transaction.type === "income") {
      incomeChange += transaction.amount;
      balanceChange += transaction.amount;
    } else {
      expenseChange += transaction.amount;
      balanceChange -= transaction.amount;
    }
  });

  // Atualizar o summary
  await updateSummary({
    total_income: summary.total_income - incomeChange,
    total_expense: summary.total_expense - expenseChange,
    total_balance: summary.total_balance - balanceChange,
  });

  revalidatePath(`/dashboard/${user?.sub}`);
  return {
    deletedCount: transactionsToDelete.length,
    deletedTransactions: transactionsToDelete,
  };
}
