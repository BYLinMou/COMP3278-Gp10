import { request } from "./client";

export function getUsers() {
  return request("/users");
}

export function createUser(payload) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getUserProfile(username) {
  return request(`/users/${username}`);
}

export function getUserHistory(username) {
  return request(`/users/${username}/history`);
}

export function updateUser(username, payload) {
  return request(`/users/${username}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

