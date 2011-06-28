# gpgstore: experimental credential storage utility

## v0.2.0 - Experimental

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
       view [file] - decrypts the provided file and displays its contents.
       rm [tier] - deletes the given tier.
       rm all - deletes all tiers.
       help - show this help and exit.

       use [tier] - opens [tier] in sub-prompt
     
     commands while 'using' a tier:
       list <name>    - lists all credential objects ( doesn't show sensitive data )
       view <name>    - view sensitive data
       use  <tier>    - switches context to new tier
       exit           - takes you back to your shell
    
     
