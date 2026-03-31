export interface Tag {
  slug: string;
  label: string;
  count: number;
}

export interface InquiryStats {
  inquiry_id: string;
  fork_count: number;
  watch_count: number;
  related_count: number;
  visit_count: number;
  unique_researcher_count: number;
  tags: Tag[];
}
