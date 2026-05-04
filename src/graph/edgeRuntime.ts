import type { Edge } from "@xyflow/react";
import type { AppNode, CsvPayload } from "../types/flow";

const EMPTY_PAYLOAD: CsvPayload = { headers: [], rows: [] };

export async function getEdgePreviewAsync(
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

export async function getEdgeRowCountAsync(
  incomingEdge: Edge,
  nodes: AppNode[],
  edges: Edge[],
): Promise<number | null> {
  void incomingEdge;
  void nodes;
  void edges;
  return 0;
}

export async function getEdgePayloadAsync(
  incomingEdge: Edge,
  nodes: AppNode[],
  edges: Edge[],
): Promise<CsvPayload | null> {
  void incomingEdge;
  void nodes;
  void edges;
  return null;
}

export async function downloadEdgeCsvAsync(
  incomingEdge: Edge,
  nodes: AppNode[],
  edges: Edge[],
): Promise<Blob | null> {
  void incomingEdge;
  void nodes;
  void edges;
  return null;
}
