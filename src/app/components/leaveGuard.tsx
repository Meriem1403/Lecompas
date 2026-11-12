import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

type LeaveAction = () => void;

type LeaveGuardContextValue = {
  arm: () => void;
  disarm: () => void;
  requestLeave: (action: LeaveAction) => void;
};

const LeaveGuardContext = React.createContext<LeaveGuardContextValue | null>(null);

export function LeaveGuardProvider({ children }: { children: React.ReactNode }) {
  const countRef = useRef(0);
  const bypassRef = useRef(false);
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState<LeaveAction | null>(null);

  const arm = useCallback(() => {
    countRef.current += 1;
    setArmed(true);
  }, []);

  const disarm = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    setArmed(countRef.current > 0);
  }, []);

  const requestLeave = useCallback((action: LeaveAction) => {
    if (bypassRef.current || countRef.current === 0) {
      action();
      return;
    }
    setPending(() => () => {
      bypassRef.current = true;
      try {
        action();
      } finally {
        bypassRef.current = false;
      }
    });
  }, []);

  useEffect(() => {
    if (!armed) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [armed]);

  const value = useMemo(
    () => ({ arm, disarm, requestLeave }),
    [arm, disarm, requestLeave],
  );

  return (
    <LeaveGuardContext.Provider value={value}>
      {children}
      <AlertDialog open={pending !== null} onOpenChange={(open) => { if (!open) setPending(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter sans enregistrer ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les informations saisies sur cette page seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Rester sur la page</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                const run = pending;
                setPending(null);
                run?.();
              }}
            >
              Quitter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LeaveGuardContext.Provider>
  );
}

export function useRequestLeave() {
  const context = useContext(LeaveGuardContext);
  return context?.requestLeave ?? ((action: LeaveAction) => action());
}

export function useLeaveGuard(active = true) {
  const context = useContext(LeaveGuardContext);
  const arm = context?.arm;
  const disarm = context?.disarm;
  useEffect(() => {
    if (!active || !arm || !disarm) return;
    arm();
    return () => disarm();
  }, [active, arm, disarm]);
  return context?.requestLeave ?? ((action: LeaveAction) => action());
}
