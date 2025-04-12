import { ActivityItem } from "../../../models/activity";

export interface IMessageFormatter<MessagePayload = unknown> {
  /**
   * 활동 아이템 목록을 받아 특정 플랫폼 형식의 메시지 페이로드로 변환합니다.
   * @param itemsToSend 포맷할 활동 아이템 배열
   * @param totalNewCount 필터링 되기 전 총 새 활동 수
   * @param maxItems 메시지에 포함될 최대 아이템 수
   * @returns 플랫폼에 맞는 메시지 페이로드 객체, 생성할 내용이 없으면 null
   */
  format(
    itemsToSend: ActivityItem[],
    totalNewCount: number,
    maxItems: number
  ): MessagePayload | null;
}
