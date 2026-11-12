import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getHubNodeConfig, verifyHubSessionToken, HUB_SESSION_COOKIE } from "@/lib/hub/hub-node-store";
import { HubLoginClient } from "./HubLoginClient";

export const metadata = {
  title: "School Hub Station Login - Nsei Sukul",
  description: "On-Premise School Hub Master Station PIN Unlock",
};

export default async function HubLoginPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(HUB_SESSION_COOKIE)?.value;

  // If already authenticated with valid session, navigate straight to dashboard
  if (sessionToken) {
    const verified = verifyHubSessionToken(sessionToken);
    if (verified) {
      redirect("/dashboard");
    }
  }

  const config = getHubNodeConfig();
  const isConfigured = Boolean(config && config.nodeKey);

  return (
    <HubLoginClient
      isConfigured={isConfigured}
      schoolName={config?.schoolName || "Nsei Sukul School Hub"}
      schoolCode={config?.schoolCode || "CAMPUS"}
      hasPin={Boolean(config?.pinHash)}
    />
  );
}
