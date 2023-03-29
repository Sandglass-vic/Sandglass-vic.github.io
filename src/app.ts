import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
  Engine,
  Scene,
  Color4,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  FreeCamera,
  Sound,
  Angle,
  TransformNode,
  ShadowGenerator,
  PointLight,
  SpotLight,
} from "@babylonjs/core";
import { Environment } from "./environment";
import { Player } from "./characterController";
import { InputController } from "./inputController";

//enum for states
enum State {
  START = 0,
  GAME = 1,
  LOSE = 2,
  CUTSCENE = 3,
}

class App {
  // General Entire Application
  private _scene: Scene;
  private _canvas: HTMLCanvasElement;
  private _engine: Engine;

  //Scene - related
  private _state: number = 0;
  private _3dscene: Scene;
  private _2dscene: Scene;

  private _env: Environment;
  private _player: Player;
  private _input: InputController;

  constructor() {
    // create canvas
    this._canvas = this._createCanvas();

    // initialize babylon scene and engine
    this._engine = new Engine(this._canvas, true);
    this._scene = new Scene(this._engine);

    // hide/show the Inspector
    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (this._scene.debugLayer.isVisible()) {
          this._scene.debugLayer.hide();
        } else {
          this._scene.debugLayer.show();
        }
      }
    });

    // run the main render loop
    this._main();
  }

  private async _main(): Promise<void> {
    await this._setUp();

    // Register a render loop to repeatedly render the scene
    this._engine.runRenderLoop(() => {
      switch (this._state) {
        case State.START:
          this._scene.render();
          break;
        case State.CUTSCENE:
          this._scene.render();
          break;
        case State.GAME:
          this._scene.render();
          break;
        case State.LOSE:
          this._scene.render();
          break;
        default:
          break;
      }
    });

    //resize if the screen is resized/rotated
    window.addEventListener("resize", () => {
      this._engine.resize();
    });
  }

  private async _setUp() {
    // loading ui
    this._engine.displayLoadingUI();
    this._scene.detachControl();
    // load scene
    let scene = new Scene(this._engine);
    // set up environment
    this._env = new Environment(scene, this._input);
    await this._env.load();
    let arcRotateCamera = new ArcRotateCamera(
      "arcRotateCamera",
      0,
      Angle.FromDegrees(90).radians(),
      100,
      new Vector3(0, 0, 0),
      scene
    );
    let target = MeshBuilder.CreateBox("arcRotateCameraTarget");
    target.isVisible = false;
    target.isPickable = false;
    target.checkCollisions = false;
    target.position.y = 20;
    target.parent = this._env.root;
    arcRotateCamera.setTarget(target);
    scene.activeCamera = arcRotateCamera;
    scene.registerBeforeRender(() => {
      let deltaTime = this._engine.getDeltaTime() * 1e-3;
      arcRotateCamera.alpha -= deltaTime * Angle.FromDegrees(4.5).radians();
    });
    arcRotateCamera.attachControl(this._canvas, true);
    // set up player
    this._input = new InputController(scene); //detect keyboard/mobile inputs
    this._player = new Player(scene, this._input);
    await this._player.load();
    let playerCam = this._player.activatePlayerCamera();
    // scene.activeCamera = playerCam;
    let pointlight = new PointLight("courtLight", new Vector3(0, 20, 0), scene);
    pointlight.intensity = 10;
    pointlight.range = 10;
    // const light0 = new SpotLight(
    //   "spotLight",
    //   new Vector3(0, 30, -10),
    //   new Vector3(0, -1, 0),
    //   Math.PI / 3,
    //   2,
    //   scene
    // );
    const pointlightShadow = new ShadowGenerator(1024, pointlight);
    pointlightShadow.darkness = 0.4;
    pointlightShadow.addShadowCaster(this._env.root);
    pointlightShadow.addShadowCaster(this._player.mesh);
    await scene.whenReadyAsync();
    scene.getMeshByName("outer").position = new Vector3(0, 5, 0);
    //when the scene is ready, hide loading
    this._engine.hideLoadingUI();
    this._scene.dispose();
    this._scene = scene;
    this._state = State.START;
  }

  private _createCanvas(): HTMLCanvasElement {
    //Commented out for development
    document.documentElement.style["overflow"] = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.width = "100%";
    document.documentElement.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    //create the canvas html element and attach it to the webpage
    this._canvas = document.createElement("canvas");
    this._canvas.style.width = "100%";
    this._canvas.style.height = "100%";
    this._canvas.id = "gameCanvas";
    document.body.appendChild(this._canvas);

    return this._canvas;
  }
}
new App();

