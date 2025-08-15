import type { SupabaseClient } from "@supabase/supabase-js";
import { createTransaction } from "@/app/(application)/dashboard/[id]/transactions/_actions";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { createClient } from "@/utils/db/supabase/server";
import { getMonth, getYear } from "@/utils/formatDate";
import { AppError } from "@/utils/handleError";

export interface ISummary {
  id: string;
  user_id: string;
  total_income: number;
  total_expense: number;
  total_balance: number;
  updated_at: string;
  month: number;
  day?: number;
  year: number;
  created_at?: string;
}

export type SummaryInput = {
  month: string;
  year: string;
  total_income?: number;
  total_expense?: number;
  total_balance?: number;
  type?: "createTransaction";
  transaction?: any;
};

type RecurrenceType = "monthly" | "quarterly" | "semiannually" | "annually";

interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number | string;
  category: string;
  status: string;
  recurrence_type: RecurrenceType;
  preferred_payment_day: number;
  created_at: string;
}

export async function getOrCreateSummary(
  input: SummaryInput,
  options?: { db?: SupabaseClient }
): Promise<ISummary | null> {
  const supabase = options?.db || (await createClient());
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const {
    month,
    year,
    type,
    total_balance,
    total_expense,
    total_income,
    transaction,
  } = input;

  try {
    // Try to get existing summary
    const { data: existingSummary, error: fetchError } = await supabase
      .from("user_monthly_summary")
      .select("*")
      .eq("user_id", user.sub)
      .eq("month", +month)
      .eq("year", +year)
      .single();

    if (existingSummary && type === "createTransaction") {
      return await updateSummary({
        id: existingSummary.id,
        total_income:
          transaction.type === "income"
            ? existingSummary.total_income + transaction.amount
            : existingSummary.total_income,
        total_expense:
          transaction.type === "expense"
            ? existingSummary.total_expense + transaction.amount
            : existingSummary.total_expense,
        total_balance:
          transaction.type === "income"
            ? existingSummary.total_balance + transaction.amount
            : existingSummary.total_balance - transaction.amount,

        month: transaction.month,
        year: transaction.year,
      });
    }

    if (existingSummary && !fetchError) {
      return existingSummary;
    }

    // If summary doesn't exist, create a new one with bills included
    const { data: bills, error: billsError } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", user.sub)
      .eq("is_active", true);

    if (billsError) throw billsError;

    // Calculate total bills for this month
    const totalBills = bills
      .filter((bill) => shouldIncludeBill(bill, month, year))
      .reduce((sum, bill) => {
        const amount =
          typeof bill.amount === "string"
            ? parseFloat(bill.amount)
            : bill.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);



    if (totalBills !== 0) {
      // Create new summary with bills included
      const { data: newSummary, error: createError } = await supabase
        .from("user_monthly_summary")
        .insert([
          {
            user_id: user.sub,
            month,
            year,
            total_income: total_income || 0,
            total_expense: (total_expense || 0) + totalBills,
            total_balance: (total_balance || 0) - totalBills,
            date_unique: `${+month}-${year}`,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      if (!newSummary) throw new Error("Falha ao criar o resumo mensal");

      return newSummary;
    }

    return null
  } catch (error) {
    throw new AppError("Erro ao encontrar/criar sumário mensal", {
      statusCode: 500,
      details: { messagem: "Erro na função getOrCreateSummary" },
      cause: error,
    });
  }
}

/**
 * Checks if a bill should be included in a specific month based on its recurrence
 */
function shouldIncludeBill(bill: Bill, month: string, year: string): boolean {
  const billDate = new Date(bill.created_at);
  const billYear = getYear({ dateString: billDate });
  const billMonth = getMonth({ dateString: billDate });

  // Convert all amounts to numbers for calculations
  const amount =
    typeof bill.amount === "string" ? parseFloat(bill.amount) : bill.amount;
  if (isNaN(amount) || amount <= 0) return false;

  // Calculate months difference
  const monthsDiff =
    (Number(year) - Number(billYear)) * 12 +
    (Number(month) - Number(billMonth));

  switch (bill.recurrence_type) {
    case "monthly":
      return monthsDiff >= 0;

    case "quarterly":
      return monthsDiff >= 0 && monthsDiff % 3 === 0;

    case "semiannually":
      return monthsDiff >= 0 && monthsDiff % 6 === 0;

    case "annually":
      return month === billMonth && year >= billYear;

    default:
      return false;
  }
}

/**
 * Gets or creates a monthly summary, including bills for that month
 */

/**
 * Updates a monthly summary with new values
 */
export async function updateSummary(
  input: SummaryInput & { id?: string },
  options?: { db?: SupabaseClient }
): Promise<ISummary> {
  const supabase = options?.db || (await createClient());
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { month, year, id, ...updates } = input;

  try {
    if (id) {
      // Update existing summary
      const { data: updatedSummary, error: updateError } = await supabase
        .from("user_monthly_summary")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!updatedSummary) throw new Error("Resumo não encontrado");

      return updatedSummary;
    } else {
      // Create or update summary
      return getOrCreateSummary(input, { db: supabase });
    }
  } catch (error) {
    console.error("Erro ao atualizar resumo:", error);
    throw new Error("Erro ao atualizar o resumo mensal");
  }
}

/**
 * Gets summaries for a specific period
 */
// export async function getSummaries(
//   filters: {
//     startMonth: number;
//     startYear: number;
//     endMonth?: number;
//     endYear?: number;
//   },
//   options?: { db?: SupabaseClient }
// ): Promise<ISummary[]> {
//   const supabase = options?.db || (await createClient());
//   const user = await getCurrentUser();

//   if (!user) {
//     throw new Error("Usuário não autenticado");
//   }

//   const { startMonth, startYear, endMonth, endYear } = filters;

//   try {
//     let query = supabase
//       .from("user_monthly_summary")
//       .select("*")
//       .eq("user_id", user.sub)
//       .gte("year", startYear)
//       .order("year", { ascending: true })
//       .order("month", { ascending: true });

//     // Apply month filters if end period is provided
//     if (endMonth && endYear) {
//       query = query
//         .lte("year", endYear)
//         .or(
//           `and(year.eq.${startYear},month.gte.${startMonth}),and(year.eq.${endYear},month.lte.${endMonth}),and(year.gt.${startYear},year.lt.${endYear})`
//         );
//     } else {
//       query = query.eq("month", startMonth).eq("year", startYear);
//     }

//     const { data: summaries, error } = await query;

//     if (error) throw error;
//     return summaries || [];
//   } catch (error) {
//     console.error("Erro ao buscar resumos:", error);
//     throw new Error("Erro ao buscar resumos mensais");
//   }
// }

/**
 * Recalculates all summaries for a user, useful when bills are updated
 */
export async function recalculateAllSummaries(options?: {
  db?: SupabaseClient;
}): Promise<void> {
  const supabase = options?.db || (await createClient());
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  try {
    // Get all active bills
    const { data: bills, error: billsError } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", user.sub)
      .eq("is_active", true);

    if (billsError) throw billsError;

    // Get all summaries
    const { data: summaries, error: summariesError } = await supabase
      .from("user_monthly_summary")
      .select("*")
      .eq("user_id", user.sub)
      .order("year", { ascending: true })
      .order("month", { ascending: true });

    if (summariesError) throw summariesError;

    // Recalculate each summary
    for (const summary of summaries || []) {
      const totalBills = bills
        .filter((bill) => shouldIncludeBill(bill, summary.month, summary.year))
        .reduce((sum, bill) => {
          const amount =
            typeof bill.amount === "string"
              ? parseFloat(bill.amount)
              : bill.amount;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

      // Update the summary with recalculated bills
      await updateSummary(
        {
          id: summary.id,
          month: summary.month,
          year: summary.year,
          total_income:
            typeof summary.total_income === "string"
              ? parseFloat(summary.total_income)
              : summary.total_income,
          total_expense:
            (typeof summary.total_expense === "string"
              ? parseFloat(summary.total_expense)
              : summary.total_expense) + totalBills,
        },
        { db: supabase }
      );
    }
  } catch (error) {
    console.error("Erro ao recálcular resumos:", error);
    throw new Error("Erro ao recálcular resumos mensais");
  }
}
