'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import '../styles/components/error-boundary.scss';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="errorContainer">
          <h2>Что-то пошло не так 😢</h2>
          <p>Произошла ошибка при загрузке данных.</p>
          <button
            className="retryButton"
            onClick={() => this.setState({ hasError: false })}
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 