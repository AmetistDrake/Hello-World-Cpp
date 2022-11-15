import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { win32 } from 'path';

const isWin = process.platform === "win32";

const mainCppContent =
    `// copyright

#include <iostream>

int main() {
    std::cout << "Hello World!\\n";
}
`

const propertiesContent =
    `{
    "configurations": [
        {
            "name": "Config with CMake",
            "intelliSenseMode": "\${default}",
            "includePath": ["\${workspaceFolder}/**"],
            "compilerPath": "",
            "compilerArgs": [],
            "compileCommands": "\${workspaceFolder}/build/compile_commands.json",
            "browse": {
                "path": ["\${workspaceFolder}"],
                "limitSymbolsToIncludedHeaders": true,
                "databaseFilename": ""
            }
        }
    ],
    "version": 4
}
`

const clangformatContent =
    `AccessModifierOffset: -3
AlignAfterOpenBracket: Align
AlignConsecutiveAssignments: false
#AlignConsecutiveBitFields: false
AlignConsecutiveDeclarations: false
AlignConsecutiveMacros: false
AlignEscapedNewlines: Right
#AlignOperands: AlignAfterOperator
AlignTrailingComments: true
AllowAllArgumentsOnNextLine: false
AllowAllConstructorInitializersOnNextLine: false
AllowAllParametersOfDeclarationOnNextLine: false
AllowShortBlocksOnASingleLine: Empty
AllowShortCaseLabelsOnASingleLine: false
#AllowShortEnumsOnASingleLine: true
AllowShortFunctionsOnASingleLine: Empty
AllowShortIfStatementsOnASingleLine: Never
AllowShortLambdasOnASingleLine: Empty
AllowShortLoopsOnASingleLine: false
AlwaysBreakAfterReturnType: None
AlwaysBreakBeforeMultilineStrings: false
AlwaysBreakTemplateDeclarations: Yes
BinPackArguments: false
BinPackParameters: false
#BitFieldColonSpacing: Both
BreakBeforeBraces: Attach # Custom # or Allman
BraceWrapping:
  AfterCaseLabel: true
  AfterClass: true
  AfterControlStatement: Always
  AfterEnum: true
  AfterFunction: true
  AfterNamespace: false
  AfterStruct: true
  AfterUnion: true
  AfterExternBlock: false
  BeforeCatch: true
  BeforeElse: true
  #BeforeLambdaBody: false
  #BeforeWhile: false
  SplitEmptyFunction: false
  SplitEmptyRecord: false
  SplitEmptyNamespace: false
BreakBeforeTernaryOperators: true
BreakConstructorInitializers: BeforeComma
BreakStringLiterals: false
ColumnLimit: 120
CompactNamespaces: false
ConstructorInitializerIndentWidth: 2
Cpp11BracedListStyle: true
PointerAlignment: Left
FixNamespaceComments: true
IncludeBlocks: Preserve
#IndentCaseBlocks: false
IndentCaseLabels: true
IndentGotoLabels: false
IndentPPDirectives: BeforeHash
IndentWidth: 4
KeepEmptyLinesAtTheStartOfBlocks: false
MaxEmptyLinesToKeep: 1
NamespaceIndentation: None
ReflowComments: false
SortIncludes: true
SortUsingDeclarations: true
SpaceAfterCStyleCast: false
SpaceAfterLogicalNot: false
SpaceAfterTemplateKeyword: false
SpaceBeforeAssignmentOperators: true
SpaceBeforeCpp11BracedList: false
SpaceBeforeParens: ControlStatements
SpaceBeforeRangeBasedForLoopColon: true
SpaceBeforeSquareBrackets: false
SpaceInEmptyBlock: false
SpaceInEmptyParentheses: false
SpacesBeforeTrailingComments: 2
SpacesInAngles: false
SpacesInCStyleCastParentheses: false
SpacesInConditionalStatement: false
SpacesInContainerLiterals: false
SpacesInParentheses: false
SpacesInSquareBrackets: false
Standard: c++11
TabWidth: 4
UseTab: Never
`

