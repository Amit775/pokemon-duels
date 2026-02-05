import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectContentFiles } from '@analogjs/content';

import DocAttributes from '../../../doc-attributes';

@Component({
  selector: 'app-guides-users',
  imports: [RouterLink],
  template: `
    <h1>User Guide</h1>
    <p class="subtitle">Learn how to play Pokemon Duel.</p>

    <div class="doc-list">
      @for (doc of docs; track doc.slug) {
        <a [routerLink]="['/guides/users', doc.slug]" class="doc-item">
          <h3>{{ doc.attributes.title }}</h3>
          @if (doc.attributes.description) {
            <p>{{ doc.attributes.description }}</p>
          }
        </a>
      }
    </div>
  `,
  styles: `
    .subtitle {
      color: #666;
      margin-bottom: 2rem;
    }

    .doc-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .doc-item {
      display: block;
      padding: 1rem 1.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.2s;
    }

    .doc-item:hover {
      border-color: #1976d2;
    }

    .doc-item h3 {
      margin: 0 0 0.25rem 0;
    }

    .doc-item p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }
  `,
})
export default class UsersIndexPage {
  readonly docs = injectContentFiles<DocAttributes>((file) =>
    file.filename.includes('/users/')
  ).sort((a, b) => (a.attributes.order ?? 0) - (b.attributes.order ?? 0));
}
