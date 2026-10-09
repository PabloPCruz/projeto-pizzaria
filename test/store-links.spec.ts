import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ContactSectionComponent } from '../src/app/components/home/contact-section.component';
import { HomeModule } from '../src/app/components/home/home.module';
import { FooterComponent } from '../src/app/components/layout/footer.component';
import { LayoutModule } from '../src/app/components/layout/layout.module';
import { STORE_INFO } from '../src/app/data/store-info';
import { StoreFacadeService } from '../src/app/facade/store.facade.service';

describe('Links da loja (uma única fonte)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HomeModule, LayoutModule, RouterTestingModule] }).compileComponents();
  });

  it('StoreFacadeService monta o link do WhatsApp e o do telefone a partir de STORE_INFO', () => {
    const store = TestBed.inject(StoreFacadeService);
    expect(store.whatsappUrl).toBe(`https://wa.me/${STORE_INFO.whatsappNumber}`);
    expect(store.phoneUrl).toBe('tel:+554132732145');
  });

  it('contatos e rodapé usam exatamente esses links', () => {
    const store = TestBed.inject(StoreFacadeService);
    for (const component of [ContactSectionComponent, FooterComponent]) {
      const fixture = TestBed.createComponent<ContactSectionComponent | FooterComponent>(component);
      fixture.detectChanges();
      const hrefs = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).map((a) => a.getAttribute('href'));
      expect(hrefs).withContext(component.name).toContain(store.whatsappUrl);
      expect(hrefs).withContext(component.name).toContain(store.phoneUrl);
    }
  });
});
