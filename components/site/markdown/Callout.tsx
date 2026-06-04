import type { ReactNode } from "react";
import { AlertTriangle, Info, Lightbulb, ShieldAlert } from "lucide-react";

type CalloutVariant = "note" | "warning" | "tip" | "danger";

type CalloutProps = {
  variant: CalloutVariant;
  children: ReactNode;
};

const variantStyles: Record<CalloutVariant, { border: string; Icon: typeof Info }> = {
  note: { border: "border-[--accent-blue]", Icon: Info },
  warning: { border: "border-[--accent-amber]", Icon: AlertTriangle },
  tip: { border: "border-[--accent-green]", Icon: Lightbulb },
  danger: { border: "border-red-500", Icon: ShieldAlert },
};

export default function Callout({ variant, children }: CalloutProps) {
  const { border, Icon } = variantStyles[variant];

  return (
    <div className={`my-6 rounded-lg border-l-4 bg-[--bg-surface] p-4 ${border}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 text-[--text-muted]" />
        <div className="text-sm text-[--text-body]">{children}</div>
      </div>
    </div>
  );
}
