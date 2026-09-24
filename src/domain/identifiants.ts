/**
 * Génère des identifiants lisibles à partir d'un nom saisi par
 * l'utilisateur, pour le mode édition. Pure, testable, aucune
 * dépendance React.
 */
import type { PetriNet } from "./types";

/** "Stock café spécial" → "stock_cafe_special" */
export function slugifier(nom: string): string {
  const base = nom
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || "noeud";
}

/** Ajoute un suffixe numérique si l'id existe déjà dans le réseau. */
export function idDisponible(net: PetriNet, base: string): string {
  const existants = new Set([
    ...net.places.map((p) => p.id),
    ...net.transitions.map((t) => t.id),
  ]);
  if (!existants.has(base)) return base;
  let i = 2;
  while (existants.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}