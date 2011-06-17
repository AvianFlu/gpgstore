# gpgstore: experimental credential storage utility

## v0.0.2 - Experimental

**gpgstore** is a utility to help securely store lists of credentials in separately encrypted 'tiers'.  The first tier has access to all the data - each subsequent tier loses a level of access, and each tier's file can be encrypted with a separate `gpg` key.

## Installation

`gpgstore` is in an early experimental state, but is currently functioning and usable.  The user must install [GnuPG](http://www.gnupg.org/download/) and make sure it is available on their `PATH` before `gpgstore` can function properly.  

`gpgstore` can be installed via GitHub: 

     git clone git://github.com/AvianFlu/gpgstore.git

## Usage

      avian@avian:~/gpgstore$ ./gpgstore
      Usage:
      gpgstore [JSON file to encrypt]
      gpgstore -d [decrypt file]

`gpgstore` can currently do two things: encryption from the master JSON to tiered .gpg files, and decryption of a given .gpg back to the screen.  

**Please Note** that you may need to enter the password for your secret key in order to use it for decryption.  