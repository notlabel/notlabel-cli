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

/** Serialized block from GET/POST/PATCH /blocks… or inquiry block lists (matches BlocksController.serialize). */
export interface Block {
  id: string;
  /** Mirrors backend actor provenance when the client sent HTTP provenance headers. */
  actor_kind?: string | null;
  actor_label?: string | null;
  correlation_id?: string | null;
  inquiry_id: string | null;
  /** Present when the block is scoped to a Topic (pre-inquiry / topic canvas). */
  topic_id?: string | null;
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
  /** Set for collaborator-submitted contributions pending or past review. */
  contribution_kind?: string | null;
  contribution_review_status?: string | null;
  contribution_reviewed_at?: string | null;
  contribution_reviewed_by_user_id?: string | null;
  contribution_rejection_reason?: string | null;
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

/** Collaborator row on an inquiry (owner is `user_id`, not repeated here). */
export type InquiryCollaboratorRole = "viewer" | "editor" | "maintainer";

export type InquiryMyRole = "owner" | InquiryCollaboratorRole;

export interface InquiryCollaborator {
  user_id: string;
  role: InquiryCollaboratorRole;
  user?: {
    username?: string | null;
    email?: string;
    avatar?: string;
    first_name?: string;
    last_name?: string;
  };
}

/** Topic summary embedded on inquiry detail (`topics` / `root_topic` from inquiry serializer). */
export interface InquiryTopicSummary {
  id: string;
  label: string;
  slug: string;
  description: string | null;
}

/**
 * Inquiry fields vary by endpoint. **GET /inquiries/:id** (authenticated) matches
 * `serializeInquiryDetail` in the backend: seed topic ids, topic summaries, collaborators, `my_role`.
 */
export interface Inquiry {
  id: string;
  user_id?: string;
  raw_input?: string;
  refined_statement?: string;
  type?: InquiryType;
  status?: InquiryStatus;
  /**
   * Backend schema default/enumeration includes `en` and `es` (see InquiryPreferredLanguage).
   * Serialized detail always returns a normalized value.
   */
  preferred_language?: string;
  confidence?: number;
  privacy?: InquiryPrivacy;
  /** Legacy/string seed labels (bench copy). */
  seed_topics?: string[];
  /** ObjectIds of seed Topic documents (strings in JSON). */
  seed_topic_ids?: string[];
  root_topic_id?: string | null;
  root_topic?: InquiryTopicSummary | null;
  /** De-duplicated topic cards (seed + root). */
  topics?: InquiryTopicSummary[];
  collaborators?: InquiryCollaborator[];
  /** Present on private inquiry detail for the current user. */
  my_role?: InquiryMyRole;
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

/** PATCH /blocks/:id — send only fields to change. */
export interface UpdateBlockBody {
  kind?: string;
  base_type?: BlockBaseType;
  title?: string;
  content?: string;
  data?: Record<string, unknown>;
  linked_block_ids?: string[];
  privacy?: InquiryPrivacy;
  is_pinned?: boolean;
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
/** Matches BlockAnnotationsService.AnnotationListItem.user (populated from User). */
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

/**
 * Annotation list/create/hidden API shape. The schema also has `deleted_at` (soft-delete);
 * deleted rows are **omitted** from list responses.
 */
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
