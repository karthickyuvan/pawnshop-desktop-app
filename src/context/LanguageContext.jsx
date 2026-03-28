import { createContext, useContext, useState, useEffect } from "react";
import en from "../i18n/en.json";
import ta from "../i18n/ta.json";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {

  const translations = { en, ta };

  // ✅ Load saved language when app starts
  const savedLang = localStorage.getItem("app-language") || "en";

  const [language, setLanguage] = useState(savedLang);

  const t = (key) => translations[language][key] || key;

  // ✅ Save language whenever it changes
  useEffect(() => {
    localStorage.setItem("app-language", language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);