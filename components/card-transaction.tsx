"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  deleteTransaction,
  type ITransactions,
} from "@/app/actions/transactions";
import { categoriesDefaults } from "@/constants/categories-defaults";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { icons } from "@/utils/icons";
import { toast } from "@/utils/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export function CardTransaction({
  transaction,
  onEdit,
  userId,
}: {
  transaction: ITransactions;
  onEdit?: (transaction: ITransactions) => void;
  onDelete?: (transactionId: string) => void;
  userId?: string;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const category = categoriesDefaults.find(
    (category) =>
      category.value.toLowerCase() === transaction.category.toLowerCase()
  );

  const Icon = category
    ? category.icon("text-white", 24)
    : categoriesDefaults[categoriesDefaults.length - 1].icon("", 24);

  const bgColor = category?.bgColor ? category?.bgColor : "bg-cyan-300";

  const handleEdit = () => {
    onEdit?.(transaction);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTransaction(transaction);
      // setIsDeleteDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.transactions.list(userId || ""),
      });
      toast("Transação excluída com sucesso!", {
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      toast("Erro ao excluir transação", {
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative group">
      <Card
        key={transaction.id}
        className={cn(
          "overflow-hidden  hover:shadow-md  group relative z-20 transition-all duration-300 cursor-pointer ",
          isOpen ? "w-[calc(100%-60px)]" : "w-full",
          !isOpen &&
            window.innerWidth > 700 &&
            "group-hover:w-[calc(100%-30px)]"
        )}
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
      >
        <CardContent className="relative">
          {/* Botão de ações - sempre visível em mobile, aparece no hover em desktop */}
          {/* <div className="absolute top-2 right-2 z-10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
              >
                {icons.moreVertical("h-4 w-4")}
                <span className="sr-only">Abrir menu de ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  {icons.edit("h-4 w-4")}
                  <span>Editar transação</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <div className="flex items-center gap-2">
                  {icons.trash("h-4 w-4")}
                  <span>Excluir transação</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div> */}

          <div className={"flex gap-3 items-start pr-8 sm:pr-4 "}>
            <div
              className={cn(
                "rounded-xl p-3 flex items-center justify-center flex-shrink-0",
                bgColor
              )}
            >
              {Icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold capitalize truncate sm:text-lg cursor-text w-fit">
                    {transaction.title}
                  </h3>
                  {category?.name && (
                    <p className="text-xs text-gray-500 font-medium cursor-text w-fit">
                      {category.name}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className={cn(
                      "text-lg font-bold sm:text-xl cursor-text",
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-2 leading-relaxed cursor-text w-fit">
                {transaction.description && transaction.description.length > 1
                  ? transaction.description
                  : "Nenhuma descrição disponível para esta transação"}
              </p>

              <div className="flex items-center justify-between text-xs">
                <p className="text-gray-400 font-medium cursor-text">
                  {formatDate(transaction.date.toString())}
                </p>

                <span
                  className={cn(
                    "hidden sm:inline-flex px-2 py-1 rounded-full text-xs font-medium cursor-text",
                    transaction.type === "income"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {transaction.type === "income" ? "Receita" : "Despesa"}
                </span>
              </div>

              {/* Botões de ação rápida em mobile - opcional */}
              <div className="flex gap-2 mt-3 sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex-1 h-8"
                >
                  <div className="flex items-center gap-1">
                    {icons.edit("h-3 w-3")}
                    <span className="text-xs">Editar</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="flex-1 h-8 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <div className="flex items-center gap-1">
                    {icons.trash("h-3 w-3")}
                    <span className="text-xs">Excluir</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
          {/* Dialog de confirmação para exclusão */}
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a transação "
                  {transaction.title}
                  "? Esta ação não pode ser desfeita.
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
                    "Excluir"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className=" absolute inset-0 z-10  flex ">
        <div className="flex-1">a</div>

        <div
          className={cn(
            "flex-1  ease-in-out flex items-center rounded-2xl pr-3 justify-end bg-gray-500"
          )}
        >
          {isOpen ? (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                className="bg-orange-600 hover:!bg-orange-500"
                onClick={handleEdit}
              >
                {icons.edit()}
              </Button>
              <Button
                variant="default"
                className="bg-red-600 hover:bg-red-500"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                {icons.trash("text-white")}
              </Button>
            </div>
          ) : (
            window.innerWidth > 700 && (
              <span
                className={cn(
                  "rotate-90 origin-top-left text-sm font-medium  whitespace-nowrap  absolute -right-27 top-5.5"
                )}
              >
                Clique para editar
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
