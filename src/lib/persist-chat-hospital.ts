import { updateAuthUserHospital, type AuthUser } from "@/lib/auth-api";
import { saveEmrChatHospitalId } from "@/lib/emr-flow";

/** User RS → simpan ke profil (DB + localStorage). */
export async function persistChatHospitalPick(
  user: AuthUser,
  hospitalId: string,
): Promise<AuthUser> {
  if (user.role === "user" && !user.hospital_id) {
    const { user: updated } = await updateAuthUserHospital(hospitalId);
    return updated;
  }
  saveEmrChatHospitalId(hospitalId);
  return user;
}
