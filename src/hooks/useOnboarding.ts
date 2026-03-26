import { useCallback, useEffect, useState } from "react";

const LS_KEY = "onboarding_completed";

export function useOnboarding() {
  const [completed, setCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, completed ? "true" : "false");
    } catch {}
  }, [completed]);

  const setOnboardingCompleted = useCallback(() => setCompleted(true), []);

  return { hasCompletedOnboarding: completed, setOnboardingCompleted };
}
