@echo off
pushd build
call vcvarsall.bat x86
set CL=/FC %CL%
REM WARNING
REM Every time scriptdebug is toggled, build/ needs to be cleaned
REM as it just changes a define
qmake ..\noidget
REM qmake "CONFIG+=scriptdebug" ..\noidget
nmake
popd
if exist deploy rmdir /q /s deploy
if exist deployUninstaller rmdir /q /s deployUninstaller
mkdir deploy
pushd deploy
copy ..\build\release\noidget.exe .\
rcc --binary ..\userdata.qrc -o userdata.rcc
windeployqt --no-translations --no-compiler-runtime --no-quick-import --no-system-d3d-compiler --no-webkit2 --no-angle --no-opengl-sw .\noidget.exe
popd
mkdir deployUninstaller
pushd deployUninstaller
copy ..\build\release\noidget.exe .\
rcc --binary ..\userdataUninstaller.qrc -o userdata.rcc
windeployqt --no-translations --no-compiler-runtime --no-quick-import --no-system-d3d-compiler --no-webkit2 --no-angle --no-opengl-sw .\noidget.exe
popd