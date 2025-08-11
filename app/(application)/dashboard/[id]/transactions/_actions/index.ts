"use server";

import { revalidatePath } from "next/cache";
import {
  getSummary,
  type ISummary,
  updateSummary,
} from "@/app/actions/summary";
import type { TransactionFormData } from "@/components/dialog-transaction";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { CheckUserAndDB } from "@/utils/checkUserAndDB";
import { createClient } from "@/utils/db/supabase/server";
import type { ITransactions } from "../_types";

export async function getTransactions({
  limit,
  month,
  year,
  startDate,
  endDate,
  type,
}: {
  limit?: number;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  type?: "week" | "month" | "year" | "custom";
}): Promise<ITransactions[]> {
  try {
    const { db, user } = await CheckUserAndDB();

    if (!user) {
      return [];
    }

    let query = db
      .from("transactions")
      .select("*")
      .eq("user_id", user?.sub)
      .order("created_at", { ascending: false });

    // Filtros baseados no tipo
    if (type === "custom" && startDate && endDate) {
      // Filtro personalizado com datas específicas
      const dayAfterEndDate = new Date(
        new Date(endDate).getTime() + 24 * 60 * 60 * 1000
      ).toISOString();
      query = query
        .gte("created_at", startDate)
        .lte("created_at", dayAfterEndDate);
    } else if (type === "month" && month !== undefined && year !== undefined) {
      // Filtro por mês específico
      query = query.eq("month", month).eq("year", year);
    } else if (type === "year" && year !== undefined) {
      // Filtro por ano específico
      query = query.eq("year", year);
    } else if (type === "week") {
      // Para semana, busca do mês atual e filtra no cliente
      const currentDate = new Date();
      query = query
        .eq("month", currentDate.getMonth() + 1)
        .eq("year", currentDate.getFullYear());
    }
    // Se não tiver tipo específico, busca todas as transações
    if (limit !== undefined) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    throw new Error("Erro ao buscar transações");
  }
}

export async function createTransaction(
  transaction: Omit<TransactionFormData, "date"> & {
    date: Date;
  }
) {
  try {
    const { db, user } = await CheckUserAndDB();

    if (!user) {
      return;
    }

    const { error } = await db.from("transactions").insert([
      {
        title: transaction.title,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        type: transaction.type,
        user_id: user?.sub,
        date: transaction.date,
        month: transaction.month,
        year: transaction.year,
      },
    ]);

    if (error) {
      throw error;
    }

    const summary = await getSummary({
      month: transaction.month,
      year: transaction.year,
      user,
      db,
      total_income: transaction.type === "income" ? transaction.amount : 0,
      total_expense: transaction.type === "expense" ? transaction.amount : 0,
      total_balance:
        transaction.type === "income"
          ? transaction.amount
          : -transaction.amount,
    });

    if ("messagem" in summary) {
      revalidatePath(`/dashboard/${user?.sub}`);
      return;
    }

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
      user,
      db,
      month: transaction.month,
      year: transaction.year,
    });

    revalidatePath(`/dashboard/${user?.sub}`);
    return;
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    throw new Error("Erro ao criar transação");
  }
}

