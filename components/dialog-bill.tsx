"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import * as z from "zod";
import { createBill } from "@/app/(application)/dashboard/[id]/bills/_actions";
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
import { QUERY_KEYS } from "@/constants/queryKeys";
import type { User } from "@/types/user";
import { icons } from "@/utils/icons";
import { toast } from "@/utils/toast";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

// Schema de validação
const billSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo"),
  amount: z.coerce.number().min(1, "Valor é obrigatório"),
  category: z.enum(
    [
      "housing",
      "utilities",
      "transport",
      "subscriptions",
      "insurance",
      "others",
    ],
    "Categoria é obrigatória"
  ),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  day: z.coerce.number().min(1).max(31, "Dia inválido"),
  recurrenceType: z.enum(
    ["monthly", "quarterly", "semiannually", "annually"],
    "Recorrência é obrigatória"
  ),
  description: z.string().max(200, "Descrição muito longa").optional(),
  reminderDays: z.coerce.number().min(0).max(30).optional(),
});

export type BillFormData = z.infer<typeof billSchema>;

const categoryOptions = [
  {
    value: "housing",
    label: "Moradia",
    icon: icons.home,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    value: "utilities",
    label: "Utilidades",
    icon: icons.zap,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  {
    value: "transport",
    label: "Transporte",
    icon: icons.car,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    value: "subscriptions",
    label: "Assinaturas",
    icon: icons.smartphone,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    value: "insurance",
    label: "Seguros",
    icon: icons.shield,
    color: "bg-red-100 text-red-700 border-red-200",
  },
  {
    value: "others",
    label: "Outros",
    icon: icons.moreHorizontal,
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
];

const recurrenceOptions = [
  {
    value: "monthly",
    label: "Mensal",
    description: "Todo mês",
    icon: icons.calendar,
  },
  {
    value: "quarterly",
    label: "Trimestral",
    description: "A cada 3 meses",
    icon: icons.calendar,
  },
  {
    value: "semiannually",
    label: "Semestral",
    description: "A cada 6 meses",
    icon: icons.calendar,
  },
  {
    value: "annually",
    label: "Anual",
    description: "Uma vez por ano",
    icon: icons.calendar,
  },
];

interface DialogBillProps {
  user: User | null;
  trigger?: React.ReactNode;
}

export function DialogBill({ user, trigger }: DialogBillProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<BillFormData>({
    resolver: zodResolver(billSchema) as Resolver<BillFormData>,
    defaultValues: {
      name: "",
      amount: 0,
      category: "housing",
      dueDate: "",
      day: new Date().getDate(),
      recurrenceType: "monthly",
      description: "",
      reminderDays: 0,
    },
  });

  // Update day field when dueDate changes
  const dueDate = form.watch("dueDate");
  useEffect(() => {
    if (dueDate) {
      const date = new Date(dueDate);
      if (!isNaN(date.getTime())) {
        form.setValue("day", date.getDate(), { shouldValidate: true });
      }
    }
  }, [dueDate, form]);

  const selectedCategory = categoryOptions.find(
    (cat) => cat.value === form.watch("category")
  );

  const selectedRecurrence = recurrenceOptions.find(
    (rec) => rec.value === form.watch("recurrenceType")
  );

  const handleSubmit = async (data: BillFormData) => {

    try {
      await createBill(data);
      form.reset();
      setOpen(false);

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bills.list(user?.sub || ""),
      });

      toast("Conta adicionada com sucesso!", {
        type: "success",
      });
    } catch (error: unknown) {
      console.error("Erro ao criar conta:", error);
      toast("Erro ao adicionar conta", {
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary/80 hover:bg-primary">
            {/* {icons.plus("h-4 w-4")} */}
            Criar Conta
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-[300px] max-sm:max-h-[400px] max-lg:max-h-[90%] hiddenScroll overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Adicionar Conta Fixa</DialogTitle>
          <DialogDescription>
            Cadastre uma nova conta recorrente para manter controle dos seus
            gastos fixos mensais.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Nome da Conta
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Aluguel, Internet..."
                        className="h-10"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Categoria
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue>
                            {selectedCategory && (
                              <div className="flex items-center gap-2">
                                {selectedCategory.icon()}
                                {/* <selectedCategory.icon className="h-4 w-4" /> */}
                                <span>{selectedCategory.label}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center gap-3">
                              {category.icon()}
                              {/* <category.icon className="h-4 w-4" /> */}
                              <span>{category.label}</span>
                            </div>
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
                name="recurrenceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Recorrência
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue>
                            {selectedRecurrence && (
                              <div className="flex items-center gap-2">
                                {selectedRecurrence.icon("h-4 w-4")}

                                <span>{selectedRecurrence.label}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recurrenceOptions.map((recurrence) => (
                          <SelectItem
                            key={recurrence.value}
                            value={recurrence.value}
                          >
                            <div className="flex flex-col items-start">
                              <div className="flex items-center gap-2">
                                {recurrence.icon("h-4 w-4")}

                                <span className="font-medium">
                                  {recurrence.label}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {recurrence.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Próximo Vencimento
                    </FormLabel>
                    <FormControl>
                      <Input type="date" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminderDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Lembrete{" "}
                      <span className="text-xs">
                        (dias antes do vencimento)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="30"
                          placeholder="3"
                          className="h-10"
                          {...field}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {icons.bell("h-4 w-4 text-gray-400")}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Descrição <span className="text-gray-400">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione detalhes sobre esta conta..."
                      className="resize-none min-h-[80px] max-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* {form.watch("name") && form.watch("amount") > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-700">
                    Preview da conta:
                  </h4>
                  <Badge className={selectedCategory?.color}>
                    {selectedCategory?.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    {form.watch("name")}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    R$ {form.watch("amount")}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Cobrança {selectedRecurrence?.label.toLowerCase()} •
                  {form.watch("reminderDays") &&
                    ` Lembrete ${form.watch("reminderDays")} dias antes`}
                </div>
              </div>
            )} */}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
                className=""
              >
                {form.formState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    {icons.loader2("animate-spin h-4 w-4")}

                    <span>Criando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Adicionar Conta</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
