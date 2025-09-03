interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ 
  message = 'Загрузка...', 
  size = 'medium' 
}: LoadingSpinnerProps) {
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
