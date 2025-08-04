// export const revalidate = 300;

import { ArrowDown, ArrowRight, ArrowUp, Box } from "lucide-react";
import Image from "next/image";
import { userAgent } from "next/server";
import { use } from "react";
import { BottomNavigation } from "@/components/bottom-navigate";
import { SectionTemplate } from "@/components/template/sectionTemplate";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import groupElements from "@/public/groupElements.png";
import { createSummary, getSummary } from "../actions/summary";
import { getTransactions } from "../actions/transactions";

// export const revalidate = 1;

const BolsoFacilDashboard = () => {
  // const user2 = await stackServerApp.getUser();
  // const app = stackServerApp.urls;
  // const userProfile = await getUserDetails(user2?.id);
  const transactions = use(
    getTransactions({
      limit: 10,
    })
  );

  // use(createSummary());
  const summary = use(getSummary());

  // console.log(transactions);
  return (
    <div className="space-y-5  pb-20 ">
      <SectionTemplate className="space-y-5 mt-2 ">
        <Card className=" relative overflow-hidden cardResume gap-0">
          <CardContent className="space-y-3 relative z-10 pb-5">
            <div>
              <p className="text-sm ">Total Balance</p>
              <p className="text-3xl font-bold max-w-11/12 break-words">
                R$ {summary.total_balance.toFixed(2)}
              </p>
            </div>

            <p>Parabens, seu saldo está otimo meu amigo, continue assi</p>
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
                <ArrowDown className="text-primary mx-auto" />
              </div>
              <div className="text-center">
                <p>Income</p>
                <p className="font-bold text-xl text-primary">
                  R$ {summary.total_income.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="w-[1px] dark:bg-white bg-gray-500/30" />

            <div className="flex flex-col md:items-center   gap-2 flex-1 justify-center ">
              <div>
                <ArrowUp className="text-red-500 mx-auto" />
              </div>
              <div className="text-center">
                <p>Outcome</p>
                <p className="font-bold text-xl text-red-500">
                  R$ {summary.total_expense.toFixed(2)}
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
            <p className="flex items-center gap-2 group ">
              <ArrowRight />
            </p>
          </div>

          <div className="space-y-5 mt-5">
            {transactions.length > 0 ? (
              transactions.map((transaction, i: number) => (
                <Card key={i} className="!flex !flex-row gap-2">
                  <CardContent className=" flex-1  !pr-0">
                    <div className="flex  gap-2  h-full">
                      <div className="bg-cyan-200 rounded-lg w-fit h-full px-4 flex items-center">
                        <Box size={30} />
                      </div>
                      <div className="">
                        <p className="text-lg font-semibold capitalize">
                          {transaction.category}
                        </p>
                        <p className="text-xs">
                          {transaction.description.length > 1
                            ? transaction.description
                            : "Nenhuma Descrição"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-center justify-center ">
                    <p className="text-primary text-lg font-semibold">
                      R${transaction.amount}
                    </p>
                    <p className="text-orange-300">
                      {transaction.date.toString().slice(0, 10)}
                    </p>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <p>Nenhuma transação encontrada</p>
            )}
          </div>
        </div>
      </SectionTemplate>

      <BottomNavigation />
    </div>
  );
};

export default BolsoFacilDashboard;
