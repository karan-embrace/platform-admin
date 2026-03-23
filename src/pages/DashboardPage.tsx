import { useEffect, useMemo, useState } from "react";
import { DollarSign, Clock, FileText, TrendingUp } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { mockUsageData, mockOrganizations, mockFacilities, mockProviders } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState("weekly");
  const [orgFilter, setOrgFilter] = useState("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [costType, setCostType] = useState("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  // Dependent filter options
  const availableFacilities = useMemo(() => {
    if (orgFilter === "all") return [];
    return mockFacilities.filter((f) => {
      const org = mockOrganizations.find((o) => o.name === orgFilter);
      return org && f.orgId === org.id;
    });
  }, [orgFilter]);

  const availableProviders = useMemo(() => {
    if (facilityFilter === "all") return [];
    return mockProviders.filter((p) => p.facilityId === facilityFilter);
  }, [facilityFilter]);

  // Reset dependent filters
  const handleOrgChange = (v: string) => {
    setOrgFilter(v);
    setFacilityFilter("all");
    setProviderFilter("all");
  };

  const handleFacilityChange = (v: string) => {
    setFacilityFilter(v);
    setProviderFilter("all");
  };

  const baseFilteredData = useMemo(() => {
    let result = mockUsageData;
    if (orgFilter !== "all") result = result.filter((d) => d.orgName === orgFilter);
    if (facilityFilter !== "all") {
      const fac = mockFacilities.find((f) => f.id === facilityFilter);
      if (fac) result = result.filter((d) => d.facilityName === fac.name);
    }
    if (providerFilter !== "all") {
      const prov = mockProviders.find((p) => p.id === providerFilter);
      if (prov) result = result.filter((d) => d.providerName === prov.name);
    }
    return result;
  }, [orgFilter, facilityFilter, providerFilter]);

  const dateBounds = useMemo(() => {
    if (baseFilteredData.length === 0) return { minDate: "", maxDate: "" };
    let minDate = baseFilteredData[0].date;
    let maxDate = baseFilteredData[0].date;
    baseFilteredData.forEach((item) => {
      if (item.date < minDate) minDate = item.date;
      if (item.date > maxDate) maxDate = item.date;
    });
    return { minDate, maxDate };
  }, [baseFilteredData]);

  useEffect(() => {
    if (dateRange !== "custom") return;
    if (!dateBounds.minDate || !dateBounds.maxDate) {
      setCustomFromDate("");
      setCustomToDate("");
      return;
    }

    setCustomFromDate((prev) => prev || dateBounds.minDate);
    setCustomToDate((prev) => prev || dateBounds.maxDate);
  }, [dateRange, dateBounds.minDate, dateBounds.maxDate]);

  useEffect(() => {
    if (!dateBounds.minDate || !dateBounds.maxDate) return;
    setCustomFromDate((prev) => {
      if (!prev) return prev;
      if (prev < dateBounds.minDate) return dateBounds.minDate;
      if (prev > dateBounds.maxDate) return dateBounds.maxDate;
      return prev;
    });
    setCustomToDate((prev) => {
      if (!prev) return prev;
      if (prev < dateBounds.minDate) return dateBounds.minDate;
      if (prev > dateBounds.maxDate) return dateBounds.maxDate;
      return prev;
    });
  }, [dateBounds.minDate, dateBounds.maxDate]);

  const data = useMemo(() => {
    if (dateRange !== "custom") return baseFilteredData;

    let from = customFromDate;
    let to = customToDate;

    if (from && to && from > to) [from, to] = [to, from];

    return baseFilteredData.filter((item) => {
      if (from && item.date < from) return false;
      if (to && item.date > to) return false;
      return true;
    });
  }, [baseFilteredData, dateRange, customFromDate, customToDate]);

  const totalAICost = useMemo(() => {
    if (costType === "transcription") return data.reduce((a, d) => a + d.transcriptionCost, 0);
    if (costType === "note_generation") return data.reduce((a, d) => a + d.noteGenerationCost, 0);
    return data.reduce((a, d) => a + d.totalAICost, 0);
  }, [data, costType]);

  const totalDuration = data.reduce((a, d) => a + d.transcriptionDuration, 0);
  const totalNotes = data.reduce((a, d) => a + d.notesGenerated, 0);
  const totalTranscriptionCost = data.reduce((a, d) => a + d.transcriptionCost, 0);

  // Aggregate by date for charts
  const dateAgg = useMemo(() => {
    const map: Record<string, { transcription: number; noteGen: number; total: number; notes: number }> = {};
    data.forEach((d) => {
      if (!map[d.date]) map[d.date] = { transcription: 0, noteGen: 0, total: 0, notes: 0 };
      map[d.date].transcription += d.transcriptionCost;
      map[d.date].noteGen += d.noteGenerationCost;
      map[d.date].total += d.totalAICost;
      map[d.date].notes += d.notesGenerated;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({
      date: date.slice(5),
      Transcription: Number(v.transcription.toFixed(2)),
      "Note Generation": Number(v.noteGen.toFixed(2)),
      cost: Number(v.total.toFixed(2)),
      notes: v.notes,
    }));
  }, [data]);

  // Filter level label
  const filterLevel = providerFilter !== "all" ? "Provider" : facilityFilter !== "all" ? "Facility" : orgFilter !== "all" ? "Organization" : "Platform";
  const isFacilityDisabled = orgFilter === "all";
  const isProviderDisabled = facilityFilter === "all";
  const filterTriggerClassName = "h-10 w-full";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage & Cost</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filterLevel}-level usage metrics and cost breakdown
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className={filterTriggerClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Organization</label>
            <Select value={orgFilter} onValueChange={handleOrgChange}>
              <SelectTrigger className={filterTriggerClassName}>
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {mockOrganizations.filter((o) => o.status === "active").map((o) => (
                  <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Facility</label>
            {isFacilityDisabled ? (
              <UiTooltip delayDuration={250}>
                <TooltipTrigger asChild>
                  <div className="cursor-not-allowed w-full">
                    <Select value={facilityFilter} onValueChange={handleFacilityChange} disabled>
                      <SelectTrigger className={filterTriggerClassName}>
                        <SelectValue placeholder="Select an org first" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Facilities</SelectItem>
                        {availableFacilities.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select an organization to filter facilities</p>
                </TooltipContent>
              </UiTooltip>
            ) : (
              <Select value={facilityFilter} onValueChange={handleFacilityChange}>
                <SelectTrigger className={filterTriggerClassName}>
                  <SelectValue placeholder="All Facilities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {availableFacilities.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Provider</label>
            {isProviderDisabled ? (
              <UiTooltip delayDuration={250}>
                <TooltipTrigger asChild>
                  <div className="cursor-not-allowed w-full">
                    <Select value={providerFilter} onValueChange={setProviderFilter} disabled>
                      <SelectTrigger className={filterTriggerClassName}>
                        <SelectValue placeholder="Select a facility first" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Providers</SelectItem>
                        {availableProviders.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select a facility to filter providers</p>
                </TooltipContent>
              </UiTooltip>
            ) : (
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className={filterTriggerClassName}>
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {availableProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Type</label>
            <Select value={costType} onValueChange={setCostType}>
              <SelectTrigger className={filterTriggerClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Costs</SelectItem>
                <SelectItem value="transcription">Transcription Only</SelectItem>
                <SelectItem value="note_generation">Note Generation Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {dateRange === "custom" && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">From</label>
              <Input
                type="date"
                value={customFromDate}
                onChange={(event) => setCustomFromDate(event.target.value)}
                min={dateBounds.minDate || undefined}
                max={customToDate || dateBounds.maxDate || undefined}
                className={filterTriggerClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">To</label>
              <Input
                type="date"
                value={customToDate}
                onChange={(event) => setCustomToDate(event.target.value)}
                min={customFromDate || dateBounds.minDate || undefined}
                max={dateBounds.maxDate || undefined}
                className={filterTriggerClassName}
              />
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={costType === "all" ? "Total AI Cost" : costType === "transcription" ? "Transcription Cost" : "Note Generation Cost"}
          value={`$${totalAICost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          trend={{ value: "12.5%", positive: false }}
        />
        <KPICard title="Transcription Duration" value={`${Math.round(totalDuration / 60)}h`} subtitle={`${totalDuration.toLocaleString()} min`} icon={Clock} />
        <KPICard title="Notes Generated" value={totalNotes.toLocaleString()} icon={FileText} trend={{ value: "8.2%", positive: true }} />
        <KPICard title="Transcription Cost" value={`$${totalTranscriptionCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dateAgg}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 18%, 89%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" tickFormatter={(v) => `$${v}`} />
              <RechartsTooltip formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} />
              <Legend />
              {(costType === "all" || costType === "transcription") && (
                <Bar dataKey="Transcription" fill="hsl(215, 70%, 28%)" radius={[4, 4, 0, 0]} />
              )}
              {(costType === "all" || costType === "note_generation") && (
                <Bar dataKey="Note Generation" fill="hsl(215, 65%, 55%)" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Cost Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dateAgg}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 18%, 89%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" tickFormatter={(v) => `$${v}`} />
              <RechartsTooltip formatter={(value: number, name: string) => [name === "cost" ? `$${value.toFixed(2)}` : value, name === "cost" ? "Total Cost" : "Notes"]} />
              <Line type="monotone" dataKey="cost" stroke="hsl(215, 70%, 28%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {costType === "all" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4">Transcript Bar Graph</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dateAgg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 18%, 89%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Transcription Cost"]} />
                  <Bar dataKey="Transcription" fill="hsl(215, 70%, 28%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4">Transcript Dot Graph</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dateAgg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 18%, 89%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Transcription Cost"]} />
                  <Line type="monotone" dataKey="Transcription" stroke="hsl(215, 70%, 28%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4">Notes Bar Graph</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dateAgg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 18%, 89%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Note Generation Cost"]} />
                  <Bar dataKey="Note Generation" fill="hsl(215, 65%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4">Notes Dot Graph</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dateAgg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 18%, 89%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 46%)" tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Note Generation Cost"]} />
                  <Line type="monotone" dataKey="Note Generation" stroke="hsl(215, 65%, 55%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
