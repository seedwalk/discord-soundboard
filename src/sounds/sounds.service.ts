import { Injectable } from '@nestjs/common';
import { SoundsRepository, Sound } from './sounds.repository';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

@Injectable()
export class SoundsService {
  constructor(private soundsRepository: SoundsRepository) {}

  async getAllSounds(): Promise<Sound[]> {
    return await this.soundsRepository.findAll();
  }

  async getSoundById(id: number): Promise<Sound | null> {
    return await this.soundsRepository.findById(id);
  }

  async getSoundByCommand(command: string): Promise<Sound | null> {
    return await this.soundsRepository.findByCommand(command);
  }

  async createSound(command: string, filepath: string): Promise<Sound> {
    // Verificar que el comando empiece con !
    if (!command.startsWith('!')) {
      throw new Error('El comando debe empezar con !');
    }

    // Verificar que el archivo existe
    if (!existsSync(filepath)) {
      throw new Error('El archivo no existe');
    }

    // Verificar que no exista ya ese comando
    const existing = await this.soundsRepository.findByCommand(command);
    if (existing) {
      throw new Error('Ya existe un sonido con ese comando');
    }

    return await this.soundsRepository.create(command, filepath);
  }

  async deleteSound(id: number): Promise<boolean> {
    const sound = await this.soundsRepository.findById(id);
    if (!sound) {
      throw new Error('Sonido no encontrado');
    }

    // Eliminar el archivo físico
    try {
      if (existsSync(sound.filepath)) {
        await fs.unlink(sound.filepath);
      }
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
    }

    return await this.soundsRepository.delete(id);
  }
}

