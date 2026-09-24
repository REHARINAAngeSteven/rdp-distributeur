import { useEffect } from "react";
import { usePetriStore } from "./usePetriStore";

/**
 * Fait avancer la simulation toute seule tant que `lectureAuto` est
 * actif. S'arrête d'elle-même quand plus aucune transition n'est
 * franchissable (voir `fireAleatoire` dans le store).
 */
export function useLectureAutomatique() {
  const lectureAuto = usePetriStore((s) => s.lectureAuto);
  const vitesseLectureMs = usePetriStore((s) => s.vitesseLectureMs);
  const fireAleatoire = usePetriStore((s) => s.fireAleatoire);

  useEffect(() => {
    if (!lectureAuto) return;
    const id = setInterval(fireAleatoire, vitesseLectureMs);
    return () => clearInterval(id);
  }, [lectureAuto, vitesseLectureMs, fireAleatoire]);
}