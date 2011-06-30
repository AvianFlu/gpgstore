# gpgstore: experimental credential storage utility

## v0.3.1 - Experimental

**gpgstore** is a utility to help securely store lists of credentials in separately encrypted 'tiers'.  The first tier has access to all the data - each subsequent tier loses a level of access, and each tier's file can be encrypted with a separate `gpg` key.

## Installation

`gpgstore` is in an early experimental state, but is currently functioning and usable.  The user must install [GnuPG](http://www.gnupg.org/download/) and make sure it is available on their `PATH` before `gpgstore` can function properly.  

`gpgstore` can be installed via GitHub: 

     git clone git://github.com/AvianFlu/gpgstore.git

## Usage

     usage: gpgstore [command] [arguments]

Available commands from the command line:

     new [master file] - splits up a master JSON file into encrypted tiers.
     add [new tier file] - encrypts the provided file and adds it as the lowest tier.
     list - list all locally available tiers.
     list keys - list GnuPG keys currently available.
     view [file] - decrypts the provided file and displays its contents.
     rm [tier] - deletes the given tier.
     rm all - deletes all tiers.
     help - show this help and exit.
     use [tier] - opens [tier] in a sub-prompt
    
Available commands while a tier file is open:

     add [credential name] [key] [value] [key] [value] - Adds a new Credentials object.
     rm [name] - Removes the specified Credentials object, current tier only.
     list - Lists all credential objects in the open tier.
     list all - Lists the names of the available tiers in the current file.
     view [name] - Displays specified Credential object.
     edit [credential name] [key] [new value] - Replaces the specified key's value with the provided value.
     use [tier] - Switches to a different tier.
     save - encrypts the active tier and saves it to disk.
     help - Display this list of commands.
     exit - Exits gpgstore.
     

## Using the test data

A file of test data, `test.json`, has been provided.  Five public-private key pairs have also been provided - these match those specified in `test.json`.  To 
use the provided key pairs, run the following in your `gpgstore` directory:

     gpg --import testpublic.key
     gpg --import-secret-keys testprivate.key

In closing, I remind all readers that private keys posted on github are not to be used for serious applications. 
