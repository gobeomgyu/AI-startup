import { describe, expect, it } from "vitest";
import { parseTags } from "./tasks";

describe("parseTags", () => {
  it("removes blank and duplicate tags while keeping the first spelling", () => {
    expect(parseTags(" Design,design, , API ,api, 검토 ")).toEqual([
      "Design",
      "API",
      "검토",
    ]);
  });
});
