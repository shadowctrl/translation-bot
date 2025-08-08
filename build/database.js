"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const DB_FILE_PATH = path.join(__dirname, '../db.json');
class Database {
    constructor() {
        this.data = [];
    }
    async initialize() {
        try {
            const fileContent = await fs.readFile(DB_FILE_PATH, 'utf-8');
            this.data = JSON.parse(fileContent);
            console.log('Database loaded successfully');
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                console.log('Database file not found, creating new one...');
                this.data = [];
                await this.save();
                console.log('New database file created');
            }
            else {
                console.error('Error reading database file:', error);
                throw error;
            }
        }
    }
    async save() {
        try {
            await fs.writeFile(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Error saving database file:', error);
            throw error;
        }
    }
    getData() {
        return this.data;
    }
    findUser(userId) {
        return this.data.find(user => user.userId === userId);
    }
    async upsertUser(userId, targetLanguage) {
        const existingUser = this.findUser(userId);
        if (existingUser) {
            existingUser.targetLanguage = targetLanguage;
        }
        else {
            this.data.push({ userId, targetLanguage, translations: [] });
        }
        await this.save();
    }
    async addTranslation(userId, originalText, translatedText) {
        const user = this.findUser(userId);
        if (!user)
            throw new Error(`User with ID ${userId} not found`);
        const translationRecord = { originalText, translatedText, timestamp: new Date().toISOString() };
        user.translations.push(translationRecord);
        await this.save();
    }
    getUserTranslations(userId) {
        const user = this.findUser(userId);
        return user ? user.translations : [];
    }
    async removeUser(userId) {
        const initialLength = this.data.length;
        this.data = this.data.filter(user => user.userId !== userId);
        if (this.data.length < initialLength) {
            await this.save();
            return true;
        }
        return false;
    }
    async clearUserTranslations(userId) {
        const user = this.findUser(userId);
        if (user) {
            user.translations = [];
            await this.save();
            return true;
        }
        return false;
    }
    getUserCount() {
        return this.data.length;
    }
    getTotalTranslationCount() {
        return this.data.reduce((total, user) => total + user.translations.length, 0);
    }
    getUserTargetLanguage(userId) {
        const user = this.findUser(userId);
        return user ? user.targetLanguage : null;
    }
    userExists(userId) {
        return this.findUser(userId) !== undefined;
    }
}
exports.database = new Database();
