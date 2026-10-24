import Link from "next/link";

interface AccessDeniedProps {
  message?: string;
}

export default function AccessDenied({
  message = "Your school role does not have access to this area.",
}: AccessDeniedProps) {
  return (
    <section className="mx-auto max-w-3xl border-y border-[#E5E5DF] bg-white px-5 py-8" role="status">
      <h1 className="text-lg font-bold text-[#191919]">Access restricted</h1>
      <p className="mt-1 text-sm text-[#666666]">{message}</p>
      <Link href="/dashboard" className="mt-4 inline-flex text-sm font-semibold text-[#246B2A] hover:underline">
        Return to your dashboard
      </Link>
    </section>
  );
}