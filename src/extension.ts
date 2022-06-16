import * as vscode from 'vscode';
import { Generator } from './generator';

export function activate(context: vscode.ExtensionContext) {
    const generator = new Generator();

    context.subscriptions.push(
        vscode.commands.registerCommand('cpp-builder.helloWorldCpp', () => {
            generator.execute_basic();
        }),

        vscode.commands.registerCommand('cpp-builder.helloWorldCppWithTests', () => {
            generator.execute_with_tests();
        })
    )
}


export function deactivate() { }
