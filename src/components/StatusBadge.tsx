import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OrgStatus = "active" | "disabled" | "invitation_sent";

const statusConfig: Record<OrgStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-success/10 text-success border-success/20 hover:bg-success/10" },
  disabled: { label: "Disabled", className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10" },
  invitation_sent: { label: "Invitation Sent", className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/10" },
};

export function StatusBadge({ status }: { status: OrgStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  );
}
