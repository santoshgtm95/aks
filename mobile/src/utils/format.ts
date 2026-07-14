export const formatDateTime = (dateString: string | Date) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");

  return `${d}/${m}/${y} ${h}:${min}`;
};

export const getMyanmarNow = () => {
  // Simple ISO date representation for compatibility across React Native runtimes
  const date = new Date();
  // Adjust for Yangon time zone +6:30 if needed, or simply return YYYY-MM-DD
  const offsetDate = new Date(date.getTime() + (6.5 * 60 * 60 * 1000));
  return offsetDate.toISOString().split("T")[0];
};

export const combineDateWithMyanmarTime = (dateOnly: string) => {
  if (!dateOnly) return getMyanmarNow();
  return dateOnly.split("T")[0];
};
