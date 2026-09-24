import Canvas from "./components/Canva";
import Toolbar from "./components/Toolbar";
import SidePanel from "./components/SidePanel";
import { useLectureAutomatique } from "./store/useLectureAutomatique";
// @ts-expect-error CSS is handled by the bundler; TypeScript has no declaration for it.
import "./components/components.css";

/**
 * L'écran global, en trois zones :
 *  - en haut, la barre d'outils ;
 *  - à gauche, le canvas React Flow ;
 *  - à droite, le panneau d'information (marquage, historique).
 *
 * Ce composant ne fait QUE de la mise en page : toute la logique
 * (franchissement, reset, mode) vit dans le store.
 */
export default function App() {
  useLectureAutomatique();
  return (
    <div className="app">
      <Toolbar />
      <div className="app__corps">
        <Canvas />
        <SidePanel />
      </div>
    </div>
  );
}