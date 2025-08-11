import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/supabase/get-user";
import type { User } from "@/types/user";
import { CheckUserAndDB } from "@/utils/checkUserAndDB";
import { createClient } from "@/utils/db/supabase/server";

export interface ISummary {
  id: string;
  user_id: string;
  total_income: number;
  total_expense: number;
  total_balance: number;
  updated_at: Date;
  month: number;
  year: number;
}

type ISummaryGetSummary = Partial<
  Omit<ISummary, "id" | "user_id" | "updated_at">
> & {
  user: User | null;
  db: SupabaseClient<any, "public", any>;
};

export async function getSummary({
  month,
  year,
  user,
  db,
  total_income,
  total_expense,
  total_balance,
}: ISummaryGetSummary): Promise<ISummary | { messagem: string }> {
  try {
    const { data, error } = await db
      .from("user_monthly_summary")
      .select("*")
      .eq("user_id", user?.sub)
      .eq("month", month)
      .eq("year", year)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Summary not found");
    }

    return data;
  } catch (errorCatch) {
    const { error } = await db.from("user_monthly_summary").insert([
      {
        user_id: user?.sub,
        month,
        year,
        total_income: total_income ? total_income : 0,
        total_expense: total_expense ? total_expense : 0,
        total_balance: total_balance ? total_balance : 0,
      },
    ]);

    if (error) {
      throw error;
    }

    return { messagem: "Summary created" };
  }

  //   const cachedGetTransactions = unstable_cache(
  //     async () => {
}

export async function getSummaryDashboardResume({
  month,
  year,
}: Omit<
  ISummary,
  | "id"
  | "user_id"
  | "updated_at"
  | "total_balance"
  | "total_income"
  | "total_expense"
>): Promise<ISummary | { messagem: string; status: number }> {
  try {
    const { user, db } = await CheckUserAndDB();

    const { data, error } = await db
      .from("user_monthly_summary")
      .select("*")
      .eq("user_id", user?.sub)
      .eq("month", month)
      .eq("year", year)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.log(error);
    return { messagem: "Summary not found" as string, status: 404 };
  }
}

// export async function createSummary(user: User, supabase) {
//   // const supabase = await createClient();
//   // const isSummaryUser = await getSummary();
//   console.log(isSummaryUser);
//   if (!isSummaryUser) {
//     const { data, error } = await supabase
//       .from("user_financial_summary")
//       .insert([
//         {
//           user_id: user?.sub,
//         },
//       ]);

//     if (error) {
//       throw error;
//     }
//     console.log(data);
//     return data;
//   }
// }

export async function updateSummary({
  total_income,
  total_expense,
  total_balance,
  user,
  db,
  month,
  year,
}: {
  total_income: number;
  total_expense: number;
  total_balance: number;
  user: User | null;
  db: SupabaseClient<any, "public", any>;
  month: number;
  year: number;
}) {
  // const { user, db } = await CheckUserAndDB();

  const { data, error } = await db
    .from("user_monthly_summary")
    .update({
      total_income,
      total_expense,
      total_balance,
    })
    .eq("user_id", user?.sub)
    .eq("month", month)
    .eq("year", year)
    .select();

  if (error) {
    throw error;
  }

  console.log("updtate success");
  return data;
}
