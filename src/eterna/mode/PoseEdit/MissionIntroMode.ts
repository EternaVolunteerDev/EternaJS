import {Container, Graphics, Point, Sprite} from "pixi.js";
import {AppMode} from "../../../flashbang/core/AppMode";
import {Flashbang} from "../../../flashbang/core/Flashbang";
import {DisplayObjectPointerTarget} from "../../../flashbang/input/DisplayObjectPointerTarget";
import {KeyCode} from "../../../flashbang/input/KeyCode";
import {EPars} from "../../EPars";
import {BitmapManager} from "../../resources/BitmapManager";
import {ConstraintBox} from "../../ui/ConstraintBox";
import {GameButton} from "../../ui/GameButton";
import {PoseThumbnail} from "../../ui/PoseThumbnail";
import {Fonts} from "../../util/Fonts";

export class MissionIntroMode extends AppMode {
    public constructor(puzzleName: string, puzzleDescription: string, puzzleThumbnails: number[][], constraintBoxes: ConstraintBox[]) {
        super();
        this._puzzleName = puzzleName;
        this._puzzleDescription = puzzleDescription;
        this._puzzleThumbnails = puzzleThumbnails;
        this._constraintBoxes = constraintBoxes;
    }

    protected setup(): void {
        super.setup();

        this._background = new Graphics();
        this.modeSprite.addChild(this._background);
        this.drawBackground();

        this._background.interactive = true;
        new DisplayObjectPointerTarget(this._background).pointerDown.connect(() => this.play());

        let moleculeImg: Sprite = Sprite.fromImage(BitmapManager.MissionBackgroundImage);
        this.modeSprite.addChild(moleculeImg);
        moleculeImg.position = new Point((Flashbang.stageWidth - moleculeImg.width) * 0.5, 0);

        let missionText = Fonts.std_light("MISSION", 48).color(0xFFCC00).build();
        this.modeSprite.addChild(missionText);
        missionText.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5,
            123);

