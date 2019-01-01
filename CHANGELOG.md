# inspector-remote change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog][], and this project adheres to
[Semantic Versioning][].


## [2.0.0] - 2019-01-02

### Changed

- use async functions for API instead of errbacks

### Added

- `connected` and `disconnected` events on Session objects
- `isConnected` property on Session objects

### Removed

- `supportsLocal` exported property


## [1.0.7] - 2017-09-09

### Added

- original version, using callbacks and not async functions


[Keep a Changelog]: https://keepachangelog.com/en/1.0.0/
[Semantic Versioning]: https://semver.org/spec/v2.0.0.html
