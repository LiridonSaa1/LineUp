import { Platform } from "react-native";

// Local development IP address for local network & emulators
const HOST_IP = "192.168.1.8";
export const API_BASE_URL = `http://${HOST_IP}:8080`;

export async function fetchFromAPI(endpoint: string) {
  const tryUrls = [
    `${API_BASE_URL}${endpoint}`,
    `http://10.0.2.2:8080${endpoint}`,
    `http://localhost:8080${endpoint}`,
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
  }
  return null;
}
