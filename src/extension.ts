import * as vscode from 'vscode';
import { Generator } from './generator';

export function activate(context: vscode.ExtensionContext) {
    const generator = new Generator();

    context.subscriptions.push(
        vscode.commands.registerCommand('cpp-builder.helloWorldCpp', () => {
            generator.execute();
        })
    );
}


export function deactivate() { }
