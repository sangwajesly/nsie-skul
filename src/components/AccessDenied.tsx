import { PermissionDeniedState } from "./ui/states/PermissionDeniedState";

interface AccessDeniedProps {
  message?: string;
  requiredRole?: string;
  currentRole?: string;
  resourceName?: string;
}

export default function AccessDenied({
  message = "Your school role does not have access to this area.",
  requiredRole,
  currentRole,
  resourceName,
}: AccessDeniedProps) {
  return (
    <PermissionDeniedState
      message={message}
      requiredRole={requiredRole}
      currentRole={currentRole}
      resourceName={resourceName}
    />
  );
}
