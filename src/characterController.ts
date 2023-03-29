import {
  Scene,
  Vector3,
  MeshBuilder,
  TransformNode,
  Mesh,
  Color3,
  Color4,
  UniversalCamera,
  Quaternion,
  AnimationGroup,
  ExecuteCodeAction,
  ActionManager,
  ParticleSystem,
  Texture,
  SphereParticleEmitter,
  Sound,
  Observable,
  ShadowGenerator,
  Camera,
  Matrix,
  ArcRotateCamera,
  StandardMaterial,
  PointLight,
  Ray,
} from "@babylonjs/core";
import { InputController } from "./inputController";

export class Player extends TransformNode {
  public camera;

  //Player
  public mesh: Mesh; //outer collisionbox of player

  //Camera
  private _camRoot: TransformNode;
  private _yTilt: TransformNode;

  // Movement
  private _moveDirection: Vector3 = Vector3.Zero();
  private _deltaTime: number = 0;
  private _h: number = 0;
  private _v: number = 0;
  private _inputAmt: number = 0;

  //gravity, ground detection, dashing, jumping
  private _gravity: Vector3 = new Vector3();
  private _lastGroundPos: Vector3 = Vector3.Zero(); // keep track of the last grounded position
  private _grounded: boolean = false;
  private _jumpCount: number = 1;
  private _dashTime: number = 0;
  private _dashing: boolean = false;
  private _dashCount: number = 1;

  private static readonly PLAYER_SPEED: number = 0.45;
  private static readonly JUMP_FORCE: number = 0.8;
  private static readonly MAX_JUMP: number = 1;
  private static readonly GRAVITY: number = -2.8;
  private static readonly DASH_FACTOR: number = 2.5;
  private static readonly DASH_TIME: number = 10; //how many frames the dash lasts
  private static readonly MAX_DASH: number = 1; //how many frames the dash lasts
  private static readonly DOWN_TILT: Vector3 = new Vector3(
    0.8290313946973066,
    0,
    0
  );
  private static readonly ORIGINAL_TILT: Vector3 = new Vector3(
    0.5934119456780721,
    0,
    0
  );

  constructor(public scene: Scene, private _input: InputController) {
    super("player", scene);
  }

  public async load() {
    this._createPlayerMesh();
    this._setupPlayerCamera();
  }

  public activatePlayerCamera(): UniversalCamera {
    this.scene.registerBeforeRender(() => {
      this._beforeRenderUpdate();
      this._updateCamera();
    });
    return this.camera;
  }