export async function updateTransaction(
  transactionId: string,
  updatedData: Omit<TransactionFormData, "date"> & {
    date: Date;
  }
) {
  const { db, user } = await CheckUserAndDB();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data: originalTransaction, error: fetchError } = await db
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("user_id", user.sub)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (!originalTransaction) {
    throw new Error("Transação não encontrada");
  }

  const { error: updateError } = await db
    .from("transactions")
    .update({
      title: updatedData.title,
      amount: updatedData.amount,
      category: updatedData.category,
      description: updatedData.description,
      type: updatedData.type,
      date: updatedData.date,
      month: updatedData.month,
      year: updatedData.year,
    })
    .eq("id", transactionId)
    .eq("user_id", user.sub);

  if (updateError) {
    throw updateError;
  }

  const summary = await getSummary({
    month: updatedData.month,
    year: updatedData.year,
    user,
    db,
    total_income: updatedData.type === "income" ? updatedData.amount : 0,
    total_expense: updatedData.type === "expense" ? updatedData.amount : 0,
    total_balance:
      updatedData.type === "income" ? updatedData.amount : -updatedData.amount,
  });

  const oldSummary = await getSummary({
    month: originalTransaction.month,
    year: originalTransaction.year,
    user,
    db,
    total_income:
      originalTransaction.type === "income" ? -originalTransaction.amount : 0,
    total_expense:
      originalTransaction.type === "expense" ? -originalTransaction.amount : 0,
    total_balance:
      originalTransaction.type === "income"
        ? -originalTransaction.amount
        : originalTransaction.amount,
  });

  if ("messagem" in summary) {
    if (!("messagem" in oldSummary)) {
      await updateSummary({
        total_income:
          updatedData.type === "income"
            ? oldSummary.total_income - updatedData.amount
            : oldSummary.total_income,
        total_expense:
          updatedData.type === "expense"
            ? oldSummary.total_expense - updatedData.amount
            : oldSummary.total_expense,
        total_balance:
          updatedData.type === "expense"
            ? oldSummary.total_balance + updatedData.amount
            : oldSummary.total_balance - updatedData.amount,
        user,
        db,
        month: originalTransaction.month,
        year: originalTransaction.year,
      });
      revalidatePath(`/dashboard/${user?.sub}`);
      return;
    }
    revalidatePath(`/dashboard/${user?.sub}`);
    return;
  }

  let incomeChange = 0;
  let expenseChange = 0;
  let balanceChange = 0;

  console.log("originalllllllllll", originalTransaction);
  if (originalTransaction.type === "income") {
    incomeChange -= originalTransaction.amount;
    balanceChange -= originalTransaction.amount;
  } else {
    expenseChange += originalTransaction.amount;
    balanceChange -= originalTransaction.amount;
  }

  await updateSummary({
    total_income: summary.total_income + incomeChange,
    total_expense: summary.total_expense + expenseChange,
    total_balance: summary.total_balance + balanceChange,
    user,
    db,
    month: updatedData.month,
    year: updatedData.year,
  });

  if (!("messagem" in oldSummary)) {
    await updateSummary({
      total_income:
        updatedData.type === "income"
          ? oldSummary.total_income - updatedData.amount
          : oldSummary.total_income,
      total_expense:
        updatedData.type === "expense"
          ? oldSummary.total_expense - updatedData.amount
          : oldSummary.total_expense,
      total_balance:
        updatedData.type === "expense"
          ? oldSummary.total_balance + updatedData.amount
          : oldSummary.total_balance - updatedData.amount,
      user,
      db,
      month: originalTransaction.month,
      year: originalTransaction.year,
    });
    revalidatePath(`/dashboard/${user?.sub}`);
    return;
  }

  revalidatePath(`/dashboard/${user.sub}`);
  return;
}

export async function deleteTransaction(transaction: ITransactions) {
  try {
    const { db, user } = await CheckUserAndDB();

    if (!user) {
      return;
    }

    const { error } = await db
      .from("transactions")
      .delete()
      .eq("id", transaction.id)
      .eq("user_id", user?.sub)
      .single();

    if (error) {
      throw error;
    }

    const summary = await getSummary({
      month: transaction.month,
      year: transaction.year,
      user,
      db,
      total_income: transaction.type === "income" ? transaction.amount : 0,
      total_expense: transaction.type === "expense" ? transaction.amount : 0,
      total_balance:
        transaction.type === "income"
          ? transaction.amount
          : -transaction.amount,
    });

    if (!("messagem" in summary)) {
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
        user,
        db,
        month: transaction.month,
        year: transaction.year,
      });

      revalidatePath(`/dashboard/${user?.sub}`);
    }

    return;
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    throw new Error("Erro ao excluir transação");
  }
}

// export async function deleteMultipleTransactions(transactionIds: string[]) {
//   try {
//     const { db, user } = await CheckUserAndDB();
//     if (!user) {
//     return;
//   }

//   const { data: transactionsToDelete, error: fetchError } = await db
//     .from("transactions")
//     .select("*")
//     .eq("user_id", user?.sub)
//     .in("id", transactionIds);

//   if (fetchError) {
//     throw fetchError;
//   }

//   if (!transactionsToDelete || transactionsToDelete.length === 0) {
//     throw new Error("Nenhuma transação encontrada para deletar");
//   }

//   const { error: deleteError } = await db
//     .from("transactions")
//     .delete()
//     .eq("user_id", user?.sub)
//     .in("id", transactionIds);

//   if (deleteError) {
//     throw deleteError;
//   }

//   const summary = await getSummary();

//   let incomeChange = 0;
//   let expenseChange = 0;
//   let balanceChange = 0;

//   transactionsToDelete.forEach((transaction) => {
//     if (transaction.type === "income") {
//       incomeChange += transaction.amount;
//       balanceChange += transaction.amount;
//     } else {
//       expenseChange += transaction.amount;
//       balanceChange -= transaction.amount;
//     }
//   });

//   // Atualizar o summary
//   await updateSummary({
//     total_income: summary.total_income - incomeChange,
//     total_expense: summary.total_expense - expenseChange,
//     total_balance: summary.total_balance - balanceChange,
//   });

//   revalidatePath(`/dashboard/${user?.sub}`);
//   return {
//     deletedCount: transactionsToDelete.length,
//     deletedTransactions: transactionsToDelete,
//   };
//   } catch (error) {
    
//   }
 

  
// }
