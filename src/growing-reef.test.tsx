import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GrowingReef, reefGrowth, reefRandom } from "./growing-reef";

describe("growing ecosystems", () => {
  it("starts fresh, keeps a completed reef visible and grows more reefs without limiting the daily total", () => {
    expect(reefGrowth(0)).toEqual({ reef: 1, friends: 0 });
    expect(reefGrowth(1)).toEqual({ reef: 1, friends: 1 });
    expect(reefGrowth(12)).toEqual({ reef: 1, friends: 12 });
    expect(reefGrowth(13)).toEqual({ reef: 2, friends: 1 });
    expect(reefGrowth(1200)).toEqual({ reef: 100, friends: 12 });
  });
  it("randomizes by local day, explorer, activity and reef, not render or reload", () => {
    const sequence = (seed: string, activity: "reef" | "feeding", reef = 1) => {
      const random = reefRandom(seed, activity, reef);
      return Array.from({ length: 12 }, () => random());
    };
    const first = sequence("explorer:2026-10-20", "reef");
    expect(sequence("explorer:2026-10-20", "reef")).toEqual(first);
    expect(sequence("explorer:2026-10-21", "reef")).not.toEqual(first);
    expect(sequence("other:2026-10-20", "reef")).not.toEqual(first);
    expect(sequence("explorer:2026-10-20", "feeding")).not.toEqual(first);
    expect(sequence("explorer:2026-10-20", "reef", 2)).not.toEqual(first);
  });
  it("adds exactly one stable resident per puzzle and bounds the scene size", () => {
    let previous: string[] = [];
    for (let solved = 0; solved <= 12; solved++) {
      const { container, unmount } = render(<GrowingReef seed="2026-10-20" activity="reef" solved={solved} />);
      const residents = [...container.querySelectorAll("[data-resident]")].map((el) => el.getAttribute("data-resident")!);
      expect(residents).toHaveLength(solved);
      expect(residents.slice(0, previous.length)).toEqual(previous);
      previous = residents;
      unmount();
    }
    const props = { seed: "2026-10-20", activity: "reef", solved: 1200 } as const;
    const markup = renderToStaticMarkup(<GrowingReef {...props} />);
    expect(renderToStaticMarkup(<GrowingReef {...props} />)).toBe(markup);
    expect(renderToStaticMarkup(<GrowingReef {...props} seed="2026-10-21" />)).not.toBe(markup);
    expect((markup.match(/data-resident=/g) ?? []).length).toBe(12);
  });
  it("labels the illustration and offers a simple motion pause", () => {
    render(<GrowingReef seed="2026-10-20" activity="feeding" solved={12} />);
    expect(screen.getByRole("figure")).toHaveAccessibleName(/Feeding Time: 12 puzzles solved today/);
    expect(screen.getByRole("img")).toHaveAccessibleName(/Illustrated growing reef/);
    fireEvent.click(screen.getByRole("button", { name: "Pause reef motion" }));
    expect(screen.getByRole("button", { name: "Resume reef motion" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("figure")).toHaveClass("reef-still");
  });
});
