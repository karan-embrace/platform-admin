import { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  ArrowLeft, Building2, Hospital, Users, UserCog, Send, AlertTriangle, Mail,
  RotateCcw, Ban, Eye, Search, ArrowUpDown, ArrowUp, ArrowDown, UserPlus, Pencil,
  MapPin, Power, Info,
} from "lucide-react";
import { mockOrganizations, mockFacilities } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { Facility } from "@/data/types";

type FacSortKey = "name" | "status" | "activeProviderCount";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />;
  return dir === "asc" ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />;
}

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const org = mockOrganizations.find((o) => o.id === id) || mockOrganizations[0];

  const [status, setStatus] = useState(org.status);
  const [showDisableDialog, setShowDisableDialog] = useState(searchParams.get("action") === "disable");
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [disableConfirmText, setDisableConfirmText] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showChangeAdmin, setShowChangeAdmin] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);

  // Facility table state
  const [facSearch, setFacSearch] = useState("");
  const [facStatusFilter, setFacStatusFilter] = useState("all");
  const [facSortKey, setFacSortKey] = useState<FacSortKey | null>(null);
  const [facSortDir, setFacSortDir] = useState<SortDir>("asc");

  const orgFacilities = mockFacilities.filter((f) => f.orgId === org.id);

  const filteredFacilities = useMemo(() => {
    let result = orgFacilities.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(facSearch.toLowerCase());
      const matchStatus = facStatusFilter === "all" || f.status === facStatusFilter;
      return matchSearch && matchStatus;
    });
    if (facSortKey) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (facSortKey === "name") cmp = a.name.localeCompare(b.name);
        else if (facSortKey === "status") cmp = a.status.localeCompare(b.status);
        else cmp = a.activeProviderCount - b.activeProviderCount;
        return facSortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [orgFacilities, facSearch, facStatusFilter, facSortKey, facSortDir]);

  const handleFacSort = (key: FacSortKey) => {
    if (facSortKey === key) setFacSortDir(facSortDir === "asc" ? "desc" : "asc");
    else { setFacSortKey(key); setFacSortDir("asc"); }
  };

  const handleDisable = () => {
    setStatus("disabled");
    setShowDisableDialog(false);
    setDisableConfirmText("");
    toast({ title: "Organization Disabled", description: "All sessions have been terminated." });
  };

  const handleEnable = () => {
    if (!org.invite || org.invite.status !== "accepted") {
      toast({ title: "Cannot Enable", description: "An accepted Primary Organization Admin is required to enable.", variant: "destructive" });
      return;
    }
    setStatus("active");
    setShowEnableDialog(false);
    toast({ title: "Organization Enabled", description: "Access has been restored." });
  };

  const handleSendInvite = () => {
    if (!inviteName || !inviteEmail) {
      toast({ title: "Required", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setShowInviteForm(false);
    setShowChangeAdmin(false);
    toast({ title: "Invitation Sent", description: `Invite sent to ${inviteEmail}` });
    setInviteName("");
    setInviteEmail("");
  };

  const handleChangeAdmin = () => {
    setShowChangeAdmin(true);
    setShowInviteForm(true);
  };

  const inviteStatusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    accepted: "bg-success/10 text-success border-success/20",
    revoked: "bg-destructive/10 text-destructive border-destructive/20",
    expired: "bg-muted text-muted-foreground border-border",
  };

  const disableConfirmValid = disableConfirmText === `Disable ${org.name}`;

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      <button onClick={() => navigate("/organizations")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Organizations
      </button>

      {status === "invitation_sent" && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm">Organization is inactive until the primary admin accepts the invitation.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xl">
            {org.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{org.type} · {org.country}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/organizations/${org.id}/edit`)}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDetailsSidebar(true)}>
            <Info className="mr-2 h-3.5 w-3.5" /> View Org Details
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Hospital className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-2xl font-semibold">{org.activeFacilityCount}<span className="text-sm font-normal text-muted-foreground">/{org.facilityCount}</span></p>
              <p className="text-xs text-muted-foreground">Active Facilities</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Users className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-2xl font-semibold">{org.activeProviderCount}<span className="text-sm font-normal text-muted-foreground">/{org.providerCount}</span></p>
              <p className="text-xs text-muted-foreground">Active Providers</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><UserCog className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-2xl font-semibold">{org.adminCount}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Invite Section */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Primary Organization Admin</CardTitle>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Primary</Badge>
          </div>
          <div className="flex gap-2">
            {!org.invite && !showInviteForm && (
              <Button size="sm" onClick={() => setShowInviteForm(true)}>
                <Send className="mr-2 h-3.5 w-3.5" /> Invite Primary Admin
              </Button>
            )}
            {org.invite && org.invite.status === "accepted" && (
              <Button variant="outline" size="sm" onClick={handleChangeAdmin}>
                <UserPlus className="mr-2 h-3.5 w-3.5" /> Change Primary Admin
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showInviteForm ? (
            <div className="space-y-4">
              {showChangeAdmin && (
                <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3 mb-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <p className="text-xs">The current primary admin invite will be revoked and a new invitation will be sent.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Admin Name</Label>
                  <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="primary.admin@org.com" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setShowInviteForm(false); setShowChangeAdmin(false); }}>Cancel</Button>
                <Button size="sm" onClick={handleSendInvite}>{showChangeAdmin ? "Revoke & Send New Invite" : "Send Invite"}</Button>
              </div>
            </div>
          ) : org.invite ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">Primary Organization Admin</p>
                  <p className="text-sm font-medium">{org.invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {org.invite.status.charAt(0).toUpperCase() + org.invite.status.slice(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Sent {org.invite.sentAt}</p>
                </div>
                <Badge variant="outline" className={inviteStatusColor[org.invite.status]}>
                  {org.invite.status.charAt(0).toUpperCase() + org.invite.status.slice(1)}
                </Badge>
              </div>
              <div className="flex gap-2">
                {org.invite.status === "pending" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Invitation Resent" })}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Resend
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Invitation Revoked" })}>
                      <Ban className="mr-1.5 h-3.5 w-3.5" /> Revoke
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No primary organization admin has been invited yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Facilities Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Hospital className="h-4 w-4 text-primary" /> Facilities ({orgFacilities.length})
          </h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search facilities..." value={facSearch} onChange={(e) => setFacSearch(e.target.value)} className="pl-9 h-9 w-[200px]" />
            </div>
            <Select value={facStatusFilter} onValueChange={setFacStatusFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={() => handleFacSort("name")} className="flex items-center font-medium hover:text-foreground transition-colors">
                  Facility Name <SortIcon active={facSortKey === "name"} dir={facSortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleFacSort("status")} className="flex items-center font-medium hover:text-foreground transition-colors">
                  Status <SortIcon active={facSortKey === "status"} dir={facSortDir} />
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button onClick={() => handleFacSort("activeProviderCount")} className="flex items-center justify-center font-medium hover:text-foreground transition-colors w-full">
                  Active Providers <SortIcon active={facSortKey === "activeProviderCount"} dir={facSortDir} />
                </button>
              </TableHead>
              <TableHead className="text-center">Total Providers</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFacilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No facilities found</TableCell>
              </TableRow>
            ) : (
              filteredFacilities.map((fac) => (
                <TableRow key={fac.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/organizations/${org.id}/facilities/${fac.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Hospital className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">{fac.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={fac.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                      {fac.status.charAt(0).toUpperCase() + fac.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{fac.activeProviderCount}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{fac.providerCount}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/organizations/${org.id}/facilities/${fac.id}`); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Right Sidebar — Org Details */}
      <Sheet open={showDetailsSidebar} onOpenChange={setShowDetailsSidebar}>
        <SheetContent className="w-[400px] sm:w-[440px]">
          <SheetHeader>
            <SheetTitle>Organization Details</SheetTitle>
            <SheetDescription>{org.name}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {/* Address */}
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" /> Address
              </h4>
              <div className="text-sm space-y-1 pl-6">
                <p>{org.address.street}</p>
                <p>{org.address.city}, {org.address.state} {org.address.postalCode}</p>
                <p className="text-muted-foreground">{org.address.country}</p>
              </div>
            </div>

            {/* Enable / Disable Control */}
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Power className="h-4 w-4 text-primary" /> Organization Control
              </h4>
              <div className="pl-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                  <StatusBadge status={status} />
                </div>
                {status === "active" || status === "invitation_sent" ? (
                  <Button variant="destructive" size="sm" onClick={() => { setShowDetailsSidebar(false); setTimeout(() => setShowDisableDialog(true), 200); }}>
                    <Ban className="mr-2 h-3.5 w-3.5" /> Disable Organization
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => { setShowDetailsSidebar(false); setTimeout(() => setShowEnableDialog(true), 200); }}>
                    <Power className="mr-2 h-3.5 w-3.5" /> Enable Organization
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Disable Dialog — Strong Confirmation */}
      <Dialog open={showDisableDialog} onOpenChange={(open) => { setShowDisableDialog(open); if (!open) setDisableConfirmText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Disable Organization
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>Are you sure you want to disable <strong>{org.name}</strong>? This action will:</p>
                <ul className="text-sm space-y-1.5 list-disc pl-4">
                  <li>All users will lose access immediately</li>
                  <li>All active sessions will be terminated</li>
                  <li>The organization will be locked</li>
                  <li>Pending invitations will be invalidated</li>
                </ul>
                <div className="pt-2 space-y-2">
                  <Label className="text-sm">
                    Type <strong className="font-semibold">Disable {org.name}</strong> to confirm
                  </Label>
                  <Input
                    value={disableConfirmText}
                    onChange={(e) => setDisableConfirmText(e.target.value)}
                    placeholder={`Disable ${org.name}`}
                    className="font-mono"
                  />
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDisableDialog(false); setDisableConfirmText(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisable} disabled={!disableConfirmValid}>
              Disable Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enable Dialog */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Power className="h-5 w-5 text-primary" /> Enable Organization
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>Do you want to enable <strong>{org.name}</strong>?</p>
                <p className="text-sm">Users will regain access immediately. All previously active accounts will be restored.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnableDialog(false)}>No</Button>
            <Button onClick={handleEnable}>Yes, Enable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
