'use client';

import { useState } from 'react';

interface AuthFormProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const AuthForm = ({ onLogin }: AuthFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await onLogin(username, password);
      if (!success) {
        setError('Неверный логин или пароль');
      }
    } catch {
      setError('Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authContainer">
      <div className="authForm">
        <h2 className="authForm__title">Авторизация</h2>
        <form onSubmit={handleSubmit}>
          <div className="authForm__field">
            <label className="authForm__label">Логин:</label>
            <input
              type="text"
              className="authForm__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="authForm__field">
            <label className="authForm__label">Пароль:</label>
            <input
              type="password"
              className="authForm__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && (
            <div className="authForm__error">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="authForm__button"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
