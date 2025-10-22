import { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  gradient?: "primary" | "accent" | "success";
}

const KPICard = ({ title, value, icon: Icon, trend, gradient = "primary" }: KPICardProps) => {
  const gradientClass = {
    primary: "bg-gradient-primary",
    accent: "bg-gradient-accent",
    success: "bg-gradient-success",
  }[gradient];

  return (
    <Card className="rounded-2xl shadow-card hover:shadow-lg-custom transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
            {trend && (
              <p className="text-xs text-muted-foreground">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-2xl ${gradientClass}`}>
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
