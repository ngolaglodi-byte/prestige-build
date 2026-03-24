/**
 * Environment detection utilities for client-side code
 */

/**
 * Check if the code is running in a production environment
 * Uses NODE_ENV for reliable detection
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if the code is running in a development environment
 */
export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if the code is running in a browser environment
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== "undefined";
}

/**
 * Check if SharedArrayBuffer is available (required for WebContainer)
 */
export function isSharedArrayBufferAvailable(): boolean {
  return isBrowserEnvironment() && typeof SharedArrayBuffer !== "undefined";
}

/**
 * Check if EventSource is available
 */
export function isEventSourceAvailable(): boolean {
  return isBrowserEnvironment() && typeof EventSource !== "undefined";
}
