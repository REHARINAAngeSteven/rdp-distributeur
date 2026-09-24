/**
 * Réseau de Petri du distributeur de boissons — version simplifiée.
 *
 * Choix pédagogiques :
 *  - une seule transition d'achat par boisson (`acheter_cafe`,
 *    `acheter_the`) : pas de séparation sélection / distribution, qui
 *    alourdissait le dessin sans rien apporter conceptuellement ;
 *  - les préconditions combinées « montant suffisant ET stock
 *    disponible » sont matérialisées par deux arcs entrants de poids
 *    respectifs PRIX[boisson] et 1 ;
 *  - le stock est une ressource qui décroît réellement : `stock_cafe`
 *    perd un jeton à chaque achat, et il n'est jamais régénéré.
 *
 * La transition « annuler » n'est volontairement PAS incluse : elle est
 * laissée en exercice au lecteur (voir GUIDE_PREMIERE_CONTRIBUTION.md).
 */

import { PRIX, STOCK_INITIAL, BOISSONS, type NomBoisson, RESERVE_PIECES } from "./constants";
import type { Arc, Marking, PetriNet, Place, Transition } from "./types";

// ─── Places ───────────────────────────────────────────────────────────────

const PLACES_COMMUNES: readonly Place[] = [
  { id: "pieces_disponibles", nom: "pièces disponibles", position: { x: 40, y: 240 } },
  { id: "montant_insere", nom: "montant inséré", position: { x: 260, y: 200 } },
  { id: "boisson_distribuee", nom: "boisson distribuée", position: { x: 720, y: 200 } },
  { id: "monnaie_rendue", nom: "monnaie rendue", position: { x: 260, y: 420 } },
];


/** Une place de stock par boisson, réparties verticalement. */
function placesStock(boisson: NomBoisson, y: number): Place[] {
  return [
    {
      id: `stock_${boisson}`,
      nom: `stock ${boisson}`,
      position: { x: 490, y: y - 80 },
    },
  ];
}

const Y_PAR_BOISSON: Record<NomBoisson, number> = {
  cafe: 40,
  the: 340,
} as const;

export const PLACES_DISTRIBUTEUR: readonly Place[] = [
  ...PLACES_COMMUNES,
  ...BOISSONS.flatMap((b) => placesStock(b, Y_PAR_BOISSON[b])),
];

// ─── Transitions ──────────────────────────────────────────────────────────

const TRANSITION_INSERER: Transition = {
  id: "inserer_piece",
  nom: "insérer une pièce",
  position: { x: 150, y: 320 },
};

const TRANSITION_RENDRE_MONNAIE: Transition = {
  id: "rendre_monnaie",
  nom: "rendre la monnaie",
  position: { x: 150, y: 420 },
};

/**
 * Une transition d'achat par boisson. Elle est franchissable seulement
 * si le montant inséré est ≥ au prix ET si le stock de la boisson
 * contient au moins 1 jeton : c'est exactement la traduction de la
 * contrainte « montant suffisant ET stock disponible ».
 */
function transitionAchat(boisson: NomBoisson, y: number): Transition {
  return {
    id: `acheter_${boisson}`,
    nom: `acheter ${boisson} (${PRIX[boisson] * 100} Ar)`,
    position: { x: 490, y: y + 60 },
  };
}

export const TRANSITIONS_DISTRIBUTEUR: readonly Transition[] = [
  TRANSITION_INSERER,
  ...BOISSONS.flatMap((b) => transitionAchat(b, Y_PAR_BOISSON[b])),
  TRANSITION_RENDRE_MONNAIE,
];

// ─── Arcs ─────────────────────────────────────────────────────────────────

function arcsCommuns(): Arc[] {
  return [
    // insérer une pièce : pieces_disponibles → montant_insere
    { source: "pieces_disponibles", cible: "inserer_piece", poids: 1 },
    { source: "inserer_piece", cible: "montant_insere", poids: 1 },
    // rendre la monnaie : montant_insere → monnaie_rendue
    { source: "montant_insere", cible: "rendre_monnaie", poids: 1 },
    { source: "rendre_monnaie", cible: "monnaie_rendue", poids: 1 },
  ];
}

/**
 * Arcs pour une boisson donnée. Deux préconditions combinées :
 *  - `montant_insere` doit contenir au moins PRIX[boisson] jetons ;
 *  - `stock_<boisson>` doit contenir au moins 1 jeton.
 * Une seule postcondition : `boisson_distribuee` reçoit 1 jeton.
 */
function arcsAchat(boisson: NomBoisson): Arc[] {
  return [
    {
      source: "montant_insere",
      cible: `acheter_${boisson}`,
      poids: PRIX[boisson],
    },
    {
      source: `stock_${boisson}`,
      cible: `acheter_${boisson}`,
      poids: 1,
    },
    {
      source: `acheter_${boisson}`,
      cible: "boisson_distribuee",
      poids: 1,
    },
  ];
}

export const ARCS_DISTRIBUTEUR: readonly Arc[] = [
  ...arcsCommuns(),
  ...BOISSONS.flatMap((b) => arcsAchat(b)),
];

// ─── Réseau et marquage initial ───────────────────────────────────────────

export const RESEAU_DISTRIBUTEUR: PetriNet = {
  places: PLACES_DISTRIBUTEUR,
  transitions: TRANSITIONS_DISTRIBUTEUR,
  arcs: ARCS_DISTRIBUTEUR,
};

/**
 * Marquage initial :
 *  - `pieces_disponibles` contient RESERVE_PIECES jetons, qui
 *    représentent les pièces encore dans la poche de l'utilisateur.
 *    Chaque insertion en consomme une ;
 *  - chaque `stock_<boisson>` contient son stock initial.
 * Toutes les autres places sont vides.
 */

export function marquageInitial(): Marking {
  const m: Record<string, number> = { pieces_disponibles: RESERVE_PIECES };
  for (const b of BOISSONS) {
    m[`stock_${b}`] = STOCK_INITIAL[b];
  }
  return m;
}
