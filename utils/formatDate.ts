export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    // weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};
