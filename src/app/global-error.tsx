"use client";

// global-error.tsx catches errors thrown inside the Root Layout (layout.tsx) itself.
// It must include its own <html> and <body> tags since the layout is unavailable.

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Nsei Sukul] Global Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#FFFDF5", fontFamily: "sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              width: "100%",
              background: "#fff",
              border: "1px solid #E8DFC9",
              borderRadius: "10px",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "3rem",
                height: "3rem",
                borderRadius: "50%",
                background: "#FEF2F2",
                marginBottom: "1rem",
              }}
            >
              <AlertCircle style={{ width: "1.5rem", height: "1.5rem", color: "#DC2626" }} />
            </div>

            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#142010", marginBottom: "0.5rem" }}>
              Application Error
            </h1>
            <p style={{ fontSize: "0.75rem", color: "#666666", marginBottom: "1rem" }}>
              A critical error occurred. Please try again or return to the sign-in page.
            </p>

            {error.digest && (
              <div
                style={{
                  padding: "0.5rem",
                  background: "#F9F9F6",
                  border: "1px solid #E8DFC9",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "#888888",
                  marginBottom: "1rem",
                }}
              >
                Ref: {error.digest}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              <button
                onClick={() => reset()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  background: "#2A7C13",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RotateCcw style={{ width: "0.875rem", height: "0.875rem" }} />
                Try Again
              </button>
              <a
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.5rem 1rem",
                  background: "#fff",
                  color: "#142010",
                  border: "1px solid #D5CBB2",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Back to Sign In
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