function getTaskContent(exeName: string, isTest: boolean) {
    const testing = `{
    "label": "Tests",
    "type": "shell",
    "options": {
        "cwd": "\${workspaceRoot}/build/tests"
    },
    "command": "ctest",
    "dependsOn": [
        "Build"
    ]
},
`

    const tasksContent =
        `{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Make build folder",
            "type": "shell",
            "linux": {
                "command": "mkdir -p ./build"
            },
            "windows": {
                "command": "if (!(test-path ./build/)) {mkdir ./build/}"
            }
        },
        {
            "label": "Compile GNU",
            "type": "shell",
            "options": {
                "cwd": "\${workspaceRoot}/build"
            },
            "linux": {
                "command": "cmake -DCMAKE_CXX_COMPILER=/usr/bin/g++ .."
            },
            "windows": {
                "command": "cmake -DCMAKE_CXX_COMPILER=C:/msys64/mingw64/bin/g++.exe .."
            },
            "dependsOn": [
                "Make build folder"
            ]
        },
        {
            "label": "Compile Clang",
            "type": "shell",
            "options": {
                "cwd": "\${workspaceRoot}/build"
            },
            "linux": {
                "command": "cmake -DCMAKE_CXX_COMPILER=/usr/bin/clang++ .."
            },
            "windows": {
                "command": "cmake -DCMAKE_CXX_COMPILER=C:/msys64/mingw64/bin/clang++.exe .."
            },
            "dependsOn": [
                "Make build folder"
            ]
        },
        {
            "label": "Build GNU",
            "type": "shell",
            "options": {
                "cwd": "\${workspaceRoot}/build"
            },
            "linux": {
                "command": "make"
            },
            "windows": {
                "command": "ninja"
            },
            "group": {
                "kind": "build",
            },
            "dependsOn": [
                "Compile GNU"
            ],
        },
        {
            "label": "Build Clang",
            "type": "shell",
            "options": {
                "cwd": "\${workspaceRoot}/build"
            },
            "linux": {
                "command": "make"
            },
            "windows": {
                "command": "ninja"
            },
            "group": {
                "kind": "build",
            },
            "dependsOn": [
                "Compile Clang"
            ],
        },
        ${isTest ? testing : ``}
    ]
}
`
    return tasksContent
}

function getLaunchContent(exeName: string, isTest: boolean) {
    const testing = `{
            "name": "(gdb) Launch test",
            "type": "cppdbg",
            "request": "launch",
            "program": "\${workspaceRoot}/build/tests/${exeName}_test",
            "args": [],
            "stopAtEntry": false,
            "cwd": "\${workspaceRoot}/build/tests/",
            "environment": [],
            "externalConsole": false,
            "MIMode": "gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                },
                {
                    "description": "Set Disassembly Flavor to Intel",
                    "text": "-gdb-set disassembly-flavor intel",
                    "ignoreFailures": true
                }
            ]
        }`

    const launchContent = `{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch app",
            "type": "cppdbg",
            "request": "launch",
            "program": "\${workspaceRoot}/build/bin/${exeName}",
            "args": [],
            "stopAtEntry": false,
            "cwd": "\${workspaceRoot}/build/bin/",
            "environment": [],
            "externalConsole": false,
            "MIMode": "gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                },
                {
                    "description":  "Set Disassembly Flavor to Intel",
                    "text": "-gdb-set disassembly-flavor intel",
                    "ignoreFailures": true
                }
            ]
        },
        ${isTest ? testing : ``}
    ]
}
`
    return launchContent
}

