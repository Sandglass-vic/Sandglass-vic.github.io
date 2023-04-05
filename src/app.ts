import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Angle,
  ShadowGenerator,
  PointLight,
  CubicEase,
  EasingFunction,
  Animation,
  Sound,
  SpotLight,
} from "@babylonjs/core";
import { Environment } from "./environment";
import { Player } from "./characterController";
import { InputController } from "./inputController";

//enum for states
enum State {
  START = 0,
  FLAT = 1,
  COURT = 2,
}

class App {
  // General Entire Application
  private _scene: Scene;
  private _canvas: HTMLCanvasElement;
  private _engine: Engine;

  //Scene - related
  private _state: number = 0;

  private _env!: Environment;
  private _input!: InputController;
  private _player!: Player;

  public get isDay() {
    return this._env.isDay;
  }
  public get isNight() {
    return this._env.isNight;
  }

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
      this._scene.render();
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
    this._env = new Environment(scene);
    await this._env.load();
    // set up player
    this._input = new InputController(scene); //detect keyboard/mobile inputs
    let player = new Player(scene, this._input);
    await player.load();
    this._player = player;
    scene.audioListenerPositionProvider = () => {
      return this._player.mesh.position;
    };
    // scene.activeCamera = playerCam;
    // set up camera
    this._setUpStartScene(scene);
    // set up gui
    // let ui = new UI(scene, arcRotateCam);
    // set up lights
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
    pointlightShadow.addShadowCaster(player.mesh);
    await scene.whenReadyAsync();
    //when the scene is ready, hide loading
    this._engine.hideLoadingUI();
    this._scene.dispose();
    this._scene = scene;
    this._state = State.START;
    // do something after we started
    let defence = document.getElementById("defence");
    setTimeout(() => {
      defence?.click();
    }, 3000);
  }

  private _createCanvas(): HTMLCanvasElement {
    //Commented out for development
    document.documentElement.style["overflow"] = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.width = "100%";
    document.documentElement.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    //create the canvas html element and attach it to the webpage
    this._canvas = document.createElement("canvas");
    this._canvas.id = "gameCanvas";
    document.body.appendChild(this._canvas);
    return this._canvas;
  }

  // private async _sleep(ms: number): Promise<void> {
  //   return new Promise((r) => setTimeout(r, ms));
  // }

  public isUiVisible(): Boolean {
    let app = document.getElementById("app");
    if (app) {
      return app.classList.contains("visible");
    } else {
      return false;
    }
  }

  private _setUpStartScene(scene: Scene): ArcRotateCamera {
    let start_target = new Vector3(
      this._env.root.position.x,
      this._env.root.position.y + 20,
      this._env.root.position.z
    );
    let flat_target = new Vector3(
      this._env.root.position.x + 50,
      this._env.root.position.y + 20,
      this._env.root.position.z
    );
    let arcRotateCamera = new ArcRotateCamera(
      "arcRotateCamera",
      0,
      Angle.FromDegrees(90).radians(),
      100,
      start_target,
      scene
    );
    scene.activeCamera = arcRotateCamera;
    scene.registerBeforeRender(() => {
      if (this._state == State.START) {
        let deltaTime = this._engine.getDeltaTime() * 1e-3;
        arcRotateCamera.alpha += deltaTime * Angle.FromDegrees(4.5).radians();
      }
    });
    arcRotateCamera.attachControl(this._canvas, true);
    this._player.camera.attachControl(this._canvas, true);
    (ArcRotateCamera.prototype as any).spinTo = function (
      whichprop: any,
      targetval: any,
      speed: any
    ) {
      var ease = new CubicEase();
      ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
      Animation.CreateAndStartAnimation(
        "at4",
        this,
        whichprop,
        speed,
        120,
        this[whichprop],
        targetval,
        0,
        ease
      );
    };
    let app = document.getElementById("app");
    let hideui = document.getElementById("hideui");
    let nighter = document.getElementById("cb1");
    let switch_button = document.getElementById("switch");
    if (hideui)
      hideui.onclick = async () => {
        let app = document.getElementById("app");
        if (app) {
          app.classList.toggle("visible");
          app.classList.toggle("hidden");
        }
        hideui?.classList.toggle("hide");
        hideui?.classList.toggle("show");
      };
    let sparklight = new SpotLight(
      "sparklight",
      new Vector3(0, 20, 0),
      Vector3.Down(),
      Angle.FromDegrees(75).radians(),
      0.9,
      scene
    );
    sparklight.intensity = 1000;
    sparklight.setEnabled(false);
    sparklight.parent = this._player.mesh;
    if (nighter)
      nighter.onclick = () => {
        hideui?.classList.toggle("night");
        hideui?.classList.toggle("day");
        let buttonCon = document.getElementById("button-con");
        buttonCon?.classList.toggle("night");
        buttonCon?.classList.toggle("day");
        if (this.isDay) {
          this._env.nightMode();
          sparklight.setEnabled(true);
        } else {
          this._env.dayMode();
          sparklight.setEnabled(false);
        }
      };
    if (switch_button)
      switch_button.onclick = async () => {
        if (this._state == State.START) {
          this._state = State.FLAT;
          let alpha = arcRotateCamera.alpha;
          let fl = Math.floor(alpha / Angle.FromDegrees(360).radians());
          let alpha_to =
            Angle.FromDegrees(270).radians() +
            fl * Angle.FromDegrees(360).radians();
          if (
            Math.abs(alpha - (alpha_to - Angle.FromDegrees(360).radians())) <
            Math.abs(alpha - alpha_to)
          )
            alpha_to = alpha_to - Angle.FromDegrees(360).radians();
          let speed = 80;
          setTimeout(
            () => (arcRotateCamera as any).spinTo("target", flat_target, speed),
            0
          );
          setTimeout(
            () => (arcRotateCamera as any).spinTo("beta", 0, speed),
            0
          );
          setTimeout(
            () => (arcRotateCamera as any).spinTo("alpha", alpha_to, speed),
            0
          );
          app?.classList.toggle("aside");
        } else if (this._state == State.FLAT) {
          if (this.isUiVisible()) {
            hideui?.click();
          }
          this._scene.activeCamera = this._player.camera;
          this._state = State.COURT;
          app?.classList.toggle("aside");
        } else if (this._state == State.COURT) {
          if (!this.isUiVisible()) hideui?.click();
          let speed = 60;
          setTimeout(
            () =>
              (arcRotateCamera as any).spinTo("target", start_target, speed),
            0
          );
          setTimeout(
            () =>
              (arcRotateCamera as any).spinTo(
                "beta",
                Angle.FromDegrees(90).radians(),
                speed
              ),
            0
          );
          // await this._sleep(1000);
          // app?.classList.toggle("aside");
          this._scene.activeCamera = arcRotateCamera;
          this._state = State.START;
        }
      };
    let buzzer = document.getElementById("buzzer");
    if (buzzer)
      buzzer.onclick = () => {
        let sound = this._env.soundMap[Environment.BUZZER] as Sound;
        if (!sound.isPlaying) sound.play();
      };
    let bouncing = document.getElementById("bouncing");
    if (bouncing)
      bouncing.onclick = () => {
        let sound = this._env.soundMap[Environment.BALL_BOUNCING] as Sound;
        if (!sound.isPlaying) sound.play();
      };
    let defence = document.getElementById("defence");
    if (defence)
      defence.onclick = () => {
        let sound = this._env.soundMap[Environment.DEFENCE] as Sound;
        if (!sound.isPlaying) sound.play();
        else sound.stop();
      };
    let noise = document.getElementById("noise");
    if (noise)
      noise.onclick = () => {
        let sound = this._env.soundMap[Environment.NOISE] as Sound;
        if (!sound.isPlaying) sound.play();
        else sound.stop();
      };
    return arcRotateCamera;
  }
}
new App();
