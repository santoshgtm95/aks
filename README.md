# AKZ Management System

A full-stack management system built with ASP.NET Core Web API and React TypeScript.

## Features
- **Authentication**: JWT-based login with role-based access control.
- **Dashboard**: Real-time reports from warehouse and sales.
- **Warehouse**: Register, edit, and delete products with stock tracking.
- **Sales**: Record sales transactions with automatic stock deduction.
- **Staff Management**: Create and manage staff members with specific roles (Owner, Manager, Seller, Warehouse Manager).

## Tech Stack
- **Backend**: ASP.NET Core 9.0, Entity Framework Core, SQL Server.
- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS.
- **Database**: SQL Server (LocalDB/Docker).

## Prerequisites
- .NET 9.0 SDK
- Node.js (v20+)
- SQL Server running at `localhost, 1433`

## Getting Started

### 1. Database Setup
The application is configured to use:
- **Server**: `localhost, 1433`
- **Database**: `AKZ`
- **User**: `sa`
- **Password**: `saPassword1234`

The database will be created and seeded automatically when you run the API.

### 2. Run the Backend (API)
```bash
cd AKZ.API
dotnet run
```
The API will be available at `http://localhost:5159`.

### 3. Run the Frontend (Client)
```bash
cd client
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

## Default Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `Owner` (Full Access)
