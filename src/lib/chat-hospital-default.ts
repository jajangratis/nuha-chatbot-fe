import type { AuthUser } from "@/lib/auth-api";
import type { Hospital } from "@/lib/support-api";

const STAFF_ROLES_DEFAULT_NUHA: AuthUser["role"][] = ["agent", "admin", "developer"];

export function isStaffChatRole(role: AuthUser["role"]): boolean {
  return STAFF_ROLES_DEFAULT_NUHA.includes(role);
}

/** Staff tanpa RS profil dianggap RS NUHA (tanpa layar pilih). */
export function staffImplicitNuhaHospital(role: AuthUser["role"]): boolean {
  return isStaffChatRole(role);
}

function findHospitalByCode(hospitals: Hospital[], code: string): Hospital | undefined {
  const upper = code.toUpperCase();
  return hospitals.find((h) => h.code.toUpperCase() === upper);
}

/** RS default untuk dropdown chat: user → RS profil; implementator/dev → NUHA. */
export function resolveDefaultChatHospitalId(
  user: AuthUser | null | undefined,
  hospitals: Hospital[],
): string | null {
  if (!user || hospitals.length === 0) return null;

  if (user.hospital_id) {
    return user.hospital_id;
  }

  if (user.hospital?.id) {
    return user.hospital.id;
  }

  if (user.hospital?.code) {
    const fromProfile = findHospitalByCode(hospitals, user.hospital.code);
    if (fromProfile) return fromProfile.id;
  }

  if (STAFF_ROLES_DEFAULT_NUHA.includes(user.role)) {
    const nuha = findHospitalByCode(hospitals, "NUHA");
    return nuha?.id ?? null;
  }

  return null;
}
