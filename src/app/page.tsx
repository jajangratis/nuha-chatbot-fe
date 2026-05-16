import { Suspense } from "react";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { NuhaMirror } from "@/components/NuhaMirror";

function MirrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] font-sans text-[#014547]">
      <p className="text-lg">Memuat Nuha Care...</p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Suspense fallback={<MirrorFallback />}>
        <NuhaMirror />
      </Suspense>
      <FloatingChatbot />
    </>
  );
}
