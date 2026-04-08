import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/shadcn-utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-[var(--terracotta)] focus-visible:ring-[3px] focus-visible:ring-[var(--terracotta)]/20 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-red-600 aria-invalid:ring-red-600/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[var(--terracotta)] text-white [a]:hover:bg-[var(--deep-terracotta)]",
        secondary:
          "bg-[var(--sidebar-accent)] text-[var(--deep-terracotta)] [a]:hover:bg-stone-200",
        destructive:
          "border-red-600 bg-red-600/10 text-red-700 focus-visible:ring-red-600/20 [a]:hover:bg-red-600/20",
        outline:
          "border-[var(--border)] text-[var(--lumina-ink)] [a]:hover:bg-stone-50 [a]:hover:text-[var(--lumina-ink)]",
        ghost:
          "hover:bg-stone-100 hover:text-[var(--lumina-ink)]",
        link: "text-[var(--terracotta)] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
