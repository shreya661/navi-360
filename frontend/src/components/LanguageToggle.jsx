const languages = [
  ['te', 'తెలుగు', 'TE'],
  ['hi', 'हिन्दी', 'HI'],
  ['en', 'English', 'EN'],
  ['ta', 'தமிழ்', 'TA'],
  ['bn', 'বাংলা', 'BN'],
]

export default function LanguageToggle({ language, onChange, disabled = false }) {
  return (
    <div className="language-picker" aria-label="Choose explanation language">
      <span className="eyebrow">Explanation language</span>
      <div className="language-options" role="radiogroup">
        {languages.map(([code, label, short]) => (
          <button
            key={code}
            className={language === code ? 'language active' : 'language'}
            onClick={() => onChange(code)}
            disabled={disabled}
            role="radio"
            aria-checked={language === code}
            aria-label={label}
          >
            <span className="language-wide">{label}</span>
            <span className="language-short">{short}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

