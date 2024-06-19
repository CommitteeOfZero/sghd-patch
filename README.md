# Building the STEINS;GATE Improvement Patch for Steam

**THIS PAGE IS ONLY OF INTEREST TO NERDS** and people who'd like to make their own patches for STEINS;GATE (or some other SciADV titles) - and even then, you'll need a nerd to deal with this.

This is a snapshot of our root project for the STEINS;GATE patch, with some assets removed.

**It's going to be painful** and these instructions may not be complete. As you can see, our build is kind of a mess, and _you'll need to extract assets from an already patched game installation_. This isn't the release we'd like to have made, but we hope it's better than nothing.

**Clone this repository recursively.** Some of our internal dependencies are submodules.

### Licensing and stuff

- Most of our code is released under liberal open source licenses, check the repositories
- Please do not pirate the game
- **If you release a patch, take care to find and change all relevant text to not misrepresent us as the authors of your patch**. There is a lot of such text scattered throughout:
  - `content/languagebarrier/patchdef.json` (please use your own AppData directory too)
  - `installer/userdata`
  - Hardcoded in the launcher source code at `launcher/realboot` (note, there's a technical support link pointing to our Discord, please don't keep it that way without asking us first)
  - EXE metadata in `terribuild.ps1`
  - We probably forgot something

Third-party dependencies included in _this_ repository:

- `7zS2.sfx`: [Customised 7-Zip SFX module](https://github.com/CommitteeOfZero/lzma-sdk) (public domain)
- `rcedit-x86.exe`: [rcedit](https://github.com/electron/rcedit) (MIT)
- `xdelta3.exe`: [xdelta3](https://github.com/jmacd/xdelta) version 3.1.1 (Apache 2.0)
- `Newtonsoft.Json.dll`: [Json.NET](https://github.com/JamesNK/Newtonsoft.Json) (MIT)
- `DXVK`: [dxvk](https://github.com/doitsujin/dxvk) (Zlib)

### External dependencies

- Visual Studio 2022
- Qt 5.15.2 for Visual Studio 2019
- Libraries for noidget (see `installer/noidget/conf.pri.sample`)
- DirectX 9 SDK - make sure the `DXSDK_DIR` environment variable is set to e.g. `C:\Program Files (x86)\Microsoft DirectX SDK (June 2010)\`
- Python 2.7 - make sure it's in PATH
- 7-Zip - make sure it's in PATH

### Building dependencies

- Build `sc3tools` using the `cargo build --release ` in its subfolder (this also happens during the main build but you'll need it for asset extraction first).
- You do not need to build LanguageBarrier or xdelta3, these are built during the main build and noidget build, respectively.

### Preparing assets

- Export edited images to the `cc-edited-images` subfolder in this repository. Sorry, no convenient way to do this right now - take `languagebarrier/c0data.mpk` from a patched copy and copy things to the appropriate paths according to `c0data_toc.csv`.
- Build SciAdv.Net with its `build.cmd`.
- Extract `languagebarrier/enscript.mpk` and `languagebarrier/enscript_c.mpk` with `ungelify` from SciAdv.Net somewhere.
- Dump patched script text with `sc3tools` (also from SciAdv.Net): `sc3tools.exe extract-text *.scx cc` in the extraction folders.
- Copy the output .txt files from `enscript.mpk` into a `cc-scripts` subfolder and the output .txt files from `enscript_c.mpk` into a `cc-scripts-consistency` subfolder.
- Extract the Steam version's original `USRDIR/script.mpk` into the `script_archive_steam` subfolder.
- Copy `languagebarrier/audio`, `languagebarrier/subs` and `languagebarrier/video` to `content/languagebarrier`

### Configuration

- Copy `installer/noidget/conf.pri.sample` to `installer/noidget/conf.pri` and adjust for your system.
- Copy `config.ps1.sample` to `config.ps1` and adjust for your system

### Actually doing the build

- Run `terribuild.ps1`
- Get a billion errors
- [Cry](https://discord.gg/rq4GGCh)
