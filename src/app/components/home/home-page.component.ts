import { ViewportScroller } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { STORE_INFO } from '../../data/store-info';
import { StoreFacadeService } from '../../facade/store.facade.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements AfterViewInit {
  readonly store = STORE_INFO;
  readonly status$ = this.storeFacade.view$;

  constructor(
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private storeFacade: StoreFacadeService
  ) {}

  /**
   * Carga direta com fragmento (/#contatos, ou o destino de /contacts e /history): a home é lazy e o
   * Router pode rolar antes do conteúdo existir. Rola de novo depois de renderizar (respeita o offset
   * do header configurado no Router) e outra vez quando as fontes terminam de carregar e o layout assenta.
   */
  ngAfterViewInit(): void {
    const fragment = this.route.snapshot.fragment;
    if (!fragment) return;
    const go = () => this.scroller.scrollToAnchor(fragment);
    setTimeout(go);
    document.fonts?.ready.then(() => setTimeout(go));
  }

  readonly steps = [
    {
      title: 'Monte sua pizza',
      text: 'Escolha o tamanho, os sabores (pode misturar salgado e doce), a borda e, se quiser, uma bebida.',
    },
    {
      title: 'Confira o carrinho',
      text: 'Revise os itens, informe seu endereço pelo CEP e escolha a forma de pagamento: Pix, cartão ou dinheiro.',
    },
    {
      title: 'Envie pelo WhatsApp',
      text: 'Seu pedido vai pronto para o nosso WhatsApp. A loja confirma o valor e a entrega com você.',
    },
  ];
}
