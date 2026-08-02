const EMR_APP_KEY = "nuha_emr_app_selected";
const EMR_APP_VALUE = "emr_v2";
const EMR_CHAT_HOSPITAL_KEY = "nuha_emr_chat_hospital_id";

export function markEmrAppSelected() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(EMR_APP_KEY, EMR_APP_VALUE);
  }
}

export function hasEmrAppSelected(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(EMR_APP_KEY) === EMR_APP_VALUE;
}

export function clearEmrAppSelection() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(EMR_APP_KEY);
  }
}

export function loadEmrChatHospitalId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(EMR_CHAT_HOSPITAL_KEY);
}

export function saveEmrChatHospitalId(hospitalId: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(EMR_CHAT_HOSPITAL_KEY, hospitalId);
  }
}

/** Logout penuh alur EMR (sesi portal + pilihan aplikasi). */
export function clearEmrFlow() {
  clearEmrAppSelection();
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(EMR_CHAT_HOSPITAL_KEY);
  }
}
