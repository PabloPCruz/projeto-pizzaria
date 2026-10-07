import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Aviso "loja fechada" (com a próxima abertura). O foco pode ser levado a ele (tabindex -1). */
@Component({
  selector: 'app-store-closed-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [attr.id]="noticeId"
      tabindex="-1"
      [attr.role]="live ? 'status' : 'note'"
      class="flex items-start gap-3 rounded-xl border border-warn/50 bg-warn/10 p-4 text-sm leading-relaxed text-cream outline-none"
    >
      <lucide-icon name="calendar-x" [size]="20" class="mt-0.5 shrink-0 text-warn"></lucide-icon>
      <p>{{ message }}</p>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class StoreClosedNoticeComponent {
  @Input({ required: true }) message = '';
  @Input() noticeId = 'store-closed-notice';
  /** `false` evita um segundo anúncio quando há dois avisos na página. */
  @Input() live = true;
}
