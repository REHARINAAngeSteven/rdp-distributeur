/**
 * Types du moteur de Réseau de Petri.
 * Aucune dépendance à React, au navigateur, ou à une bibliothèque d'affichage.
 */

/** Une place = un état possible du système. Dessinée comme un cercle. */
export type Place = {
  id: string;
  nom: string;
  position: { x: number; y: number };
};

/** Une transition = une action qui fait changer d'état. Dessinée comme une barre. */
export type Transition = {
  id: string;
  nom: string;
  position: { x: number; y: number };
};

/**
 * Un arc relie une place et une transition.
 * `poids` = combien de jetons sont consommés/produits à travers l'arc.
 */
export type Arc = {
  source: string;
  cible: string;
  poids: number;
};

/** Combien de jetons dans chaque place. Place absente = 0 jeton. */
export type Marking = Readonly<Record<string, number>>;

/**
 * Un réseau = places + transitions + arcs. Le marquage n'en fait PAS
 * partie : il évolue à chaque franchissement, le réseau reste fixe.
 */
export type PetriNet = {
  places: readonly Place[];
  transitions: readonly Transition[];
  arcs: readonly Arc[];
};

export type TransitionId = string;
export type PlaceId = string;

