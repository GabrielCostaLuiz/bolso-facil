"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { icons } from "@/utils/icons";
import { Button } from "./ui/button";

interface MonthYearSelectorProps {
  className?: string;
}

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function MonthYearSelector({ className }: MonthYearSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const monthParam = searchParams.get("month");
    return monthParam ? parseInt(monthParam) - 1 : currentMonth;
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    const yearParam = searchParams.get("year");
    return yearParam ? parseInt(yearParam) : currentYear;
  });

  const [isOpen, setIsOpen] = useState(false);

  // Gera lista de anos (5 anos atrás até 2 anos na frente)
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 5 + i);

  // Atualiza a URL quando mês ou ano mudarem
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", (selectedMonth + 1).toString());
    params.set("year", selectedYear.toString());

    router.push(`?${params.toString()}`, { scroll: false });
  }, [selectedMonth, selectedYear, router, searchParams]);

  const handleMonthChange = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setIsOpen(false);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Card className="overflow-hidden bg-transparent border-none p-0 ">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Botão Anterior */}
            <Button onClick={goToPreviousMonth} className="p-2 rounded-full">
              {icons.arrowLeft("h-5 w-5 ")}
            </Button>

            {/* Display do Mês/Ano */}
            <Button
              onClick={() => setIsOpen(!isOpen)}
              className="flex flex-col items-center h-full gap-3 px-4 py-2 rounded-lg text-xl font-bold"
            >
              {months[selectedMonth]} / {selectedYear}
            </Button>

            {/* Botão Próximo */}
            <Button onClick={goToNextMonth} className="p-2 rounded-full ">
              {icons.arrowRight("h-5 w-5 ")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dropdown de Seleção */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl">
            <CardContent className="p-4 space-y-4">
              {/* Botão Mês Atual */}
              <Button
                onClick={goToCurrentMonth}
                className="w-full p-2 text-sm rounded-lg font-medium"
              >
                Ir para mês atual
              </Button>

              {/* Seleção de Ano */}
              <div>
                <p className="text-sm font-medium  mb-2">Ano</p>
                <div className="grid grid-cols-4 gap-2">
                  {years.map((year) => (
                    <Button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className={`p-2 text-sm rounded-lg transition-colors ${
                        year === selectedYear ? " " : " bg-gray-500 "
                      }`}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Mês</p>
                <div className="grid grid-cols-3 gap-2">
                  {months.map((month, index) => (
                    <Button
                      key={month}
                      onClick={() => handleMonthChange(index)}
                      className={`p-2 text-sm rounded-lg transition-colors ${
                        index === selectedMonth ? "" : "bg-gray-500"
                      }`}
                    >
                      {month.substring(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
