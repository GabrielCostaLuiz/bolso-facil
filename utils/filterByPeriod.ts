import { isSameMonth, isSameWeek, isSameYear, parseISO } from "date-fns";

type Period = "month" | "week" | "year";



export function filterByPeriod(
  transactions: any[],
  period: Period
): any[] {
  const now = new Date();

  return transactions.filter((transaction) => {
    const transactionDate = parseISO(transaction.date);

    switch (period) {
      case "month":
        return isSameMonth(transactionDate, now);
      case "week":
        return isSameWeek(transactionDate, now, { weekStartsOn: 1 }); 
      case "year":
        return isSameYear(transactionDate, now);
      default:
        return false;
    }
  });
}
