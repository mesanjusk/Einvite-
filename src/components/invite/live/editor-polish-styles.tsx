export function EditorPolishStyles() {
  return (
    <style>{`
      .guided-editor-shell {
        min-height: 100svh;
        background:
          radial-gradient(circle at 50% -10%, rgba(218,185,125,.12), transparent 34%),
          #f8f3ed;
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.top-0 {
        top: 10px !important;
        padding: 0 12px !important;
        pointer-events: none;
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.top-0 > div[class*="max-w-[430px]"] {
        width: min(100%, 398px) !important;
        height: 44px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(117,73,57,.13) !important;
        background: rgba(255,253,249,.88) !important;
        box-shadow: 0 10px 30px rgba(67,35,42,.10) !important;
        backdrop-filter: blur(18px) saturate(150%);
        padding: 0 7px 0 13px !important;
        pointer-events: auto;
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.top-0 > div > div:first-child > p:last-child {
        display: none;
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.top-0 button {
        height: 32px !important;
        min-width: 32px !important;
        border-radius: 999px !important;
      }

      .guided-editor-shell .inv-editable {
        padding: 0 2px;
        margin: 0;
        border-radius: 3px;
        background: transparent;
        box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--inv-accent) 45%, transparent);
        transition: background .18s ease, box-shadow .18s ease;
      }

      .guided-editor-shell .inv-editable:hover,
      .guided-editor-shell .inv-editable:focus-visible,
      .guided-editor-shell .inv-editable[data-editing="true"] {
        background: color-mix(in srgb, var(--inv-background) 76%, white 24%);
        box-shadow: inset 0 -2px 0 var(--inv-accent);
      }

      .guided-editor-shell .inv-edit-chip {
        border-style: solid;
        border-color: color-mix(in srgb, var(--inv-accent) 28%, transparent);
        background: color-mix(in srgb, var(--inv-background) 90%, white 10%);
        box-shadow: 0 6px 18px rgba(52,28,35,.07);
        letter-spacing: .06em;
        text-transform: none;
        font-weight: 650;
      }

      /* Preview mode: collapse the large "Make it yours" card into one FAB. */
      .guided-editor-shell .no-print.fixed.inset-x-0.bottom-0 > div[class*="max-w-[390px]"] {
        position: fixed !important;
        right: max(16px, calc((100vw - 430px) / 2 + 16px));
        bottom: 18px;
        width: 54px !important;
        height: 54px !important;
        padding: 0 !important;
        gap: 0 !important;
        border: 0 !important;
        border-radius: 999px !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.bottom-0 > div[class*="max-w-[390px]"] > span,
      .guided-editor-shell .no-print.fixed.inset-x-0.bottom-0 > div[class*="max-w-[390px]"] > div {
        display: none !important;
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.bottom-0 > div[class*="max-w-[390px]"] > button {
        width: 54px !important;
        height: 54px !important;
        min-width: 54px !important;
        padding: 0 !important;
        border-radius: 999px !important;
        font-size: 0 !important;
        display: grid !important;
        place-items: center !important;
        background: linear-gradient(145deg,#72233a,#531528) !important;
        border: 1px solid rgba(255,255,255,.18) !important;
        box-shadow: 0 12px 28px rgba(76,22,39,.28), inset 0 1px 0 rgba(255,255,255,.18) !important;
        transition: transform .18s ease, box-shadow .18s ease !important;
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.bottom-0 > div[class*="max-w-[390px]"] > button:active {
        transform: scale(.94);
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.bottom-0 > div[class*="max-w-[390px]"] > button svg {
        width: 19px !important;
        height: 19px !important;
      }

      /* While editing, keep context but reduce the dock footprint. */
      .guided-editor-shell .no-print.fixed.inset-x-0.bottom-0 > div[class*="max-w-[410px]"] {
        width: min(calc(100% - 24px), 392px) !important;
        min-height: 56px;
        border-radius: 18px !important;
        padding: 8px 9px !important;
        gap: 9px !important;
        border-color: rgba(117,73,57,.16) !important;
        background: rgba(255,253,249,.92) !important;
        box-shadow: 0 12px 34px rgba(67,35,42,.13) !important;
        backdrop-filter: blur(18px) saturate(150%);
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.bottom-0 > div[class*="max-w-[410px]"] > span {
        width: 34px !important;
        height: 34px !important;
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.bottom-0 > div[class*="max-w-[410px]"] p:first-child {
        font-size: 8px !important;
        letter-spacing: .13em !important;
      }

      .guided-editor-shell .no-print.fixed.inset-x-0.bottom-0 > div[class*="max-w-[410px]"] p:last-child {
        font-size: 9px !important;
      }

      @media (max-width: 480px) {
        .guided-editor-shell .no-print.fixed.inset-x-0.top-0 > div[class*="max-w-[430px]"] {
          width: calc(100% - 8px) !important;
        }
      }
    `}</style>
  );
}
