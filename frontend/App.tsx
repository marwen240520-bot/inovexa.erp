# Architecture Inovexa-AI ERP

\\\mermaid
graph TB
    subgraph Frontend
        A[Next.js App]
        B[React Components]
        C[Context API]
        D[Tailwind CSS]
    end
    
    subgraph Backend
        E[NestJS API]
        F[Auth Module]
        G[Finance Module]
        H[Inventory Module]
        I[HR Module]
        J[Sales Module]
        K[Production Module]
        L[AI Module]
    end
    
    subgraph Database
        M[PostgreSQL]
        N[Redis Cache]
    end
    
    subgraph External
        O[Stripe]
        P[SendGrid]
        Q[Sentry]
    end
    
    A --> E
    E --> M
    E --> N
    E --> O
    E --> P
    E --> Q
\\\
"@ | Out-File -FilePath "C:\inovexa-erp\docs\architecture.md" -Encoding utf8

Write-Host "  ✅ Phase 2 terminée" -ForegroundColor Green

# ============================================
# PHASE 3: APPLICATION MOBILE (React Native)
# ============================================
Write-Host "[PHASE 3] APPLICATION MOBILE..." -ForegroundColor Yellow

cd C:\inovexa-erp
npx create-expo-app InovexaMobile --template blank-typescript

cd InovexaMobile

# Installation des dépendances
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install axios react-native-async-storage/async-storage
npm install expo-camera expo-barcode-scanner
npm install expo-notifications expo-local-authentication
npm install react-native-gesture-handler
npm install expo-location

# Création des dossiers
New-Item -ItemType Directory -Force -Path "src\screens" | Out-Null
New-Item -ItemType Directory -Force -Path "src\components" | Out-Null
New-Item -ItemType Directory -Force -Path "src\services" | Out-Null
New-Item -ItemType Directory -Force -Path "src\contexts" | Out-Null

# App.tsx
@"
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import EmployeesScreen from './src/screens/EmployeesScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription' }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
          <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Factures' }} />
          <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Produits' }} />
          <Stack.Screen name="Employees" component={EmployeesScreen} options={{ title: 'Employés' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
