import Image from 'next/image';

export function EmptyState({ illustration, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
      {illustration ? <Image src={illustration} alt="" width={160} height={120} /> : null}
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-strong">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
