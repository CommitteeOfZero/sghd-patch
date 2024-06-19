var readmeText = ng.fs.global().readTextFile(':/userdata/README.txt');
var licenseText = ng.fs.global().readTextFile(':/userdata/LICENSE.txt');

var product =
    JSON.parse(ng.fs.global().readTextFile(':/userdata/product.json'));

// var enscriptToc =
//     JSON.parse(ng.fs.global().readTextFile(':/userdata/enscriptToc.json'));
// var enscriptTocC =
//     JSON.parse(ng.fs.global().readTextFile(':/userdata/enscriptTocC.json'));

var state = {};
state.discovery = {
  run: false,
  gameFound: false,
  patchFound: false,
  gameLocation: ''
};

function pad2(n) {
  if (n < 10) return '0' + n;
  return '' + n;
}

function checkConflictingProcesses(candidates) {
  var any = false;
  var closeList = '';
  candidates.forEach(function(candidate) {
    if (ng.systemInfo.isProcessRunning(candidate)) {
      any = true;
      closeList += candidate + '\n';
    }
  });
  if (any) {
    ng.window.modal(ng.view.DlgType.OK, function(dlg) {
      dlg.width = 300;
      var lbl = dlg.addLabel(
          'You are running the following programs which may conflict with installation. Please close them to continue.');
      dlg.addSpace(16);
      var tf = dlg.addTextField({text: closeList, richText: false});
      dlg.addSpace(16);
    });
  }
  return any;
}

function DiscoverExisting() {
  if (state.discovery.run) return;

  state.discovery.run = true;

  switch (ng.systemInfo.platform()) {
    case ng.systemInfo.OsFamily.Windows:
      if (ng.win32.registry().valueExists(
              ng.win32.RootKey.HKLM,
              product.platforms.windows.uninstallProductKey, false,
              'InstallLocation')) {
        state.discovery.gameFound = true;
        state.discovery.patchFound = true;
        state.discovery.gameLocation = ng.win32.registry().value(
            ng.win32.RootKey.HKLM,
            product.platforms.windows.uninstallProductKey, false,
            'InstallLocation');
      } else {
        // Steam discovery

        // Find library folders
        var libraryFolders = ['%STEAM_PATH%'];
        if (ng.fs.global().pathIsFile(
                '%STEAM_PATH%/steamapps/libraryfolders.vdf') &&
            ng.fs.global().pathIsReadable(
                '%STEAM_PATH%/steamapps/libraryfolders.vdf')) {
          libraryfoldersVdf = ng.fs.global().readTextFile(
              '%STEAM_PATH%/steamapps/libraryfolders.vdf');

          // parse text VDF, poorly
          var strLiteralRegex = /"([^"]*)"/g;
          while ((match = strLiteralRegex.exec(libraryfoldersVdf)) !== null) {
            var unescaped = eval(match[0]);  // yolo
            if (ng.fs.global().pathIsDirectory(unescaped))
              libraryFolders.push(unescaped);
          }
        }

        // check all library folders for our game
        var tryPath =
            function(path) {
          if (ng.fs.global().pathIsDirectory(path)) {
            state.discovery.gameFound = true;
            state.discovery.gameLocation = path;
            return true;
          }
          return false;
        }

        if (nglib.isSteamPlay()) {
          // missing slash here is intentional
          var compatdata =
              ng.fs.global().expandedPath('Z:%STEAM_COMPAT_DATA_PATH%');
          var startSteamapps = compatdata.indexOf('/steamapps/');
          if (startSteamapps !== -1) {
            libraryFolders.push(compatdata.substr(0, startSteamapps));
          }
        }

        // SteamApps is all lowercase for the main library, CamelCase for
        // others... and we should respect case sensitivity for Wine
        for (var i = 0; i < libraryFolders.length; i++) {
          if (tryPath(
                  libraryFolders[i] + '/steamapps/common/%GAME_STEAM_NAME%'))
            return;
          if (tryPath(
                  libraryFolders[i] + '/SteamApps/common/%GAME_STEAM_NAME%'))
            return;
        }
      }
      break;
  }
}

