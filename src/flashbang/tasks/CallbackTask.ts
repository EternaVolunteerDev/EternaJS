import {ObjectTask} from "../core/ObjectTask";

/** A Task that calls a function once and then completes. */
export class CallbackTask extends ObjectTask {
    constructor(callback: () => void) {
        super();
        this._callback = callback;
    }

    /*override*/
    protected added(): void {
        this._callback();
        this.destroySelf();
    }

    private readonly _callback: () => void;
}
