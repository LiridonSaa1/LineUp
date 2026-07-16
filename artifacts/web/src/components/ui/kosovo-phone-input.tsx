import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Kosovo phone input – light UI variant.
 * Locked "+383" prefix, digits-only editable part, auto-formats as:
 *   +383 44 123 456
 * The stored value (passed via `value`/`onChange`) is always the full
 * string e.g. "+383 44 123 456".
 */
export function KosovoPhoneInput({
  value,
  onChange,
  id,
  className,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  className?: string;
  hasError?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  /** Strip prefix and non-digits, keep max 8 digits, then reformat. */
  function toLocal(full: string): string {
    const digits = full.replace(/^\+383\s*/, "").replace(/\D/g, "").slice(0, 8);
    let out = "";
    if (digits.length > 0) out += digits.slice(0, 2);
    if (digits.length > 2) out += " " + digits.slice(2, 5);
    if (digits.length > 5) out += " " + digits.slice(5, 8);
    return out;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    if (raw.length > 0) formatted += raw.slice(0, 2);
    if (raw.length > 2) formatted += " " + raw.slice(2, 5);
    if (raw.length > 5) formatted += " " + raw.slice(5, 8);
    onChange(formatted.length > 0 ? "+383 " + formatted : "+383 ");
  }

  const localVal = toLocal(value);

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center rounded-md border bg-background px-3 py-2 text-sm ring-offset-background",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        hasError ? "border-destructive" : "border-input",
        className,
      )}
    >
      {/* Locked prefix */}
      <span className="shrink-0 select-none font-medium text-muted-foreground mr-1">
        +383
      </span>
      {/* Separator */}
      <span className="shrink-0 text-muted-foreground/40 mr-1">|</span>
      {/* Editable local digits */}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="44 123 456"
        value={localVal}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          // Block any non-digit, non-control key
          if (e.key.length === 1 && !/\d/.test(e.key)) e.preventDefault();
        }}
        autoComplete="tel-national"
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50 min-w-0"
      />
    </div>
  );
}
