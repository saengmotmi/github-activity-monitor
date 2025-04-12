/**
 * Vitest 글로벌 설정 파일
 * @see https://vitest.dev/guide/global.html
 */
import { expect, vi, beforeEach, afterEach } from "vitest";

// 글로벌 설정
globalThis.expect = expect;
globalThis.vi = vi;

// 필요한 경우 모의 객체 설정
// vi.mock("../src/some-module", () => {
//   return {
//     someFunction: vi.fn(),
//   };
// });

// 테스트 전후 훅 설정
beforeEach(() => {
  // 테스트 전 초기화 코드
});

afterEach(() => {
  // 테스트 후 정리 코드
  vi.restoreAllMocks();
});
