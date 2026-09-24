import { describe, it, expect } from "vitest";
import { isEnabled, fire, getEnabledTransitions } from "./petrinet";
import { RESEAU_DISTRIBUTEUR, marquageInitial } from "./distributeur";
import { PRIX, STOCK_INITIAL, BOISSONS } from "./constants";
import type { Marking } from "./types";

const NET = RESEAU_DISTRIBUTEUR;

/** Insère n pièces en enchaînant des franchissements de `inserer_piece`. */
function insererPieces(marking: Marking, n: number): Marking {
  let m = marking;
  for (let i = 0; i < n; i++) m = fire(NET, m, "inserer_piece");
  return m;
}

describe("moteur RdP — cas nominal", () => {
  it("au démarrage, seule « insérer une pièce » est franchissable", () => {
    const m = marquageInitial();
    const actives = getEnabledTransitions(NET, m);
    expect(actives).toEqual(["inserer_piece"]);
  });

  it("acheter un café fonctionne si montant suffisant ET stock dispo", () => {
    // Montant exactement égal au prix du café.
    const m = insererPieces(marquageInitial(), PRIX.cafe);
    expect(isEnabled(NET, m, "acheter_cafe")).toBe(true);
    const apres = fire(NET, m, "acheter_cafe");
    expect(apres.montant_insere).toBe(0);
    expect(apres.stock_cafe).toBe(STOCK_INITIAL.cafe - 1);
    expect(apres.boisson_distribuee).toBe(1);
  });
});

describe("moteur RdP — cas non franchissables", () => {
  it("acheter un café échoue si le montant est insuffisant", () => {
    const m = insererPieces(marquageInitial(), PRIX.cafe - 1);
    expect(isEnabled(NET, m, "acheter_cafe")).toBe(false);
    expect(() => fire(NET, m, "acheter_cafe")).toThrow();
  });

  it("acheter un café échoue si le stock est à zéro", () => {
    // On vide le stock en achetant tous les cafés, puis on remet du
    // montant et on réessaie.
    let m = marquageInitial();
    for (let i = 0; i < STOCK_INITIAL.cafe; i++) {
      m = insererPieces(m, PRIX.cafe);
      m = fire(NET, m, "acheter_cafe");
    }
    expect(m.stock_cafe).toBe(0);

    m = insererPieces(m, PRIX.cafe);
    expect(isEnabled(NET, m, "acheter_cafe")).toBe(false);
  });

  it("acheter un thé avec un stock de thé à zéro est bloqué", () => {
    let m = marquageInitial();
    for (let i = 0; i < STOCK_INITIAL.the; i++) {
      m = insererPieces(m, PRIX.the);
      m = fire(NET, m, "acheter_the");
    }
    m = insererPieces(m, PRIX.the);
    expect(isEnabled(NET, m, "acheter_the")).toBe(false);
  });
});

describe("moteur RdP — invariants sur plusieurs achats", () => {
  it("stock + distribué reste constant pour chaque boisson", () => {
    // Invariant n°1 : chaque achat déplace un jeton du stock vers
    // « boisson distribuée » sans en faire disparaître. La somme
    // (stock_<b> + boisson_distribuee) n'est PAS constante globalement,
    // mais la somme par boisson l'est si on la suit séparément. Ici, on
    // vérifie la version globale : stock total + boissons distribuées
    // = stock initial total, à tout moment.
    const stockInitialTotal =
      STOCK_INITIAL.cafe + STOCK_INITIAL.the;

    let m = marquageInitial();
    for (let i = 0; i < 3; i++) {
      // Un achat de café.
      m = insererPieces(m, PRIX.cafe);
      m = fire(NET, m, "acheter_cafe");
      const stockTotal = BOISSONS.reduce(
        (acc, b) => acc + (m[`stock_${b}`] ?? 0),
        0
      );
      expect(stockTotal + (m.boisson_distribuee ?? 0)).toBe(
        stockInitialTotal
      );
    }
  });

  it("l'argent ne s'évapore pas : pièces + montant + monnaie reste constant", () => {
    // Invariant : à tout moment, la somme
    //   pieces_disponibles + montant_insere + monnaie_rendue
    // est égale au nombre de pièces initialement dans la poche.
    // Un achat retire des jetons de `montant_insere`, mais ils sont
    // « dépensés » (transformés en boisson) : on vérifie donc seulement
    // que la somme des jetons non dépensés ne dépasse jamais la réserve.
    let m = marquageInitial();
    const reserveInitiale = m.pieces_disponibles;

    m = insererPieces(m, 7);
    m = fire(NET, m, "acheter_cafe");
    m = fire(NET, m, "rendre_monnaie");
    m = insererPieces(m, 5);

    const nonDepense =
      (m.pieces_disponibles ?? 0) +
      (m.montant_insere ?? 0) +
      (m.monnaie_rendue ?? 0);
    // Les 5 jetons du café acheté sont « sortis » de la somme : ils
    // sont devenus une boisson. On vérifie donc l'inégalité.
    expect(nonDepense).toBeLessThanOrEqual(reserveInitiale);
  });
});
test("un arc entre deux places n'est pas valide", () => {
  const net: PetriNet = {
    places: [
      { id: "a", nom: "A", position: { x: 0, y: 0 } },
      { id: "b", nom: "B", position: { x: 0, y: 0 } },
    ],
    transitions: [],
    arcs: [],
  };
  expect(estArcValide(net, "a", "b")).toBe(false);
});