export function formatTimeLabel(time: string | null | undefined): string {
  if (!time) {
    return "No time set";
  }

  const [rawHours, rawMinutes] = time.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeDoseLabel(date: Date, now = new Date()): string {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const compare = new Date(date);
  compare.setSeconds(0, 0);

  if (compare >= today && compare < tomorrow) {
    return `Today at ${formatDateTime(date).split(", ")[1]}`;
  }

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  if (compare >= tomorrow && compare < dayAfterTomorrow) {
    return `Tomorrow at ${formatDateTime(date).split(", ")[1]}`;
  }

  return formatDateTime(date);
}

export function formatMinutesFromNow(minutesFromNow: number): string {
  if (minutesFromNow <= 0) {
    return "Now";
  }

  const hours = Math.floor(minutesFromNow / 60);
  const minutes = minutesFromNow % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}
