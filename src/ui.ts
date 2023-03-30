import { MeshBuilder, Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture,Button, ScrollViewer } from "@babylonjs/gui";

export class UI {
    private _ui;

  constructor(_scene: Scene, cam: any) {
    let plane = MeshBuilder.CreatePlane("plane", {size:100}, _scene);
    plane.parent = cam;
    plane.position.z = 100;

    this._ui = AdvancedDynamicTexture.CreateForMesh(plane);

    // this._ui =  AdvancedDynamicTexture.CreateFullscreenUI("base");
    // this._ui.idealHeight = 720;
    let sv = new ScrollViewer("UI");
    sv.width = 0.6;
    sv.height = 0.4;
    sv.alpha = 0.6;
    sv.top = -150;
    this._ui.addControl(sv);

    let button1 = Button.CreateSimpleButton("but1", "Click Me");
    button1.width = "150px"
    button1.height = "40px";
    button1.color = "white";
    button1.cornerRadius = 20;
    button1.background = "green";
    button1.onPointerUpObservable.add(function() {
        alert("you did it!");
    });
    sv.addControl(button1);    

  }

}
