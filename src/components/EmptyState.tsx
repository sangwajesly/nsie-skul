import { EmptyState as ModernEmptyState, EmptyStateProps } from "./ui/states/EmptyState";

interface LegacyEmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  action?: EmptyStateProps["action"];
  secondaryAction?: EmptyStateProps["secondaryAction"];
  tip?: string;
  variant?: EmptyStateProps["variant"];
  icon?: EmptyStateProps["icon"];
}

export default function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  action,
  secondaryAction,
  tip,
  variant,
  icon,
}: LegacyEmptyStateProps) {
  const resolvedAction = action || (ctaLabel && ctaHref ? { label: ctaLabel, href: ctaHref } : undefined);

  return (
    <ModernEmptyState
      title={title}
      description={description}
      action={resolvedAction}
      secondaryAction={secondaryAction}
      tip={tip}
      variant={variant}
      icon={icon}
    />
  );
}