  private _createPlayerMesh() {
    const outer = MeshBuilder.CreateBox(
      "outer",
      { width: 2, depth: 1, height: 3 },
      this.scene
    );
    outer.isVisible = false;
    outer.isPickable = false;
    outer.checkCollisions = true;

    //move origin of box collider to the bottom of the mesh (to match imported player mesh)
    outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));
    //for collisions
    outer.ellipsoid = new Vector3(1, 1.5, 1);
    outer.ellipsoidOffset = new Vector3(0, 1.5, 0);

    outer.rotationQuaternion = new Quaternion(0, 1, 0, 0); // rotate the player mesh 180 since we want to see the back of the player
    var box = MeshBuilder.CreateBox(
      "Small1",
      {
        width: 0.5,
        depth: 0.5,
        height: 0.25,
        faceColors: [
          new Color4(0, 0, 0, 1),
          new Color4(0, 0, 0, 1),
          new Color4(0, 0, 0, 1),
          new Color4(0, 0, 0, 1),
          new Color4(0, 0, 0, 1),
          new Color4(0, 0, 0, 1),
        ],
      },
      this.scene
    );
    box.position.y = 1.5;
    box.position.z = 1;
    var body = MeshBuilder.CreateCylinder(
      "body",
      { height: 3, diameterTop: 2, diameterBottom: 2 },
      this.scene
    );
    var bodymtl = new StandardMaterial("red", this.scene);
    bodymtl.diffuseColor = new Color3(0.8, 0.5, 0.5);
    body.material = bodymtl;
    body.isPickable = false;
    // simulates the imported mesh's origin
    body.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));
    //parent the meshes
    box.parent = body;
    body.parent = outer;
    this.mesh = outer;
    this.mesh.parent = this;

    // add light to player
    // const light = new PointLight(
    //   "sparklight",
    //   new Vector3(0, 0, 0),
    //   this.scene
    // );
    // light.diffuse = new Color3(
    //   0.08627450980392157,
    //   0.10980392156862745,
    //   0.15294117647058825
    // );
    // light.intensity = 35;
    // light.radius = 1;
    // // add shadow
    // const shadowGenerator = new ShadowGenerator(1024, light);
    // shadowGenerator.darkness = 0.4;
    // shadowGenerator.addShadowCaster(outer);
  }

  private _setupPlayerCamera(): UniversalCamera {
    //root camera parent that handles positioning of the camera to follow the player
    this._camRoot = new TransformNode("root");
    this._camRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)
    //to face the player from behind (180 degrees)
    this._camRoot.rotation = new Vector3(0, Math.PI, 0);

    //rotations along the x-axis (up/down tilting)
    let yTilt = new TransformNode("ytilt");
    //adjustments to camera view to point down at our player
    yTilt.rotation = Player.ORIGINAL_TILT;
    this._yTilt = yTilt;
    yTilt.parent = this._camRoot;

    //our actual camera that's pointing at our root's position
    this.camera = new UniversalCamera(
      "cam",
      new Vector3(0, 0, -30),
      this.scene
    );
    this.camera.lockedTarget = this._camRoot.position;
    this.camera.fov = 0.47350045992678597;
    this.camera.parent = yTilt;

    return this.camera;
  }

  private _beforeRenderUpdate(): void {
    this._updateFromControls();
    this._updateGroundDetection();
  }

  private _updateFromControls(): void {
    this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

    this._moveDirection = Vector3.Zero(); // vector that holds movement information
    this._h = this._input.horizontal; //x-axis
    this._v = this._input.vertical; //z-axis

    // start dashing
    if (
      this._input.dash &&
      !this._dashing &&
      this._dashCount > 0 &&
      !this._grounded
    ) {
      this._dashCount--;
      this._dashing = true; //start the dash sequence
    }

    // during dash
    let dashFactor = 1;
    if (this._dashing) {
      if (this._dashTime > Player.DASH_TIME) {
        this._dashTime = 0;
        this._dashing = false;
      } else {
        dashFactor = Player.DASH_FACTOR;
      }
      this._dashTime++;
    }

    //--MOVEMENTS BASED ON CAMERA (as it rotates)--
    let fwd = this._camRoot.forward;
    let right = this._camRoot.right;
    let correctedVertical = fwd.scaleInPlace(this._v);
    let correctedHorizontal = right.scaleInPlace(this._h);

    //movement based off of camera's view
    let move = correctedHorizontal.addInPlace(correctedVertical);

    //clear y so that the character doesnt fly up, normalize for next step
    this._moveDirection = new Vector3(
      move.normalize().x,
      0,
      move.normalize().z
    );

    //clamp the input value so that diagonal movement isn't twice as fast
    let inputMag = Math.abs(this._h) + Math.abs(this._v);
    if (inputMag < 0) {
      this._inputAmt = 0;
    } else if (inputMag > 1) {
      this._inputAmt = 1;
    } else {
      this._inputAmt = inputMag;
    }

    //final movement that takes into consideration the inputs
    this._moveDirection = this._moveDirection.scaleInPlace(
      this._inputAmt * dashFactor * Player.PLAYER_SPEED
    );

    //Rotations
    //check if there is movement to determine if rotation is needed
    let input = new Vector3(
      this._input.horizontalAxis,
      0,
      this._input.verticalAxis
    ); //along which axis is the direction
    if (input.length() == 0) {
      //if there's no input detected, prevent rotation and keep player in same rotation
      return;
    }
    //rotation based on input & the camera angle
    let angle = Math.atan2(
      this._input.horizontalAxis,
      this._input.verticalAxis
    );
    angle += this._camRoot.rotation.y;
    let targ = Quaternion.FromEulerAngles(0, angle, 0);
    this.mesh.rotationQuaternion = Quaternion.Slerp(
      this.mesh.rotationQuaternion,
      targ,
      10 * this._deltaTime
    );
  }

  private _floorRaycast(
    offsetx: number,
    offsetz: number,
    raycastlen: number
  ): Vector3 {
    let raycastFloorPos = new Vector3(
      this.mesh.position.x + offsetx,
      this.mesh.position.y + 0.5,
      this.mesh.position.z + offsetz
    );
    let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

    let pick = this.scene.pickWithRay(ray, (mesh) => {
      return mesh.isPickable && mesh.isEnabled();
    });

    if (pick.hit) {
      return pick.pickedPoint;
    } else {
      return Vector3.Zero();
    }
  }

  private _isGrounded(): boolean {
    if (this._floorRaycast(0, 0, 0.6).equals(Vector3.Zero())) {
      return false;
    } else {
      return true;
    }
  }

  private _updateGroundDetection(): void {
    if (!this._isGrounded()) {
      this._gravity = this._gravity.addInPlace(
        Vector3.Up().scale(this._deltaTime * Player.GRAVITY)
      );
      this._grounded = false;
    }
    //limit the speed of gravity to the negative of the jump power
    if (this._gravity.y < -Player.JUMP_FORCE) {
      this._gravity.y = -Player.JUMP_FORCE;
    }
    this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));

    if (this._isGrounded()) {
      this._gravity.y = 0;
      this._grounded = true;
      this._lastGroundPos.copyFrom(this.mesh.position);

      this._jumpCount = Player.MAX_JUMP; //allow for jumping
      //dashing reset
      this._dashCount = Player.MAX_DASH; //the ability to dash
      //reset sequence(needed if we collide with the ground BEFORE actually completing the dash duration)
      this._dashTime = 0;
      this._dashing = false;
    }

    //Jump detection
    if (this._input.jump && this._jumpCount > 0) {
      this._gravity.y = Player.JUMP_FORCE;
      this._jumpCount--;
    }
  }

  private _updateCamera(): void {
    let centerPlayer = this.mesh.position.y + 2;
    this._camRoot.position = Vector3.Lerp(
      this._camRoot.position,
      new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z),
      0.4
    );
  }
}
