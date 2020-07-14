import {JSONUtil, Assert} from 'flashbang';
import EPars from 'eterna/EPars';
import Plot, {PlotType} from 'eterna/Plot';
import Pose2D, {Oligo} from './pose2D/Pose2D';
import Folder from './folding/Folder';
import Utility from './util/Utility';

export interface FoldData {
    sequence_: number[];
    pairs_array_: Map<boolean, number[][]>;
    params_array_: Map<boolean, (number | number[])[][]>;
    stable_: boolean;
    target_oligo_: number[];
    target_oligos_: Oligo[];
    oligo_order_: number[];
    oligos_paired_: number;
    target_pairs_: number[];
    target_oligo_order_: number[];
    puzzle_locks_: boolean[];
    forced_struct_: number[];
    target_conditions_: TargetConditions;
}

// amw fuck a lot of these are optional
export interface TargetConditions {
    type: 'multistrand' | 'aptamer' | 'pseudoknot' | 'aptamer+oligo' | 'oligo' | 'single';
    secstruct: string;
    sequence?: string;
    IUPAC?: string;
    'custom-layout'?: [[number, number] | [null, null]];
    'custom-reference'?: string;
    'custom-numbering'?: string;
    oligo_concentration?: string | number; // the strings have to be convertible
    oligo_bind?: boolean;
    oligo_sequence?: string;
    oligo_label?: string; // really, 'T' | 'R'
    oligo_name?: string;
    concentration?: number;
    oligos?: OligoDef[];
    shift_locks?: string;
    shift_limit?: number;
    anti_secstruct?: string;
    structure_constrained_bases?: number[];
    anti_structure_constrained_bases?: number[];
    structure_constraints?: boolean[];
    anti_structure_constraints?: boolean[];
    site?: number[];
    fold_version?: number;
    fold_mode?: string; // this time it's '3'
    state_name?: string;
    force_struct?: string;
    binding_pairs?: number[];
    bonus?: number;
    malus?: number;
}

export interface OligoDef {
    sequence: string;
    malus: number;
    name: string;
    bind?: boolean;
    concentration?: string; // a Numberable one
    label?: string;
}

export enum UndoBlockParam {
    GU = 0,
    GC = 1,
    AU = 2,
    MFE = 3,
    REPETITION = 4,
    STACK = 5,
    FE = 6,
    DOTPLOT = 7,
    DOTPLOT_BITMAP = 8,
    MELTPLOT_BITMAP = 9,
    PROB_SCORE = 10,
    MELTING_POINT = 11,
    PAIR_SCORE = 12,
    NNFE_ARRAY = 13,
    MAX = 14,
    ANY_PAIR = 15,
}

type Param = (number | number[]);

export default class UndoBlock {
    constructor(seq: number[]) {
        this._sequence = seq.slice();
        this._pairsArray.set(false, []);
        this._pairsArray.set(true, []);
        this._paramsArray.set(false, []);
        this._paramsArray.set(true, []);
    }

    public toJSON(): FoldData {
        // TODO: Updating this requires changing all content in the DB AND
        // migrating all autosave content on boot for however long we want to allow
        // players to migrate their autosaves
        /* eslint-disable @typescript-eslint/camelcase */
        return {
            sequence_: this._sequence,
            pairs_array_: this._pairsArray,
            params_array_: this._paramsArray,
            stable_: this._stable,
            target_oligo_: this._targetOligo,
            target_oligos_: this._targetOligos,
            oligo_order_: this._oligoOrder,
            oligos_paired_: this._oligosPaired,
            target_pairs_: this._targetPairs,
            target_oligo_order_: this._targetOligoOrder,
            puzzle_locks_: this._puzzleLocks,
            forced_struct_: this._forcedStruct,
            target_conditions_: this.targetConditions // use the getter so we convert
        };
        /* eslint-enable @typescript-eslint/camelcase */
    }

