import { toast } from "@/components/ui/sonner"

/**
 * Show a browser notification and toast.
 *
 * Should be called whenever a timer segment ends.
 */
export async function notify(title: string, body: string) {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission()
      } catch {
        /* ignore */
      }
    }
    if (Notification.permission === "granted") {
      new Notification(title, { body })
    }
  }
  toast(body)
}
