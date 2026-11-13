/**
 * Resilient fetch wrapper for Supabase clients.
 * 
 * 1. Enforces cache: "no-store" so Next.js never attempts to write Supabase REST
 *    queries into the Next.js Data Cache (which causes "Failed to set fetch cache... TypeError: terminated").
 * 2. Enforces a 2500ms safety timeout on School Hub to prevent offline page renders from hanging.
 * 3. Provides automatic single retry on transient socket drops only when online.
 */
export async function resilientSupabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const isHub =
    process.env.HUB_MODE === "true" ||
    process.env.NEXT_PUBLIC_HUB_MODE === "true";

  // When in Hub mode, cap cloud fetch attempts to 2.5s so offline renders fail fast to local DB
  const timeoutMs = isHub ? 2500 : 12000;
  let signal = init?.signal;
  let timer: NodeJS.Timeout | null = null;

  if (!signal && typeof AbortController !== "undefined") {
    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(new Error("Supabase cloud fetch timed out")), timeoutMs);
    signal = controller.signal;
  }

  const options: RequestInit = {
    ...init,
    signal,
    cache: "no-store",
  };

  try {
    const res = await fetch(input, options);
    if (timer) clearTimeout(timer);
    return res;
  } catch (err: unknown) {
    if (timer) clearTimeout(timer);

    const errorObj = err as {
      code?: string;
      message?: string;
      name?: string;
      cause?: { code?: string; message?: string };
    };

    // If aborted due to timeout or network unreachable in hub mode, fail immediately to local DB
    if (
      isHub &&
      (errorObj?.name === "AbortError" ||
        errorObj?.message?.includes("timed out") ||
        errorObj?.code === "ENOTFOUND" ||
        errorObj?.code === "ECONNREFUSED" ||
        errorObj?.code === "ETIMEDOUT")
    ) {
      throw err;
    }

    const isTransient =
      errorObj?.code === "ECONNRESET" ||
      errorObj?.cause?.code === "ECONNRESET" ||
      errorObj?.code === "ETIMEDOUT" ||
      errorObj?.cause?.code === "ETIMEDOUT" ||
      errorObj?.message?.includes("terminated") ||
      errorObj?.message?.includes("socket hang up") ||
      errorObj?.cause?.message?.includes("ECONNRESET");

    if (isTransient && !isHub) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return await fetch(input, { ...options, signal: undefined });
    }

    throw err;
  }
}

