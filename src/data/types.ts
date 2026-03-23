export interface Organization {
  id: string;
  name: string;
  status: "active" | "disabled" | "invitation_sent";
  type: string;
  country: string;
  facilityCount: number;
  activeFacilityCount: number;
  providerCount: number;
  activeProviderCount: number;
  adminCount: number;
  createdAt: string;
  logo: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  invite?: {
    email: string;
    status: "pending" | "accepted" | "revoked" | "expired";
    sentAt: string;
    acceptedAt?: string;
  };
}

export interface Facility {
  id: string;
  orgId: string;
  name: string;
  status: "active" | "disabled";
  providerCount: number;
  activeProviderCount: number;
  createdAt: string;
}

export interface Provider {
  id: string;
  facilityId: string;
  orgId: string;
  name: string;
  status: "active" | "inactive";
  specialty: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetEntity: string;
  targetId: string;
  outcome: "success" | "failure";
  reason: string;
}

export interface UsageData {
  date: string;
  orgName: string;
  facilityName: string;
  providerName: string;
  totalAICost: number;
  transcriptionDuration: number;
  notesGenerated: number;
  transcriptionCost: number;
  noteGenerationCost: number;
}
