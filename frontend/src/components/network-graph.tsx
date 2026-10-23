"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useMemo } from "react";
import type { Graph } from "@/lib/api";
import { categoryColour } from "@/lib/format";

type SimNode = SimulationNodeDatum & { id: string; category: string; posts: number; r: number };
type SimLink = SimulationLinkDatum<SimNode> & { sim: number };
type Layout = { nodes: SimNode[]; links: { a: SimNode; b: SimNode; sim: number }[]; viewBox: string };

const LABELLED = 18;

// The layout is computed once, synchronously, so the graph renders still (and screenshots are stable).
function computeLayout(graph: Graph): Layout {
  const maxPosts = Math.max(...graph.nodes.map((n) => n.posts), 1);
  const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n, r: 2.5 + 7 * Math.sqrt(n.posts / maxPosts) }));
  const ids = new Set(nodes.map((n) => n.id));
  const links: SimLink[] = graph.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e) => ({ source: e.source, target: e.target, sim: e.sim }));

  forceSimulation(nodes)
    .force("link", forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(28).strength((l) => 0.2 + l.sim))
    .force("charge", forceManyBody<SimNode>().strength(-55))
    .force("collide", forceCollide<SimNode>((d) => d.r + 2))
    .force("x", forceX<SimNode>(0).strength(0.06))
    .force("y", forceY<SimNode>(0).strength(0.09))
    .stop()
    .tick(320);

  const xs = nodes.map((n) => n.x ?? 0);
  const ys = nodes.map((n) => n.y ?? 0);
  const pad = 40;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  return {
    nodes,
    links: links.map((l) => ({ a: l.source as SimNode, b: l.target as SimNode, sim: l.sim })),
    viewBox: `${minX} ${minY} ${Math.max(...xs) + pad - minX} ${Math.max(...ys) + pad - minY}`,
  };
}

type NetworkGraphProps = {
  graph: Graph;
  categoryOrder: readonly string[];
  selected: string | null;
  onSelect: (name: string) => void;
};

export function NetworkGraph({ graph, categoryOrder, selected, onSelect }: NetworkGraphProps) {
  const layout = useMemo(() => computeLayout(graph), [graph]);
  const labelled = useMemo(
    () => new Set([...layout.nodes].sort((a, b) => b.posts - a.posts).slice(0, LABELLED).map((n) => n.id)),
    [layout],
  );
  const adjacent = useMemo(() => {
    const set = new Set<string>();
    for (const l of layout.links) {
      if (l.a.id === selected) set.add(l.b.id);
      if (l.b.id === selected) set.add(l.a.id);
    }
    return set;
  }, [layout, selected]);

  return (
    <svg
      viewBox={layout.viewBox}
      className="h-auto max-h-[70vh] w-full touch-manipulation select-none"
      role="img"
      aria-label={`Similarity network of ${layout.nodes.length} subreddits`}
    >
      <g>
        {layout.links.map((l) => {
          const lit = selected !== null && (l.a.id === selected || l.b.id === selected);
          return (
            <line
              key={`${l.a.id}-${l.b.id}`}
              x1={l.a.x}
              y1={l.a.y}
              x2={l.b.x}
              y2={l.b.y}
              stroke={lit ? "var(--color-amber)" : "var(--color-ink)"}
              strokeOpacity={lit ? 0.9 : 0.06 + l.sim * 0.35}
              strokeWidth={lit ? 1.4 : 0.4 + l.sim * 1.2}
            />
          );
        })}
      </g>
      <g>
        {layout.nodes.map((n) => {
          const isSelected = n.id === selected;
          const dimmed = selected !== null && !isSelected && !adjacent.has(n.id);
          return (
            <g
              key={n.id}
              transform={`translate(${n.x ?? 0} ${n.y ?? 0})`}
              onClick={() => onSelect(n.id)}
              className="cursor-pointer"
              opacity={dimmed ? 0.25 : 1}
            >
              <title>{`r/${n.id} · ${n.category}`}</title>
              <circle r={n.r + 6} fill="transparent" />
              <circle
                r={n.r}
                fill={isSelected ? "var(--color-amber)" : categoryColour(n.category, categoryOrder)}
                stroke={isSelected || adjacent.has(n.id) ? "var(--color-amber)" : "var(--color-paper)"}
                strokeWidth={1}
              />
              {(labelled.has(n.id) || isSelected || adjacent.has(n.id)) && (
                <text
                  x={n.r + 3}
                  y={3}
                  fontSize={9}
                  fontFamily="var(--font-mono)"
                  fill={isSelected ? "var(--color-amber)" : "var(--color-ink)"}
                  fillOpacity={isSelected ? 1 : 0.75}
                  paintOrder="stroke"
                  stroke="var(--color-paper)"
                  strokeWidth={3}
                >
                  {n.id}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
