import type { CsvPayload } from "../types/flow";
import { parseCsvText, parseJsonArrayToCsvPayload } from "../httpFetch/runHttpFetch";
import { iterateCsvRowsFromFile, iterateNdjsonRowsFromUint8Stream } from "../httpFetch/streamRows";
import type { DatasetFormat, DatasetId, DatasetMeta, DatasetScanOptions } from "./types";

export type { DatasetFormat, DatasetId, DatasetMeta, DatasetScanOptions };

const DB_NAME = "etl-ui-datasets";
const DB_VERSION = 1;
const STORE = "datasets";
const SAMPLE_ROWS = 50;

type StoredDataset = {
  id: DatasetId;
  meta: DatasetMeta;
  rows: Record<string, string>[];
};

function newId(): DatasetId {
  return crypto.randomUUID();
}

function normalizeRow(headers: string[], sparse: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of headers) out[h] = sparse[h] ?? "";
  return out;
}

function mergeHeaderOrder(existing: string[], row: Record<string, string>): void {
  const seen = new Set(existing);
  for (const key of Object.keys(row)) {
    if (!seen.has(key)) {
      seen.add(key);
      existing.push(key);
    }
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

async function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return null;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("open dataset db failed"));
  });
}

async function readById(id: DatasetId): Promise<StoredDataset | null> {
  const db = await openDb();
  if (db == null) return null;
  const tx = db.transaction(STORE, "readonly");
  const raw = await requestToPromise(tx.objectStore(STORE).get(id));
  await transactionDone(tx);
  db.close();
  if (raw == null || typeof raw !== "object") return null;
  return raw as StoredDataset;
}

async function persist(row: StoredDataset): Promise<void> {
  const db = await openDb();
  if (db == null) throw new Error("IndexedDB unavailable");
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(row);
  await transactionDone(tx);
  db.close();
}

function estimatePayloadBytes(payload: CsvPayload): number {
  const enc = new TextEncoder();
  let n = 0;
  for (const row of payload.rows) n += enc.encode(`${JSON.stringify(row)}\n`).byteLength;
  return n;
}

function buildStoredDataset(
  format: DatasetFormat,
  headers: string[],
  rows: Record<string, string>[],
  bytes: number,
): StoredDataset {
  const normalizedRows = rows.map((row) => normalizeRow(headers, row));
  const id = newId();
  return {
    id,
    rows: normalizedRows,
    meta: {
      id,
      headers,
      rowCount: normalizedRows.length,
      sample: normalizedRows.slice(0, SAMPLE_ROWS),
      bytes,
      format,
      createdAt: Date.now(),
    },
  };
}

export interface DatasetStore {
  putCsv(input: ReadableStream<Uint8Array> | File): Promise<DatasetMeta>;
  putJson(input: ReadableStream<Uint8Array> | File, jsonArrayPath: string): Promise<DatasetMeta>;
  putNdjson(input: ReadableStream<Uint8Array> | File): Promise<DatasetMeta>;
  putNormalizedPayload(
    payload: CsvPayload,
    format: DatasetFormat,
    bytesHint?: number,
  ): Promise<DatasetMeta>;
  meta(id: DatasetId): Promise<DatasetMeta | null>;
  scan(id: DatasetId, opts?: DatasetScanOptions): AsyncIterable<Record<string, string>>;
  delete(id: DatasetId): Promise<void>;
  list(): Promise<DatasetMeta[]>;
}

export function createDatasetStore(): DatasetStore {
  return {
    async putCsv(input) {
      if (input instanceof File) {
        const headersAcc: string[] = [];
        const rows: Record<string, string>[] = [];
        for await (const row of iterateCsvRowsFromFile(input, (headers) => {
          headersAcc.length = 0;
          headersAcc.push(...headers);
        })) {
          rows.push(normalizeRow(headersAcc, row));
        }
        const stored = buildStoredDataset("csv", headersAcc, rows, input.size ?? 0);
        await persist(stored);
        return stored.meta;
      }

      const decoder = new TextDecoder();
      const reader = input.getReader();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      const parsed = parseCsvText(text);
      if ("error" in parsed) throw new Error(parsed.error);
      const stored = buildStoredDataset(
        "csv",
        parsed.csv.headers,
        parsed.csv.rows,
        new TextEncoder().encode(text).byteLength,
      );
      await persist(stored);
      return stored.meta;
    },

    async putJson(input, jsonArrayPath) {
      const text = input instanceof File ? await input.text() : await new Response(input).text();
      const parsed = parseJsonArrayToCsvPayload(text, jsonArrayPath);
      if ("error" in parsed) throw new Error(parsed.error);
      const bytes =
        input instanceof File ? (input.size ?? 0) : new TextEncoder().encode(text).byteLength;
      const stored = buildStoredDataset("json", parsed.csv.headers, parsed.csv.rows, bytes);
      await persist(stored);
      return stored.meta;
    },

    async putNdjson(input) {
      const headersAcc: string[] = [];
      const rows: Record<string, string>[] = [];
      const stream = input instanceof File ? input.stream() : input;
      for await (const row of iterateNdjsonRowsFromUint8Stream(stream)) {
        mergeHeaderOrder(headersAcc, row);
        rows.push({ ...row });
      }
      const normalized = rows.map((row) => normalizeRow(headersAcc, row));
      const bytes =
        input instanceof File
          ? (input.size ?? 0)
          : estimatePayloadBytes({ headers: headersAcc, rows: normalized });
      const stored = buildStoredDataset("ndjson", headersAcc, normalized, bytes);
      await persist(stored);
      return stored.meta;
    },

    async putNormalizedPayload(payload, format, bytesHint = 0) {
      const stored = buildStoredDataset(
        format,
        [...payload.headers],
        payload.rows,
        Math.max(bytesHint, estimatePayloadBytes(payload)),
      );
      await persist(stored);
      return stored.meta;
    },

    async meta(id) {
      const row = await readById(id);
      return row?.meta ?? null;
    },

    async *scan(id, opts) {
      const row = await readById(id);
      if (row == null) return;
      const offset = Math.max(0, opts?.offset ?? 0);
      const limit = opts?.limit == null ? Number.POSITIVE_INFINITY : Math.max(0, opts.limit);
      const end = Math.min(row.rows.length, offset + limit);
      for (let i = offset; i < end; i++) {
        yield { ...row.rows[i]! };
      }
    },

    async delete(id) {
      const db = await openDb();
      if (db == null) return;
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      await transactionDone(tx);
      db.close();
    },

    async list() {
      const db = await openDb();
      if (db == null) return [];
      const tx = db.transaction(STORE, "readonly");
      const all = await requestToPromise(tx.objectStore(STORE).getAll());
      await transactionDone(tx);
      db.close();
      if (!Array.isArray(all)) return [];
      return (all as StoredDataset[])
        .map((r) => r.meta)
        .filter((m): m is DatasetMeta => m != null)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
  };
}
