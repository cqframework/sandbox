import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        // surfacing the stack in the dev console too
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary]', error, info);
        this.setState({ info });
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
                    <h2>Something went wrong.</h2>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
                    {this.state.info ? (
                        <details style={{ marginTop: 12 }}>
                            <summary>Component stack</summary>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.info.componentStack}</pre>
                        </details>
                    ) : null}
                </div>
            );
        }
        return this.props.children;
    }
}
