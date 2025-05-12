# CRM Backend - NestJS & Prisma

This project is the backend for a Customer Relationship Management (CRM) application, built with NestJS (a Node.js framework) and Prisma (an ORM for database interaction with PostgreSQL).

## Project Overview

The goal is to create a robust and scalable backend API that supports core CRM functionalities including managing contacts, deals, notes, tasks, and users, with secure authentication.

## Tech Stack

* **Framework:** NestJS
* **Language:** TypeScript
* **Database ORM:** Prisma
* **Database:** PostgreSQL
* **Authentication:** JWT (JSON Web Tokens) using Passport.js
* **Password Hashing:** bcrypt
* **ID Generation:** UUIDs (generated in application code)
* **Validation:** `class-validator` and `class-transformer` via NestJS `ValidationPipe`

## Current Features Implemented

As of the current state, the following features and modules have been implemented and tested:

1.  **Project Setup:**
    * NestJS project initialized.
    * Prisma integrated with PostgreSQL database.
    * Environment variables configured (`.env` for `DATABASE_URL`, `JWT_SECRET`).
    * Global `ValidationPipe` enabled for automatic request DTO validation.

2.  **Database Schema:**
    * Defined using `schema.prisma` for the following models:
        * `User`: Stores user information (email, password hash, role, etc.).
        * `Contact`: Stores contact details (name, email, phone, company, lead status, owner, etc.).
        * `Note`: Stores notes associated with Users, Contacts, Deals, or Tasks.
        * `Deal`: Stores deal information (name, value, stage, associated contacts, etc.).
        * `Task`: Basic structure for tasks (title, due date, status, etc.).
        * `Submission`: Basic structure for deal submissions (lender, status, approval details, etc.).
    * Relationships between models are defined (e.g., a Contact has an Owner (User), a Deal has Contacts, Notes can belong to various entities).
    * IDs for all primary models are generated as UUIDs within the application services (after initially attempting database-level defaults).

3.  **Contacts Module (`/contacts`):**
    * Full CRUD (Create, Read, Update, Delete) operations for contacts.
    * DTOs (`CreateContactDto`, `UpdateContactDto`) for request validation.
    * Searching contacts.
    * Endpoints protected by JWT authentication.

4.  **Deals Module (`/deals`):**
    * Full CRUD operations for deals.
    * DTOs (`CreateDealDto`, `UpdateDealDto`) for request validation.
    * Ability to link deals to existing contacts via `contactIds` during creation and update.
    * Endpoints protected by JWT authentication.

5.  **Notes Module (`/notes`):**
    * CRUD operations for notes.
    * DTOs (`CreateNoteDto`, `UpdateNoteDto`) for request validation.
    * Notes are automatically associated with the logged-in user as the author.
    * Ability to link notes to Contacts or Deals.
    * Endpoints to retrieve notes by `contactId` or `dealId`.
    * Endpoints protected by JWT authentication.

6.  **Authentication Module (`/auth`):**
    * User registration (`/auth/register`) with email, password (hashed using bcrypt), and name.
    * User login (`/auth/login`) which returns a JWT access token upon successful credential validation.
    * `JwtStrategy` implemented to validate JWTs from `Authorization: Bearer <token>` headers.
    * `JwtAuthGuard` created and applied to protect the Contacts, Deals, and Notes modules.

## Setup and Running the Project

1.  **Prerequisites:**
    * Node.js (LTS version recommended)
    * npm (comes with Node.js)
    * PostgreSQL server running
    * An API client like Postman

2.  **Installation:**
    * Clone the repository (if applicable).
    * Navigate to the project root directory.
    * Install dependencies: `npm install`
    * Install `@nestjs/config` if not already present: `npm install @nestjs/config`

3.  **Environment Configuration:**
    * Create a `.env` file in the project root.
    * Add your PostgreSQL connection string: `DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public"`
    * Add a JWT secret key: `JWT_SECRET="YOUR_STRONG_SECRET_KEY"`

4.  **Database Migration:**
    * Ensure the `pgcrypto` extension is enabled in your PostgreSQL database:
        ```sql
        -- Run in pgAdmin Query Tool connected to your target database (or a template database)
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        ```
    * Apply migrations: `npx prisma migrate dev --name initial-setup` (or `npx prisma migrate reset` if starting fresh or encountering issues, especially after schema changes like removing ID defaults).

5.  **Generate Prisma Client:**
    * `npx prisma generate` (often run automatically by `migrate dev` or `reset`).

6.  **Run the Application:**
    * `npm run start:dev`
    * The application will typically be available at `http://localhost:3000`.

## Future Work / Roadmap (To Achieve Full Functionality)

This section outlines the key areas that still need to be implemented or enhanced to create a fully functional CRM backend.

1.  **Tasks Module (`/tasks`):**
    * Implement full CRUD operations for tasks.
    * Define `CreateTaskDto` and `UpdateTaskDto`.
    * Implement logic for assigning tasks to users (likely using the authenticated user or allowing assignment to others).
    * Implement logic for relating tasks to Contacts and Deals.
    * Protect endpoints with `JwtAuthGuard`.
    * Update `Note` model and service to allow linking notes to Tasks (requires schema change and migration).

