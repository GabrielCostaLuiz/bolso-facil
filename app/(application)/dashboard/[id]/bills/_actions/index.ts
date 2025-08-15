"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { createClient } from "@/utils/db/supabase/server";
import { AppError } from "@/utils/handleError";
import type {
  BillStatus,
  CreateBillData,
  IBillInstance,
  IBills,
  RecurrenceType,
  UpdateBillData,
} from "../_types";

interface MonthlySummary {
  month: number;
  year: number;
  amount: number;
}

interface BillInstanceWithBill extends IBillInstance {
  bill: IBills;
}

type BillInstance = Omit<IBillInstance, "bill"> & {
  bill?: IBills;
};

export interface BillTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  description: string | null;
  type: "expense";
  created_at: string;
  updated_at: string;
  day: number;
  month: number;
  year: number;
  is_bill: true;
  bill_id: string;
}

// Função para buscar todas as contas do usuário
export async function getBills({
  limit,
}: {
  limit?: number;
} = {}): Promise<IBills[]> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    let query = supabase
      .from("bills")
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
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    throw new Error("Erro ao buscar contas");
  }
}

export async function getBillTransactions(
  input: {
    month: string;
    year: string;
    userId: string;
  },
  options: { db: SupabaseClient }
): Promise<BillTransaction[]> {
  const { db } = options;
  const { month, year, userId } = input;

  try {
    const { data: billInstances, error: instancesError } = await db
      .from("bill_instances")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year);

    if (instancesError) {
      throw new AppError("Erro ao buscar instâncias da conta", {
        statusCode: 500,
        details: { message: instancesError.message },
        cause: instancesError,
      });
    }

    if (billInstances.length === 0) return [];

    const billIds = [
      ...new Set(billInstances.map((instance) => instance.bill_id)),
    ];

    const { data: bills = [], error: billsError } = await db
      .from("bills")
      .select("*")
      .in("id", billIds)
      .eq("is_active", true);

    if (billsError) {
      throw new Error(billsError.message);
    }

    const billMap = new Map(bills!.map((bill) => [bill.id, bill]));

    const billTransactions: BillTransaction[] = billInstances
      .map((instance) => {
        const bill = billMap.get(instance.bill_id);
        // if (!bill) return null;

        const amount =
          instance.amount !== null && instance.amount !== bill.amount
            ? instance.amount
            : bill.amount;

        return {
          id: instance.id,
          user_id: bill.user_id,
          title: bill.name,
          amount: Number(amount),
          category: bill.category,
          description: bill.description || null,
          type: "expense" as const, // more specific type
          created_at: instance.created_at || bill.created_at,
          updated_at: instance.updated_at || bill.updated_at,
          day: instance.day || bill.day,
          month: Number(month),
          year: Number(year),
          is_bill: true,
          bill_id: bill.id,
        };
      })
      .filter((t): t is BillTransaction => t !== null); // TypeScript entende que são BillTransaction

    return billTransactions;
  } catch (error) {
    throw new AppError("Erro ao processar getBillTransactions", {
      statusCode: 500,
      details: { message: (error as Error).message },
      cause: error,
    });
  }
}

// Função para criar uma nova conta
export async function createBill(data: CreateBillData) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Extract day from due date
  const dueDate = parseISO(data.dueDate);
  const [year, month, day] = dueDate.toISOString().split("T")[0].split("-");
  const dayString = day;

  try {
    // Start transaction
    const { data: billData, error: billError } = await supabase
      .from("bills")
      .insert({
        user_id: user.sub,
        name: data.name,
        amount: data.amount,
        category: data.category,
        description: data.description || null,
        reminder_days: data.reminderDays || null,
        recurrence_type: data.recurrenceType,
        day: dayString,
        is_active: true,
      })
      .select()
      .single();

    if (billError) throw billError;

    if (!billData) {
      throw new Error("Erro ao criar conta");
    }

    // Create bill instances based on recurrence
    const billInstances = await createBillInstances(
      supabase,
      {
        ...billData,
        user_id: user.sub,
        day: dayString,
      },
      new Date(), // Start from today
      new Date(new Date().getFullYear() + 1, 11, 31) // End at end of next year
    );

    // Update monthly summaries with the new instances
    if (billInstances && billInstances.length > 0) {
      await updateMonthlySummaries(supabase, user.sub, billInstances);
    }
    revalidatePath(`/dashboard/${user.sub}`);
    revalidatePath(`/dashboard/${user.sub}/transactions`);

    return billData;
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    throw new Error("Erro ao criar conta: " + (error as Error).message);
  }
}

