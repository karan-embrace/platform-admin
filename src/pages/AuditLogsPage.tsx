import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ScrollText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { mockAuditLogs } from "@/data/mockData";

const actionLabels: Record<string, string> = {
  "organization.create": "Create Org",
  "organization.disable": "Disable Org",
  "organization.enable": "Enable Org",
  "invite.send": "Send Invite",
  "invite.resend": "Resend Invite",
  "invite.revoke": "Revoke Invite",
  "session.invalidate": "Invalidate Sessions",
};

type SortKey = "timestamp" | "actor" | "action";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />;
  return dir === "asc" ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />;
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const actions = [...new Set(mockAuditLogs.map((l) => l.action))];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "timestamp" ? "desc" : "asc"); }
  };

  const filtered = useMemo(() => {
    let result = mockAuditLogs.filter((log) => {
      const matchSearch =
        log.targetEntity.toLowerCase().includes(search.toLowerCase()) ||
        log.reason.toLowerCase().includes(search.toLowerCase()) ||
        log.targetId.toLowerCase().includes(search.toLowerCase());
      const matchAction = actionFilter === "all" || log.action === actionFilter;
      return matchSearch && matchAction;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "timestamp") cmp = a.timestamp.localeCompare(b.timestamp);
      else if (sortKey === "actor") cmp = a.actor.localeCompare(b.actor);
      else cmp = a.action.localeCompare(b.action);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [search, actionFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const hasFilters = search || actionFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setPage(1);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Immutable record of all platform actions</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>{actionLabels[a] || a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              Clear Filters
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={() => handleSort("timestamp")} className="flex items-center font-medium hover:text-foreground transition-colors">
                  Timestamp <SortIcon active={sortKey === "timestamp"} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("actor")} className="flex items-center font-medium hover:text-foreground transition-colors">
                  Actor <SortIcon active={sortKey === "actor"} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("action")} className="flex items-center font-medium hover:text-foreground transition-colors">
                  Action <SortIcon active={sortKey === "action"} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Target ID</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No logs found</TableCell>
              </TableRow>
            ) : (
              paged.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(log.timestamp)}</TableCell>
                  <TableCell className="text-sm">{log.actor}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {actionLabels[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.targetEntity}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{log.targetId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={log.outcome === "success" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                      {log.outcome}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{log.reason}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(p)}>
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
