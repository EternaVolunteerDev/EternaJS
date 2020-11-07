import {DisplayObject, Graphics, Point} from 'pixi.js';
import {
    GameObject, LateUpdatable, Arrays
} from 'flashbang';
import pchip from 'pchip';
import Pose2D from './Pose2D';

/** BaseRope: A class for drawing a smooth 'rope' through bases. * */
export default class BaseRope extends GameObject implements LateUpdatable {
    constructor(pose: Pose2D) {
        super();
        this._pose = pose;
        this._graphics = new Graphics();
        this._enabled = false;
    }

    public get display(): DisplayObject {
        return this._graphics;
    }

    public set enabled(value: boolean) {
        if (value === this._enabled) {
            return;
        }
        this._enabled = value;
    }

    public lateUpdate(_dt: number): void {
        for (let i = 0; i < this._pose.fullSequence.length; i++) {
            if (this._pose.getBase(i).isAnimating) {
                this.redraw(false);
                return;
            }
        }
    }

    public redraw(forceBaseXY: boolean): void {
        if (!this._enabled) {
            // clear if not cleared.
            // AMW: Protected in Pixi v5. Clear unconditionally for now.
            // if (this._graphics.currentPath !== null)
            this._graphics.clear();
            return;
        }

        const idx: number[] = [];
        const basePosX: number[] = [];
        const basePosY: number[] = [];
        for (let i = 0; i < this._pose.fullSequence.length; i++) {
            let center: Point = this._pose.getBaseLoc(i);
            if (!forceBaseXY && !this._pose.getBase(i).needRedraw) {
                // this logic took a long time to figure out -- the event
                //  loop boolean settings are way too confusing -- rhiju.
                center = this._pose.getBase(i).getLastDrawnPos();
            }
            if (center) {
                idx.push(i);
                basePosX.push(center.x);
                basePosY.push(center.y);
            }
        }

        if (Arrays.shallowEqual(basePosX, this._lastBasePosX)
            && Arrays.shallowEqual(basePosY, this._lastBasePosY)
            /* && this._graphics.currentPath !== null */) {
            // base positions haven't changed, and baseRope has not been cleared,
            // so no need to update -- just return.
            return;
        }

        this._lastBasePosX = basePosX;
        this._lastBasePosY = basePosY;
        this.drawBaseRope(basePosX, basePosY);
    }

    /**
     * drawBaseRope()
     *  by drawing twice, can get a nice looking texture.
     *   draw thick line and thin line on top
     */
    private drawBaseRope(basePosX: number[], basePosY: number[]): void {
        // this math is the rate limiting thing.
        //  for zooms, pans, and changes between target/natural mode,
        //   it might be better to compute smooth ropes for beginning and final, and then
        //   interpolate in between...
        const interpBasePosXY = this.updateInterpBasePos(basePosX, basePosY);

        this._graphics.clear();
        const OUTER_ROPE_THICKNESS: number = 0.30 * Pose2D.ZOOM_SPACINGS[this._pose.zoomLevel];
        this._graphics.lineStyle(OUTER_ROPE_THICKNESS, 0x777777, 0.2);
        this.drawBaseRopeLine(interpBasePosXY);

        const INNER_ROPE_THICKNESS: number = 0.25 * Pose2D.ZOOM_SPACINGS[this._pose.zoomLevel];
        this._graphics.lineStyle(INNER_ROPE_THICKNESS, 0xE8E8E8, 0.2);
        this.drawBaseRopeLine(interpBasePosXY);
    }

    private drawBaseRopeLine(interpBasePosXY: Array<[number, number]>): void {
        this._graphics.moveTo(this._lastBasePosX[0], this._lastBasePosY[0]);
        for (const pt of interpBasePosXY) {
            this._graphics.lineTo(pt[0], pt[1]);
        }
    }

    /**
     * Currently allows use of cubic interpolation or Pchip -- if we are still using
     *   only Pchip in mid-2020, get rid of cubic, and consolidate functions.
     *
     * The most beautiful  solution would be to use planar elastica, either Euler's solution (which
     *   still requires a numerical integral) or numerical minmization of a discrete elastica--
     *
     *  Let rhiju know if you want to try it. =)
     */
    private updateInterpBasePos(basePosX: number[], basePosY: number[]): Array<[number, number]> {
        const smoothFactor = 5;
        // return this.updateInterpBasePosCubic( smoothFactor, basePosX, basePosY);
        return this.updateInterpBasePosPchip(smoothFactor, basePosX, basePosY);
    }

    /**
     * PCHIP ( Piecewise Cubic Hermite Interpolating Polynomial) interpolation between points.
     * A little choppier, but keeps lines in stacks straight.
     *  Note that this function updates the _interpBasePosX and _interpBasePosY class variables.
     * @param smoothFactor number of interpolation points between each input point
     * @param basePosX input points' X values
     * @param basePosY input points' Y values
     */
    private updateInterpBasePosPchip(smoothFactor: number, basePosX: number[], basePosY: number[]):
    Array<[number, number]> {
        const interpBasePosX = this.interpPchip(smoothFactor, basePosX);
        const interpBasePosY = this.interpPchip(smoothFactor, basePosY);
        const interpBasePosXY: Array<[number, number]> = interpBasePosX.map((x, idx) => [x, interpBasePosY[idx]]);
        return interpBasePosXY;
    }

    private interpPchip(smoothFactor: number, points: number[]): number[] {
        // have to pack in ii for pchip.fit
        const inputPoints = points.map((x, idx) => [idx, x]);
        const pchipFitPoints: Array<[number, number]> = pchip.fit(inputPoints, smoothFactor, 'shape_preserving');
        const interpBasePos = pchipFitPoints.map((x) => x[1]);
        return interpBasePos;
    }

    private readonly _pose: Pose2D;
    private readonly _graphics: Graphics;
    private _enabled: boolean;

    private _lastBasePosX: Array<number> = [];
    private _lastBasePosY: Array<number> = [];
}
