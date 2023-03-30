import {
  Scene,
  Vector3,
  SceneLoader,
  Sound,
  Observable,
  AbstractMesh,
  MeshBuilder,
  PBRMaterial,
  CubeTexture,
  BackgroundMaterial,
  Texture,
  Color3,
} from "@babylonjs/core";

export class Environment {
  public root!: AbstractMesh;

  constructor(private _scene: Scene) {}

  public static readonly SOUND_MAP_KEYS: any = {
    BALL_BOUNCING: "ball-bouncing-to-a-stop.wav",
    BUZZER: "buzzer.wav",
  };
  public soundMap: any = {};

  public onRun = new Observable();

  public async load() {
    // Mesh
    const assets = await this._loadMeshes();
    //Loop through all environment meshes that were imported
    assets.allMeshes.forEach((m) => {
      m.receiveShadows = true;
      m.checkCollisions = true;
    });

    // lights and textures
    // var hdrTexture = new HDRCubeTexture(
    //   "/img/skybox.jpg",
    //   this._scene,
    //   512
    // );
    var skybox = MeshBuilder.CreateBox("skybox", { size: 1000 }, this._scene);
    var skyboxMtl = new PBRMaterial("skyboxMtl", this._scene);
    skyboxMtl.backFaceCulling = false;
    skyboxMtl.reflectionTexture = CubeTexture.CreateFromPrefilteredData("environment.env", this._scene);
    skyboxMtl.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMtl.microSurface = 0.7;
    skyboxMtl.reflectivityColor = new Color3(0.66,0.66,0.66);
    skybox.material = skyboxMtl;
    // this._scene.createDefaultEnvironment({
    //   environmentTexture: "environment.env",
    // });
    this._scene.environmentTexture = CubeTexture.CreateFromPrefilteredData("environment.env", this._scene);

    let backgroundMaterial = new BackgroundMaterial(
      "backgroundMaterial",
      this._scene
    );
    backgroundMaterial.diffuseTexture = new Texture(
      "/img/ground-diffuse.png",
      this._scene
    );
    backgroundMaterial.diffuseTexture.hasAlpha = true;
    backgroundMaterial.opacityFresnel = false;
    backgroundMaterial.shadowLevel = 0.4;

    // let mirror = new MirrorTexture("mirror", 512, this._scene);
    // mirror.mirrorPlane = new Plane(0, -3, 0, 0);
    // mirror.renderList.push(this.root);
    // backgroundMaterial.reflectionTexture = mirror;
    // backgroundMaterial.reflectionFresnel = true;
    // backgroundMaterial.reflectionStandardFresnelWeight = 0.8;

    let ground = MeshBuilder.CreateGround(
      "displayGround",
      { width: 150, height: 150 },
      this._scene
    );
    ground.position = new Vector3(0, -3, 0);
    ground.material = backgroundMaterial;
    ground.receiveShadows = true;

    this._loadSounds();
  }

  //Load all necessary meshes for the environment
  public async _loadMeshes() {
    const result = await SceneLoader.ImportMeshAsync(
      null,
      "/",
      "school-court.glb",
      this._scene
    );
    this.root = result.meshes[0];
    let allMeshes = this.root.getChildMeshes();

    return {
      env: this.root, //reference to our entire imported glb (meshes and transform nodes)
      allMeshes: allMeshes, // all of the meshes that are in the environment
    };
  }

  private _loadSounds(): void {
    for (const key_arr of Object.entries(Environment.SOUND_MAP_KEYS)) {
      this.soundMap[key_arr[0]] = new Sound(
        key_arr[0],
        "/sound/" + key_arr[1],
        this._scene,
        () => {},
        {
          loop: true,
          autoplay: false,
          spatialSound: true,
          distanceModel: "exponential",
          rolloffFactor: 2,
        }
      );
      let sound = this.soundMap[key_arr[0]] as Sound;
      sound.setPosition(new Vector3(0, 0, 0));
    }

    // this.onRun.add(play => {
    //   if (play && !this.soundMap["BALL_BOUNCING"].isPlaying) {
    //     this.soundMap["BALL_BOUNCING"].play();
    //   } else if (!play && this.soundMap["BALL_BOUNCING"].isPlaying) {
    //     this.soundMap["BALL_BOUNCING"].stop();
    //     this.soundMap["BALL_BOUNCING"].isPlaying = false;
    //   }
    // });
  }
}
