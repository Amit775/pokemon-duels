import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <h1>Pokemon Duel Documentation</h1>
    <p class="subtitle">Guides and documentation for the Pokemon Duel multiplayer board game.</p>

    <div class="cards">
      <a routerLink="/guides/developers" class="card">
        <h2>👨‍💻 Developers</h2>
        <p>Architecture, setup guides, and technical documentation for contributors.</p>
      </a>

      <a routerLink="/guides/users" class="card">
        <h2>🎮 Users</h2>
        <p>How to play, game rules, and tips for players.</p>
      </a>

      <a routerLink="/guides/agents" class="card">
        <h2>🤖 AI Agents</h2>
        <p>Instructions and context for AI assistants working on this project.</p>
      </a>
    </div>
  `,
  styles: `
    h1 {
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #666;
      margin-bottom: 2rem;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .card {
      display: block;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .card:hover {
      border-color: #1976d2;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .card h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
    }

    .card p {
      margin: 0;
      color: #666;
    }
  `,
})
export default class HomePage {}
