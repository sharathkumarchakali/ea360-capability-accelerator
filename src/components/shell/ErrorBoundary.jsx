import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[EA360] UI error boundary', error, info)
  }

  render() {
    if (this.state.error) {
      const onRecover = this.props.onRecover
      return (
        <div className="error-boundary" role="alert">
          <h2>Something went wrong in this view</h2>
          <p>
            The prototype recovered safely. You can return to the Executive Cockpit or reset the
            demonstration.
          </p>
          <p className="error-boundary-detail">{String(this.state.error?.message || this.state.error)}</p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn primary primary-button"
              onClick={() => {
                this.setState({ error: null })
                onRecover?.('cockpit')
              }}
            >
              Return to Executive Cockpit
            </button>
            <button
              type="button"
              className="btn secondary-button"
              onClick={() => {
                this.setState({ error: null })
                onRecover?.('reset')
              }}
            >
              Reset demonstration
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
