import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div>
      <h2>{t('Choose Language')}</h2>
      <button onClick={() => changeLanguage('fr')}>{t('French')}</button>
      <button onClick={() => changeLanguage('en')}>{t('English')}</button>
    </div>
  );
}
