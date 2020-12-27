import {RNABase} from 'eterna/EPars';
import {
    SerialTask, AlphaTask, VisibleTask, Vector2
} from 'flashbang';
import GraphicsObject from 'flashbang/objects/GraphicsObject';

export default class LightRay extends GraphicsObject {
    public fadeIn(): void {
        this.display.alpha = 0;
        this.replaceNamedObject(LightRay.ANIM, new AlphaTask(1, 0.5));
    }

    public fadeOutAndHide(): void {
        this.replaceNamedObject(LightRay.ANIM, new SerialTask(
            new AlphaTask(0, 1.5),
            new VisibleTask(false)
        ));
    }

    public draw(v: Vector2, baseType: RNABase): void {
        const color = LightRay.getColor(baseType);

        const len: number = v.length;

        this._display.clear();
        this._display.lineStyle(0, 0, 0);

        this._display.beginFill(color, 0.8);
        this._display.moveTo(0, 2);
        this._display.lineTo(len, 30);
        for (let ii = 1; ii <= 7; ii++) {
            const lineAngle: number = (Math.PI * (ii - 4)) / 8;
            this._display.lineTo(len + Math.cos(lineAngle) * 30, -Math.sin(lineAngle) * 30);
        }

        this._display.lineTo(len, -30);
        this._display.lineTo(0, -2);
        this._display.endFill();

        this._display.rotation = v.angle;
    }

    private static getColor(baseType: number): number {
        if (baseType === RNABase.ADENINE) {
            return 0xFFFFAF;
        } else if (baseType === RNABase.URACIL) {
            return 0xA5A6FF;
        } else if (baseType === RNABase.GUANINE) {
            return 0xFFB8B8;
        } else if (baseType === RNABase.CYTOSINE) {
            return 0xAFFFAF;
        } else {
            return 0xFFFFFF;
        }
    }

    private static readonly ANIM = 'Anim';
}
