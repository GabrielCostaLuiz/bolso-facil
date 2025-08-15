// "use server";

// import { revalidatePath } from "next/cache";
// import { getOrCreateSummary, updateSummary } from "@/app/actions/summary-new";
// import type { TransactionFormData } from "@/components/dialog-transaction";
// import { getCurrentUser } from "@/lib/supabase/get-user";
// import { createClient } from "@/utils/db/supabase/server";
// import type { ITransactions } from "../_types";

// // Define types for better type safety
// type Transaction = ITransactions;
// type TransactionSummary = {
//   total_income: number;
//   total_expense: number;
//   total_balance: number;
// };

// export type TransactionInput = Omit<TransactionFormData, "date"> & {
//   date: Date;
//   month: number;
//   year: number;
// };

// export type TransactionFilters = {
//   limit?: number;
//   month?: number;
//   year?: number;
//   startDate?: string;
//   endDate?: string;
//   type?: "week" | "month" | "year" | "custom";
// };

// /**
//  * Get transactions with optional filters
//  */
// export async function getTransactions(filters: TransactionFilters = {}): Promise<ITransactions[]> {
//   const supabase = await createClient();
//   const user = await getCurrentUser();

//   if (!user) {
//     throw new Error("User not authenticated");
//   }

//   const { limit, month, year, type, startDate, endDate } = filters;
  
//   let query = supabase
//     .from("transactions")
//     .select("*")
//     .eq("user_id", user.id)
//     .order("created_at", { ascending: false });

//   // Apply filters based on type
//   if (filters.type === 'custom' && filters.startDate && filters.endDate) {
//     query = query
//       .gte('date', filters.startDate)
//       .lte('date', filters.endDate);
//   } else if (filters.type === 'month' && filters.month && filters.year) {
//     const start = new Date(filters.year, filters.month - 1, 1).toISOString();
//     const end = new Date(filters.year, filters.month, 0).toISOString();
//       .gte('date', startDate)
//       .lte('date', endDate);
//   } else if (type === 'month' && month && year) {
//     const start = new Date(year, month - 1, 1).toISOString();
//     const end = new Date(year, month, 0).toISOString();
//     query = query
//       .gte('date', start)
//       .lte('date', end);
//   } else if (type === 'year' && year) {
//     const start = new Date(year, 0, 1).toISOString();
//     const end = new Date(year, 11, 31).toISOString();
//     query = query
//       .gte('date', start)
//       .lte('date', end);
//   } else if (type === 'week') {
//     const currentDate = new Date();
//     const startOfWeek = new Date(currentDate);
//     startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
//     const endOfWeek = new Date(currentDate);
//     endOfWeek.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
    
//     query = query
//       .gte('date', startOfWeek.toISOString())
//       .lte('date', endOfWeek.toISOString());
//   }

//   if (limit) {
//     query = query.limit(limit);
//   }

//   const { data, error } = await query;

//   if (error) {
//     console.error('Error fetching transactions:', error);
//     return [];
//   }

//   return data as ITransactions[];
// }

// /**
//  * Create a new transaction and update the corresponding summary
//  */
// export async function createTransaction(
//   transaction: Omit<TransactionFormData, 'date'> & { date: Date }
// ): Promise<ITransactions | null> {
//   const supabase = createClient();
//   const user = await getCurrentUser();

//   if (!user) {
//     throw new Error('User not authenticated');
//   }

//   const month = transaction.date.getMonth() + 1;
//   const year = transaction.date.getFullYear();
//   const transactionWithDate: TransactionInput = {
//     ...transaction,
//     date: transaction.date,
//     month,
//     year,
//   };

//   // Start a transaction
//   const { data, error } = await supabase
//     .from('transactions')
//     .insert([
//       {
//         ...transaction,
//         user_id: user.sub,
//         month,
//         year,
//       },
//     ])
//     .select()
//     .single();

//   if (error) {
//     console.error('Error creating transaction:', error);
//     throw error;
//   }

//   // Update the summary
//   try {
//     await updateTransactionSummary(transactionWithDate, 'create');
//     revalidatePath(`/dashboard/${user.sub}`);
//     return data as ITransactions;
//   } catch (error) {
//     console.error('Error updating summary:', error);
//     // Rollback transaction creation if summary update fails
//     await supabase.from('transactions').delete().eq('id', data.id);
//     throw error;
//   }
// }

