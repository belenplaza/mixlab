# MixLab · Tu espacio para cantar

Aplicación en español para preparar un repertorio, adaptar una pista y ensayar con el micrófono. Los perfiles, audios y grabaciones se guardan cifrados en cada navegador; no se suben a GitHub.

## Usar e instalar la web

Abrí el enlace de GitHub Pages que aparece en la sección **About** del repositorio. Creá un perfil local o restaurá una copia cifrada **antes de crear un perfil con el mismo correo**. La cuenta es local: el email identifica el perfil, no se verifica ni permite recuperar una contraseña olvidada. No hay sincronización automática entre dispositivos.

Pulsá **Instalar MixLab**. Si tu navegador no muestra instalación automática, usá su menú para instalar la aplicación o, en iPhone/iPad, **Compartir → Añadir a pantalla de inicio**. Abrila una primera vez con Internet y esperá el aviso de preparación offline. Luego podés abrir el repertorio local y ensayar sin conexión.

Antes de pasar desde la edición de computadora a la web, descargá una copia cifrada del perfil e importala en la web. Los datos de `localhost` y de GitHub Pages son espacios separados. Conservá la contraseña original. Limpiar los datos del navegador o perder el dispositivo puede borrar el repertorio; hacé copias periódicas.

## Qué incluye cada edición

| Función | Web / GitHub Pages | Computadora con motor instalado |
| --- | --- | --- |
| Perfiles locales cifrados y repertorio | Sí | Sí |
| Hasta 15 canciones y 10 grabaciones, con 400 MB por perfil | Sí | Sí |
| Reproducir archivos y configuraciones preparadas sin conexión | Sí | Sí |
| Ecualizar, ajustar volumen, usar micrófono y grabar | Sí, según navegador y permisos | Sí, según navegador y permisos |
| Exportar MP3 y WAV | Sí | Sí |
| Separar una canción nueva con IA | No: requiere el motor local | Sí: Demucs / htdemucs |
| Preparar un nuevo cambio de tono manteniendo duración | No: requiere el motor local | Sí: Rubber Band |

GitHub Pages publica HTML, CSS y JavaScript; no ejecuta el motor Python. En la web podés abrir las pistas ya preparadas o restaurar el perfil de la computadora. Para ofrecer preparación de IA directamente desde cualquier teléfono haría falta un servidor de procesamiento adicional; este repositorio no lo despliega.

## Edición de computadora

Descargá el paquete de la sección **Releases**, descomprimilo e instalá Node.js y Python 3.11 o 3.12. Ejecutá **INSTALAR-MOTOR.bat** una vez con Internet para descargar las dependencias y el modelo oficial. Luego abrí **COMENZAR.bat**. También podés ejecutar `npm start` y abrir `http://localhost:3000`.

La preparación puede tardar varios minutos según el equipo y la canción. Una vez instalado el motor, no necesita Internet para procesar archivos locales. Los resultados preparados quedan cifrados en el perfil para reutilizarlos sin volver a separar. Más información en [MOTOR-KARAOKE.md](MOTOR-KARAOKE.md).

## Calidad de audio

Demucs estima voz e instrumental por separado. Puede dejar restos, reverberación o artefactos: no garantiza eliminar toda la voz de cualquier grabación. El control de voz guía permite sumarla sobre el instrumental. Rubber Band reemplaza el antiguo cambio granular y conserva aproximadamente la duración. Escuchá cada resultado antes de una presentación.

## Privacidad y derechos

Los perfiles usan PBKDF2 y AES-GCM. Sus claves quedan en memoria durante la sesión. El motor local crea temporales sin cifrar en `.engine/jobs` mientras procesa; se eliminan después de recuperar los resultados. Esa carpeta está excluida de Git. No se envían canciones a un servicio externo de IA.

Exportar no concede derechos sobre una obra ni sobre una grabación. Para publicación, videos o presentaciones públicas revisá los permisos y licencias aplicables. Puede intervenir más de un titular o entidad. MixLab no incluye un descargador de YouTube.

## Publicar cambios

El workflow **Publicar MixLab** publica únicamente `dist/` en GitHub Pages al actualizar `main`. El motor, sus dependencias instaladas, los perfiles y las canciones no se incluyen en el sitio. El código de la edición de computadora permanece en el repositorio.

## Dependencias

MP3 en navegador: lamejs 1.2.1, como biblioteca separada LGPL-3.0; avisos, licencias y paquete fuente en [third-party](third-party/AVISOS.md). El motor opcional instala Demucs, PyTorch, Pedalboard/Rubber Band y sus dependencias: consultá sus licencias antes de redistribuirlo, especialmente en un producto comercial cerrado.
