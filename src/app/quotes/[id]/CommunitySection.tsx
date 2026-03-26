"use client";

import { useState } from "react";

export type CommentData = {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string | null };
  voteCount: number;
  userVoted: boolean;
  replies: CommentData[];
};

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

type VoteButtonProps = {
  count: number;
  voted: boolean;
  onVote: () => void;
  disabled?: boolean;
};

function VoteButton({ count, voted, onVote, disabled }: VoteButtonProps) {
  return (
    <button
      onClick={onVote}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        voted
          ? "bg-primary text-on-primary"
          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
      } disabled:opacity-40`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
      {count}
    </button>
  );
}

type CommentItemProps = {
  comment: CommentData;
  quoteId: string;
  currentUserId: string | null;
  isReply?: boolean;
  onReplyPosted: (parentId: string, reply: CommentData) => void;
};

function CommentItem({ comment, quoteId, currentUserId, isReply, onReplyPosted }: CommentItemProps) {
  const [voted, setVoted] = useState(comment.userVoted);
  const [voteCount, setVoteCount] = useState(comment.voteCount);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  async function handleVote() {
    if (!currentUserId) return;
    const optimisticVoted = !voted;
    setVoted(optimisticVoted);
    setVoteCount((c) => c + (optimisticVoted ? 1 : -1));
    try {
      await fetch("/api/votes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.id }),
      });
    } catch {
      setVoted(!optimisticVoted);
      setVoteCount((c) => c + (optimisticVoted ? -1 : 1));
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
        <div className="flex items-center gap-3 pt-1">
          <VoteButton
            count={voteCount}
            voted={voted}
            onVote={handleVote}
            disabled={!currentUserId}
          />
          {!isReply && currentUserId && (
            <button
              onClick={() => setShowReplyBox((v) => !v)}
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Inline reply box */}
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

      {/* Replies */}
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

type Props = {
  quoteId: string;
  initialComments: CommentData[];
  initialVoteCount: number;
  initialUserVoted: boolean;
  currentUserId: string | null;
};

export default function CommunitySection({
  quoteId,
  initialComments,
  initialVoteCount,
  initialUserVoted,
  currentUserId,
}: Props) {
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [quoteVoted, setQuoteVoted] = useState(initialUserVoted);
  const [quoteVoteCount, setQuoteVoteCount] = useState(initialVoteCount);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  const confidenceScore = Math.min(quoteVoteCount, 10);

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

  return (
    <section className="space-y-6">
      <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
        Community
      </p>

      {/* Confidence + quote vote */}
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

        <div className="flex flex-col gap-1">
          <p className="text-xs text-on-surface-variant font-medium">
            {currentUserId ? "Was this quote helpful?" : "Sign in to vote"}
          </p>
          <VoteButton
            count={quoteVoteCount}
            voted={quoteVoted}
            onVote={handleQuoteVote}
            disabled={!currentUserId}
          />
        </div>
      </div>

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-6">
          {comments.map((comment) => (
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
