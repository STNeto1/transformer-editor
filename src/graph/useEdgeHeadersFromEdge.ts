import type { Edge } from "@xyflow/react";
import { useMemo } from "react";
import type { AppNode } from "../types/flow";
import { tryHeadersForIncomingEdge } from "./edgeHeaders";

export function useEdgeHeadersFromEdge(
  incoming: Edge | null | undefined,
  nodes: AppNode[],
  edges: Edge[],
): { headers: string[]; loading: boolean } {
  const headers = useMemo(() => {
    if (incoming == null) return [];
    return tryHeadersForIncomingEdge(incoming, nodes, edges) ?? [];
  }, [incoming, nodes, edges]);

  return { headers, loading: false };
}
