"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { getTransactions } from "@/app/(application)/dashboard/[id]/transactions/_actions";
import { CardTransaction } from "@/components/card-transaction";
import { MonthYearSelector } from "@/components/month-year-selector"; // Import do seletor
import { FallBackIsLoading } from "@/components/template/fallback-is-loading";
import { SectionTemplate } from "@/components/template/section-template";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useInfoDashboard } from "@/context/info-dashboard-context";
import { cn } from "@/lib/utils";
import { filterByPeriod } from "@/utils/filterByPeriod";
import { formatCurrency } from "@/utils/formatCurrency";
import { getMonth, getYear } from "@/utils/formatDate";
import { icons } from "@/utils/icons";
import type { GetTransactionsParams, UnifiedTransaction } from "./_types";

export type TimeRange = "week" | "month" | "year" | "custom";
type TransactionType = "all" | "income" | "expense";

export default function TransactionsPage() {
  const { urlBase, userId } = useInfoDashboard();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType>("all");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set()
  );
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const currentDate = new Date();
  const currentMonth = getMonth({ dateString: currentDate });
  const currentYear = getYear({ dateString: currentDate });


  // Pega parâmetros da URL
  const type: TimeRange = (searchParams.get("type") as TimeRange) ?? "month";
  const monthParam = searchParams.get("month") ?? +currentMonth;
  const yearParam = searchParams.get("year") ?? +currentYear;


  // Usa mês/ano atual se não tiver na URL
  // const selectedMonth = monthParam
  //   ? parseInt(monthParam)
  //   : currentDate.getMonth() + 1;
  // const selectedYear = yearParam
  //   ? parseInt(yearParam)
  //   : currentDate.getFullYear();

  // Parâmetros para a query baseados no tipo de filtro
  const queryParams: GetTransactionsParams = useMemo(() => {
    const baseParams = { type, month: String(monthParam), year: String(yearParam) };

    if (type === "custom" && customDateStart && customDateEnd) {
      // Para filtro personalizado, usa datas específicas
      const startDate = new Date(customDateStart);
      const endDate = new Date(customDateEnd);
      endDate.setHours(23, 59, 59, 999);

      return {
        ...baseParams,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    } else if (type === "month") {
      // Para filtro por mês, usa mês/ano selecionados

      return {
        ...baseParams,
        month: String(monthParam),
        year: String(yearParam),
      };
    } else if (type === "year") {
      // Para filtro por ano, usa apenas o ano
      return {
        ...baseParams,
        year: String(yearParam),
      };
    } else if (type === "week") {
      // Para semana, busca do mês atual
      return {
        ...baseParams,
        month: currentMonth,
        year: currentYear,
      };
    } else {
      // Busca todas
      return baseParams;
    }
  }, [
    type,
    monthParam,
    yearParam,
    customDateStart,
    customDateEnd,
    currentMonth,
    currentYear,
  ]);

  const {
    data: transactionsDate = [],
    isLoading,
    isPending,
    isFetching,
  } = useQuery({
    queryKey: [
      ...QUERY_KEYS.transactions.list(userId),
      type,
      monthParam,
      yearParam,
      customDateStart,
      customDateEnd,
    ],
    queryFn: async () => {
   
      return await getTransactions({ ...queryParams });
    },
    retry: 1,
    refetchOnMount: true,
    // refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });

  // console.log(isPending)
  // console.log(isFetching)

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

      // Se mudou para mês e não tem mês/ano na URL, adiciona o atual
      if (newType === "month" && (!monthParam || !yearParam)) {
   
        params.set("month", Number(monthParam).toString());
        params.set("year", yearParam.toString());
      }

      router.push(`${urlBase}/transactions?${params.toString()}`);
    },
    [
      searchParams,
      router,
      urlBase,
      monthParam,
      yearParam,
    ]
  );

  // Filtro por período (semana/ano que não são feitos na query)
  const filterTransactionsByPeriod: UnifiedTransaction[] = useMemo(() => {
    if (type === "custom" || type === "month") {
      // Custom e month já foram filtrados na query
      return transactionsDate;
    }
    // Para semana e ano, aplica filtro no cliente
    return filterByPeriod(transactionsDate, type);
  }, [transactionsDate, type]);

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
        transaction.description?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [filterTransactionsByType, searchTerm]);

  const groupedTransactions = useMemo(() => {
    const grouped: { [key: string]: UnifiedTransaction[] } = {};

    filteredTransactions?.forEach((transaction) => {
      const dateObj = transaction.day
        ? parseISO(
            `${transaction.year}-${String(transaction.month).padStart(
              2,
              "0"
            )}-${String(transaction.day).padStart(2, "0")}`
          )
        : parseISO(transaction.date!.toString());
      const date = format(dateObj, "dd/MM/yyyy");

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

  //   const toggleMultiSelectMode = () => {
  //     setIsMultiSelectMode(!isMultiSelectMode);
  //     setSelectedTransactions(new Set());
  //   };

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

  // const handleMultipleDelete = async () => {
  //   if (selectedTransactions.size === 0) return;

  //   setIsDeleting(true);
  //   try {
  //     const result = await deleteMultipleTransactions(
  //       Array.from(selectedTransactions)
  //     );

  //     await queryClient.invalidateQueries({
  //       queryKey: QUERY_KEYS.transactions.list(userId),
  //     });

  //     toast(
  //       `${
  //         result?.deletedCount || selectedTransactions.size
  //       } transações excluídas com sucesso!`,
  //       {
  //         type: "success",
  //       }
  //     );

  //     setSelectedTransactions(new Set());
  //     setIsMultiSelectMode(false);
  //     setIsDeleteDialogOpen(false);
  //   } catch (error) {
  //     console.error("Erro ao excluir transações:", error);
  //     toast("Erro ao excluir transações", {
  //       type: "error",
  //     });
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setCustomDateStart("");
    setCustomDateEnd("");
    setSelectedTransactions(new Set());
    setIsMultiSelectMode(false);
    setIsAdvancedFiltersOpen(false);

    // Limpa parâmetros da URL e volta para mês atual
    const params = new URLSearchParams();
    params.set("type", "month");

    params.set(
      "month",
      `${+currentMonth}`
      // currentDate.getMonth() + 1 + ""
    );
    params.set("year", `${currentYear}`);
    router.push(`${urlBase}/transactions?${params.toString()}`);
  };

  const hasActiveFilters =
    searchTerm.trim() ||
    selectedType !== "all" ||
    type === "custom" ||
    (type === "month" &&
      (monthParam !== currentMonth || yearParam !== currentYear));

  const activeFiltersCount = [
    searchTerm.trim() ? 1 : 0,
    selectedType !== "all" ? 1 : 0,
    type === "custom" ? 1 : 0,
    type === "month" &&
    (monthParam !== currentMonth || yearParam !== currentYear)
      ? 1
      : 0,
  ].reduce((a, b) => a + b, 0);

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
        <h1 className="text-xl font-bold text-center mb-6">
          Histórico de Transações
        </h1>

        {/* Seletor de Mês/Ano - Apenas visível quando type é "month" */}
        {type === "month" && (
          <MonthYearSelector className="mb-6" isFetching={isFetching} />
        )}

        <div className="space-y-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {icons.search("h-4 w-4 text-gray-400")}
            </div>
            <Input
              type="text"
              placeholder="Buscar por título, categoria ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between ">
            <div className="flex gap-2 order-1 sm:order-2  max-sm:mx-auto">
              {[
                { value: "income", label: "Receitas", icon: icons.arrowDown },
                { value: "expense", label: "Despesas", icon: icons.arrowUp },
              ].map((typeOption) => (
                <Button
                  key={typeOption.value}
                  variant={
                    selectedType === typeOption.value ? "default" : "outline"
                  }
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() =>
                    setSelectedType(
                      (prev): TransactionType =>
                        prev === typeOption.value
                          ? "all"
                          : (typeOption.value as TransactionType)
                    )
                  }
                >
                  <span
                    className={
                      typeOption.value === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {typeOption.icon("h-3.5 w-3.5")}
                  </span>
                  {typeOption.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 order-2 sm:order-1 max-sm:mx-auto">
              <Collapsible
                open={isAdvancedFiltersOpen}
                onOpenChange={setIsAdvancedFiltersOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {icons.filter("h-4 w-4")}
                    Filtros Avançados
                    {activeFiltersCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                    {isAdvancedFiltersOpen
                      ? icons.chevronUp("h-4 w-4 ml-1")
                      : icons.chevronDown("h-4 w-4 ml-1")}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 w-11/12">
                  <Card className="p-4 shadow-lg border">
                    <div className="space-y-4">
                      {hasActiveFilters && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={clearFilters}
                          className="w-full bg-red-600 hover:bg-red-500 text-white"
                        >
                          Limpar filtros
                        </Button>
                      )}

                      <div>
                        <span className="text-sm font-medium text-gray-700 mb-2 block">
                          Período
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {["week", "month", "year", "custom"].map((range) => (
                            <Button
                              key={range}
                              variant={type === range ? "default" : "outline"}
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                handleChangeType(range as TimeRange);
                              }}
                            >
                              {range === "week" && "Semana"}
                              {range === "month" && "Mês"}
                              {range === "year" && "Ano"}
                              {range === "custom" && "Personalizado"}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {type === "custom" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                          <div>
                            <label
                              htmlFor="customDateStart"
                              className="text-sm font-medium text-gray-600 mb-1 block"
                            >
                              Data Início
                            </label>
                            <Input
                              type="date"
                              id="customDateStart"
                              name="customDateStart"
                              value={customDateStart}
                              onChange={(e) =>
                                setCustomDateStart(e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="customDateEnd"
                              className="text-sm font-medium text-gray-600 mb-1 block"
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
                    </div>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 mx-auto flex justify-center flex-col items-center">
                <div className="text-sm font-medium text-gray-700">
                  Mostrando {filteredTransactions.length} de{" "}
                  {transactionsDate.length} transações
                </div>
                <div className="flex gap-2 flex-wrap text-xs justify-center">
                  {selectedType !== "all" && (
                    <span className="text-gray-700 bg-gray-300 font-semibold px-2 py-1 rounded border ">
                      Tipo:{" "}
                      {selectedType === "income" ? "Receitas" : "Despesas"}
                    </span>
                  )}
                  {type === "month" &&
                    (monthParam !== currentDate.getMonth() + 1 ||
                      yearParam !== currentDate.getFullYear()) && (
                      <span className="text-gray-700 bg-gray-300 font-semibold px-2 py-1 rounded border ">
                        {monthParam}/{yearParam}
                      </span>
                    )}
                  {type === "custom" && customDateStart && customDateEnd && (
                    <span className="text-gray-700 bg-gray-300 font-semibold px-2 py-1 rounded border ">
                      {new Date(customDateStart).toLocaleDateString("pt-BR")} -{" "}
                      {new Date(customDateEnd).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {searchTerm.trim() && (
                    <span className="text-gray-700 bg-gray-300 font-semibold px-2 py-1 rounded border break-all ">
                      Busca: "{searchTerm}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

        <div className="space-y-6 relative">
          <Card
            className={cn(
              "mb-6 p-4 rounded-lg transition-all duration-200 sticky z-30 top-5",
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
              {/* <div className="flex items-center justify-end gap-2">
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
                  variant={isMultiSelectMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleMultiSelectMode}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white"
                >
                  {isMultiSelectMode
                    ? icons.squareX("h-4 w-4")
                    : icons.checkSquare("h-4 w-4")}

                  <span className="hidden sm:inline">
                    {isMultiSelectMode ? "Cancelar" : "Selecionar"}
                  </span>
                </Button>
              </div> */}
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
                {hasActiveFilters
                  ? "Tente ajustar os filtros aplicados"
                  : "Não há transações para o período selecionado"}
              </p>
            </div>
          ) : (
            Object.entries(groupedTransactions).map(([date, transactions]) => {
              const [day, month, year] = date.split("/").map(String);

              const monthFormatted = monthParam ? monthParam : month;

              const formattedDate = `${year}-${String(monthFormatted).padStart(
                2,
                "0"
              )}-${day}`;

              return (
                <div key={formattedDate} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      {/* {formatDate(formattedDate)} */}
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
                            // month={monthParam}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* <AlertDialog
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
        </AlertDialog> */}
      </SectionTemplate>
    </div>
  );
}
