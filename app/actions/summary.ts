// import type { SupabaseClient } from "@supabase/supabase-js";
// import type { User } from "@/types/user";


// export interface ISummary {
//   id: string;
//   user_id: string;
//   total_income: number;
//   total_expense: number;
//   total_balance: number;
//   updated_at: Date;
//   month: number;
//   year: number;
// }

// type ISummaryGetSummary = Partial<
//   Omit<ISummary, "id" | "user_id" | "updated_at">
// > & {
//   user: User | null;
//   db: SupabaseClient<any, "public", any>;
// };

// export async function getSummary({
//   month,
//   year,
//   user,
//   db,
//   total_income,
//   total_expense,
//   total_balance,
// }: ISummaryGetSummary): Promise<ISummary | { messagem: string }> {
//   try {
//     const { data: summary, error: summaryError } = await db
//       .from("user_monthly_summary")
//       .select("*")
//       .eq("user_id", user?.sub)
//       .eq("month", month)
//       .eq("year", year)
//       .single();

//     if (summaryError) {
//       throw summaryError;
//     }

//     if (!summary) {
//       throw new Error("Summary not found");
//     }

//     return summary;
//   } catch (errorCatch) {
//     const { data: billInstances, error: billsError } = await db
//       .from("bill_instances")
//       .select("amount, status")
//       .eq("user_id", user?.sub)
//       .eq("month", month)
//       .eq("year", year);

//     if (billsError) {
//       console.error("Error fetching bill instances:", billsError);
//       throw billsError;
//     }

//     // Calculate totals from bill instances
//     const totalBills = billInstances.reduce((sum, bill) => {
//       return sum + (parseFloat(bill.amount) || 0);
//     }, 0);
 
//     const paidBills = billInstances
//       .filter((bill) => bill.status === "paid")
//       .reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);

//     const pendingBills = totalBills - paidBills;


// const totalIncome = total_income ?? 0;
// const totalExpense = total_expense ?? 0 + pendingBills;
// const balance = totalIncome - totalExpense;
//     // Create or update the summary
//     const summaryData = {
//       user_id: user?.sub,
//       month,
//       year,
//       total_income: totalIncome,
//       total_expense: totalExpense,
//       total_balance: balance,
//       date_unique: `${month}-${year}`,
//     };

//     // Insert or update the summary
//     const { error: upsertError } = await db
//       .from("user_monthly_summary")
//       .upsert(summaryData)
//       .select()
//       .single();

//     if (upsertError) {
//       console.error("Error creating/updating summary:", upsertError);
//       throw upsertError;
//     }

//     return { messagem: "Summary created with bills included" };
//   }
// }

// // export async function getSummaryDashboardResume({
// //   month,
// //   year,
// // }: Omit<
// //   ISummary,
// //   | "id"
// //   | "user_id"
// //   | "updated_at"
// //   | "total_balance"
// //   | "total_income"
// //   | "total_expense"
// // >): Promise<ISummary | { messagem: string; status: number }> {
// //   try {
// //     const { user, db } = await CheckUserAndDB();

// //     const { data, error } = await db
// //       .from("user_monthly_summary")
// //       .select("*")
// //       .eq("user_id", user?.sub)
// //       .eq("month", month)
// //       .eq("year", year)
// //       .single();

// //     if (error) {
// //       throw error;
// //     }

// //     return data;
// //   } catch (error) {
// //     console.log(error);
// //     return { messagem: "Summary not found" as string, status: 404 };
// //   }
// // }

// // export async function createSummary(user: User, supabase) {
// //   // const supabase = await createClient();
// //   // const isSummaryUser = await getSummary();
// //   console.log(isSummaryUser);
// //   if (!isSummaryUser) {
// //     const { data, error } = await supabase
// //       .from("user_financial_summary")
// //       .insert([
// //         {
// //           user_id: user?.sub,
// //         },
// //       ]);

// //     if (error) {
// //       throw error;
// //     }
// //     console.log(data);
// //     return data;
// //   }
// // }

// export async function updateSummary({
//   total_income,
//   total_expense,
//   total_balance,
//   user,
//   db,
//   month,
//   year,
// }: {
//   total_income: number;
//   total_expense: number;
//   total_balance: number;
//   user: User | null;
//   db: SupabaseClient<any, "public", any>;
//   month: number;
//   year: number;
// }) {
//   // const { user, db } = await CheckUserAndDB();

//   const { data, error } = await db
//     .from("user_monthly_summary")
//     .update({
//       total_income,
//       total_expense,
//       total_balance,
//     })
//     .eq("user_id", user?.sub)
//     .eq("month", month)
//     .eq("year", year)
//     .select();

//   if (error) {
//     throw error;
//   }

//   console.log("updtate success");
//   return data;
// }