function DoTx() {
  ng.tx.tx().receiptPath = '%GAME_PATH%';
  ng.tx.tx().finishText = 'Installation has successfully completed.';
  ng.tx.tx().cancelText =
      'You cancelled the installation.\n\nProgress has not been undone.\n\nA log of changes has been stored to %LOGPATH%.';
  ng.tx.tx().errorText =
      'An error has occurred during installation.\n\nProgress has not been undone.\n\nA log of changes has been stored to %LOGPATH%.';


  if (ng.systemInfo.platform() == ng.systemInfo.OsFamily.Windows) {
    var regSection = ng.tx.tx().addSection('Registration');

    regSection.setRegistryValue(
        ng.win32.RootKey.HKLM, product.platforms.windows.uninstallProductKey,
        false, 'DisplayName',
        product.platforms.windows.uninstallProductDisplayName);
    regSection.setRegistryValue(
        ng.win32.RootKey.HKLM, product.platforms.windows.uninstallProductKey,
        false, 'DisplayVersion',
        product.platforms.windows.uninstallProductDisplayVersion);
    regSection.setRegistryValue(
        ng.win32.RootKey.HKLM, product.platforms.windows.uninstallProductKey,
        false, 'InstallLocation', ng.fs.global().expandedPath('%GAME_PATH%'));
    var date = new Date();
    regSection.setRegistryValue(
        ng.win32.RootKey.HKLM, product.platforms.windows.uninstallProductKey,
        false, 'InstallDate',
        '' + date.getFullYear() + pad2(date.getMonth()) + pad2(date.getDate()));
    regSection.setRegistryValue(
        ng.win32.RootKey.HKLM, product.platforms.windows.uninstallProductKey,
        false, 'NoModify', 1);
    regSection.setRegistryValue(
        ng.win32.RootKey.HKLM, product.platforms.windows.uninstallProductKey,
        false, 'NoRepair', 1);
    regSection.setRegistryValue(
        ng.win32.RootKey.HKLM, product.platforms.windows.uninstallProductKey,
        false, 'VersionMajor',
        product.platforms.windows.uninstallProductVersionMajor);
    regSection.setRegistryValue(
        ng.win32.RootKey.HKLM, product.platforms.windows.uninstallProductKey,
        false, 'VersionMinor',
        product.platforms.windows.uninstallProductVersionMinor);
    regSection.setRegistryValue(
        ng.win32.RootKey.HKLM, product.platforms.windows.uninstallProductKey,
        false, 'UninstallString',
        ng.fs.global().expandedPath(
            product.platforms.windows.uninstallProductUninstallString));

    // Ensure LanguageBarrier gets loaded
    if (ng.systemInfo.isWine()) {
      regSection.setRegistryValue(
          ng.win32.RootKey.HKCU, 'Software\\Wine\\DllOverrides', true,
          'dinput8', 'native,builtin');
    }
  }

  var patchContentSection = ng.tx.tx().addSection('Copying patch content');
  patchContentSection.removeDirectory('%GAME_PATH%/GATE');
  patchContentSection.copyFiles('%PATCH_CONTENT%/*', '%GAME_PATH%');


  // var applyPatchesSection = ng.tx.tx().addSection('Applying patches');
  // 
  // var buildScriptMpk =
  //     function(scriptMpkPath, scriptMpkToc, scriptDiffsPath) {
  //   var scriptMpk = applyPatchesSection.buildMpk(scriptMpkPath);
  //   scriptMpkToc.forEach(function(entry) {
  //     var diffPath = scriptDiffsPath + '/' + entry.filename + '.vcdiff';
  //     if (ng.fs.global().pathIsFile(diffPath)) {
  //       var stream = ng.tx.xdelta3Stream(
  //           ng.tx.mpkInputStream(product.origScriptArchivePath, entry.id),
  //           ng.tx.fileStream(diffPath));
  //       scriptMpk.addEntry({
  //         id: entry.id,
  //         name: entry.filename,
  //         source: stream,
  //         displaySize: entry.size
  //       });
  //     } else {
  //       scriptMpk.addEntry({
  //         id: entry.id,
  //         name: entry.filename,
  //         source: ng.tx.mpkInputStream(product.origScriptArchivePath, entry.id),
  //         displaySize: entry.size
  //       });
  //     }
  //   });
  // }
  // 
  //     applyPatchesSection.log('Building patched script archive...');
  // buildScriptMpk('%ENSCRIPT_MPK%', enscriptToc, '%SCRIPT_DIFFS%');
  // 
  // applyPatchesSection.log(
  //     'Building patched script archive (#consistency version)...');
  // buildScriptMpk(
  //     '%ENSCRIPT_CONSISTENCY_MPK%', enscriptTocC, '%SCRIPT_CONSISTENCY_DIFFS%');

  if (state.shouldCreateDesktopShortcut ||
      state.shouldCreateStartMenuShortcut) {
    var shortcutsSection = ng.tx.tx().addSection('Creating shortcuts');
    if (state.shouldCreateDesktopShortcut) {
      var desktopShortcut = JSON.parse(JSON.stringify(product.playShortcut));
      desktopShortcut.shortcutPath = '%DESKTOP_SHORTCUT_PATH%';
      shortcutsSection.createShortcut(desktopShortcut);
    }
    if (state.shouldCreateStartMenuShortcut) {
      var startMenuShortcut = JSON.parse(JSON.stringify(product.playShortcut));
      startMenuShortcut.shortcutPath = '%STARTMENU_SHORTCUT_PATH%';
      shortcutsSection.createShortcut(startMenuShortcut);
    }
  }

  // Yeah, these nested double-quotes work, really.
  if (state.shouldRunLauncher) {
    ng.tx.tx().addExecuteAfterFinish(ng.fs.global().expandedPath(
        'cmd /c "cd /d "%GAME_PATH%" & %LAUNCHER_EXE%"'));
  }

  // Proton currently has trouble with boot.bat, the solution is to replace it
  // with the launcher
  // And here the nested quotes don't quite work but we can escape them properly
  // ...in the first instance, anyway, haven't gotten that to work for the start
  // command, hence the shell script
  if (nglib.isSteamPlay()) {
    ng.tx.tx().addExecuteAfterFinish(ng.fs.global().expandedPath(
        'cmd /c "cd /d \"%GAME_PATH%\" & start Z:%SHELL% proton_boot_fix.sh"'));
  }

  // And hundreds of lines of code later...
  ng.tx.run();
}

