"use client";

import { MENTION_CHIP_CLASS } from "@/lib/mention-editor";
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
            className={MENTION_CHIP_CLASS}
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
