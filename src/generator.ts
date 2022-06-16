import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class Generator {
    private workspaceFolder: string | undefined = undefined;
    private main_cpp_content = `#include <iostream>

using namespace std;

int main() {
    cout << "Hello World!\\n";
}`;

    private properties_content = `{
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

    constructor() { }

    private async selectWorkspaceFolder() {
        if (vscode.workspace.workspaceFolders !== undefined) {
            if (vscode.workspace.workspaceFolders.length > 1) {
                let workspaces: string[] = [];
                for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
                    workspaces.push(vscode.workspace.workspaceFolders[i].uri.path);
                }
                this.workspaceFolder = await vscode.window.showQuickPick(workspaces, {});
            } else {
                this.workspaceFolder = vscode.workspace.workspaceFolders[0].uri.path;
            }
        } else {
            vscode.window.showErrorMessage(
                `C++ Builder: Working folder not found, open a folder and try again`);
            return;
        }
    }

    async execute_basic(): Promise<void> {
        this.selectWorkspaceFolder();

        if (this.workspaceFolder !== undefined) {
            let properties = "c_cpp_properties.json";
            let tasks = "tasks.json";
            let launch = "launch.json";
            let main_cpp = this.workspaceFolder + "/main.cpp";
            let cmake = this.workspaceFolder + "/CMakeLists.txt";
            let exe_name = path.basename(this.workspaceFolder);
            exe_name = exe_name.replaceAll("-", "_");
            
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
            ]
        },
        {
            "label": "Run",
            "type": "shell",
            "options": {
                "cwd": "\${workspaceRoot}/build"
            },
            "command": "./${exe_name}",
            "dependsOn": [
                "Build"
            ],
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
            "program": "\${workspaceFolder}/build/${exe_name}",
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
project(${exe_name})

add_executable(\${PROJECT_NAME} main.cpp)`

            let basedir: string = this.workspaceFolder + "/.vscode/";
            fs.mkdirSync(basedir, { recursive: true });

            try {
                fs.writeFileSync(basedir + properties, this.properties_content);
                fs.writeFileSync(basedir + tasks, tasks_content);
                fs.writeFileSync(basedir + launch, launch_content);

                if (!fs.existsSync(main_cpp)) {
                    fs.writeFileSync(main_cpp, this.main_cpp_content);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${main_cpp} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(main_cpp, this.main_cpp_content);
                    }
                }

                if (!fs.existsSync(cmake)) {
                    fs.writeFileSync(cmake, cmake_content);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${cmake} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(cmake, cmake_content);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
    }

    async execute_with_tests(): Promise<void> {
        this.selectWorkspaceFolder();

        if (this.workspaceFolder !== undefined) {
            let properties = "c_cpp_properties.json";
            let tasks = "tasks.json";
            let launch = "launch.json";
            let main_cpp = this.workspaceFolder + "/main.cpp";
            let cmake = this.workspaceFolder + "/CMakeLists.txt";
            let exe_name = path.basename(this.workspaceFolder);
            exe_name = exe_name.replaceAll("-", "_");

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
            ]
        },
        {
            "label": "Tests",
            "type": "shell",
            "options": {
                "cwd": "\${workspaceRoot}/build"
            },
            "command": "ctest",
            "dependsOn": [
                "Build"
            ]
        }, 

        {
            "label": "Run",
            "type": "shell",
            "options": {
                "cwd": "\${workspaceRoot}/build"
            },
            "command": "./${exe_name}",
            "dependsOn": [
                "Tests"
            ],
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
            "program": "\${workspaceFolder}/build/${exe_name}",
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
project(${exe_name})

add_executable(\${PROJECT_NAME} main.cpp)

include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/609281088cfefc76f9d0ce82e1ff6c30cc3591e5.zip
)
# For Windows: Prevent overriding the parent project's compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

enable_testing()
add_subdirectory(tests)`

            const test_cmake_content = `cmake_minimum_required(VERSION 3.10)

add_executable(main_test main_test.cpp)
target_link_libraries(main_test PUBLIC
    gtest_main
)

include(GoogleTest)
gtest_discover_tests(main_test)            
`;
            const main_test_content = `#include <gtest/gtest.h>`;

            let basedir: string = this.workspaceFolder + "/.vscode/";
            let testdir: string = this.workspaceFolder + "/tests/";
            fs.mkdirSync(basedir, { recursive: true });
            fs.mkdirSync(testdir, { recursive: true });

            try {
                fs.writeFileSync(basedir + properties, this.properties_content);
                fs.writeFileSync(basedir + tasks, tasks_content);
                fs.writeFileSync(basedir + launch, launch_content);
                fs.writeFileSync(testdir + "CMakeLists.txt", test_cmake_content);
                fs.writeFileSync(testdir + "main_test.cpp", main_test_content);

                if (!fs.existsSync(main_cpp)) {
                    fs.writeFileSync(main_cpp, this.main_cpp_content);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${main_cpp} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(main_cpp, this.main_cpp_content);
                    }
                }

                if (!fs.existsSync(cmake)) {
                    fs.writeFileSync(cmake, cmake_content);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${cmake} already exists. Do you want to override?`, "Yes", "No");
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