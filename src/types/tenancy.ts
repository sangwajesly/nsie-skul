import { School, UserProfile, Role, Permission } from "./database";

export interface SchoolSubscriptionInfo {
  status: "trial" | "active" | "past_due" | "canceled";
  plan: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  isExpired: boolean;
  isTrial: boolean;
  daysRemaining: number;
}

export interface ActiveTenantContext {
  user: UserProfile;
  school: School;
  membershipId: string;
  role: Role;
  permissions: Permission[];
  hasPermission: (permissionCode: string) => boolean;
  isClassMaster?: boolean;
  masteredStreamNames?: string[];
  isHod?: boolean;
  subscription?: SchoolSubscriptionInfo;
}

export interface UserSchoolOption {
  membershipId: string;
  school: School;
  role: Role;
  status: string;
}
