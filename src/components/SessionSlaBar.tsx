import type { ReactNode } from "react";
import { SessionLastUserReply } from "@/components/SessionLastUserReply";
import { formatDurationMs, type SessionSlaMetrics } from "@/lib/session-sla-metrics";

type Props = {
  lastUserMessageAt: string | null | undefined;
  sla: SessionSlaMetrics | null;
};

function MetricCell({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#717171]">
        {label}
      </p>
      <div className="text-xs font-medium text-[#014547]">{children}</div>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-[#9E9E9E]">{hint}</p>
      ) : null}
    </div>
  );
}

export function SessionSlaBar({ lastUserMessageAt, sla }: Props) {
  const hasTicket = sla?.ticket_number != null;
  const userAvg = sla?.avg_user_response_ms ?? null;
  const agentAvg = sla?.avg_agent_response_ms ?? null;
  const userSamples = sla?.user_response_samples ?? 0;
  const agentSamples = sla?.agent_response_samples ?? 0;

  return (
    <div className="grid gap-3 border-b border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCell label="Balasan terakhir user">
        <SessionLastUserReply at={lastUserMessageAt} className="!text-xs" />
      </MetricCell>

      <MetricCell
        label="Rata-rata user membalas"
        hint={
          userSamples > 0
            ? `Setelah pesan Anda · ${userSamples} sampel`
            : "Belum ada pola balasan user setelah Anda"
        }
      >
        {formatDurationMs(userAvg)}
      </MetricCell>

      <MetricCell
        label="Rata-rata Anda membalas"
        hint={
          agentSamples > 0
            ? `Setelah pesan user · ${agentSamples} sampel`
            : "Belum ada pola balasan Anda setelah user"
        }
      >
        {formatDurationMs(agentAvg)}
      </MetricCell>

      <MetricCell
        label="Umur tiket"
        hint={
          hasTicket
            ? `${sla!.ticket_number}${sla!.ticket_status ? ` · ${sla!.ticket_status}` : ""}`
            : "Belum ada tiket gangguan"
        }
      >
        {hasTicket ? formatDurationMs(sla?.ticket_age_ms) : "—"}
      </MetricCell>
    </div>
  );
}
