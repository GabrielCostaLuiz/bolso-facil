// import { revalidatePath } from "next/cache";

// import { getCurrentUser } from "@/lib/supabase/get-user";
// import { getOrCreateSummary, updateSummary } from "@/app/actions/summary-new";
// import type { TransactionFormData } from "@/components/dialog-transaction";
// import type { ITransactions } from "../_types";
// import { createClient } from "@/utils/db/supabase/server";
// import type { SupabaseClient } from "@supabase/supabase-js";

// type TransactionInput = Omit<TransactionFormData, "date"> & {
//   date: Date;
//   month: number;
//   year: number;
// };

// type TransactionUpdate = {
//   id: string;
//   data: TransactionInput;
// };

// type TransactionSummaryUpdate = {
//   income: number;
//   expense: number;
//   balance: number;
// };

// /**
//  * Service class to handle all transaction-related operations
//  */
// class TransactionService {
//   private supabase: any;
//   private userId: string;

//   private constructor(supabase: any, userId: string) {
//     this.supabase = supabase;
//     this.userId = userId;
//   }

//   /**
//    * Create a new instance of TransactionService
//    */
//   static async create() {
//     const supabase = createClient();
//     const user = await getCurrentUser();
    
//     if (!user) {
//       throw new Error("Usuário não autenticado");
//     }
    
//     return new TransactionService(supabase, user.sub);
//   }

//   /**
//    * Get transactions with optional filters
//    */
//   async getTransactions({
//     limit,
//     month,
//     year,
//     startDate,
//     endDate,
//     type,
//   }: {
//     limit?: number;
//     month?: number;
//     year?: number;
//     startDate?: string;
//     endDate?: string;
//     type?: "week" | "month" | "year" | "custom";
//   }): Promise<ITransactions[]> {
//     try {
//        let allTransactions: any = [];
//       //  const { this.supabase, user } = await CheckUserAndthis.supabase();
   
//       //  if (!user) {
//       //    return [];
//       //  }
   
//        let query = this.supabase
//          .from("transactions")
//          .select("*")
//          .eq("user_id", this.userId)
//          .order("created_at", { ascending: false });
   
//        // Filtros baseados no tipo
//        if (type === "custom" && startDate && endDate) {
//          // Filtro personalizado com datas específicas
//          const dayAfterEndDate = new Date(
//            new Date(endDate).getTime() + 24 * 60 * 60 * 1000
//          ).toISOString();
//          query = query
//            .gte("created_at", startDate)
//            .lte("created_at", dayAfterEndDate);
//        } else if (type === "month" && month !== undefined && year !== undefined) {
//          // Filtro por mês específico
   
//          query = query.eq("month", month).eq("year", year);
//        } else if (type === "year" && year !== undefined) {
//          // Filtro por ano específico
//          query = query.eq("year", year);
//        } else if (type === "week") {
//          // Para semana, busca do mês atual e filtra no cliente
//          const currentDate = new Date();
//          query = query
//            .eq("month", currentDate.getMonth() + 1)
//            .eq("year", currentDate.getFullYear());
//        }
//        // Se não tiver tipo específico, busca todas as transações
//        if (limit !== undefined) {
//          query = query.limit(limit);
//        }
   
//        // Fetch transactions
//        const { data: transactions, error: transactionsError } = await query;
   
//        if (transactionsError) {
//          console.error("Error fetching transactions:", transactionsError);
//          throw transactionsError;
//        }
   
//        if (transactions) {
//          allTransactions = [...transactions];
//        }
   
//        // Fetch bills for the same period if month and year are provided
//        if (
//          (type === "month" && month !== undefined && year !== undefined) ||
//          (type === "year" && year !== undefined)
//        ) {
//          try {
//            // First, get all bill instances for this month/year
//            const { data: billInstances, error: instancesError } = await this.supabase
//              .from("bill_instances")
//              .select("*")
//              .eq("user_id", this.userId)
//              .eq("month", month)
//              .eq("year", year);
   
//            console.log(billInstances);
//            if (!instancesError && billInstances && billInstances.length > 0) {
//              // Get unique bill IDs from instances
//              const billIds = [
//                ...new Set(billInstances.map((instance) => instance.bill_id)),
//              ];
   