    public fromJSON(json: FoldData): void {
        try {
            this._sequence = json.sequence_;// JSONUtil.require(json, 'sequence_');
            this._pairsArray = json.pairs_array_;// JSONUtil.require(json, 'pairs_array_');
            this._paramsArray = json.params_array_;// JSONUtil.require(json, 'params_array_');
            this._stable = json.stable_;// JSONUtil.require(json, 'stable_');
            this._targetOligo = json.target_oligo_;// JSONUtil.require(json, 'target_oligo_');
            this._targetOligos = json.target_oligos_;// JSONUtil.require(json, 'target_oligos_');
            this._oligoOrder = json.oligo_order_;// JSONUtil.require(json, 'oligo_order_');
            this._oligosPaired = json.oligos_paired_;// JSONUtil.require(json, 'oligos_paired_');
            this._targetPairs = json.target_pairs_;// JSONUtil.require(json, 'target_pairs_');
            this._targetOligoOrder = json.target_oligo_order_; // JSONUtil.require(json, 'target_oligo_order_');
            this._puzzleLocks = json.puzzle_locks_;// JSONUtil.require(json, 'puzzle_locks_');
            this._forcedStruct = json.forced_struct_;// JSONUtil.require(json, 'forced_struct_');
            this.targetConditions = json.target_conditions_;// JSONUtil.require(json, 'target_conditions_'); // setter
        } catch (e) {
            throw new Error(`Error parsing UndoBlock JSON: ${e}`);
        }
    }

    public get targetOligos(): Oligo[] | null {
        return this._targetOligos;
    }

    public set targetOligos(targetOligos: Oligo[] | null) {
        this._targetOligos = targetOligos == null ? null : JSON.parse(JSON.stringify(targetOligos));
    }

    public get targetOligo(): number[] | null {
        return this._targetOligo;
    }

    public set targetOligo(targetOligo: number[] | null) {
        this._targetOligo = targetOligo == null ? null : targetOligo.slice();
    }

    public get oligoMode(): number {
        let tc: TargetConditions | null = this.targetConditions;
        if (tc == null) return 0;
        return tc['fold_mode'] == null ? Pose2D.OLIGO_MODE_DIMER : Number(tc['fold_mode']);
    }

    public get oligoName(): string | null {
        let tc: TargetConditions | null = this.targetConditions;
        if (tc == null) {
            return null;
        }
        return Object.prototype.hasOwnProperty.call(tc, 'oligo_name') ? tc['oligo_name'] : null;
    }

    public get oligoOrder(): number[] | null {
        return this._oligoOrder;
    }

    public set oligoOrder(oligoOrder: number[] | null) {
        this._oligoOrder = oligoOrder == null ? null : oligoOrder.slice();
    }

    public get oligosPaired(): number {
        return this._oligosPaired;
    }

    public set oligosPaired(oligosPaired: number) {
        this._oligosPaired = oligosPaired;
    }

    public get targetPairs(): number[] {
        return this._targetPairs;
    }

    public set targetPairs(targetPairs: number[]) {
        this._targetPairs = targetPairs.slice();
    }

    public get targetOligoOrder(): number[] | null {
        return this._targetOligoOrder;
    }

    public set targetOligoOrder(oligoOrder: number[] | null) {
        this._targetOligoOrder = oligoOrder == null ? null : oligoOrder.slice();
    }

    public get sequence(): number[] {
        return this._sequence;
    }

    public set sequence(seq: number[]) {
        this._sequence = seq.slice();
    }

    public get puzzleLocks(): boolean[] | null {
        return this._puzzleLocks;
    }

    public set puzzleLocks(locks: boolean[] | null) {
        this._puzzleLocks = locks;
    }

    public get forcedStruct(): number[] {
        return this._forcedStruct;
    }

    public set forcedStruct(forced: number[]) {
        this._forcedStruct = forced;
    }

    public get targetConditions(): TargetConditions | null {
        return (this._targetConditions == null ? null : JSON.parse(this._targetConditions));
    }

    public set targetConditions(conditions: TargetConditions | null) {
        this._targetConditions = JSON.stringify(conditions);
    }

    public get stable(): boolean {
        return this._stable;
    }

    public set stable(stable: boolean) {
        this._stable = stable;
    }

    public getPairs(temp: number = 37, pseudoknots: boolean = false): number[] {
        const pairsArray = this._pairsArray.get(pseudoknots);
        Assert.assertIsDefined(pairsArray);
        return pairsArray[temp];
    }

    public getParam(index: UndoBlockParam, temp: number = 37, pseudoknots: boolean = false): number | number[] {
        const paramsArray = this._paramsArray.get(pseudoknots);
        Assert.assertIsDefined(paramsArray);
        if (paramsArray[temp] != null) {
            return paramsArray[temp][index];
        } else {
            return undefined;
        }
    }

    public setPairs(pairs: number[], temp: number = 37, pseudoknots: boolean = false): void {
        const pairsArray = this._pairsArray.get(pseudoknots);
        Assert.assertIsDefined(pairsArray);
        pairsArray[temp] = pairs.slice();
    }

