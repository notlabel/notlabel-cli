/** API types for Inquiry and Blocks (consumed by CLI). */

export type InquiryType = "hypothesis" | "exploration" | "question";
export type InquiryStatus = "drafting" | "active" | "archived";

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
  status?: InquiryStatus;
  /** BCP-47 / locale code (e.g. en, es). Backend default is typically `en`. */
  preferred_language?: string;
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
  status?: InquiryStatus;
  privacy?: InquiryPrivacy;
  preferred_language?: string;
}

export interface UpdateInquiryBody {
  refined_statement?: string;
  confidence?: number;
  seed_topics?: string[];
  type?: InquiryType;
  privacy?: InquiryPrivacy;
  preferred_language?: string;
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

/** Block annotation (comment) — list/create payloads from block-annotations API. */
export interface BlockAnnotationUser {
  id: string;
  username: string | null;
  display_name: string;
}

export interface BlockAnnotationBlockRef {
  id: string;
  title: string | null;
  kind: string;
}

export interface BlockAnnotation {
  id: string;
  actor_kind: string | null;
  actor_label: string | null;
  correlation_id: string | null;
  block_id: string;
  inquiry_id: string;
  user_id: string;
  body: string;
  parent_annotation_id: string | null;
  hidden: boolean;
  user: BlockAnnotationUser;
  block: BlockAnnotationBlockRef;
  created_at: string;
  updated_at: string;
}

export interface ListBlockAnnotationsResponse {
  items: BlockAnnotation[];
}

export interface CreateBlockAnnotationBody {
  body: string;
  parent_annotation_id?: string;
}

/** GET/PUT /inquiries/:id/highlight — serialized highlight (preview + full markdown report). */
export interface InquiryHighlight {
  id: string;
  inquiry_id: string;
  user_id: string;
  title: string;
  abstract: string;
  key_findings: string[];
  open_questions: string[];
  next_steps: string[];
  body_md: string;
  evidence_block_ids: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

/** PUT body (version optional; server ignores client version). */
export interface UpsertInquiryHighlightBody {
  title: string;
  abstract: string;
  key_findings: string[];
  open_questions?: string[];
  next_steps?: string[];
  evidence_block_ids?: string[];
  body_md?: string;
  version?: number;
}

export interface HighlightVersionListItem {
  version: number;
  title: string;
  created_at: string;
}

export interface ListHighlightVersionsResponse {
  items: HighlightVersionListItem[];
}

export interface PreviewHighlightActivateResponse {
  inquiry: {
    id: string;
    status: InquiryStatus;
    activated_at: string | null;
    orbit_graph_id: string | null;
    created_at: string;
  };
  highlight: InquiryHighlight;
}
