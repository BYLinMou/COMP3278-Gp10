import { request, requestWithoutJson } from "./client";

export function loginUser(username, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getCurrentSession() {
  return request("/auth/session");
}

export async function logoutUser() {
  await requestWithoutJson("/auth/logout", { method: "POST" }, "Logout failed");
}

