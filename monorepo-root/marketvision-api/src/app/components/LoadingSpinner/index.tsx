interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'auth' | 'page' | 'overlay';
  isVisible?: boolean;
  progress?: number; // 0-100 для прогресс-бара
  showProgress?: boolean; // показывать ли прогресс-бар
}

export default function LoadingSpinner({ 
  message = 'Загрузка...', 
  size = 'medium',
  variant = 'auth',
  isVisible = true,
  progress = 0,
  showProgress = false
}: LoadingSpinnerProps) {
  if (!isVisible) return null;

  // Для оверлея (на странице) - простой спиннер без контейнера
  if (variant === 'overlay') {
    return (
      <div className="loadingSpinner loadingSpinner--overlay">
        {showProgress ? (
          <div className="loadingSpinner__progress-container">
            <div className="loadingSpinner__progress-bar">
              <div 
                className="loadingSpinner__progress-fill"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
            <div className="loadingSpinner__progress-text">{Math.round(progress)}%</div>
          </div>
        ) : (
          <div className={`loadingSpinner__spinner loadingSpinner__spinner--${size}`}></div>
        )}
        <div className="loadingSpinner__message">{message}</div>
      </div>
    );
  }

  // Для авторизации - с контейнером
  if (variant === 'auth') {
    return (
      <div className="authContainer">
        <div className="authForm">
          <div className="loadingSpinner">
            <div className={`loadingSpinner__spinner loadingSpinner__spinner--${size}`}></div>
            <div className="loadingSpinner__message">{message}</div>
          </div>
        </div>
      </div>
    );
  }

  // Для загрузки страницы - простой спиннер
  return (
    <div className="loadingSpinner loadingSpinner--page">
      <div className={`loadingSpinner__spinner loadingSpinner__spinner--${size}`}></div>
      <div className="loadingSpinner__message">{message}</div>
    </div>
  );
}
