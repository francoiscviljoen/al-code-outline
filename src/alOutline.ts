import * as vscode from 'vscode';
import * as path from 'path';
import { ALSymbolInfo } from './alSymbolInfo';

export class ALOutlineProvider implements vscode.TreeDataProvider<ALSymbolInfo> {
    private extensionContext : vscode.ExtensionContext;
	private editor: vscode.TextEditor;
    private rootNode : ALSymbolInfo;
    private autoRefresh : boolean = true;
    
	private _onDidChangeTreeData: vscode.EventEmitter<ALSymbolInfo | null> = new vscode.EventEmitter<ALSymbolInfo | null>();
	readonly onDidChangeTreeData: vscode.Event<ALSymbolInfo | null> = this._onDidChangeTreeData.event;

    //------------------------------------------------------
    // initialization
    //------------------------------------------------------

    constructor(context : vscode.ExtensionContext) {
        this.extensionContext = context;

        //initialize change tracking event
		vscode.window.onDidChangeActiveTextEditor(editor => {
            if (this.autoRefresh)
                this.refresh();
        });
        
        vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
        
        vscode.workspace.onDidCloseTextDocument(document => {
            if ((this.autoRefresh) && (this.documentEquals(document)))
                this.refresh();
        });

        vscode.workspace.onDidSaveTextDocument(document => {
            if ((this.autoRefresh) && (this.documentEquals(document)))
                this.refresh();            
        });

		this.autoRefresh = vscode.workspace.getConfiguration('alOutline').get('autorefresh');

		this.parseTree();
    }    

	private onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): void {
        if ((this.autoRefresh) && (this.documentEquals(changeEvent.document)))
            this.refresh();
    }
    
	select(range: vscode.Range) {
        this.editor.revealRange(range, vscode.TextEditorRevealType.Default);
        this.editor.selection = new vscode.Selection(range.start, range.end);
        vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
    }
    
    private documentEquals(document : vscode.TextDocument) : boolean {
        return ((document) && (this.editor) && (this.editor.document) && document.uri.toString() === this.editor.document.uri.toString());
    }

    //------------------------------------------------------------------
    // tree operations
    //------------------------------------------------------------------

	async refresh(treeNode?: ALSymbolInfo): Promise<void> {
		await this.parseTree();
		if (treeNode) {
			this._onDidChangeTreeData.fire(treeNode);
		} else {
			this._onDidChangeTreeData.fire();
		}
	}

    //gets document symbols using language server protocol 
    private getLspSymbols(document: vscode.TextDocument): Thenable<vscode.SymbolInformation[]> {
        return vscode.commands.executeCommand<vscode.SymbolInformation[]>('vscode.executeDocumentSymbolProvider', document.uri);
    }

    private async parseTree(): Promise<void> {
        this.rootNode = null;
		this.editor = vscode.window.activeTextEditor;
		if (this.editor && this.editor.document && this.editor.document.languageId === 'al') {
            //load all symbols
            let lspSymbols = await this.getLspSymbols(this.editor.document);
            let alSymbols = lspSymbols.map(symbol => new ALSymbolInfo(symbol));
            //build symbols tree
            this.rootNode = new ALSymbolInfo();
            this.rootNode.appendChildNodes(alSymbols);
		}
	}

    //------------------------------------------------------------------
    // TreeDataProvider implementation
    //------------------------------------------------------------------

    getTreeItem(element: ALSymbolInfo): vscode.TreeItem | Thenable<vscode.TreeItem> {
        let treeItem = new vscode.TreeItem(element.name);
        treeItem.iconPath = element.getIcon(this.extensionContext);
        //expand
        if (element.childItems.length) {
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        } else {
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
        //node command
        treeItem.command = {
            command: 'alOutline.openSelection',
            title: '',
            arguments: [
                element.lspSymbol.location.range
            ]
        };

        return treeItem;
    }
    
    async getChildren(element?: ALSymbolInfo): Promise<ALSymbolInfo[]> {
        if (element)
            return element.childItems;
        return this.rootNode ? this.rootNode.childItems : [];
    }


}