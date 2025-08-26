import { v4 as uuidv4 } from "uuid";

export function getClientId() {
  try {
    let clientId = localStorage.getItem("clientId");

    if (!clientId) {
      // Use crypto.randomUUID if available, otherwise fallback to uuidv4
      const newId =
        crypto && crypto.randomUUID ? crypto.randomUUID() : uuidv4();

      localStorage.setItem("clientId", newId);
      clientId = newId;
    }

    return clientId;
  } catch (error) {
    console.error("❌ Error getting clientId from localStorage:", error);
    const fallbackId = uuidv4();
    console.warn("🔄 Falling back to new clientId:", fallbackId);
    return fallbackId;
  }
}
