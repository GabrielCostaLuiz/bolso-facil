"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  deleteBill,
  updateBillStatus,
} from "@/app/(application)/dashboard/[id]/bills/_actions";
import type { IBills } from "@/app/(application)/dashboard/[id]/bills/_types";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";
import { icons } from "@/utils/icons";
import { toast } from "@/utils/toast";
import { DialogBillEdit } from "./dialog-bill-edit";

interface CardBillProps {
  bill: IBills;
  userId: string;
}

const categoryIcons = {
  housing: icons.home,
  utilities: icons.zap,
  transport: icons.car,
  subscriptions: icons.smartphone,
  insurance: icons.shield,
  others: icons.moreHorizontal,
};

const categoryLabels = {
  housing: "Moradia",
  utilities: "Utilidades",
  transport: "Transporte",
  subscriptions: "Assinaturas",
  insurance: "Seguros",
  others: "Outros",
};

const statusConfig = {
  paid: {
    label: "Paga",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: icons.checkCircle,
    iconColor: "text-green-600",
  },
  pending: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: icons.clock,
    iconColor: "text-yellow-600",
  },
  overdue: {
    label: "Vencida",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: icons.alertTriangle,
    iconColor: "text-red-600",
  },
};

const recurrenceLabels = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannually: "Semestral",
  annually: "Anual",
};

export function CardBill({ bill, userId }: CardBillProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const CategoryIcon = categoryIcons[bill.category];
  const statusInfo = statusConfig[bill.status];
  const StatusIcon = statusInfo.icon;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const dueDate = new Date(bill.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();

  const handleStatusUpdate = async (
    newStatus: "paid" | "pending" | "overdue"
  ) => {
    setIsUpdatingStatus(true);
    try {
      await updateBillStatus(bill.id, newStatus);

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bills.list(userId),
      });

      toast(
        `Conta ${
          newStatus === "paid" ? "marcada como paga" : "status atualizado"
        } com sucesso!`,
        { type: "success" }
      );
    } catch (error) {
      console.error("Erro ao atualizar status da conta:", error);
      toast("Erro ao atualizar status da conta", { type: "error" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBill(bill.id);

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bills.list(userId),
      });

      toast("Conta excluída com sucesso!", { type: "success" });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast("Erro ao excluir conta", { type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="w-full hover:shadow-md transition-shadow duration-200">
        <CardContent className="">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  "rounded-xl p-3 flex items-center justify-center flex-shrink-0 bg-red-500",
                  statusInfo.color
                )}
              >
                {CategoryIcon(statusInfo.iconColor)}
              </div>
              {/* <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {CategoryIcon("h-5 w-5 text-gray-600")}
                </div>
              </div> */}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold capitalize truncate sm:text-lg cursor-text w-fit">
                      {bill.name}
                    </h3>
                    {bill.description && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {bill.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold sm:text-xl cursor-text">
                      {formatCurrency(bill.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[bill.category]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {recurrenceLabels[bill.recurrenceType]}
                  </Badge>
                  <Badge className={cn("text-xs border", statusInfo.color)}>
                    {StatusIcon(cn("h-3 w-3 mr-1", statusInfo.iconColor))}

                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      {icons.calendar("h-4 w-4")}
                      Vence: {formatDate(bill.dueDate)}
                    </span>

                    {bill.status !== "paid" && (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          daysUntilDue < 0
                            ? "text-red-600"
                            : daysUntilDue <= 3
                            ? "text-yellow-600"
                            : "text-gray-500"
                        )}
                      >
                        {daysUntilDue < 0
                          ? `${Math.abs(daysUntilDue)} dias em atraso`
                          : daysUntilDue === 0
                          ? "Vence hoje"
                          : `${daysUntilDue} dias restantes`}
                      </span>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus
                          ? icons.loader2("h-4 w-4 animate-spin")
                          : icons.moreVertical("h-4 w-4")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {bill.status !== "paid" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate("paid")}
                          className="text-green-600"
                        >
                          {icons.checkCircle("h-4 w-4 mr-2")}
                          Marcar como paga
                        </DropdownMenuItem>
                      )}

                      {bill.status !== "pending" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate("pending")}
                          className="text-yellow-600"
                        >
                          {icons.clock("h-4 w-4 mr-2")}
                          Marcar como pendente
                        </DropdownMenuItem>
                      )}

                      {/* <DropdownMenuItem className="text-blue-600" asChild>
                        <DialogBillEdit
                          open={isEditDialogOpen}
                          onOpenChange={setIsEditDialogOpen}
                          bill={bill}
                        />
                      </DropdownMenuItem> */}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-red-600"
                      >
                        {icons.trash("h-4 w-4")}
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {bill.lastPaidDate && (
                  <div className="mt-2 text-xs text-gray-400">
                    Última vez paga: {formatDate(bill.lastPaidDate)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{bill.name}"? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  {icons.loader2("animate-spin h-4 w-4")}
                  <span>Excluindo...</span>
                </div>
              ) : (
                "Excluir conta"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
