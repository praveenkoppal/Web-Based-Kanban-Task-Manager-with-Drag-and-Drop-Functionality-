# Work Like Pro

This is an Angular kanban board demo. All of the application's data (columns, tasks, and user accounts) is stored in the browser's localStorage, so it persists across page reloads.

A login/registration flow lets you create an account or log in with the default credentials **admin / admin1234**. After authentication you'll be taken to the board; sessions are stored in `localStorage` and may be cleared via the logout button.

## Local storage details

- Data is kept under keys `kanban.columns`, `kanban.tasks`, and `kanban.users`.
- Default columns and sample tasks are initialized automatically on first run.
- Usernames must be unique.

## Task filtering

The board header includes a text search for task title/description **and** a priority
selector that can narrow the view to High, Medium, or Low priority tasks. Either or
both filters may be active simultaneously.

## Server-side rendering (SSR)

When running the Node/SSR server (`npm run serve:ssr:work-like-pro`),
requests from `localhost` are whitelisted by default.  This prevents Angular's
built‑in SSRF protection from rejecting the URL and falling back to client
rendering.  If you host the app on another domain, add that hostname to the
`allowedHosts` array in `src/server.ts`.

## Development server

To start a local development server, run:

```bash
npm install
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Notifications service

This application includes a simple toast-style notification system. To use it from
any component inject `NotificationService` and call one of the helpers:

```ts
constructor(private notifications: NotificationService) {}

// ...later
this.notifications.success('Saved!');
this.notifications.error('Failed to save');
```

Each notification is automatically dismissed after **two seconds** and a slide‑out
animation plays before it disappears. Manual dismissal is provided via a close
button rendered by `<app-notification-container>`, which should be placed once in
the application shell (e.g. `app.html`).

## Task search

A search field is available at the top of the board header. Entering text
filters all columns in real time; only tasks whose title or description contain
the search term (case‑insensitive) will remain visible. A clear (✖) button
appears on the right side of the field when text is entered, allowing users to
quickly reset the filter. The column header shows both the filtered count and
the total number of tasks (e.g. "3 / 8").

Unit tests in `column.spec.ts` and `board.spec.ts` cover the new filter logic.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
