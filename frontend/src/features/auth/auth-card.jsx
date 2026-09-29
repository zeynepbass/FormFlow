export function AuthCard({ title, description, children, footer }) {
  return (
    <>
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-muted-strong">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? <p className="mt-6 text-center text-sm text-muted-strong">{footer}</p> : null}
    </>
  );
}
