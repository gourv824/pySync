# Application Architecture

This document provides a high-level overview of the pySync CRM architecture.

## 1. Backend Architecture
The backend is built with **Node.js** and **Express**, utilizing a file-based JSON database for persistence.

```mermaid
graph TD
    A[Express Server] --> B[Middleware]
    B --> C[Auth/RBAC]
    B --> D[Logging]
    A --> E[Controllers]
    E --> F[Repositories]
    F --> G[(JSON Database)]
    E --> H[External Services]
    H --> I[Gemini AI]
    H --> J[Nodemailer]
    H --> K[MinIO/S3]
```

## 2. Frontend (UI) Architecture
The frontend is a **React** Single Page Application powered by **Vite** and **Tailwind CSS**.

```mermaid
graph TD
    A[App.tsx] --> B[Navigation/Routing]
    A --> C[State Management]
    B --> D[Dashboard]
    B --> E[Projects Entry]
    B --> F[Resale Entry]
    B --> G[Admin Portal]
    C --> H[Context/hooks]
    H --> I[LocalStorage]
```

## 3. Full-Stack Data Flow
Interaction between the UI, Backend, and Database.

```mermaid
graph LR
    subgraph Frontend
    UI[React UI] <--> API[API Service]
    end
    
    subgraph Backend
    API <--> SRV[Express Backend]
    SRV <--> DB[(JSON Database)]
    end
    
    subgraph External
    SRV <--> AI[Gemini API]
    SRV <--> MAIL[Email Service]
    end
```
