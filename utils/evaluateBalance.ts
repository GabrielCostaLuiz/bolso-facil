type BalanceFeedback = {
  formattedValue: string;
  message: string;
  status: "error" | "warning" | "success" | "iddle";
  color: string;
  bgColor: string;
};

export function evaluateBalance(
  total_balance: number,
  warningThreshold: number = 500
): BalanceFeedback {
  const formattedValue = total_balance.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  if (total_balance < 0) {
    return {
      formattedValue,
      message: "Você está gastando demais, pare e reveja seus gastos!",
      status: "error",
      color: "text-red-600",
      bgColor: "bg-red-100",
    };
  }

  if (total_balance === 0) {
    return {
      formattedValue,
      message: "Nenhum registro por aqui, bora adicionar algo?",
      status: "iddle",
      color: "",
      bgColor: "",
    };
  }

  if (total_balance <= warningThreshold) {
    return {
      formattedValue,
      message: "Cuidado, seu saldo está próximo do limite.",
      status: "warning",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    };
  }

  return {
    formattedValue,
    message: "Parabéns! Seu saldo está saudável.",
    status: "success",
    color: "text-green-600",
    bgColor: "bg-green-100",
  };
}
