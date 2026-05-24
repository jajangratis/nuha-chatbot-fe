import { formatLastUserReply, lastUserReplyClassName } from "@/lib/last-user-reply";

type Props = {
  at: string | null | undefined;
  className?: string;
};

export function SessionLastUserReply({ at, className = "" }: Props) {
  return (
    <p
      className={`${lastUserReplyClassName(at)} ${className}`}
      title={
        at
          ? new Date(at).toLocaleString("id-ID", {
              dateStyle: "full",
              timeStyle: "short",
            })
          : undefined
      }
    >
      {formatLastUserReply(at)}
    </p>
  );
}