2.  **Submissions Module (`/submissions`):**
    * Implement full CRUD operations for deal submissions.
    * Define `CreateSubmissionDto` and `UpdateSubmissionDto`.
    * Ensure submissions are correctly linked to Deals.
    * Protect endpoints with `JwtAuthGuard`.

3.  **User Management & Roles:**
    * **User Profile Endpoint:** Create a `GET /auth/profile` endpoint (protected) to allow logged-in users to fetch their own profile information.
    * **Update User Endpoint:** Allow users to update their own profile (e.g., name, maybe password - requires current password validation).
    * **Admin User Management (Optional):** If needed, create admin-only endpoints to manage users (list, update roles, deactivate). This would require role-based authorization.
    * **Refine User Model:** Add any other necessary fields to the `User` model (e.g., avatar, phone number).

4.  **Enhanced Authorization (Permissions & Ownership):**
    * Implement logic to ensure users can only access/modify data they own or have permission for (e.g., a sales rep can only see/edit their own contacts/deals, an admin can see all).
    * This involves:
        * Adding `ownerId` fields to relevant models like `Deal` (currently commented out in schema) and `Task`. Ensure these are populated correctly (e.g., using the authenticated user's ID during creation).
        * Updating service methods (especially `findAll`, `findOne`, `update`, `remove`) to filter data based on the authenticated user's ID (`req.user.id`) and role (`req.user.role`).
        * Potentially creating custom NestJS Guards for role-based or ownership-based access control on specific actions.

5.  **Password Management:**
    * Implement a "Forgot Password" flow (e.g., generate reset token, send email - requires email service integration like SendGrid, Nodemailer).
    * Implement a "Reset Password" endpoint.
    * Implement a "Change Password" endpoint for logged-in users (requiring current password).

6.  **Advanced Features (Examples):**
    * **File Uploads:** For attachments to notes, deals, etc. (e.g., using `@nestjs/platform-express` for `Multer`).
    * **Reporting/Analytics Endpoints:** To provide data for dashboards.
    * **Activity Logging:** Track user actions within the CRM (e.g., who created/updated what and when).
    * **Notifications:** In-app or email notifications for important events.
    * **WebSockets:** For real-time updates (e.g., if a deal stage changes).

7.  **Refined Error Handling & Logging:**
    * Implement more granular error handling and consistent error response formats across the API.
    * Integrate a more robust logging solution (e.g., Winston, Pino) for production environments.

8.  **Testing:**
    * **Unit Tests:** Write unit tests for services and controllers (e.g., using Jest, which is set up by default with NestJS).
    * **End-to-End (E2E) Tests:** Write E2E tests to verify the full API request/response flow.
    * Expand Postman collection with more comprehensive tests for all edge cases and validation rules.

9.  **API Documentation:**
    * Leverage NestJS's OpenAPI (Swagger) integration (`@nestjs/swagger`) to automatically generate interactive API documentation.

10. **Deployment & Production Considerations:**
    * Containerization (e.g., Docker).
    * Setting up a production database.
    * Managing environment variables securely for production (e.g., using a secrets manager).
    * HTTPS configuration.
    * Rate limiting, security headers (e.g., using `helmet`).

## Frontend Connection Path

To connect a frontend application (e.g., built with React, Vue, Angular) to this backend:

1.  **API Base URL:** The frontend will need to know the base URL of this API (e.g., `http://localhost:3000` for local development, or the production URL).
2.  **HTTP Requests:** Use `fetch` or a library like `axios` in the frontend to make HTTP requests to the backend endpoints (e.g., `GET /contacts`, `POST /auth/login`).
3.  **Authentication:**
    * On login, the frontend receives the `access_token` from `POST /auth/login`.
    * This token should be stored securely in the frontend (e.g., `localStorage`, `sessionStorage`, or in memory with a state management solution).
    * For subsequent requests to protected backend routes, the frontend must include this token in the `Authorization` header as a Bearer token: `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`.
4.  **CORS (Cross-Origin Resource Sharing):** The NestJS backend needs to be configured to allow requests from the frontend's domain. This is typically done in `src/main.ts` by enabling CORS:
    ```typescript
    // In src/main.ts
    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      // ... other setup ...

      app.enableCors({
        origin: '[http://your-frontend-domain.com](http://your-frontend-domain.com)', // Or true for all origins during development, or an array of origins
        // methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        // allowedHeaders: 'Content-Type, Accept, Authorization',
        // credentials: true, // If you need to send cookies or use session-based auth with CORS
      });

      // ... rest of bootstrap ...
      await app.listen(3000);
    }
    ```
5.  **Data Handling:** The frontend will fetch data from the backend, display it, and send data back to the backend for creation/updates.

By tackling the "Future Work / Roadmap" items systematically, this backend can evolve into a comprehensive and secure CRM system.