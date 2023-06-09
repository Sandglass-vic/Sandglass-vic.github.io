import {
  Scene,
  ActionManager,
  ExecuteCodeAction,
  Scalar,
} from "@babylonjs/core";

export class InputController {
  public inputMap: any;
  //simple movement
  public horizontal: number = 0;
  public vertical: number = 0;
  //tracks whether or not there is movement in that axis
  public horizontalAxis: number = 0;
  public verticalAxis: number = 0;
  public dash: boolean = false;
  public jump: boolean = false;

  constructor(scene: Scene) {

    scene.actionManager = new ActionManager(scene);

    this.inputMap = {};
    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
      })
    );
    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
      })
    );

    scene.onBeforeRenderObservable.add(() => {
      this._updateFromKeyboard();
    });
  }

  private _updateFromKeyboard(): void {
    if (this.inputMap["w"]) {
      this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
      this.verticalAxis = 1;
    } else if (this.inputMap["s"]) {
      this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
      this.verticalAxis = -1;
    } else {
      this.vertical = 0;
      this.verticalAxis = 0;
    }

    if (this.inputMap["a"]) {
      this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
      this.horizontalAxis = -1;
    } else if (this.inputMap["d"]) {
      this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
      this.horizontalAxis = 1;
    } else {
      this.horizontal = 0;
      this.horizontalAxis = 0;
    }

    //dash
    if (this.inputMap["Shift"]) {
      this.dash = true;
    } else {
      this.dash = false;
    }

    //Jump Checks (SPACE)
    if (this.inputMap[" "]) {
      this.jump = true;
    } else {
      this.jump = false;
    }
  }
}
