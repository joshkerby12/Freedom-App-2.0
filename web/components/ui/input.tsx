import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  errorText?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, errorText, id, required, ...props }, ref) => {
    const resolvedId = id ?? props.name;
    const hasError = Boolean(errorText);

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={resolvedId}
            className="mb-2 block text-xs font-medium text-[var(--text-secondary)]"
          >
            {label}
            {required ? <span className="ml-1 text-[var(--error)]">*</span> : null}
          </label>
        ) : null}
        <input
          id={resolvedId}
          ref={ref}
          className={cn(
            "h-11 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm text-[var(--text-body)] outline-none transition-colors placeholder:text-[var(--text-secondary)] focus:ring-2",
            hasError
              ? "border-[var(--error)] focus:ring-[rgba(211,47,47,0.2)]"
              : "border-[var(--divider)] focus:border-[var(--brand-primary)] focus:ring-[rgba(66,170,226,0.2)]",
            className,
          )}
          required={required}
          {...props}
        />
        {errorText ? (
          <p className="mt-2 text-xs text-[var(--error)]">{errorText}</p>
        ) : null}
        {!errorText && helperText ? (
          <p className="mt-2 text-xs text-[var(--text-secondary)]">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

