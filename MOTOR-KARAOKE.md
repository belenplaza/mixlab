# Motor local de karaoke

La interfaz ahora usa dos procesos especializados:

- **Demucs / htdemucs:** estima por separado la voz y el acompañamiento. El instrumental se obtiene sumando los instrumentos estimados; no se usa la resta estéreo anterior.
- **Rubber Band mediante Pedalboard:** cambia el tono manteniendo la duración. Reemplaza el método granular que podía introducir zumbidos y una textura artificial.

Ningún separador garantiza eliminar por completo la voz en todas las grabaciones. Reverberación, coros e instrumentos parecidos a una voz pueden dejar restos o sufrir modificaciones. Escuchá el resultado con una canción real antes de una presentación. El control de voz guía permite mezclar un poco de la voz separada sobre el instrumental; a 0% se reproduce solo el instrumental estimado.

## Preparación de la computadora

1. Tener Node.js y Python 3.11 o 3.12.
2. Abrir **INSTALAR-MOTOR.bat**. Se instalan bibliotecas en `.engine/venv` y se descarga el modelo oficial en `.engine/models`. La primera instalación necesita Internet y varios GB libres para las dependencias y sus archivos temporales.
3. Abrir o reiniciar **COMENZAR.bat**.
4. Ingresar al perfil, elegir una canción local y pulsar **Preparar karaoke con IA**.
5. Esperar la preparación. Puede tardar varios minutos en CPU, según la duración del archivo y la computadora. Solo se procesa una pista por vez.
6. Escuchar el instrumental, ajustar el tono y guardar la configuración antes de la presentación.

La instalación no descarga canciones. La música no se envía a un servicio de IA externo. Durante el procesamiento se crean archivos temporales locales sin cifrar en `.engine/jobs`; se eliminan al recuperar el resultado, o aproximadamente treinta minutos después de terminar si la pestaña se cierra. Si la computadora se apaga bruscamente pueden quedar temporales: esa carpeta no debe compartirse ni incluirse en copias públicas. Las canciones y resultados guardados en cada perfil siguen cifrados.

## Ensayo sin conexión

Después de instalar dependencias y modelo, la computadora puede separar y cambiar el tono sin Internet mientras el servidor local esté abierto. Las dos pistas separadas y la última versión con el tono preparado se guardan cifradas en el perfil. Esa configuración puede escucharse sin el motor, desde la aplicación preparada para uso offline.

Cambiar a un tono nuevo necesita ejecutar el motor de nuevo. Un teléfono que solo tenga la aplicación instalada puede reproducir los resultados preparados, pero no ejecuta el motor de Python local. Para prepararlos directamente desde teléfono hace falta un servidor accesible mediante HTTPS o una aplicación nativa; esa parte no está desplegada.

## Repertorio

Máximo **15 canciones**, **10 grabaciones personales** y **400 MB por perfil**, sujeto también al espacio que permita el navegador. Los originales, las pistas separadas, los tonos preparados y las grabaciones comparten ese espacio. El límite de quince no borra material anterior; una canción muy larga o pesada puede agotar el espacio antes. Se permite reemplazar ajustes de una canción sin ocupar un lugar nuevo.

Los resultados del motor se guardan como MP3 estéreo a 192 kbps para reducir el espacio y pueden exportarse con el ecualizador de la sesión. Exportarlos a WAV no recupera información descartada por la compresión. Los originales se conservan para volver a preparar una versión.

## Dependencias y fuentes

- https://github.com/facebookresearch/demucs — código de Demucs, licencia MIT; consultar los avisos del proyecto y del modelo.
- https://github.com/spotify/pedalboard — Pedalboard, GPL-3.0, utiliza Rubber Band.
- https://breakfastquay.com/rubberband/ — Rubber Band, consultar licencias del proveedor.
- https://pytorch.org/ — PyTorch y Torchaudio.

El código de integración está incluido. El paquete de distribución no incluye los varios GB del entorno Python: el instalador los obtiene desde los repositorios oficiales. Para redistribuir una aplicación comercial cerrada se deben revisar las obligaciones y opciones de licencia de esas dependencias.
