// Only for 1d, 10d, 30d type of strings
export function strToDate(value: string, fromDate: Date = new Date()): Date {
  if (value.includes("m")) {
    const minutes = Number(value.replace("m", ""));
    const result = new Date(fromDate);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }
  if (value.includes("h")) {
    const hours = Number(value.replace("h", ""));
    const result = new Date(fromDate);
    result.setHours(result.getHours() + hours);
    return result;
  }
  const days = Number(value.replace("d", ""));
  if (Number.isNaN(days)) {
    throw new Error(`Invalid day format: ${value}`);
  }
  const result = new Date(fromDate);
  result.setDate(result.getDate() + days);

  return result;
}
