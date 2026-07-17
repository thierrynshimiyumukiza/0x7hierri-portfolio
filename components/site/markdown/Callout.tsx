import React, { type ReactNode } from "react";
import { AlertOctagon, AlertTriangle, Info, Lightbulb, MessageSquareWarning } from "lucide-react";

type CalloutVariant = "note" | "tip" | "important" | "warning" | "caution";

type CalloutProps = {
  variant: CalloutVariant;
  children: ReactNode;
};

const variantStyles: Record<CalloutVariant, { border: string; Icon: typeof Info }> = {
  note: { border: "border-[--accent-blue]", Icon: Info },
  tip: { border: "border-[--accent-green]", Icon: Lightbulb },
  important: { border: "border-violet-500", Icon: MessageSquareWarning },
  warning: { border: "border-[--accent-amber]", Icon: AlertTriangle },
  caution: { border: "border-red-500", Icon: AlertOctagon },
};

export default function Callout({ variant, children }: CalloutProps) {
  const { border, Icon } = variantStyles[variant];

  return (
    <aside className={`my-6 rounded-lg border-l-4 bg-[--bg-surface] p-4 ${border}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 text-[--text-muted]" />
        <div className="text-sm text-[--text-body]">{children}</div>
      </div>
    </aside>
  );
}
