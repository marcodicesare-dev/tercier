import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/shadcn-utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-[#504038] bg-[#504038] px-2.5 py-1 text-base text-[#F5EFE6] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#F5EFE6] placeholder:text-[#BEB0A2] focus-visible:border-[#C17F59] focus-visible:ring-3 focus-visible:ring-[#C17F59]/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#504038]/60 disabled:opacity-50 aria-invalid:border-[#DC2626] aria-invalid:ring-3 aria-invalid:ring-[#DC2626]/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
