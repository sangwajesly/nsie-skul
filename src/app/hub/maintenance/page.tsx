import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getHubNodeConfig, HUB_SESSION_COOKIE, verifyHubSessionToken } from "@/lib/hub/hub-node-store";
import { getOrCreateHubKeyPair } from "@/lib/hub/hub-identity";
import { getPendingOutboxBatch } from "@/lib/hub/hub-outbox";
import HubMaintenanceClient from "./HubMaintenanceClient";

export const metadata = {
  title: "School Hub Maintenance Console | Nsei Sukul",
};

export default async function HubMaintenancePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(HUB_SESSION_COOKIE)?.value;

  if (!sessionToken || !verifyHubSessionToken(sessionToken)) {
    redirect("/hub/login");
  }

  const config = getHubNodeConfig();
  const keyPair = getOrCreateHubKeyPair();
  let pendingOutbox: any[] = [];
  try {
    pendingOutbox = await getPendingOutboxBatch(10);
  } catch (e) {
    // If local postgres is not reachable yet
  }

  return (
    <HubMaintenanceClient
      config={config}
      publicKeyPem={keyPair.publicKeyPem}
      pendingCount={pendingOutbox.length}
    />
  );
}
