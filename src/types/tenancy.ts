import { School, UserProfile, Role, Permission } from "./database";

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
}

export interface UserSchoolOption {
  membershipId: string;
  school: School;
  role: Role;
  status: string;
}
