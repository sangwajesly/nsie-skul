"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

/**
 * An enhanced <select> that updates query parameters via Next.js client-side
 * navigation (startTransition + router.replace) instead of full-page browser reloads.
 * This makes switching classes, sequences, or terms instant and seamless without
 * DOM teardown or white flashes.
 */
export function AutoSubmitSelect({
  name,
  defaultValue,
  className,
  children,
}: {
  name: string;
  defaultValue?: string | number;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const form = e.target.form;
    const method = (form?.getAttribute("method") || "get").toLowerCase();

    // If it's a POST form, let native form submission handle it
    if (form && method === "post") {
      form.requestSubmit ? form.requestSubmit() : form.submit();
      return;
    }

    // For GET filters (classes, terms, sequences), navigate via Next.js router
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");

    // If enclosed in a form, capture hidden sibling inputs as well
    if (form) {
      const formData = new FormData(form);
      formData.forEach((value, key) => {
        if (typeof value === "string" && value.trim()) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
    }

    // Set the selected value
    if (e.target.value) {
      params.set(name, e.target.value);
    } else {
      params.delete(name);
    }

    startTransition(() => {
      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    });
  };

  return (
    <div className="relative inline-flex items-center w-full">
      <select
        name={name}
        defaultValue={defaultValue}
        className={`${className || ""} ${isPending ? "opacity-60 cursor-wait" : ""}`}
        onChange={handleChange}
      >
        {children}
      </select>
      {isPending && (
        <span className="absolute right-2.5 pointer-events-none text-[#2A7C13] flex items-center">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        </span>
      )}
    </div>
  );
}

/**
 * An enhanced <input type="date"> that updates query parameters via Next.js client-side
 * router navigation.
 */
export function AutoSubmitDateInput({
  name,
  defaultValue,
  className,
}: {
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = e.target.form;
    const method = (form?.getAttribute("method") || "get").toLowerCase();

    if (form && method === "post") {
      form.requestSubmit ? form.requestSubmit() : form.submit();
      return;
    }

    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (form) {
      const formData = new FormData(form);
      formData.forEach((value, key) => {
        if (typeof value === "string" && value.trim()) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
    }

    if (e.target.value) {
      params.set(name, e.target.value);
    } else {
      params.delete(name);
    }

    startTransition(() => {
      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    });
  };

  return (
    <div className="relative inline-flex items-center w-full">
      <input
        type="date"
        name={name}
        defaultValue={defaultValue}
        className={`${className || ""} ${isPending ? "opacity-60 cursor-wait" : ""}`}
        onChange={handleChange}
      />
      {isPending && (
        <span className="absolute right-2.5 pointer-events-none text-[#2A7C13] flex items-center">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        </span>
      )}
    </div>
  );
}
