import { Platform } from "react-native";

// Local development IP address for local network & emulators
const HOST_IP = "192.168.1.8"; // Update this to your computer's local IP address
export const API_BASE_URL = `http://${HOST_IP}:8080`;

export async function fetchFromAPI(endpoint: string) {
  const tryUrls = [
    `${API_BASE_URL}${endpoint}`,
    `http://10.0.2.2:8080${endpoint}`, // Android Emulator
    `http://localhost:8080${endpoint}`, // iOS Simulator / Local
  ];

  // If you have a production URL, add it here:
  // tryUrls.unshift(`https://your-production-api.com${endpoint}`);

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {
      // Continue to next URL
    }
  }
  return null;
}
