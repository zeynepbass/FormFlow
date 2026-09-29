import { Card } from '@/components/ui/card';

export function StatCard({ label, value, hint }) {
  return (
    <Card className="p-5">
      <dt className="text-sm text-muted-strong">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</dd>
      {hint ? <dd className="mt-1 text-sm text-muted-strong">{hint}</dd> : null}
    </Card>
  );
}
