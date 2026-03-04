import React from 'react';

interface Props {
  onRetry: () => void;
  onDismiss?: () => void;
}

export default function CameraPermissionModal({ onRetry, onDismiss }: Props) {
  return (
    <div className="cam-permission-overlay">
      <div className="cam-permission-card">
        {onDismiss && (
          <button className="cam-permission-back" onClick={onDismiss}>
            ← Back
          </button>
        )}

        <div className="cam-permission-icon">📷</div>
        <h2 className="cam-permission-title">Camera Access Required</h2>
        <p className="cam-permission-body">
          Shank needs camera access for Live Mode and Setup Assistant.
        </p>

        <div className="cam-permission-steps">
          <p className="cam-steps-header">To enable on iPhone / iPad:</p>
          <ol>
            <li>Open the <strong>Settings</strong> app</li>
            <li>Scroll down and tap <strong>Safari</strong><br />
              <span className="cam-steps-note">(or Chrome / Firefox if you use those)</span>
            </li>
            <li>Tap <strong>Camera</strong></li>
            <li>Select <strong>Allow</strong></li>
            <li>Return here and tap "Try Again"</li>
          </ol>
        </div>

        <div className="cam-permission-note">
          ⚠️ Camera access requires HTTPS. Make sure you're accessing the app
          via <code>https://</code> — plain HTTP will not work on iOS.
        </div>

        <button className="cam-permission-retry" onClick={onRetry}>
          Try Again
        </button>
      </div>
    </div>
  );
}
