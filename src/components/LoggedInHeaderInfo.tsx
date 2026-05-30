type Props = {
  title: string;
  subtitle?: string;
};

export function LoggedInHeaderInfo({ title, subtitle }: Props) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      {subtitle ? <p className="text-xs text-white/80">{subtitle}</p> : null}
    </div>
  );
}
