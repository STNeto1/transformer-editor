import type { Edge } from "@xyflow/react";
import type { AppNode } from "../types/flow";

export function useEdgeRowCountFromEdge(
  incoming: Edge | null | undefined,
  nodes: AppNode[],
  edges: Edge[],
): { rowCount: number | null; loading: boolean } {
  void incoming;
  void nodes;
  void edges;
  return { rowCount: null, loading: false };
}
