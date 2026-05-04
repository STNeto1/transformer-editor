import type { Edge } from "@xyflow/react";
import type { AppNode, CsvPayload } from "../types/flow";

export function useEdgePayloadFromEdge(
  incoming: Edge | null | undefined,
  nodes: AppNode[],
  edges: Edge[],
): { payload: CsvPayload | null; loading: boolean } {
  void incoming;
  void nodes;
  void edges;
  return { payload: null, loading: false };
}
