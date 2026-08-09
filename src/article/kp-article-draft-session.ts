import {
  createKpArticleLanguageService,
  type KpArticleLanguageService,
  type KpArticleSemanticCompletion
} from "./kp-article-language-service.ts";
import type { KpArticleDiagnostic } from "./kp-article-validation.ts";

export interface KpArticleDraftSaveRequest {
  readonly sourceId: string;
  readonly text: string;
  readonly revision: number;
}

export interface KpArticleDraftSaveResult {
  readonly sourcePath: string;
  readonly changed: boolean;
}

export interface KpArticleDraftSnapshot {
  readonly sourceId: string;
  readonly draftText: string;
  readonly persistedText: string;
  /** The most recent valid document; renderers never receive invalid drafts. */
  readonly previewText: string;
  readonly draftRevision: number;
  readonly previewRevision: number;
  readonly persistedRevision: number;
  readonly dirty: boolean;
  readonly validity: "valid" | "invalid";
  readonly saveStatus: "idle" | "saving" | "saved" | "error";
  readonly open: boolean;
  readonly message: string;
  readonly diagnostics: readonly KpArticleDiagnostic[];
}

export interface KpArticleDraftCommandResult {
  readonly command: "w" | "wq" | "q" | "q!";
  readonly accepted: boolean;
  readonly saved: boolean;
  readonly closed: boolean;
  readonly snapshot: KpArticleDraftSnapshot;
}

export interface KpArticleDraftSessionOptions {
  readonly sourceId: string;
  readonly persistedText: string;
  readonly draftText?: string | undefined;
  readonly semantic?: readonly KpArticleSemanticCompletion[] | undefined;
  readonly save: (
    request: KpArticleDraftSaveRequest
  ) => Promise<KpArticleDraftSaveResult>;
  readonly onSnapshot?: ((snapshot: KpArticleDraftSnapshot) => void) | undefined;
}

/**
 * Owns transactional editor state without knowing CodeMirror, Svelte, or a
 * renderer. Invalid drafts remain editable while preview authority stays on
 * the last valid document, and only explicit writes cross the persistence seam.
 */
export class KpArticleDraftSession {
  private readonly semantic: readonly KpArticleSemanticCompletion[];
  private readonly saveSource: KpArticleDraftSessionOptions["save"];
  private readonly onSnapshot: KpArticleDraftSessionOptions["onSnapshot"];
  private snapshotValue: KpArticleDraftSnapshot;
  private serviceValue: KpArticleLanguageService;
  private savePromise: Promise<KpArticleDraftCommandResult> | undefined;

  constructor(options: KpArticleDraftSessionOptions) {
    this.semantic = Object.freeze([...(options.semantic ?? [])]);
    this.saveSource = options.save;
    this.onSnapshot = options.onSnapshot;
    const persisted = this.analyze(options.sourceId, options.persistedText);
    if (persisted.diagnostics.length > 0) {
      throw new Error("A KP article draft session requires valid persisted source.");
    }
    const draftText = options.draftText ?? options.persistedText;
    const draft = this.analyze(options.sourceId, draftText);
    this.serviceValue = draft;
    const valid = draft.diagnostics.length === 0;
    this.snapshotValue = freezeSnapshot({
      sourceId: options.sourceId,
      draftText,
      persistedText: options.persistedText,
      previewText: valid ? draftText : options.persistedText,
      draftRevision: 0,
      previewRevision: 0,
      persistedRevision: 0,
      dirty: draftText !== options.persistedText,
      validity: valid ? "valid" : "invalid",
      saveStatus: "idle",
      open: true,
      message: valid ? "Article source is valid." : diagnosticMessage(draft.diagnostics),
      diagnostics: draft.diagnostics
    });
  }

  get snapshot(): KpArticleDraftSnapshot {
    return this.snapshotValue;
  }

  get languageService(): KpArticleLanguageService {
    return this.serviceValue;
  }

  update(text: string): KpArticleDraftSnapshot {
    this.assertOpen();
    const service = this.analyze(this.snapshotValue.sourceId, text);
    const valid = service.diagnostics.length === 0;
    const revision = this.snapshotValue.draftRevision + 1;
    this.serviceValue = service;
    this.setSnapshot({
      ...this.snapshotValue,
      draftText: text,
      draftRevision: revision,
      ...(valid ? { previewText: text, previewRevision: revision } : {}),
      dirty: text !== this.snapshotValue.persistedText,
      validity: valid ? "valid" : "invalid",
      saveStatus: "idle",
      message: valid ? "Article source is valid." : diagnosticMessage(service.diagnostics),
      diagnostics: service.diagnostics
    });
    return this.snapshotValue;
  }

  async execute(commandText: string): Promise<KpArticleDraftCommandResult> {
    const command = parseCommand(commandText);
    switch (command) {
      case "q":
        return this.quit(false);
      case "q!":
        return this.quit(true);
      case "w":
        return this.write(false);
      case "wq":
        return this.write(true);
    }
  }