var StartPage = function() {
  nglib.PageController.call(this, 'Readme');
  this.view.addTextField(readmeText);
};
StartPage.prototype = Object.create(nglib.PageController.prototype);
StartPage.prototype.onNext = function() {
  (new LicensePage()).push();
};

var LicensePage = function() {
  nglib.PageController.call(this, 'License');
  this.view.addTextField(licenseText);
  this.acceptedCheckBox = this.view.addCheckBox(
      'I have read and accept these terms and conditions.');
};
LicensePage.prototype = Object.create(nglib.PageController.prototype);
LicensePage.prototype.onNext = function() {
  if (!this.acceptedCheckBox.checked) {
    ng.window.messageBox(
        'You cannot proceed if you do not accept the license agreements.');
    return;
  }

  DiscoverExisting();

  (new DirectoryPage()).push();
};

var DirectoryPage = function() {
  nglib.PageController.call(this, 'Settings');
  this.view.addLabel(
      'Choose directory where ' + product.gameTitle + ' (' +
      product.inputScriptVersionTitle +
      ') is installed, containing files like Game.exe and the USRDIR folder:');
  var pickerParams = {title: 'Choose game directory'};
  if (state.discovery.gameFound) {
    pickerParams.preset =
        ng.fs.global().expandedPath(state.discovery.gameLocation);
  }
  this.gameDirectoryPicker = this.view.addDirectoryPicker(pickerParams);
  this.view.addSpace(32);
  if (!nglib.isSteamPlay()) {
    this.desktopShortcutCb =
        this.view.addCheckBox({text: 'Create desktop shortcut', preset: true});
    this.startMenuShortcutCb = this.view.addCheckBox(
        {text: 'Create Start Menu shortcut', preset: true});
    this.launcherCb = this.view.addCheckBox(
        {text: 'Run launcher after installation', preset: true});
  }
};
DirectoryPage.prototype = Object.create(nglib.PageController.prototype);
DirectoryPage.prototype.onNext = function() {
  if (ng.systemInfo.platform() == ng.systemInfo.OsFamily.Windows) {
    if (checkConflictingProcesses(
            product.platforms.windows.conflictingProcesses))
      return;
  }

  ng.fs.global().setMacro('GAME_PATH', this.gameDirectoryPicker.value);

  if (!ng.fs.global().pathIsDirectory('%GAME_PATH%')) {
    ng.window.messageBox('Game directory doesn\'t exist or isn\'t a directory');
    return;
  }
  if (!ng.fs.global().pathIsWritable('%GAME_PATH%')) {
    ng.window.messageBox('Game directory isn\'t writable');
    return;
  }
  if (!ng.fs.global().pathIsFile(product.origScriptArchivePath)) {
    ng.window.messageBox(
        'Could not find ' + product.gameTitle + ' (' +
        product.inputScriptVersionTitle + ') in specified directory.');
    return;
  } else if (
      ng.fs.global().md5sum(product.origScriptArchivePath) !=
      product.origScriptArchiveHash) {
    ng.window.messageBox(
        'Game scripts present but invalid. Ensure you are using a fully updated ' +
        product.gameTitle + ' (' + product.inputScriptVersionTitle +
        ') and the latest patch version. If the game has recently received an official update, the patch may have to be updated to match, please check our website.');
    return;
  }

  // TODO: check fs for same physical directory / ignore slashes difference
  // TODO: HTML escape?
  if (state.discovery.patchFound &&
      state.discovery.gameLocation != this.gameDirectoryPicker.value) {
    var shouldContinue = ng.window.modal(ng.view.DlgType.YesNo, function(dlg) {
      dlg.width = 300;
      var lbl = dlg.addLabel(
          'A previous installation of the patch has been found at:<br<br>' +
          state.discovery.gameLocation +
          '<br><br>If you continue, you will not be able to use the uninstaller for the previous installation.<br><br>Continue?');
      lbl.richText = true;
    });
    if (!shouldContinue) return;
  }

  if (nglib.isSteamPlay()) {
    state.shouldCreateDesktopShortcut = false;
    state.shouldCreateStartMenuShortcut = false;
    state.shouldRunLauncher = false;
  } else {
    state.shouldCreateDesktopShortcut = this.desktopShortcutCb.checked;
    state.shouldCreateStartMenuShortcut = this.startMenuShortcutCb.checked;
    state.shouldRunLauncher = this.launcherCb.checked;
  }

  DoTx();
};

