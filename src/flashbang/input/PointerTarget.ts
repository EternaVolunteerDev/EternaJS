import {DisplayObject, InteractionEvent} from 'pixi.js';
import {SignalView} from 'signals';

/** Exposes signals for an interactive object */
export default interface PointerTarget {
    /** the DisplayObject associated with this PointerTarget */
    target: DisplayObject;

    /** Fired when a 'pointerover' event is dispatched on the object */
    pointerOver: SignalView<InteractionEvent>;

    /** Fired when a 'pointerout' event is dispatched on the object */
    pointerOut: SignalView<InteractionEvent>;

    /** Fired when a 'pointerdown' event is dispatched on the object */
    pointerDown: SignalView<InteractionEvent>;

    /** Fired when a 'pointermove' event is dispatched on the object */
    pointerMove: SignalView<InteractionEvent>;

    /** Fired when a 'pointerup' event is dispatched on the object */
    pointerUp: SignalView<InteractionEvent>;

    /** Fired when a 'pointerupoutside' event is dispatched on the object */
    pointerUpOutside: SignalView<InteractionEvent>;

    /** Fired when a 'pointercancel' event is dispatched on the object */
    pointerCancel: SignalView<InteractionEvent>;

    /** Fired when a 'pointertap' event is dispatched on the object */
    pointerTap: SignalView<InteractionEvent>;
}