  private quit(force: boolean): KpArticleDraftCommandResult {
    this.assertOpen();
    if (this.snapshotValue.dirty && !force) {
      this.setSnapshot({
        ...this.snapshotValue,
        message: "No write since last change (add ! to override)."
      });
      return result("q", false, false, false, this.snapshotValue);
    }
    if (force && this.snapshotValue.dirty) {
      this.serviceValue = this.analyze(
        this.snapshotValue.sourceId,
        this.snapshotValue.persistedText
      );
      this.setSnapshot({
        ...this.snapshotValue,
        draftText: this.snapshotValue.persistedText,
        previewText: this.snapshotValue.persistedText,
        draftRevision: this.snapshotValue.draftRevision + 1,
        previewRevision: this.snapshotValue.persistedRevision,
        dirty: false,
        validity: "valid",
        saveStatus: "idle",
        open: false,
        message: "Discarded changes.",
        diagnostics: Object.freeze([])
      });
    } else {
      this.setSnapshot({
        ...this.snapshotValue,
        open: false,
        message: "Editor closed."
      });
    }
    return result(force ? "q!" : "q", true, false, true, this.snapshotValue);
  }

  private async write(closeAfterSave: boolean): Promise<KpArticleDraftCommandResult> {
    this.assertOpen();
    const command = closeAfterSave ? "wq" : "w";
    if (this.snapshotValue.validity !== "valid") {
      this.setSnapshot({
        ...this.snapshotValue,
        saveStatus: "error",
        message: "Repair the KP article before saving."
      });
      return result(command, false, false, false, this.snapshotValue);
    }
    if (this.savePromise !== undefined) return this.savePromise;

    const submittedText = this.snapshotValue.draftText;
    const submittedRevision = this.snapshotValue.draftRevision;
    this.setSnapshot({
      ...this.snapshotValue,
      saveStatus: "saving",
      message: "Saving article source…"
    });
    this.savePromise = this.saveSource({
      sourceId: this.snapshotValue.sourceId,
      text: submittedText,
      revision: submittedRevision
    }).then((saved) => {
      const current = this.snapshotValue;
      const noNewerDraft = current.draftRevision === submittedRevision &&
        current.draftText === submittedText;
      this.setSnapshot({
        ...current,
        persistedText: submittedText,
        persistedRevision: submittedRevision,
        dirty: current.draftText !== submittedText,
        saveStatus: "saved",
        open: closeAfterSave && noNewerDraft ? false : current.open,
        message: saved.changed
          ? `Saved to ${saved.sourcePath}.`
          : `${saved.sourcePath} already matches this buffer.`
      });
      return result(
        command,
        true,
        true,
        closeAfterSave && noNewerDraft,
        this.snapshotValue
      );
    }).catch((error: unknown) => {
      this.setSnapshot({
        ...this.snapshotValue,
        saveStatus: "error",
        message: error instanceof Error
          ? error.message
          : "The article source could not be saved."
      });
      return result(command, false, false, false, this.snapshotValue);
    }).finally(() => {
      this.savePromise = undefined;
    });
    return this.savePromise;
  }

  private analyze(sourceId: string, text: string): KpArticleLanguageService {
    return createKpArticleLanguageService({
      sourceId,
      text,
      semantic: this.semantic
    });
  }

  private assertOpen(): void {
    if (!this.snapshotValue.open) throw new Error("KP article editor is closed.");
  }

  private setSnapshot(snapshot: KpArticleDraftSnapshot): void {
    this.snapshotValue = freezeSnapshot(snapshot);
    this.onSnapshot?.(this.snapshotValue);
  }
}

function parseCommand(commandText: string): "w" | "wq" | "q" | "q!" {
  const command = commandText.trim().replace(/^:/u, "");
  if (command === "w" || command === "wq" || command === "q" || command === "q!") {
    return command;
  }
  throw new Error(`Unsupported KP article editor command: ${commandText}.`);
}

function diagnosticMessage(diagnostics: readonly KpArticleDiagnostic[]): string {
  const diagnostic = diagnostics[0];
  return diagnostic === undefined
    ? "The KP article is invalid."
    : `L${diagnostic.span.start.line}:${diagnostic.span.start.column} ${diagnostic.message}`;
}

function freezeSnapshot(
  snapshot: KpArticleDraftSnapshot
): KpArticleDraftSnapshot {
  return Object.freeze({
    ...snapshot,
    diagnostics: Object.freeze([...snapshot.diagnostics])
  });
}

function result(
  command: KpArticleDraftCommandResult["command"],
  accepted: boolean,
  saved: boolean,
  closed: boolean,
  snapshot: KpArticleDraftSnapshot
): KpArticleDraftCommandResult {
  return Object.freeze({ command, accepted, saved, closed, snapshot });
}
