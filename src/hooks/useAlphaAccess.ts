import { useCallback, useEffect, useMemo, useState } from "react";
import { validateAlphaPasswordMock } from "@/lib/alpha";

const LS_KEY = "alpha_access_ok";
const BYPASS = import.meta.env.VITE_ALPHA_BYPASS === "true";

export function useAlphaAccess() {
  const [validated, setValidated] = useState<boolean>(() => {
    if (BYPASS) return true;
    try {
      return localStorage.getItem(LS_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (BYPASS) return;
    try {
      localStorage.setItem(LS_KEY, validated ? "true" : "false");
    } catch {}
  }, [validated]);

  const validatePassword = useCallback(async (password: string): Promise<boolean> => {
    const ok = validateAlphaPasswordMock(password);
    if (ok) setValidated(true);
    return ok;
  }, []);

  const setAlphaValidated = useCallback(() => setValidated(true), []);

  return useMemo(
    () => ({ isAlphaValidated: validated, setAlphaValidated, validatePassword }),
    [validated, setAlphaValidated, validatePassword]
  );
}


