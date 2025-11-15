"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ERROR] Unhandled UI error:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-center mt-20 text-gray-400">Something went wrong.</div>
    }
    return this.props.children
  }
}
