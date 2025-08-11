export const QUERY_KEYS = {
  transactions: {
    all: ["transactions"] as const,
    list: (userId: string) => ["transactions-list", userId] as const,
  },
  bills: {
    all: ["bills"] as const,
    lists: () => ["bills-list"] as const,
    list: (userId: string) => [...QUERY_KEYS.bills.lists(), userId] as const,
    details: () => ["bills-detail"] as const,
    detail: (id: string) => [...QUERY_KEYS.bills.details(), id] as const,
    overdue: (userId: string) => ["bills-overdue", userId] as const,
    byStatus: (userId: string, status: string) =>
      ["bills-status", userId, status] as const,
    byCategory: (userId: string, category: string) =>
      ["bills-category", userId, category] as const,
  },
} as const;
