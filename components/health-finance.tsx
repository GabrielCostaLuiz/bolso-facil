import { colors } from "@/constants/colors";
import { cn } from "@/lib/utils";
import type { HealthColor } from "@/types/colors";

export function HealthFinance({
  score,
  health,
}: {
  health?: HealthColor;
  score: number;
}) {
  const status: HealthColor =
    health ?? (score >= 75 ? "green" : score >= 50 ? "yellow" : "red");

  const statusMessage: Record<HealthColor, string> = {
    green: "Excelente",
    yellow: "Atenção",
    red: "Crítico",
  };

  const statusDescription: Record<HealthColor, string> = {
    green: "Sua situação está ótima!",
    yellow: "Alguns pontos precisam de atenção.",
    red: "Sua saúde financeira está em risco!",
  };

  return (
    <div
      className={cn(
        " rounded-2xl p-6 shadow-sm border-1 flex items-center justify-between gap-5 flex-wrap max-md:justify-center max-md:flex-col",
        colors[status].border
      )}
    >
      <div className="max-md:order-2">
      </div>
      <h3 className="text-lg font-semibold  mb-4 max-md:order-1">
        Saúde Financeira
      </h3>

      <div className="">
        <div>
          <p
            className={cn(
              "text-2xl font-bold",
              `text-${colors[status].color_default}`
            )}
          >
            {statusMessage[status]}
          </p>
          <p className="text-sm text-gray-500">{statusDescription[status]}</p>
        </div>
      </div>
    </div>
  );
}
