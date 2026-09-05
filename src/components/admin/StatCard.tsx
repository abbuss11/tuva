import { LucideIcon } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-elevated">
      <CardBody className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${accent}22, ${accent}0d)`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
