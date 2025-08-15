"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import * as z from "zod";
import { updateTransaction } from "@/app/(application)/dashboard/[id]/transactions/_actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  billCategories,
  expenseCategories,
  incomeCategories,
  type CategoryKeys,
} from "@/constants/categories-defaults";
import { QUERY_KEYS } from "@/constants/queryKeys";
import type { User } from "@/types/user";
import { icons } from "@/utils/icons";
import { toast } from "@/utils/toast";
import { Button } from "./ui/button";
import type { UnifiedTransaction } from "@/app/(application)/dashboard/[id]/transactions/_types";
import { getMonth, getYear } from "@/utils/formatDate";

const categoriesExpenses = expenseCategories.map((cat) => cat.value);
const categoriesIncome = incomeCategories.map((cat) => cat.value);
const categoriesBills = billCategories.map((cat) => cat.value);
const categoriesAll = [...categoriesExpenses, ...categoriesIncome, ...categoriesBills];

const transactionSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  amount: z.coerce.number().min(1, "Valor é obrigatório"),
  type: z.enum(["income", "expense"], "Tipo é obrigatório"),
  category: z.enum(categoriesAll, "Categoria é obrigatória"),
  description: z.string().optional(),
  date: z.string().min(1, "Data é obrigatória"),
  month: z.number(),
  year: z.number(),
});

export type EditTransactionFormData = z.infer<typeof transactionSchema>;


interface DialogEditTransactionProps {
  transaction: UnifiedTransaction;
  userId: string;
  trigger?: React.ReactNode;
}

export function DialogEditTransaction({
  transaction,
  userId,
}: DialogEditTransactionProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<EditTransactionFormData>({
    resolver: zodResolver(
      transactionSchema
    ) as Resolver<EditTransactionFormData>,
    defaultValues: {
      title: "",
      amount: 0,
      type: "income",
      category: "food",
      description: "",
      date: new Date().toISOString().substring(0, 10),
      month: 0,
      year: 0,
    },
  });

  const categoryOptions =
    form.watch("type") === "income" ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (transaction && open) {
      form.reset({
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description || "",
        date: transaction.date?.substring(0, 10) ||  new Date().toISOString().substring(0, 10),
        month: transaction.month,
        year: transaction.year,
      });
    }
  }, [transaction, open, form]);

  const handleSubmit = async (data: EditTransactionFormData) => {
    const dateObj = new Date(data.date + "T00:00:00");

    const dataFormatted = {
      ...data,
      date: dateObj,
      month: getMonth({dateString: dateObj}),
      year: getYear({dateString: dateObj}),
    };

    try {
      await updateTransaction(transaction.id, dataFormatted);

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.transactions.list(userId || ""),
      });

      toast("Transação atualizada com sucesso!", {
        type: "success",
      });
      setOpen(false);
      form.reset();
    } catch (error: unknown) {
      console.error("Erro ao atualizar transação:", error);
      toast("Erro ao atualizar transação", {
        type: "error",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };
 
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="bg-orange-600 hover:!bg-orange-500"
        >
          {icons.edit()}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[400px] max-sm:max-h-[500px] max-lg:max-h-[90%] hiddenScroll overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
          <DialogDescription>
            Modifique os dados da transação conforme necessário.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Salário, Compras, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione detalhes sobre a transação..."
                      className="resize-none max-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                {form.formState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    {icons.loader2("animate-spin h-4 w-4")}
                    <span>Salvando...</span>
                  </div>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
