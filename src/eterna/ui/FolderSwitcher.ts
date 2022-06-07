import {ContainerObject, Assert} from 'flashbang';
import Folder from 'eterna/folding/Folder';
import FolderManager from 'eterna/folding/FolderManager';
import {MappedValue, ValueView} from 'signals';
import {Sprite} from 'pixi.js';
import Bitmaps from 'eterna/resources/Bitmaps';
import BitmapManager from 'eterna/resources/BitmapManager';
import GameDropdown from './GameDropdown';

export default class FolderSwitcher extends ContainerObject {
    public readonly selectedFolder: ValueView<Folder>;

    constructor(canUseFolder?: ((folder: Folder) => boolean), defaultFolder?: Folder, allowChange: boolean = true) {
        super();

        this._canUseFolder = canUseFolder;

        this._dropdown = new GameDropdown({
            fontSize: 14,
            options: FolderManager.instance.getFolders(this._canUseFolder),
            defaultOption: defaultFolder?.name || FolderManager.instance.getFolders(this._canUseFolder)[0],
            borderWidth: 0,
            height: 32,
            color: 0x043468,
            textColor: 0xFFFFFF,
            dropShadow: true
        });

        if (!allowChange) {
            this._dropdown.disabled = true;
        }

        this.selectedFolder = MappedValue.create(
            this._dropdown.selectedOption,
            (name) => {
                const folder = FolderManager.instance.getFolder(name);
                // We're assured this folder will exist because the dropdown options generated by
                // FolderManager.instance.getFolders are all valid, and we ensure no other values
                // are assigned to the underlying dropdown
                Assert.assertIsDefined(folder);
                return folder;
            }
        );
    }

    protected added() {
        const icon = new Sprite(BitmapManager.getBitmap(Bitmaps.ImgFoldingEngine));
        icon.width = 24;
        icon.height = 24;
        this.display.addChild(icon);
        icon.position.set(0, (32 - icon.height) / 2);
        this._dropdown.display.position.x = 32;
        this.addObject(this._dropdown, this.display);
    }

    public changeFolder(folderName: string): boolean {
        if (this.selectedFolder.value.name === folderName) return true;

        const folder = FolderManager.instance.getFolder(folderName);
        if (!folder || (this._canUseFolder && !this._canUseFolder(folder))) return false;

        this._dropdown.selectedOption.value = folderName;
        return true;
    }

    private _canUseFolder?: (folder: Folder) => boolean;

    private _dropdown: GameDropdown;
}
