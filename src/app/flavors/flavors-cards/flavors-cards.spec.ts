import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlavorsCards } from './flavors-cards';

describe('FlavorsCards', () => {
  let component: FlavorsCards;
  let fixture: ComponentFixture<FlavorsCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlavorsCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlavorsCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
