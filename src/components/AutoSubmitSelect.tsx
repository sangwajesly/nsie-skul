"use client";

/**
 * A <select> that automatically submits its enclosing <form> when the user
 * picks a new value. Use this inside a Server Component wherever you would
 * normally write onChange={(e) => e.target.form?.submit()}.
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
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className={className}
      onChange={(e) => e.target.form?.submit()}
    >
      {children}
    </select>
  );
}

/**
 * An <input type="date"> that automatically submits its enclosing <form>
 * when the user picks a new date.
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
  return (
    <input
      type="date"
      name={name}
      defaultValue={defaultValue}
      className={className}
      onChange={(e) => e.target.form?.submit()}
    />
  );
}
