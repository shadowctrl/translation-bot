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