# gpgstore: experimental credential storage utility

## v0.0.3 - Experimental

**gpgstore** is a utility to help securely store lists of credentials in separately encrypted 'tiers'.  The first tier has access to all the data - each subsequent tier loses a level of access, and each tier's file can be encrypted with a separate `gpg` key.

## Installation

`gpgstore` is in an early experimental state, but is currently functioning and usable.  The user must install [GnuPG](http://www.gnupg.org/download/) and make sure it is available on their `PATH` before `gpgstore` can function properly.  

`gpgstore` can be installed via GitHub: 

     git clone git://github.com/AvianFlu/gpgstore.git

## Usage

     usage: gpgstore [command] [file]

     commands:
       encrypt [master file] - splits up a master JSON file into encrypted tiers.
       decrypt [.gpg file] - decrypts the specified gpg-encrypted file to stdout.
       help - show this help and exit.


`gpgstore` can currently do two things: encryption from the master JSON to tiered .gpg files, and decryption of a given .gpg back to the screen.  

**Please Note** that you may need to enter the password for your secret key in order to use it for decryption.  


## Todo

     commands:
     
       ( each command will prompt user for additional input of selecting tier )
     
       list     - lists all password tiers
       use      - start using a password tier
       add      - add a new password tier
       rm       - remove a password tier
       
     ( while using a tier, gpgstore enters and holds a prompt )
     
     commands while inside a tier:
       add  <name>    - adds a new credentials object
       rm   <name>    - removes a credentials object
       list <name>    - list all credential objects ( dont show sensitive data )
       view <name>    - view sensitive data
       edit <name>    - edits a credentials object
       exit           - exits
       use  <tier>    - switches context to new tier
    
     