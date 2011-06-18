var fs = require('fs'),
    childProcess = require('child_process'),
    async = require('async'),
    path = require('path');


var gpgstore = exports;

gpgstore.makeTiers = function (masterFile) {
  var tiers,
      file,
      tierCount,
      keyID;
  fs.readFile(masterFile, function (err, data) {
    if (err) { console.log(err); }
    try {
      tiers = JSON.parse(data);
    }
    catch(err) {
      console.log('Sorry, error parsing your JSON.');
      console.log(err.stack);
      process.exit(1);
    }
    tierCount = tiers.length;
    for (var i = 0; i < tierCount; i++) {
      async.series( [
        function (callback) {
          file = 'tier' + i.toString();
          keyID = tiers[0].keyID;
          callback(null, file, keyID);
        },
        function (callback) {
          fs.writeFile(file, JSON.stringify(tiers), function (err) {
            if (err) { console.log(err); }
            callback(null);
          });
        },
      ], callback);
      function callback (err, results) {
        if (err) { console.log(err); }
        spawnArgs = ['--encrypt', '-r', results[0][1], '-o', results[0][0] + '.gpg', results[0][0]];
        console.log(spawnArgs.join(' '));
        gpgstore.encrypt(spawnArgs);
      }
      tiers.shift();
    }
  });
}

//The only encryption currently supported is file-to-file.  Note: spawnArgs is an array.
gpgstore.encrypt = function (spawnArgs) {
  var gpg = childProcess.spawn('gpg', spawnArgs);
  gpg.stderr.on('data', function (data) {
    console.log('stderr: '+data);
  });
  gpg.stdout.on('data', function (data) {
    console.log('stdout: '+data);
  });
  gpg.on('exit', function (code) {
    if (code > 0) { console.log('gpg exited with status code: ', code); }
    fs.unlink(spawnArgs[5], function (err) {
      if (err) { console.log(err); }
    });
  });
}

//Decrypt a local gpg-encrypted file for your viewing pleasure.  Note: file is a string filename.
gpgstore.decrypt = function (file) {
  var gpg = childProcess.spawn('gpg', ['--decrypt', file]);
  gpg.stderr.on('data', function (data) {
    console.log('stderr: '+data);
  });
  gpg.stdout.on('data', function (data) {
    console.log(data.toString());
  });
  gpg.on('exit', function (code) {
    if (code > 0) { console.log('gpg exited with status code: ', code); }
  });
}