ng.fs.global().addMacros(product.paths);
switch (ng.systemInfo.platform()) {
  case ng.systemInfo.OsFamily.Windows:
    ng.fs.global().addMacros(product.platforms.windows.paths);
    ng.fs.global().setMacro(
        'DESKTOP',
        ng.win32.registry().value(
            ng.win32.RootKey.HKCU,
            'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders',
            true, 'Desktop'));
    ng.fs.global().setMacro(
        'STARTMENU',
        ng.win32.registry().value(
            ng.win32.RootKey.HKCU,
            'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders',
            true, 'Start Menu'));
    ng.fs.global().setMacro(
        'MYDOCUMENTS',
        ng.win32.registry().value(
            ng.win32.RootKey.HKCU,
            'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders',
            true, 'Personal'));
    if (ng.win32.registry().valueExists(
            ng.win32.RootKey.HKCU, 'Software\\Valve\\Steam', true,
            'SteamPath')) {
      ng.fs.global().setMacro(
          'STEAM_PATH',
          ng.win32.registry().value(
              ng.win32.RootKey.HKCU, 'Software\\Valve\\Steam', true,
              'SteamPath'));
    }
    break;
}

ng.window.setTitle(product.windowTitle);
ng.window.setMessageBoxIcon(':/userdata/alert.png');
ng.window.playBgm(
    {url: ':/userdata/bgm.mp3', loopStart: 20640, loopEnd: 3376982});

if (ng.systemInfo.isWine()) {
  if (!nglib.isSteamPlay()) {
    ng.window.messageBox(
        'You are trying to install the patch on Wine outside of Steam Play. This is unsupported and probably not what you want. See our website for instructions.');
  }
}


(new StartPage()).push();