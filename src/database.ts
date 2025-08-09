import mongoose, { Schema, Model } from 'mongoose';
import * as Types from './types';

const TranslationRecordSchema = new Schema<Types.ITranslationRecord>({
	originalText: { type: String, required: true },
	translatedText: { type: String, required: true },
	timestamp: { type: Date, default: Date.now },
});

const UserSchema = new Schema<Types.IUser>(
	{
		userId: { type: String, required: true, unique: true },
		targetLanguage: { type: String, required: true },
		translations: [TranslationRecordSchema],
	},
	{ timestamps: true }
);

const UserModel: Model<Types.IUser> = mongoose.model<Types.IUser>('User', UserSchema);

class Database {
	private isConnected: boolean = false;

	async initialize(): Promise<void> {
		try {
			const mongoUri = process.env.MONGO_URI;
			if (!mongoUri) throw new Error('MONGO_URI environment variable is not set');
			await mongoose.connect(mongoUri);
			this.isConnected = true;
			console.log('Connected to MongoDB successfully');
		} catch (error) {
			console.error('Error connecting to MongoDB:', error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		if (this.isConnected) {
			await mongoose.disconnect();
			this.isConnected = false;
			console.log('Disconnected from MongoDB');
		}
	}

	private ensureConnection(): void {
		if (!this.isConnected) throw new Error('Database not connected. Call initialize() first.');
	}

	async getData(): Promise<Types.DBSchema[]> {
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
		} catch (error) {
			console.error('Error fetching all users:', error);
			throw error;
		}
	}

	async findUser(userId: string): Promise<Types.DBSchema | undefined> {
		this.ensureConnection();
		try {
			const user = await UserModel.findOne({ userId }).lean();
			if (!user) return undefined;

			return {
				userId: user.userId,
				targetLanguage: user.targetLanguage,
				translations: user.translations.map((t) => ({
					originalText: t.originalText,
					translatedText: t.translatedText,
					timestamp: t.timestamp.toISOString(),
				})),
			};
		} catch (error) {
			console.error('Error finding user:', error);
			throw error;
		}
	}

	async upsertUser(userId: string, targetLanguage: string): Promise<void> {
		this.ensureConnection();
		try {
			await UserModel.findOneAndUpdate({ userId }, { $set: { targetLanguage } }, { upsert: true, new: true });
		} catch (error) {
			console.error('Error upserting user:', error);
			throw error;
		}
	}

	async addTranslation(userId: string, originalText: string, translatedText: string): Promise<void> {
		this.ensureConnection();
		try {
			const user = await UserModel.findOne({ userId });
			if (!user) throw new Error(`User with ID ${userId} not found`);
			user.translations.push({ originalText, translatedText, timestamp: new Date() });
			await user.save();
		} catch (error) {
			console.error('Error adding translation:', error);
			throw error;
		}
	}

	async getUserTranslations(userId: string): Promise<Types.TranslationRecord[]> {
		this.ensureConnection();
		try {
			const user = await UserModel.findOne({ userId }).lean();
			if (!user) return [];
			return user.translations.map((t) => ({ originalText: t.originalText, translatedText: t.translatedText, timestamp: t.timestamp.toISOString() }));
		} catch (error) {
			console.error('Error getting user translations:', error);
			throw error;
		}
	}

	async removeUser(userId: string): Promise<boolean> {
		this.ensureConnection();
		try {
			const result = await UserModel.deleteOne({ userId });
			return result.deletedCount > 0;
		} catch (error) {
			console.error('Error removing user:', error);
			throw error;
		}
	}

	async clearUserTranslations(userId: string): Promise<boolean> {
		this.ensureConnection();
		try {
			const result = await UserModel.updateOne({ userId }, { $set: { translations: [] } });
			return result.modifiedCount > 0;
		} catch (error) {
			console.error('Error clearing user translations:', error);
			throw error;
		}
	}

	async getUserCount(): Promise<number> {
		this.ensureConnection();
		try {
			return await UserModel.countDocuments();
		} catch (error) {
			console.error('Error getting user count:', error);
			throw error;
		}
	}

	async getTotalTranslationCount(): Promise<number> {
		this.ensureConnection();
		try {
			const result = await UserModel.aggregate([{ $project: { translationCount: { $size: '$translations' } } }, { $group: { _id: null, total: { $sum: '$translationCount' } } }]);
			return result.length > 0 ? result[0].total : 0;
		} catch (error) {
			console.error('Error getting total translation count:', error);
			throw error;
		}
	}

	async getUserTargetLanguage(userId: string): Promise<string | null> {
		this.ensureConnection();
		try {
			const user = await UserModel.findOne({ userId }, 'targetLanguage').lean();
			return user ? user.targetLanguage : null;
		} catch (error) {
			console.error('Error getting user target language:', error);
			throw error;
		}
	}

	async userExists(userId: string): Promise<boolean> {
		this.ensureConnection();
		try {
			const user = await UserModel.findOne({ userId }, '_id').lean();
			return user !== null;
		} catch (error) {
			console.error('Error checking if user exists:', error);
			throw error;
		}
	}
}

export const database = new Database();
