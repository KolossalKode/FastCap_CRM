# CRM Frontend

This is a minimal React frontend for the CRM backend. It uses [Vite](https://vitejs.dev/) for development.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
   (Run this in the `frontend` directory.)

2. Create a `.env` file in the `frontend` directory and specify the backend URL:
   ```bash
   VITE_API_BASE=http://localhost:3000
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The app will run on [http://localhost:5173](http://localhost:5173) by default and will communicate with the backend API specified in `VITE_API_BASE`.

This minimal example demonstrates logging in to the backend and fetching contacts. It can be expanded with the full React UI as needed.
