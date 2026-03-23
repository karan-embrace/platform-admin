import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const orgTypes = ["Hospital Network", "Medical Group", "Clinic", "Wellness Center", "Research Institute"];
const countries = ["United States"];
const LOGO_EDITOR_SIZE = 260;
const LOGO_OUTPUT_SIZE = 320;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCoverDimensions(containerSize: number, imageWidth: number, imageHeight: number) {
  if (!imageWidth || !imageHeight) {
    return { width: containerSize, height: containerSize };
  }

  const ratio = imageWidth / imageHeight;
  if (ratio > 1) {
    return { width: containerSize * ratio, height: containerSize };
  }

  return { width: containerSize, height: containerSize / ratio };
}

export default function CreateOrganizationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    type: "",
    country: "United States",
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [logoSourceUrl, setLogoSourceUrl] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoEditorOpen, setLogoEditorOpen] = useState(false);
  const [logoNaturalSize, setLogoNaturalSize] = useState({ width: 0, height: 0 });
  const [logoZoom, setLogoZoom] = useState(0);
  const [logoOffsetX, setLogoOffsetX] = useState(0);
  const [logoOffsetY, setLogoOffsetY] = useState(0);
  const sourceLogoUrlRef = useRef<string | null>(null);
  const croppedLogoUrlRef = useRef<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const logoZoomScale = 1 + logoZoom;
  const editorImageSize = useMemo(
    () => getCoverDimensions(LOGO_EDITOR_SIZE, logoNaturalSize.width, logoNaturalSize.height),
    [logoNaturalSize.height, logoNaturalSize.width],
  );
  const maxOffsetX = useMemo(
    () => Math.max(0, (editorImageSize.width * logoZoomScale - LOGO_EDITOR_SIZE) / 2),
    [editorImageSize.width, logoZoomScale],
  );
  const maxOffsetY = useMemo(
    () => Math.max(0, (editorImageSize.height * logoZoomScale - LOGO_EDITOR_SIZE) / 2),
    [editorImageSize.height, logoZoomScale],
  );

  useEffect(() => {
    setLogoOffsetX((value) => clamp(value, -maxOffsetX, maxOffsetX));
  }, [maxOffsetX]);

  useEffect(() => {
    setLogoOffsetY((value) => clamp(value, -maxOffsetY, maxOffsetY));
  }, [maxOffsetY]);

  useEffect(() => () => {
    if (sourceLogoUrlRef.current) URL.revokeObjectURL(sourceLogoUrlRef.current);
    if (croppedLogoUrlRef.current) URL.revokeObjectURL(croppedLogoUrlRef.current);
  }, []);

  const resetLogoEditorControls = () => {
    setLogoZoom(0);
    setLogoOffsetX(0);
    setLogoOffsetY(0);
  };

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextLogo = event.target.files?.[0];
    event.target.value = "";

    if (!nextLogo) return;
    if (!nextLogo.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload a PNG or JPG image.", variant: "destructive" });
      return;
    }

    if (sourceLogoUrlRef.current) URL.revokeObjectURL(sourceLogoUrlRef.current);
    if (croppedLogoUrlRef.current) {
      URL.revokeObjectURL(croppedLogoUrlRef.current);
      croppedLogoUrlRef.current = null;
    }

    const nextSourceUrl = URL.createObjectURL(nextLogo);
    sourceLogoUrlRef.current = nextSourceUrl;

    setLogo(nextLogo);
    setLogoSourceUrl(nextSourceUrl);
    setLogoPreviewUrl(nextSourceUrl);
    setLogoNaturalSize({ width: 0, height: 0 });
    resetLogoEditorControls();
    setLogoEditorOpen(true);
  };

  const handleLogoImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLogoNaturalSize({
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    });
  };

  const handleApplyLogoCrop = async () => {
    if (!logoSourceUrl || !logoNaturalSize.width || !logoNaturalSize.height) return;

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image for cropping"));
        img.src = logoSourceUrl;
      });

      const outputCover = getCoverDimensions(LOGO_OUTPUT_SIZE, image.naturalWidth, image.naturalHeight);
      const outputZoomedWidth = outputCover.width * logoZoomScale;
      const outputZoomedHeight = outputCover.height * logoZoomScale;
      const offsetScale = LOGO_OUTPUT_SIZE / LOGO_EDITOR_SIZE;
      const clampedOffsetX = clamp(logoOffsetX, -maxOffsetX, maxOffsetX) * offsetScale;
      const clampedOffsetY = clamp(logoOffsetY, -maxOffsetY, maxOffsetY) * offsetScale;

      const canvas = document.createElement("canvas");
      canvas.width = LOGO_OUTPUT_SIZE;
      canvas.height = LOGO_OUTPUT_SIZE;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      const drawX = (LOGO_OUTPUT_SIZE - outputZoomedWidth) / 2 + clampedOffsetX;
      const drawY = (LOGO_OUTPUT_SIZE - outputZoomedHeight) / 2 + clampedOffsetY;
      ctx.drawImage(image, drawX, drawY, outputZoomedWidth, outputZoomedHeight);

      const croppedBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!croppedBlob) throw new Error("Failed to create cropped image");

      const originalName = logo?.name ? logo.name.replace(/\.[^/.]+$/, "") : "organization-logo";
      const croppedFile = new File([croppedBlob], `${originalName}-cropped.png`, { type: "image/png" });
      const croppedPreviewUrl = URL.createObjectURL(croppedBlob);

      if (croppedLogoUrlRef.current) URL.revokeObjectURL(croppedLogoUrlRef.current);
      croppedLogoUrlRef.current = croppedPreviewUrl;

      setLogo(croppedFile);
      setLogoPreviewUrl(croppedPreviewUrl);
      setLogoEditorOpen(false);
      toast({ title: "Logo updated", description: "Preview now reflects your crop and fit settings." });
    } catch {
      toast({ title: "Could not process logo", description: "Please try another image.", variant: "destructive" });
    }
  };

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Organization name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email address";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (form.phone.replace(/\D/g, "").length !== 10) e.phone = "Phone number must be 10 digits";
    if (!form.type) e.type = "Organization type is required";
    if (!form.country) e.country = "Country is required";
    if (!form.street.trim()) e.street = "Street is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state) e.state = "State is required";
    if (!form.postalCode.trim()) e.postalCode = "ZIP code is required";
    else if (!/^\d{5}$/.test(form.postalCode.trim())) e.postalCode = "ZIP code must be 5 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({ title: "Validation Error", description: "Please fix the errors below.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Organization Created", description: `${form.name} has been provisioned with a default facility.` });
      navigate("/organizations/org-001");
    }, 1000);
  };

  const allFilled = form.name && form.email && form.phone && form.type && form.country && form.street && form.city && form.state && form.postalCode;
  const clampedEditorOffsetX = clamp(logoOffsetX, -maxOffsetX, maxOffsetX);
  const clampedEditorOffsetY = clamp(logoOffsetY, -maxOffsetY, maxOffsetY);

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <button onClick={() => navigate("/organizations")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Organizations
      </button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Organization</h1>
        <p className="text-sm text-muted-foreground mt-1">Provision a new organization on the platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Organization Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name *</Label>
              <Input placeholder="e.g. Summit Health Systems" value={form.name} onChange={(e) => update("name", e.target.value)} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="org@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex flex-wrap items-start gap-3">
                <label className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm cursor-pointer hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  {logo ? logo.name : "Upload PNG/JPG"}
                  <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleLogoSelect} />
                </label>
                {logoSourceUrl && (
                  <Button type="button" variant="outline" onClick={() => setLogoEditorOpen(true)}>
                    Crop & Fit
                  </Button>
                )}
                {logoPreviewUrl && (
                  <div className="h-14 w-14 overflow-hidden rounded-md border bg-muted">
                    <img src={logoPreviewUrl} alt="Logo preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Upload and optionally crop to fit a square logo preview.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organization Type *</Label>
                <Select value={form.type} onValueChange={(v) => update("type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {orgTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
              </div>
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={form.country} onValueChange={(v) => update("country", v)}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Address (US)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Street *</Label>
              <Input placeholder="Street address" value={form.street} onChange={(e) => update("street", e.target.value)} />
              {errors.street && <p className="text-xs text-destructive">{errors.street}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input placeholder="City" value={form.city} onChange={(e) => update("city", e.target.value)} />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Select value={form.state} onValueChange={(v) => update("state", v)}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
              </div>
              <div className="space-y-2">
                <Label>ZIP Code *</Label>
                <Input
                  placeholder="12345"
                  value={form.postalCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                    update("postalCode", v);
                  }}
                  maxLength={5}
                />
                {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/organizations")}>Cancel</Button>
          <Button type="submit" disabled={loading || !allFilled}>
            {loading ? "Provisioning..." : "Create Organization"}
          </Button>
        </div>
      </form>

      <Dialog open={logoEditorOpen} onOpenChange={setLogoEditorOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Crop and fit logo</DialogTitle>
            <DialogDescription>Adjust zoom and position so the logo looks right in a square preview.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="mx-auto h-[260px] w-[260px] overflow-hidden rounded-xl border bg-muted">
              {logoSourceUrl ? (
                <div className="relative h-full w-full">
                  <img
                    src={logoSourceUrl}
                    alt="Logo crop preview"
                    onLoad={handleLogoImageLoad}
                    className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                    style={{
                      width: `${editorImageSize.width}px`,
                      height: `${editorImageSize.height}px`,
                      transform: `translate(calc(-50% + ${clampedEditorOffsetX}px), calc(-50% + ${clampedEditorOffsetY}px)) scale(${logoZoomScale})`,
                      transformOrigin: "center center",
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image selected</div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Zoom</span>
                  <span>{logoZoom.toFixed(2)}x</span>
                </div>
                <Slider min={0} max={2} step={0.01} value={[logoZoom]} onValueChange={(v) => setLogoZoom(v[0] ?? 0)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Horizontal</span>
                  <span>{Math.round(clampedEditorOffsetX)} px</span>
                </div>
                <Slider
                  min={-Math.ceil(maxOffsetX)}
                  max={Math.ceil(maxOffsetX)}
                  step={1}
                  value={[clampedEditorOffsetX]}
                  onValueChange={(v) => setLogoOffsetX(v[0] ?? 0)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vertical</span>
                  <span>{Math.round(clampedEditorOffsetY)} px</span>
                </div>
                <Slider
                  min={-Math.ceil(maxOffsetY)}
                  max={Math.ceil(maxOffsetY)}
                  step={1}
                  value={[clampedEditorOffsetY]}
                  onValueChange={(v) => setLogoOffsetY(v[0] ?? 0)}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button type="button" variant="ghost" onClick={resetLogoEditorControls}>Reset</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setLogoEditorOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleApplyLogoCrop} disabled={!logoSourceUrl}>Apply</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
