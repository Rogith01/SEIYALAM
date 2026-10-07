export const formatDateTime = (
  date,
  timezone = "Asia/Kolkata"
) => {
  if (!date) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  } catch (error) {
    console.error("Invalid timezone:", timezone);
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }
};

export const formatDate = (
  date,
  timezone = "Asia/Kolkata"
) => {
  if (!date) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      dateStyle: "medium",
    }).format(new Date(date));
  } catch (error) {
    console.error("Invalid timezone:", timezone);
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(date));
  }
};

export const formatTime = (
  date,
  timezone = "Asia/Kolkata"
) => {
  if (!date) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      timeStyle: "short",
    }).format(new Date(date));
  } catch (error) {
    console.error("Invalid timezone:", timezone);
    return new Intl.DateTimeFormat("en-IN", {
      timeStyle: "short",
    }).format(new Date(date));
  }
};