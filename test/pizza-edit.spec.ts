import { resetKeepingClock } from './helpers/fake-clock';
import { TestBed } from '@angular/core/testing';
import { OrderFacadeService } from '../src/app/facade/order.facade.service';
import { CartService } from '../src/app/services/cart.service';
import { PizzaBuilderService } from '../src/app/services/pizza-builder.service';

const [A, B, C] = ['tradicional-frango-catupiry', 'tradicional-mussarela', 'especial-atum'];
const BUILDER_KEY = 'disk-pizza:v2:builder';

describe('Editar pizza do carrinho', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  describe('CartService.replacePizza', () => {
    it('substitui os dados mantendo o id e a posição na lista', () => {
      const cart = TestBed.inject(CartService);
      cart.addPizza({ size: 'grande', flavorIds: [A], crustId: null, notes: '', quantity: 1 });
      cart.addPizza({ size: 'media', flavorIds: [B], crustId: null, notes: '', quantity: 2 });
      const [first, second] = cart.snapshot.pizzas;

      const ok = cart.replacePizza(first.id, { size: 'gigante', flavorIds: [A, B, C], crustId: 'catupiry', notes: 'bem assada', quantity: 3 });

      expect(ok).toBeTrue();
      expect(cart.snapshot.pizzas.length).toBe(2);
      expect(cart.snapshot.pizzas[0]).toEqual({
        id: first.id,
        size: 'gigante',
        flavorIds: [A, B, C],
        crustId: 'catupiry',
        notes: 'bem assada',
        quantity: 3,
      });
      expect(cart.snapshot.pizzas[1]).toEqual(second);
    });

    it('id inexistente não altera o carrinho e devolve false', () => {
      const cart = TestBed.inject(CartService);
      cart.addPizza({ size: 'grande', flavorIds: [A], crustId: null, notes: '', quantity: 1 });
      const before = JSON.stringify(cart.snapshot);
      expect(cart.replacePizza('nao-existe', { size: 'media', flavorIds: [B], crustId: null, notes: '', quantity: 1 })).toBeFalse();
      expect(JSON.stringify(cart.snapshot)).toBe(before);
    });

    it('persiste a alteração e limita a quantidade', () => {
      const cart = TestBed.inject(CartService);
      cart.addPizza({ size: 'grande', flavorIds: [A], crustId: null, notes: '', quantity: 1 });
      cart.replacePizza(cart.snapshot.pizzas[0].id, { size: 'grande', flavorIds: [B], crustId: null, notes: '', quantity: 999 });
      resetKeepingClock();
      TestBed.configureTestingModule({});
      const reloaded = TestBed.inject(CartService).snapshot.pizzas[0];
      expect(reloaded.flavorIds).toEqual([B]);
      expect(reloaded.quantity).toBe(20);
    });
  });

  describe('PizzaBuilderService.load', () => {
    it('carrega a pizza do carrinho no montador e marca qual está sendo editada', () => {
      const cart = TestBed.inject(CartService);
      cart.addPizza({ size: 'grande', flavorIds: [A, B], crustId: 'cheddar', notes: 'sem cebola', quantity: 2 });
      const line = cart.snapshot.pizzas[0];

      const builder = TestBed.inject(PizzaBuilderService);
      builder.load(line);

      expect(builder.snapshot).toEqual({
        size: 'grande',
        flavorIds: [A, B],
        flavorOptions: {},
        crustId: 'cheddar',
        notes: 'sem cebola',
        editingId: line.id,
        quantity: 2,
      });
    });

    it('reset limpa também a edição e a quantidade', () => {
      const builder = TestBed.inject(PizzaBuilderService);
      builder.load({ id: 'x1', size: 'media', flavorIds: [A], crustId: null, notes: '', quantity: 4 });
      builder.reset();
      expect(builder.snapshot).toEqual({ size: null, flavorIds: [], flavorOptions: {}, crustId: null, notes: '', editingId: null, quantity: 1 });
    });

    it('a edição sobrevive a recarregar a página', () => {
      const builder = TestBed.inject(PizzaBuilderService);
      builder.load({ id: 'x1', size: 'media', flavorIds: [A], crustId: null, notes: '', quantity: 4 });
      resetKeepingClock();
      TestBed.configureTestingModule({});
      const draft = TestBed.inject(PizzaBuilderService).snapshot;
      expect(draft.editingId).toBe('x1');
      expect(draft.quantity).toBe(4);
    });

    it('dados salvos malformados de edição/quantidade voltam ao padrão', () => {
      localStorage.setItem(BUILDER_KEY, JSON.stringify({ size: 'grande', flavorIds: [A], crustId: null, notes: '', editingId: 42, quantity: 'muitas' }));
      const draft = TestBed.inject(PizzaBuilderService).snapshot;
      expect(draft.editingId).toBeNull();
      expect(draft.quantity).toBe(1);
      localStorage.setItem(BUILDER_KEY, JSON.stringify({ size: 'grande', flavorIds: [A], crustId: null, notes: '', editingId: 'x', quantity: -7 }));
      resetKeepingClock();
      TestBed.configureTestingModule({});
      expect(TestBed.inject(PizzaBuilderService).snapshot.quantity).toBe(1);
    });
  });

  describe('OrderFacadeService (editar)', () => {
    let order: OrderFacadeService;
    let cart: CartService;

    beforeEach(() => {
      order = TestBed.inject(OrderFacadeService);
      cart = TestBed.inject(CartService);
      cart.addPizza({ size: 'media', flavorIds: [A, B], crustId: null, notes: '', quantity: 2 });
      cart.addPizza({ size: 'pequena', flavorIds: [C], crustId: null, notes: '', quantity: 1 });
    });

    it('startEdit carrega a pizza no montador, começa em Sabores e marca modo de edição', (done) => {
      const id = cart.snapshot.pizzas[0].id;
      expect(order.startEdit(id)).toBeTrue();
      expect(order.getStep()).toBe(1);
      expect(order.isEditing()).toBeTrue();
      order.view$.subscribe((view) => {
        expect(view.editing).toBeTrue();
        expect(view.draft.flavorIds).toEqual([A, B]);
        expect(view.draft.quantity).toBe(2);
        done();
      });
    });

    it('startEdit com id que não existe devolve false e não muda o montador', () => {
      expect(order.startEdit('nao-existe')).toBeFalse();
      expect(order.isEditing()).toBeFalse();
    });

    it('salvar substitui a pizza original (mesmo id/posição), não duplica, e sai do modo de edição', () => {
      const original = cart.snapshot.pizzas[0];
      order.startEdit(original.id);
      order.selectSize('grande');
      order.toggleFlavor(C); // 3º sabor cabe na grande

      expect(order.addToCart(3)).toBeTrue();

      expect(cart.snapshot.pizzas.length).toBe(2);
      expect(cart.snapshot.pizzas[0].id).toBe(original.id);
      expect(cart.snapshot.pizzas[0].size).toBe('grande');
      expect(cart.snapshot.pizzas[0].flavorIds).toEqual([A, B, C]);
      expect(cart.snapshot.pizzas[0].quantity).toBe(3);
      expect(order.isEditing()).toBeFalse();
      expect(TestBed.inject(PizzaBuilderService).snapshot.size).toBeNull();
    });

    it('trocar o sabor de uma pizza editada mantém a validação de limite do tamanho', () => {
      order.startEdit(cart.snapshot.pizzas[0].id); // média = 2 sabores, já tem 2
      expect(order.toggleFlavor(C)).toBeFalse();
    });

    it('cancelEdit descarta as mudanças e deixa o carrinho intacto', () => {
      const before = JSON.stringify(cart.snapshot);
      order.startEdit(cart.snapshot.pizzas[0].id);
      order.toggleFlavor(A); // tira um sabor no rascunho
      order.cancelEdit();
      expect(order.isEditing()).toBeFalse();
      expect(JSON.stringify(cart.snapshot)).toBe(before);
      expect(order.getStep()).toBe(0);
    });

    it('se a pizza foi removida durante a edição, salvar adiciona como nova em vez de perder o trabalho', () => {
      const id = cart.snapshot.pizzas[0].id;
      order.startEdit(id);
      cart.removePizza(id);
      expect(order.addToCart(1)).toBeTrue();
      expect(cart.snapshot.pizzas.length).toBe(2);
      expect(cart.snapshot.pizzas.some((p) => p.id === id)).toBeFalse();
    });

    it('pizza inválida (sem sabores) não salva e continua em edição', () => {
      const original = JSON.stringify(cart.snapshot.pizzas[0]);
      order.startEdit(cart.snapshot.pizzas[0].id);
      order.toggleFlavor(A);
      order.toggleFlavor(B); // zerou os sabores
      expect(order.addToCart(1)).toBeFalse();
      expect(order.isEditing()).toBeTrue();
      expect(JSON.stringify(cart.snapshot.pizzas[0])).toBe(original);
    });

    it('adicionar pizza nova (sem edição) continua criando outra linha', () => {
      order.selectSize('pequena');
      order.toggleFlavor(A);
      expect(order.addToCart(1)).toBeTrue();
      expect(cart.snapshot.pizzas.length).toBe(3);
    });
  });
});