//              // Fetch all related bills
//              const { data: bills, error: billsError } = await this.supabase
//                .from("bills")
//                .select("*")
//                .in("id", billIds)
//                .eq("is_active", true);
//              console.log(bills);
//              if (!billsError && bills) {
//                // Create a map of bill_id to bill for quick lookup
//                const billMap = new Map(bills.map((bill) => [bill.id, bill]));
//                console.log("billMap", billMap);
//                // Process each instance and its corresponding bill
//                const billTransactions = billInstances
//                  .map((instance) => {
//                    const bill = billMap.get(instance.bill_id);
//                    if (!bill) return null;
   
//                    // Use instance amount if it exists and is different from bill amount
//                    const amount =
//                      instance.amount !== null && instance.amount !== bill.amount
//                        ? instance.amount
//                        : bill.amount;
   
//                    return {
//                      id: instance.id,
//                      user_id: bill.user_id,
//                      title: bill.name,
//                      amount: Number(amount),
//                      category: bill.category,
//                      description: bill.description || null,
//                      type: "expense",
//                      created_at: instance.created_at || bill.created_at,
//                      updated_at: instance.updated_at || bill.updated_at,
//                      day: instance.day || bill.day,
//                      month: month,
//                      year: year,
//                      is_bill: true,
//                      bill_id: bill.id,
//                      // Add any other fields you need from the bill or instance
//                    };
//                  })
//                  .filter(Boolean); // Remove any null entries
   
//                // Add the bill transactions to our results
//                if (billTransactions.length > 0) {
//                  allTransactions = [...allTransactions, ...billTransactions];
//                }
//              }
//            }
//          } catch (error) {
//            console.error("Error processing bill instances:", error);
//          }
//        }
   
//        return allTransactions
//          .sort(
//            (a: any, b: any) =>
//              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//          )
//          .slice(0, limit || allTransactions.length);
//      } catch (error) {
//        console.error("Erro ao buscar transações:", error);
//        throw new Error("Erro ao buscar transações");
//      }
//   }

//   /**
//    * Create a new transaction
//    */
//   async createTransaction(transaction: TransactionInput) {
//     const { data, error } = await this.supabase
//       .from("transactions")
//       .insert([{
//         ...transaction,
//         user_id: this.userId,
//       }])
//       .select()
//       .single();

//     if (error) {
//       console.error("Error creating transaction:", error);
//       throw new Error("Erro ao criar transação");
//     }

//     // Update summary with new transaction
//     await this.updateTransactionSummary(transaction, 'create');
    
//     this.revalidateDashboard();
//     return data;
//   }

//   /**
//    * Update an existing transaction
//    */
//   async updateTransaction({ id, data }: TransactionUpdate) {
//     // Get the original transaction
//     const { data: originalTransaction, error: fetchError } = await this.supabase
//       .from("transactions")
//       .select("*")
//       .eq("id", id)
//       .eq("user_id", this.userId)
//       .single();

//     if (fetchError || !originalTransaction) {
//       console.error("Error fetching original transaction:", fetchError);
//       throw new Error("Transação não encontrada");
//     }

//     // Update the transaction
//     const { error: updateError } = await this.supabase
//       .from("transactions")
//       .update({
//         ...data,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", id)
//       .eq("user_id", this.userId);

//     if (updateError) {
//       console.error("Error updating transaction:", updateError);
//       throw new Error("Erro ao atualizar transação");
//     }

//     // Update summaries for both old and new transaction dates
//     await this.handleTransactionUpdate(originalTransaction, data);
    
//     this.revalidateDashboard();
//   }

//   /**
//    * Delete a transaction
//    */
//   async deleteTransaction(transactionId: string) {
//     // Get the transaction first to update the summary
//     const { data: transaction, error: fetchError } = await this.supabase
//       .from("transactions")
//       .select("*")
//       .eq("id", transactionId)
//       .eq("user_id", this.userId)
//       .single();

//     if (fetchError || !transaction) {
//       console.error("Error fetching transaction for deletion:", fetchError);
//       throw new Error("Transação não encontrada");
//     }

