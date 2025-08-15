export const revalidate = 86400;

import Image from "next/image";
import { getTransactions } from "@/app/(application)/dashboard/[id]/transactions/_actions";
import { getOrCreateSummary } from "@/app/actions/summary-new";
import { CardTransaction } from "@/components/card-transaction";
import { Link } from "@/components/common/link";
import { MonthYearSelector } from "@/components/month-year-selector";
import { SectionTemplate } from "@/components/template/section-template";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import groupElements from "@/public/groupElements.png";
import { evaluateBalance } from "@/utils/evaluateBalance";
import { formatCurrency } from "@/utils/formatCurrency";
import { getMonth, getYear } from "@/utils/formatDate";
import { icons } from "@/utils/icons";

export default async function BolsoFacilDashboard({
  searchParams,
}: {
  searchParams: Promise<{
    month: string;
    year: string;
    id: string;
  }>;
}) {
  const currentDate = new Date();
  const {
    month = getMonth({ dateString: currentDate }),
    year = getYear({ dateString: currentDate }),
    id,
  } = await searchParams;

  const transactions = await getTransactions({
    limit: 5,
    month,
    year,
    type: "month",
  });

  const summary = await getOrCreateSummary({
    month,
    year,
  });

  const isOnlyBills = transactions.every((transaction) => transaction.is_bill);

  const totalBills = transactions.reduce(
    (sum, transaction) => sum + -transaction.amount,
    0
  );

  const total =
    transactions.length > 0 && summary
      ? isOnlyBills
        ? totalBills
        : summary?.total_balance
      : 0;

  const income = summary?.total_income || 0;
  const expense =
    transactions.length > 0 && summary
      ? isOnlyBills
        ? Math.abs(totalBills)
        : summary?.total_expense
      : 0;

  const situation = evaluateBalance(total);

  return (
    <div className="space-y-5 pb-20">
      <SectionTemplate className="space-y-5 mt-2">
        {/* Adicionado o seletor de mês/ano */}
 
          <MonthYearSelector className="mb-4" />
     
        <Card className="relative overflow-hidden cardResume gap-0">
          <CardContent className="space-y-3 relative z-10 pb-5">
            <div className={cn(situation ? situation.color : "")}>
              <p className="text-sm">Total Balance</p>
              <p className={cn("text-3xl font-bold max-w-11/12 break-all")}>
                {formatCurrency(total)}
              </p>
            </div>

            {situation ? (
              <p className={situation.color}>{situation.message}</p>
            ) : (
              <p>
                Nenhum dado encontrado para {Number(month)}/{Number(year)}
              </p>
            )}
          </CardContent>
          <Image
            src={groupElements}
            alt="Elementos do card"
            className="absolute inset-0 object-fill w-full h-full"
          />
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="flex justify-between">
            <div className="flex flex-col md:items-center gap-2 flex-1 justify-center">
              <div className="text-center">
                {icons.arrowDown("text-green-600 mx-auto")}
              </div>
              <div className="text-center text-green-600">
                <p className="text-sm font-medium">Receita</p>
                <p className="font-bold text-xl">{formatCurrency(income)}</p>
              </div>
            </div>

            <div className="w-[1px] dark:bg-white bg-gray-500/30" />

            <div className="flex flex-col md:items-center gap-2 flex-1 justify-center">
              <div>{icons.arrowUp("text-red-600 mx-auto")}</div>
              <div className="text-center text-red-600">
                <p className="text-sm font-medium">Despesa</p>
                <p className="font-bold text-xl">{formatCurrency(expense)}</p>
              </div>
            </div>
          </CardContent>
          <div className="w-14 h-14 bg-purple-300 rounded-full absolute -top-8 -left-8" />
          <div className="w-9 h-9 bg-orange-200 rounded-full absolute -bottom-3 -right-4" />
        </Card>
      </SectionTemplate>

      <SectionTemplate>
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Transações Recentes</h2>
            <div className=" items-center">
              <Link
                href="/transactions"
                className="text-white hover:text-white/70 "
              >
                <div className="flex items-center gap-1 hover:text-primary group">
                  <span className=" group-hover:scale-105  transition-all">
                    Ver transações
                  </span>

                  {icons.arrowRight(
                    "h-4 w-4 group-hover:scale-105  transition-all"
                  )}
                </div>
              </Link>
            </div>
          </div>

          <div className="space-y-5 mt-5">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div key={transaction.id}>
                  <CardTransaction
                    transaction={transaction}
                    userId={id}
                    month={month}
                    year={year}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  {icons.receipt("h-12 w-12 mx-auto mb-4")}
                </div>
                <h3 className="text-lg font-medium mb-2">
                  Nenhuma transação encontrada para {month}/{year}
                </h3>
              </div>
            )}
          </div>
        </div>
      </SectionTemplate>
    </div>
  );
}
