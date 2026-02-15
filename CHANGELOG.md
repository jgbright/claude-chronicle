# Changelog

## [0.1.1](https://github.com/jgbright/claude-chronicle/compare/v0.1.0...v0.1.1) (2026-02-15)


### Features

* add Astro marketing site ([e67903a](https://github.com/jgbright/claude-chronicle/commit/e67903a2abcc111e565a1ef522320b1c3b90037e))
* add dump-fixtures command and auto-port selection ([5ca7ea1](https://github.com/jgbright/claude-chronicle/commit/5ca7ea155659a63eec3e4af69142f5cd73f5f724))
* add filesystem watcher, SSE hub, and expanded API routes ([adae537](https://github.com/jgbright/claude-chronicle/commit/adae537068400735756abb3ba1332541d6428964))
* add manifest metadata and edit validation ([c5f91f1](https://github.com/jgbright/claude-chronicle/commit/c5f91f1897ebbb8583e29c922c7df58ed1155db9))
* add PII sanitization pipeline for exports ([1167695](https://github.com/jgbright/claude-chronicle/commit/1167695b0ec6f7730197c6332d3022edb014d77d))
* add resizable sidebar, toolbar controls, and Storybook pipeline ([63bbd09](https://github.com/jgbright/claude-chronicle/commit/63bbd098a6499d19064aad48e42b50de053048fd))
* add session browsing with search, filters, and real-time updates ([167b06a](https://github.com/jgbright/claude-chronicle/commit/167b06ad66e91fd4d2db7b2818364597818f8343))
* add session content search and discovery caching ([0961d67](https://github.com/jgbright/claude-chronicle/commit/0961d675e0257debc752cf106ecc6490e59e76c1))
* add theme visual polish and component enhancements ([56390c7](https://github.com/jgbright/claude-chronicle/commit/56390c7d84a430aa838c9363833407a0d1898ee0))
* improve landing page structure and quickstart UX ([703a9c5](https://github.com/jgbright/claude-chronicle/commit/703a9c511f0c9648d0bb04ab62b35f8a3f8ac52d))
* publish coverage reports to GitHub Pages ([2a88f74](https://github.com/jgbright/claude-chronicle/commit/2a88f748738244f62a63fe7533608e897fe8cf74))
* refresh landing page visual presentation ([df356d9](https://github.com/jgbright/claude-chronicle/commit/df356d90b0661663c5d9414aafc00f13eccc2573))


### Bug Fixes

* add required token for Codecov v5 uploads ([6a1d58a](https://github.com/jgbright/claude-chronicle/commit/6a1d58a89d8d22da7e4f3a30be6fae98906278a8))
* **api:** return cloned sessions from parse cache ([4897e38](https://github.com/jgbright/claude-chronicle/commit/4897e38b2cea37809d8efb630e2fd623b8ec1272))
* **manifest:** accept both reorder edit payload shapes ([5ff57f2](https://github.com/jgbright/claude-chronicle/commit/5ff57f2fb1509086e0580a1fb614daa5f5952eee))
* remove incompatible @storybook/test dependency ([1ddbcc2](https://github.com/jgbright/claude-chronicle/commit/1ddbcc2d1fde8745f7a89a701debb5d68b1ebc1d))
* resolve Astro build failures and consolidate CI workflow ([dcb8222](https://github.com/jgbright/claude-chronicle/commit/dcb82221398543d5c1167f70449c98d5b7e9e75f))
* scope test scripts to unit project to avoid Playwright requirement ([6d7454c](https://github.com/jgbright/claude-chronicle/commit/6d7454cc95c8f1c004575f4bccd484254abebc40))
* **security:** disable raw HTML markdown and tighten SSE origin policy ([6ee3e97](https://github.com/jgbright/claude-chronicle/commit/6ee3e975083d64f48c6d36315de7fa49987af5d0))
* update Storybook to use @storybook/test for action mocks ([fa3c82f](https://github.com/jgbright/claude-chronicle/commit/fa3c82fc0f27f158b8e8da7076c71442121ca6a8))
* use process.env for build-time environment variables in Astro ([1be2656](https://github.com/jgbright/claude-chronicle/commit/1be2656adb90d37361728aca67f43520ac134835))

## 0.1.0 (2026-02-07)


### Features

* add app shell with toolbar, export viewer, and Storybook ([a776233](https://github.com/jgbright/claude-chronicle/commit/a776233c802f4a477e0b05597227aad085a8822a))
* add CLI with serve, list, export, and version commands ([144dee4](https://github.com/jgbright/claude-chronicle/commit/144dee4d95e5d0c4b251721ece6de2a7c7dfbc41))
* add JSONL session discovery and parsing ([5326d7f](https://github.com/jgbright/claude-chronicle/commit/5326d7fa7a09be0946c1671ef2b5404b418b59d2))
* add non-destructive manifest editing system ([5e14689](https://github.com/jgbright/claude-chronicle/commit/5e14689c1722fa6f87029e2595eec84e838270b0))
* add pluggable theme system with Claude and Copilot themes ([f9d41fa](https://github.com/jgbright/claude-chronicle/commit/f9d41fa3eb5ed69fdcfe3e1aa21d6b55dfbd43a2))
* add REST API server with session, manifest, and export endpoints ([4339f6a](https://github.com/jgbright/claude-chronicle/commit/4339f6aceae62c648893fff06e24b354af2dabe7))
* add session browsing and manifest editing UI ([2e41823](https://github.com/jgbright/claude-chronicle/commit/2e41823d471bf77a289d1c83bc2c38490791006d))
* add shared rendering components for code, markdown, and tool use ([94666bf](https://github.com/jgbright/claude-chronicle/commit/94666bfde31413786964aaa6566da4e102c90766))
* add single-file HTML export engine ([e8d6ce3](https://github.com/jgbright/claude-chronicle/commit/e8d6ce37475b6e4c7b1647300a82d2b0ad3e6e3c))
