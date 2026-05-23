/**
 * API Configuration
 * Dynamically switches between local and production URLs based on environment
 */

export const getApiUrl = () => {
  // Use environment variable if available (Vercel, etc.)
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Fallback to localhost for development
  return "http://localhost:4000";
};

export const getWsUrl = () => {
  // Use environment variable if available
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  // Fallback to localhost for development
  return "ws://localhost:4000";
};

export const API_URL = getApiUrl();
export const WS_URL = getWsUrl();
