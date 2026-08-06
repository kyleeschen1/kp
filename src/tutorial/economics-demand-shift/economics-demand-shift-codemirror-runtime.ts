import {
  autocompletion,
  completionKeymap,
  type Completion,
  type CompletionContext
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap
} from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  keymap,
  placeholder
} from "@codemirror/view";
import { getCM, Vim, vim } from "@replit/codemirror-vim";

interface KpEconomicsVimExHandlers {
  readonly quit: () => void;
  readonly write: () => Promise<boolean>;
}

const kpEconomicsVimExHandlers = new WeakMap<
  object,
  KpEconomicsVimExHandlers
>();

// Ex commands are registered globally by the CM5-compatible Vim API. Route
// them through the mounted CM instance so HMR and future editor callers cannot
// accidentally save or close a different buffer.
Vim.defineEx("quit", "q", (cm) => {
  kpEconomicsVimExHandlers.get(cm as object)?.quit();
});
Vim.defineEx("write", "w", (cm) => {
  const handlers = kpEconomicsVimExHandlers.get(cm as object);
  if (handlers !== undefined) void handlers.write();
});
Vim.defineEx("wq", "wq", (cm) => {
  const handlers = kpEconomicsVimExHandlers.get(cm as object);
  if (handlers === undefined) return;
  void handlers.write().then((written) => {
    if (written) handlers.quit();
  });
});

export interface KpEconomicsCodeMirrorCompletion {
  readonly label: string;
  readonly apply?: string | undefined;
  readonly detail: string;
  readonly info?: string | undefined;
}

export interface KpEconomicsCodeMirrorMount {
  readonly destroy: () => void;
  readonly setValue: (value: string) => void;
  readonly view: EditorView;
}

export function mountKpEconomicsCodeMirror(input: {
  readonly parent: HTMLElement;
  readonly value: string;
  readonly completions: readonly KpEconomicsCodeMirrorCompletion[];
  readonly onChange: (value: string) => void;
  readonly onQuit?: (() => void) | undefined;
  readonly onWrite?: (() => Promise<boolean>) | undefined;
  readonly onVimModeChange?: ((mode: string) => void) | undefined;
}): KpEconomicsCodeMirrorMount {
  let applyingExternalValue = false;
  const completions: readonly Completion[] = input.completions.map(
    (completion) => ({
      label: completion.label,
      detail: completion.detail,
      ...(completion.apply === undefined ? {} : { apply: completion.apply }),
      ...(completion.info === undefined ? {} : { info: completion.info }),
      type: "variable"
    })
  );
  const completeSemanticReference = (context: CompletionContext) => {
    const reference = context.matchBefore(/[a-z0-9-]*/);
    const prefix = context.state.sliceDoc(
      Math.max(0, reference?.from ?? context.pos) - 7,
      reference?.from ?? context.pos
    );
    if (!context.explicit && prefix !== "kp-ref:") return null;
    return {
      from: reference?.from ?? context.pos,
      options: completions,
      validFor: /^[a-z0-9-]*$/
    };
  };
  const view = new EditorView({
    parent: input.parent,
    state: EditorState.create({
      doc: input.value,
      extensions: [
        // Vim must precede every other keymap so normal-mode commands retain
        // authority while the conventional bindings remain available in insert mode.
        vim(),
        drawSelection(),
        markdown(),
        history(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap
        ]),
        autocompletion({ override: [completeSemanticReference] }),
        placeholder("Write one instructional passage…"),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          "aria-label": "Lesson passage Markdown"
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || applyingExternalValue) return;
          input.onChange(update.state.doc.toString());
        }),
        EditorView.theme({
          "&": {
            backgroundColor: "transparent",
            color: "var(--kp-lesson-theme-ink)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "1rem"
          },
          ".cm-content": {
            caretColor: "var(--kp-lesson-theme-reader-rail)",
            lineHeight: "1.5",
            minHeight: "7.5rem",
            padding: "0.75rem"
          },
          ".cm-cursor, .cm-dropCursor": {
            borderLeftColor: "var(--kp-lesson-theme-reader-rail)"
          },
          ".cm-gutters": {
            backgroundColor: "transparent",
            border: "0",
            color: "var(--kp-lesson-theme-muted)"
          },
          ".cm-activeLine": {
            backgroundColor: "color-mix(in srgb, var(--kp-lesson-theme-reader-rail) 8%, transparent)"
          },
          ".cm-selectionBackground, ::selection": {
            backgroundColor: "color-mix(in srgb, var(--kp-lesson-theme-reader-rail) 24%, transparent) !important"
          },
          "&.cm-focused": { outline: "none" }
        })
      ]
    })
  });
  const cm = getCM(view);
  const reportVimMode = (event?: { mode?: string; subMode?: string }): void => {
    const mode = event?.mode ?? cm?.state.vim?.mode ?? "normal";
    const subMode = event?.subMode === "linewise"
      ? " line"
      : event?.subMode === "blockwise"
        ? " block"
        : "";
    input.onVimModeChange?.(`${mode}${subMode}`);
  };
  cm?.on("vim-mode-change", reportVimMode);
  if (cm !== null) {
    kpEconomicsVimExHandlers.set(cm as object, {
      quit: input.onQuit ?? (() => undefined),
      write: input.onWrite ?? (async () => true)
    });
  }
  reportVimMode();
  return Object.freeze({
    view,
    destroy: () => {
      cm?.off("vim-mode-change", reportVimMode);
      if (cm !== null) kpEconomicsVimExHandlers.delete(cm as object);
      view.destroy();
    },
    setValue: (value: string) => {
      const current = view.state.doc.toString();
      if (current === value) return;
      applyingExternalValue = true;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value }
      });
      applyingExternalValue = false;
    }
  });
}