    public setParam(index: UndoBlockParam, val: number | number[], temp: number = 37, pseudoknots: boolean = false): void {
        const paramsArray = this._paramsArray.get(pseudoknots);
        Assert.assertIsDefined(paramsArray);
        if (paramsArray[temp] == null) {
            paramsArray[temp] = [];
        }
        paramsArray[temp][index] = val;
    }

    public setBasics(folder: Folder, temp: number = 37, pseudoknots: boolean = false): void {
        let bestPairs: number[];
        let seq: number[] = this._sequence;
        bestPairs = this.getPairs(temp, pseudoknots);
        this.setParam(UndoBlockParam.GU, EPars.numGUPairs(seq, bestPairs), temp, pseudoknots);
        this.setParam(UndoBlockParam.GC, EPars.numGCPairs(seq, bestPairs), temp, pseudoknots);
        this.setParam(UndoBlockParam.AU, EPars.numUAPairs(seq, bestPairs), temp, pseudoknots);
        this.setParam(UndoBlockParam.ANY_PAIR, EPars.numPairs(bestPairs), temp, pseudoknots);
        this.setParam(UndoBlockParam.STACK, EPars.getLongestStackLength(bestPairs), temp, pseudoknots);
        this.setParam(UndoBlockParam.REPETITION, EPars.getSequenceRepetition(
            EPars.sequenceToString(seq), 5
        ), temp, pseudoknots);

        let fullSeq: number[] = seq.slice();
        if (this._targetOligo) {
            if (this.oligoMode === Pose2D.OLIGO_MODE_DIMER) fullSeq.push(EPars.RNABASE_CUT);
            if (this.oligoMode === Pose2D.OLIGO_MODE_EXT5P) {
                fullSeq = this._targetOligo.concat(fullSeq);
            } else {
                fullSeq = fullSeq.concat(this._targetOligo);
            }
        } else if (this._targetOligos) {
            Assert.assertIsDefined(this._oligoOrder);
            for (let ii = 0; ii < this._targetOligos.length; ii++) {
                fullSeq.push(EPars.RNABASE_CUT);
                fullSeq = fullSeq.concat(this._targetOligos[this._oligoOrder[ii]].sequence);
            }
        }
        let nnfe: number[] = [];
        let totalFE = folder.scoreStructures(fullSeq, bestPairs, pseudoknots, temp, nnfe);

        this.setParam(UndoBlockParam.FE, totalFE, temp, pseudoknots);
        this.setParam(UndoBlockParam.NNFE_ARRAY, nnfe, temp, pseudoknots);
    }

