"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import RunPage from "@/src/components/RunPage";

type PushTarget = string | { pathname?: string; search?: string };

const RunPageAny: any = RunPage;

const RunPageNext = ({ slug }: { slug?: string }) => {
  const router = useRouter();
  const pathname = usePathname();

  const push = useCallback(
    (to: PushTarget) => {
      if (typeof to === "string") {
        if (
          typeof window !== "undefined" &&
          to === `${window.location.pathname}${window.location.search}`
        ) {
          return;
        }
        router.push(to);
        return;
      }

      const nextPath = to?.pathname || pathname || "/";
      const search = to?.search || "";
      const nextUrl = `${nextPath}${search}`;

      if (
        typeof window !== "undefined" &&
        nextUrl === `${window.location.pathname}${window.location.search}`
      ) {
        return;
      }

      router.push(nextUrl);
    },
    [pathname, router],
  );

  const history = useMemo(() => ({ push }), [push]);

  const match = {
    params: {
      slug,
    },
  };

  return <RunPageAny history={history} location={{ pathname }} match={match} />;
};

export default RunPageNext;
