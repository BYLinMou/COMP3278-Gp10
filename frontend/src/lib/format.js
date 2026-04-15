export function formatDate(value) {
  return new Intl.DateTimeFormat("en-HK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatCompactDate(value) {
  return new Intl.DateTimeFormat("en-HK", { month: "short", day: "numeric" }).format(new Date(value));
}

export function demoPassword(username) {
  return username === "sam" ? "sam123456" : `${username}123`;
}

