import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { BIOTOPES, GrowingReef, reefGrowth, reefRandom } from "./growing-reef";

describe("growing ecosystems", () => {
  afterEach(cleanup);
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
  it("labels the biotope without extra motion controls", () => {
    render(<GrowingReef seed="2026-10-20" activity="feeding" solved={12} />);
    expect(screen.getByRole("figure")).toHaveAccessibleName(/Feeding Time: 12 puzzles solved today/);
    expect(screen.getByRole("img")).toHaveAccessibleName(/Illustrated seagrass meadow/);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("uses distinct plants, scenery and visitors for each ocean biotope", () => {
    const scenes = (["reef", "feeding", "dive"] as const).map((activity) => {
      const { container, unmount } = render(<GrowingReef seed="same-day" activity={activity} solved={12} />);
      expect(screen.getByRole("img")).toHaveAccessibleName(new RegExp(BIOTOPES[activity].name, "i"));
      expect(screen.getByText(BIOTOPES[activity].name)).toBeInTheDocument();
      expect(container.querySelectorAll("[data-resident]")).toHaveLength(12);
      const flora = { reef: "coral", feeding: "seagrass", dive: "kelp" }[activity];
      expect(container.querySelectorAll(`.habitat-${flora}`).length).toBeGreaterThan(3);
      for (const other of ["coral", "seagrass", "kelp"].filter((kind) => kind !== flora)) {
        expect(container.querySelector(`.habitat-${other}`)).toBeNull();
      }
      expect(container.querySelector(".habitat-turtle") !== null).toBe(activity === "feeding");
      expect(container.querySelector(".habitat-jellyfish") !== null).toBe(activity === "dive");
      const markup = container.innerHTML;
      unmount();
      return markup;
    });
    expect(new Set(scenes).size).toBe(3);
  });
});
