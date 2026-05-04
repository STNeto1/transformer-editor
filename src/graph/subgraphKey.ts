import type { Edge } from "@xyflow/react";
import type { AppNode } from "../types/flow";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${parts.join(",")}}`;
}

function nodeFingerprint(node: AppNode): string {
  switch (node.type) {
    case "dataSource": {
      const d = node.data;
      return stableStringify({
        t: node.type,
        datasetId: d.datasetId ?? null,
        loadedAt: d.loadedAt ?? null,
        format: d.format ?? null,
        headers: d.headers ?? [],
        rowCount: d.rowCount ?? 0,
        sampleLen: Array.isArray(d.sample) ? d.sample.length : 0,
        error: d.error ?? null,
        csvInline: d.csv != null,
        httpUrl: d.httpUrl ?? "",
        httpMethod: d.httpMethod ?? "GET",
        httpBody: d.httpBody ?? "",
        httpJsonArrayPath: d.httpJsonArrayPath ?? "",
        httpParams: d.httpParams ?? [],
        httpHeaders: d.httpHeaders ?? [],
        httpAutoRefreshPaused: Boolean(d.httpAutoRefreshPaused),
        httpAutoRefreshSec: d.httpAutoRefreshSec ?? 0,
        httpTimeoutMs: d.httpTimeoutMs ?? 60_000,
        httpMaxRetries: d.httpMaxRetries ?? 1,
        httpColumnRenames: d.httpColumnRenames ?? [],
        httpLastDiagnostics: d.httpLastDiagnostics ?? null,
      });
    }
    default:
      return `${node.type}:${stableStringify(node.data)}`;
  }
}

function edgeKey(e: Edge): string {
  return [e.id, e.source, e.target, e.sourceHandle ?? "", e.targetHandle ?? ""].join("::");
}

export function collectUpstreamNodeIds(seedId: string, edges: Edge[]): string[] {
  const reachable = new Set<string>();
  const stack = [seedId];
  reachable.add(seedId);
  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const e of edges) {
      if (e.target !== cur) continue;
      const pred = e.source;
      if (!reachable.has(pred)) {
        reachable.add(pred);
        stack.push(pred);
      }
    }
  }
  return [...reachable].sort();
}

export function upstreamSubgraphKey(seedSourceId: string, edges: Edge[], nodes: AppNode[]): string {
  const ids = collectUpstreamNodeIds(seedSourceId, edges);
  const idSet = new Set(ids);
  const upstreamEdges = edges
    .filter((e) => idSet.has(e.source) && idSet.has(e.target))
    .map((e) => edgeKey(e))
    .sort();
  const fingerprints = ids.map((nodeId) => {
    const n = nodes.find((x) => x.id === nodeId);
    return n != null ? nodeFingerprint(n) : `missing:${nodeId}`;
  });
  return `${ids.join(">")}#nodes:${fingerprints.join("|")}#edges:${upstreamEdges.join("|")}`;
}

export function visualizationSubgraphKey(
  vizTargetId: string,
  edges: Edge[],
  nodes: AppNode[],
): string {
  const incoming = edges.find((e) => e.target === vizTargetId);
  if (incoming == null) return `${vizTargetId}|no-inc`;
  const subgraphKey = upstreamSubgraphKey(incoming.source, edges, nodes);
  return `${vizTargetId}|in:${edgeKey(incoming)}|seed:${incoming.source}|${subgraphKey}`;
}
