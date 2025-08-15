"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateSummary, updateSummary } from "@/app/actions/summary-new";
import type { TransactionFormData } from "@/components/dialog-transaction";
import { buildQuery } from "@/utils/buildQuery";
import { calcSummaryChange } from "@/utils/calcSummaryChange";
import { CheckUserAndDB } from "@/utils/checkUserAndDB";
import { AppError } from "@/utils/handleError";
import { getBillTransactions } from "../../bills/_actions";
import type { GetTransactionsParams, UnifiedTransaction } from "../_types";

export async function getTransactions(
  input: GetTransactionsParams
): Promise<UnifiedTransaction[]> {
  const { db, user } = await CheckUserAndDB();

  const { limit, month, year, startDate, endDate, type } = input;
  let allTransactions: UnifiedTransaction[] = [];

  const queryBase = db
    .from("transactions")
    .select("*")
    .eq("user_id", user.sub)
    .order("created_at", { ascending: false });

  const query = buildQuery(queryBase, {
    type,
    startDate,
    endDate,
    month,
    year,
    limit,
  });

  try {
    const { data: transactions, error: transactionsError } = await query;
 
    if (transactionsError) {
      throw new AppError("Erro ao buscar transações", {
        statusCode: 500,
        details: {
          message: "Erro ao buscar transações",
        },
        cause: transactionsError,
      });
    }

    const billTransactions = await getBillTransactions(
      { month, year, userId: user.sub },
      { db }
    );

    allTransactions = [...transactions, ...billTransactions];

    return allTransactions
      .sort(
        (
          a: Pick<UnifiedTransaction, "created_at">,
          b: Pick<UnifiedTransaction, "created_at">
        ) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, limit || allTransactions.length);
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
  const { db, user } = await CheckUserAndDB();

  try {
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

    await getOrCreateSummary({
      month: String(transaction.month),
      year: String(transaction.year),
      total_income: transaction.type === "income" ? transaction.amount : 0,
      total_expense: transaction.type === "expense" ? transaction.amount : 0,
      total_balance:
        transaction.type === "income"
          ? transaction.amount
          : -transaction.amount,
      type: "createTransaction",
      transaction: transaction,
    });

    return revalidatePath(`/dashboard/${user?.sub}`);
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    throw new Error("Erro ao criar transação");
  }
}

export async function updateTransaction(
  transactionId: string,
  updatedData: Omit<TransactionFormData, "date" | "month" | "year"> & {
    date: Date;
    month: string;
    year: string;
  }
) {
  const { db, user } = await CheckUserAndDB();

  try {
    const { data: originalTransaction, error: fetchError } = await db
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", user.sub)
      .single();

    if (fetchError) {
      throw new AppError("Erro ao buscar transação", {
        statusCode: 500,
        details: {
          message: "Erro ao buscar transação",
        },
        cause: fetchError,
      });
    }

    if (!originalTransaction) {
      throw new AppError("Transação não encontrada", {
        statusCode: 404,
        details: {
          message: "Transação não encontrada",
        },
      });
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
      throw new AppError("Erro ao atualizar transação", {
        statusCode: 500,
        details: {
          message: "Erro ao atualizar transação",
        },
        cause: updateError,
      });
    }

    const summary = await getOrCreateSummary({
      month: updatedData.month,
      year: updatedData.year,
    });

    const oldSummary = await getOrCreateSummary({
      month: originalTransaction.month,
      year: originalTransaction.year,
    });

    // let incomeChange = 0;
    // let expenseChange = 0;
    // let balanceChange = 0;

    // if (originalTransaction.type === "income") {
    //   incomeChange += originalTransaction.amount;
    //   balanceChange += originalTransaction.amount;
    // } else {
    //   expenseChange += originalTransaction.amount;
    //   balanceChange -= originalTransaction.amount;
    // }

    if (!summary || !oldSummary) {
      throw new AppError("Erro ao atualizar transação", {
        statusCode: 500,
        details: {
          message: "Erro ao atualizar transação",
        },
        cause: "Erro ao atualizar transação",
      });
    }

    const applyNew = calcSummaryChange(updatedData);

    await updateSummary({
      id: summary.id,
      total_income: summary.total_income + applyNew.incomeChange,
      total_expense: summary.total_expense + applyNew.expenseChange,
      total_balance: summary.total_balance + applyNew.balanceChange,
      month: updatedData.month,
      year: updatedData.year,
    });

    const revertOld = calcSummaryChange(originalTransaction, true);

    await updateSummary({
      id: oldSummary.id,
      total_income: oldSummary.total_income - revertOld.incomeChange,
      total_expense: oldSummary.total_expense - revertOld.expenseChange,
      total_balance: oldSummary.total_balance - revertOld.balanceChange,
      month: originalTransaction.month,
      year: originalTransaction.year,
    });

    return revalidatePath(`/dashboard/${user.sub}`);
  } catch (error) {
    throw new AppError("Erro ao atualizar transação", {
      statusCode: 500,
      details: {
        message: "Erro ao atualizar transação",
      },
      cause: error,
    });
  }
}

export async function deleteTransaction(transaction: UnifiedTransaction) {
  const { db, user } = await CheckUserAndDB();

  try {
    const { error } = await db
      .from("transactions")
      .delete()
      .eq("id", transaction.id)
      .eq("user_id", user?.sub)
      .single();

    if (error) {
      throw new AppError("Erro ao excluir transação", {
        statusCode: 500,
        details: {
          message: "Erro ao excluir transação",
        },
        cause: error,
      });
    }

    const summary = await getOrCreateSummary({
      month: String(transaction.month),
      year: String(transaction.year),
    });

    const { incomeChange, expenseChange, balanceChange } = calcSummaryChange(
      transaction,
      true
    );

    await updateSummary({
      id: summary?.id,
      total_income: incomeChange,
      total_expense: expenseChange,
      total_balance: balanceChange,
      month: String(transaction.month),
      year: String(transaction.year),
    });

    return revalidatePath(`/dashboard/${user?.sub}`);
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    throw new Error("Erro ao excluir transação");
  }
}