// /**
//  * Update an existing transaction
//  */
// export async function updateTransaction(
//   transactionId: string,
//   updatedData: Omit<TransactionFormData, "date"> & {
//     date: Date;
//   }
// ): Promise<ITransactions | null> {
//   const supabase = createClient();
//   const user = await getCurrentUser();

//   if (!user) {
//     throw new Error('User not authenticated');
//   }

//   // Get the original transaction first
//   const { data: originalTransaction, error: fetchError } = await supabase
//     .from('transactions')
//     .select('*')
//     .eq('id', transactionId)
//     .single();

//   if (fetchError || !originalTransaction) {
//     throw new Error('Transaction not found');
//   }

//   const month = updatedData.date.getMonth() + 1;
//   const year = updatedData.date.getFullYear();
//   const updatedTransaction = {
//     ...updatedData,
//     month,
//     year,
//   };

//   // Update the transaction
//   const { data, error } = await supabase
//     .from('transactions')
//     .update(updatedTransaction)
//     .eq('id', transactionId)
//     .select()
//     .single();

//   if (error) {
//     console.error('Error updating transaction:', error);
//     throw error;
//   }

//   // Update the summary
//   try {
//     await handleTransactionUpdate(originalTransaction, updatedTransaction);
//     revalidatePath(`/dashboard/${user.sub}`);
//     return data as ITransactions;
//   } catch (error) {
//     console.error('Error updating summary:', error);
//     // Rollback transaction update if summary update fails
//     await supabase
//       .from('transactions')
//       .update(originalTransaction)
//       .eq('id', transactionId);
//     throw error;
//   }
// }

// /**
//  * Delete a transaction
//  */
// export async function deleteTransaction(
//   transaction: ITransactions
// ): Promise<void> {
//   const supabase = createClient();
//   const user = await getCurrentUser();

//   if (!user) {
//     throw new Error('User not authenticated');
//   }

//   // Delete the transaction
//   const { error } = await supabase
//     .from('transactions')
//     .delete()
//     .eq('id', transaction.id);

//   if (error) {
//     console.error('Error deleting transaction:', error);
//     throw error;
//   }

//   // Update the summary
//   try {
//     await updateTransactionSummary(transaction, 'delete');
//     revalidatePath(`/dashboard/${user.sub}`);
//   } catch (error) {
//     console.error('Error updating summary:', error);
//     // Rollback transaction deletion if summary update fails
//     await supabase
//       .from('transactions')
//       .insert(transaction);
//     throw error;
//   }
// }

// /**
//  * Update transaction summary based on the transaction action
//  */
// async function updateTransactionSummary(
//   transaction: TransactionInput | ITransactions,
//   action: 'create' | 'update' | 'delete'
// ): Promise<void> {
//   const supabase = createClient();
//   const user = await getCurrentUser();

//   if (!user) {
//     throw new Error('User not authenticated');
//   }

//   const month = 'month' in transaction ? transaction.month : transaction.date.getMonth() + 1;
//   const year = 'year' in transaction ? transaction.year : transaction.date.getFullYear();
//   const amount = transaction.amount;
//   const isIncome = transaction.type === 'income';

//   // Get or create the summary for the month
//   const summary = await getOrCreateSummary({
//     month,
//     year,
//     user: { id: user.sub },
//   });

//   if ('messagem' in summary) {
//     throw new Error('Failed to get or create summary');
//   }

//   // Calculate the new totals
//   let newIncome = summary.total_income || 0;
//   let newExpense = summary.total_expense || 0;

//   switch (action) {
//     case 'create':
//       if (isIncome) {
//         newIncome += amount;
//       } else {
//         newExpense += amount;
//       }
//       break;
//     case 'delete':
//       if (isIncome) {
//         newIncome -= amount;
//       } else {
//         newExpense -= amount;
//       }
//       break;
//     // For update, we handle it in handleTransactionUpdate
//   }

//   const newBalance = newIncome - newExpense;

//   // Update the summary
//   await updateSummary({
//     summaryId: summary.id,
//     total_income: newIncome,
//     total_expense: newExpense,
//     total_balance: newBalance,
//   });
// }

// /**
//  * Handle summary updates when a transaction is updated
//  */
// async function handleTransactionUpdate(
//   original: ITransactions,
//   updated: TransactionInput
// ): Promise<void> {
//   // First, remove the original transaction's impact
//   await updateTransactionSummary(original, 'delete');
  
//   // Then add the updated transaction's impact
//   await updateTransactionSummary(updated, 'create');
// }
