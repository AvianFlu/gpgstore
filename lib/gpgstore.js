var fs = require('fs'),
    childProcess = require('child_process'),
    async = require('async'),
    path = require('path'),
    colors = require('colors'),
    util = require('util');

var gpgstore = exports;

gpgstore.prompt = require('prompt');

gpgstore.start = function () {
  process.title = 'gpgstore';
  gpgstore.prompt.start();
  gpgstore.prompt.pause();
}

gpgstore._get = function (properties, cb) {
  gpgstore.prompt.resume();
  gpgstore.prompt.get(properties, function (err, result) {
    gpgstore.prompt.pause();
    if (err) { return cb(err); }
    return cb(null, result);
  });
}

gpgstore.newMaster = function (masterFile, cb) {
  fs.readFile(masterFile || 'master.json', function (err, data) {
    if (err) { return cb(err); }
    try {
      return cb(null, JSON.parse(data));
    }
    catch(err) {
      return cb(err);
    }
  });
}

gpgstore.getMaster = function (cb) {
  var properties = {
        message: 'Please enter the password for the master tier',
        name: 'pass',
        hidden: true
      },
      masterFile = __dirname+'/../master.gpg'; //TODO: make this dynamic
  gpgstore._get(properties, function (err, results) {
    if (err) { return cb(err); }
    gpgstore._decrypt(masterFile, results.pass, function (err, result) {
      if (err) { return cb(err); }
      return cb(null, result);
    });
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
        file = master[0].tierName;
        keyID = master[0].keyID;
        callback(null, file, keyID);
      },
      function (callback) {
        fs.writeFile(file, JSON.stringify(master), function (err) {
          if (err) { return callback(err); }
          callback(null);
        });
      },
    ], callback);
    function callback(err, results) {
      var infile, outfile;
      if (err) { return cb(err); }
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

gpgstore.makeTier = function (tier, cb) {
  var infile = tier[0].tierName,
      outfile = __dirname+'/../'+infile+'.gpg',
      keyID = tier[0].keyID;
  fs.writeFile(infile, JSON.stringify(tier), function (err) {
    if (err) { return cb(err); }
    path.exists(outfile, function (exists) {
      if (exists) {
        fs.unlink(outfile, function (err) {
          if (err) { return cb(err); }
          gpgstore._encrypt(keyID, infile, outfile);
        });
      }
      else {
        gpgstore._encrypt(keyID, infile, outfile);
      }
    });
  });
}

gpgstore.add = function (infile, cb) {
  var outfile, newTier, pass;
  //Several things to do:
  async.waterfall([
    function (callback) {  
      //First, get the master tier.
      gpgstore.getMaster(function (err, master) {
        if (err) { return callback(err); }
        return callback(null, master);
      });
    },
    function (master, callback) {
      //Now get the new tier you want to add.
      fs.readFile(infile, function (err, data) {
        if (err) { return callback(err); }
        try {
          newTier = JSON.parse(data);
        }
        catch (err) {
          console.log('Sorry, error parsing your JSON.'.red);
          return callback(err);
        }
        //Last, add the new tier to the master file and make new tiers.  
        master.push(newTier);
        gpgstore.makeTiers(master, function (err) {
          if (err) { return callback(err); }
        });
      });
    }
  ], callback);
  function callback(err) {
    //async.waterfall callback is just an error handler.  
    if (err) { return cb(err);}
  }
}

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
        if (err) { console.log(err.stack.red); }
      });
    }
  });
}

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
      return cb(new Error('GnuPG decryption error, exit code '+code.toString())); 
    }
  });
}

