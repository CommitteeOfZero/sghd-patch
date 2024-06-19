@echo off
pushd build
call vcvarsall.bat x86
set CL=/FC %CL%
qmake "CONFIG+=steinsgate" "CONFIG+=steam" ..\realboot
nmake
popd
copy /y realboot\vendor\curl\bin\libcurl.pdb build\release\
if exist deploy rmdir /q /s deploy
mkdir deploy
pushd deploy
copy ..\build\release\realboot.exe .\LauncherC0.exe
copy /y ..\realboot\vendor\curl\bin\libcurl.dll .\
windeployqt --no-translations --no-compiler-runtime --no-quick-import --no-system-d3d-compiler --no-webkit2 --no-angle --no-opengl-sw .\LauncherC0.exe
popd