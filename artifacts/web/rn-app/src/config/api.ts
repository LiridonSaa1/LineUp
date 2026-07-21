import { Platform } from "react-native";

// Local development IP address for local network & emulators
const HOST_IP = "192.168.1.9";
export const API_BASE_URL = `http://${HOST_IP}:8080`;

export async function fetchFromAPI(endpoint: string) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`API fetch error for ${endpoint}:`, error);
    // Fallback to localhost if network IP fails
    try {
      const fallbackRes = await fetch(`http://localhost:8080${endpoint}`);
      if (fallbackRes.ok) return await fallbackRes.json();
    } catch (_) {}
    return null;
  }
}
