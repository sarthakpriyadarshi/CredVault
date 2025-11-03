import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
    }

    return (
      <div className="flex items-center space-x-2">
        <label htmlFor={props.id} className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            ref={ref}
            className="peer sr-only"
            {...props}
            onChange={handleChange}
          />
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200",
              "border-zinc-700 bg-zinc-800/50",
              "peer-checked:border-primary peer-checked:bg-primary",
              "peer-focus:ring-2 peer-focus:ring-primary/50 peer-focus:ring-offset-2 peer-focus:ring-offset-transparent",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              className
            )}
          >
            <Check
              className={cn(
                "h-3.5 w-3.5 text-primary-foreground opacity-0 transition-opacity duration-200",
                "peer-checked:opacity-100"
              )}
            />
          </div>
        </label>
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm text-zinc-300 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

