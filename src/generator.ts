import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class Generator {
    private workspaceFolder: string | undefined = undefined;
    private main_cpp_content = 
`// copyright

#include <iostream>

using std::cout;

int main() {
    cout << "Hello World!\\n";
}
`

    private properties_content = 
`{
    "configurations": [
        {
            "name": "Linux",
            "compileCommands": "\${workspaceFolder}/build/compile_commands.json"
        }
    ],
    "version": 4
}
`

    private clangformat_content =
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
            let clangformat = this.workspaceFolder + "/.clang-format";
            let exe_name = path.basename(this.workspaceFolder);
            exe_name = exe_name.replaceAll("-", "_");
            
            const tasks_content = 
`{
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
}
`

            const launch_content = 
`{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "./${exe_name}",
            "stopAtEntry": false,
            "cwd": "\${workspaceFolder}/build",
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
`

            const cmake_content = 
`cmake_minimum_required(VERSION 3.10)
project(${exe_name})

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(\${PROJECT_NAME} main.cpp)
`

            let vscodedir: string = this.workspaceFolder + "/.vscode/";
            fs.mkdirSync(vscodedir, { recursive: true });

            try {
                fs.writeFileSync(vscodedir + properties, this.properties_content);
                fs.writeFileSync(vscodedir + tasks, tasks_content);
                fs.writeFileSync(vscodedir + launch, launch_content);

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

                if (!fs.existsSync(clangformat)) {
                    fs.writeFileSync(clangformat, this.clangformat_content);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${clangformat} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(clangformat, this.clangformat_content);
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
            let exe_name = path.basename(this.workspaceFolder);
            exe_name = exe_name.replaceAll("-", "_");

            const tasks_content = 
`{
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
                "cwd": "\${workspaceRoot}/build/tests"
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
                "cwd": "\${workspaceRoot}/build/bin"
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
}
`
            const launch_content = 
`{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "./${exe_name}",
            "stopAtEntry": false,
            "cwd": "\${workspaceFolder}/build/bin",
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
`
            const cmake_content = 
`cmake_minimum_required(VERSION 3.10)
project(${exe_name} VERSION 1.0)

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
-Wlogical-op \\
-Wmissing-declarations \\
-Wmissing-include-dirs \\
-Wnoexcept \\
-Wold-style-cast \\
-Woverloaded-virtual \\
-Wredundant-decls \\
-Wshadow \\
-Wsign-conversion \\
-Wconversion \\
-Wdouble-promotion \\
-Wnull-dereference \\
-Wsign-promo \\
-Wstrict-null-sentinel \\
-Wstrict-overflow=5 \\
-Wunused \\
"
# -Wswitch-default \\
# -Wctor-dtor-privacy \\
# -Wundef \\
# -Werror \\
)

option(BUILD_TESTS "" ON)
if (BUILD_TESTS)
    message(STATUS "Building tests")
    add_subdirectory(tests)
endif()

FILE(GLOB SRC_FILES src/*.cpp)
add_executable(\${PROJECT_NAME} \${SRC_FILES})
target_include_directories(\${PROJECT_NAME} PRIVATE
    include
)
set_target_properties(\${PROJECT_NAME}
    PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/lib"
    LIBRARY_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/lib"
    RUNTIME_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/bin"
)
target_compile_features(\${PROJECT_NAME} PUBLIC cxx_std_17)
set_target_properties(\${PROJECT_NAME} PROPERTIES CXX_STANDARD_REQUIRED ON)

file(COPY assets/ DESTINATION \${CMAKE_BINARY_DIR}/assets)

set(CPACK_PROJECT_NAME \${PROJECT_NAME})
set(CPACK_PROJECT_VERSION \${PROJECT_VERSION})
set(CPACK_PACKAGE_DIRECTORY "\${CMAKE_CURRENT_BINARY_DIR}/install")
install(TARGETS \${PROJECT_NAME} 
    RUNTIME DESTINATION bin
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)
install(DIRECTORY assets DESTINATION .)
include(CPack)
`
            const test_cmake_content =
`project(${exe_name})

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
add_executable(tests \${TEST_FILES})
target_link_libraries(tests GTest::gtest_main)
target_compile_features(tests PUBLIC cxx_std_17)
set_target_properties(tests PROPERTIES CXX_STANDARD_REQUIRED ON)

include(GoogleTest)
gtest_discover_tests(tests)            

include(CTest)
enable_testing()
`
            const main_test_content = 
`// copyright

#include <gtest/gtest.h>

// Demonstrate some basic assertions.
TEST(HelloTest, BasicAssertions) {
    // Expect two strings not to be equal.
    EXPECT_STRNE("hello", "world");
    // Expect equality.
    EXPECT_EQ(7 * 6, 42);
}
`
            const include_readme_content =
`# ${exe_name}

Place the \`.h, .hpp\` header files here.
`
            const assets_readme_content =
`# ${exe_name}

Place all the miscellaneous files here, like any input files (e.g. calibration files).
`
            let vscodedir: string = this.workspaceFolder + "/.vscode/";
            let testdir: string = this.workspaceFolder + "/tests/";
            let srcdir: string = this.workspaceFolder + "/src/";
            let includedir: string = this.workspaceFolder + "/include/";
            let assetsdir: string = this.workspaceFolder + "/assets/";
            let cmake: string = this.workspaceFolder + "/CMakeLists.txt";
            let clangformat: string  = this.workspaceFolder + "/.clang-format";
            let main_cpp: string = srcdir + "main.cpp";

            fs.mkdirSync(vscodedir, { recursive: true });
            fs.mkdirSync(testdir, { recursive: true });
            fs.mkdirSync(srcdir, { recursive: true });
            fs.mkdirSync(includedir, { recursive: true });
            fs.mkdirSync(assetsdir, { recursive: true });

            try {
                fs.writeFileSync(vscodedir + "c_cpp_properties.json", this.properties_content);
                fs.writeFileSync(vscodedir + "tasks.json", tasks_content);
                fs.writeFileSync(vscodedir + "launch.json", launch_content);
                fs.writeFileSync(testdir + "CMakeLists.txt", test_cmake_content);
                fs.writeFileSync(testdir + "main_test.cpp", main_test_content);
                fs.writeFileSync(includedir + "README.md", include_readme_content);
                fs.writeFileSync(assetsdir + "README.md", assets_readme_content);

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

                if (!fs.existsSync(clangformat)) {
                    fs.writeFileSync(clangformat, this.clangformat_content);
                } else {
                    const answer = await vscode.window.showWarningMessage(`${clangformat} already exists. Do you want to override?`, "Yes", "No");
                    if (answer === "Yes") {
                        fs.writeFileSync(clangformat, this.clangformat_content);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
}
