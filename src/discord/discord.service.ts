import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits, Message } from 'discord.js';
import { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus 
} from '@discordjs/voice';
import { FRASES_EPICAS } from './discord.constants';
import { SoundsService } from '../sounds/sounds.service';

@Injectable()
export class DiscordService implements OnModuleInit {
  private client: Client;
  private activeConnections: Map<string, any> = new Map(); // Guardamos las conexiones activas por servidor
  private activePlayers: Map<string, any> = new Map(); // Guardamos los reproductores activos por servidor

  constructor(
    private configService: ConfigService,
    private soundsService: SoundsService,
  ) {
    // Creamos el cliente de Discord con los permisos necesarios
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,           // Para ver los servidores
        GatewayIntentBits.GuildMessages,    // Para ver mensajes
        GatewayIntentBits.MessageContent,   // Para leer el contenido
        GatewayIntentBits.GuildVoiceStates, // Para conectarse a canales de voz
      ],
    });
  }

  async onModuleInit() {
    // Cuando NestJS inicie, conectamos el bot
    await this.initBot();
  }

  private async initBot() {
    // Evento: cuando el bot se conecta
    this.client.on('clientReady', () => {
      console.log(`✅ Bot conectado como ${this.client.user?.tag}`);
    });

    // Evento: cuando alguien escribe un mensaje
    this.client.on('messageCreate', (message: Message) => {
      this.handleMessage(message);
    });

    // Login con el token del .env
    const token = this.configService.get<string>('DISCORD_TOKEN');
    await this.client.login(token);
  }

  private async handleMessage(message: Message) {
    // Ignorar mensajes del propio bot
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    // Si el mensaje es "!iluminame" (comando especial de texto)
    if (content === '!iluminame') {
      // Elegir frase random
      const fraseRandom = FRASES_EPICAS[
        Math.floor(Math.random() * FRASES_EPICAS.length)
      ];
      
      // Responder en el mismo canal
      if ('send' in message.channel) {
        message.channel.send(fraseRandom);
      }
      return;
    }

    // Si el mensaje es "!stop" (detener reproducción)
    if (content === '!stop') {
      await this.handleStopCommand(message);
      return;
    }

    // Si el mensaje es "!help" (listar comandos)
    if (content === '!help') {
      await this.handleHelpCommand(message);
      return;
    }

    // Si el mensaje empieza con !, buscar en la base de datos
    if (content.startsWith('!')) {
      const command = content.split(' ')[0]; // Solo tomamos el primer token
      
      try {
        const sound = await this.soundsService.getSoundByCommand(command);
        
        if (sound) {
          // Reproducir el sonido encontrado
          await this.handleVoiceCommand(message, sound.filepath);
        }
      } catch (error) {
        console.error('Error al buscar comando:', error);
      }
    }
  }

  private async handleVoiceCommand(message: Message, audioFilePath: string) {
    try {
      // 1. Verificar que el mensaje viene de un servidor (no DM)
      if (!message.guild) {
        return;
      }

      // 2. Verificar que el usuario esté en un canal de voz
      const member = message.member;
      if (!member?.voice.channel) {
        return;
      }

      const guildId = message.guild.id;
      const targetChannelId = member.voice.channel.id;

      // 3. Verificar si ya hay una conexión activa en este servidor
      let connection = this.activeConnections.get(guildId);

      // Si hay una conexión pero es a un canal diferente, destruirla y crear una nueva
      if (connection && connection.joinConfig.channelId !== targetChannelId) {
        console.log('🔄 Moviendo el bot a otro canal de voz...');
        connection.destroy();
        connection = null;
      }

      // 4. Si no hay conexión o la destruimos, crear una nueva
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: targetChannelId,
          guildId: guildId,
          adapterCreator: message.guild.voiceAdapterCreator,
        });
        
        // Guardar la conexión activa
        this.activeConnections.set(guildId, connection);
        console.log(`✅ Bot conectado al canal de voz: ${member.voice.channel.name}`);
      }

      // 5. Crear el reproductor de audio
      const player = createAudioPlayer();

      // 6. Guardar el player activo para este servidor
      this.activePlayers.set(guildId, player);

      // 7. Cargar el archivo de audio desde el filepath proporcionado
      const resource = createAudioResource(audioFilePath);

      // 8. Suscribir la conexión al reproductor
      connection.subscribe(player);

      // 9. Reproducir el audio
      player.play(resource);

      console.log(`🎵 Reproduciendo: ${audioFilePath}`);

      // 10. Cuando termine el audio, solo loguearlo (NO desconectar)
      player.on(AudioPlayerStatus.Idle, () => {
        console.log('✅ Audio reproducido. Bot sigue conectado al canal de voz.');
      });

    } catch (error) {
      console.error('❌ Error al reproducir audio:', error);
    }
  }

  private async handleStopCommand(message: Message) {
    try {
      // Verificar que el mensaje viene de un servidor
      if (!message.guild) {
        return;
      }

      const guildId = message.guild.id;
      const connection = this.activeConnections.get(guildId);
      const player = this.activePlayers.get(guildId);

      // Si no hay conexión activa, no hacer nada
      if (!connection) {
        return;
      }

      // Si hay un player activo, detenerlo
      if (player) {
        player.stop();
        this.activePlayers.delete(guildId);
        console.log('⏹️ Reproducción detenida');
      }

      // Desconectar el bot del canal de voz
      connection.destroy();
      this.activeConnections.delete(guildId);

      console.log('✅ Bot desconectado del canal de voz');
    } catch (error) {
      console.error('❌ Error al detener reproducción:', error);
    }
  }

  private async handleHelpCommand(message: Message) {
    try {
      // Obtener todos los sonidos de la base de datos
      const sounds = await this.soundsService.getAllSounds();

      // Crear la lista de comandos
      let commandList = '🎵 **Comandos disponibles:**\n\n';
      
      // Comandos especiales
      commandList += '**📋 Comandos del sistema:**\n';
      commandList += '• `!iluminame` - Frase épica aleatoria\n';
      commandList += '• `!help` - Muestra esta lista\n';
      commandList += '• `!stop` - Detiene la reproducción y desconecta el bot\n\n';
      
      // Comandos de audio
      if (sounds.length > 0) {
        commandList += '**🔊 Comandos de audio:**\n';
        sounds.forEach(sound => {
          commandList += `• \`${sound.command}\`\n`;
        });
      } else {
        commandList += '**🔊 Comandos de audio:**\n';
        commandList += '_No hay sonidos configurados todavía._\n';
      }

      commandList += `\n💡 Total: ${sounds.length} sonido(s) disponible(s)`;

      // Enviar la lista
      if ('send' in message.channel) {
        message.channel.send(commandList);
      }
    } catch (error) {
      console.error('❌ Error al listar comandos:', error);
      if ('send' in message.channel) {
        message.channel.send('❌ Error al obtener la lista de comandos.');
      }
    }
  }
}

