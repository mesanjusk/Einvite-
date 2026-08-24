"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  useInviteEdit,
  type EditDateTarget,
  type EditPanel,
  type EditTarget,
} from "./edit-context";

/**
 * Tap-to-edit text, on the invitation itself.
 *
 * On the public invitation this renders `children` (or the plain value) and
 * nothing else — no wrapper, no handlers. Inside the live editor the same
 * text gains an outline, and a tap turns it into a caret in place. Decorated
 * children (a shimmer gradient over a name, say) are deliberately dropped
 * while editing: a caret is invisible against `-webkit-text-fill-color:
 * transparent`, and someone typing their own name needs to see where they are.
 */
export function EditableText({
  target,
  value,
  placeholder,
  multiline = false,
  className,
  style,
  children,
}: {
  target: EditTarget;
  value: string;
  /** Shown in the editor when the field is still empty — never to guests. */
  placeholder: string;
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const edit = useInviteEdit();
  const [editing, setEditing] = useState(false);
  const nodeRef = useRef<HTMLSpanElement>(null);
  // Read through a ref so a re-render mid-typing (another field finishing its
  // save) can't reset the text under the caret.
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!editing) return;
    const node = nodeRef.current;
    if (!node) return;

    node.textContent = valueRef.current;
    node.focus();

    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [editing]);

  if (!edit?.active) return <>{children ?? value}</>;

  function commit() {
    const node = nodeRef.current;
    // innerText keeps the line breaks a multiline field was typed with;
    // textContent is the fallback where it isn't implemented. Either way
    // contentEditable leaves non-breaking spaces behind.
    const typed = node ? (node.innerText ?? node.textContent ?? "") : "";
    const next = typed.replace(/\u00a0/g, " ").trim();
    setEditing(false);
    if (next !== valueRef.current) edit?.setText(target, next);
  }

  if (editing) {
    return (
      <span
        ref={nodeRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        tabIndex={0}
        data-editing="true"
        className={cn("inv-editable", className)}
        style={style}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (!multiline || event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setEditing(false);
          }
        }}
        onPaste={(event) => {
          // Pasted rich text would carry another page's fonts and colours
          // onto the invitation; only the words are wanted.
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={value ? `Edit: ${value}` : placeholder}
      className={cn("inv-editable", className)}
      style={style}
      onClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setEditing(true);
        }
      }}
    >
      {value || <span className="inv-editable-empty">{placeholder}</span>}
    </span>
  );
}

/**
 * Tap-to-edit date. The display stays whatever the section already printed
 * ("14 February 2026", a scratch card, a countdown); the tap target over it
 * is a real date input, so phones open their own picker and there is no
 * date format to get wrong.
 */
export function EditableDate({
  target,
  value,
  className,
  children,
}: {
  target: EditDateTarget;
  /** The current date — the input opens on it. */
  value: Date;
  className?: string;
  children: ReactNode;
}) {
  const edit = useInviteEdit();
  if (!edit?.active) return <>{children}</>;

  return (
    <span className={cn("relative inline-block", className)}>
      {children}
      <input
        type="date"
        aria-label="Change the date"
        value={toDateInputValue(value)}
        onChange={(event) => {
          if (event.target.value) edit.setDate(target, event.target.value);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        style={{ colorScheme: "light" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg"
        style={{
          boxShadow:
            "inset 0 0 0 1px color-mix(in srgb, var(--inv-accent) 45%, transparent)",
        }}
      />
    </span>
  );
}

/** The small dashed pill a section shows for things that aren't text. */
export function EditChip({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  const edit = useInviteEdit();
  if (!edit?.active) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("inv-edit-chip no-print", className)}
    >
      {children}
    </button>
  );
}

/** Opens one of the editor's sheets from inside a section. */
export function EditPanelChip({
  panel,
  focusMediaId,
  children,
  className,
}: {
  panel: EditPanel;
  focusMediaId?: string;
  children: ReactNode;
  className?: string;
}) {
  const edit = useInviteEdit();
  if (!edit?.active) return null;

  return (
    <EditChip className={className} onClick={() => edit.openPanel(panel, focusMediaId)}>
      {children}
    </EditChip>
  );
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
