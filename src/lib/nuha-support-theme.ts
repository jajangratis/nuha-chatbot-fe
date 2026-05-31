/** Palet & kelas UI Support Hub — selaras nuha.care / SupportHubHeader */

export const nuhaColors = {
  deep: "#032626",
  teal: "#0B6463",
  primary: "#014547",
  accent: "#07C5BA",
  green: "#639B15",
  lime: "#AAE053",
  text: "#0B1D15",
  muted: "#5A7A78",
  hint: "#717171",
  mintBg: "#E8F9F8",
  mintBorder: "#E0F7F5",
  pageBg: "#F4FAFA",
} as const;

export const nuhaHubHeaderClass =
  "border-b border-[#0B6463]/30 bg-gradient-to-r from-[#032626] to-[#0B6463] text-white";

export const nuhaPageBgClass = "bg-[#F4FAFA]";

export const nuhaPanelClass =
  "flex flex-col overflow-hidden rounded-xl border border-[#E0F7F5] bg-white shadow-[0_1px_3px_rgba(1,69,71,0.07)]";

export const nuhaPanelHeaderClass =
  "shrink-0 border-b border-[#E0F7F5] bg-gradient-to-r from-[#E8F9F8] to-white px-4 py-2.5";

export const nuhaPanelTitleClass =
  "text-xs font-semibold uppercase tracking-wider text-[#014547]";

export const nuhaPanelHintClass = "text-[10px] leading-snug text-[#5A7A78]";

export const nuhaPanelBodyClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain";

export const nuhaAccentCardClass =
  "rounded-lg border border-[#E0F7F5] bg-[#E8F9F8]/50 p-3";

export const nuhaInputClass =
  "w-full rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#0B1D15] shadow-sm outline-none transition placeholder:text-[#9E9E9E] focus:border-[#07C5BA] focus:ring-2 focus:ring-[#07C5BA]/15 disabled:cursor-not-allowed disabled:bg-[#F5F5F5]";

export const nuhaPrimaryButtonClass =
  "rounded-lg bg-gradient-to-r from-[#639B15] to-[#07C5BA] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-50";

export const nuhaSecondaryButtonClass =
  "rounded-md border border-[#07C5BA]/30 bg-white px-2.5 py-1 text-[10px] font-semibold text-[#014547] transition hover:bg-[#E8F9F8]";

export const nuhaSolidButtonClass =
  "rounded-lg bg-[#014547] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#032626] disabled:opacity-50";

export const nuhaLinkClass =
  "text-[10px] font-semibold text-[#07C5BA] transition hover:text-[#014547] hover:underline";

export const nuhaCommentCardClass =
  "rounded-lg border border-[#E0F7F5] bg-[#FAFDFD] px-3 py-2 shadow-[0_1px_2px_rgba(7,197,186,0.06)]";

export const nuhaInternalPanelClass = `${nuhaPanelClass} border-l-[3px] border-l-[#07C5BA]`;

export const nuhaMetaBarClass =
  "border-b border-[#E0F7F5] bg-[#E8F9F8]/80 px-4 py-3";

export const nuhaBreadcrumbLinkClass =
  "shrink-0 text-white/75 transition hover:text-[#AAE053]";

export const nuhaHeaderGhostButtonClass =
  "rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20";
