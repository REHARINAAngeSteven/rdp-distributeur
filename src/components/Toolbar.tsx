import { useRef } from "react";
import { usePetriStore } from "../store/usePetriStore";
import { idDisponible, slugifier } from "../domain/identifiants";

export default function Toolbar() {
  const net = usePetriStore((s) => s.net);
  const addPlace = usePetriStore((s) => s.addPlace);
  const addTransition = usePetriStore((s) => s.addTransition);
  const mode = usePetriStore((s) => s.mode);
  const setMode = usePetriStore((s) => s.setMode);
  const reset = usePetriStore((s) => s.reset);
  const annuler = usePetriStore((s) => s.annuler);
  const retablir = usePetriStore((s) => s.retablir);
  const pileAnnulation = usePetriStore((s) => s.pileAnnulation);
  const pileRetablissement = usePetriStore((s) => s.pileRetablissement);
  const lectureAuto = usePetriStore((s) => s.lectureAuto);
  const setLectureAuto = usePetriStore((s) => s.setLectureAuto);
  const vitesseLectureMs = usePetriStore((s) => s.vitesseLectureMs);
  const setVitesseLecture = usePetriStore((s) => s.setVitesseLecture);
  const exporterJSON = usePetriStore((s) => s.exporterJSON);
  const importerJSON = usePetriStore((s) => s.importerJSON);
  const inputFichier = useRef<HTMLInputElement>(null);

  function telechargerJSON() {
    const blob = new Blob([exporterJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reseau-petri.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function positionAleatoire() {
    return {
      x: 400 + Math.round(Math.random() * 160 - 80),
      y: 300 + Math.round(Math.random() * 160 - 80),
    };
  }

  function ajouterPlace() {
    const nom = window.prompt("Nom de la nouvelle place :");
    if (!nom) return;
    addPlace(idDisponible(net, slugifier(nom)), nom, positionAleatoire());
  }

  function ajouterTransition() {
    const nom = window.prompt("Nom de la nouvelle transition :");
    if (!nom) return;
    addTransition(idDisponible(net, slugifier(nom)), nom, positionAleatoire());
  }

  async function fichierChoisi(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const texte = await fichier.text();
    try {
      importerJSON(texte);
    } catch {
      alert("Fichier JSON invalide.");
    }
    e.target.value = ""; // permet de recharger le même fichier deux fois de suite
  }

  return (
    <header className="toolbar">
      <h1 className="toolbar__titre">🥤 Distributeur — Réseau de Petri</h1>
      <div className="toolbar__actions">
        <button type="button" onClick={annuler} disabled={pileAnnulation.length === 0} className="btn">
          ↶ Annuler
        </button>
        <button type="button" onClick={retablir} disabled={pileRetablissement.length === 0} className="btn">
          ↷ Refaire
        </button>

        <button
          type="button"
          onClick={() => setLectureAuto(!lectureAuto)}
          className={`btn ${lectureAuto ? "btn--actif" : ""}`}
        >
          {lectureAuto ? "⏸ Pause" : "▶ Lecture auto"}
        </button>
        <select
          value={vitesseLectureMs}
          onChange={(e) => setVitesseLecture(Number(e.target.value))}
          className="btn"
        >
          <option value={1500}>Lent</option>
          <option value={800}>Normal</option>
          <option value={300}>Rapide</option>
        </select>

        <button type="button" onClick={telechargerJSON} className="btn">
          ⭳ Exporter
        </button>
        <button type="button" onClick={() => inputFichier.current?.click()} className="btn">
          ⭱ Importer
        </button>
        <input
          ref={inputFichier}
          type="file"
          accept="application/json"
          onChange={fichierChoisi}
          style={{ display: "none" }}
        />

        <button type="button" onClick={reset} className="btn">
          Réinitialiser
        </button>
        <button
          type="button"
          className={`btn ${mode === "edition" ? "btn--actif" : ""}`}
          onClick={() => setMode(mode === "simulation" ? "edition" : "simulation")}
        >
          {mode === "edition" && (
            <>
              <button type="button" onClick={ajouterPlace} className="btn">
                + Place
              </button>
              <button type="button" onClick={ajouterTransition} className="btn">
                + Transition
              </button>
            </>
          )}
          {mode === "simulation" ? "Passer en mode édition" : "Revenir en mode simulation"}
        </button>
      </div>
    </header>
  );
}