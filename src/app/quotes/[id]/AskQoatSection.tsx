import { prisma } from "@/lib/prisma";
import AskQoatChat from "./AskQoatChat";

type Props = {
  quoteId: string;
  isOwner: boolean;
  priceScore: number | null;
};

export default async function AskQoatSection({ quoteId, isOwner, priceScore }: Props) {
  if (!isOwner) return null;

  const conversation = await prisma.chatConversation.findUnique({
    where: { quoteId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, createdAt: true },
      },
    },
  });

  const initialMessages = conversation?.messages.map((m) => ({
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  })) ?? [];

  return (
    <section className="bg-white rounded-2xl px-6 py-6 space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
          Ask QOAT
        </p>
        <p className="text-base font-bold text-on-surface mt-1">
          Questions about this quote?
        </p>
      </div>
      <AskQoatChat
        quoteId={quoteId}
        initialMessages={initialMessages}
        priceScore={priceScore}
      />
    </section>
  );
}
