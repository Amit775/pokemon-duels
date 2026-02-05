import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { injectContent, MarkdownComponent } from '@analogjs/content';

import DocAttributes from '../../../doc-attributes';

@Component({
  selector: 'app-user-doc',
  imports: [AsyncPipe, MarkdownComponent],
  template: `
    @if (doc$ | async; as doc) {
      <article>
        <analog-markdown [content]="doc.content" />
      </article>
    }
  `,
  styles: `
    article {
      max-width: 800px;
    }
  `,
})
export default class UserDocPage {
  readonly doc$ = injectContent<DocAttributes>({
    param: 'slug',
    subdirectory: 'users',
  });
}
