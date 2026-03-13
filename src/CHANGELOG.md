# Changelog

## [1.3.0](https://github.com/Neurus1970/betix/compare/betix-api-v1.2.0...betix-api-v1.3.0) (2026-03-13)


### Features

* **BETIX-32:** agregar página backoffice y completar implementación del ticket ([e58a9c4](https://github.com/Neurus1970/betix/commit/e58a9c480c517435ce0af3142cccab153dcae3b0))
* **BETIX-32:** agregar proxy Node.js para /api/provincias_juegos ([3b1a0f9](https://github.com/Neurus1970/betix/commit/3b1a0f9bc061ce8f0804ca3e0eff28c3a5b9d6f0))
* **BETIX-32:** invalidar caché en mutaciones y filtrar queries por provincias_juegos ([29573c4](https://github.com/Neurus1970/betix/commit/29573c4c829157d4f12e3e1a44768a5fd7b6ec34))
* **BETIX-32:** modelo de datos juegos por provincia + API + backoffice ([bac3123](https://github.com/Neurus1970/betix/commit/bac3123db4996e6d7c9ac4c9c2cdbaf9be788f5a))


### Bug Fixes

* **BETIX-32:** corregir issues Sonar — reliability, security y maintainability ([a5da831](https://github.com/Neurus1970/betix/commit/a5da8319373cf62b8eca326b9016ea81e45535d0))

## [1.2.0](https://github.com/Neurus1970/betix/compare/betix-api-v1.1.0...betix-api-v1.2.0) (2026-03-12)


### Features

* **BETIX-16:** mapa interactivo de burbujas por provincia ([8857748](https://github.com/Neurus1970/betix/commit/8857748b91191e02691884ae389531aa05ece18a))
* **BETIX-16:** mapa interactivo de burbujas por provincia ([376891f](https://github.com/Neurus1970/betix/commit/376891f34ee1da2d5c485c09aa5df5b90fa32764))
* **BETIX-24:** ampliar proyección en /proyectado a 6 meses ([c12e7fa](https://github.com/Neurus1970/betix/commit/c12e7fa536621fc81b34e251433309aa3bc87074))
* **BETIX-24:** ampliar proyección en /proyectado a 6 meses ([f2946d5](https://github.com/Neurus1970/betix/commit/f2946d50bacce518afe05889dea3a5a13f139973))
* **BETIX-28:** agregar tab Proyecciones como 5to tab en /dashboard ([f88beff](https://github.com/Neurus1970/betix/commit/f88beffd99b5d081d0d0e7a870d13b5e276b4437))
* **BETIX-28:** tab Proyecciones en /dashboard + eliminar páginas standalone ([7fab127](https://github.com/Neurus1970/betix/commit/7fab127c38b9099ea80e2d6439eae152141fed57))


### Bug Fixes

* agregar error handler global en Express para capturar errores de conexión ([5c031a9](https://github.com/Neurus1970/betix/commit/5c031a9a8d3a24692628411debdfdf783df509b6))
* **BETIX-17:** mejorar endpoints /healthz con diagnóstico detallado de dependencias ([c1fd702](https://github.com/Neurus1970/betix/commit/c1fd702fa796b3611a11761908a629eec46974aa))
* **BETIX-17:** mejorar endpoints /healthz con diagnóstico detallado de dependencias ([d1f907f](https://github.com/Neurus1970/betix/commit/d1f907f6ea968a1cd0bf9c8cd588d15c0509e5bd))
* **BETIX-22:** corregir issues críticos de SonarQube ([9b10db9](https://github.com/Neurus1970/betix/commit/9b10db9f475e18dd8a72ed78ac16b0e241114aff))
* **BETIX-22:** corregir issues críticos de SonarQube ([642d3f8](https://github.com/Neurus1970/betix/commit/642d3f8b43523394775d0b0593c8e5b6300043c3))
* **BETIX-25:** redefinir estrategia de caché para proyectado (all-data) ([36ad5ee](https://github.com/Neurus1970/betix/commit/36ad5ee5022b15bf75bb5ebf21186dca1c00a3db))
* **BETIX-28:** selector de juego local en tab Proyecciones y corrección README ([8a972f6](https://github.com/Neurus1970/betix/commit/8a972f6d5a64e863df028dd9c31cc3c19567acd7))
* **BETIX-29:** redefinir estrategia de caché para proyectado (all-data) ([3f0420b](https://github.com/Neurus1970/betix/commit/3f0420b13d2633edc5b95f00be2e5398997a0188))
* **BETIX-29:** redefinir estrategia de caché para proyectado (all-data) ([d5a3edb](https://github.com/Neurus1970/betix/commit/d5a3edbac6cdcb70628ea75eedafacbd40c813f2))
* **health:** unificar healthcheck a /healthz con diagnóstico real de DB ([99796ac](https://github.com/Neurus1970/betix/commit/99796ac5bb5433b22165e341a24fca83da41a568))