async function createBillInstances(
  supabase: any,
  billData: any,
  startDate: Date,
  endDate: Date
) {
  const instances = [];
  const currentDate = new Date(startDate);
  const day = billData.day || 1; // Default to 1st of month if no day specified

  while (currentDate <= endDate) {
    const instanceDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );

    // Skip if instance date is before today
    if (instanceDate >= new Date()) {
      instances.push({
        user_id: billData.user_id,
        bill_id: billData.id,
        amount: billData.amount,
        status: "pending",
        due_date: instanceDate.toISOString(),
        month: instanceDate.getMonth() + 1,
        year: instanceDate.getFullYear(),
        preferred_payment_day: day,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Move to next period based on recurrence
    switch (billData.recurrence_type) {
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case "quarterly":
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case "semiannually":
        currentDate.setMonth(currentDate.getMonth() + 6);
        break;
      case "annually":
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        currentDate.setMonth(currentDate.getMonth() + 1); // Default to monthly
    }
  }

  // Insert all instances at once
  if (instances.length > 0) {
    const { data, error } = await supabase
      .from("bill_instances")
      .insert(instances)
      .select();

    if (error) throw error;
    return data || [];
  }

  return [];
}

// Função auxiliar para atualizar os resumos mensais
async function updateMonthlySummaries(
  supabase: any,
  userId: string,
  billInstances: BillInstance[]
): Promise<void> {
  try {
    // Agrupar instâncias por mês/ano
    const summariesMap = new Map<string, MonthlySummary>();

    billInstances.forEach((instance: BillInstance) => {
      const key = `${instance.month}-${instance.year}`;
      const existing = summariesMap.get(key) || {
        month: instance.month,
        year: instance.year,
        amount: 0,
      };

      const amount =
        typeof instance.amount === "string"
          ? parseFloat(instance.amount)
          : instance.amount;

      if (!isNaN(amount)) {
        summariesMap.set(key, {
          ...existing,
          amount: existing.amount + amount,
        });
      }
    });

    // Atualizar cada resumo mensal
    for (const [_, summary] of summariesMap) {
      // Verificar se o resumo já existe
      const { data: existingSummary } = await supabase
        .from("user_monthly_summary")
        .select("*")
        .eq("user_id", userId)
        .eq("month", summary.month)
        .eq("year", summary.year)
        .single();

      if (existingSummary) {
        // Converter valores para números
        const currentExpense =
          typeof existingSummary.total_expense === "string"
            ? parseFloat(existingSummary.total_expense)
            : existingSummary.total_expense;

        const currentIncome =
          typeof existingSummary.total_income === "string"
            ? parseFloat(existingSummary.total_income)
            : existingSummary.total_income;

        const newExpense =
          (isNaN(currentExpense) ? 0 : currentExpense) + summary.amount;
        const newBalance =
          (isNaN(currentIncome) ? 0 : currentIncome) - newExpense;

        // Atualizar resumo existente
        await supabase
          .from("user_monthly_summary")
          .update({
            total_expense: newExpense.toString(),
            total_balance: newBalance.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSummary.id);
      } else {
        // Criar novo resumo
        await supabase.from("user_monthly_summary").insert([
          {
            user_id: userId,
            month: summary.month,
            year: summary.year,
            total_income: "0",
            total_expense: summary.amount.toString(),
            total_balance: (-summary.amount).toString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            date_unique: `${summary.month}-${summary.year}`,
          },
        ]);
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar resumos mensais:", error);
    throw new Error("Erro ao atualizar resumos mensais");
  }
}

// Função para atualizar uma conta
export async function updateBill(data: UpdateBillData): Promise<IBills> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  try {
    // 1. Obter a conta atual para verificar se houve mudança no valor
    const { data: currentBill, error: fetchError } = await supabase
      .from("bills")
      .select("*")
      .eq("id", data.id)
      .single();

    if (fetchError) throw fetchError;
    if (!currentBill) throw new Error("Conta não encontrada");

    const amountChanged =
      data.amount !== undefined && data.amount !== currentBill.amount;

    // Get day from due date if provided, otherwise use current bill's day
    const newDueDate = data.dueDate ? new Date(data.dueDate) : null;
    const day = newDueDate ? newDueDate.getDate() : currentBill.day;
    const dayString = day.toString().padStart(2, "0");

    const dueDateChanged =
      newDueDate &&
      (day !== currentBill.day ||
        newDueDate.getMonth() !==
          new Date(currentBill.due_date || "").getMonth() ||
        newDueDate.getFullYear() !==
          new Date(currentBill.due_date || "").getFullYear());

    // 2. Update the main bill
    const updateData: any = {
      name: data.name,
      description: data.description,
      amount: data.amount,
      category: data.category,
      status: data.status || currentBill.status,
      is_active: data.isActive ?? currentBill.is_active,
      recurrence_type: data.recurrenceType || currentBill.recurrence_type,
      preferred_payment_day: dayString,
      day: day, // Store numeric day
      reminder_days: data.reminderDays ?? currentBill.reminder_days,
      updated_at: new Date().toISOString(),
    };

    // Only update due_date if it was provided and changed
    if (newDueDate) {
      updateData.due_date = newDueDate.toISOString();
    }

    const { data: updatedBill, error: updateError } = await supabase
      .from("bills")
      .update(updateData)
      .eq("id", data.id)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!updatedBill) throw new Error("Falha ao atualizar a conta");

    // 3. Se o valor ou a data de vencimento mudou, atualizar as instâncias futuras
    if (amountChanged || dueDateChanged) {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      // Atualizar instâncias futuras
      const { error: updateInstancesError } = await supabase
        .from("bill_instances")
        .update({
          amount: updatedBill.amount,
          due_date: (dueDate: string) => {
            const date = new Date(dueDate);
            date.setDate(updatedBill.preferred_payment_day);
            return date.toISOString();
          },
          preferred_payment_day: updatedBill.preferred_payment_day,
          updated_at: new Date().toISOString(),
        })
        .eq("bill_id", data.id)
        .gte("due_date", today.toISOString().split("T")[0])
        .eq("status", "pending");

      if (updateInstancesError) throw updateInstancesError;

      // 4. Recalcular os resumos mensais afetados
      const { data: affectedInstances, error: instancesError } = await supabase
        .from("bill_instances")
        .select("*")
        .eq("bill_id", data.id)
        .gte("due_date", today.toISOString().split("T")[0]);

      if (instancesError) throw instancesError;

      if (affectedInstances && affectedInstances.length > 0) {
        await updateMonthlySummaries(supabase, user.sub, affectedInstances);
      }
    }

    // Return the updated bill with both new and legacy property names for compatibility
    const result: IBills = {
      id: updatedBill.id,
      user_id: updatedBill.user_id,
      name: updatedBill.name,
      description: updatedBill.description || null,
      amount: updatedBill.amount,
      category: updatedBill.category,
      status: updatedBill.status,
      is_active: updatedBill.is_active,
      recurrence_type: updatedBill.recurrence_type,
      preferred_payment_day: updatedBill.preferred_payment_day,
      reminder_days: updatedBill.reminder_days || null,
      last_paid_date: updatedBill.last_paid_date || null,
      created_at: updatedBill.created_at,
      day: updatedBill.day,
      updated_at: updatedBill.updated_at,
      dueDate: updatedBill.due_date || "",
      recurrenceType: updatedBill.recurrence_type || "",

      // Legacy properties for compatibility
      // userId: updatedBill.user_id,
      // dueDate: updatedBill.due_date,
      // recurrenceType: updatedBill.recurrence_type,
      // isActive: updatedBill.is_active,
      // lastPaidDate: updatedBill.last_paid_date || undefined,
      // reminderDays: updatedBill.reminder_days || undefined,
      // createdAt: updatedBill.created_at,
      // updatedAt: updatedBill.updated_at,
    };

    return result;
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    throw new Error("Erro ao atualizar conta: " + (error as Error).message);
  }
}

// Função para atualizar apenas o status de uma conta
// export async function updateBillStatus(
//   billId: string,
//   status: "paid" | "pending" | "overdue"
// ): Promise<void> {
//   try {
//     const updateData: Partial<UpdateBillData> = {
//       id: billId,
//       status,
//       updatedAt: new Date(),
//     };

//     if (status === "paid") {
//       updateData.lastPaidDate = new Date();
//     }

//     // Aqui você faria a chamada para sua API/banco de dados
//     console.log("Atualizando status da conta:", updateData);

//     // Simular delay
//     await new Promise((resolve) => setTimeout(resolve, 300));
//   } catch (error) {
//     console.error("Erro ao atualizar status da conta:", error);
//     throw new Error("Erro ao atualizar status da conta");
//   }
// }

// Função para excluir uma instância específica de uma conta
// Se instanceId for fornecido, apenas aquela instância será excluída
// Se não, a conta inteira será excluída
export async function deleteBill(
  billId: string,
  month?: string,
  year?: string
): Promise<void> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  try {
    if (month && year) {
      // 1. Obter a instância específica para atualizar o resumo
      const { data: instance, error: instanceError } = await supabase
        .from("bill_instances")
        .select("*")
        .eq("bill_id", billId)
        .eq("month", month)
        .eq("year", year)
        .single();

      if (instanceError) throw instanceError;
      if (!instance) throw new Error("Instância não encontrada");

      // 2. Excluir apenas a instância específica
      const { error: deleteInstanceError } = await supabase
        .from("bill_instances")
        .delete()
        .eq("id", instance.id);

      if (deleteInstanceError) throw deleteInstanceError;

      // 3. Atualizar o resumo mensal
      await updateMonthlySummariesAfterDeletion(supabase, user.sub, [instance]);
    } else {
      // 1. Obter as instâncias da conta para atualizar os resumos
      const { data: instances, error: instancesError } = await supabase
        .from("bill_instances")
        .select("*")
        .eq("bill_id", billId)
        .eq("status", "pending");

      if (instancesError) throw instancesError;

      // 2. Excluir as instâncias da conta
      const { error: deleteInstancesError } = await supabase
        .from("bill_instances")
        .delete()
        .eq("bill_id", billId);

      if (deleteInstancesError) throw deleteInstancesError;

      // 3. Excluir a conta principal
      const { error: deleteBillError } = await supabase
        .from("bills")
        .delete()
        .eq("id", billId);

      if (deleteBillError) throw deleteBillError;

      // 4. Atualizar os resumos mensais
      if (instances && instances.length > 0) {
        await updateMonthlySummariesAfterDeletion(
          supabase,
          user.sub,
          instances
        );
      }
    }

    revalidatePath(`/dashboard/${user.sub}`);
    revalidatePath(`/dashboard/${user.sub}/transactions`);
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    throw new Error("Erro ao excluir conta: " + (error as Error).message);
  }
}

// Função auxiliar para atualizar os resumos mensais após a exclusão
async function updateMonthlySummariesAfterDeletion(
  supabase: any,
  userId: string,
  deletedInstances: any[]
) {
  try {
    // Agrupar instâncias por mês/ano
    const summariesMap = new Map<
      string,
      { month: number; year: number; amount: number }
    >();

    deletedInstances.forEach((instance) => {
      const key = `${instance.month}-${instance.year}`;
      const existing = summariesMap.get(key) || {
        month: instance.month,
        year: instance.year,
        amount: 0,
      };
      summariesMap.set(key, {
        ...existing,
        amount: existing.amount + parseFloat(instance.amount || 0),
      });
    });

    // Atualizar cada resumo mensal
    for (const [_, summary] of summariesMap) {
      // Obter o resumo atual

      const { data: currentSummary, error: fetchError } = await supabase
        .from("user_monthly_summary")
        .select("*")
        .eq("user_id", userId)
        .eq("month", summary.month)
        .eq("year", summary.year)
        .single();

      // if (fetchError) {
      //   console.error("Erro ao buscar resumo:", fetchError);
      //   continue;
      // }

      if (currentSummary) {
        // Atualizar resumo existente
        const newExpense = Math.max(
          0,
          parseFloat(currentSummary.total_expense) - summary.amount
        );
        const newBalance = parseFloat(currentSummary.total_income) - newExpense;

        await supabase
          .from("user_monthly_summary")
          .update({
            total_expense: newExpense.toString(),
            total_balance: newBalance.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentSummary.id);
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar resumos mensais após exclusão:", error);
    throw new Error("Erro ao atualizar resumos mensais após exclusão");
  }
}

// Função para excluir múltiplas contas
export async function deleteMultipleBills(
  billIds: string[]
): Promise<{ deletedCount: number }> {
  try {
    // Aqui você faria a chamada para sua API/banco de dados
    console.log("Excluindo contas:", billIds);

    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { deletedCount: billIds.length };
  } catch (error) {
    console.error("Erro ao excluir contas:", error);
    throw new Error("Erro ao excluir contas");
  }
}

// Função para marcar conta como paga e criar transação correspondente
export async function payBill(
  billId: string,
  instanceId?: string
): Promise<void> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  try {
    // 1. Obter a conta e a instância específica (se fornecida) ou a próxima pendente
    let query = supabase
      .from("bill_instances")
      .select("*, bill:bill_id(*)")
      .eq("bill_id", billId);

    if (instanceId) {
      query = query.eq("id", instanceId);
    } else {
      // Se nenhuma instância for fornecida, pega a próxima pendente
      query = query
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(1);
    }

    const { data: instances, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    if (!instances || instances.length === 0) {
      throw new Error("Nenhuma instância de conta pendente encontrada");
    }

    const instance = instances[0];
    const bill = instance.bill;

    // 2. Iniciar uma transação do banco de dados
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 3. Atualizar o status da instância para "paid"
    const { error: updateInstanceError } = await supabase
      .from("bill_instances")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", instance.id);

    if (updateInstanceError) throw updateInstanceError;

    // 4. Criar a transação correspondente
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: user.sub,
          title: bill.name,
          amount: instance.amount,
          category: bill.category,
          type: "expense",
          description: bill.description || `Pagamento de ${bill.name}`,
          date: new Date().toISOString().split("T")[0],
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      ]);

    if (transactionError) throw transactionError;

    // 5. Verificar se todas as instâncias foram pagas para atualizar o status da conta principal
    const { data: pendingInstances, error: pendingError } = await supabase
      .from("bill_instances")
      .select("id", { count: "exact" })
      .eq("bill_id", billId)
      .eq("status", "pending");

    if (pendingError) throw pendingError;

    // 6. Se não houver mais instâncias pendentes, marcar a conta como paga
    if (pendingInstances && pendingInstances.length === 0) {
      await supabase
        .from("bills")
        .update({
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", billId);
    }

    // 7. Atualizar o resumo mensal
    const { data: summary, error: summaryError } = await supabase
      .from("user_monthly_summary")
      .select("*")
      .eq("user_id", user.sub)
      .eq("month", new Date().getMonth() + 1)
      .eq("year", new Date().getFullYear())
      .single();

    if (summary) {
      const newExpense =
        parseFloat(summary.total_expense) + parseFloat(instance.amount);
      const newBalance = parseFloat(summary.total_income) - newExpense;

      await supabase
        .from("user_monthly_summary")
        .update({
          total_expense: newExpense.toString(),
          total_balance: newBalance.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", summary.id);
    }

    return;
  } catch (error) {
    console.error("Erro ao pagar conta:", error);
    throw new Error("Erro ao pagar conta: " + (error as Error).message);
  }
}

// Função para verificar contas vencidas e atualizar status
export async function checkOverdueBills(): Promise<{ updatedCount: number }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Buscar instâncias de contas pendentes com data de vencimento anterior a hoje
    const { data: overdueInstances, error: fetchError } = await supabase
      .from("bill_instances")
      .select("*, bill:bill_id(*)")
      .eq("user_id", user.sub)
      .eq("status", "pending")
      .lt("due_date", today.toISOString().split("T")[0]);

    if (fetchError) throw fetchError;

    if (!overdueInstances || overdueInstances.length === 0) {
      return { updatedCount: 0 };
    }

    // 2. Agrupar instâncias por mês/ano para atualização de resumos
    const summariesToUpdate = new Map<
      string,
      { month: number; year: number; amount: number }
    >();

    // 3. Atualizar status das instâncias vencidas
    const instanceIds = overdueInstances.map(
      (instance: BillInstance) => instance.id
    );

    const { error: updateError } = await supabase
      .from("bill_instances")
      .update({
        status: "overdue",
        updated_at: new Date().toISOString(),
      })
      .in("id", instanceIds);

    if (updateError) throw updateError;

    // 4. Atualizar status das contas principais, se necessário
    const billIds = [
      ...new Set(
        overdueInstances.map((instance: BillInstance) => instance.bill_id)
      ),
    ];

    const { error: updateBillsError } = await supabase
      .from("bills")
      .update({
        status: "overdue",
        updated_at: new Date().toISOString(),
      })
      .in("id", billIds)
      .eq("status", "pending");

    if (updateBillsError) throw updateBillsError;

    // 5. Coletar informações para atualização de resumos
    overdueInstances.forEach((instance: BillInstance) => {
      const dueDate = new Date(instance.due_date);
      const month = dueDate.getMonth() + 1;
      const year = dueDate.getFullYear();
      const key = `${month}-${year}`;

      const existing = summariesToUpdate.get(key) || { month, year, amount: 0 };
      const amount =
        typeof instance.amount === "string"
          ? parseFloat(instance.amount)
          : instance.amount;

      summariesToUpdate.set(key, {
        ...existing,
        amount: existing.amount + (isNaN(amount) ? 0 : amount),
      });
    });

    // 6. Atualizar resumos mensais
    for (const [_, summary] of summariesToUpdate) {
      const { data: currentSummary, error: summaryError } = await supabase
        .from("user_monthly_summary")
        .select("*")
        .eq("user_id", user.sub)
        .eq("month", summary.month)
        .eq("year", summary.year)
        .single();

      if (summaryError) {
        console.error("Erro ao buscar resumo:", summaryError);
        continue;
      }

      if (currentSummary) {
        // Atualizar resumo existente
        const newExpense =
          parseFloat(currentSummary.total_expense) + summary.amount;
        const newBalance = parseFloat(currentSummary.total_income) - newExpense;

        await supabase
          .from("user_monthly_summary")
          .update({
            total_expense: newExpense.toString(),
            total_balance: newBalance.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentSummary.id);
      }
    }

    return { updatedCount: overdueInstances.length };
  } catch (error) {
    console.error("Erro ao verificar contas vencidas:", error);
    throw new Error(
      "Erro ao verificar contas vencidas: " + (error as Error).message
    );
  }
}
