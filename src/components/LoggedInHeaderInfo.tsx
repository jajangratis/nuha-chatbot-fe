import { BetaBadge } from "@/components/BetaBadge";

type Props = {
  title: string;
  subtitle?: string;
  beta?: boolean;
};

export function LoggedInHeaderInfo({ title, subtitle, beta }: Props) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{title}</p>
        {beta ? <BetaBadge variant="onDark" /> : null}
      </div>
      {subtitle ? <p className="text-xs text-white/80">{subtitle}</p> : null}
    </div>
  );
}
