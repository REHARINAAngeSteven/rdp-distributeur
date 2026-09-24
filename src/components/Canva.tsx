import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Panel,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow";
import { usePetriStore } from "../store/usePetriStore";
import { estArcValide, getEnabledTransitions } from "../domain/petrinet";
import PlaceNode from "./PlaceNode";
import TransitionNode from "./TransitionNode";

export default function Canvas() {
  const net = usePetriStore((s) => s.net);
  const marking = usePetriStore((s) => s.marking);
  const mode = usePetriStore((s) => s.mode);
  const fireTransition = usePetriStore((s) => s.fireTransition);
  const addArc = usePetriStore((s) => s.addArc);
  const deplacerNoeud = usePetriStore((s) => s.deplacerNoeud);
  const removerPlace = usePetriStore((s) => s.removerPlace);
  const removerTransition = usePetriStore((s) => s.removerTransition);
  const removerArcsParIndex = usePetriStore((s) => s.removerArcsParIndex);

  const transitionsActives = useMemo(
    () => new Set(getEnabledTransitions(net, marking)),
    [net, marking]
  );

  const nodeTypes: NodeTypes = useMemo(
    () => ({ place: PlaceNode, transition: TransitionNode }),
    []
  );

  const nodes: Node[] = useMemo(() => {
    const places: Node[] = net.places.map((p) => ({
      id: p.id,
      type: "place",
      position: p.position,
      data: { nom: p.nom, jetons: marking[p.id] ?? 0 },
    }));
    const transitions: Node[] = net.transitions.map((t) => ({
      id: t.id,
      type: "transition",
      position: t.position,
      data: {
        nom: t.nom,
        active: transitionsActives.has(t.id),
        onFire: () => fireTransition(t.id),
      },
    }));
    return [...places, ...transitions];
  }, [net, marking, transitionsActives, fireTransition]);

  const edges: Edge[] = useMemo(
    () =>
      net.arcs.map((a, i) => ({
        id: `arc-${i}`,
        source: a.source,
        target: a.cible,
        label: a.poids > 1 ? String(a.poids) : undefined,
        type: "default",
        animated: false,
        style: { stroke: "#8A9099", strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "#8A9099",
        },
      })),
    [net.arcs]
  );

  /**
   * Création d'un arc par glisser-déposer entre deux poignées. On
   * vérifie d'abord la règle structurelle des RdP (place ↔ transition
   * uniquement, voir `estArcValide`), puis on demande le poids.
   */
  const onConnect = useCallback(
    (connexion: Connection) => {
      if (mode !== "edition") return;
      const { source, target } = connexion;
      if (!source || !target) return;
      if (!estArcValide(net, source, target)) {
        window.alert(
          "Un arc relie toujours une place à une transition — jamais deux places, ni deux transitions, entre elles."
        );
        return;
      }
      const poidsTexte = window.prompt("Poids de l'arc (nombre de jetons) :", "1");
      if (poidsTexte === null) return;
      const poids = Number.parseInt(poidsTexte, 10);
      if (!Number.isInteger(poids) || poids <= 0) {
        window.alert("Le poids doit être un nombre entier positif.");
        return;
      }
      addArc(source, target, poids);
    },
    [mode, net, addArc]
  );

  /** Persiste la position après un glisser-déposer, dans tous les modes. */
  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      deplacerNoeud(node.id, node.position);
    },
    [deplacerNoeud]
  );

  const onNodesDelete = useCallback(
    (supprimes: Node[]) => {
      for (const n of supprimes) {
        if (n.type === "place") removerPlace(n.id);
        else removerTransition(n.id);
      }
    },
    [removerPlace, removerTransition]
  );

  const onEdgesDelete = useCallback(
    (supprimes: Edge[]) => {
      const indices = supprimes
        .map((e) => Number.parseInt(e.id.replace("arc-", ""), 10))
        .filter((i) => !Number.isNaN(i));
      removerArcsParIndex(indices);
    },
    [removerArcsParIndex]
  );

  return (
    <div className={`canvas ${mode === "edition" ? "canvas--edition" : ""}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        deleteKeyCode={mode === "edition" ? ["Backspace", "Delete"] : []}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={true}
        nodesConnectable={mode === "edition"}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
        {mode === "edition" && (
          <Panel position="top-center" className="canvas__aide">
            Glisse depuis le bord d'un nœud vers un autre pour créer un arc ·
            Sélectionne puis Suppr pour supprimer
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}