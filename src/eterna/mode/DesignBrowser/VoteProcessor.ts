import Eterna from 'eterna/Eterna';
import int from 'eterna/util/int';
import SolutionManager from 'eterna/puzzle/SolutionManager';

export interface VoteData {
    solnid: string; // Numberable
    uid: string; // ditto
    count: number;
}

export default class VoteProcessor {
    constructor(maxVotes: number) {
        this._maxVotes = maxVotes;
    }

    public processData(data: VoteData[]): void {
        const solutionIDs: number[] = [];
        const voteCounts: number[] = [];
        const myVoteCounts: number[] = [];
        let totalMyVotes = 0;

        this._votesLeft = 0;

        for (let ii = data.length - 1; ii >= 0; ii--) {
            const obj: VoteData = data[ii];

            const nid = Number(obj['solnid']);
            const isMine: boolean = Eterna.playerID === Number(obj['uid']);
            const voteCount: number = int(obj['count']);

            const index = solutionIDs.indexOf(nid);

            if (index < 0) {
                solutionIDs.push(nid);
                voteCounts.push(voteCount);
                if (isMine) {
                    myVoteCounts.push(voteCount);
                    totalMyVotes += voteCount;
                } else {
                    myVoteCounts.push(0);
                }
            } else {
                voteCounts[index] += voteCount;
                if (isMine) {
                    myVoteCounts[index] += voteCount;
                    totalMyVotes += voteCount;
                }
            }
        }

        for (const solution of SolutionManager.instance.solutions) {
            const idx = solutionIDs.indexOf(solution.nodeID);
            if (idx >= 0) {
                solution.setNumVotes(voteCounts[idx], myVoteCounts[idx]);
            }
        }

        this._votesLeft = this._maxVotes - totalMyVotes;
    }

    public get votesLeft(): number {
        return this._votesLeft;
    }

    public updateVotes(puznid: number, round: number): Promise<void> {
        return Eterna.client.getPuzzleVotes(puznid, round).then((json) => {
            // let data:  = json['data']['votes'];
            this.processData(json.data.votes);
        });
    }

    private _votesLeft: number = 0;
    private readonly _maxVotes: number;
}
