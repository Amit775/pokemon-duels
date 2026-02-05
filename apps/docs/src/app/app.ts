import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header>
      <h1 class="logo">Pokemon Duel Docs</h1>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
        <a routerLink="/guides/developers" routerLinkActive="active">Developers</a>
        <a routerLink="/guides/users" routerLinkActive="active">Users</a>
        <a routerLink="/guides/agents" routerLinkActive="active">AI Agents</a>
      </nav>
    </header>

    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: block;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 2rem;
    }

    header {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 2rem;
    }

    .logo {
      font-size: 1.25rem;
      margin: 0;
      white-space: nowrap;
    }

    nav {
      display: flex;
      gap: 1.5rem;
    }

    nav a {
      text-decoration: none;
      color: #666;
      padding: 0.5rem 0;
      border-bottom: 2px solid transparent;
    }

    nav a:hover {
      color: #333;
    }

    nav a.active {
      color: #1976d2;
      border-bottom-color: #1976d2;
    }

    main {
      text-align: left;
    }
  `,
})
export class App {}
