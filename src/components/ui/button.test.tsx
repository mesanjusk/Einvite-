import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "./button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Create invitation</Button>);
    expect(screen.getByRole("button", { name: "Create invitation" })).toBeInTheDocument();
  });

  it("fires onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Publish</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when the disabled prop is set and does not fire onClick", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Saving…
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the gold variant class", () => {
    render(<Button variant="gold">Upgrade</Button>);
    expect(screen.getByRole("button", { name: "Upgrade" }).className).toContain("bg-accent");
  });
});
