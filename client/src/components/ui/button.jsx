import { cn } from "../../lib/utils";
export function Button({ className, variant = "default", ...props }) {
  return <button className={cn("inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-moss/40 disabled:cursor-not-allowed disabled:opacity-50", variant === "default" && "bg-ink text-white hover:bg-moss", variant === "outline" && "border border-ink/15 bg-white hover:bg-paper", variant === "ghost" && "hover:bg-ink/5", variant === "danger" && "text-red-600 hover:bg-red-50", className)} {...props} />;
}
