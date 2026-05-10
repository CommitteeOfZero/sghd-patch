[Reflection.Assembly]::LoadFrom("$((Get-Location).Path)\Newtonsoft.Json.dll")

# Config

try {
    . ".\config.ps1"
} 
catch {
    throw "Please put a config.ps1 from the provided config.ps1.sample in the repository root, and run this script from there."
}

# EXE metadata configuration
$version_string = "3.0.0"
$tool_icon = "CoZIcon.ico"
$game_icon = "LauncherIcon.ico"
$publisher = "Committee of Zero"
$product_name = "Steins;Gate Steam Patch"

# Code

function SetInstallerExeMetadata {
    param ([string]$exePath)
    $originalFilename = (Get-Item $exePath).Name
    .\rcedit-x86.exe $exePath `
        --set-icon "$tool_icon" `
        --set-file-version "$version_string" `
        --set-product-version "$version_string" `
        --set-version-string "CompanyName" "$publisher" `
        --set-version-string "FileDescription" "$product_name Installer (v$version_string)" `
        --set-version-string "FileVersion" "$version_string" `
        --set-version-string "InternalName" "Installer.exe" `
        --set-version-string "LegalCopyright" "$publisher" `
        --set-version-string "OriginalFilename" "$originalFilename" `
        --set-version-string "ProductName" "$product_name Installer" `
        --set-version-string "ProductVersion" "$version_string"
}
function SetUninstallerExeMetadata {
    param ([string]$exePath)
    $originalFilename = (Get-Item $exePath).Name
    .\rcedit-x86.exe $exePath `
        --set-icon "$tool_icon" `
        --set-file-version "$version_string" `
        --set-product-version "$version_string" `
        --set-version-string "CompanyName" "$publisher" `
        --set-version-string "FileDescription" "$product_name Uninstaller (v$version_string)" `
        --set-version-string "FileVersion" "$version_string" `
        --set-version-string "InternalName" "nguninstall.exe" `
        --set-version-string "LegalCopyright" "$publisher" `
        --set-version-string "OriginalFilename" "$originalFilename" `
        --set-version-string "ProductName" "$product_name Uninstaller" `
        --set-version-string "ProductVersion" "$version_string"
}

