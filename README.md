# Hello World C++

**Note: This extension has only been tested on Ubuntu 20.04!**

## Features
Generate C++ Hello World project inside an open VSCode workspace. To use it, press `Ctrl+Shift+P`, then start typing `"Hello World C++"`. It will fill your folder with the necessary config files.

## Build and Run
- **Build:** Press `Ctrl+Shift+B`
- **Run:** Press `F5`

## Requirements
To build a C++ project, you have to install these build tools:
```
sudo apt install build-essential libtool autoconf unzip wget gdb libssl-dev
```

## Resources
VSCode C++ tutorial: https://code.visualstudio.com/docs/cpp/config-linux\
Download latest CMake: https://cmake.org/download/\
Install CMake: https://cmake.org/install/


## Generated Templates:
`.vscode/c_cpp_properties.json`
```
{
    "configurations": [
        {
            "name": "Linux",
            "includePath": [
                "${default}"
            ],
            "defines": [],
            "compilerPath": "/usr/bin/gcc",
            "cStandard": "gnu17",
            "cppStandard": "gnu++17",
            "intelliSenseMode": "linux-gcc-x64"
        }
    ],
    "version": 4
}
```

`.vscode/tasks.json`
```
{
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
                "cwd": "${workspaceRoot}/build"
            },
            "command": "cmake -DCMAKE_CXX_COMPILER=/usr/bin/g++ ${workspaceRoot}",
            "dependsOn": [
                "Make build folder"
            ]
        },
        {
            "label": "Build",
            "type": "shell",
            "options": {
                "cwd": "${workspaceRoot}/build"
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
}
```

`.vscode/launch.json`
```
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "${workspaceFolder}/build/<project_name>",
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
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
}
```

`CMakeLists.txt`
```
cmake_minimum_required(VERSION 3.10)
project(<project_name>)

# add the executable
add_executable(\${PROJECT_NAME} main.cpp)
```
`main.cpp`
```
#include <iostream>

using namespace std;

int main() {
    cout << "Hello World!\\n";
}
```