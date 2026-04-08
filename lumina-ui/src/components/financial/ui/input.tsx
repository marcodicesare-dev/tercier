import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/shadcn-utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-xl border border-[var(--border)] bg-white px-2.5 py-1 text-base text-[var(--lumina-ink)] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--lumina-ink)] placeholder:text-[var(--color-muted-foreground)] focus-visible:border-[var(--terracotta)] focus-visible:ring-3 focus-visible:ring-[var(--terracotta)]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-stone-100 disabled:opacity-50 aria-invalid:border-red-600 aria-invalid:ring-3 aria-invalid:ring-red-600/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
