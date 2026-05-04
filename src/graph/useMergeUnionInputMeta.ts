import type { Edge } from "@xyflow/react";
import { useMemo } from "react";
import type { AppNode } from "../types/flow";
import { tryHeadersForIncomingEdge } from "./edgeHeaders";

export type MergeInputMeta = {
  edgeId: string;
  sourceId: string;
  headers: string[];
  rowCount: number | null;
  resolved: boolean;
};

export function useMergeUnionInputMeta(
  incoming: Edge[],
  nodes: AppNode[],
  edges: Edge[],
): { inputs: MergeInputMeta[]; loading: boolean } {
  const inputs = useMemo(
    () =>
      incoming.map((edge) => {
        const headers = tryHeadersForIncomingEdge(edge, nodes, edges) ?? [];
        return {
          edgeId: edge.id,
          sourceId: edge.source,
          headers,
          rowCount: null,
          resolved: headers.length > 0,
        };
      }),
    [incoming, nodes, edges],
  );

  return { inputs, loading: false };
}
