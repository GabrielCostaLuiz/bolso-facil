"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  deleteMultipleTransactions,
  getTransactions,
  type ITransactions,
} from "@/app/actions/transactions";
import { CardTransaction } from "@/components/card-transaction";
import { FallBackIsLoading } from "@/components/template/fallback-is-loading";
import { SectionTemplate } from "@/components/template/section-template";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useInfoDashboard } from "@/context/info-dashboard-context";
import { cn } from "@/lib/utils";
import { filterByPeriod } from "@/utils/filterByPeriod";
import { formatCurrency } from "@/utils/formatCurrency";
import { icons } from "@/utils/icons";
import { toast } from "@/utils/toast";

export type TimeRange = "week" | "month" | "year" | "custom";
type TransactionType = "all" | "income" | "expense";

// export interface Transaction {
//   id: string;
//   created_at: string;
//   title: string;
//   amount: number;
//   category: string;
//   description: string;
//   date: string;
//   type: string;
//   user_id: string;
// }

export default function TransactionsPage() {
  const { urlBase, userId } = useInfoDashboard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType>("all");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");

  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set()
  );
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const type: TimeRange = (searchParams.get("type") as TimeRange) ?? "month";

  const { data: transactionsDate = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.transactions.list(userId),
    queryFn: async () => await getTransactions(),
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const totalIncome = useMemo(() => {
    return (
      transactionsDate
        ?.filter((transaction) => transaction.type === "income")
        .reduce((acc, transaction) => acc + transaction.amount, 0) ?? 0
    );
  }, [transactionsDate]);

  const totalExpense = useMemo(() => {
    return (
      transactionsDate
        ?.filter((transaction) => transaction.type === "expense")
        .reduce((acc, transaction) => acc + transaction.amount, 0) ?? 0
    );
  }, [transactionsDate]);

  const handleChangeType = useCallback(
    (newType: TimeRange) => {
      const params = new URLSearchParams(searchParams);
      if (params.get("type") === newType) return;

      params.set("type", newType);
      router.push(`${urlBase}/transactions?${params.toString()}`);
    },
    [searchParams, router.push, urlBase]
  );

  const filterTransactionsByPeriod: ITransactions[] = useMemo(() => {
    if (type === "custom" && customDateStart && customDateEnd) {
      const startDate = new Date(customDateStart);
      const endDate = new Date(customDateEnd);
      endDate.setHours(23, 59, 59, 999);

      return transactionsDate.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    return filterByPeriod(transactionsDate, type);
  }, [transactionsDate, type, customDateStart, customDateEnd]);

  const filterTransactionsByType = useMemo(() => {
    if (selectedType === "all") {
      return filterTransactionsByPeriod;
    }
    return filterTransactionsByPeriod.filter(
      (transaction) => transaction.type === selectedType
    );
  }, [filterTransactionsByPeriod, selectedType]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) {
      return filterTransactionsByType;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return filterTransactionsByType.filter(
      (transaction) =>
        transaction.title.toLowerCase().includes(lowerSearchTerm) ||
        transaction.category.toLowerCase().includes(lowerSearchTerm) ||
        transaction.description.toLowerCase().includes(lowerSearchTerm)
    );
  }, [filterTransactionsByType, searchTerm]);

  const groupedTransactions = useMemo(() => {
    const grouped: { [key: string]: ITransactions[] } = {};

    filteredTransactions?.forEach((transaction) => {
      const date = new Date(transaction.date).toLocaleDateString("pt-BR");
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    const sortedEntries = Object.entries(grouped).sort(([dateA], [dateB]) => {
      return (
        new Date(dateB.split("/").reverse().join("-")).getTime() -
        new Date(dateA.split("/").reverse().join("-")).getTime()
      );
    });

    return Object.fromEntries(sortedEntries);
  }, [filteredTransactions]);

  // Calcular totais dos dados filtrados
  const filteredTotalIncome = useMemo(() => {
    return (
      filteredTransactions
        ?.filter((transaction) => transaction.type === "income")
        .reduce((acc, transaction) => acc + transaction.amount, 0) ?? 0
    );
  }, [filteredTransactions]);

  const filteredTotalExpense = useMemo(() => {
    return (
      filteredTransactions
        ?.filter((transaction) => transaction.type === "expense")
        .reduce((acc, transaction) => acc + transaction.amount, 0) ?? 0
    );
  }, [filteredTransactions]);

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedTransactions(new Set());
  };

  const toggleTransactionSelection = (transactionId: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);
  };

  const selectAllTransactions = () => {
    const allIds = new Set(filteredTransactions.map((t) => t.id));
    setSelectedTransactions(allIds);
  };

  const deselectAllTransactions = () => {
    setSelectedTransactions(new Set());
  };

  const handleMultipleDelete = async () => {
    if (selectedTransactions.size === 0) return;

    setIsDeleting(true);
    try {
      const result = await deleteMultipleTransactions(
        Array.from(selectedTransactions)
      );

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.transactions.list(userId),
      });

      toast(
        `${
          result?.deletedCount || selectedTransactions.size
        } transações excluídas com sucesso!`,
        {
          type: "success",
        }
      );

      setSelectedTransactions(new Set());
      setIsMultiSelectMode(false);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir transações:", error);
      toast("Erro ao excluir transações", {
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setCustomDateStart("");
    setCustomDateEnd("");
    setSelectedTransactions(new Set());
    setIsMultiSelectMode(false);
    handleChangeType("month");
  };

  if (isLoading) {
    return <FallBackIsLoading className="items-start pt-20" />;
  }

  const selectedCount = selectedTransactions.size;
  const allSelected =
    filteredTransactions.length > 0 &&
    selectedCount === filteredTransactions.length;

  return (
    <div className="space-y-5 pb-24">
      <SectionTemplate className="pt-4">
        <h1 className="text-xl font-bold text-center mb-10">
          Histórico de Transações
        </h1>


        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 overflow-x-auto pb-2 mx-auto w-fit">
          {["week", "month", "year", "custom"].map((range) => (
            <Button
              key={range}
              variant={type === range ? "default" : "outline"}
              className="whitespace-nowrap"
              onClick={() => {
                handleChangeType(range as TimeRange);
              }}
            >
              {range === "week" && "Essa Semana"}
              {range === "month" && "Este Mês"}
              {range === "year" && "Este Ano"}
              {range === "custom" && "Período Personalizado"}
            </Button>
          ))}
        </div>

        {type === "custom" && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="customDateStart"
                className="text-sm font-medium text-gray-600 mb-2 block"
              >
                Data Início
              </label>
              <Input
                type="date"
                id="customDateStart"
                name="customDateStart"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="customDateEnd"
                className="text-sm font-medium text-gray-600 mb-2 block"
              >
                Data Fim
              </label>
              <Input
                type="date"
                id="customDateEnd"
                name="customDateEnd"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center items-center gap-2 mb-6 overflow-x-auto mx-auto border-y py-4">
          {[
            { value: "all", label: "Todas", icon: null },
            { value: "income", label: "Receitas", icon: icons.arrowDown },
            { value: "expense", label: "Despesas", icon: icons.arrowUp },
          ].map((typeOption) => (
            <Button
              key={typeOption.value}
              variant={
                selectedType === typeOption.value ? "default" : "outline"
              }
              className="whitespace-nowrap flex items-center gap-2"
              onClick={() =>
                setSelectedType(typeOption.value as TransactionType)
              }
            >
              {typeOption.icon && (
                <span
                  className={
                    typeOption.value === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {typeOption.icon("h-4 w-4")}
                </span>
              )}
              {typeOption.label}
            </Button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Card className="gap-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
                {icons.arrowDown("h-4 w-4")}
                Receitas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 break-words">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredTotalIncome)}
              </p>
              {filteredTotalIncome !== totalIncome && (
                <p className="text-xs text-gray-400 mt-1">
                  Total geral: {formatCurrency(totalIncome)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                {icons.arrowUp("h-4 w-4")}
                Despesas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 break-words text-red-600">
              <p className="text-2xl font-bold">
                {formatCurrency(filteredTotalExpense)}
              </p>
              {filteredTotalExpense !== totalExpense && (
                <p className="text-xs text-gray-400 mt-1">
                  Total geral: {formatCurrency(totalExpense)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="relative mb-6">
          <Input
            type="text"
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {(searchTerm.trim() || selectedType !== "all" || type === "custom") && (
          <div className="my-6 p-4 bg-card border rounded-lg">
            <div className="grid sm:grid-cols-2 items-center justify-center text-sm gap-5">
              <div className="space-y-1">
                <span>
                  Mostrando {filteredTransactions.length} de{" "}
                  {transactionsDate.length} transações
                </span>
                <div className="flex gap-2 flex-wrap text-xs text-gray-600">
                  {selectedType !== "all" && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      Tipo:{" "}
                      {selectedType === "income" ? "Receitas" : "Despesas"}
                    </span>
                  )}
                  {type === "custom" && customDateStart && customDateEnd && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      Período:{" "}
                      {new Date(customDateStart).toLocaleDateString("pt-BR")} -{" "}
                      {new Date(customDateEnd).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {searchTerm.trim() && (
                    <p className="bg-gray-100 px-2 py-1 rounded break-words">
                      Busca: "{searchTerm}"
                    </p>
                  )}
                </div>
              </div>
              <Button size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6 relative">
          <Card
            className={cn(
              "mb-6 p-4  rounded-lg transition-all duration-200 sticky z-30 top-5",
              selectedCount > 0 && "",
              isMultiSelectMode
                ? "bg-card border"
                : "border-none bg-transparent pl-0"
            )}
          >
            <div className="flex items-center justify-between gap-4">
              {isMultiSelectMode && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllTransactions();
                        } else {
                          deselectAllTransactions();
                        }
                      }}
                    />
                    <span className="text-sm font-medium">
                      {selectedCount > 0
                        ? `${selectedCount} selecionadas`
                        : "Selecionar todas"}
                    </span>
                  </div>

                  {selectedCount > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={deselectAllTransactions}
                      className=""
                    >
                      Limpar seleção
                    </Button>
                  )}
                </div>
              )}
              <div className="flex items-center  justify-end gap-2 ">
                {isMultiSelectMode && selectedCount > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    {icons.trash("h-4 w-4")}
                    <span>Excluir ({selectedCount})</span>
                  </Button>
                )}
                <Button
                  variant={isMultiSelectMode ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleMultiSelectMode}
                  className="flex items-center gap-2"
                >
                  {icons.checkSquare("h-4 w-4")}
                  <span className="hidden sm:inline">
                    {isMultiSelectMode ? "Cancelar" : "Selecionar"}
                  </span>
                </Button>
              </div>
            </div>
          </Card>

          {Object.keys(groupedTransactions).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                {icons.receipt("h-12 w-12 mx-auto mb-4")}
              </div>
              <h3 className="text-lg font-medium mb-2">
                Nenhuma transação encontrada
              </h3>
              <p className="text-gray-500">
                {searchTerm.trim() ||
                selectedType !== "all" ||
                type === "custom"
                  ? "Tente ajustar os filtros aplicados"
                  : "Não há transações para o período selecionado"}
              </p>
            </div>
          ) : (
            Object.entries(groupedTransactions).map(([date, transactions]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {date}
                  </h2>
                  <div className="text-xs text-gray-400">
                    {transactions.length}{" "}
                    {transactions.length !== 1 ? "transações" : "transação"}
                  </div>
                </div>

                <div className="space-y-5">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3"
                    >
                      {isMultiSelectMode && (
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={() =>
                            toggleTransactionSelection(transaction.id)
                          }
                        />
                      )}
                      <div className="flex-1">
                        <CardTransaction
                          transaction={transaction}
                          userId={userId}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dialog de confirmação para exclusão múltipla */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão múltipla</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir {selectedCount}{" "}
                {selectedCount !== 1 ? "transações" : "transação"}? Esta ação
                não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  handleMultipleDelete();
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    {icons.loader2("animate-spin h-4 w-4")}
                    <span>Excluindo...</span>
                  </div>
                ) : (
                  `Excluir ${selectedCount} ${
                    selectedCount !== 1 ? "transações" : "transação"
                  }`
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SectionTemplate>
    </div>
  );
}
