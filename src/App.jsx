import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Routes from "./Routes";
import { OnlineStatusProvider } from "./contexts/OnlineStatusContext";
import NetworkStatusIndicator from "./components/NetworkStatusIndicator";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

function App() {
  return (
    <OnlineStatusProvider>
      <AuthProvider>
        <NetworkStatusIndicator />
        <PWAInstallPrompt onDismiss={() => {}} />
        <Routes />
      </AuthProvider>
    </OnlineStatusProvider>
  );
}

export default App;
