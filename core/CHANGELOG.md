# Changelog

## [1.3.0](https://github.com/Neurus1970/betix/compare/betix-core-v1.2.0...betix-core-v1.3.0) (2026-03-13)


### Features

* **BETIX-32:** agregar tabla provincias_juegos y endpoint /provincias_juegos ([6dde29c](https://github.com/Neurus1970/betix/commit/6dde29ced3612ccdc14f6ff14b2c92b2e67239e5))
* **BETIX-32:** invalidar caché en mutaciones y filtrar queries por provincias_juegos ([29573c4](https://github.com/Neurus1970/betix/commit/29573c4c829157d4f12e3e1a44768a5fd7b6ec34))
* **BETIX-32:** modelo de datos juegos por provincia + API + backoffice ([bac3123](https://github.com/Neurus1970/betix/commit/bac3123db4996e6d7c9ac4c9c2cdbaf9be788f5a))


### Bug Fixes

* **BETIX-32:** actualizar test de combinaciones a 28 tras quitar Raspadita de Neuquén y La Pampa ([9994657](https://github.com/Neurus1970/betix/commit/999465719ffb3964cb650661d283007e22d42196))
* **BETIX-32:** restaurar fila (1,1) tras test de delete para evitar polución de estado ([53b64be](https://github.com/Neurus1970/betix/commit/53b64bebc31a71b5393bec262322c561ba26eebd))

## [1.2.0](https://github.com/Neurus1970/betix/compare/betix-core-v1.1.0...betix-core-v1.2.0) (2026-03-12)


### Features

* **BETIX-16:** mapa interactivo de burbujas por provincia ([8857748](https://github.com/Neurus1970/betix/commit/8857748b91191e02691884ae389531aa05ece18a))
* **BETIX-16:** mapa interactivo de burbujas por provincia ([376891f](https://github.com/Neurus1970/betix/commit/376891f34ee1da2d5c485c09aa5df5b90fa32764))
* **BETIX-24:** ampliar proyección en /proyectado a 6 meses ([c12e7fa](https://github.com/Neurus1970/betix/commit/c12e7fa536621fc81b34e251433309aa3bc87074))
* **BETIX-24:** ampliar proyección en /proyectado a 6 meses ([f2946d5](https://github.com/Neurus1970/betix/commit/f2946d50bacce518afe05889dea3a5a13f139973))
* **BETIX-26:** nueva infraestructura de datos — PostgreSQL + IaC + diagramas Mermaid ([f8775e1](https://github.com/Neurus1970/betix/commit/f8775e18bcff0fdb34c0e80b670676e8a13eaabb))
* migrar datos a PostgreSQL y agregar infraestructura de DB (BETIX-26) ([0f3421b](https://github.com/Neurus1970/betix/commit/0f3421b2b93011637e0e7d4cf4161d793065fbe0))


### Bug Fixes

* **BETIX-17:** mejorar endpoints /healthz con diagnóstico detallado de dependencias ([c1fd702](https://github.com/Neurus1970/betix/commit/c1fd702fa796b3611a11761908a629eec46974aa))
* **BETIX-17:** mejorar endpoints /healthz con diagnóstico detallado de dependencias ([d1f907f](https://github.com/Neurus1970/betix/commit/d1f907f6ea968a1cd0bf9c8cd588d15c0509e5bd))
* **BETIX-29:** redefinir estrategia de caché para proyectado (all-data) ([3f0420b](https://github.com/Neurus1970/betix/commit/3f0420b13d2633edc5b95f00be2e5398997a0188))
* **BETIX-29:** redefinir estrategia de caché para proyectado (all-data) ([d5a3edb](https://github.com/Neurus1970/betix/commit/d5a3edbac6cdcb70628ea75eedafacbd40c813f2))
* **BETIX-30:** corregir compatibilidad Windows/Mac para entorno Docker ([0db8d7a](https://github.com/Neurus1970/betix/commit/0db8d7abab45f2a1daffd8f56fc29b73a034f7c7))
* **BETIX-30:** corregir dependencias para entornos Docker/CI ([218ab75](https://github.com/Neurus1970/betix/commit/218ab7531f35ba39415247aacf62c3fc62b59b76))
* **BETIX-30:** corregir dependencias para entornos Docker/CI ([7cdf6be](https://github.com/Neurus1970/betix/commit/7cdf6bed88022803e679e1e1cae318ae5f56a78a))
* **health:** unificar healthcheck a /healthz con diagnóstico real de DB ([99796ac](https://github.com/Neurus1970/betix/commit/99796ac5bb5433b22165e341a24fca83da41a568))
