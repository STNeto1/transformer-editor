import type { Edge } from "@xyflow/react";
import type { AppNode, CsvPayload } from "../types/flow";
import {
  collectRowSourceToPayload,
  countRowsInRowSource,
  rowSourceFromPayload,
  type RowSource,
} from "./rowSource";

type ResolveOpts = { limit?: number; signal?: AbortSignal; consumer?: string };

const EMPTY_PAYLOAD: CsvPayload = { headers: [], rows: [] };

function emptyRowSource(): RowSource {
  return rowSourceFromPayload(EMPTY_PAYLOAD);
}

export function __clearTabularGraphRunSessionCacheForTests(): void {
  // no-op: execution engine removed
}

/** Editor-only mode: returns an empty row source. */
export async function getTabularOutputAsync(
  nodeId: string,
  nodes: AppNode[],
  edges: Edge[],
  visited: Set<string> = new Set(),
  opts?: ResolveOpts,
): Promise<RowSource> {
  void nodeId;
  void nodes;
  void edges;
  void visited;
  void opts;
  return emptyRowSource();
}

/** Editor-only mode: returns an empty row source. */
export async function getTabularOutputForEdgeAsync(
  incomingEdge: Edge,
  nodes: AppNode[],
  edges: Edge[],
  visited: Set<string> = new Set(),
  opts?: ResolveOpts,
): Promise<RowSource> {
  void incomingEdge;
  void nodes;
  void edges;
  void visited;
  void opts;
  return emptyRowSource();
}

/** Editor-only mode: returns null payload. */
export async function getTabularPayloadForEdgeAsync(
  incomingEdge: Edge,
  nodes: AppNode[],
  edges: Edge[],
  visited: Set<string> = new Set(),
  opts?: ResolveOpts,
): Promise<CsvPayload | null> {
  void incomingEdge;
  void nodes;
  void edges;
  void visited;
  void opts;
  return null;
}

export const getRowSourceForEdgeAsync = getTabularOutputForEdgeAsync;

/** Editor-only mode: always empty preview. */
export async function getPreviewForEdgeAsync(
  incomingEdge: Edge,
  nodes: AppNode[],
  edges: Edge[],
  limit: number,
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  void incomingEdge;
  void nodes;
  void edges;
  void limit;
  return EMPTY_PAYLOAD;
}

/** Editor-only mode: always 0 rows. */
export async function getRowCountForEdgeAsync(
  incomingEdge: Edge,
  nodes: AppNode[],
  edges: Edge[],
): Promise<number | null> {
  void incomingEdge;
  void nodes;
  void edges;
  return 0;
}

/** Editor-only mode: no generated CSV output. */
export async function downloadCsvForEdgeAsync(
  incomingEdge: Edge,
  nodes: AppNode[],
  edges: Edge[],
): Promise<Blob | null> {
  void incomingEdge;
  void nodes;
  void edges;
  return null;
}

export { collectRowSourceToPayload, rowSourceFromPayload, type RowSource, countRowsInRowSource };
