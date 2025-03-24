const axios = require('axios');
require('dotenv').config();

class TranslationService {
  constructor() {
    this.apiKey = process.env.TRANSLATE_API_KEY;
  }
  
  // Dịch từ tiếng Anh sang tiếng Việt
  async translateToVietnamese(text) {
    try {
      if (!text) return '';
      
      const response = await axios.post(
        'https://translation.googleapis.com/language/translate/v2',
        {},
        {
          params: {
            q: text,
            target: 'vi',
            source: 'en',
            key: this.apiKey
          }
        }
      );
      
      if (response.data && 
          response.data.data && 
          response.data.data.translations && 
          response.data.data.translations.length > 0) {
        return response.data.data.translations[0].translatedText;
      }
      
      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }
  
  // Dịch từ tiếng Việt sang tiếng Anh
  async translateToEnglish(text) {
    try {
      if (!text) return '';
      
      const response = await axios.post(
        'https://translation.googleapis.com/language/translate/v2',
        {},
        {
          params: {
            q: text,
            target: 'en',
            source: 'vi',
            key: this.apiKey
          }
        }
      );
      
      if (response.data && 
          response.data.data && 
          response.data.data.translations && 
          response.data.data.translations.length > 0) {
        return response.data.data.translations[0].translatedText;
      }
      
      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }
  
  // Tự động phát hiện ngôn ngữ và dịch
  async autoTranslate(text, targetLang) {
    try {
      if (!text) return '';
      
      const response = await axios.post(
        'https://translation.googleapis.com/language/translate/v2/detect',
        {},
        {
          params: {
            q: text,
            key: this.apiKey
          }
        }
      );
      
      let detectedLang = 'en';
      if (response.data && 
          response.data.data && 
          response.data.data.detections && 
          response.data.data.detections.length > 0 &&
          response.data.data.detections[0].length > 0) {
        detectedLang = response.data.data.detections[0][0].language;
      }
      
      if (detectedLang === targetLang) {
        return text;
      }
      
      // Dịch sang ngôn ngữ đích
      const translateResponse = await axios.post(
        'https://translation.googleapis.com/language/translate/v2',
        {},
        {
          params: {
            q: text,
            target: targetLang,
            key: this.apiKey
          }
        }
      );
      
      if (translateResponse.data && 
          translateResponse.data.data && 
          translateResponse.data.data.translations && 
          translateResponse.data.data.translations.length > 0) {
        return translateResponse.data.data.translations[0].translatedText;
      }
      
      return text;
    } catch (error) {
      console.error('Auto translation error:', error);
      return text;
    }
  }
}

module.exports = new TranslationService(); 