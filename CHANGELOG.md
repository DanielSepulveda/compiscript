# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [6.2.0](https://github.com/DanielSepulveda/compiscript/compare/v6.1.1...v6.2.0) (2021-05-30)


### Features

* **compiler:** cleanup after compilation ([e673ffd](https://github.com/DanielSepulveda/compiscript/commit/e673ffd01240b4b3d6d22e7f2e9bc9fce55081a3))
* **vm:** cleanup after execution ([805d3d0](https://github.com/DanielSepulveda/compiscript/commit/805d3d0ca14e5c7950f0b3b0494a5879ace0427c))

### [6.1.1](https://github.com/DanielSepulveda/compiscript/compare/v6.1.0...v6.1.1) (2021-05-29)


### Bug Fixes

* run build script before release ([6394549](https://github.com/DanielSepulveda/compiscript/commit/639454974baa26416a176beb744464c7e00c71d9))
* update build test script ([27e4441](https://github.com/DanielSepulveda/compiscript/commit/27e44416714f4c7cf483ea7d17f02f38a3a626c4))
* update test build scrip ([a56ad13](https://github.com/DanielSepulveda/compiscript/commit/a56ad13a51a421cc908dc04b55d21131c0d6777f))

## [6.1.0](https://github.com/DanielSepulveda/compiscript/compare/v6.0.0...v6.1.0) (2021-05-29)


### Features

* **vm:** handle input and output ([2d8a0a4](https://github.com/DanielSepulveda/compiscript/commit/2d8a0a4b77d7ef5017de70c5ef8a177b491dddbf))


### Bug Fixes

* remove read grammar from file ([8370e54](https://github.com/DanielSepulveda/compiscript/commit/8370e54fd059dc45d058605759d0fc672c402dd7))

## [6.0.0](https://github.com/DanielSepulveda/compiscript/compare/v2.0.0...v6.0.0) (2021-05-28)


### ⚠ BREAKING CHANGES

* **functions:** generate intermediate code for functions and handle compilation memory (#10)
* bump version (#9)
* bump to new version (#7)

### Features

* **build:** separate dev and build tsconfigs ([16149b5](https://github.com/DanielSepulveda/compiscript/commit/16149b5eefc659b6f73df739afb2391be3eb679e))
* array execution and vm tests ([582c4e6](https://github.com/DanielSepulveda/compiscript/commit/582c4e6edffc79f5c3708f20f5cbff410255cbcd))
* compile arrays ([fb583d3](https://github.com/DanielSepulveda/compiscript/commit/fb583d3e53945193935fb5cb320743a3739be625))
* use babel to build compiler ([0b5f41f](https://github.com/DanielSepulveda/compiscript/commit/0b5f41fb29c71634a5d9bb5b9e195058c96a9c84))
* **compiler:** add print line command ([137671b](https://github.com/DanielSepulveda/compiscript/commit/137671becdee6560fb79dfd4007ca8475508b699))
* **compiler:** create obj file when compilation succeeds ([d4f72cf](https://github.com/DanielSepulveda/compiscript/commit/d4f72cfb76c198a407d746b2c2bfaa6518574c55))
* **compiler:** let int values be assigned to float variables ([e97975b](https://github.com/DanielSepulveda/compiscript/commit/e97975b05651885df3ec03a5662c03498796bc4b))
* **compiler:** store params addr in func param list instead of index ([dc92806](https://github.com/DanielSepulveda/compiscript/commit/dc92806ea994b9616e2c8798b15eed89db4f3be9))
* **for:** generate quadruples for 'for' statements ([55340c9](https://github.com/DanielSepulveda/compiscript/commit/55340c981d311b547f2ba6cb2be7da9d92d99606))
* **functions:** generate intermediate code for functions and handle compilation memory ([#10](https://github.com/DanielSepulveda/compiscript/issues/10)) ([0d08481](https://github.com/DanielSepulveda/compiscript/commit/0d084815bc0916c9d3c4576f4e17b947369e87fe))
* **grammar:** handle negative numbers ([70258d1](https://github.com/DanielSepulveda/compiscript/commit/70258d11fee56ade10933fbb164ae083c690b817))
* **ifs:** generate quadruples for if statements ([876db54](https://github.com/DanielSepulveda/compiscript/commit/876db54b1f793093ae2ec209c61335ad47a7e74c))
* **quadruplets:** basic quadruplets generation for simple expressions ([30b10e2](https://github.com/DanielSepulveda/compiscript/commit/30b10e24d342a375b573055159cfad77037a9be7))
* **quadruplets:** generate assigment expresions quadruplets ([efec802](https://github.com/DanielSepulveda/compiscript/commit/efec802883104e9d133bc9ce42f248d9892199be))
* **quadruplets:** generate parenthesis expresions quadruplets ([2854e7e](https://github.com/DanielSepulveda/compiscript/commit/2854e7e3f7534588eee6cafb2fae0c898720af18))
* **quadruplets:** generate print  expresions quadruplets ([1c19d96](https://github.com/DanielSepulveda/compiscript/commit/1c19d967899d6cc11d75a810cd39a1b55fda3f99))
* **quadruplets:** generate read expresions quadruplets ([63a1c92](https://github.com/DanielSepulveda/compiscript/commit/63a1c92179286d1370adc678f09ee737d511d089))
* **semantics:** semantic cube first version ([#5](https://github.com/DanielSepulveda/compiscript/issues/5)) ([8c53a86](https://github.com/DanielSepulveda/compiscript/commit/8c53a8674c7a7297bcc4a681f1a59e9ac869820c))
* **vm:** basic execution of defined functions ([6e2b1a6](https://github.com/DanielSepulveda/compiscript/commit/6e2b1a63177070c69c7fe9474d6ce0fca53d8f78))
* **vm:** create VmMemory class and load compilation output ([b0ccac8](https://github.com/DanielSepulveda/compiscript/commit/b0ccac872f3c09f027673cb1ad672ac4449f6c31))
* **vm:** execute basic expressions ([bf16f22](https://github.com/DanielSepulveda/compiscript/commit/bf16f225a5a60b473cd081aa6e275b1771b401a3))
* **vm:** execution of non-sequential statements ([e8c0ec4](https://github.com/DanielSepulveda/compiscript/commit/e8c0ec45f6112474b6a49380d3bfb9b2d3e3f731))
* **vm:** first version of vm execution of basic commands ([8b4b02f](https://github.com/DanielSepulveda/compiscript/commit/8b4b02f3e0fd52316162f323c32f75ac93113a65))
* **vm:** init global and constant memory from compilation output ([e63edce](https://github.com/DanielSepulveda/compiscript/commit/e63edce15def9211e2ef3541c79548bda5a027f8))
* bump to new version ([#7](https://github.com/DanielSepulveda/compiscript/issues/7)) ([244fa3c](https://github.com/DanielSepulveda/compiscript/commit/244fa3c0029f98880c695dbec3455ab571196c9c))
* bump version ([#9](https://github.com/DanielSepulveda/compiscript/issues/9)) ([08d86d0](https://github.com/DanielSepulveda/compiscript/commit/08d86d0b263206f017cbe27efef1cab12f350cf4))
* **while:** generate quadruples for while statements ([7dcc73e](https://github.com/DanielSepulveda/compiscript/commit/7dcc73e16330d8d7c5a39917e7ad12a5b2a1438d))

## [5.0.0](https://github.com/DanielSepulveda/compiscript/compare/v4.0.0...v5.0.0) (2021-05-16)


### ⚠ BREAKING CHANGES

* **functions:** generate intermediate code for functions and handle compilation memory (#10)

### Features

* **functions:** generate intermediate code for functions and handle compilation memory ([#10](https://github.com/DanielSepulveda/compiscript/issues/10)) ([8c6e55b](https://github.com/DanielSepulveda/compiscript/commit/8c6e55bdcf5b56465b66ba1c1d5f19c5a0b1ae71))

## [4.0.0](https://github.com/DanielSepulveda/compiscript/compare/v3.0.0...v4.0.0) (2021-05-02)


### ⚠ BREAKING CHANGES

* bump version (#9)

### Features

* bump version ([#9](https://github.com/DanielSepulveda/compiscript/issues/9)) ([7aec50b](https://github.com/DanielSepulveda/compiscript/commit/7aec50b5db2757666b5ef73d0cb4e8e874ad4fa9))
* **for:** generate quadruples for 'for' statements ([1424f22](https://github.com/DanielSepulveda/compiscript/commit/1424f2210a74b2daf557306fe815401e516dc767))
* **ifs:** generate quadruples for if statements ([2991152](https://github.com/DanielSepulveda/compiscript/commit/2991152069c4055d5e372fd0bc310097d99c0dc8))
* **while:** generate quadruples for while statements ([a3a3d25](https://github.com/DanielSepulveda/compiscript/commit/a3a3d25f6a8ef659f32d35aea0e39d63d57d49c1))

## [3.0.0](https://github.com/DanielSepulveda/compiscript/compare/v2.0.0...v3.0.0) (2021-04-30)


### ⚠ BREAKING CHANGES

* bump to new version (#7)

### Features

* bump to new version ([#7](https://github.com/DanielSepulveda/compiscript/issues/7)) ([38f424c](https://github.com/DanielSepulveda/compiscript/commit/38f424c12d67be633dae1e02a7100dcf6d12158d))
* **quadruplets:** basic quadruplets generation for simple expressions ([8dfb68d](https://github.com/DanielSepulveda/compiscript/commit/8dfb68d31d4d4b6ee6f2979ee9f02618293b8daa))
* **quadruplets:** generate assigment expresions quadruplets ([68ddc16](https://github.com/DanielSepulveda/compiscript/commit/68ddc168e4086a2907e8f9ff1aed3c8928548d1e))
* **quadruplets:** generate parenthesis expresions quadruplets ([2ae8602](https://github.com/DanielSepulveda/compiscript/commit/2ae860295424b1b07e28ac077fc7f8e7a18ca3d5))
* **quadruplets:** generate print  expresions quadruplets ([e5921f5](https://github.com/DanielSepulveda/compiscript/commit/e5921f5821ea412d4756c2a54d54825ff34d367a))
* **quadruplets:** generate read expresions quadruplets ([15d47a3](https://github.com/DanielSepulveda/compiscript/commit/15d47a3600484bf38f3f8fca88f961c363b11271))
* **semantics:** semantic cube first version ([#5](https://github.com/DanielSepulveda/compiscript/issues/5)) ([c075bf3](https://github.com/DanielSepulveda/compiscript/commit/c075bf353841a7c7ad95592ddbcf3074c12f6ee4))

## 2.0.0 (2021-04-27)


### ⚠ BREAKING CHANGES

* bump to new version (#4)

### Features

* bump to new version ([#4](https://github.com/DanielSepulveda/compiscript/issues/4)) ([1e1c20a](https://github.com/DanielSepulveda/compiscript/commit/1e1c20a342c6ebfdd041a27fc00713bcb9953614))
* **semantics:** semantics first version ([#3](https://github.com/DanielSepulveda/compiscript/issues/3)) ([1d4b486](https://github.com/DanielSepulveda/compiscript/commit/1d4b4862502d75f9b30958da297faf71ef4299fe))

## 1.0.0 (2021-04-12)

En este primer avance lo que se realizó primero que nada fue tomar como base el archivo que se proporcionó en clase y cambiamos algunas reglas para nuestra conveniencia. Después de eso hicimos el léxico del programa en donde realizamos una lista con los tokens con los que va a trabajar nuestro compilador. Una vez realizado lo anterior, empezamos a hacer la sintaxis válida del compilador. Con el léxico y sintaxis hechos, hicimos el diagrama de sintaxis para poder tener más visual la sintaxis. Ya con lo anterior, hicimos dos archivos para pruebas, uno donde tiene que ser aceptado y uno que no debe de ser aceptado. Una vez que se corrieron las pruebas, la que debía salir correcta salió correcta y la que no debía ser aceptada salió error. Ya que el código estaba funcionando lo subimos a un repositorio en github.
