export function getGreetingByTime(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "Bom Dia";
  if (hour >= 12 && hour < 18) return "Boa Tarde";
  return "Boa Noite";
}
