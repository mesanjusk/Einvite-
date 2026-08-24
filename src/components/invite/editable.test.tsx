import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EditableDate, EditableText } from "./editable";
import { InviteEditProvider, type InviteEditApi } from "./edit-context";

// The suite renders the same component with and without an editor around
// it, so each case has to start from an empty document.
afterEach(cleanup);

function editApi(overrides: Partial<InviteEditApi> = {}): InviteEditApi {
  return {
    active: true,
    setText: vi.fn(),
    setDate: vi.fn(),
    addEvent: vi.fn(),
    removeEvent: vi.fn(),
    openPanel: vi.fn(),
    pending: 0,
    ...overrides,
  };
}

function renderEditing(ui: React.ReactNode, api: InviteEditApi) {
  return render(<InviteEditProvider value={api}>{ui}</InviteEditProvider>);
}

describe("EditableText", () => {
  it("renders the guest's version — decoration and all — with no editor around it", () => {
    render(
      <EditableText
        target={{ kind: "invitation", field: "brideName" }}
        value="Aarti"
        placeholder="Bride's name"
      >
        <em data-testid="decorated">Aarti</em>
      </EditableText>,
    );

    expect(screen.getByTestId("decorated")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a placeholder for an empty field in the editor, and nothing to guests", () => {
    renderEditing(
      <EditableText
        target={{ kind: "invitation", field: "venueName" }}
        value=""
        placeholder="Where is it?"
      />,
      editApi(),
    );
    expect(screen.getByText("Where is it?")).toBeInTheDocument();
    cleanup();

    render(
      <EditableText
        target={{ kind: "invitation", field: "venueName" }}
        value=""
        placeholder="Where is it?"
      />,
    );
    expect(screen.queryByText("Where is it?")).not.toBeInTheDocument();
  });

  it("saves what was typed when the caret leaves the text", async () => {
    const api = editApi();
    renderEditing(
      <EditableText
        target={{ kind: "invitation", field: "brideName" }}
        value="Aarti"
        placeholder="Bride's name"
      />,
      api,
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit: Aarti" }));
    const box = screen.getByRole("textbox");
    box.textContent = "Aarti Deshmukh";
    await userEvent.tab();

    expect(api.setText).toHaveBeenCalledWith(
      { kind: "invitation", field: "brideName" },
      "Aarti Deshmukh",
    );
  });

  it("does not save when nothing changed", async () => {
    const api = editApi();
    renderEditing(
      <EditableText
        target={{ kind: "copy", field: "storyHeadline" }}
        value="Forever Us"
        placeholder="Name this photo section"
      />,
      api,
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit: Forever Us" }));
    await userEvent.tab();

    expect(api.setText).not.toHaveBeenCalled();
  });

  it("drops the edit on Escape", async () => {
    const api = editApi();
    renderEditing(
      <EditableText
        target={{ kind: "event", eventId: "e1", field: "name" }}
        value="Haldi"
        placeholder="Name this function"
      />,
      api,
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit: Haldi" }));
    const box = screen.getByRole("textbox");
    box.textContent = "Mehendi";
    await userEvent.keyboard("{Escape}");

    expect(api.setText).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Edit: Haldi" })).toBeInTheDocument();
  });

  it("stays plain text while previewing, so the editor can be turned off", () => {
    renderEditing(
      <EditableText
        target={{ kind: "invitation", field: "brideName" }}
        value="Aarti"
        placeholder="Bride's name"
      />,
      editApi({ active: false }),
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Aarti")).toBeInTheDocument();
  });
});

describe("EditableDate", () => {
  it("puts a date picker over the printed date and reports the pick", async () => {
    const api = editApi();
    renderEditing(
      <EditableDate
        target={{ kind: "invitation" }}
        value={new Date("2026-02-14T00:00:00.000Z")}
      >
        14 February 2026
      </EditableDate>,
      api,
    );

    const input = screen.getByLabelText("Change the date");
    expect(input).toHaveValue("2026-02-14");

    // A date input is driven by the OS picker, which lands as one change.
    fireEvent.change(input, { target: { value: "2026-03-21" } });

    expect(api.setDate).toHaveBeenCalledWith({ kind: "invitation" }, "2026-03-21");
  });

  it("is just the date for guests", () => {
    render(
      <EditableDate
        target={{ kind: "invitation" }}
        value={new Date("2026-02-14T00:00:00.000Z")}
      >
        14 February 2026
      </EditableDate>,
    );

    expect(screen.queryByLabelText("Change the date")).not.toBeInTheDocument();
    expect(screen.getByText("14 February 2026")).toBeInTheDocument();
  });
});
