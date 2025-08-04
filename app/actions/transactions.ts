"use server";

import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { createClient } from "@/utils/db/supabase/server";
import { getSummary, updateSummary } from "./summary";

interface ITransactions {
  id: string;
  title: string;
  amount: number;
  category: string;
  description: string;
  type: "income" | "expense";
  date: Date;
  user_id: string;
}

export async function createTransaction(transaction: any) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data, error } = await supabase.from("transactions").insert([
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
  // .select();

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

  revalidateTag(`/`);

  return;
}

export async function getTransactions({
  limit = 10,
}: {
  limit?: number;
}): Promise<ITransactions[] | []> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  //   const cachedGetTransactions = unstable_cache(
  //     async () => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user?.sub)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
}
// [`getTransactions-${user?.sub}-${limit}`], // Unique cache key
// { tags: [`transactions-user-${user?.sub}`] } // Associate with the "transactions" tag
//   );

//   return cachedGetTransactions();
// }

// export async function getTransactionsByMonth(month: string, year: string) {
//   const supabase = await createClient();
//   const user = await getCurrentUser();
//   const startDate = `${year}-${month}-01`;
//   const endDate = dayjs(startDate).add(1, "month").format("YYYY-MM-DD");

//   const { data } = await supabase
//     .from("transactions")
//     .select("*")
//     .gte("date", startDate)
//     .lt("date", endDate);

//   return data;
// }
