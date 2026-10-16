# Codificador MP3

MixLab usa lamejs 1.2.1 (Alex Zhukov), basado en LAME, como biblioteca JavaScript separada y sin modificaciones. Licencia declarada por el paquete: LGPL-3.0.

- Proyecto: https://github.com/zhuker/lamejs
- LAME: https://lame.sourceforge.io/
- Archivo ejecutado: dist/vendor/lame.min.js. Puede reemplazarse por una versión compatible.
- Licencia incluida por el autor: dist/vendor/lamejs-LICENSE.txt.
- Textos LGPL-3.0 y GPL-3.0: en esta carpeta.
- Paquete fuente original de npm: lamejs-1.2.1-source.tgz, incluye el código JavaScript fuente y metadatos originales.

La biblioteca se carga únicamente en el worker de exportación MP3. No envía audio a ningún servicio.
