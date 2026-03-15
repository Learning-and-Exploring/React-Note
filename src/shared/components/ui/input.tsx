import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-2xl bg-white/85 px-4 py-2 text-base shadow-sm ring-1 ring-border/40 transition-all outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-50 md:text-sm dark:bg-white/10",
        className
      )}
      {...props}
    />
  )
}

export { Input }
