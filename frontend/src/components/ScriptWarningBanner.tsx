import './ScriptWarningBanner.css';

interface ScriptWarningBannerProps {
  hasScripts: boolean;
}

const MESSAGE =
  'This request contains Postman scripts that cannot be executed. The request may not behave exactly as it does in Postman.';

export function ScriptWarningBanner({ hasScripts }: ScriptWarningBannerProps) {
  if (!hasScripts) return null;
  return (
    <div className="script-warning-banner" role="alert">
      <span className="script-warning-banner__icon">⚠️</span>
      <span className="script-warning-banner__text">{MESSAGE}</span>
    </div>
  );
}
