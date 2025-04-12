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

/**
 * 기본 Discord Embed 템플릿 값
 */
export const defaultDiscordEmbedTemplate: DiscordEmbedTemplate = {
  title: "🚀 오픈소스 새 활동 알림 ({count}개)",
  color: 0x5865f2, // Discord 블루 색상
  fields: {
    name: "🔗 [{repo}] {title}", // 저장소와 제목
    value: "{summarySection}👤 {author} ({sourceType})", // 요약(선택적), 작성자, 출처
    inline: false, // 필드를 인라인으로 표시하지 않음
  },
  footer_exceeding_items: "... 외 {remaining_count}개의 새 활동이 더 있습니다.",
  footer_truncation: "... (메시지 길이 제한으로 일부 항목 생략)",
  timestamp_enabled: true, // 메시지 전송 시 타임스탬프 추가
};
