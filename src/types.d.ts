export interface DBSchema {
    userId: string;
    targetLanguage: string;
    translations: TranslationRecord[];
};

export interface TranslationRecord {
    originalText: string;
    translatedText: string;
    timestamp: string;
};

export interface ITranslationRecord {
    originalText: string;
    translatedText: string;
    timestamp: Date;
};

export interface IUser extends Document {
    userId: string;
    targetLanguage: string;
    translations: ITranslationRecord[];
};