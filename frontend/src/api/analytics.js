import { request } from "./client";

export function getAnalyticsOverview() {
  return request("/analytics/overview");
}

