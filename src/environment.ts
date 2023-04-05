import {
  Scene,
  Vector3,
  SceneLoader,
  Sound,
  AbstractMesh,
  MeshBuilder,
  PBRMaterial,
  CubeTexture,
  BackgroundMaterial,
  Texture,
  Color3,
  Angle,
} from "@babylonjs/core";

export class Environment {
  public root!: AbstractMesh;

  constructor(private _scene: Scene) {}

  public static readonly BALL_BOUNCING: string = "ball-bouncing-to-a-stop.wav";
  public static readonly BUZZER: string = "buzzer.wav";
  public static readonly DEFENCE: string = "defence.wav";
  public static readonly NOISE: string = "noise.wav";
  public soundMap: any = {};

  public isDay!: Boolean;
  public isNight!: Boolean;

  private _skyboxMtl!: PBRMaterial;
  private _dayTextureSkybox!: CubeTexture;
  private _dayTextureEnv!: CubeTexture;
  private _nightTextureSkybox!: CubeTexture;
  private _nightTextureEnv!: CubeTexture;

  public async load() {
    // Mesh
    const assets = await this._loadMeshes();
    //Loop through all environment meshes that were imported
    assets.allMeshes.forEach((m) => {
      m.receiveShadows = true;
      m.checkCollisions = true;
    });
    // Walls
    let courtWidth = 48;
    let courtLength = 80;
    let wallHeight = 20;
    let wall0 = MeshBuilder.CreatePlane(
      "wall0",
      { width: courtWidth, height: wallHeight },
      this._scene
    );
    wall0.position = new Vector3(0, wallHeight / 2, courtLength / 2);
    wall0.rotation = new Vector3(0, Angle.FromDegrees(180).radians(), 0);
    let wall1 = MeshBuilder.CreatePlane(
      "wall1",
      { width: courtLength, height: wallHeight },
      this._scene
    );
    wall1.position = new Vector3(courtWidth / 2, wallHeight / 2, 0);
    wall1.rotation = new Vector3(0, Angle.FromDegrees(270).radians(), 0);
    let wall2 = MeshBuilder.CreatePlane(
      "wall2",
      { width: courtWidth, height: wallHeight },
      this._scene
    );
    wall2.position = new Vector3(0, wallHeight / 2, -courtLength / 2);
    let wall3 = MeshBuilder.CreatePlane(
      "wall3",
      { width: courtLength, height: wallHeight },
      this._scene
    );
    wall3.position = new Vector3(-courtWidth / 2, wallHeight / 2, 0);
    wall3.rotation = new Vector3(0, Angle.FromDegrees(90).radians(), 0);
    wall0.checkCollisions = true;
    wall1.checkCollisions = true;
    wall2.checkCollisions = true;
    wall3.checkCollisions = true;
    wall0.isVisible = false;
    wall1.isVisible = false;
    wall2.isVisible = false;
    wall3.isVisible = false;
    wall0.parent = this.root;
    wall1.parent = this.root;
    wall2.parent = this.root;
    wall3.parent = this.root;
    // lights and textures
    let skybox = MeshBuilder.CreateBox("skybox", { size: 1000 }, this._scene);
    this._skyboxMtl = new PBRMaterial("skyboxMtl", this._scene);
    this._skyboxMtl.backFaceCulling = false;
    this._dayTextureSkybox = CubeTexture.CreateFromPrefilteredData(
      "day.env",
      this._scene
    );
    this._dayTextureEnv = CubeTexture.CreateFromPrefilteredData(
      "day.env",
      this._scene
    );
    this._nightTextureSkybox = CubeTexture.CreateFromPrefilteredData(
      "night.env",
      this._scene
    );
    this._nightTextureEnv = new CubeTexture("night.env", this._scene);
    skybox.material = this._skyboxMtl;
    this.dayMode();

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

  public dayMode(): void {
    this._skyboxMtl.reflectionTexture = this._dayTextureSkybox;
    this._skyboxMtl.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    this._skyboxMtl.reflectivityColor = new Color3(0.66, 0.66, 0.66);
    this._skyboxMtl.microSurface = 0.7;
    this._scene.environmentTexture = this._dayTextureEnv;
    this.isDay = true;
    this.isNight = false;
  }

  public nightMode(): void {
    this._skyboxMtl.reflectionTexture = this._nightTextureSkybox;
    this._skyboxMtl.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    this._skyboxMtl.reflectivityColor = new Color3(0.66, 0.66, 0.66);
    this._skyboxMtl.microSurface = 0.7;
    this._scene.environmentTexture = this._nightTextureEnv;
    this.isNight = true;
    this.isDay = false;
  }

  private _loadSounds(): void {
    let buzzer_distance = 50;
    let buzzer_position = new Vector3(0, 15, 0);
    let buzzer = new Sound(
      Environment.BUZZER,
      "/sound/" + Environment.BUZZER,
      this._scene,
      () => {},
      {
        loop: false,
        autoplay: false,
        spatialSound: true,
        maxDistance: buzzer_distance,
      }
    );
    buzzer.setPosition(buzzer_position);
    this.soundMap[Environment.BUZZER] = buzzer;
    // let sphereMat = new StandardMaterial("sphereMat", this._scene);
    // sphereMat.diffuseColor = Color3.Purple();
    // sphereMat.backFaceCulling = false;
    // sphereMat.alpha = 0.3;
    // let sphereMusic1 = MeshBuilder.CreateSphere(
    //   "buzzerSphere",
    //   { segments: 20, diameter: buzzer_distance * 2 },
    //   this._scene
    // );
    // sphereMusic1.material = sphereMat;
    // sphereMusic1.position = buzzer_position;

    let bouncing_distance = 50;
    let bouncing_position = new Vector3(0, 15, 0);
    let bouncing = new Sound(
      Environment.BALL_BOUNCING,
      "/sound/" + Environment.BALL_BOUNCING,
      this._scene,
      () => {},
      {
        loop: false,
        autoplay: false,
        spatialSound: true,
        maxDistance: bouncing_distance,
      }
    );
    bouncing.setPosition(bouncing_position);
    this.soundMap[Environment.BALL_BOUNCING] = bouncing;
    // let sphereMat = new StandardMaterial("sphereMat", this._scene);
    // sphereMat.diffuseColor = Color3.Purple();
    // sphereMat.backFaceCulling = false;
    // sphereMat.alpha = 0.3;
    // let sphereMusic1 = MeshBuilder.CreateSphere(
    //   "buzzerSphere",
    //   { segments: 20, diameter: bouncing_distance * 2 },
    //   this._scene
    // );
    // sphereMusic1.material = sphereMat;
    // sphereMusic1.position = bouncing_position;

    let defence_distance = 200;
    let defence = new Sound(
      Environment.DEFENCE,
      "/sound/" + Environment.DEFENCE,
      this._scene,
      () => {},
      {
        loop: false,
        autoplay: false,
        spatialSound: true,
        maxDistance: defence_distance,
      }
    );
    let defence_anchor = MeshBuilder.CreateSphere(
      "defence_anchor",
      { segments: 20, diameter: 1 },
      this._scene
    );
    defence_anchor.isVisible = false;
    defence_anchor.position = new Vector3(50, 0, 0);
    defence.attachToMesh(defence_anchor);
    defence.setDirectionalCone(90, 180, 0.5);
    defence.setLocalDirectionToMesh(new Vector3(0, 0, -1));
    this.soundMap[Environment.DEFENCE] = defence;

    let noise = new Sound(
      Environment.NOISE,
      "/sound/" + Environment.NOISE,
      this._scene,
      () => {},
      {
        loop: true,
        autoplay: false,
      }
    );
    this.soundMap[Environment.NOISE] = noise;
  }
}
