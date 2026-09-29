import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type BrandIconName = 'instagram' | 'facebook' | 'whatsapp';

/** Ícones de marcas (o lucide não inclui logos). SVG inline, herda a cor do texto. */
@Component({
  selector: 'app-brand-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      [attr.width]="size"
      [attr.height]="size"
    >
      <ng-container [ngSwitch]="name">
        <g *ngSwitchCase="'instagram'">
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
          <circle cx="12" cy="12" r="4.2" />
          <path d="M17.6 6.4h.01" stroke-width="2.4" />
        </g>
        <path *ngSwitchCase="'facebook'" d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        <g *ngSwitchCase="'whatsapp'">
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
        </g>
      </ng-container>
    </svg>
  `,
  styles: [':host{display:inline-flex}'],
})
export class BrandIconComponent {
  @Input({ required: true }) name!: BrandIconName;
  @Input() size = 22;
}
