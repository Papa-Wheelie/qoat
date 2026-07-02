export const CURRENT_METHODOLOGY_VERSION = "v1.2";

export const MODEL_VERSION = "claude-sonnet-4-6";

export const CHANGELOG = [
  {
    version: "v1.2",
    date: "2026-07-02",
    changes: [
      "Curated AU market reference now feeds the price scoring prompt alongside community comparables.",
      "Bootstrapped comparables with ~350 reference quotes across all sub-categories so benchmarks fire from day 1.",
      "Comparables lookup filters by sub-category and size band before falling back to embedding similarity.",
    ],
  },
  {
    version: "v1.1",
    date: "2026-06-24",
    changes: [
      "Upgraded Claude model from sonnet-4-20250514 (deprecated) to sonnet-4-6.",
    ],
  },
  {
    version: "v1.0",
    date: "2026-05-28",
    changes: [
      "Initial release",
      "Iron triangle scoring: Price (40%), Reputation (35%), Time (25%)",
      "Semantic comparable matching via Voyage AI embeddings",
      "Google Reviews integration for reputation scoring",
      "Australian compliance flagging (permits + certificates)",
      "Scale-aware Time scoring using extracted job size",
    ],
  },
];
