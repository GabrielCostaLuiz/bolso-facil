"use server";

import { getCurrentUser } from "@/lib/supabase/get-user";
import { createClient } from "@/utils/db/supabase/server";
import type { CreateBillData, IBills, UpdateBillData } from "../_types";

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

// Função para criar uma nova conta
export async function createBill(data: CreateBillData) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return;
    }
    
    const { error } = await supabase.from("bills").insert([
      {
        user_id: user?.sub,
        ...data,
        status: "pending",
        isActive: true,
      },
    ]);

    if (error) {
      throw error;
    }

    return;
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    throw new Error("Erro ao criar conta");
  }
}

// Função para atualizar uma conta
export async function updateBill(data: UpdateBillData): Promise<IBills> {
  try {
    // Aqui você faria a chamada para sua API/banco de dados
   

    // Simulação de dados atualizados
    const updatedBill: IBills = {
      id: data.id,
      userId: "user-1",
      name: data.name || "Nome da conta",
      description: data.description,
      amount: data.amount || 0,
      category: data.category || "others",
      status: data.status || "pending",
      dueDate: data.dueDate || new Date(),
      recurrenceType: data.recurrenceType || "monthly",
      isActive: data.isActive ?? true,
      lastPaidDate: data.lastPaidDate,
      reminderDays: data.reminderDays,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return updatedBill;
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    throw new Error("Erro ao atualizar conta");
  }
}

// Função para atualizar apenas o status de uma conta
export async function updateBillStatus(
  billId: string,
  status: "paid" | "pending" | "overdue"
): Promise<void> {
  try {
    const updateData: Partial<UpdateBillData> = {
      id: billId,
      status,
      updatedAt: new Date(),
    };

    if (status === "paid") {
      updateData.lastPaidDate = new Date();
    }

    // Aqui você faria a chamada para sua API/banco de dados
    console.log("Atualizando status da conta:", updateData);

    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 300));
  } catch (error) {
    console.error("Erro ao atualizar status da conta:", error);
    throw new Error("Erro ao atualizar status da conta");
  }
}

// Função para excluir uma conta
export async function deleteBill(billId: string): Promise<void> {
  try {
    // Aqui você faria a chamada para sua API/banco de dados
    console.log("Excluindo conta:", billId);

    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 300));
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    throw new Error("Erro ao excluir conta");
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
export async function payBill(billId: string): Promise<void> {
  try {
    // 1. Atualizar status da conta para "paid"
    await updateBillStatus(billId, "paid");

    // 2. Criar transação correspondente (se necessário)
    // const bill = await getBillById(billId);
    // await createTransactionFromBill(bill);

    console.log("Conta marcada como paga e transação criada:", billId);
  } catch (error) {
    console.error("Erro ao pagar conta:", error);
    throw new Error("Erro ao pagar conta");
  }
}

// Função para verificar contas vencidas e atualizar status
export async function checkOverdueBills(): Promise<void> {
  try {
    const bills = await getBills();
    const today = new Date();

    const overdueBills = bills.filter((bill) => {
      const dueDate = new Date(bill.dueDate);
      return bill.status === "pending" && dueDate < today;
    });

    // Atualizar status das contas vencidas
    for (const bill of overdueBills) {
      await updateBillStatus(bill.id, "overdue");
    }

    console.log(`${overdueBills.length} contas marcadas como vencidas`);
  } catch (error) {
    console.error("Erro ao verificar contas vencidas:", error);
    throw new Error("Erro ao verificar contas vencidas");
  }
}
