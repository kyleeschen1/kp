import type { AddressInfo } from "node:net";

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page
} from "playwright";
import { createServer, type ViteDevServer } from "vite";

export interface KpVisualBrowserProfile {
  readonly viewport?: { readonly width: number; readonly height: number };
  readonly colorScheme?: "light" | "dark" | "no-preference";
  readonly reducedMotion?: "reduce" | "no-preference";
  readonly forcedColors?: "active" | "none";
  readonly javaScriptEnabled?: boolean;
}

export interface KpVisualHarnessServer {
  readonly baseUrl: string;
  readonly close: () => Promise<void>;
}

export interface KpVisualHarnessAdapters {
  readonly startServer: () => Promise<KpVisualHarnessServer>;
  readonly launchBrowser: () => Promise<Browser>;
}

export interface KpVisualReviewHarnessOptions {
  readonly baseUrl?: string;
  readonly host?: string;
  readonly port?: number;
  readonly adapters?: KpVisualHarnessAdapters;
}

interface KpProfileSession {
  readonly context: BrowserContext;
  readonly page: Page;
}

/**
 * One harness owns one server and one browser for an entire review session.
 * Profile-keyed pages isolate accessibility modes without paying startup cost
 * again for every screenshot or checkpoint.
 */
export class KpVisualReviewHarness {
  readonly #adapters: KpVisualHarnessAdapters;
  readonly #sessions = new Map<string, KpProfileSession>();
  #server?: KpVisualHarnessServer;
  #browser?: Browser;
  #startPromise?: Promise<void>;
  #closed = false;

  constructor(adapters: KpVisualHarnessAdapters) {
    this.#adapters = adapters;
  }

  get baseUrl(): string {
    if (this.#server === undefined) throw new Error("Visual harness has not started");
    return this.#server.baseUrl;
  }

  async start(): Promise<void> {
    if (this.#closed) throw new Error("Visual harness is closed");
    this.#startPromise ??= this.#startOnce();
    await this.#startPromise;
  }

  async page(profile: KpVisualBrowserProfile = {}): Promise<Page> {
    await this.start();
    const key = profileKey(profile);
    const existing = this.#sessions.get(key);
    if (existing !== undefined) return existing.page;
    const context = await this.#browser!.newContext({
      ...profile,
      serviceWorkers: "block"
    });
    const page = await context.newPage();
    this.#sessions.set(key, { context, page });
    return page;
  }

  url(pathname: string): string {
    return new URL(pathname, this.baseUrl).toString();
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    this.#closed = true;
    await this.#startPromise?.catch(() => undefined);
    const sessions = [...this.#sessions.values()].reverse();
    this.#sessions.clear();
    for (const session of sessions) await session.context.close();
    await this.#browser?.close();
    await this.#server?.close();
  }

  async #startOnce(): Promise<void> {
    this.#server = await this.#adapters.startServer();
    try {
      this.#browser = await this.#adapters.launchBrowser();
    } catch (error) {
      await this.#server.close();
      throw error;
    }
  }
}

export function createKpVisualReviewHarness(
  options: KpVisualReviewHarnessOptions = {}
): KpVisualReviewHarness {
  return new KpVisualReviewHarness(options.adapters ?? defaultAdapters(options));
}

function defaultAdapters(options: KpVisualReviewHarnessOptions): KpVisualHarnessAdapters {
  return {
    startServer: options.baseUrl === undefined
      ? () => startViteServer(options.host ?? "127.0.0.1", options.port ?? 0)
      : () => attachServer(options.baseUrl!),
    launchBrowser: () => chromium.launch({ headless: true })
  };
}

async function startViteServer(host: string, port: number): Promise<KpVisualHarnessServer> {
  const vite = await createServer({
    logLevel: "error",
    server: { host, port, strictPort: port !== 0 }
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === "string") {
    await vite.close();
    throw new Error("Visual harness Vite server did not expose a TCP address");
  }
  return ownedViteServer(vite, host, address);
}

function ownedViteServer(
  vite: ViteDevServer,
  host: string,
  address: AddressInfo
): KpVisualHarnessServer {
  return {
    baseUrl: `http://${host}:${address.port}`,
    close: () => vite.close()
  };
}

async function attachServer(baseUrl: string): Promise<KpVisualHarnessServer> {
  const normalized = new URL(baseUrl).toString();
  const response = await fetch(normalized, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Visual harness server returned HTTP ${response.status}`);
  return { baseUrl: normalized, close: async () => undefined };
}

function profileKey(profile: KpVisualBrowserProfile): string {
  return JSON.stringify({
    viewport: profile.viewport ?? null,
    colorScheme: profile.colorScheme ?? null,
    reducedMotion: profile.reducedMotion ?? null,
    forcedColors: profile.forcedColors ?? null,
    javaScriptEnabled: profile.javaScriptEnabled ?? true
  });
}

