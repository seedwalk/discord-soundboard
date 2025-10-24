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

      // 6. Cargar el archivo de audio desde el filepath proporcionado
      const resource = createAudioResource(audioFilePath);

      // 7. Suscribir la conexión al reproductor
      connection.subscribe(player);

      // 8. Reproducir el audio
      player.play(resource);

      console.log(`🎵 Reproduciendo: ${audioFilePath}`);

      // 9. Cuando termine el audio, solo loguearlo (NO desconectar)
      player.on(AudioPlayerStatus.Idle, () => {
        console.log('✅ Audio reproducido. Bot sigue conectado al canal de voz.');
      });

    } catch (error) {
      console.error('❌ Error al reproducir audio:', error);
    }
  }
}

