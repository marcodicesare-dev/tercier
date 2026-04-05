import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/shadcn-utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-[#C17F59] focus-visible:ring-[3px] focus-visible:ring-[#C17F59]/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-[#DC2626] aria-invalid:ring-[#DC2626]/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[#C17F59] text-[#1A120B] [a]:hover:bg-[#C17F59]/80",
        secondary:
          "bg-[#8B4A2B] text-[#F5EFE6] [a]:hover:bg-[#8B4A2B]/80",
        destructive:
          "border-[#DC2626] bg-[#DC2626]/15 text-[#F5EFE6] focus-visible:ring-[#DC2626]/20 [a]:hover:bg-[#DC2626]/20",
        outline:
          "border-[#5A4A40] text-[#F5EFE6] [a]:hover:bg-[#504038] [a]:hover:text-[#BEB0A2]",
        ghost:
          "hover:bg-[#504038] hover:text-[#BEB0A2]",
        link: "text-[#C17F59] underline-offset-4 hover:underline",
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
