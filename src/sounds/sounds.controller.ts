import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SoundsService } from './sounds.service';
import type { Response } from 'express';

@Controller()
export class SoundsController {
  constructor(private soundsService: SoundsService) {}

  // Endpoint para servir el panel HTML
  @Get('admin')
  @Header('Content-Type', 'text/html')
  getAdminPanel(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel Admin - Trollbot</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      color: white;
      text-align: center;
      margin-bottom: 30px;
      font-size: 2.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .card {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      margin-bottom: 30px;
    }
    h2 {
      color: #667eea;
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 600;
    }
    input[type="text"],
    input[type="file"] {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    input[type="text"]:focus,
    input[type="file"]:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .sounds-list {
      list-style: none;
    }
    .sound-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sound-info {
      flex: 1;
    }
    .command {
      font-weight: 700;
      color: #667eea;
      font-size: 1.1rem;
    }
    .filepath {
      color: #666;
      font-size: 0.9rem;
      margin-top: 5px;
    }
    .delete-btn {
      background: #e74c3c;
      padding: 8px 20px;
      font-size: 0.9rem;
    }
    .delete-btn:hover {
      background: #c0392b;
      box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
    }
    .message {
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: none;
    }
    .message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .message.show {
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎵 Panel Admin - Discord Soundboard</h1>
    
    <div class="card">
      <h2>➕ Agregar Nuevo Sonido</h2>
      <div id="message" class="message"></div>
      
      <form id="uploadForm">
        <div class="form-group">
          <label for="command">Comando (ej: !risas)</label>
          <input type="text" id="command" name="command" placeholder="!micomando" required>
        </div>
        
        <div class="form-group">
          <label for="file">Archivo MP3</label>
          <input type="file" id="file" name="file" accept=".mp3" required>
        </div>
        
        <button type="submit">🚀 Subir Sonido</button>
      </form>
    </div>
    
    <div class="card">
      <h2>📋 Sonidos Disponibles</h2>
      <ul id="soundsList" class="sounds-list">
        <li style="text-align: center; color: #999;">Cargando...</li>
      </ul>
    </div>
  </div>

  <script>
    // Cargar sonidos al iniciar
    loadSounds();

    // Manejar el formulario de upload
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData();
      const command = document.getElementById('command').value;
      const file = document.getElementById('file').files[0];
      
      formData.append('file', file);
      formData.append('command', command);
      
      try {
        const response = await fetch('/sounds/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showMessage('✅ Sonido agregado correctamente!', 'success');
          document.getElementById('uploadForm').reset();
          loadSounds();
        } else {
          showMessage('❌ Error: ' + data.message, 'error');
        }
      } catch (error) {
        showMessage('❌ Error al subir el archivo', 'error');
      }
    });

    // Cargar la lista de sonidos
    async function loadSounds() {
      try {
        const response = await fetch('/sounds');
        const sounds = await response.json();
        
        const list = document.getElementById('soundsList');
        
        if (sounds.length === 0) {
          list.innerHTML = '<li style="text-align: center; color: #999;">No hay sonidos todavía</li>';
          return;
        }
        
        list.innerHTML = sounds.map(sound => \`
          <li class="sound-item">
            <div class="sound-info">
              <div class="command">\${sound.command}</div>
              <div class="filepath">\${sound.filepath}</div>
            </div>
            <button class="delete-btn" onclick="deleteSound(\${sound.id})">🗑️ Eliminar</button>
          </li>
        \`).join('');
      } catch (error) {
        console.error('Error al cargar sonidos:', error);
      }
    }

    // Eliminar un sonido
    async function deleteSound(id) {
      if (!confirm('¿Estás seguro de eliminar este sonido?')) {
        return;
      }
      
      try {
        const response = await fetch(\`/sounds/\${id}\`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          showMessage('✅ Sonido eliminado correctamente!', 'success');
          loadSounds();
        } else {
          showMessage('❌ Error al eliminar el sonido', 'error');
        }
      } catch (error) {
        showMessage('❌ Error al eliminar el sonido', 'error');
      }
    }

    // Mostrar mensaje
    function showMessage(text, type) {
      const msg = document.getElementById('message');
      msg.textContent = text;
      msg.className = \`message \${type} show\`;
      
      setTimeout(() => {
        msg.className = 'message';
      }, 5000);
    }
  </script>
</body>
</html>
    `;
    
    res.send(html);
  }

  // Listar todos los sonidos (API)
  @Get('sounds')
  async getAllSounds() {
    return await this.soundsService.getAllSounds();
  }

  // Subir un nuevo sonido
  @Post('sounds/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './assets',
        filename: (req, file, callback) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, uniqueName + ext);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(mp3)$/)) {
          return callback(new Error('Solo se permiten archivos MP3'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadSound(
    @UploadedFile() file: Express.Multer.File,
    @Body('command') command: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!command) {
      throw new BadRequestException('No se proporcionó el comando');
    }

    try {
      const sound = await this.soundsService.createSound(
        command,
        file.path,
      );
      return { message: 'Sonido creado exitosamente', sound };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Eliminar un sonido
  @Delete('sounds/:id')
  async deleteSound(@Param('id') id: string) {
    try {
      await this.soundsService.deleteSound(parseInt(id));
      return { message: 'Sonido eliminado exitosamente' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

