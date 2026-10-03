export interface FlowSaveResult {
  documentVersion: number;
  applied: boolean;
}

/** A document change is an echo only for the exact edit currently being applied. */
export class FlowDocumentWriter {
  private expectedChange?: { text: string; version: number };
  private writes: Promise<unknown> = Promise.resolve();

  constructor(private readonly document: {
    getText(): string;
    readonly version: number;
    apply(text: string): PromiseLike<boolean>;
  }) { }

  isOwnChange(text: string, version: number): boolean {
    const expected = this.expectedChange;
    this.expectedChange = undefined;
    return expected?.text === text && expected.version === version;
  }

  write(text: string, documentVersion?: number): Promise<FlowSaveResult> {
    const write = this.writes.then(async () => {
      if (documentVersion !== undefined && documentVersion !== this.document.version) {
        return { documentVersion: this.document.version, applied: false };
      }
      if (text === this.document.getText()) {
        return { documentVersion: this.document.version, applied: true };
      }

      const expected = { text, version: this.document.version + 1 };
      this.expectedChange = expected;
      try {
        if (!await this.document.apply(text)) {
          throw new Error("The flow document changed before the save could be applied.");
        }
        return { documentVersion: this.document.version, applied: true };
      } finally {
        if (this.expectedChange === expected) {
          this.expectedChange = undefined;
        }
      }
    });
    // A rejected save must not prevent a later edit from being saved.
    this.writes = write.catch(() => undefined);
    return write;
  }
}

/** Serialize visual saves and invalidate old snapshots when the document changes externally. */
export class WebviewFlowSaver<T> {
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private writes: Promise<unknown> = Promise.resolve();

  constructor(
    private documentVersion: number,
    private readonly save: (flow: T, documentVersion: number) => Promise<FlowSaveResult>,
    private readonly onError: (error: unknown) => void,
    private readonly delay = 500
  ) { }

  schedule(flow: T): void {
    this.cancelPending();
    const generation = this.generation;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      const write = this.writes.then(async () => {
        if (generation !== this.generation) { return; }
        const result = await this.save(flow, this.documentVersion);
        // An acknowledgement may arrive after a newer external update.
        this.documentVersion = Math.max(this.documentVersion, result.documentVersion);
        if (!result.applied && generation === this.generation) {
          this.generation++;
          this.cancelPending();
        }
      });
      this.writes = write.catch(this.onError);
    }, this.delay);
  }

  acceptExternalChange(documentVersion = this.documentVersion): boolean {
    if (documentVersion < this.documentVersion) { return false; }
    this.documentVersion = documentVersion;
    this.generation++;
    this.cancelPending();
    return true;
  }

  dispose(): void {
    this.generation++;
    this.cancelPending();
  }

  private cancelPending(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
