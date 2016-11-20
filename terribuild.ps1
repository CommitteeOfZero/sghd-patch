# CONFIG
$msbuild = "C:\Program Files (x86)\MSBuild\14.0\Bin\msbuild.exe"
# the following are solution dirs
$mgsfontgen_dir = $env:USERPROFILE + "\Documents\Visual Studio 2015\Projects\mgsfontgen"
$mgsfontgen_configuration = "Release"
$languagebarrier_dir = $env:USERPROFILE + "\Documents\Visual Studio 2015\Projects\LanguageBarrier"
$languagebarrier_configuration = "dinput8-Release"
$lbconfig_dir = $env:USERPROFILE + "\Documents\Visual Studio 2015\Projects\LBConfig"
$lbconfig_configuration = "Release"
$sc3enc_bin_dir = $env:USERPROFILE + "\Source\Repos\SciAdv.Net\bin\Release\Internal\SC3Enc"
$output_archive = ".\DIST.zip"
# END CONFIG

Write-Output "                          ＴＥＲＲＩＢＵＩＬＤ"
Write-Output "Rated World's #1 Build Script By Leading Game Industry Officials"
Write-Output ""
Write-Output "This should be run after:"
Write-Output "- configuring mgsfontgen (in source)"
Write-Output "- building LanguageBarrier dependencies and making them available to"
Write-Output "LanguageBarrier build"
Write-Output "- writing LanguageBarrier default configuration"
Write-Output "- adjusting LBConfig to match"
Write-Output "- building SC3Enc"
Write-Output ""
Write-Output "------------------------------------------------------------------------"
Write-Output ""

Write-Output "Creating new DIST and temp"
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue .\DIST
New-Item -ItemType directory -Path .\DIST | Out-Null
New-Item -ItemType directory -Path .\DIST\GATE | Out-Null
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue .\temp
New-Item -ItemType directory -Path .\temp | Out-Null
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue $output_archive

Write-Output ""

Write-Output "Building LanguageBarrier as $languagebarrier_configuration"
Write-Output "========================================================================"
& "$msbuild" "$languagebarrier_dir\LanguageBarrier\LanguageBarrier.vcxproj" "/p:Configuration=$languagebarrier_configuration"
Write-Output "========================================================================"

Write-Output ""

Write-Output "Building mgsfontgen as $mgsfontgen_configuration"
Write-Output "========================================================================"
& "$msbuild" "$mgsfontgen_dir\mgsfontgen\mgsfontgen.vcxproj" "/p:Configuration=$mgsfontgen_configuration"
Write-Output "========================================================================"

Write-Output ""

Write-Output "Building LBConfig as $lbconfig_configuration"
Write-Output "========================================================================"
& "$msbuild" "$lbconfig_dir\LBConfig\LBConfig.csproj" "/p:Configuration=$lbconfig_configuration"
Write-Output "========================================================================"

Write-Output ""

# TODO: Build SC3Enc in here

Write-Output "Copying LanguageBarrier to DIST"
Copy-Item $languagebarrier_dir\languagebarrier\$languagebarrier_configuration\*.dll .\DIST\GATE
Copy-Item -Recurse $languagebarrier_dir\languagebarrier\$languagebarrier_configuration\languagebarrier .\DIST

Write-Output "Copying LBConfig to DIST"
Copy-Item $lbconfig_dir\LBConfig\bin\$lbconfig_configuration\LBConfig.exe .\DIST
Copy-Item $lbconfig_dir\LBConfig\bin\$lbconfig_configuration\*.dll .\DIST

Write-Output "Copying subs to DIST\languagebarrier"
Copy-Item -Recurse .\subs .\DIST\languagebarrier

Write-Output ""

Write-Output "Running mgsfontgen"
Copy-Item $mgsfontgen_dir\mgsfontgen\$mgsfontgen_configuration\input.bin .\temp
# Yes, mgsfontgen expects to be run from the directory it's residing in.
Copy-Item $mgsfontgen_dir\mgsfontgen\$mgsfontgen_configuration\mgsfontgen.exe .\temp
Set-Location .\temp
.\mgsfontgen.exe
Set-Location ..
Write-Output "Copying mgsfontgen-generated font-outline.png and widths.bin"
Write-Output " to DIST\languagebarrier"
Copy-Item .\temp\outputOutline.png .\DIST\languagebarrier\font-outline.png
Copy-Item .\temp\widths.bin .\DIST\languagebarrier\widths.bin

Write-Output ""

Write-Output "Packing c0data.mpk"
python .\mpkpack.py c0data_toc.csv DIST\languagebarrier\c0data.mpk

Write-Output ""

Write-Output "Generating string replacement table"
Invoke-Expression "$sc3enc_bin_dir\sc3enc.exe strings.txt"
Move-Item .\output.bin .\DIST\languagebarrier\stringReplacementTable.bin

Write-Output ""

Write-Output "Creating $output_archive"
Compress-Archive -Path .\DIST\* -CompressionLevel Optimal -DestinationPath $output_archive

Write-Output "Removing temp and DIST"
Remove-Item -Force -Recurse .\temp
Remove-Item -Force -Recurse .\DIST