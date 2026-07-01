import { useEffect, useRef } from "react";
import { pollAPI } from "../services/api";

/**
 * Custom hook to subscribe to live updates from the backend using long polling.
 * @param onDataChanged Callback function to trigger data refresh.
 * @param enabled Whether long polling is active (e.g. only when authenticated).
 */
export function useLongPoll(onDataChanged: () => void, enabled = true) {
  const onDataChangedRef = useRef(onDataChanged);
  onDataChangedRef.current = onDataChanged;

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    let lastVersion = 0;
    let abortController: AbortController | null = null;
    let timeoutId: number | null = null;

    const poll = async () => {
      if (!isMounted) return;

      try {
        // If we don't have a token, don't poll (wait and retry later)
        const token = localStorage.getItem("token");
        if (!token) {
          timeoutId = window.setTimeout(poll, 5000);
          return;
        }

        // Initialize version if it's 0
        if (lastVersion === 0) {
          const versionRes = await pollAPI.getVersion();
          lastVersion = versionRes.version;
        }

        abortController = new AbortController();

        const result = await pollAPI.getChanges(
          lastVersion,
          abortController.signal,
        );

        if (!isMounted) return;

        lastVersion = result.version;

        if (result.changed) {
          onDataChangedRef.current();
        }

        // Poll again immediately
        poll();
      } catch (err: any) {
        if (!isMounted) return;

        // If it was aborted, don't retry immediately as it means we are unmounting or re-entering
        if (
          err.name === "CanceledError" ||
          err.name === "AbortError" ||
          axiosIsCancel(err)
        ) {
          return;
        }

        console.warn(
          "Long poll connection failed, retrying in 3 seconds...",
          err,
        );
        // Wait 3 seconds before retrying to prevent rapid loop on server/network errors
        timeoutId = window.setTimeout(poll, 3000);
      }
    };

    poll();

    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [enabled]);
}

// Helper to check if it's an axios cancellation
function axiosIsCancel(value: any): boolean {
  return !!(value && value.__CANCEL__);
}
