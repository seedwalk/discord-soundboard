import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface Sound {
  id: number;
  command: string;
  filepath: string;
}

@Injectable()
export class SoundsRepository {
  constructor(private dataSource: DataSource) {
    // Crear la tabla si no existe
    this.initTable();
  }

  private async initTable() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS sounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        command TEXT NOT NULL UNIQUE,
        filepath TEXT NOT NULL
      )
    `);

    // Insertar el comando !byebye por defecto si no existe
    const existing = await this.findByCommand('!byebye');
    if (!existing) {
      await this.dataSource.query(
        `INSERT INTO sounds (command, filepath) VALUES (?, ?)`,
        ['!byebye', 'assets/byebye.mp3']
      );
      console.log('✅ Comando !byebye agregado por defecto a la base de datos');
    }
  }

  async findAll(): Promise<Sound[]> {
    return await this.dataSource.query(`
      SELECT id, command, filepath FROM sounds
    `);
  }

  async findById(id: number): Promise<Sound | null> {
    const result = await this.dataSource.query(
      `SELECT id, command, filepath FROM sounds WHERE id = ?`,
      [id]
    );
    return result[0] || null;
  }

  async findByCommand(command: string): Promise<Sound | null> {
    const result = await this.dataSource.query(
      `SELECT id, command, filepath FROM sounds WHERE command = ?`,
      [command]
    );
    return result[0] || null;
  }

  async create(command: string, filepath: string): Promise<Sound> {
    const result = await this.dataSource.query(
      `INSERT INTO sounds (command, filepath) VALUES (?, ?)`,
      [command, filepath]
    );
    
    return {
      id: result.insertId || result.lastID,
      command,
      filepath,
    };
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.dataSource.query(
      `DELETE FROM sounds WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0 || result.changes > 0;
  }
}

