import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { FeedingGroups } from "./feeding-art";

afterEach(cleanup);
it("draws exactly one shark and the correct fish count per group for all factor combinations in both views", () => {
  const { container, rerender } = render(<FeedingGroups sharks={1} fishEach={1} array={false} />);
  for (let sharks = 1; sharks <= 12; sharks++) for (let fishEach = 1; fishEach <= 12; fishEach++) {
    for (const array of [false, true]) {
      rerender(<FeedingGroups sharks={sharks} fishEach={fishEach} array={array} />);
      expect(container.querySelectorAll(".feeding-shark")).toHaveLength(sharks);
      expect(container.querySelectorAll(".feeding-fish")).toHaveLength(sharks * fishEach);
      for (const group of container.querySelectorAll(".feeding-group")) expect(group.querySelectorAll(".feeding-fish")).toHaveLength(fishEach);
      const graphic = container.querySelector('[role="img"]')!;
      expect(graphic.getAttribute("aria-label")).toContain(`${sharks} cartoon sharks, each with ${fishEach} fish`);
      expect(graphic.getAttribute("tabindex")).toBe(array ? "0" : null);
    }
  }
}, 20_000);