    public updateMeltingPointAndDotPlot(folder: Folder, pseudoknots: boolean = false): void {
        if (this.getParam(UndoBlockParam.DOTPLOT, 37, pseudoknots) == null) {
            let dotArray: number[] | null = folder.getDotPlot(this.sequence, this.getPairs(37), 37, pseudoknots);
            this.setParam(UndoBlockParam.DOTPLOT, dotArray, 37, pseudoknots);
            this._dotPlotData = dotArray ? dotArray.slice() : null;
        }

        for (let ii = 37; ii < 100; ii += 10) {
            if (this.getPairs(ii) == null) {
                let pairs = folder.foldSequence(this.sequence, null, null, pseudoknots, ii);
                Assert.assertIsDefined(pairs);
                this.setPairs(pairs, ii, pseudoknots);
            }

            if (this.getParam(UndoBlockParam.DOTPLOT, ii) == null) {
                let dotTempArray: number[] | null = folder.getDotPlot(
                    this.sequence,
                    this.getPairs(ii),
                    ii,
                    pseudoknots
                );
                Assert.assertIsDefined(dotTempArray);
                this.setParam(UndoBlockParam.DOTPLOT, dotTempArray, ii, pseudoknots);
            }
        }

        let refPairs: number[] = this.getPairs(37, pseudoknots);

        let pairScores: number[] = [];
        let maxPairScores: number[] = [];

        for (let ii = 37; ii < 100; ii += 10) {
            if (this.getParam(UndoBlockParam.PROB_SCORE, ii)) {
                pairScores.push(1 - (this.getParam(UndoBlockParam.PAIR_SCORE, ii, pseudoknots) as number));
                maxPairScores.push(1.0);
                continue;
            }
            let curDat: number[] = this.getParam(UndoBlockParam.DOTPLOT, ii, pseudoknots) as number[];
            let curPairs: number[] = this.getPairs(ii, pseudoknots);
            let probScore = 0;
            let scoreCount = 0;

            for (let jj = 0; jj < curDat.length; jj += 3) {
                let indexI: number = curDat[jj] - 1;
                let indexJ: number = curDat[jj + 1] - 1;

                if (indexI < indexJ) {
                    if (refPairs[indexI] === indexJ) {
                        probScore += Number(curDat[jj + 2]);
                        scoreCount++;
                    }
                } else if (indexJ < indexI) {
                    if (refPairs[indexJ] === indexI) {
                        probScore += Number(curDat[jj + 2]);
                        scoreCount++;
                    }
                }
            }

            if (scoreCount > 0) {
                probScore /= scoreCount;
            }

            let numPaired = 0;
            for (let jj = 0; jj < curPairs.length; jj++) {
                if (curPairs[jj] > jj) {
                    numPaired += 2;
                }
            }
            let pairScore: number = Number(numPaired) / refPairs.length;

            pairScores.push(1 - pairScore);
            maxPairScores.push(1.0);

            this.setParam(UndoBlockParam.PROB_SCORE, probScore, ii, pseudoknots);
            this.setParam(UndoBlockParam.PAIR_SCORE, pairScore, ii, pseudoknots);
        }

        this._meltPlotPairScores = pairScores;
        this._meltPlotMaxPairScores = maxPairScores;

        let initScore: number = this.getParam(UndoBlockParam.PROB_SCORE, 37, pseudoknots) as number;

        let meltpoint = 107;
        for (let ii = 47; ii < 100; ii += 10) {
            let currentScore: number = this.getParam(UndoBlockParam.PROB_SCORE, ii, pseudoknots) as number;
            if (currentScore < initScore * 0.5) {
                meltpoint = ii;
                break;
            }
        }

        this.setParam(UndoBlockParam.MELTING_POINT, meltpoint, 37, pseudoknots);
    }

    public createDotPlot(): Plot {
        let plot = new Plot(PlotType.SCATTER);
        plot.set2DData(this._dotPlotData, this._sequence.length);
        return plot;
    }

    public createMeltPlot(): Plot {
        let plot = new Plot(PlotType.LINE);
        plot.setData(this._meltPlotPairScores, this._meltPlotMaxPairScores);
        return plot;
    }

    /**
     * Return map of current base indices to adjusted base indices when oligos are rearranged
     * according to otherorder
     * @param otherOrder An array of indexes, where the index refers to the new index
     * the oligo at the given position in the old array should be placed at.
     * E.g., given oligos in order A B C, [1,2,0] means their new order should be C, A, B
     * (oligo A, with the old index of 0, should be at new index 1)
     */
    public reorderedOligosIndexMap(otherOrder: number[] | null): number[] | null {
        if (this._targetOligos == null) return null;

        let originalIndices: number[][] = [];
        let oligoFirstBaseIndex = this._sequence.length;

        for (let oligo of this._targetOligos) {
            // The + 1 is used to account for the "cut" base denoting split points between strands
            originalIndices.push(Utility.range(oligoFirstBaseIndex, oligoFirstBaseIndex + oligo.sequence.length + 1));
            oligoFirstBaseIndex += oligo.sequence.length + 1;
        }

        let newOrder = otherOrder || Utility.range(this._targetOligos.length);

        return Utility.range(this._sequence.length).concat(
            ...Utility.range(this._targetOligos.length).map((idx) => originalIndices[newOrder.indexOf(idx)])
        );
    }

    private _sequence: number[];
    private _pairsArray: Map<boolean, number[][]> = new Map<boolean, number[][]>();
    private _paramsArray: Map<boolean, (number | number[])[][]> = new Map<boolean, Param[][]>();
    private _stable: boolean = false;
    private _targetOligo: number[] | null = null;
    private _targetOligos: Oligo[] | null = null;
    private _oligoOrder: number[] | null = null;
    private _oligosPaired: number = 0;
    private _targetPairs: number[] = [];
    private _targetOligoOrder: number[] | null = null;
    private _puzzleLocks: boolean[] | null = [];
    private _forcedStruct: number[] = [];
    private _targetConditions: string | null = null;

    private _dotPlotData: number[] | null;
    private _meltPlotPairScores: number[];
    private _meltPlotMaxPairScores: number[];
}
