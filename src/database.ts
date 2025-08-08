import * as fs from 'fs/promises';
import * as path from 'path';
import * as Types from './types';

const DB_FILE_PATH = path.join(__dirname, '../db.json');

class Database {
    private data: Types.DBSchema[] = [];

    async initialize(): Promise<void> {
        try {
            const fileContent = await fs.readFile(DB_FILE_PATH, 'utf-8');
            this.data = JSON.parse(fileContent);
            console.log('Database loaded successfully');
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log('Database file not found, creating new one...');
                this.data = [];
                await this.save();
                console.log('New database file created');
            } else {
                console.error('Error reading database file:', error);
                throw error;
            }
        }
    }

    async save(): Promise<void> {
        try {
            await fs.writeFile(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error saving database file:', error);
            throw error;
        }
    }

    getData(): Types.DBSchema[] {
        return this.data;
    }

    findUser(userId: string): Types.DBSchema | undefined {
        return this.data.find(user => user.userId === userId);
    }

    async upsertUser(userId: string, targetLanguage: string): Promise<void> {
        const existingUser = this.findUser(userId);
        
        if (existingUser) {
            existingUser.targetLanguage = targetLanguage;
        } else {
            this.data.push({userId,targetLanguage,translations: []});
        }
        
        await this.save();
    }

    async addTranslation(userId: string, originalText: string, translatedText: string): Promise<void> {
        const user = this.findUser(userId);
        if (!user) throw new Error(`User with ID ${userId} not found`);
        const translationRecord: Types.TranslationRecord = {originalText,translatedText,timestamp: new Date().toISOString()};
        user.translations.push(translationRecord);
        await this.save();
    }

    getUserTranslations(userId: string): Types.TranslationRecord[] {
        const user = this.findUser(userId);
        return user ? user.translations : [];
    }

    async removeUser(userId: string): Promise<boolean> {
        const initialLength = this.data.length;
        this.data = this.data.filter(user => user.userId !== userId);
        
        if (this.data.length < initialLength) {
            await this.save();
            return true;
        }
        
        return false;
    }

    async clearUserTranslations(userId: string): Promise<boolean> {
        const user = this.findUser(userId);
        
        if (user) {
            user.translations = [];
            await this.save();
            return true;
        }
        
        return false;
    }

    getUserCount(): number {
        return this.data.length;
    }

    getTotalTranslationCount(): number {
        return this.data.reduce((total, user) => total + user.translations.length, 0);
    }

    getUserTargetLanguage(userId: string): string | null {
        const user = this.findUser(userId);
        return user ? user.targetLanguage : null;
    }

    userExists(userId: string): boolean {
        return this.findUser(userId) !== undefined;
    }
}

export const database = new Database();