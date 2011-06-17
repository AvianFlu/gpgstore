# gpgstore: experimental credential storage utility

## v0.0.1 - Experimental

**gpgstore** is a utility to help securely store lists of credentials.  Given a JSON file with the appropriate format (see `test.json`), `gpgstore` will make tiered, encrypted files with the specified `gpg` keys.  

## Caveats

- `gpg` must be installed and available on your `PATH`.  
- If bad things happen to important data because of this experimental tool, it isn't my fault.  