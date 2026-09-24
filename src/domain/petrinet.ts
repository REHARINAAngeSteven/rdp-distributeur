/**
 * Le cœur du moteur : trois fonctions PURES sur les Réseaux de Petri.
 *
 * « Pure » = la fonction ne modifie jamais ses arguments et ne produit
 * aucun effet de bord. C'est ce qui la rend prévisible et testable.
 */

import type { Arc, Marking, PetriNet, TransitionId } from "./types";

function arcsEntrants(net: PetriNet, t: TransitionId): readonly Arc[] {
  const places = new Set(net.places.map((p) => p.id));
  return net.arcs.filter((a) => a.cible === t && places.has(a.source));
}

function arcsSortants(net: PetriNet, t: TransitionId): readonly Arc[] {
  const places = new Set(net.places.map((p) => p.id));
  return net.arcs.filter((a) => a.source === t && places.has(a.cible));
}

function transitionExiste(net: PetriNet, t: TransitionId): boolean {
  return net.transitions.some((x) => x.id === t);
}

/**
 * Une transition est franchissable si, pour CHAQUE place en entrée, le
 * marquage contient au moins autant de jetons que le poids de l'arc.
 */
export function isEnabled(
  net: PetriNet,
  marking: Marking,
  t: TransitionId
): boolean {
  if (!transitionExiste(net, t)) return false;
  return arcsEntrants(net, t).every(
    (arc) => (marking[arc.source] ?? 0) >= arc.poids
  );
}

/**
 * Renvoie un NOUVEAU marquage après franchissement. Lève une erreur si
 * la transition n'est pas franchissable (appeler `fire` sur une
 * transition bloquée est presque toujours un bug de l'appelant).
 */
export function fire(
  net: PetriNet,
  marking: Marking,
  t: TransitionId
): Marking {
  if (!isEnabled(net, marking, t)) {
    throw new Error(
      `Transition « ${t} » non franchissable dans le marquage actuel.`
    );
  }
  const suivant: Record<string, number> = { ...marking };
  for (const arc of arcsEntrants(net, t)) {
    suivant[arc.source] = (suivant[arc.source] ?? 0) - arc.poids;
  }
  for (const arc of arcsSortants(net, t)) {
    suivant[arc.cible] = (suivant[arc.cible] ?? 0) + arc.poids;
  }
  return suivant;
}

/** Liste des transitions franchissables dans le marquage donné. */
export function getEnabledTransitions(
  net: PetriNet,
  marking: Marking
): readonly TransitionId[] {
  return net.transitions
    .filter((x) => isEnabled(net, marking, x.id))
    .map((x) => x.id);
}
/**
 * Règle structurelle des RdP : un arc relie toujours une place à une
 * transition (jamais deux nœuds de la même catégorie). C'est ce qui
 * garantit que le réseau reste un vrai bipartite place/transition.
 */
export function estArcValide(
  net: PetriNet,
  source: string,
  cible: string
): boolean {
  const estPlace = (id: string) => net.places.some((p) => p.id === id);
  const estTransition = (id: string) => net.transitions.some((t) => t.id === id);
  return (
    (estPlace(source) && estTransition(cible)) ||
    (estTransition(source) && estPlace(cible))
  );
}