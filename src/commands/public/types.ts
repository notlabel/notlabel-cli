/** Responses from GET /public/investigations/* (discovery feed). */

import type { BlockBaseType, InquiryStatus, InquiryType } from "../inquiry/types.js";

export type PublicInquirySort = "createdAt:desc" | "updatedAt:desc";

export interface PublicInquiryOwnerSummary {
  username: string | null;
}

export interface PublicInquiryListStats {
  fork_count: number;
  watch_count: number;
  related_count: number;
  visit_count: number;
  unique_researcher_count: number;
  tags: { slug: string; label: string }[];
  block_count: number;
  annotation_count: number;
}

export interface PublicInquiryListItem {
  id: string;
  raw_input?: string;
  refined_statement?: string;
  type?: InquiryType;
  status?: InquiryStatus;
  privacy?: string;
  preferred_language?: string;
  root_topic_id?: string | null;
  orbit_graph_id?: string | null;
  created_at: string;
  owner: PublicInquiryOwnerSummary;
  stats: PublicInquiryListStats;
}

export interface PublicListInquiriesResponse {
  items: PublicInquiryListItem[];
  pagination: {
    total: number;
    limit: number;
    page: number;
    has_next: boolean;
  };
}

/** Public block (no user_id in API). */
export interface PublicBlock {
  id: string;
  inquiry_id: string | null;
  topic_id: string | null;
  kind: string;
  base_type: BlockBaseType;
  title: string | null;
  content: string | null;
  data: Record<string, unknown> | null;
  linked_block_ids: string[];
  privacy: string;
  is_pinned: boolean;
  pinned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicListBlocksResponse {
  items: PublicBlock[];
  pagination: {
    total: number;
    limit: number;
    page: number;
    has_next: boolean;
  };
}

export interface PublicUserProfileResponse {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name: string;
  avatar: string | null;
  stats: {
    public_inquiries_count: number;
    follower_count: number;
    following_count: number;
  };
}
