/** API types for Inquiry and Blocks (consumed by CLI). */

export type InquiryType = "hypothesis" | "exploration" | "question";

export type InquiryPrivacy = "private" | "public";

/** Block taxonomy from the blocks service (POST /inquiries/:id/blocks). */
export type BlockBaseType =
  | "note"
  | "experiment"
  | "source"
  | "code"
  | "insight"
  | "custom";

/** Serialized block from GET/POST/PATCH /blocks… or inquiry block lists. */
export interface Block {
  id: string;
  inquiry_id: string;
  user_id: string;
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

export interface BlocksPagination {
  total: number;
  limit: number;
  page: number;
  has_next: boolean;
}

export interface ListBlocksResponse {
  items: Block[];
  pagination: BlocksPagination;
}

/** Inquiry fields vary by endpoint; merge of list/get/create/update/activate payloads. */
export interface Inquiry {
  id: string;
  user_id?: string;
  raw_input?: string;
  refined_statement?: string;
  type?: InquiryType;
  status?: "drafting" | "active" | "archived";
  confidence?: number;
  seed_topics?: string[];
  collaborators?: string[];
  privacy?: InquiryPrivacy;
  orbit_graph_id?: string | null;
  activated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInquiryBody {
  raw_input: string;
  type: InquiryType;
  privacy?: InquiryPrivacy;
}

export interface UpdateInquiryBody {
  refined_statement?: string;
  confidence?: number;
  seed_topics?: string[];
  type?: InquiryType;
  privacy?: InquiryPrivacy;
}

export interface CreateBlockBody {
  kind: string;
  base_type: BlockBaseType;
  title?: string;
  content?: string;
  data?: Record<string, unknown>;
  linked_block_ids?: string[];
  privacy?: InquiryPrivacy;
}

/** POST /inquiries/:id/activate — flat payload (no nested inquiry). */
export interface ActivateInquiryResponse {
  id: string;
  status: "drafting" | "active" | "archived";
  activated_at?: string | null;
  orbit_graph_id?: string | null;
  created_at: string;
}
