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
const mongoose_1 = __importStar(require("mongoose"));
const TranslationRecordSchema = new mongoose_1.Schema({
    originalText: { type: String, required: true },
    translatedText: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});
const UserSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, unique: true },
    targetLanguage: { type: String, required: true },
    translations: [TranslationRecordSchema],
}, { timestamps: true });
const UserModel = mongoose_1.default.model('User', UserSchema);
class Database {
    constructor() {
        this.isConnected = false;
    }
    async initialize() {
        try {
            const mongoUri = process.env.MONGO_URI;
            if (!mongoUri)
                throw new Error('MONGO_URI environment variable is not set');
            await mongoose_1.default.connect(mongoUri);
            this.isConnected = true;
            console.log('Connected to MongoDB successfully');
        }
        catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.isConnected) {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            console.log('Disconnected from MongoDB');
        }
    }
    ensureConnection() {
        if (!this.isConnected)
            throw new Error('Database not connected. Call initialize() first.');
    }
    async getData() {
        this.ensureConnection();
        try {
            const users = await UserModel.find().lean();
            return users.map((user) => ({
                userId: user.userId,
                targetLanguage: user.targetLanguage,
                translations: user.translations.map((t) => ({
                    originalText: t.originalText,
                    translatedText: t.translatedText,
                    timestamp: t.timestamp.toISOString(),
                })),
            }));
        }
        catch (error) {
            console.error('Error fetching all users:', error);
            throw error;
        }
    }
    async findUser(userId) {
        this.ensureConnection();
        try {
            const user = await UserModel.findOne({ userId }).lean();
            if (!user)
                return undefined;
            return {
                userId: user.userId,
                targetLanguage: user.targetLanguage,
                translations: user.translations.map((t) => ({
                    originalText: t.originalText,
                    translatedText: t.translatedText,
                    timestamp: t.timestamp.toISOString(),
                })),
            };
        }
        catch (error) {
            console.error('Error finding user:', error);
            throw error;
        }
    }
    async upsertUser(userId, targetLanguage) {
        this.ensureConnection();
        try {
            await UserModel.findOneAndUpdate({ userId }, { $set: { targetLanguage } }, { upsert: true, new: true });
        }
        catch (error) {
            console.error('Error upserting user:', error);
            throw error;
        }
    }
    async addTranslation(userId, originalText, translatedText) {
        this.ensureConnection();
        try {
            const user = await UserModel.findOne({ userId });
            if (!user)
                throw new Error(`User with ID ${userId} not found`);
            user.translations.push({ originalText, translatedText, timestamp: new Date() });
            await user.save();
        }
        catch (error) {
            console.error('Error adding translation:', error);
            throw error;
        }
    }
    async getUserTranslations(userId) {
        this.ensureConnection();
        try {
            const user = await UserModel.findOne({ userId }).lean();
            if (!user)
                return [];
            return user.translations.map((t) => ({ originalText: t.originalText, translatedText: t.translatedText, timestamp: t.timestamp.toISOString() }));
        }
        catch (error) {
            console.error('Error getting user translations:', error);
            throw error;
        }
    }
    async removeUser(userId) {
        this.ensureConnection();
        try {
            const result = await UserModel.deleteOne({ userId });
            return result.deletedCount > 0;
        }
        catch (error) {
            console.error('Error removing user:', error);
            throw error;
        }
    }
    async clearUserTranslations(userId) {
        this.ensureConnection();
        try {
            const result = await UserModel.updateOne({ userId }, { $set: { translations: [] } });
            return result.modifiedCount > 0;
        }
        catch (error) {
            console.error('Error clearing user translations:', error);
            throw error;
        }
    }
    async getUserCount() {
        this.ensureConnection();
        try {
            return await UserModel.countDocuments();
        }
        catch (error) {
            console.error('Error getting user count:', error);
            throw error;
        }
    }
    async getTotalTranslationCount() {
        this.ensureConnection();
        try {
            const result = await UserModel.aggregate([{ $project: { translationCount: { $size: '$translations' } } }, { $group: { _id: null, total: { $sum: '$translationCount' } } }]);
            return result.length > 0 ? result[0].total : 0;
        }
        catch (error) {
            console.error('Error getting total translation count:', error);
            throw error;
        }
    }
    async getUserTargetLanguage(userId) {
        this.ensureConnection();
        try {
            const user = await UserModel.findOne({ userId }, 'targetLanguage').lean();
            return user ? user.targetLanguage : null;
        }
        catch (error) {
            console.error('Error getting user target language:', error);
            throw error;
        }
    }
    async userExists(userId) {
        this.ensureConnection();
        try {
            const user = await UserModel.findOne({ userId }, '_id').lean();
            return user !== null;
        }
        catch (error) {
            console.error('Error checking if user exists:', error);
            throw error;
        }
    }
}
exports.database = new Database();