gpgstore.view = function (file, cb) {
  var properties = {
        message: 'Please enter the password for the tier you wish to decrypt',
        name: 'pass',
        hidden: true
      };
  gpgstore._get(properties, function (err, results) {
    if (err) { return cb(err); }
    gpgstore._decrypt(file, results.pass, function (err, result) {
      if (err) { return cb(err); }
      return cb(null, result);
    });
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
  return cb();
}

gpgstore.removeTier = function (tier, cb) {
  //Several things to do:
  async.waterfall([
    function (callback) {  
      gpgstore.getMaster(function (err, master) {
        if (err) { return callback(err); }
        return callback(null, master);
      });
    },
    function (master, callback) {
      //Now remove the tier you don't want.
      var newMaster = master.filter( function (item) {
        return item.tierName !== tier;
      });
      gpgstore.makeTiers(newMaster, function (err) {
        if (err) { return callback(err); }
      });
    }
  ], callback);
  function callback(err) {
    //async.waterfall callback is just an error handler.  
    if (err) { return cb(err);}
    return cb();
  }
}

gpgstore.use = function (tier, n, cb) {
  var commandProps = {
        message: 'Please enter a command',
        name: 'command'
      },
      command = [];
  // Sub-Menu: Get a command, parse it, take the appropriate action, recurse.
  // 'tier' is the currently open tier file - an array of ranked sets of credentials
  // 'n' is the index of the currently 'used' tier of credentials
  console.log('\nUsing Tier ' + tier[n].tierName + ':\n');
  gpgstore._get(commandProps, function (err, results) {
    if (err) { return cb(err); }
    command = results.command.split(' ');
    switch (command[0]) {
      case 'add':
        //Syntax: add [credential name] [key name] [value] [key name] [value]
        //TODO: Make this easier; arguments 6 deep just isn't cool.  Chain-prompt most likely.
        console.log(command);
        if (!tier[n][command[1]]) {
          tier[n][command[1]] = {};
          tier[n][command[1]][command[2]] = command[3];
          tier[n][command[1]][command[4]] = command[5];
          gpgstore.use(tier, n, cb);
        }
        else {
          console.log('Sorry, property already exists - use \'edit\' instead');
          gpgstore.use(tier, n, cb);
        }
        break;
      case 'rm':
        console.log(command);
        if (tier[n][command[1]]) {
          delete tier[n][command[1]];
          gpgstore.use(tier, n, cb);
        }
        else {
          console.log('Sorry, property does not exist!');
          gpgstore.use(tier, n, cb);
        }
        break;
      case 'list':
        console.log('\n\n');
        Object.keys(tier[n]).forEach( function (key, i) {
          if ((key != 'tierName')&&(key != 'keyID')) {
            console.log(key);
          }
        });
        //Show keys.  Don't show data.
        gpgstore.use(tier, n, cb);
        break;
      case 'view':
        console.log('\n\n' + command[1] + ':');
        console.log(tier[n][command[1]]);
        gpgstore.use(tier, n, cb);
        break;
      case 'edit':
        console.log(command);
        //Syntax: edit [credential] [property] [new value]
        // i.e. 'edit bankaccount password bigbucks'
        console.log(tier[n][command[1]][command[2]]);
        tier[n][command[1]][command[2]] = command[3];
        gpgstore.use(tier, n, cb);
        break;
      case 'use':
        //This needs to work off of value in tier[n].tierName
        (/^\w+\.gpg$/).test(command[1]) ? command[1].replace('.gpg', '') : command[1];
        tier.forEach( function (thisTier, i) {
          if (thisTier.tierName === command[1]) {
            n = i;
          }
        });
        gpgstore.use(tier, n, cb);
        break;
      case 'save':
        console.log('Saving local modification of ' + tier[0].tierName + '...');
        gpgstore.makeTier(tier, function (err) {
          if (err) { 
            return cb(err); 
          }
          console.log('The current tier file has been encrypted and locally saved.');
        });
        break;
      case 'exit':
        break;
      case 'help':
        util.puts(gpgstore.useMenu);
        gpgstore.use(tier, n, cb);
        break;
      default:
        console.log('Sorry, invalid command.');
        gpgstore.use(tier, n, cb);
    }
  });
}

gpgstore.useMenu = [
  'Available Commands:',
  '',
  'add [name] [id] [value] [password] [value] - Adds a new Credentials object.',
  'rm [name] - Removes the specified Credentials object, current tier only.',
  'list - Lists all available Credential object names.',
  'view [name] - Displays specified Credential object.',
  'edit [credential name] [key] [new value] - Replaces the specified key\'s value with the provided value.',
  'use [tier] - Switches to a different tier.',
  'save - encrypts the active tier and saves it to disk.',
  'help - Display this list of commands.',
  'exit - Exits gpgstore.',
  ''
].join('\n');
