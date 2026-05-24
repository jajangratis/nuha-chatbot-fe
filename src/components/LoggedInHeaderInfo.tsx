import { formatAuthRole, type AuthUser } from "@/lib/auth-api";

type Props = {
  user: AuthUser | null;
  title: string;
  subtitle?: string;
};

export function LoggedInHeaderInfo({ user, title, subtitle }: Props) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      {user ? (
        <p className="text-xs text-white/90">
          Login sebagai{" "}
          <span className="font-medium text-white">{user.display_name}</span>
          <span className="text-white/75"> (@{user.username})</span>
          {" · "}
          {formatAuthRole(user.role)}
          {user.hospital
            ? ` · ${user.hospital.name} (${user.hospital.code})`
            : null}
        </p>
      ) : subtitle ? (
        <p className="text-xs text-white/80">{subtitle}</p>
      ) : null}
      {subtitle && user ? (
        <p className="mt-0.5 text-xs text-white/70">{subtitle}</p>
      ) : null}
    </div>
  );
}
