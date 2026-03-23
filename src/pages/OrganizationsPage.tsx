import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Hospital, Users, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Eye, Pencil, Ban, CheckCircle, XCircle, Send } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { mockOrganizations, mockFacilities, mockProviders } from "@/data/mockData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Organization } from "@/data/types";

const STATUS_COLORS: Record<string, string> = {
  active: "hsl(152, 60%, 40%)",
  disabled: "hsl(0, 72%, 51%)",
  invitation_sent: "hsl(38, 92%, 50%)",
};

type SortKey = "name" | "status" | "activeFacilityCount" | "activeProviderCount" | "adminCount";
type SortDir = "asc" | "desc";

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />;
  return sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />;
}

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const orgs = mockOrganizations;
  const active = orgs.filter((o) => o.status === "active").length;
  const disabled = orgs.filter((o) => o.status === "disabled").length;
  const pending = orgs.filter((o) => o.status === "invitation_sent").length;

  const totalFacilities = mockFacilities.length;
  const activeFacilities = mockFacilities.filter(f => f.status === "active").length;
  const disabledFacilities = totalFacilities - activeFacilities;

  const totalProviders = mockProviders.length;
  const activeProviders = mockProviders.filter(p => p.status === "active").length;
  const disabledProviders = totalProviders - activeProviders;

  const chartData = [
    { name: "Active", value: active, color: STATUS_COLORS.active },
    { name: "Disabled", value: disabled, color: STATUS_COLORS.disabled },
    { name: "Invitation Sent", value: pending, color: STATUS_COLORS.invitation_sent },
  ];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = orgs.filter((o) => {
      const matchSearch = o.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "name") cmp = a.name.localeCompare(b.name);
        else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
        else cmp = (a[sortKey] as number) - (b[sortKey] as number);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [search, statusFilter, orgs, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortKey(null);
    setPage(1);
  };

  const hasFilters = search || statusFilter !== "all" || sortKey;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage platform organizations and onboarding</p>
        </div>
        <Button onClick={() => navigate("/organizations/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create Organization
        </Button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Organizations Card */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Organizations</h3>
            </div>
            <div className="text-right shrink-0">
              <p className="text-4xl font-bold tracking-tight leading-none">{orgs.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Active</span>
              <span className="text-sm font-semibold ml-1">{active}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">Disabled</span>
              <span className="text-sm font-semibold ml-1">{disabled}</span>
            </div>
          </div>
        </Card>

        {/* Facilities Card */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Hospital className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Facilities</h3>
            </div>
            <div className="text-right shrink-0">
              <p className="text-4xl font-bold tracking-tight leading-none">{totalFacilities}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Active</span>
              <span className="text-sm font-semibold ml-1">{activeFacilities}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">Disabled</span>
              <span className="text-sm font-semibold ml-1">{disabledFacilities}</span>
            </div>
          </div>
        </Card>

        {/* Providers Card */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Providers</h3>
            </div>
            <div className="text-right shrink-0">
              <p className="text-4xl font-bold tracking-tight leading-none">{totalProviders}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Active</span>
              <span className="text-sm font-semibold ml-1">{activeProviders}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">Inactive</span>
              <span className="text-sm font-semibold ml-1">{disabledProviders}</span>
            </div>
          </div>
        </Card>

        {/* Status Distribution Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status Distribution</h3>
            <p className="text-xs text-muted-foreground">{orgs.length} Total</p>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="h-24 w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={26} outerRadius={40} dataKey="value" paddingAngle={2} strokeWidth={0}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {chartData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground truncate">{d.name}</span>
                  </div>
                  <span className="font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="invitation_sent">Invitation Sent</SelectItem>
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
                  <button onClick={() => handleSort("name")} className="flex items-center font-medium hover:text-foreground transition-colors">
                    Organization <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("status")} className="flex items-center font-medium hover:text-foreground transition-colors">
                    Status <SortIcon column="status" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button onClick={() => handleSort("activeFacilityCount")} className="flex items-center justify-center font-medium hover:text-foreground transition-colors w-full">
                    Active Facilities <SortIcon column="activeFacilityCount" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button onClick={() => handleSort("activeProviderCount")} className="flex items-center justify-center font-medium hover:text-foreground transition-colors w-full">
                    Active Providers <SortIcon column="activeProviderCount" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button onClick={() => handleSort("adminCount")} className="flex items-center justify-center font-medium hover:text-foreground transition-colors w-full">
                    Admins <SortIcon column="adminCount" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((org) => (
                  <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/organizations/${org.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.type} · {org.country}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={org.status} /></TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{org.activeFacilityCount}</span>
                      <span className="text-muted-foreground text-xs">/{org.facilityCount}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{org.activeProviderCount}</span>
                      <span className="text-muted-foreground text-xs">/{org.providerCount}</span>
                    </TableCell>
                    <TableCell className="text-center">{org.adminCount}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/organizations/${org.id}`); }}>
                            <Eye className="mr-2 h-3.5 w-3.5" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/organizations/${org.id}/edit`); }}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          {org.status !== "disabled" && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/organizations/${org.id}?action=disable`); }} className="text-destructive">
                              <Ban className="mr-2 h-3.5 w-3.5" /> Disable
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
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
      </Card>
    </div>
  );
}
