import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { GrowingReef, NewFriend } from "./growing-reef";
import { BIOTOPES, oceanFriend } from "./ocean-friends";

afterEach(cleanup);
describe("bonus aquariums", () => {
  it.each(["reef", "feeding", "dive"] as const)("starts %s with no animals, including no decorative living coral", (activity) => {
    const { container } = render(<GrowingReef seed="today" activity={activity} friends={0} />);
    expect(container.querySelectorAll("[data-resident], [data-animal]")).toHaveLength(0);
    expect(screen.getByText("It's quiet in here...")).toBeVisible();
    expect(screen.getByText(/Solve a full set/)).toBeVisible();
    expect(screen.getByRole("figure")).toHaveAccessibleName(/0 bonus friends today/);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it.each(["reef", "feeding", "dive"] as const)("has a varied habitat-specific animal cycle in %s", (activity) => {
    const friends = Array.from({ length: BIOTOPES[activity].animals.length }, (_, index) => oceanFriend("day", activity, index));
    expect(new Set(friends.map((friend) => friend.kind))).toEqual(new Set(BIOTOPES[activity].animals));
    expect(new Set(friends.map((friend) => friend.name)).size).toBeGreaterThan(5);
    const { container } = render(<GrowingReef seed="day" activity={activity} friends={friends.length} />);
    expect(container.querySelectorAll("[data-animal]")).toHaveLength(friends.length);
    for (const kind of BIOTOPES[activity].animals) expect(container.querySelector(`[data-animal="${kind}"]`)).not.toBeNull();
  });
  it("keeps all neighbours past twelve, with stable positions and an expanding scrollable aquarium", () => {
    const { container, rerender } = render(<GrowingReef seed="day" activity="reef" friends={12} />);
    const first = container.querySelector("[data-resident]")!.outerHTML;
    rerender(<GrowingReef seed="day" activity="reef" friends={73} />);
    expect(container.querySelectorAll("[data-resident]")).toHaveLength(73);
    expect(container.querySelector("[data-resident]")!.outerHTML).toBe(first);
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 330 844");
    expect(screen.getByText("73 bonus friends today")).toBeVisible();
    expect(screen.getByRole("region")).toHaveAttribute("tabindex", "0");
    rerender(<GrowingReef seed="day" activity="reef" friends={300} />);
    expect(container.querySelectorAll("[data-resident]")).toHaveLength(300);
  });
  it("is stable through rerenders/reloads and varies by day, activity and neighbour index", () => {
    const first = oceanFriend("day-1", "reef", 0);
    expect(oceanFriend("day-1", "reef", 0)).toEqual(first);
    expect(oceanFriend("day-2", "reef", 0)).not.toEqual(first);
    expect(oceanFriend("day-1", "feeding", 0)).not.toEqual(first);
    expect(oceanFriend("day-1", "reef", 1)).not.toEqual(first);
    const props = { seed: "day-1", activity: "reef", friends: 15 } as const;
    expect(renderToStaticMarkup(<GrowingReef {...props} />)).toBe(renderToStaticMarkup(<GrowingReef {...props} />));
  });
  it("celebrates the same named animal that appears in the aquarium", () => {
    const friend = oceanFriend("day", "feeding", 3);
    render(<NewFriend seed="day" activity="feeding" index={3} />);
    expect(screen.getByRole("heading", { name: `Meet ${friend.name}!` })).toBeVisible();
    expect(screen.getByRole("img")).toHaveAccessibleName(new RegExp(friend.name));
    expect(screen.getByText(/Your new neighbour is saved/)).toBeVisible();
  });
});
