"use client";

import { useState, useMemo } from "react";
import ReportModal from "@/components/ReportModal";

export type ReactionData = {
  emoji: string;
  count: number;
  userReacted: boolean;
};

export type CommentData = {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string | null };
  netScore: number;
  userUpvoted: boolean;
  userDownvoted: boolean;
  reactions: ReactionData[];
  replies: CommentData[];
};

export type SimilarQuoteData = {
  price: number | null;
  note: string | null;
  createdAt: string;
  isOwn: boolean;
};

type SortOrder = "helpful" | "newest" | "oldest";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-AU");
}

function firstName(name: string | null): string {
  if (!name) return "Anonymous";
  return name.split(" ")[0];
}

function formatAUD(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Up/Down vote ──────────────────────────────────────────────────────────────

type UpDownVoteProps = {
  netScore: number;
  upvoted: boolean;
  downvoted: boolean;
  onVote: (value: 1 | -1) => void;
  disabled?: boolean;
};

function UpDownVote({ netScore, upvoted, downvoted, onVote, disabled }: UpDownVoteProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => onVote(1)}
        disabled={disabled}
        title="Helpful"
        className={`p-1 rounded transition-colors ${
          upvoted ? "text-primary" : "text-on-surface-variant hover:text-primary"
        } disabled:opacity-40`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={upvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      </button>
      <span className={`text-xs font-semibold min-w-[16px] text-center ${
        netScore > 0 ? "text-primary" : netScore < 0 ? "text-red-600" : "text-on-surface-variant"
      }`}>
        {netScore}
      </span>
      <button
        onClick={() => onVote(-1)}
        disabled={disabled}
        title="Not helpful"
        className={`p-1 rounded transition-colors ${
          downvoted ? "text-red-500" : "text-on-surface-variant hover:text-red-500"
        } disabled:opacity-40`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={downvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </button>
    </div>
  );
}

// ── Comment ───────────────────────────────────────────────────────────────────

type CommentItemProps = {
  comment: CommentData;
  quoteId: string;
  currentUserId: string | null;
  isReply?: boolean;
  onReplyPosted: (parentId: string, reply: CommentData) => void;
};

function CommentItem({ comment, quoteId, currentUserId, isReply, onReplyPosted }: CommentItemProps) {
  const [netScore, setNetScore] = useState(comment.netScore);
  const [upvoted, setUpvoted] = useState(comment.userUpvoted);
  const [downvoted, setDownvoted] = useState(comment.userDownvoted);
  const [reactions, setReactions] = useState<ReactionData[]>(comment.reactions);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  async function handleVote(value: 1 | -1) {
    if (!currentUserId) return;
    // Optimistic update
    const wasUp = upvoted;
    const wasDown = downvoted;
    const prevScore = netScore;

    if (value === 1) {
      if (wasUp) {
        setUpvoted(false);
        setNetScore((s) => s - 1);
      } else {
        setUpvoted(true);
        setDownvoted(false);
        setNetScore((s) => s + 1 + (wasDown ? 1 : 0));
      }
    } else {
      if (wasDown) {
        setDownvoted(false);
        setNetScore((s) => s + 1);
      } else {
        setDownvoted(true);
        setUpvoted(false);
        setNetScore((s) => s - 1 - (wasUp ? 1 : 0));
      }
    }

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.id, value }),
      });
      if (res.ok) {
        const data = await res.json();
        setNetScore(data.netScore);
        setUpvoted(data.upvoted);
        setDownvoted(data.downvoted);
      } else {
        setUpvoted(wasUp);
        setDownvoted(wasDown);
        setNetScore(prevScore);
      }
    } catch {
      setUpvoted(wasUp);
      setDownvoted(wasDown);
      setNetScore(prevScore);
    }
  }

  async function handleReact(emoji: string) {
    if (!currentUserId) return;
    const prev = reactions;
    // Optimistic update
    setReactions((r) =>
      r.map((item) =>
        item.emoji === emoji
          ? {
              ...item,
              count: item.userReacted ? item.count - 1 : item.count + 1,
              userReacted: !item.userReacted,
            }
          : item
      )
    );
    try {
      const res = await fetch(`/api/comments/${comment.id}/react`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setReactions(data.reactions);
      } else {
        setReactions(prev);
      }
    } catch {
      setReactions(prev);
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, content: replyText.trim(), parentId: comment.id }),
      });
      if (res.ok) {
        const newReply = await res.json();
        onReplyPosted(comment.id, newReply);
        setReplyText("");
        setShowReplyBox(false);
      }
    } finally {
      setReplyLoading(false);
    }
  }

  return (
    <div className={isReply ? "ml-8 mt-4" : ""}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-on-surface">{firstName(comment.user.name)}</span>
          <span className="text-xs text-on-surface-variant">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-on-surface leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <UpDownVote
            netScore={netScore}
            upvoted={upvoted}
            downvoted={downvoted}
            onVote={handleVote}
            disabled={!currentUserId}
          />

          {/* Reactions */}
          <div className="flex items-center gap-1.5">
            {reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReact(r.emoji)}
                disabled={!currentUserId}
                title={currentUserId ? (r.userReacted ? "Remove reaction" : "React") : "Sign in to react"}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                  r.userReacted
                    ? "bg-primary/10 text-primary font-semibold"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                } disabled:opacity-40`}
              >
                <span>{r.emoji}</span>
                {r.count > 0 && <span>{r.count}</span>}
              </button>
            ))}
          </div>

          {!isReply && currentUserId && (
            <button
              onClick={() => setShowReplyBox((v) => !v)}
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              Reply
            </button>
          )}
          {currentUserId && (
            <button
              onClick={() => setShowReport(true)}
              className="text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
              title="Report comment"
            >
              Report
            </button>
          )}
        </div>
      </div>

      {showReport && (
        <ReportModal commentId={comment.id} onClose={() => setShowReport(false)} />
      )}

      {showReplyBox && (
        <form onSubmit={submitReply} className="mt-3 space-y-2">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-[12px] px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={replyLoading || !replyText.trim()}
              className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-[10px] hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {replyLoading ? "Posting…" : "Post Reply"}
            </button>
            <button
              type="button"
              onClick={() => setShowReplyBox(false)}
              className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          quoteId={quoteId}
          currentUserId={currentUserId}
          isReply
          onReplyPosted={onReplyPosted}
        />
      ))}
    </div>
  );
}

// ── Similar Quote Form ────────────────────────────────────────────────────────

type SimilarFormProps = {
  quoteId: string;
  onSubmitted: (data: { count: number; avgPrice: number | null; submissions: SimilarQuoteData[] }) => void;
  hasOwn: boolean;
};

function SimilarQuoteForm({ quoteId, onSubmitted, hasOwn }: SimilarFormProps) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedPrice = price ? parseFloat(price) : null;
    if (!parsedPrice && !note.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/similar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parsedPrice ?? undefined, note: note.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        onSubmitted(data);
        setOpen(false);
        setPrice("");
        setNote("");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-primary hover:underline underline-offset-2 transition-colors"
      >
        {hasOwn ? "Update your similar quote" : "+ I got a similar quote"}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <p className="text-xs font-semibold text-on-surface-variant">Share what you paid for similar work</p>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-on-surface-variant block mb-1">Your price (AUD)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 4500"
            min="0"
            step="100"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-[10px] px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-on-surface-variant block mb-1">Note <span className="text-outline">(optional, max 280 chars)</span></label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          placeholder="e.g. Similar job in Melbourne, 2024"
          className="w-full bg-surface-container-lowest border border-outline-variant rounded-[10px] px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || (!price && !note.trim())}
          className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-[10px] hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? "Saving…" : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setPrice(""); setNote(""); }}
          className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Report quote button ───────────────────────────────────────────────────────

function ReportQuoteButton({ quoteId }: { quoteId: string }) {
  const [showReport, setShowReport] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowReport(true)}
        className="text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
      >
        Report this quote
      </button>
      {showReport && (
        <ReportModal quoteId={quoteId} onClose={() => setShowReport(false)} />
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  quoteId: string;
  initialComments: CommentData[];
  initialVoteCount: number;
  initialUserVoted: boolean;
  currentUserId: string | null;
  initialHelpfulCount: number;
  initialUserMarkedHelpful: boolean;
  initialSimilarQuotes: SimilarQuoteData[];
  similarAvgPrice: number | null;
  isSeed: boolean;
};

export default function CommunitySection({
  quoteId,
  initialComments,
  initialVoteCount,
  initialUserVoted,
  currentUserId,
  initialHelpfulCount,
  initialUserMarkedHelpful,
  initialSimilarQuotes,
  similarAvgPrice: initialSimilarAvgPrice,
  isSeed,
}: Props) {
  if (isSeed) {
    return (
      <section className="space-y-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
          Community
        </p>
        <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
          Community engagement is disabled on reference quotes.
        </div>
      </section>
    );
  }
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [quoteVoted, setQuoteVoted] = useState(initialUserVoted);
  const [quoteVoteCount, setQuoteVoteCount] = useState(initialVoteCount);
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [userMarkedHelpful, setUserMarkedHelpful] = useState(initialUserMarkedHelpful);
  const [similarQuotes, setSimilarQuotes] = useState<SimilarQuoteData[]>(initialSimilarQuotes);
  const [similarAvgPrice, setSimilarAvgPrice] = useState<number | null>(initialSimilarAvgPrice);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("helpful");

  const confidenceScore = Math.min(quoteVoteCount, 10);

  const sortedComments = useMemo(() => {
    const sorted = [...comments];
    if (sortOrder === "helpful") {
      sorted.sort((a, b) => b.netScore - a.netScore || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return sorted;
  }, [comments, sortOrder]);

  async function handleQuoteVote() {
    if (!currentUserId) return;
    const optimistic = !quoteVoted;
    setQuoteVoted(optimistic);
    setQuoteVoteCount((c) => c + (optimistic ? 1 : -1));
    try {
      await fetch("/api/votes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
    } catch {
      setQuoteVoted(!optimistic);
      setQuoteVoteCount((c) => c + (optimistic ? -1 : 1));
    }
  }

  async function handleHelpful() {
    if (!currentUserId) return;
    const optimistic = !userMarkedHelpful;
    setUserMarkedHelpful(optimistic);
    setHelpfulCount((c) => c + (optimistic ? 1 : -1));
    try {
      const res = await fetch(`/api/quotes/${quoteId}/helpful`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setHelpfulCount(data.count);
        setUserMarkedHelpful(data.marked);
      } else {
        setUserMarkedHelpful(!optimistic);
        setHelpfulCount((c) => c + (optimistic ? -1 : 1));
      }
    } catch {
      setUserMarkedHelpful(!optimistic);
      setHelpfulCount((c) => c + (optimistic ? -1 : 1));
    }
  }

  function handleSimilarSubmitted(data: { count: number; avgPrice: number | null; submissions: SimilarQuoteData[] }) {
    setSimilarQuotes(data.submissions);
    setSimilarAvgPrice(data.avgPrice);
  }

  function handleReplyPosted(parentId: string, reply: CommentData) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    );
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, content: newComment.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } finally {
      setPosting(false);
    }
  }

  const hasSimilarOwn = similarQuotes.some((s) => s.isOwn);
  const similarPrices = similarQuotes.map((s) => s.price).filter((p): p is number => p != null);

  return (
    <section className="space-y-6">
      <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
        Community
      </p>

      {/* Confidence + helpful */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 bg-surface-container-lowest rounded-[16px] px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-0.5">
              Community Confidence
            </p>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-extrabold tracking-tighter text-primary leading-none">
                {confidenceScore}
              </span>
              <span className="text-sm font-semibold text-on-surface-variant mb-0.5">/10</span>
              <span className="text-xs text-on-surface-variant mb-1 ml-1">
                ({quoteVoteCount} {quoteVoteCount === 1 ? "vote" : "votes"})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Quote upvote */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuoteVote}
              disabled={!currentUserId}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                quoteVoted
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              } disabled:opacity-40`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={quoteVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
              {quoteVoted ? "Voted" : "Looks fair"}
            </button>
          </div>

          {/* Helpful */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleHelpful}
              disabled={!currentUserId}
              title={currentUserId ? undefined : "Sign in to mark as helpful"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                userMarkedHelpful
                  ? "bg-[#E1F5EE] text-[#085041]"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              } disabled:opacity-40`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={userMarkedHelpful ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              This helped me{helpfulCount > 0 && ` · ${helpfulCount}`}
            </button>
          </div>
        </div>
      </div>

      {/* Similar quotes */}
      <div className="bg-surface-container-lowest rounded-[16px] px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
              Similar quotes
            </p>
            {similarQuotes.length > 0 ? (
              <p className="text-xs text-on-surface-variant mt-0.5">
                {similarQuotes.length} {similarQuotes.length === 1 ? "member" : "members"} shared a similar quote
                {similarAvgPrice != null && similarPrices.length > 0 && (
                  <> · avg <span className="font-semibold text-on-surface">{formatAUD(similarAvgPrice)}</span></>
                )}
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant mt-0.5">No similar quotes shared yet</p>
            )}
          </div>
          {currentUserId && (
            <SimilarQuoteForm
              quoteId={quoteId}
              onSubmitted={handleSimilarSubmitted}
              hasOwn={hasSimilarOwn}
            />
          )}
        </div>

        {similarQuotes.length > 0 && (
          <div className="space-y-2 pt-1">
            {similarQuotes.map((s, i) => (
              <div key={i} className="flex items-start gap-3 text-xs text-on-surface-variant">
                <span className="shrink-0 mt-0.5">
                  {s.isOwn ? "You" : "Member"}
                </span>
                {s.price != null && (
                  <span className="font-semibold text-on-surface">{formatAUD(s.price)}</span>
                )}
                {s.note && <span className="flex-1 min-w-0 line-clamp-2">{s.note}</span>}
              </div>
            ))}
          </div>
        )}

        {!currentUserId && (
          <p className="text-xs text-on-surface-variant">
            <a href="/login" className="font-semibold text-primary hover:underline underline-offset-2">Sign in</a>{" "}
            to share a similar quote.
          </p>
        )}
      </div>

      {/* Report quote */}
      {currentUserId && <ReportQuoteButton quoteId={quoteId} />}

      {/* Comments header + sort */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-on-surface">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </p>
        {comments.length > 1 && (
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="bg-surface-container-lowest border border-outline-variant rounded-[8px] px-2 py-1 text-xs font-semibold text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="helpful">Most helpful</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        )}
      </div>

      {/* Comments list */}
      {sortedComments.length > 0 && (
        <div className="space-y-6">
          {sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              quoteId={quoteId}
              currentUserId={currentUserId}
              onReplyPosted={handleReplyPosted}
            />
          ))}
        </div>
      )}

      {comments.length === 0 && (
        <p className="text-sm text-on-surface-variant">
          No comments yet. Be the first to share your knowledge.
        </p>
      )}

      {/* Add comment form */}
      {currentUserId ? (
        <form onSubmit={handlePostComment} className="space-y-3 pt-2">
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your experience or knowledge about this type of quote…"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-[12px] px-4 py-4 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
          />
          <button
            type="submit"
            disabled={posting || !newComment.trim()}
            className="w-full bg-[#111111] text-white py-4 rounded-[12px] font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-lg shadow-black/5 disabled:opacity-60"
          >
            {posting ? "Posting…" : "Post Comment"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-on-surface-variant pt-2">
          <a href="/login" className="font-semibold text-primary hover:underline underline-offset-2">
            Sign in
          </a>{" "}
          to leave a comment.
        </p>
      )}
    </section>
  );
}