function SetRealbootExeMetadata {
    param ([string]$exePath)
    $originalFilename = (Get-Item $exePath).Name
    .\rcedit-x86.exe $exePath `
        --set-icon "$game_icon" `
        --set-file-version "$version_string" `
        --set-product-version "$version_string" `
        --set-version-string "CompanyName" "$publisher" `
        --set-version-string "FileDescription" "$product_name Launcher (v$version_string)" `
        --set-version-string "FileVersion" "$version_string" `
        --set-version-string "InternalName" "realboot.exe" `
        --set-version-string "LegalCopyright" "$publisher" `
        --set-version-string "OriginalFilename" "$originalFilename" `
        --set-version-string "ProductName" "$product_name Launcher" `
        --set-version-string "ProductVersion" "$version_string"
}

function GenerateEnscriptToc {
    param ([string]$tocPath, [string]$scriptsPath)
    $inToc = Import-CSV .\script_toc.csv -header Id, FilenameOnDisk, FilenameInArchive
    $jw = New-Object Newtonsoft.Json.JsonTextWriter(New-Object System.IO.StreamWriter($tocPath))
    $jw.Formatting = [Newtonsoft.Json.Formatting]::Indented
    $jw.Indentation = 2
    $jw.IndentChar = ' '
    $jw.WriteStartArray();
    foreach ($entry in $inToc) {
        $jw.WriteStartObject();
        $jw.WritePropertyName("id");
        $jw.WriteValue([int]$entry.Id);
        $jw.WritePropertyName("filename");
        $jw.WriteValue($entry.FilenameInArchive);
        $jw.WritePropertyName('size');
        $jw.WriteValue((Get-Item "$scriptsPath\$($entry.FilenameInArchive)").Length);
        $jw.WriteEndObject();
    }
    $jw.WriteEndArray();
    $jw.Flush()
    $jw.Close()
}

# END CONFIG

function PrintSection {
    param ([string]$desc)
    $line = "------------------------------------------------------------------------"
    $len = (($line.length, $desc.legnth) | Measure -Max).Maximum
    
    Write-Host ""
    Write-Host $line.PadRight($len) -BackgroundColor DarkBlue -ForegroundColor Cyan
    Write-Host ("      >> " + $desc).PadRight($len) -BackgroundColor DarkBlue -ForegroundColor Cyan
    Write-Host $line.PadRight($len) -BackgroundColor DarkBlue -ForegroundColor Cyan
    Write-Host ""
}

Write-Output "                          ＴＥＲＲＩＢＵＩＬＤ"
Write-Output "Rated World's #1 Build Script By Leading Game Industry Officials"
Write-Output ""
Write-Output "------------------------------------------------------------------------"
Write-Output ""

PrintSection "Creating new DIST and temp"
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue .\DIST
New-Item -ItemType directory -Path .\DIST | Out-Null
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue .\temp
New-Item -ItemType directory -Path .\temp | Out-Null
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue .\symbols
New-Item -ItemType directory -Path .\symbols | Out-Null

PrintSection "Pulling latest script changes"
cd coalesc3
& git pull
cd data/steins_gate_hd/txt_eng
& git pull
cd ../../../..

PrintSection "Building LanguageBarrier as $languagebarrier_configuration"
& "$msbuild" "$languagebarrier_dir\LanguageBarrier\LanguageBarrier.vcxproj" "/p:Configuration=$languagebarrier_configuration"

PrintSection "Copying LanguageBarrier to DIST"
Copy-Item $languagebarrier_dir\languagebarrier\$languagebarrier_configuration\*.dll .\DIST
Copy-Item $languagebarrier_dir\languagebarrier\$languagebarrier_configuration\*.pdb .\symbols
Copy-Item -Recurse $languagebarrier_dir\languagebarrier\$languagebarrier_configuration\languagebarrier .\DIST
New-Item -ItemType directory -Path ".\DIST\GATE" | Out-Null
# TODO how does wine handle this?
Move-Item .\DIST\dinput8.dll ".\DIST\GATE"
# Reported necessary for some users, otherwise:
# "Procedure entry point csri_renderer_default could not be located in ...\CHILD\DINPUT8.dll"
Copy-Item .\DIST\VSFilter.dll ".\DIST\GATE"

PrintSection "Building and running MagesFontTool"
cd MagesFontTool
&  dotnet publish --configuration Release --runtime win-x64 --no-self-contained --output publish/magesfonttool-windows-amd64 src/MagesFontTool
cd publish/magesfonttool-windows-amd64
& .\MagesFontTool.exe --config ..\..\..\MagesFontToolConfig\config.json --output out
Move-Item -Force .\out\FONT.png ..\..\..\temp\FONT.png
Move-Item -Force .\out\font-outline_A.png ..\..\..\DIST\languagebarrier\font-outline_A.png
Move-Item -Force .\out\widths.bin ..\..\..\DIST\languagebarrier\widths.bin
cd ..\..\..

PrintSection "Patching scripts"
cd coalesc3
python build.py steins_gate_hd windows eng --clean
Copy-Item .\out\steins_gate_hd\windows_eng\enscript.mpk ..\DIST\languagebarrier\
cd ..

PrintSection "Packing c0data.mpk"
python .\mpkpack.py c0data_toc.csv DIST\languagebarrier\c0data.mpk

# LanguageBarrier currently needs this file to be present even if no string redirections are configured
echo $null > .\DIST\languagebarrier\stringReplacementTable.bin

#PrintSection "Copying content to DIST"
Copy-Item -Recurse -Force .\content\* .\DIST
# DXVK
Move-Item .\DIST\d3d9 ".\DIST\GATE"
Move-Item .\DIST\d3d10 ".\DIST\GATE"
Move-Item .\DIST\d3d10_1 ".\DIST\GATE"
Move-Item .\DIST\d3d10core ".\DIST\GATE"
Move-Item .\DIST\d3d11 ".\DIST\GATE"
Move-Item .\DIST\dxgi ".\DIST\GATE"


PrintSection "Building and copying realboot"
cd launcher
& .\realboot_build.bat
cd ..
SetRealbootExeMetadata .\launcher\deploy\LauncherC0.exe
Copy-Item -Recurse -Force .\launcher\deploy\* .\DIST
Copy-Item -Recurse -Force .\launcher\build\release\*.pdb .\symbols

PrintSection "Building noidget"
cd installer
& .\noidget_build.bat
cd ..
SetInstallerExeMetadata .\installer\deploy\noidget.exe
SetUninstallerExeMetadata .\installer\deployUninstaller\noidget.exe
Copy-Item -Recurse -Force .\installer\build\release\*.pdb .\symbols

PrintSection "Packing uninstaller"
cd installer\deployUninstaller
7z a -mx=0 ..\..\temp\sfxbaseUninstaller.7z .\*
cd ..\..
copy .\7zS2.sfx .\temp\UninstallerExtractor.exe
SetUninstallerExeMetadata -exePath .\temp\UninstallerExtractor.exe
cmd /c copy /b .\temp\UninstallerExtractor.exe + .\temp\sfxbaseUninstaller.7z DIST\nguninstall.exe

# Only change to switch to SFX installer: Uncomment section below, comment out section after that one
<#
PrintSection "Packing installer"
7z a -mx=0 .\temp\sfxbase.7z DIST
cd temp
7z a -mx=0 .\sfxbase.7z merged_patches
7z a -mx=0 .\sfxbase.7z merged_patches_c
cd ..
cd installer\deploy
7z a -mx=0 ..\..\temp\sfxbase.7z .\*
cd ..\..
copy .\7zS2.sfx .\temp\InstallerExtractor.exe
SetInstallerExeMetadata -exePath .\temp\InstallerExtractor.exe
cmd /c copy /b .\temp\InstallerExtractor.exe + .\temp\sfxbase.7z DIST\Installer.exe
#>

PrintSection "Packing installer"
cd temp
$patchFolderName = "SGPatch-v$version_string-Setup"
New-Item -ItemType directory -Path $patchFolderName | Out-Null
cd $patchFolderName
New-Item -ItemType directory -Path DIST | Out-Null
Move-Item -Force ..\..\DIST\* .\DIST
New-Item -ItemType directory -Path achievements | Out-Null
Copy-Item -Recurse -Force  ..\..\achievements\* .\achievements
Move-Item -Force ..\..\installer\deploy\* .
Move-Item -Force .\noidget.exe .\SGPatch-Installer.exe
cd ..\..\DIST
7z a -mx=5 "$patchFolderName.zip" "..\temp\$patchFolderName"
cd ..

PrintSection "Removing temp"
Remove-Item -Force -Recurse .\temp