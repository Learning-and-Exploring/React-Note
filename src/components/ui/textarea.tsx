import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-2xl bg-white/85 px-4 py-3 text-base shadow-sm ring-1 ring-border/40 transition-all outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-50 md:text-sm dark:bg-white/10",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
