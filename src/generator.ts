import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class Generator {
    private wf: string | undefined = undefined;

    constructor() { }

    async execute(): Promise<void> {
        if (vscode.workspace.workspaceFolders !== undefined) {
            if (vscode.workspace.workspaceFolders.length > 1) {
                let workspaces: string[] = [];
                for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
                    workspaces.push(vscode.workspace.workspaceFolders[i].uri.path);
                }
                this.wf = await vscode.window.showQuickPick(workspaces, {});
            } else {
                this.wf = vscode.workspace.workspaceFolders[0].uri.path;
            }
        } else {
            vscode.window.showErrorMessage(
                `C++ Builder: Working folder not found, open a folder and try again`);
            return;
        }

        this.create();
    }

    async create() {
        if (this.wf !== undefined) {
            let properties = "c_cpp_properties.json";
            let tasks = "tasks.json";
            let launch = "launch.json";
            let main_cpp = this.wf + "/main.cpp";
            let cmake = this.wf + "/CMakeLists.txt";

            let basedir: string = this.wf + "/.vscode/";
            fs.mkdirSync(basedir, { recursive: true });

            const properties_content = `{
    "configurations": [
        {
            "name": "Linux",
            "includePath": [
                "\${default}"
            ],
            "defines": [],
            "compilerPath": "/usr/bin/gcc",
            "cStandard": "gnu17",
            "cppStandard": "gnu++17",
            "intelliSenseMode": "linux-gcc-x64"
        }
    ],
    "version": 4
}`

            const tasks_content = `{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Make build folder",
            "type": "shell",
            "linux": {
                "command": "mkdir -p ./build"
            }
        },
        {
            "label": "Create makefile",
            "type": "shell",
            "options": {
                "cwd": "\${workspaceRoot}/build"
            },
            "command": "cmake -DCMAKE_CXX_COMPILER=/usr/bin/g++ \${workspaceRoot}",
            "dependsOn": [
                "Make build folder"
            ]
        },
        {
            "label": "Build",
            "type": "shell",
            "options": {
                "cwd": "\${workspaceRoot}/build"
            },
            "command": "make",
            "dependsOn": [
                "Create makefile"
            ],
            "problemMatcher": [],
            "group": {
                "kind": "build",
                "isDefault": true
            }
        }
    ]
}`
            const launch_content = `{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "\${workspaceFolder}/build/${path.basename(this.wf)}",
            "stopAtEntry": false,
            "cwd": "\${workspaceFolder}",
            "environment": [],
            "externalConsole": false,
            "MIMode": "gdb",
            "miDebuggerPath": "/usr/bin/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        }
    ]
}`

            const cmake_content = `cmake_minimum_required(VERSION 3.10)
project(${path.basename(this.wf)})

# add the executable
add_executable(\${PROJECT_NAME} main.cpp)`

            const main_cpp_content = `#include <iostream>

using namespace std;

int main() {
    cout << "Hello World!\\n";
}`

            try {
                fs.writeFileSync(basedir + properties, properties_content);
                fs.writeFileSync(basedir + tasks, tasks_content);
                fs.writeFileSync(basedir + launch, launch_content);

                if (!fs.existsSync(main_cpp)) {
                    fs.writeFileSync(main_cpp, main_cpp_content);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${main_cpp} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(main_cpp, main_cpp_content);
                    }
                }
                
                if (!fs.existsSync(cmake)) {
                    fs.writeFileSync(cmake, cmake_content);
                }else {
                    const answer = await vscode.window.showWarningMessage(`${cmake} already exists. Do you want to override?`,"Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(cmake, cmake_content);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
}