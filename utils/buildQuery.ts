import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonth, getYear } from "./formatDate";

type FilterParams = {
  type?: "custom" | "month" | "year" | "week";
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
  limit?: number;
};

export function buildQuery(query: any, filters: FilterParams) {
  const { type, startDate, endDate, month, year, limit } = filters;

  const applyMonthYearFilter = (m?: string, y?: string) => {
    if (m !== undefined) query = query.eq("month", m);
    if (y !== undefined) query = query.eq("year", y);
  };

  switch (type) {
    case "custom":
      if (startDate && endDate) {
        const dayAfterEndDate = new Date(
          new Date(endDate).getTime() + 24 * 60 * 60 * 1000
        ).toISOString();
        query = query
          .gte("created_at", startDate)
          .lte("created_at", dayAfterEndDate);
      }
      break;

    case "month":
      applyMonthYearFilter(month, year);
      break;

    case "year":
      applyMonthYearFilter(undefined, year);
      break;

    case "week": {
      const now = new Date();
      applyMonthYearFilter(getMonth({ dateString: now }), getYear({ dateString: now }));
      break;
    }

    default:
      break;
  }

  if (limit !== undefined) query = query.limit(limit);

  return query;
}
