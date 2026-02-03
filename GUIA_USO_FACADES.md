# 🎯 GUIA DE USO - NOVAS FACADES E SERVIÇOS

## 📚 Índice Rápido

1. [FormatService](#formatservice)
2. [CartCalculationService](#cartcalculationservice)
3. [CartFacadeService](#cartfacadeservice)
4. [MenuFacadeService](#menufacadeservice)

---

## FormatService

**Arquivo:** `src/app/services/format.service.ts`

Serviço centralizado para formatação de dados. **Elimina duplicação** de código de formatação.

### Uso em Componentes

```typescript
import { FormatService } from '../../services/format.service';

export class MeuComponente {
  constructor(private formatService: FormatService) {}

  formatarDados() {
    // Formatar uma bebida
    const bebidaNome = this.formatService.formatarBebida('coca_1l');
    // Resultado: 'Coca-Cola 1L'

    // Formatar um tamanho
    const tamanho = this.formatService.formatarTamanho('pequena');
    // Resultado: 'Pequena'

    // Capitalizar texto
    const texto = this.formatService.capitalizarPrimeira('pizza');
    // Resultado: 'Pizza'
  }
}
```

### Métodos Disponíveis

```typescript
// Formatar uma bebida individual
formatarBebida(tipo: string): string
// Ex: 'coca_1l' → 'Coca-Cola 1L'

// Formatar múltiplas bebidas
formatarBebidas(bebidas: any[]): string
// Ex: [{tipo: 'coca'}, {tipo: 'sprite'}] → 'Coca-Cola, Sprite'

// Formatar borda
formatarBorda(borda: Borda | undefined): string
// Ex: {tipo: 'chedar'} → 'Cheddar'

// Capitalizar primeira letra
capitalizarPrimeira(text: string): string
// Ex: 'margherita' → 'Margherita'

// Formatar tamanho da pizza
formatarTamanho(tamanho: string): string
// Ex: 'grande' → 'Grande'

// Formatar sabores
formatarSabores(sabores: string[]): string
// Ex: ['calabresa', 'margherita'] → 'calabresa, margherita'
```

---

## CartCalculationService

**Arquivo:** `src/app/services/cart-calculation.service.ts`

Serviço para cálculos relacionados ao carrinho. **Centraliza lógica de negócio**.

### Uso em Serviços/Facades

```typescript
import { CartCalculationService } from '../../services/cart-calculation.service';

export class MeuServico {
  constructor(private calcService: CartCalculationService) {}

  calcularPedido(items: CartItem[]) {
    // Calcular subtotal
    const subtotal = this.calcService.calcularSubtotal(items);
    // Resultado: 100.00

    // Calcular total com taxa e desconto
    const total = this.calcService.calcularTotal(subtotal);
    // Resultado: 110.00 (subtotal + taxa 10 - desconto 0)

    // Aplicar cupom
    const desconto = this.calcService.aplicarCupom('PRIMEIRACOMPRA');
    // Resultado: 10 (desconto aplicado)

    // Recalcular total
    const totalComDesconto = this.calcService.calcularTotal(subtotal);
    // Resultado: 100.00 (subtotal + taxa 10 - desconto 10)
  }
}
```

### Métodos Disponíveis

```typescript
// Calcular subtotal dos itens
calcularSubtotal(items: CartItem[]): number

// Calcular total (subtotal + taxa - desconto)
calcularTotal(subtotal: number): number

// Obter taxa de entrega atual
getTaxaEntrega(): number

// Definir nova taxa de entrega
setTaxaEntrega(taxa: number): void

// Obter desconto atual
getDesconto(): number

// Definir novo desconto
setDesconto(desconto: number): void

// Aplicar cupom de desconto
aplicarCupom(cupom: string): number
// Cupons válidos: 'PRIMEIRACOMPRA' (10), 'DESCONTO5' (5), 'FRETE'

// Calcular valor de um item
calcularValorItem(valor: number, quantidade: number): number
```

---

## CartFacadeService

**Arquivo:** `src/app/facade/cart.facade.service.ts`

Facade que **coordena todos os serviços do carrinho**. Use isso em componentes!

### Uso em Componentes

```typescript
import { CartFacadeService } from '../../facade/cart.facade.service';

@Component({...})
export class ViewCartComponent {
  cartItems$: Observable<CartItem[]>;
  subtotal: number = 0;
  total: number = 0;

  constructor(private cartFacade: CartFacadeService) {
    // Obter observable dos itens
    this.cartItems$ = this.cartFacade.getCartItems$();
  }

  ngOnInit() {
    this.cartFacade.getCartItems$().subscribe(items => {
      // Calcular totais automaticamente
      this.subtotal = this.cartFacade.calcularSubtotal(items);
      this.total = this.cartFacade.calcularTotal(this.subtotal);
    });
  }

  removerItem(id: string) {
    this.cartFacade.removeFromCart(id);
  }

  finalizarPedido() {
    this.cartFacade.finalizarPedido().then(resultado => {
      console.log('Pedido finalizado:', resultado);
      this.cartFacade.clearCart();
    });
  }
}
```

### Métodos Disponíveis

```typescript
// Observable dos itens do carrinho
getCartItems$(): Observable<CartItem[]>

// Adicionar item ao carrinho
addToCart(item: CartItem): void

// Remover item do carrinho
removeFromCart(id: string): void

// Atualizar quantidade de um item
updateQuantity(id: string, quantidade: number): void

// Calcular subtotal
calcularSubtotal(items: CartItem[]): number

// Calcular total
calcularTotal(subtotal: number): number

// Obter taxa de entrega
getTaxaEntrega(): number

// Obter desconto
getDesconto(): number

// Aplicar cupom
aplicarCupom(cupom: string): number

// Limpar carrinho
clearCart(): void

// Finalizar pedido (pronto para API)
finalizarPedido(): Promise<any>

// Obter quantidade total de itens
getCartItemsCount(): number

// Formatações (delegadas ao FormatService)
formatarSabores(sabores: string[]): string
formatarBorda(borda: any): string
formatarBebidas(bebidas: any[]): string
formatarTamanho(tamanho: string): string
```

---

## MenuFacadeService

**Arquivo:** `src/app/facade/menu.facade.service.ts`

Facade que **abstrai carregamento de sabores**. Use em componentes que precisam de cardápio!

### Uso em Componentes

```typescript
import { MenuFacadeService } from '../../facade/menu.facade.service';

@Component({...})
export class MenuComponent {
  sabores: Flavor[];
  
  constructor(private menuFacade: MenuFacadeService) {
    // Carregar todos os sabores
    this.sabores = this.menuFacade.getAllFlavors();
  }

  buscarSabor(termo: string) {
    // Buscar sabores por termo
    const resultados = this.menuFacade.searchFlavors(termo);
    // Resultado: Array de Flavor com termo em sabor ou ingredientes
  }

  obterSaborEspecifico(nome: string) {
    // Obter um sabor específico por nome
    const sabor = this.menuFacade.getFavorByName(nome);
    // Resultado: Flavor | undefined
  }
}
```

### Métodos Disponíveis

```typescript
// Obter todos os sabores disponíveis
getAllFlavors(): Flavor[]

// Obter sabores tradicionais
getTraditionalFlavors(): Flavor[]

// Obter sabores especiais (destaque)
getSpecialFlavors(): Flavor[]

// Obter doces tradicionais
getTraditionalSweets(): Flavor[]

// Obter doces especiais
getSpecialSweets(): Flavor[]

// Buscar um sabor por nome exato
getFavorByName(nome: string): Flavor | undefined

// Buscar sabores por termo (busca em sabor e ingredientes)
searchFlavors(termo: string): Flavor[]
```

### Estrutura do Flavor

```typescript
interface Flavor {
  sabor: string;              // Nome do sabor: "Margherita"
  img: string;                // Caminho da imagem: "assets/img-flavors/margherita.jpg"
  ingredientes: string;       // Descrição: "molho de tomate, mussarela..."
}
```

---

## 🔄 Fluxo Completo de Uso

### Exemplo: Adicionar ao Carrinho

```typescript
// 1. No componente Order, formatar os dados
const tamanho = this.formatService.formatarTamanho('grande');
// Resultado: 'Grande'

// 2. Criar item do carrinho
const cartItem: CartItem = {
  tamanho: tamanho,
  sabores: this.sabores,
  borda: this.borda,
  // ... outros dados
};

// 3. Adicionar ao carrinho via facade
this.cartFacade.addToCart(cartItem);
```

### Exemplo: Visualizar Carrinho

```typescript
// 1. Obter itens do carrinho
this.cartFacade.getCartItems$().subscribe(items => {
  // 2. Calcular totais
  const subtotal = this.cartFacade.calcularSubtotal(items);
  const total = this.cartFacade.calcularTotal(subtotal);
  
  // 3. Formatar dados para exibição
  items.forEach(item => {
    const tamanhoFormatado = this.cartFacade.formatarTamanho(item.tamanho);
    const saboresFormatados = this.cartFacade.formatarSabores(item.sabores);
    const bordaFormatada = this.cartFacade.formatarBorda(item.borda);
    
    console.log(`${tamanhoFormatado}: ${saboresFormatados}`);
  });
});
```

### Exemplo: Finalizar Pedido

```typescript
// 1. Aplicar cupom (opcional)
const desconto = this.cartFacade.aplicarCupom('PRIMEIRACOMPRA');

// 2. Recalcular total
const items = await this.cartFacade.getCartItems$().toPromise();
const subtotal = this.cartFacade.calcularSubtotal(items);
const total = this.cartFacade.calcularTotal(subtotal);

// 3. Finalizar pedido
this.cartFacade.finalizarPedido().then(resultado => {
  console.log('Pedido criado:', resultado);
  // {
  //   itens: [...],
  //   subtotal: 100,
  //   total: 110,
  //   timestamp: Date
  // }
  
  // 4. Limpar carrinho
  this.cartFacade.clearCart();
});
```

---

## ⚠️ O QUE NÃO FAZER

```typescript
// ❌ NÃO faça assim (acesso direto)
import { ALL_FLAVORS } from 'mocks/mock-flavors/all-flavors.mock';
this.sabores = ALL_FLAVORS;

// ✅ FAÇA assim (via facade)
this.sabores = this.menuFacade.getAllFlavors();

// ❌ NÃO coloque lógica de formatação em componentes
getBoridasFormatadas(borda) {
  if (!borda) return 'Sem borda';
  // ... lógica complexa
}

// ✅ FAÇA assim (use o serviço)
getBoridasFormatadas(borda) {
  return this.cartFacade.formatarBorda(borda);
}

// ❌ NÃO coloque cálculos de carrinho em componentes
calcularTotais() {
  this.subtotal = this.items.reduce((t, i) => t + (i.valor * i.quantidade), 0);
  this.total = this.subtotal + this.taxa - this.desconto;
}

// ✅ FAÇA assim (use o serviço)
calcularTotais() {
  this.subtotal = this.cartFacade.calcularSubtotal(this.items);
  this.total = this.cartFacade.calcularTotal(this.subtotal);
}
```

---

## 🧪 Testando as Novas Facades

```typescript
// Exemplo de teste unitário
describe('CartFacadeService', () => {
  let facade: CartFacadeService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CartFacadeService, CartService, CartCalculationService, FormatService]
    });
    facade = TestBed.inject(CartFacadeService);
  });
  
  it('deve calcular subtotal corretamente', () => {
    const items: CartItem[] = [
      { valor: 30, quantidade: 2 } as CartItem
    ];
    expect(facade.calcularSubtotal(items)).toBe(60);
  });
  
  it('deve aplicar cupom corretamente', () => {
    const desconto = facade.aplicarCupom('PRIMEIRACOMPRA');
    expect(desconto).toBe(10);
  });
});
```

---

**Última Atualização:** Fevereiro 2, 2026  
**Status:** Pronto para Produção ✅
