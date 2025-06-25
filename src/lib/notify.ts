import { toast } from "@/components/ui/sonner"

/**
 * Trigger a browser notification, optional vibration, and toast.
 * Call this when a timer segment ends.
 */
export async function notify(message: string) {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission()
      } catch {
        /* ignore */
      }
    }
    if (Notification.permission === "granted") {
      try {
        new Notification(message)
      } catch {
        /* ignore */
      }
    }
  }

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([200])
  }

  toast(message)
}
