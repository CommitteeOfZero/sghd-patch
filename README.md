# SGHD Patch

Here's how you build this. The process is pretty messy at the moment. Sorry about that; we'll try to make this friendlier with later LanguageBarrier versions.

Keep in mind: this stuff is not ready for producing translations yet. For instance, LanguageBarrier currently only works with SGHD and has default configuration for our own patch built in.

If at this point you *really really* want to build/use this and need assistance, [join us on Discord](https://discord.gg/rq4GGCh)

### Dependencies
You need [Visual Studio 2015 Update 3](https://docs.microsoft.com/en-us/visualstudio/releasenotes/vs2015-update3-vs) and [Python 2.7](https://www.python.org/download/releases/2.7/) installed (latter being in your path as python.exe). There are some more code dependencies, we'll go over how to grab them later.

### Get all the repositories
Clone:
* [LanguageBarrier](https://github.com/CommitteeOfZero/LanguageBarrier)
* [mgsfontgen](https://github.com/CommitteeOfZero/mgsfontgen)
* [LBConfig](https://github.com/CommitteeOfZero/LBConfig)
* [SciAdv.Net](https://github.com/CommitteeOfZero/SciAdv.Net)

and of course [this repository](https://github.com/CommitteeOfZero/sghd-patch).

### LanguageBarrier dependencies

#### bin2h
In your `LanguageBarrier` solution directory, create the `LanguageBarrier/contrib/bin` folder and put [bin2h.exe](https://www.deadnode.org/dl/bin2h.exe) there (assuming you don't already have it in your PATH).

#### Simd
* Get the [Simd Library](http://simd.sourceforge.net/) (tested with 3.3.47.809).
* Set it up for building as a static library: edit `simd/src/Simd/SimdConfig.h` and uncomment `#define SIMD_STATIC`.
* Copy the `simd/src/Simd` directory to `LanguageBarrier/contrib/include` in your copy of the LanguageBarrier repository.
* Open the VS solution at `simd/prj/vs14/Simd.sln`.
* For both Release/Win32 and Debug/Win32, change the Configuration Type of the Simd project to "Static library (.lib)" in its project properties.
* In all projects' project properties, for Debug/Win32, change C/C++ -> Code Generation -> Runtime Library to "Multi-threaded Debug DLL (/MDd)".
* Build the Simd project for both Release/Win32 and Debug/Win32.
* Copy the contents of `simd/bin/v140/Win32/Debug` and `simd/bin/v140/Win32/Release` to `LanguageBarrier/contrib/lib/Debug` and `LanguageBarrier/contrib/lib/Release`, respectively.

#### json
Download [json.hpp](https://github.com/nlohmann/json/releases) (tested with 2.0.7) and put it in `LanguageBarrier/contrib/include`.

### NuGet packages
Restore NuGet packages in the LanguageBarrier and LBConfig repositories.

### SC3Enc
Run `build.cmd` in SciAdv.Net to build the solution, including SC3Enc.

### Terribuild
Set all the paths in `terribuild.ps1` in this directory. You should now be able to build the entire thing using that script, generating a DIST.zip containing everything users need. Unless I forgot something, which I probably did.