function getCmakeContent(exeName: string, isTest: boolean) {
    const cmakeContent =
        `cmake_minimum_required(VERSION 3.10)
project(${exeName} VERSION 1.0 LANGUAGES CXX)
${isTest ? `
option(BUILD_TESTS "" ON)
if (BUILD_TESTS)
message(STATUS "Building tests")
add_subdirectory(tests)
endif()
` : ``}
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_BUILD_TYPE "Debug")
set(CMAKE_CXX_FLAGS "\${CMAKE_CXX_FLAGS} \\
-pedantic \\
-Wall \\
-Wextra \\
-Wcast-align \\
-Wcast-qual \\
-Wnon-virtual-dtor \\
-Wdisabled-optimization \\
-Wformat=2 \\
-Winit-self \\
-Wmissing-declarations \\
-Wmissing-include-dirs \\
-Wold-style-cast \\
-Woverloaded-virtual \\
-Wredundant-decls \\
-Wshadow \\
-Wsign-conversion \\
-Wconversion \\
-Wdouble-promotion \\
-Wnull-dereference \\
-Wsign-promo \\
-Wstrict-overflow=5 \\
-Wunused \\
-Wswitch-default \\
-Wctor-dtor-privacy \\
-Wundef")

if (CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
set(CMAKE_CXX_FLAGS "\${CMAKE_CXX_FLAGS} \\
-Wlogical-op \\
-Wstrict-null-sentinel \\
-Wnoexcept")
elseif (CMAKE_CXX_COMPILER_ID STREQUAL "Clang") 
set(CMAKE_CXX_FLAGS "\${CMAKE_CXX_FLAGS} \\
-fsanitize=undefined \\
-fsanitize=float-divide-by-zero \\
-fsanitize=unsigned-integer-overflow \\
-fsanitize=implicit-conversion \\
-fsanitize=local-bounds \\
-fsanitize=nullability \\
-fno-omit-frame-pointer")

if (UNIX)
set(CMAKE_CXX_FLAGS "\${CMAKE_CXX_FLAGS} \\
-fsanitize=memory \\
-fsanitize-memory-track-origins=2 \\
-fno-sanitize-memory-use-after-dtor")
endif (UNIX)
endif()

${isTest ?
            `FILE(GLOB SRC_FILES src/*.cpp)
add_executable(\${PROJECT_NAME} \${SRC_FILES})
target_include_directories(\${PROJECT_NAME} PRIVATE include)
set_target_properties(\${PROJECT_NAME}
    PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/lib"
    LIBRARY_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/lib"
    RUNTIME_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/bin"
)
target_compile_features(\${PROJECT_NAME} PUBLIC cxx_std_17)
set_target_properties(\${PROJECT_NAME} PROPERTIES CXX_STANDARD_REQUIRED ON)

file(COPY assets/ DESTINATION \${CMAKE_BINARY_DIR}/assets)` :

            `add_executable(\${PROJECT_NAME} main.cpp)
set_target_properties(\${PROJECT_NAME}
    PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/lib"
    LIBRARY_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/lib"
    RUNTIME_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/bin"
)`}

set(CPACK_PROJECT_NAME \${PROJECT_NAME})
set(CPACK_PROJECT_VERSION \${PROJECT_VERSION})
set(CPACK_PACKAGE_DIRECTORY "\${CMAKE_CURRENT_BINARY_DIR}/install")
install(TARGETS \${PROJECT_NAME} 
    RUNTIME DESTINATION bin
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)
${isTest ?
            `install(DIRECTORY assets DESTINATION .)` : ``}
include(CPack)
`
    return cmakeContent
}


function getTestCmakeContent(exeName: string) {
    const testCmakeContent = `project(${exeName})

include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG release-1.12.1
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)

FetchContent_GetProperties(googletest)
if(NOT googletest_POPULATED)
    FetchContent_Populate(googletest)
    add_subdirectory(\${googletest_SOURCE_DIR} \${googletest_BINARY_DIR} EXCLUDE_FROM_ALL)
endif()

FILE(GLOB TEST_FILES *.cpp)
add_executable(${exeName}_test \${TEST_FILES})
target_link_libraries(${exeName}_test GTest::gtest_main)
target_compile_features(${exeName}_test PUBLIC cxx_std_17)
set_target_properties(${exeName}_test PROPERTIES CXX_STANDARD_REQUIRED ON)

include(GoogleTest)
gtest_discover_tests(${exeName}_test)            

include(CTest)
enable_testing()
`
    return testCmakeContent
}

const mainTestContent =
    `// copyright

#include <gtest/gtest.h>
`

function getIncludeReadmeContent(exeName: string) {
    const includeReadmeContent =
        `# ${exeName}

Place the \`.h, .hpp\` header files here.
`
    return includeReadmeContent
}

function getAssetsReadmeContent(exeName: string) {
    const assetsReadmeContent =
        `# ${exeName}

Place all the miscellaneous files here, like any input files (e.g. calibration files).
`
    return assetsReadmeContent
}

export class Generator {
    private workspaceFolder: string | undefined = undefined;

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
            if (win32) {
                this.workspaceFolder = this.workspaceFolder?.substring(1)
                console.log(this.workspaceFolder)
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
            let mainCppFile = this.workspaceFolder + "/main.cpp";
            let cmakeFile = this.workspaceFolder + "/CMakeLists.txt";
            let clangFormatFile = this.workspaceFolder + "/.clang-format";
            let vscodeDir: string = this.workspaceFolder + "/.vscode/";
            let exeName = path.basename(this.workspaceFolder);
            exeName = exeName.replaceAll("-", "_");

            console.log(vscodeDir)
            try {
                fs.mkdirSync("C:/Home/cpp_test/.vscode", {recursive: true})
                // vscodeDir fs.mkdirSync(vscodeDir, { recursive: true });
                  
                fs.writeFileSync(vscodeDir + "c_cpp_properties.json", propertiesContent);
                fs.writeFileSync(vscodeDir + "launch.json", getLaunchContent(exeName, false));
                fs.writeFileSync(vscodeDir + "tasks.json", getTaskContent(exeName, false));
                
                if (!fs.existsSync(mainCppFile)) {
                    fs.writeFileSync(mainCppFile, mainCppContent);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${mainCppFile} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(mainCppFile, mainCppContent);
                    }
                }

                if (!fs.existsSync(cmakeFile)) {
                    fs.writeFileSync(cmakeFile, getCmakeContent(exeName, false));
                } else {
                    const answer = await vscode.window.showWarningMessage(`${cmakeFile} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(cmakeFile, getCmakeContent(exeName, false));
                    }
                }

                if (!fs.existsSync(clangFormatFile)) {
                    fs.writeFileSync(clangFormatFile, clangformatContent);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${clangFormatFile} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(clangFormatFile, clangformatContent);
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
            let exeName = path.basename(this.workspaceFolder);
            exeName = exeName.replaceAll("-", "_");

            let vscodeDir: string = this.workspaceFolder + "/.vscode/";
            let testDir: string = this.workspaceFolder + "/tests/";
            let srcDir: string = this.workspaceFolder + "/src/";
            let includeDir: string = this.workspaceFolder + "/include/";
            let assetsDir: string = this.workspaceFolder + "/assets/";
            let cmake: string = this.workspaceFolder + "/CMakeLists.txt";
            let clangFormatFile: string = this.workspaceFolder + "/.clang-format";
            let mainCpp: string = srcDir + "main.cpp";
            
            try {
                fs.mkdirSync(vscodeDir, { recursive: true });
                fs.mkdirSync(testDir, { recursive: true });
                fs.mkdirSync(srcDir, { recursive: true });
                fs.mkdirSync(includeDir, { recursive: true });
                fs.mkdirSync(assetsDir, { recursive: true });

                fs.writeFileSync(vscodeDir + "c_cpp_properties.json", propertiesContent);
                fs.writeFileSync(vscodeDir + "tasks.json", getTaskContent(exeName, true));
                fs.writeFileSync(vscodeDir + "launch.json", getLaunchContent(exeName, true));
                fs.writeFileSync(testDir + "CMakeLists.txt", getTestCmakeContent(exeName));
                fs.writeFileSync(testDir + "main_test.cpp", mainTestContent);
                fs.writeFileSync(includeDir + "README.md", getIncludeReadmeContent(exeName));
                fs.writeFileSync(assetsDir + "README.md", getAssetsReadmeContent(exeName));

                if (!fs.existsSync(mainCpp)) {
                    fs.writeFileSync(mainCpp, mainCppContent);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${mainCpp} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(mainCpp, mainCppContent);
                    }
                }

                if (!fs.existsSync(cmake)) {
                    fs.writeFileSync(cmake, getCmakeContent(exeName, true));
                } else {
                    const answer = await vscode.window.showWarningMessage(`${cmake} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(cmake, getCmakeContent(exeName, true));
                    }
                }

                if (!fs.existsSync(clangFormatFile)) {
                    fs.writeFileSync(clangFormatFile, clangformatContent);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${clangFormatFile} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(clangFormatFile, clangformatContent);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
}