//     // Delete the transaction
//     const { error: deleteError } = await this.supabase
//       .from("transactions")
//       .delete()
//       .eq("id", transactionId)
//       .eq("user_id", this.userId);

//     if (deleteError) {
//       console.error("Error deleting transaction:", deleteError);
//       throw new Error("Erro ao excluir transação");
//     }

//     // Update the summary by removing this transaction
//     await this.updateTransactionSummary(transaction, 'delete');
    
//     this.revalidateDashboard();
//   }

//   /**
//    * Handle summary updates when a transaction is created, updated, or deleted
//    */
//   private async updateTransactionSummary(
//     transaction: TransactionInput | ITransactions,
//     action: 'create' | 'update' | 'delete'
//   ) {
//     const amount = typeof transaction.amount === 'number' 
//       ? transaction.amount 
//       : parseFloat(transaction.amount);

//     if (isNaN(amount)) {
//       console.error("Invalid transaction amount:", transaction.amount);
//       return;
//     }

//     const multiplier = action === 'delete' ? -1 : 1;
//     const type = 'type' in transaction ? transaction.type : 'expense';

//     const summaryUpdate: TransactionSummaryUpdate = {
//       income: type === 'income' ? amount * multiplier : 0,
//       expense: type === 'expense' ? amount * multiplier : 0,
//       balance: type === 'income' ? amount * multiplier : -amount * multiplier,
//     };

//     await this.applySummaryUpdate(transaction, summaryUpdate);
//   }

//   /**
//    * Apply updates to the monthly summary
//    */
//   private async applySummaryUpdate(
//     transaction: TransactionInput | ITransactions,
//     update: TransactionSummaryUpdate
//   ) {
//     try {
//       const summary = await getOrCreateSummary({
//         month: transaction.month,
//         year: transaction.year,
//         total_income: 0,
//         total_expense: 0,
//         total_balance: 0,
//       }, { db: this.supabase });

//       if (summary) {
//         await updateSummary({
//           id: 'id' in summary ? summary.id : undefined,
//           month: transaction.month,
//           year: transaction.year,
//           total_income: (typeof summary.total_income === 'number' ? summary.total_income : parseFloat(summary.total_income)) + update.income,
//           total_expense: (typeof summary.total_expense === 'number' ? summary.total_expense : parseFloat(summary.total_expense)) + update.expense,
//           total_balance: (typeof summary.total_balance === 'number' ? summary.total_balance : parseFloat(summary.total_balance)) + update.balance,
//         }, { db: this.supabase });
//       }
//     } catch (error) {
//       console.error("Error updating summary:", error);
//       throw new Error("Erro ao atualizar resumo");
//     }
//   }

//   /**
//    * Handle summary updates when a transaction is updated (both old and new dates)
//    */
//   private async handleTransactionUpdate(
//     original: ITransactions,
//     updated: TransactionInput
//   ) {
//     // If month/year hasn't changed, we just need to update the amounts
//     if (original.month === updated.month && original.year === updated.year) {
//       // First, remove the original transaction
//       await this.updateTransactionSummary(original, 'delete');
//       // Then add the updated one
//       await this.updateTransactionSummary(updated, 'create');
//     } else {
//       // If the date changed, we need to update both summaries
//       await this.updateTransactionSummary(original, 'delete');
//       await this.updateTransactionSummary(updated, 'create');
//     }
//   }

//   /**
//    * Revalidate the dashboard path
//    */
//   private revalidatePath() {
//     revalidatePath(`/dashboard/${this.userId}`);
//   }
// }

// // Public API functions that use the service

// export async function getTransactions(params: Parameters<TransactionService['getTransactions']>[0]) {
//   const service = await TransactionService.create();
//   return service.getTransactions(params);
// }

// export async function createTransaction(transaction: TransactionInput) {
//   const service = await TransactionService.create();
//   return service.createTransaction(transaction);
// }

// export async function updateTransaction({ id, data }: TransactionUpdate) {
//   const service = await TransactionService.create();
//   return service.updateTransaction({ id, data });
// }

// export async function deleteTransaction(transactionId: string) {
//   const service = await TransactionService.create();
//   return service.deleteTransaction(transactionId);
// }
