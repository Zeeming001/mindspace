import { Component } from "react";

/**
 * ErrorBoundary — catches runtime errors inside visualizations so a
 * crash in ForceGraph or MDSPlot doesn't white-screen the whole app.
 *
 * Usage:
 *   <ErrorBoundary label="concept map">
 *     <ForceGraph … />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: "2rem",
          textAlign: "center",
          color: "#aaa",
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          border: "1px dashed #e0dbd3",
          borderRadius: "4px",
        }}>
          {this.props.label
            ? `Could not render ${this.props.label}`
            : "Visualization unavailable"}
        </div>
      );
    }
    return this.props.children;
  }
}
