import { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorPage } from './ErrorPage';

interface Props {
  children: ReactNode;
}

interface State {
  error?: unknown;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[IV] Render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error !== undefined) {
      return <ErrorPage error={this.state.error} />;
    }
    return this.props.children;
  }
}