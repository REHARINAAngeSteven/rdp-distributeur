import { useMemo } from "react";
import { usePetriStore } from "../store/usePetriStore";
import { getEnabledTransitions } from "../domain/petrinet";

/**
 * Panneau latéral d'information. Affiche :
 *  - le marquage courant, place par place, dans l'ordre du réseau ;
 *  - la liste des transitions franchissables ;
 *  - l'historique des franchissements.
 *
 * Le panneau ne fait AUCUN calcul de RdP : il lit des données du store
 * et, au plus, appelle `getEnabledTransitions` pour l'affichage (ce qui
 * est une lecture pure, sans effet de bord).
 */
export default function SidePanel() {
  const net = usePetriStore((s) => s.net);
  const marking = usePetriStore((s) => s.marking);
  const historique = usePetriStore((s) => s.historique);

  const actives = useMemo(
    () => new Set(getEnabledTransitions(net, marking)),
    [net, marking]
  );

  const nomTransition = (id: string) =>
    net.transitions.find((t) => t.id === id)?.nom ?? id;

  return (
    <aside className="panneau">
      <section className="panneau__section">
        <h2>Comment lire le schéma</h2>
        <div className="legende">
          <div className="legende__item">
            <span className="legende__icone legende__icone--place" />
            Place — un état ou un stock (ex : pièces disponibles)
          </div>
          <div className="legende__item">
            <span className="legende__icone">
              <span className="legende__icone--jeton" />
            </span>
            Jeton — une ressource dispo ; son nombre = la quantité actuelle
          </div>
          <div className="legende__item">
            <span className="legende__icone legende__icone--transition" />
            Transition — une action ; s'allume en ambre quand elle peut être déclenchée
          </div>
          <div className="legende__item">
            <span className="legende__icone legende__icone--arc" />
            Flèche — un flux ; le chiffre = la quantité consommée/produite
          </div>
        </div>
      </section>
      <section className="panneau__section">
        <h2>Marquage actuel</h2>
        <ul className="liste-marquage">
          {net.places.map((p) => (
            <li key={p.id}>
              <span>{p.nom}</span>
              <strong>{marking[p.id] ?? 0}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="panneau__section">
        <h2>Transitions franchissables</h2>
        {actives.size === 0 ? (
          <p className="panneau__vide">
            Aucune transition n'est franchissable dans l'état actuel.
          </p>
        ) : (
          <ul className="liste-actives">
            {[...actives].map((id) => (
              <li key={id}>{nomTransition(id)}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="panneau__section">
        <h2>Historique</h2>
        {historique.length === 0 ? (
          <p className="panneau__vide">Aucune action pour le moment.</p>
        ) : (
          <ol className="liste-historique">
            {historique.map((l, i) => (
              <li key={i}>{nomTransition(l.transitionId)}</li>
            ))}
          </ol>
        )}
      </section>
    </aside>
  );
}