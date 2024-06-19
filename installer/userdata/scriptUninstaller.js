var product =
    JSON.parse(ng.fs.global().readTextFile(':/userdata/product.json'));

var state = {};
state.discovery = {
  run: false,
  gameFound: false,
  patchFound: false,
  gameLocation: ''
};

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
          'You are running the following programs which may conflict with uninstallation. Please close them to continue.');
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
        var tempGameLocation = ng.win32.registry().value(
            ng.win32.RootKey.HKLM,
            product.platforms.windows.uninstallProductKey, false,
            'InstallLocation');
        if (ng.fs.global().pathIsFile(tempGameLocation + '/ngreceipt.bin')) {
          state.discovery.gameFound = true;
          state.discovery.patchFound = true;
          state.discovery.gameLocation = tempGameLocation;
        }
      }
      break;
  }
}

function DoTx() {
  ng.tx.tx().uninstallMode = true;
  ng.tx.tx().receiptPath = '%GAME_PATH%';
  ng.tx.tx().finishText = 'Uninstallation has successfully completed.';
  ng.tx.tx().cancelText =
      'You cancelled the uninstallation.\n\nProgress has not been undone.\n\nA log of changes has been stored to %LOGPATH%.';
  ng.tx.tx().errorText =
      'An error has occurred during uninstallation.\n\nProgress has not been undone.\n\nA log of changes has been stored to %LOGPATH%.';

  var section = ng.tx.tx().addSection('Uninstalling');

  section.removeFile('%LANGUAGEBARRIER_LOG_PATH%');
  if (state.shouldRemovePatchConfig) {
    section.removeDirectory('%CONFIG_LOCATION%');
    section.removeDirectory('%COZ_CONFIG_LOCATION%', true);
  }

  section.removeDirectory('%GAME_PATH%/GATE');

  section.rollbackReceipt();

  ng.tx.run();
}

var StartPage = function() {
  nglib.PageController.call(this, 'Uninstaller');
  DiscoverExisting();
  if (!state.discovery.patchFound) {
    this.view.addLabel(
        'Couldn\'t find game directory, please enter it manually:');
    this.gameDirectoryPicker =
        this.view.addDirectoryPicker({title: 'Choose game directory'});
  } else {
    this.view.addLabel('Patch will be uninstalled from:');
    this.view.addLabel(state.discovery.gameLocation);
  }
  this.view.addSpace(32);
  this.removePatchConfigCb = this.view.addCheckBox('Also delete patch config');
};
StartPage.prototype = Object.create(nglib.PageController.prototype);
StartPage.prototype.onNext = function() {
  if (ng.systemInfo.platform() == ng.systemInfo.OsFamily.Windows) {
    if (checkConflictingProcesses(
            product.platforms.windows.conflictingProcesses))
      return;
  }

  if (state.discovery.patchFound) {
    ng.fs.global().setMacro('GAME_PATH', state.discovery.gameLocation);
  } else {
    if (ng.fs.global().pathIsFile(
            this.gameDirectoryPicker.value + '/ngreceipt.bin')) {
      ng.fs.global().setMacro('GAME_PATH', this.gameDirectoryPicker.value);
    } else {
      ng.window.messageBox(
          'Patched game was not found at the location you entered.');
      return;
    }
  }

  state.shouldRemovePatchConfig = this.removePatchConfigCb.checked;

  var shouldUninstall = ng.window.modal(ng.view.DlgType.YesNo, function(dlg) {
    dlg.width = 300;
    var lbl = dlg.addLabel(
        'Are you sure you wish to uninstall the patch?<br><br>Note <b>if you are upgrading to a new version, you do not need to uninstall the old one first</b>.');
    lbl.richText = true;
  });
  if (!shouldUninstall) return;

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
    break;
}

ng.window.setTitle(product.windowTitle);
ng.window.setMessageBoxIcon(':/userdata/alert.png');

(new StartPage()).push();