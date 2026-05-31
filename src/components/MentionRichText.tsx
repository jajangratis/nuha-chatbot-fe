"use client";

import { splitMentionText } from "@/lib/ticket-mentions";

type Props = {
  text: string;
  className?: string;
};

export function MentionRichText({ text, className = "" }: Props) {
  const parts = splitMentionText(text);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === "mention" ? (
          <span
            key={`m-${i}-${part.userId}`}
            className="mx-0.5 inline-flex rounded-full bg-[#E8F9F8] px-1.5 py-0.5 align-baseline text-[12px] font-semibold text-[#014547] ring-1 ring-[#07C5BA]/20"
            title={`@${part.name}`}
          >
            @{part.name}
          </span>
        ) : (
          <span key={`t-${i}`} className="whitespace-pre-wrap">
            {part.value}
          </span>
        ),
      )}
    </span>
  );
}
