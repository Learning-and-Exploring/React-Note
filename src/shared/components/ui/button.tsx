import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-2xl text-sm font-semibold tracking-tight whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(0,0,0,0.14)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.18)] active:translate-y-px",
        outline:
          "bg-white/80 text-foreground ring-1 ring-border/60 shadow-sm hover:bg-white dark:bg-white/10 dark:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "bg-transparent text-foreground hover:bg-muted/70",
        destructive:
          "bg-destructive text-white shadow-[0_8px_20px_rgba(255,59,48,0.25)] hover:shadow-[0_10px_24px_rgba(255,59,48,0.32)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7 gap-1.5 px-2 text-xs",
        sm: "h-9 gap-1.5 px-3 text-[0.85rem]",
        lg: "h-11 gap-2.5 px-6 text-base",
        icon: "size-10 rounded-2xl",
        "icon-xs": "size-7 rounded-xl",
        "icon-sm": "size-9 rounded-2xl",
        "icon-lg": "size-11 rounded-3xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
