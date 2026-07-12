import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function handleResumeSession(router: AppRouterInstance, sessionId: string | null) {
  if (sessionId) {
    router.push(`/dashboard/focus?session_id=${sessionId}`);
  } else {
    router.push("/dashboard/focus");
  }
}
