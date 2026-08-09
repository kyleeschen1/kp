import {
  autocompletion,
  completionKeymap,
  type Completion,
  type CompletionContext
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  redo,
  undo
} from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState, Transaction } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  keymap,
  placeholder
} from "@codemirror/view";
import { getCM, Vim, vim } from "@replit/codemirror-vim";

interface KpEconomicsVimExHandlers {
  readonly quit: (force: boolean) => boolean;
  readonly write: () => Promise<boolean>;
}

const kpEconomicsVimExHandlers = new WeakMap<
  object,
  KpEconomicsVimExHandlers
>();

// Ex commands are registered globally by the CM5-compatible Vim API. Route
// them through the mounted CM instance so HMR and future editor callers cannot
// accidentally save or close a different buffer.
Vim.defineEx("quit", "q", (cm, params) => {
  kpEconomicsVimExHandlers.get(cm as object)?.quit(
    (params.argString ?? "").trim() === "!"
  );
});
Vim.defineEx("write", "w", (cm) => {
  const handlers = kpEconomicsVimExHandlers.get(cm as object);
  if (handlers !== undefined) void handlers.write();
});
Vim.defineEx("wq", "wq", (cm) => {
  const handlers = kpEconomicsVimExHandlers.get(cm as object);
  if (handlers === undefined) return;
  void handlers.write().then((written) => {
    if (written) handlers.quit(false);
  });
});

export interface KpEconomicsCodeMirrorCompletion {
  readonly label: string;
  readonly apply?: string | undefined;
  readonly detail: string;
  readonly info?: string | undefined;
  readonly contexts?: readonly (
    "kp-ref" | "kp-directive" | "semantic-id"
  )[] | undefined;
}

export interface KpEconomicsCodeMirrorMount {
  readonly destroy: () => void;
  readonly getValue: () => string;
  readonly replaceValue: (value: string) => void;
  readonly revealText: (text: string) => void;
  readonly redo: () => boolean;
  readonly setValue: (value: string) => void;
  readonly undo: () => boolean;
  readonly view: EditorView;
}

export function mountKpEconomicsCodeMirror(input: {
  readonly parent: HTMLElement;
  readonly value: string;
  readonly completions: readonly KpEconomicsCodeMirrorCompletion[];
  readonly onChange: (value: string) => void;
  readonly onQuit?: ((force: boolean) => boolean) | undefined;
  readonly onWrite?: (() => Promise<boolean>) | undefined;
  readonly onVimModeChange?: ((mode: string) => void) | undefined;
}): KpEconomicsCodeMirrorMount {
  let applyingExternalValue = false;
  const completions = (context: NonNullable<
    KpEconomicsCodeMirrorCompletion["contexts"]
  >[number]): readonly Completion[] => input.completions
    .filter((completion) => completion.contexts?.includes(context) ?? true)
    .map((completion) => ({
      label: completion.label,
      detail: completion.detail,
      ...(completion.apply === undefined ? {} : { apply: completion.apply }),
      ...(completion.info === undefined ? {} : { info: completion.info }),
      type: "variable"
    }));
  const completeSemanticReference = (context: CompletionContext) => {
    const reference = context.matchBefore(/[a-z0-9-]*/);
    const prefix = context.state.sliceDoc(
      Math.max(0, reference?.from ?? context.pos) - 7,
      reference?.from ?? context.pos
    );
    if (prefix !== "kp-ref:") return null;
    return {
      from: reference?.from ?? context.pos,
      options: completions("kp-ref"),
      validFor: /^[a-z0-9-]*$/
    };
  };
  const completeDirective = (context: CompletionContext) => {
    const directive = context.matchBefore(/<!-- kp:[a-z-]*/);
    if (directive === null) return null;
    const colon = directive.text.lastIndexOf(":");
    return {
      from: directive.from + colon + 1,
      options: completions("kp-directive"),
      validFor: /^[a-z-]*$/
    };
  };
  const completeSemanticId = (context: CompletionContext) => {
    const id = context.matchBefore(/[a-z0-9.-]*/);
    const before = context.state.sliceDoc(
      Math.max(0, (id?.from ?? context.pos) - 28),
      id?.from ?? context.pos
    );
    if (!context.explicit && !/"[A-Za-z]+Id"\s*:\s*"$/u.test(before)) {
      return null;
    }
    return {
      from: id?.from ?? context.pos,
      options: completions("semantic-id"),
      validFor: /^[a-z0-9.-]*$/
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
        autocompletion({
          override: [
            completeSemanticReference,
            completeDirective,
            completeSemanticId
          ]
        }),
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
            padding: "1.5rem 2rem"
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
      quit: input.onQuit ?? (() => true),
      write: input.onWrite ?? (async () => true)
    });
  }
  reportVimMode();
  return Object.freeze({
    view,
    getValue: () => view.state.doc.toString(),
    replaceValue: (value: string) => {
      const current = view.state.doc.toString();
      if (current === value) return;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
        annotations: Transaction.userEvent.of("input.kp-structure")
      });
    },
    revealText: (text: string) => {
      const position = view.state.doc.toString().indexOf(text);
      if (position < 0) return;
      view.dispatch({
        selection: { anchor: position },
        effects: EditorView.scrollIntoView(position, { y: "center" })
      });
    },
    undo: () => undo(view),
    redo: () => redo(view),
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
        changes: { from: 0, to: current.length, insert: value },
        annotations: Transaction.addToHistory.of(false)
      });
      applyingExternalValue = false;
    }
  });
}
