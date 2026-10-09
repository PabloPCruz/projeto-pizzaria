import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CartModule } from '../src/app/components/cart/cart.module';
import { CartPageComponent } from '../src/app/components/cart/cart-page.component';
import { CartService } from '../src/app/services/cart.service';

describe('Formulário de entrega no celular: campos curtos dividem a linha', () => {
  let el: HTMLElement;
  const host = (name: string) => el.querySelector<HTMLElement>(`app-text-field[name="${name}"]`)!;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CartModule, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    TestBed.inject(CartService).addDrink('coca-2l');
    const fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => localStorage.clear());

  it('número ao lado do complemento e cidade ao lado da UF já no celular (grade de 6 colunas)', () => {
    expect(host('number').classList).toContain('col-span-2');
    expect(host('complement').classList).toContain('col-span-4');
    expect(host('city').classList).toContain('col-span-4');
    expect(host('state').classList).toContain('col-span-2');
  });

  it('CEP, rua e bairro continuam ocupando a linha inteira no celular', () => {
    for (const name of ['cep', 'street', 'neighborhood']) {
      expect(host(name).classList).withContext(name).toContain('col-span-6');
    }
  });

  it('a grade do endereço tem 6 colunas em qualquer largura', () => {
    expect(host('street').parentElement!.classList).toContain('grid-cols-6');
  });
});
