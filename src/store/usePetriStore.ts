import { create } from "zustand";
import {
  RESEAU_DISTRIBUTEUR,
  marquageInitial,
} from "../domain/distributeur";
import {
  fire,
  getEnabledTransitions,
  isEnabled,
} from "../domain/petrinet";
import type { Marking, PetriNet, TransitionId } from "../domain/types";

type Mode = "simulation" | "edition";

type LigneHistorique = {
  transitionId: TransitionId;
  quand: number;
};

type Instantane = {
  marking: Marking;
  historique: readonly LigneHistorique[];
};

type Etat = {
  net: PetriNet;
  marking: Marking;
  historique: readonly LigneHistorique[];
  mode: Mode;
  pileAnnulation: readonly Instantane[];
  pileRetablissement: readonly Instantane[];
  lectureAuto: boolean;
  vitesseLectureMs: number;
};

type Actions = {
  fireTransition: (id: TransitionId) => void;
  reset: () => void;
  setMode: (mode: Mode) => void;
  loadNet: (net: PetriNet, marking: Marking) => void;
  addPlace: (id: string, nom: string, position: { x: number; y: number }) => void;
  addTransition: (id: string, nom: string, position: { x: number; y: number }) => void;
  addArc: (source: string, cible: string, poids: number) => void;

  annuler: () => void;
  retablir: () => void;

  exporterJSON: () => string;
  importerJSON: (json: string) => void;

  setLectureAuto: (actif: boolean) => void;
  setVitesseLecture: (ms: number) => void;
  fireAleatoire: () => void;

  /** Déplace une place ou une transition (glisser-déposer, tous modes). */
  deplacerNoeud: (id: string, position: { x: number; y: number }) => void;
  /** Supprime une place ET tous les arcs qui la touchent. */
  removerPlace: (id: string) => void;
  /** Supprime une transition ET tous les arcs qui la touchent. */
  removerTransition: (id: string) => void;
  /** Supprime plusieurs arcs d'un coup, par leur index dans net.arcs. */
  removerArcsParIndex: (indices: readonly number[]) => void;
};

export const usePetriStore = create<Etat & Actions>((set, get) => ({
  net: RESEAU_DISTRIBUTEUR,
  marking: marquageInitial(),
  historique: [],
  mode: "simulation",
  pileAnnulation: [],
  pileRetablissement: [],
  lectureAuto: false,
  vitesseLectureMs: 800,

  fireTransition: (id) => {
    const { net, marking, historique, pileAnnulation } = get();
    if (!isEnabled(net, marking, id)) return;
    const instantane: Instantane = { marking, historique };
    const nouveauMarquage = fire(net, marking, id);
    set({
      marking: nouveauMarquage,
      historique: [...historique, { transitionId: id, quand: Date.now() }],
      pileAnnulation: [...pileAnnulation, instantane],
      pileRetablissement: [],
    });
  },

  annuler: () => {
    const { pileAnnulation, pileRetablissement, marking, historique } = get();
    if (pileAnnulation.length === 0) return;
    const precedent = pileAnnulation[pileAnnulation.length - 1];
    set({
      marking: precedent.marking,
      historique: precedent.historique,
      pileAnnulation: pileAnnulation.slice(0, -1),
      pileRetablissement: [...pileRetablissement, { marking, historique }],
    });
  },

  retablir: () => {
    const { pileAnnulation, pileRetablissement, marking, historique } = get();
    if (pileRetablissement.length === 0) return;
    const suivant = pileRetablissement[pileRetablissement.length - 1];
    set({
      marking: suivant.marking,
      historique: suivant.historique,
      pileRetablissement: pileRetablissement.slice(0, -1),
      pileAnnulation: [...pileAnnulation, { marking, historique }],
    });
  },

  reset: () =>
    set({
      net: RESEAU_DISTRIBUTEUR,
      marking: marquageInitial(),
      historique: [],
      pileAnnulation: [],
      pileRetablissement: [],
      lectureAuto: false,
    }),

  setMode: (mode) => set({ mode }),

  loadNet: (net, marking) =>
    set({
      net,
      marking,
      historique: [],
      pileAnnulation: [],
      pileRetablissement: [],
      lectureAuto: false,
    }),

  addPlace: (id, nom, position) =>
    set((s) => ({
      net: { ...s.net, places: [...s.net.places, { id, nom, position }] },
    })),

  addTransition: (id, nom, position) =>
    set((s) => ({
      net: { ...s.net, transitions: [...s.net.transitions, { id, nom, position }] },
    })),

  addArc: (source, cible, poids) =>
    set((s) => ({
      net: { ...s.net, arcs: [...s.net.arcs, { source, cible, poids }] },
    })),

  exporterJSON: () => {
    const { net, marking } = get();
    return JSON.stringify({ net, marking }, null, 2);
  },

  importerJSON: (json) => {
    const donnees = JSON.parse(json) as { net: PetriNet; marking: Marking };
    get().loadNet(donnees.net, donnees.marking);
  },

  setLectureAuto: (actif) => set({ lectureAuto: actif }),
  setVitesseLecture: (ms) => set({ vitesseLectureMs: ms }),

  fireAleatoire: () => {
    const { net, marking } = get();
    const actives = getEnabledTransitions(net, marking);
    if (actives.length === 0) {
      set({ lectureAuto: false });
      return;
    }
    const choix = actives[Math.floor(Math.random() * actives.length)];
    get().fireTransition(choix);
  },

  deplacerNoeud: (id, position) =>
    set((s) => ({
      net: {
        ...s.net,
        places: s.net.places.map((p) => (p.id === id ? { ...p, position } : p)),
        transitions: s.net.transitions.map((t) =>
          t.id === id ? { ...t, position } : t
        ),
      },
    })),

  removerPlace: (id) =>
    set((s) => ({
      net: {
        ...s.net,
        places: s.net.places.filter((p) => p.id !== id),
        arcs: s.net.arcs.filter((a) => a.source !== id && a.cible !== id),
      },
    })),

  removerTransition: (id) =>
    set((s) => ({
      net: {
        ...s.net,
        transitions: s.net.transitions.filter((t) => t.id !== id),
        arcs: s.net.arcs.filter((a) => a.source !== id && a.cible !== id),
      },
    })),

  removerArcsParIndex: (indices) => {
    const ensemble = new Set(indices);
    set((s) => ({
      net: { ...s.net, arcs: s.net.arcs.filter((_, i) => !ensemble.has(i)) },
    }));
  },
}));