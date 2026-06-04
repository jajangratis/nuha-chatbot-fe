import { fetchHospitalByCode, fetchHospitals } from "@/lib/support-api";

const NUHA_CODE = "NUHA";

/** ID RS NUHA untuk staff tanpa RS profil (implementator / support dev). */
export async function resolveStaffNuhaHospitalId(): Promise<string> {
  try {
    const hospital = await fetchHospitalByCode(NUHA_CODE);
    return hospital.id;
  } catch {
    const list = await fetchHospitals(NUHA_CODE);
    const nuha = list.find((h) => h.code.toUpperCase() === NUHA_CODE);
    if (nuha) return nuha.id;
  }

  throw new Error(
    "RS NUHA belum terdaftar di sistem. Jalankan seed database (npm run seed-users) atau hubungi admin.",
  );
}
