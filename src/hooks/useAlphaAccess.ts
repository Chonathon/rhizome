import { useCallback, useEffect, useMemo, useState } from "react";
import { validateAlphaPasswordMock } from "@/lib/alpha";
import {validateAccessCode} from "@/apis/usersApi";
import {PHASE_VERSION} from "@/constants";

const LS_KEY = "alpha_access_ok";
const BYPASS = import.meta.env.VITE_ALPHA_BYPASS === "true";

export function useAlphaAccess(userAccess?: string) {
  const [validated, setValidated] = useState<boolean>(() => {
    if (BYPASS || (userAccess && userAccess === PHASE_VERSION)) return true;
    try {
      return localStorage.getItem(LS_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Automatically validates if user has an account with the current version flag
  useEffect(() => {
    if (userAccess && userAccess === PHASE_VERSION) {
      setValidated(true);
    }
  }, [userAccess]);

  useEffect(() => {
    if (BYPASS) return;
    try {
      localStorage.setItem(LS_KEY, validated ? "true" : "false");
    } catch {}
  }, [validated]);

  const validatePassword = useCallback(async (email: string, accessCode: string): Promise<boolean> => {
    const isValid = await validateAccessCode(email, accessCode);
    setValidated(isValid);
    return isValid;
  }, []);

  const setAlphaValidated = useCallback(() => setValidated(true), []);

  return { isAlphaValidated: validated, setAlphaValidated, validatePassword };
}


