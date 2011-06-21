var fs = require('fs'),
    childProcess = require('child_process'),
    async = require('async'),
    path = require('path'),
    colors = require('colors'),
    util = require('util');


var gpgstore = exports;

gpgstore.prompt = require('prompt');

gpgstore.start = function () {
  gpgstore.prompt.start();
  gpgstore.prompt.pause();
}

gpgstore.newMaster = function (masterFile, cb) {
  fs.readFile(masterFile || 'master.json', function (err, data) {
    if (err) { cb(err); }
    try {
      return cb(null, JSON.parse(data));
    }
    catch(err) {
      console.log('Sorry, error parsing your JSON.'.red);
      console.log(err.stack);
      process.exit(1);
    }
  });
}

gpgstore.makeTiers = function (master, cb) {
  var tiers,
      file,
      tierCount,
      keyID;
  tierCount = master.length;
  for (var i = 0; i < tierCount; i++) {
    async.series( [
      function (callback) {
        file = 'tier' + (i+1).toString();
        keyID = master[0].keyID;
        callback(null, file, keyID);
      },
      function (callback) {
        fs.writeFile(file, JSON.stringify(master), function (err) {
          if (err) { cb(err); }
          callback(null);
        });
      },
    ], callback);
    function callback(err, results) {
      var infile, outfile;
      if (err) { cb(err); }
      infile = results[0][0];
      outfile = results[0][0] + '.gpg';
      path.exists(__dirname+'/../'+outfile, function (exists) {
        if (exists) {
          fs.unlink(__dirname+'/../'+outfile, function (err) {
            if (err) { return cb(err); }
            gpgstore._encrypt(results[0][1], infile, outfile);
          });
        }
        else {
          gpgstore._encrypt(results[0][1], infile, outfile);
        }
      });
    }
    master.shift();
  }
  return cb();
}

gpgstore.add = function (infile, cb) {
  var outfile, newTier, pass,
      properties = {
        message: 'Please enter the password for the master tier:',
        name: 'pass',
        hidden: true
      };
  //Several things to do:
  async.waterfall([
    function (callback) {  
      //First, get the password.
      gpgstore.prompt.resume();
      gpgstore.prompt.get(properties, function (err, result) {
        if (err) { callback(err); }
        gpgstore.prompt.pause();
        callback(null, result.pass);
      });
    },
    function (pass, callback) {
      //Now use the password to decrypt the master file.
      var masterFile = __dirname+'/../tier1.gpg';
      gpgstore._decrypt(masterFile, pass, function (err, result) {
        if (err) { callback(err); }
        callback(null, result);
      });
    },
    function (master, callback) {
      //Now get the new tier you want to add...
      fs.readFile(infile, function (err, data) {
        if (err) { callback(err); }
        try {
          newTier = JSON.parse(data);
        }
        catch (err) {
          console.log('Sorry, error parsing your JSON.'.red);
          callback(err);
        }
        //...and add it to the master file.
        master.push(newTier);
        gpgstore.makeTiers(master, function (err) {
          if (err) { callback(err); }
        });
      });
    }
  ], callback);
  function callback(err) {
    //async.waterfall callback is just an error handler.  
    if (err) { return cb(err);}
  }
}

//The only encryption currently supported is file-to-file.
gpgstore._encrypt = function (keyID, infile, outfile) {
  var gpg = childProcess.spawn('gpg', ['--encrypt', '-r', keyID, '-o', outfile, infile]);
  gpg.stderr.on('data', function (data) {
    console.log('stderr: '+data.yellow);
  });
  gpg.stdout.on('data', function (data) {
    console.log('stdout: '+data.cyan);
  });
  gpg.on('exit', function (code) {
    if (code > 0) { console.log('gpg exited with status code: '.red, code); }
    else {
      fs.unlink(infile, function (err) {
        if (err) { console.log(err); }
      });
    }
  });
}

//Decrypt a local gpg-encrypted file for your viewing pleasure.  Note: file is a string filename.
gpgstore._decrypt = function (file, pass, cb) {
  var gpg = childProcess.spawn('gpg', ['--passphrase', pass, '--decrypt', file]),
      decrypted;
  
  gpg.stdout.on('data', function (data) {
    try {
      return cb(null, JSON.parse(data.toString()));
    }
    catch (err) {
      return cb(err);
    }
  });
  gpg.on('exit', function (code) {
    if (code > 0) { 
      console.log('gpg exited with status code: '.red, code);
      return cb(new Error('Gpg decryption error, code '+code.toString())); 
    }
  });
}


gpgstore.listTiers = function (cb) {
  var tiers = [];
  fs.readdir(__dirname+'/../', function (err, files) {
    if (err) { return cb(err); }
    tiers = files.filter( function (item) {
      return (/^tier\d\.gpg$/).test(item);
    });
    return cb(null, tiers);
  });
}


gpgstore.listKeys = function () {
  var gpg = childProcess.spawn('gpg', ['--list-keys']);
  gpg.stdout.pipe(process.stdout);
  gpg.on('exit', function (code) {
    if (code > 0) { console.log('gpg exited with status code: '.red, code); }
  });
}

gpgstore.removeAll = function (cb) {
  gpgstore.listTiers(function (err, tiers) {
    if (err) { return cb(err); }
    tiers.forEach(function (tier, i) {
      tier = __dirname + '/../' + tier;
      fs.unlink(tier, function (err) {
        if (err) { return cb(err); }
        console.log(tier.yellow + ' has been deleted!\n'.green);
      });
    });
  });
}

gpgstore.removeTier = function (tier, cb) {
  var file = __dirname+'/../'+tier+'.gpg';
  path.exists(file, function (exists) {
    if (exists) { 
      fs.unlink(file, function (err) {
        if (err) { return cb(err); }
        else { return cb(null, (file+' has been removed!'.green)); }
      });
    }
    else {
      return cb('Cannot remove: file does not exist.'.red);
    }
  });
}