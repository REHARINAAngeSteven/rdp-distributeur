import { Handle, Position, type NodeProps } from "reactflow";

type DonneesTransition = {
  nom: string;
  active: boolean;
  onFire: () => void;
};

/**
 * Rendu d'une transition : une barre rectangulaire, verte si la
 * transition est franchissable (cliquable), grise sinon. Le clic
 * n'appelle `onFire` que si elle est active — l'appelant ne se
 * protège pas lui-même, c'est volontaire : un seul endroit décide.
 */
export default function TransitionNode({ data }: NodeProps<DonneesTransition>) {
  const { nom, active, onFire } = data;
  return (
    <div className={`transition ${active ? "transition--active" : ""}`}>
      <Handle type="target" position={Position.Left} className="handle-cache" />
      <Handle type="source" position={Position.Right} className="handle-cache" />
      <Handle type="target" position={Position.Top} className="handle-cache" />
      <Handle type="source" position={Position.Bottom} className="handle-cache" />
      <button
        type="button"
        className="transition__barre"
        disabled={!active}
        onClick={() => active && onFire()}
        title={
          active
            ? "Cliquer pour franchir cette transition"
            : "Transition non franchissable dans l'état actuel"
        }
      >
        {nom}
      </button>
    </div>
  );
}