import { getCurrentUser } from "@/lib/supabase/get-user";
import { createClient } from "@/utils/db/supabase/server";

interface ISummary {
  id: string;
  user_id: string;
  total_income: number;
  total_expense: number;
  total_balance: number;
  created_at: Date;
  updated_at: Date;
}

export async function getSummary(): Promise<ISummary> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  //   const cachedGetTransactions = unstable_cache(
  //     async () => {
  const { data, error } = await supabase
    .from("user_financial_summary")
    .select("*")
    .eq("user_id", user?.sub);
  // .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  const dataSummary = data[0] as ISummary;

  return dataSummary;
}

export async function createSummary() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const isSummaryUser = await getSummary();

  if (!isSummaryUser) {
    const { data, error } = await supabase
      .from("user_financial_summary")
      .insert([
        {
          user_id: user?.sub,
        },
      ]);

    if (error) {
      throw error;
    }

    return data;
  }
}

export async function updateSummary({
  total_income,
  total_expense,
  total_balance,
}: {
  total_income: number;
  total_expense: number;
  total_balance: number;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("user_financial_summary")
    .update({
      total_income,
      total_expense,
      total_balance,
    })
    .eq("user_id", user?.sub);
  console.log(data);
  if (error) {
    throw error;
  }
  console.log("updtate success");
  return data;
}
