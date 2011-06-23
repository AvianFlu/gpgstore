# gpgstore: experimental credential storage utility

## v0.1.1 - Experimental

**gpgstore** is a utility to help securely store lists of credentials in separately encrypted 'tiers'.  The first tier has access to all the data - each subsequent tier loses a level of access, and each tier's file can be encrypted with a separate `gpg` key.

## Installation

`gpgstore` is in an early experimental state, but is currently functioning and usable.  The user must install [GnuPG](http://www.gnupg.org/download/) and make sure it is available on their `PATH` before `gpgstore` can function properly.  

`gpgstore` can be installed via GitHub: 

     git clone git://github.com/AvianFlu/gpgstore.git

## Usage

     usage: gpgstore [command] [options]

     commands:
       new [master file] - splits up a master JSON file into encrypted tiers.
       add [new tier file] - encrypts the provided file and adds it as the lowest tier.
       list - list all locally available tiers.
       list keys - list GnuPG keys currently available.
       decrypt [file] - decrypts the provided file (will be replaced).
       rm [tier] - deletes the given tier.
       rm all - deletes all tiers.
       help - show this help and exit.



**Please Note** that you will need to enter the password for your secret key in order to use it for decryption.  


## Todo

     Implement 'use [tier]'
     ( while using a tier, gpgstore enters and holds a prompt )
     
     commands while inside a tier:
       add  <name>    - adds a new credentials object
       rm   <name>    - removes a credentials object
       list <name>    - list all credential objects ( dont show sensitive data )
       view <name>    - view sensitive data
       edit <name>    - edits a credentials object
       exit           - exits
       use  <tier>    - switches context to new tier
    
     
