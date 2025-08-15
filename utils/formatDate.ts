import { format, isValid, lastDayOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatDate = (dateString: string) => {
  let date: string | Date = "";

  if (dateString.includes("/")) {
    const [day, month, year] = dateString.split("/").map(String);
    date = parseISO(`${year}-${month}-${day}`);
  } else {
    date = parseISO(dateString);
  }

  // Se a data não for válida
  if (!isValid(date)) {
    // Quebrar a string em ano, mês e dia
    const [year, month] = dateString.split("T")[0].split("-").map(Number);

    // Pegar o último dia do mês
    date = lastDayOfMonth(new Date(year, month - 1, 1));
  }

  return format(date, "dd/MM/yyyy");
};

export const getMonth = ({
  dateString,
  type = "number",
}: {
  dateString: string | Date;
  type?: "short" | "long" | "number";
}): string => {
  const date =
    typeof dateString === "string" ? parseISO(dateString) : dateString;
  let dateFormat: string;

  switch (type) {
    case "short":
      dateFormat = "MMM";
      break;
    case "long":
      dateFormat = "MMMM";
      break;
    case "number":
      dateFormat = "MM";
      break;
    default:
      dateFormat = "MM";
  }

  return format(date, dateFormat, { locale: ptBR });
};

export const getDay = ({
  dateString,
  type = "number",
}: {
  dateString: string | Date;
  type?: "short" | "long" | "number";
}): string => {
  const date =
    typeof dateString === "string" ? parseISO(dateString) : dateString;
  let dateFormat: string;

  switch (type) {
    case "short":
      dateFormat = "DDD";
      break;
    case "long":
      dateFormat = "DDDD";
      break;
    case "number":
      dateFormat = "DD";
      break;
    default:
      dateFormat = "DD";
  }

  return format(date, dateFormat, { locale: ptBR });
};

export const getYear = ({
  dateString,
  type = "long",
}: {
  dateString: string | Date;
  type?: "short" | "long";
}): string => {
  const date =
    typeof dateString === "string" ? parseISO(dateString) : dateString;
  let dateFormat: string;

  switch (type) {
    case "short":
      dateFormat = "yy";
      break;
    case "long":
      dateFormat = "yyyy";
      break;
    default:
      dateFormat = "yyyy";
  }

  return format(date, dateFormat, { locale: ptBR });
};
