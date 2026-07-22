import { prisma } from "./prisma";

const REACTION_EMOJIS = ["👍", "💡", "😱"] as const;

export type CategoryCommentData = {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string | null };
  netScore: number;
  userUpvoted: boolean;
  userDownvoted: boolean;
  reactions: { emoji: string; count: number; userReacted: boolean }[];
  replies: CategoryCommentData[];
};

type VoteRow = { userId: string; value: number };
type ReactionRow = { userId: string; emoji: string };

function serializeVotesReactions(
  votes: VoteRow[],
  reactions: ReactionRow[],
  currentUserId: string | null
) {
  const netScore = votes.reduce((sum, v) => sum + v.value, 0);
  const userVote = currentUserId ? votes.find((v) => v.userId === currentUserId) : null;
  return {
    netScore,
    userUpvoted: userVote ? userVote.value === 1 : false,
    userDownvoted: userVote ? userVote.value === -1 : false,
    reactions: REACTION_EMOJIS.map((emoji) => ({
      emoji,
      count: reactions.filter((r) => r.emoji === emoji).length,
      userReacted: currentUserId
        ? reactions.some((r) => r.emoji === emoji && r.userId === currentUserId)
        : false,
    })),
  };
}

export async function getCategoryComments(
  subcategoryId: string,
  sort: "helpful" | "newest" | "oldest",
  currentUserId: string | null
): Promise<CategoryCommentData[]> {
  const dbOrderBy =
    sort === "newest" ? { createdAt: "desc" as const } : { createdAt: "asc" as const };

  const rows = await prisma.comment.findMany({
    where: { subcategoryId, parentId: null, hidden: false },
    orderBy: dbOrderBy,
    include: {
      user: { select: { name: true } },
      votes: { select: { userId: true, value: true } },
      reactions: { select: { userId: true, emoji: true } },
      replies: {
        where: { hidden: false },
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { name: true } },
          votes: { select: { userId: true, value: true } },
          reactions: { select: { userId: true, emoji: true } },
        },
      },
    },
  });

  let result: CategoryCommentData[] = rows.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    user: { name: c.user.name },
    ...serializeVotesReactions(c.votes, c.reactions, currentUserId),
    replies: c.replies.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      user: { name: r.user.name },
      ...serializeVotesReactions(r.votes, r.reactions, currentUserId),
      replies: [],
    })),
  }));

  if (sort === "helpful") {
    result = result.sort(
      (a, b) =>
        b.netScore - a.netScore ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return result;
}
