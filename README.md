# 🎵 Discord Soundboard

Bot de Discord con soundboard dinámico construido con NestJS. Reproduce archivos de audio en canales de voz mediante comandos personalizados, con un panel web para gestionar los sonidos.

## ✨ Características

- 🎮 **Comandos dinámicos**: Crea comandos personalizados desde el panel web
- 🎵 **Reproducción de audio**: Reproduce MP3s en canales de voz de Discord
- 🌐 **Panel de administración**: Interfaz web para subir y gestionar sonidos
- 💾 **Base de datos SQLite**: Almacenamiento local de comandos
- 🔄 **Persistencia en canal**: El bot permanece en el canal de voz después de reproducir
- 📦 **Raw SQL queries**: Gestión de base de datos sin ORMs pesados

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- FFmpeg instalado en el sistema
- Bot de Discord creado en el [Developer Portal](https://discord.com/developers/applications)
- Token del bot de Discord

### Permisos necesarios del bot:

**Intents:**
- Guilds
- Guild Messages
- Message Content
- Guild Voice States

**Permissions:**
- Read Messages/View Channels
- Send Messages
- Connect (Voice)
- Speak (Voice)

## 🚀 Instalación

1. **Clonar el repositorio:**
```bash
git clone <tu-repositorio>
cd discord-soundboard
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**

Crea un archivo `.env` en la raíz del proyecto:

```env
DISCORD_TOKEN=tu_token_aqui
```

4. **Inicializar la carpeta de assets:**
```bash
mkdir -p assets
```

## 🎮 Uso

### Iniciar el bot en desarrollo:
```bash
npm run start:dev
```

### Iniciar en producción:
```bash
npm run build
npm run start:prod
```

El bot estará corriendo en `http://localhost:3000`

## 🌐 Panel de Administración

Accede al panel web en: **http://localhost:3000/admin**

### Funcionalidades del panel:

- **Subir nuevos sonidos**: Carga archivos MP3 y asigna comandos (ej: `!risas`)
- **Ver lista de sonidos**: Visualiza todos los comandos disponibles
- **Eliminar sonidos**: Borra comandos y sus archivos asociados

## 🎯 Comandos

### Comandos del sistema:
- `!iluminame` - Devuelve una frase épica aleatoria
- `!help` - Muestra la lista de todos los comandos disponibles
- `!stop` - Detiene la reproducción y desconecta el bot del canal de voz

### Comandos de audio (dinámicos):
- `!byebye` - (Incluido por defecto) Reproduce byebye.mp3
- Cualquier comando que agregues desde el panel web

### ¿Cómo usar los comandos de audio?

1. Únete a un canal de voz en Discord
2. Escribe el comando en cualquier canal de texto (ej: `!byebye`)
3. El bot se unirá al canal y reproducirá el audio
4. El bot permanecerá en el canal para futuros comandos

### Cambiar de canal:

Si te mueves a otro canal de voz y usas un comando, el bot se moverá automáticamente a tu nuevo canal.

## 📁 Estructura del Proyecto

```
discord-soundboard/
├── src/
│   ├── discord/                    # Módulo del bot de Discord
│   │   ├── discord.constants.ts   # Frases épicas
│   │   ├── discord.service.ts     # Lógica del bot
│   │   └── discord.module.ts      # Módulo NestJS
│   ├── sounds/                     # Módulo de gestión de sonidos
│   │   ├── sounds.repository.ts   # Raw queries a SQLite
│   │   ├── sounds.service.ts      # Lógica de negocio
│   │   ├── sounds.controller.ts   # API REST + Panel web
│   │   └── sounds.module.ts       # Módulo NestJS
│   ├── app.module.ts              # Módulo principal
│   └── main.ts                    # Entry point
├── assets/                         # Archivos de audio (MP3)
├── database.sqlite                 # Base de datos SQLite
├── .env                           # Variables de entorno
└── package.json
```

## 🛠️ Stack Tecnológico

- **[NestJS](https://nestjs.com/)** - Framework backend
- **[Discord.js](https://discord.js.org/)** v14 - Librería de Discord
- **[@discordjs/voice](https://discord.js.org/)** - Módulo de audio/voz
- **[TypeORM](https://typeorm.io/)** - Database toolkit
- **[SQLite3](https://www.sqlite.org/)** - Base de datos
- **[Multer](https://github.com/expressjs/multer)** - Upload de archivos

## 📡 API Endpoints

### `GET /admin`
Sirve el panel de administración web (HTML)

### `GET /sounds`
Lista todos los sonidos disponibles
```json
[
  {
    "id": 1,
    "command": "!byebye",
    "filepath": "assets/byebye.mp3"
  }
]
```

### `POST /sounds/upload`
Sube un nuevo sonido
- **Body**: FormData con `command` y `file`
- **Respuesta**: Objeto del sonido creado

### `DELETE /sounds/:id`
Elimina un sonido por ID
- **Respuesta**: Mensaje de confirmación

## 🔧 Configuración de TypeORM

La base de datos SQLite se inicializa automáticamente al arrancar la aplicación. La tabla `sounds` se crea si no existe.

### Esquema de la tabla:
```sql
CREATE TABLE sounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  command TEXT NOT NULL UNIQUE,
  filepath TEXT NOT NULL
);
```

## 🎨 Personalización

### Agregar más comandos de texto:

Edita `src/discord/discord.constants.ts` y agrega más frases al array `FRASES_EPICAS`.

### Modificar el comportamiento del bot:

Edita `src/discord/discord.service.ts` en el método `handleMessage()`.

### Personalizar el panel web:

Edita el HTML embebido en `src/sounds/sounds.controller.ts` en el método `getAdminPanel()`.

## 🐛 Troubleshooting

### El bot no reproduce audio:
- Verifica que FFmpeg esté instalado: `ffmpeg -version`
- Asegúrate de que el bot tenga permisos de "Connect" y "Speak"
- Revisa que el archivo MP3 exista en la carpeta `assets/`

### Error de permisos en Discord:
- Regenera el link de invitación con los permisos correctos
- Verifica que el bot tenga el rol adecuado en tu servidor

### Error al compilar TypeScript:
- Asegúrate de tener Node.js v18 o superior
- Ejecuta `npm install` de nuevo
- Limpia la build: `rm -rf dist/ && npm run build`

## 📝 Notas

- Los archivos de audio y la base de datos están en `.gitignore`
- Cada servidor puede tener sus propios sonidos
- El bot solo responde en servidores (no DMs)
- Los comandos deben empezar con `!`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👤 Autor

**Federico Caramelli** ([@seedwalk](https://github.com/seedwalk))

- 🌐 Website: [seedwalk.net](https://seedwalk.net)
- 💻 GitHub: [@seedwalk](https://github.com/seedwalk)

Desarrollado con ❤️ usando NestJS y Discord.js

---

¿Preguntas o problemas? Abre un issue en GitHub.
