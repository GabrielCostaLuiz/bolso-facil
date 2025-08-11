export const revalidate = 86400;

import Image from "next/image";
import { getTransactions } from "@/app/(application)/dashboard/[id]/transactions/_actions";
import { getSummary, getSummaryDashboardResume } from "@/app/actions/summary";
import { CardTransaction } from "@/components/card-transaction";
import { Link } from "@/components/common/link";
import { MonthYearSelector } from "@/components/month-year-selector"; // Importe o componente
import { SectionTemplate } from "@/components/template/section-template";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import groupElements from "@/public/groupElements.png";
import { evaluateBalance } from "@/utils/evaluateBalance";
import { formatCurrency } from "@/utils/formatCurrency";
import { icons } from "@/utils/icons";

interface PageProps {
  searchParams: {
    month?: string;
    year?: string;
  };
}

export default async function BolsoFacilDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const currentDate = new Date();
  const month = params.month
    ? parseInt(params.month)
    : currentDate.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : currentDate.getFullYear();

  const transactions = await getTransactions({
    limit: 5,
    month,
    year,
    type: "month",
  });



  const summary = await getSummaryDashboardResume({
    month,
    year,
  });

  const hasSummary = "messagem" in summary;

  const situation = !hasSummary && evaluateBalance(summary.total_balance);


  return (
    <div className="space-y-5 pb-20">
      <SectionTemplate className="space-y-5 mt-2">
        {/* Adicionado o seletor de mês/ano */}
        <MonthYearSelector className="mb-4" />

        <Card className="relative overflow-hidden cardResume gap-0">
          <CardContent className="space-y-3 relative z-10 pb-5">
            <div className={cn(situation && situation.color)}>
              <p className="text-sm">Total Balance</p>
              <p className={cn("text-3xl font-bold max-w-11/12 break-all")}>
                {formatCurrency(!hasSummary ? summary.total_balance : 0)}
              </p>
            </div>

            {situation ? (
              <p className={situation.color}>{situation.message}</p>
            ) : (
              <p>
                Nenhum dado encontrado para {month}/{year}
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
                <p className="font-bold text-xl">
                  {formatCurrency(!hasSummary ? summary.total_income : 0)}
                </p>
              </div>
            </div>

            <div className="w-[1px] dark:bg-white bg-gray-500/30" />

            <div className="flex flex-col md:items-center gap-2 flex-1 justify-center">
              <div>{icons.arrowUp("text-red-600 mx-auto")}</div>
              <div className="text-center text-red-600">
                <p className="text-sm font-medium">Despesa</p>
                <p className="font-bold text-xl">
                  {formatCurrency(!hasSummary ? summary.total_expense : 0)}
                </p>
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
            <Link href="/transactions" hrefComplement>
              {icons.arrowRight("text-white hover:text-white/70")}
            </Link>
          </div>

          <div className="space-y-5 mt-5">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <CardTransaction
                  key={transaction.id}
                  transaction={transaction}
                />
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
