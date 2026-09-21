import { cn } from "@/lib/utils";

export function AdminToolbar({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      {title && (
        <h3 className="text-sm font-bold tracking-wider uppercase text-muted">{title}</h3>
      )}
      <div className="flex flex-wrap items-center gap-2 ml-auto">{children}</div>
    </div>
  );
}

export function AdminBtnGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-stretch gap-2",
        "[&_button]:h-9 [&_a]:inline-flex [&_a_button]:h-9",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AdminTableActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>
      {children}
    </div>
  );
}