        let descriptionLabel = Fonts.std_light(this._puzzleDescription).color(0xBCD8E3).fontSize(36).leading(50).build();
        this.modeSprite.addChild(descriptionLabel);
        descriptionLabel.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5,
            123 + missionText.height + 25);

        let playButton: GameButton = new GameButton()
            .up(BitmapManager.PlayImage)
            .over(BitmapManager.PlayImageOver)
            .down(BitmapManager.PlayImageHit);
        this.addObject(playButton, this.modeSprite);
        playButton.display.position = new Point(
            Flashbang.stageWidth - playButton.container.width - 91.5,
            Flashbang.stageHeight - 30 - playButton.container.height);
        this.regs.add(playButton.clicked.connect(() => this.play()));

        let bgImage: Sprite = Sprite.fromImage(BitmapManager.MissionPuzzleIdImage);
        this.modeSprite.addChild(bgImage);
        bgImage.position = new Point((Flashbang.stageWidth * 0.5) - 420.5, 0);

        let nameLabel = Fonts.std_light(this._puzzleName, 18).color(0xFFFFFF).letterSpacing(0).build();
        this.modeSprite.addChild(nameLabel);
        nameLabel.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5 + MissionIntroMode.PUZZLE_LABEL_X_MARGIN,
            MissionIntroMode.PUZZLE_LABEL_Y_MARGIN);
        let real_width: number = nameLabel.width;
        if (bgImage) {
            bgImage.width = real_width + MissionIntroMode.PUZZLE_LABEL_X_MARGIN * 2;
        }

        let goalsLabel = Fonts.std_light("GOAL", 24).color(0xffcc00).build();
        this.modeSprite.addChild(goalsLabel);
        goalsLabel.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5,
            367 + 15);

        this._goalsBG = Sprite.fromImage(BitmapManager.MissionPuzzleThumbnailImage);
        this.modeSprite.addChild(this._goalsBG);
        this._goalsBG.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5,
            367 + 60);

        this._goalsThumbnail = new Sprite();
        this.modeSprite.addChild(this._goalsThumbnail);
        this._goalsThumbnail.position = new Point(
            (Flashbang.stageWidth * 0.5) - 420.5 + 22.5,
            367 + 60 + 22.5);

        this._scrollUpButton = new GameButton().allStates(BitmapManager.ImgUpArrow).hotkey(KeyCode.ArrowUp);
        this._scrollUpButton.display.scale = new Point(0.15, 0.15);
        this._scrollUpButton.display.visible = false;
        this._scrollUpButton.display.position = new Point(
            (Flashbang.stageWidth * 0.5) + 420.5 - this._scrollUpButton.container.width - 30,
            367 + 40);
        this._scrollUpButton.clicked.connect(() => this.scrollUp());
        this.addObject(this._scrollUpButton, this.modeSprite);

        this._scrollDownButton = new GameButton().allStates(BitmapManager.ImgDownArrow).hotkey(KeyCode.ArrowDown);
        this._scrollDownButton.display.scale = new Point(0.15, 0.15);
        this._scrollDownButton.display.visible = false;
        this._scrollDownButton.display.position = new Point(
            (Flashbang.stageWidth * 0.5) + 420.5 - this._scrollDownButton.container.width - 30,
            Flashbang.stageHeight - 55 - playButton.container.height - this._scrollDownButton.container.height - 15);
        this._scrollDownButton.clicked.connect(() => this.scrollDown());
        this.addObject(this._scrollDownButton, this.modeSprite);

        this._constraintsLayer = new Container();
        this.modeSprite.addChild(this._constraintsLayer);
        this.setupConstraintScrollMask();

        this.addPuzzleThumbnails();
        this.addConstraintBoxes();
    }

    private addConstraintBoxes(): void {
        let yLoc: number = 367 + 60;
        for (let constraintBox of this._constraintBoxes) {
            this.addObject(constraintBox, this._constraintsLayer);

            constraintBox.show_big_text(false);
            constraintBox.flare(false);
            constraintBox.display.position = new Point(
                (Flashbang.stageWidth * 0.5) - 420.5 + this._goalsBG.width + 82,
                yLoc);
            yLoc += constraintBox.container.height + 10;
        }

        this._constraintsHeight = yLoc;
        this.updateConstraintScroll();
    }

    private addPuzzleThumbnails(): void {
        if (this._puzzleThumbnails.length > 1) {
            for (let ii: number = 0; ii < this._puzzleThumbnails.length; ++ii) {
                let thumbnailButton = new GameButton().label((ii + 1).toString(), 22);
                thumbnailButton.display.position = new Point(
                    (Flashbang.stageWidth * 0.5) - 420.5 + ii * (thumbnailButton.container.width + 20),
                    367 + 60 + this._goalsBG.height + 10);
                this.addObject(thumbnailButton, this.modeSprite);

                const set_hover_listener = (idx: number): void => {
                    thumbnailButton.pointerOver.connect(() => {
                        this.setPuzzleThumbnail(idx);
                    });
                };

                set_hover_listener(ii);
            }
        }

        this._curThumbnail = -1;
        this.setPuzzleThumbnail(0);
    }

    protected on_resize(): void {
        this.drawBackground();
        this.updateConstraintScroll();
        this.setupConstraintScrollMask();
    }

    private drawBackground(): void {
        this._background.clear();
        this._background.beginFill(0x000000);
        this._background.drawRect(0, 0, Flashbang.stageWidth, 367);
        this._background.endFill();

        this._background.beginFill(0x0A1E39, 0.95);
        this._background.drawRect(0, 367, Flashbang.stageWidth, Math.max(Flashbang.stageHeight - 367, 0));
        this._background.endFill();
    }

    private play(): void {
        this.modeStack.popMode();
    }

    private scrollUp(): void {
        this._constraintsLayer.y = Math.min(this._constraintsLayer.y + 10, 0);
    }

    private scrollDown(): void {
        let limit = -this._constraintsHeight + 367 + 60 + this._constraintBoxes[this._constraintBoxes.length - 1].container.height;
        this._constraintsLayer.y = Math.max(this._constraintsLayer.y - 10, limit);
    }

    private setPuzzleThumbnail(index: number): void {
        if (this._curThumbnail == index) {
            return;
        }
        this._curThumbnail = index;

        let target_pairs: number[] = this._puzzleThumbnails[index];
        let wrong_pairs: number[] = new Array(target_pairs.length);
        for (let ii = 0; ii < wrong_pairs.length; ii++) {
            wrong_pairs[ii] = -1;
        }
        let sequence: number[] = new Array(target_pairs.length);
        for (let ii = 0; ii < target_pairs.length; ii++) {
            sequence[ii] = EPars.RNABASE_ADENINE;
        }
        PoseThumbnail.drawToSprite(this._goalsThumbnail, sequence, target_pairs, 6, PoseThumbnail.THUMBNAIL_WRONG_COLORED, 0, wrong_pairs, false, 0);
    }

    private updateConstraintScroll(): void {
        const activate_scroll: boolean = this._constraintsHeight > Flashbang.stageHeight * 0.8;
        this._scrollUpButton.display.visible = activate_scroll;
        this._scrollDownButton.display.visible = activate_scroll;
    }

    private setupConstraintScrollMask(): void {
        if (this._constraintMask == null) {
            this._constraintMask = new Graphics();
            this.modeSprite.addChild(this._constraintMask);
        }

        let topY = this._scrollUpButton.display.y;
        let botY = this._scrollDownButton.display.y;

        this._constraintMask.clear();
        this._constraintMask.beginFill(0x00FF00, 0);
        this._constraintMask.drawRect(0, topY, Flashbang.stageWidth, botY + this._scrollDownButton.container.height - topY);
        this._constraintMask.x = 0;
        this._constraintMask.y = 0;
        this._constraintsLayer.mask = this._constraintMask;
    }

    private readonly _puzzleName: string;
    private readonly _puzzleDescription: string;
    private readonly _puzzleThumbnails: number[][];
    private readonly _constraintBoxes: ConstraintBox[];

    private _background: Graphics;

    private _goalsBG: Sprite;
    private _goalsThumbnail: Sprite;
    private _curThumbnail: number = 0;

    private _constraintsLayer: Container;
    private _constraintsHeight: number = 0.0;

    private _scrollUpButton: GameButton;
    private _scrollDownButton: GameButton;

    private _constraintMask: Graphics;

    private static readonly PUZZLE_LABEL_X_MARGIN: number = 15;
    private static readonly PUZZLE_LABEL_Y_MARGIN: number = 12;
}