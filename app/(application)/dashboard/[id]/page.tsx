export const revalidate = 86400;

import Image from "next/image";
import { use } from "react";
import { getSummary } from "@/app/actions/summary";
import { getTransactions } from "@/app/actions/transactions";
import { CardTransaction } from "@/components/card-transaction";
import { Link } from "@/components/common/link";
import { SectionTemplate } from "@/components/template/section-template";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { categoriesDefaults } from "@/constants/categories-defaults";
import { cn } from "@/lib/utils";
import groupElements from "@/public/groupElements.png";
import { formatCurrency } from "@/utils/formatCurrency";
import { icons } from "@/utils/icons";

export default async function BolsoFacilDashboard() {
  // const user2 = await stackServerApp.getUser();
  // const app = stackServerApp.urls;
  // const userProfile = await getUserDetails(user2?.id);
  // const transactions = use(
  //   getTransactions({
  //     limit: 5,
  //   })
  // );
  // const summary = use(getSummary());
  const transactions = await getTransactions({
    limit: 5,
  });
  const summary = await getSummary();
  console.log("oi");
  console.log(summary, "summary dash");

  return (
    <div className="space-y-5  pb-20 ">
      <SectionTemplate className="space-y-5 mt-2 ">
        <Card className=" relative overflow-hidden cardResume gap-0">
          <CardContent className="space-y-3 relative z-10 pb-5">
            <div>
              <p className="text-sm ">Total Balance</p>
              <p className="text-3xl font-bold max-w-11/12 break-words">
                {formatCurrency(summary ? summary.total_balance : 0)}
              </p>
            </div>

            <p>Parabens, seu saldo está otimo meu amigo, continue assim</p>
          </CardContent>
          <Image
            src={groupElements}
            alt="Elementos do card"
            className="absolute inset-0 object-fill w-full  h-full"
          />
        </Card>

        <Card className=" relative overflow-hidden ">
          <CardContent className="flex justify-between ">
            <div className="flex flex-col md:items-center   gap-2 flex-1 justify-center ">
              <div className=" text-center">
                {icons.arrowDown("text-green-600 mx-auto")}
              </div>
              <div className="text-center text-green-600">
                <p className="text-sm font-medium">Receita</p>
                <p className="font-bold text-xl ">
                  {formatCurrency(summary ? summary.total_income : 0)}
                </p>
              </div>
            </div>

            <div className="w-[1px] dark:bg-white bg-gray-500/30" />

            <div className="flex flex-col md:items-center   gap-2 flex-1 justify-center ">
              <div>{icons.arrowUp("text-red-600 mx-auto")}</div>
              <div className="text-center text-red-600">
                <p className="text-sm font-medium">Despesa</p>
                <p className="font-bold text-xl ">
                  {formatCurrency(summary ? summary.total_expense : 0)}
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
          <div className="flex items-center justify-between ">
            <h2 className="text-xl font-bold">Recente Transação</h2>
            <Link href="/transactions" hrefComplement>
              {icons.arrowRight("text-white hover:text-white/70")}
            </Link>
            {/* <p className="flex items-center gap-2 group "></p> */}
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
                  Nenhuma transação encontrada
                </h3>
              </div>
            )}
          </div>
        </div>
      </SectionTemplate>
    </div>
  );
}
