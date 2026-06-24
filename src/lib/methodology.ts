export const CURRENT_METHODOLOGY_VERSION = "v1.1";

export const MODEL_VERSION = "claude-sonnet-4-6";

export const CHANGELOG = [
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
