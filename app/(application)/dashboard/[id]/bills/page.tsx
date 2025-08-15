"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
// import { CardBill } from "@/components/card-bill";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useInfoDashboard } from "@/context/info-dashboard-context";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";
import { icons } from "@/utils/icons";
import { toast } from "@/utils/toast";
import { deleteMultipleBills, getBills } from "./_actions";
import type { IBills } from "./_types";
import { CardBill } from "@/components/card-bill";

type BillStatus = "all" | "paid" | "pending" | "overdue";
type BillCategory =
  | "all"
  | "housing"
  | "utilities"
  | "transport"
  | "subscriptions"
  | "insurance"
  | "others";

export default function BillsPage() {
  const { urlBase, userId } = useInfoDashboard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<BillStatus>("all");
  const [selectedCategory, setSelectedCategory] = useState<BillCategory>("all");
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: billsData = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.bills.list(userId),
    queryFn: async () => await getBills(),
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Calcular totais
  const totalMonthlyAmount = useMemo(() => {
    return billsData.reduce((acc, bill) => acc + +bill.amount, 0);
  }, [billsData]);

  const totalPaidAmount = useMemo(() => {
    return billsData
      .filter((bill) => bill.status === "paid")
      .reduce((acc, bill) => acc + +bill.amount, 0);
  }, [billsData]);

  const totalPendingAmount = useMemo(() => {
    return billsData
      .filter((bill) => bill.status === "pending" || bill.status === "overdue")
      .reduce((acc, bill) => acc + +bill.amount, 0);
  }, [billsData]);

  const overdueCount = useMemo(() => {
    return billsData.filter((bill) => bill.status === "overdue").length;
  }, [billsData]);

  // Filtros
  const filterBillsByStatus = useMemo(() => {
    if (selectedStatus === "all") {
      return billsData;
    }
    return billsData.filter((bill) => bill.status === selectedStatus);
  }, [billsData, selectedStatus]);

  const filterBillsByCategory = useMemo(() => {
    if (selectedCategory === "all") {
      return filterBillsByStatus;
    }
    return filterBillsByStatus.filter(
      (bill) => bill.category === selectedCategory
    );
  }, [filterBillsByStatus, selectedCategory]);

  const filteredBills = useMemo(() => {
    if (!searchTerm.trim()) {
      return filterBillsByCategory;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return filterBillsByCategory.filter(
      (bill) =>
        bill.name.toLowerCase().includes(lowerSearchTerm) ||
        bill.category.toLowerCase().includes(lowerSearchTerm) ||
        bill.description?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [filterBillsByCategory, searchTerm]);

  // Agrupar contas por status
  const groupedBills = useMemo(() => {
    const grouped: { [key: string]: IBills[] } = {
      overdue: [],
      pending: [],
      paid: [],
    };

    filteredBills.forEach((bill) => {
      grouped[bill.status].push(bill);
    });

    // Ordenar por data de vencimento
    Object.keys(grouped).forEach((status) => {
      grouped[status].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
    });

    return grouped;
  }, [filteredBills]);

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedBills(new Set());
  };

  const toggleBillSelection = (billId: string) => {
    const newSelection = new Set(selectedBills);
    if (newSelection.has(billId)) {
      newSelection.delete(billId);
    } else {
      newSelection.add(billId);
    }
    setSelectedBills(newSelection);
  };

  const selectAllBills = () => {
    const allIds = new Set(filteredBills.map((b) => b.id));
    setSelectedBills(allIds);
  };

  const deselectAllBills = () => {
    setSelectedBills(new Set());
  };

  const handleMultipleDelete = async () => {
    if (selectedBills.size === 0) return;

    setIsDeleting(true);
    try {
      const result = await deleteMultipleBills(Array.from(selectedBills));

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bills.list(userId),
      });

      toast(
        `${
          result?.deletedCount || selectedBills.size
        } contas excluídas com sucesso!`,
        {
          type: "success",
        }
      );

      setSelectedBills(new Set());
      setIsMultiSelectMode(false);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir contas:", error);
      toast("Erro ao excluir contas", {
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedCategory("all");
    setSelectedBills(new Set());
    setIsMultiSelectMode(false);
    setIsAdvancedFiltersOpen(false);
  };

  const hasActiveFilters =
    searchTerm.trim() || selectedStatus !== "all" || selectedCategory !== "all";
  const activeFiltersCount = [
    searchTerm.trim() ? 1 : 0,
    selectedStatus !== "all" ? 1 : 0,
    selectedCategory !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  if (isLoading) {
    return <FallBackIsLoading className="items-start pt-20" />;
  }

  const selectedCount = selectedBills.size;
  const allSelected =
    filteredBills.length > 0 && selectedCount === filteredBills.length;

  const statusOptions = [
    { value: "all", label: "Todas", icon: null, color: "" },
    {
      value: "overdue",
      label: "Vencidas",
      icon: icons.alertTriangle,
      color: "text-red-600",
    },
    {
      value: "pending",
      label: "Pendentes",
      icon: icons.clock,
      color: "text-yellow-600",
    },
    {
      value: "paid",
      label: "Pagas",
      icon: icons.checkCircle,
      color: "text-green-600",
    },
  ];

  const categoryOptions = [
    { value: "all", label: "Todas" },
    { value: "housing", label: "Moradia" },
    { value: "utilities", label: "Utilidades" },
    { value: "transport", label: "Transporte" },
    { value: "subscriptions", label: "Assinaturas" },
    { value: "insurance", label: "Seguros" },
    { value: "others", label: "Outros" },
  ];

  return (
    <div className="space-y-5 pb-24">
      <SectionTemplate className="pt-4">
        <h1 className="text-xl font-bold text-center mb-10">Contas Fixas</h1>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {icons.search("h-4 w-4 text-gray-400")}
            </div>
            <Input
              type="text"
              placeholder="Buscar por nome, categoria ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between ">
            <div className="flex gap-2 order-1 sm:order-2 max-sm:mx-auto flex-wrap justify-center">
              {statusOptions.map((statusOption) => {
                if (statusOption.value === "all") {
                  return;
                }
                return (
                  <Button
                    key={statusOption.value}
                    variant={
                      selectedStatus === statusOption.value
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={() =>
                      setSelectedStatus(
                        (prev): BillStatus =>
                          prev === statusOption.value
                            ? "all"
                            : (statusOption.value as BillStatus)
                      )
                    }
                  >
                    {statusOption.icon && (
                      <span className={statusOption.color}>
                        {statusOption.icon("h-3.5 w-3.5")}
                      </span>
                    )}
                    {statusOption.label}
                    {statusOption.value === "overdue" && overdueCount > 0 && (
                      <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {overdueCount}
                      </span>
                    )}
                  </Button>
                );
              })}
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
                          Categoria
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {categoryOptions.map((category) => (
                            <Button
                              key={category.value}
                              variant={
                                selectedCategory === category.value
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              className="text-xs"
                              onClick={() =>
                                setSelectedCategory(
                                  category.value as BillCategory
                                )
                              }
                            >
                              {category.label}
                            </Button>
                          ))}
                        </div>
                      </div>
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
                  Mostrando {filteredBills.length} de {billsData.length} contas
                </div>
                <div className="flex gap-2 flex-wrap text-xs justify-center">
                  {selectedStatus !== "all" && (
                    <span className="text-gray-700 bg-gray-300 font-semibold px-2 py-1 rounded border">
                      Status:{" "}
                      {
                        statusOptions.find((s) => s.value === selectedStatus)
                          ?.label
                      }
                    </span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="text-gray-700 bg-gray-300 font-semibold px-2 py-1 rounded border">
                      Categoria:{" "}
                      {
                        categoryOptions.find(
                          (c) => c.value === selectedCategory
                        )?.label
                      }
                    </span>
                  )}
                  {searchTerm.trim() && (
                    <span className="text-gray-700 bg-gray-300 font-semibold px-2 py-1 rounded border break-all">
                      Busca: "{searchTerm}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-1">
                {icons.creditCard("h-4 w-4")}
                Total Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 break-words">
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalMonthlyAmount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
                {icons.checkCircle("h-4 w-4")}
                Pagas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 break-words">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaidAmount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                {icons.alertTriangle("h-4 w-4")}
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 break-words">
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalPendingAmount)}
              </p>
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
                          selectAllBills();
                        } else {
                          deselectAllBills();
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
                      onClick={deselectAllBills}
                    >
                      Limpar seleção
                    </Button>
                  )}
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
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
              </div>
            </div>
          </Card>

          {filteredBills.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                {icons.creditCard("h-12 w-12 mx-auto mb-4")}
              </div>
              <h3 className="text-lg font-medium mb-2">
                Nenhuma conta encontrada
              </h3>
              <p className="text-gray-500">
                {hasActiveFilters
                  ? "Tente ajustar os filtros aplicados"
                  : "Não há contas cadastradas"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedBills.overdue.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide flex items-center gap-2">
                      {icons.alertTriangle("h-4 w-4")}
                      Vencidas
                    </h2>
                    <div className="text-xs text-gray-400">
                      {groupedBills.overdue.length}{" "}
                      {groupedBills.overdue.length !== 1 ? "contas" : "conta"}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {groupedBills.overdue.map((bill) => (
                      <div key={bill.id} className="flex items-center gap-3">
                        {isMultiSelectMode && (
                          <Checkbox
                            checked={selectedBills.has(bill.id)}
                            onCheckedChange={() => toggleBillSelection(bill.id)}
                          />
                        )}
                        <div className="flex-1">
                          <CardBill bill={bill} userId={userId} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contas Pendentes */}
              {groupedBills.pending.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wide flex items-center gap-2">
                      {icons.clock("h-4 w-4")}
                      Pendentes
                    </h2>
                    <div className="text-xs text-gray-400">
                      {groupedBills.pending.length}{" "}
                      {groupedBills.pending.length !== 1 ? "contas" : "conta"}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {groupedBills.pending.map((bill) => (
                      <div key={bill.id} className="flex items-center gap-3">
                        {isMultiSelectMode && (
                          <Checkbox
                            checked={selectedBills.has(bill.id)}
                            onCheckedChange={() => toggleBillSelection(bill.id)}
                          />
                        )}
                        <div className="flex-1">
                          <CardBill bill={bill} userId={userId} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contas Pagas */}
              {groupedBills.paid.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wide flex items-center gap-2">
                      {icons.checkCircle("h-4 w-4")}
                      Pagas
                    </h2>
                    <div className="text-xs text-gray-400">
                      {groupedBills.paid.length}{" "}
                      {groupedBills.paid.length !== 1 ? "contas" : "conta"}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {groupedBills.paid.map((bill) => (
                      <div key={bill.id} className="flex items-center gap-3">
                        {isMultiSelectMode && (
                          <Checkbox
                            checked={selectedBills.has(bill.id)}
                            onCheckedChange={() => toggleBillSelection(bill.id)}
                          />
                        )}
                        <div className="flex-1">
                          <CardBill bill={bill} userId={userId} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão múltipla</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir {selectedCount}{" "}
                {selectedCount !== 1 ? "contas" : "conta"}? Esta ação não pode
                ser desfeita.
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
                    selectedCount !== 1 ? "contas" : "conta"
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
