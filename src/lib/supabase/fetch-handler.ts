/**
 * Resilient fetch wrapper for Supabase clients.
 * 
 * 1. Enforces cache: "no-store" so Next.js never attempts to write Supabase REST
 *    queries into the Next.js Data Cache (which causes "Failed to set fetch cache... TypeError: terminated").
 * 2. Provides automatic single retry on transient socket drops (ECONNRESET, ETIMEDOUT, socket hang up).
 */
export async function resilientSupabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const options: RequestInit = {
    ...init,
    cache: "no-store",
  };

  try {
    return await fetch(input, options);
  } catch (err: unknown) {
    const errorObj = err as {
      code?: string;
      message?: string;
      cause?: { code?: string; message?: string };
    };

    const isTransient =
      errorObj?.code === "ECONNRESET" ||
      errorObj?.cause?.code === "ECONNRESET" ||
      errorObj?.code === "ETIMEDOUT" ||
      errorObj?.cause?.code === "ETIMEDOUT" ||
      errorObj?.message?.includes("terminated") ||
      errorObj?.message?.includes("socket hang up") ||
      errorObj?.cause?.message?.includes("ECONNRESET");

    if (isTransient) {
      // Jittered backoff before single retry
      await new Promise((resolve) => setTimeout(resolve, 200));
      return await fetch(input, options);
    }

    throw err;
  }
}
