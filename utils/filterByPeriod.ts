import type { UnifiedTransaction } from "@/app/(application)/dashboard/[id]/transactions/_types";
import { getDay, getMonth, getYear } from "./formatDate";
import { useMemo } from "react";

export type TimeRange = "week" | "month" | "year" | "custom";

export function filterByPeriod(
  transactions: UnifiedTransaction[],
  period: TimeRange
): UnifiedTransaction[] {
  const now = new Date();
  const today = new Date(
    +getYear({ dateString: now }),
    +getMonth({ dateString: now }),
    +getDay({ dateString: now })
  );

  switch (period) {
    case "week": {
      // Pega o início da semana (domingo)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      // Pega o fim da semana (sábado)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return transactions.filter((transaction) => {
        const transactionDate = new Date(
          transaction.date || transaction.created_at
        );
        return transactionDate >= startOfWeek && transactionDate <= endOfWeek;
      });
    }

    case "month": {
      const startOfMonth = new Date(+getYear({ dateString: today }), +getMonth({ dateString: today }));
      const endOfMonth = new Date(
        +getYear({ dateString: today }),
        +getMonth({ dateString: today }),
        0,
        23,
        59,
        59,
        999
      );

      return transactions.filter((transaction) => {
        const transactionDate = new Date(
          transaction.date || transaction.created_at
        );
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      });
    }

    case "year": {
      const startOfYear = new Date(+getYear({ dateString: today }), 0, 1);
      const endOfYear = new Date(+getYear({ dateString: today }), 11, 31, 23, 59, 59, 999);

      return transactions.filter((transaction) => {
        const transactionDate = new Date(
          transaction.date || transaction.created_at
        );
        return transactionDate >= startOfYear && transactionDate <= endOfYear;
      });
    }

    default:
      return transactions;
  }
}

// Hook para obter informações do período selecionado
export function usePeriodInfo(type: TimeRange, month?: number, year?: number) {
  const currentDate = new Date();

  const periodInfo = useMemo(() => {
    switch (type) {
      case "week": {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return {
          label: "Esta Semana",
          dateRange: `${startOfWeek.toLocaleDateString(
            "pt-BR"
          )} - ${endOfWeek.toLocaleDateString("pt-BR")}`,
        };
      }

      case "month": {
        const monthNames = [
          "Janeiro",
          "Fevereiro",
          "Março",
          "Abril",
          "Maio",
          "Junho",
          "Julho",
          "Agosto",
          "Setembro",
          "Outubro",
          "Novembro",
          "Dezembro",
        ];

        const displayMonth = month || currentDate.getMonth() + 1;
        const displayYear = year || currentDate.getFullYear();

        return {
          label: `${monthNames[displayMonth - 1]} ${displayYear}`,
          dateRange: `${displayMonth}/${displayYear}`,
        };
      }

      case "year": {
        const displayYear = year || currentDate.getFullYear();
        return {
          label: `Ano ${displayYear}`,
          dateRange: displayYear.toString(),
        };
      }

      default:
        return {
          label: "Período Personalizado",
          dateRange: "",
        };
    }
  }, [type, month, year, currentDate]);

  return periodInfo;
}
