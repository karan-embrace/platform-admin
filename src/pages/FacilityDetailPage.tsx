import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Hospital, Users, Search, ArrowUpDown, ArrowUp, ArrowDown, UserCog } from "lucide-react";
import { mockOrganizations, mockFacilities, mockProviders } from "@/data/mockData";

type ProvSortKey = "name" | "status" | "specialty";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />;
  return dir === "asc" ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />;
}

export default function FacilityDetailPage() {
  const { id, facilityId } = useParams();
  const navigate = useNavigate();
  const org = mockOrganizations.find((o) => o.id === id);
  const facility = mockFacilities.find((f) => f.id === facilityId);
  const providers = useMemo(() => mockProviders.filter((p) => p.facilityId === facilityId), [facilityId]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<ProvSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: ProvSortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let result = providers.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.specialty.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const cmp = (a[sortKey] as string).localeCompare(b[sortKey] as string);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [providers, search, statusFilter, sortKey, sortDir]);

  if (!org || !facility) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-muted-foreground">Facility not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/organizations">Organizations</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/organizations/${org.id}`}>{org.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{facility.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Hospital className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{facility.name}</h1>
            <Badge variant="outline" className={facility.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
              {facility.status.charAt(0).toUpperCase() + facility.status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{org.name} · Created {facility.createdAt}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Users className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-2xl font-semibold">{facility.activeProviderCount}<span className="text-sm font-normal text-muted-foreground">/{facility.providerCount}</span></p>
              <p className="text-xs text-muted-foreground">Active Providers</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Hospital className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-2xl font-semibold">{facility.status === "active" ? "Active" : "Disabled"}</p>
              <p className="text-xs text-muted-foreground">Facility Status</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><UserCog className="h-4 w-4 text-primary" /></div>
            <div className="min-w-0">
              <p className="text-base font-semibold truncate">{facility.primaryAdmin.name}</p>
              <p className="text-xs text-muted-foreground truncate">{facility.primaryAdmin.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Primary Facility Admin</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Providers ({providers.length})
          </h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search providers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-[200px]" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={() => handleSort("name")} className="flex items-center font-medium hover:text-foreground transition-colors">
                  Provider Name <SortIcon active={sortKey === "name"} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("status")} className="flex items-center font-medium hover:text-foreground transition-colors">
                  Status <SortIcon active={sortKey === "status"} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("specialty")} className="flex items-center font-medium hover:text-foreground transition-colors">
                  Specialty <SortIcon active={sortKey === "specialty"} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No providers found</TableCell>
              </TableRow>
            ) : (
              filtered.map((prov) => (
                <TableRow key={prov.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                        {prov.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-medium text-sm">{prov.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={prov.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}>
                      {prov.status.charAt(0).toUpperCase() + prov.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{prov.specialty}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{prov.createdAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
