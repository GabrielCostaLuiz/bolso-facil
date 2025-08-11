import { parseISO, format } from "date-fns";

export const formatDate = (dateString: string) => {
 const date = parseISO(dateString);
  return format(date, "dd/MM/yyyy");
};
