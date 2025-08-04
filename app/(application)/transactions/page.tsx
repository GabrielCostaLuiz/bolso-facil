"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Filter,
  Loader2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BottomNavigation } from "@/components/bottom-navigate";
import { SectionTemplate } from "@/components/template/sectionTemplate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { filterByPeriod } from "@/utils/filterByPeriod";
import { getTransactions } from "../../actions/transactions";

type TimeRange = "week" | "month" | "year";

interface Transaction {
  id: number;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: Date;
  icon: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type: TimeRange = (searchParams.get("type") as TimeRange) ?? "month";

  const {
    data: transactionsDate = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => await getTransactions({ limit: 5 }),
    // placeholderData: (prevData) => prevData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnMount: true,
  });

  const totalIncome = useMemo(() => {
    console.log("Oidsajsdask");
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
    (type: any) => {
      const params = new URLSearchParams(searchParams);
      params.set("type", type);
      router.push(`/transactions?${params.toString()}`);
    },
    [searchParams, router.push]
  );

  // const groupedTransactions = useMemo(() => {
  //   const grouped: { [key: string]: Transaction[] } = {};

  //   transactionsDate?.forEach((transaction) => {
  //     const date = new Date(transaction.date).toLocaleDateString();
  //     if (!grouped[date]) {
  //       grouped[date] = [];
  //     }
  //     grouped[date].push(transaction);
  //   });

  //   return grouped;
  // }, [transactionsDate]);

  const filter = filterByPeriod(transactionsDate, type);


  if (isLoading) {
    return <Loader2 className="animate-spin" />;
  }

  return (
    <div className="space-y-5 pb-24">
      <SectionTemplate className="pt-4">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-xl font-bold">Histórico de Transações</h1>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 mx-auto w-fit">
          {["week", "month", "year"].map((range) => (
            <Button
              key={range}
              variant={type === range ? "default" : "outline"}
              className="whitespace-nowrap"
              onClick={() => {
                handleChangeType(range);
              }}
            >
              {range === "week" && "Essa Semana"}
              {range === "month" && "Este Mês"}
              {range === "year" && "Este Ano"}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="gap-0 ">
            <CardHeader className="">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
                <ArrowDown className="h-4 w-4" />
                Receitas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">R$ {totalIncome.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardHeader className="">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                <ArrowUp className="h-4 w-4" />
                Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ {totalExpense.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Input type="text" placeholder="Buscar transações..." />
      </SectionTemplate>

      {/* <SectionTemplate className="space-y-6">
        {Object.entries(groupedTransactions).map(
          ([date, dailyTransactions]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">
                  {date.charAt(0).toUpperCase() + date.slice(1)}
                </h3>
                <span className="text-xs text-gray-400">
                  {dailyTransactions.length} transações
                </span>
              </div>

              <div className="space-y-2">
                {dailyTransactions.map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="!flex !flex-row items-center p-3"
                  >
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl dark:bg-gray-700">
                      {transaction.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{transaction.title}</h4>
                      <p className="text-sm text-gray-500">
                        {transaction.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === "income"
                            ? "text-primary"
                            : "text-red-500"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"} R$
                        {transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(transaction.date, "HH:mm")}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        )}
      </SectionTemplate> */}

      <BottomNavigation />
    </div>
  );
}
