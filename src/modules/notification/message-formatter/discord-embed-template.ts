/**
 * Discord Embed 필드 항목의 템플릿 정의
 * 플레이스홀더: {repo}, {title}, {summarySection}, {author}, {sourceType}
 */
interface EmbedFieldTemplate {
  name: string;
  value: string;
  inline: boolean;
}

/**
 * 전체 Discord Embed 메시지의 템플릿 정의
 * 플레이스홀더: {count}, {remaining_count}
 */
export interface DiscordEmbedTemplate {
  title: string;
  color: number;
  fields: EmbedFieldTemplate; // 개별 항목 템플릿
  footer_exceeding_items: string; // 더 많은 항목이 있을 때의 푸터 텍스트
  footer_truncation: string; // 필드 제한으로 잘릴 때의 푸터 텍스트
  timestamp_enabled: boolean; // 타임스탬프 표시 여부
}
