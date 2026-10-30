import { createClient } from "@/lib/supabase/server";

export interface SchoolHubNode {
  id: string;
  school_id: string;
  hub_name: string;
  node_key: string;
  hardware_id: string;
  local_ip: string | null;
  port: number;
  status: "active" | "inactive" | "revoked";
  lease_expires_at: string;
  last_heartbeat_at: string;
  last_sync_at: string | null;
  created_at: string;
}

export interface HubSyncLog {
  id: string;
  direction: "push" | "pull" | "bidirectional";
  items_pushed: number;
  items_pulled: number;
  status: "success" | "partial" | "failed";
  error_message: string | null;
  created_at: string;
}

/**
 * Checks whether this Next.js server instance is running as an on-premise School Hub.
 */
export function isSchoolHubInstance(): boolean {
  return (
    process.env.NEXT_PUBLIC_HUB_MODE === "true" ||
    process.env.HUB_MODE === "true" ||
    Boolean(process.env.HUB_NODE_KEY)
  );
}

/**
 * Retrieves the local machine's LAN IP address (e.g. 192.168.1.100)
 * so staff can access the local server on the school Wi-Fi.
 */
export function getLocalServerLanIp(): string {
  try {
    const os = require("os");
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === "IPv4" && !alias.internal && alias.address.startsWith("192.168.")) {
          return alias.address;
        }
      }
    }
    // Fallback search for any 10.x.x.x or 172.x.x.x LAN
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === "IPv4" && !alias.internal) {
          return alias.address;
        }
      }
    }
  } catch {
    // Ignore in edge/browser runtimes
  }
  return "127.0.0.1";
}

/**
 * Lists all registered Hub server nodes for the current school.
 */
export async function getSchoolHubs(schoolId: string): Promise<SchoolHubNode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("school_hubs")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[HubService] Error fetching school hubs:", error.message);
    return [];
  }
  return (data as SchoolHubNode[]) || [];
}
