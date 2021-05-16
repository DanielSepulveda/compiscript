# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
