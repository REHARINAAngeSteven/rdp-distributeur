/**
 * Valeurs numériques du distributeur, regroupées en un seul endroit.
 *
 * Convention : 1 jeton = 100 Ariary (Ar). Prix en ordres de grandeur
 * indicatifs du contexte malgache (gargote / épicerie de quartier).
 */

export const VALEUR_JETON_AR = 100;

/** Prix exprimés en nombre de jetons (= centaines d'Ar). */
export const PRIX = {
  cafe: 5,   // 500 Ar
  the: 3,    // 300 Ar
} as const;

/** Stock initial de chaque boisson. */
export const STOCK_INITIAL = {
  cafe: 3,
  the: 3,
} as const;

/** Type union des boissons connues, déduit de PRIX. */
export type NomBoisson = keyof typeof PRIX;

/** Liste ordonnée des boissons (utile pour l'affichage et les tests). */
export const BOISSONS: readonly NomBoisson[] = Object.keys(
  PRIX
) as NomBoisson[];

/**
 * Réserve initiale de pièces « dans la poche » de l'utilisateur.
 * Chaque appel à `inserer_piece` en consomme une. Au-delà, l'utilisateur
 * est à sec : `inserer_piece` n'est plus franchissable.
 *
 * 20 pièces = 2000 Ar, largement assez pour tester tous les scénarios
 * du réseau de base (café 500 Ar, thé 300 Ar).
 */
export const RESERVE_PIECES = 20;
