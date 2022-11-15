# Hello World C++

**Note: This extension has only been tested on Ubuntu20.04 and Windows11**

## Features

Generate a C++ Hello World *CMake* project ready to build with **Clang or GNU compiler**, already set up with the essential **compiler warning flags**. This extension configures a VSCode workspace through the `tasks.json`, `c_cpp_properties.json` and `launch.json` files to make it easy to build and run with debugger. To use it, press `Ctrl+Shift+P`, then start typing `"Hello World C++"`. You can choose from two different setups:

- `"Hello World C++"`
- `"Hello World C++ With Tests"`
It will fill your folder with the necessary files.

## Build and Run

- **Build:** Press `Ctrl+Shift+B` and select a build option
- **Run with debug:** Press `F5`

## Requirements

- To build on Ubuntu, you have to install `build-essential`, `cmake` and optionally `clang`:

    ```ssh
    sudo apt install build-essential cmake clang
    ```

- To build on Windows 11, you have to download the MSYS2 package manager first: <https://www.msys2.org>

    Install it to the default location (`C:\msys64`), otherwise you will have to modify the `tasks.json` file.

    Open a new MSYS2 terminal, and run the following commands:

    ```ssh
    pacman -Sy pacman
    pacman -Syu
    pacman -Su
    pacman -S mingw-w64-x86_64-toolchain
    pacman -S mingw-w64-x86_64-clang
    pacman -S mingw-w64-x86_64-cmake
    pacman -S make
    ```

    Add `C:\msys64\mingw64\bin` to the PATH system variables, then restart every terminal. If you had vscode open, restart it also.

Now you are ready to build! Happy coding :)

## Known issues

- After generating the files, vscode will generate the following problem, which you can safely ignore. This will disappear as soon as you build your project and reload the window.

    ```ssh
    "${workspaceFolder}/build/compile_commands.json" could not be found. 'includePath' from c_cpp_properties.json in folder <workspace> will be used instead.
    ```

## Resources

VSCode C++ Linux tutorial: <https://code.visualstudio.com/docs/cpp/config-linux\> \
VSCode C++ Windows tutorial: <https://code.visualstudio.com/docs/cpp/config-mingw> \
MSYS2 home page: <https://www.msys2.org>
