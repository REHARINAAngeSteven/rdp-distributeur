import { Handle, Position, type NodeProps } from "reactflow";

type DonneesPlace = {
  nom: string;
  jetons: number;
};

/**
 * Rendu d'une place : un cercle avec son nom en dessous, et autant de
 * points noirs que de jetons. Les points sont disposés en grille pour
 * rester lisibles même avec une dizaine de jetons.
 *
 * Les `Handle` sont les points de connexion de React Flow : on en met
 * un de chaque côté, invisible, pour que les arcs puissent s'accrocher.
 */
export default function PlaceNode({ data }: NodeProps<DonneesPlace>) {
  const { nom, jetons } = data;
  const taille = 56;
  const points: JSX.Element[] = [];
  const parLigne = Math.min(5, Math.max(1, jetons));
  for (let i = 0; i < jetons; i++) {
    const ligne = Math.floor(i / parLigne);
    const colonne = i % parLigne;
    points.push(
      <circle
        key={i}
        cx={16 + colonne * 10}
        cy={16 + ligne * 10}
        r={3.5}
        fill="#B6743A"          /* cuivre — un jeton = une pièce/ressource */
      />
    );
  }

  return (
    <div className="place">
      <svg
        width={taille}
        height={taille}
        viewBox="0 0 56 56"
        className="place__cercle"
      >
        <circle
          cx={28}
          cy={28}
          r={26}
          fill="#FDFDFC"
          stroke="#23262B"        /* même gris que la carrosserie */
          strokeWidth={2}
        />
        <g>{points}</g>
      </svg>
      <span className="place__nom">{nom}</span>
      <Handle type="target" position={Position.Left} className="handle-cache" />
      <Handle type="source" position={Position.Right} className="handle-cache" />
      <Handle type="target" position={Position.Top} className="handle-cache" />
      <Handle type="source" position={Position.Bottom} className="handle-cache" />
    </div>
  );
}