export const QUERY_KEYS = {
  transactions: {
    all: ["transactions"] as const,
    list: (userId: string) => ["transactions-list", userId] as const,
  },
} as const;
