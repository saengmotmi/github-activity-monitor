import { describe, it, expect } from "vitest";
import { greet } from "./index.js";

describe("greet 함수", () => {
  it("인사말을 올바르게 반환해야 합니다", () => {
    expect(greet("홍길동")).toBe("안녕하세요, 홍길동님!");
  });
});
