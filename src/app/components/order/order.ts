import { Component, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { OrderService } from '../../services/order.service';
import { CartService, CartItem } from '../../services/cart.service';
import { OrderData } from '../../interfaces/order-data.interface';
import { Bebida, opcoesBebida } from '../../interfaces/drinks.interface';
import { Address } from '../../interfaces/address.interface';
import { AddressFormComponent } from '../address-form/address-form';
import { Router } from '@angular/router';
import { FormatService } from '../../services/format.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.html',
  styleUrls: ['./order.css']
})
export class OrderComponent implements OnInit {
  orderForm!: FormGroup;
  bebidasSelecionadas: Bebida[] = [];
  
  // Propriedades do formulário
  nome: string = '';
  tamanho: string = '';
  sabores: string[] = [];
  borda: string = '';
  bebida: string[] = [];
  observacoes: string = '';
  cep: string = '';
  rua: string = '';
  number: string = '';
  complemento: string = '';
  bairro: string = '';
  cidade: string = '';
  endereco: Address | null = null;
  enderecoSalvo: boolean = false;
  maxSabores: number = 0;
  mensagemMaximoSabores: boolean = false;
  saboresAnterior: string[] = [];

  // Mapeamento de tamanho para máximo de sabores
  tamanhoMaxSaboresMap = {
    'pequena': 1,
    'media': 2,
    'grande': 3,
    'big': 3,
    'gigante': 4
  };

  // Opções para os selects
  tamanhoOptions = [
    { value: 'Pequena', label: 'Pizza Pequena' },
    { value: 'Média', label: 'Pizza Média' },
    { value: 'Grande', label: 'Pizza Grande' },
    { value: 'Família', label: 'Pizza Família' }
  ];

  saboresOptions = [
    'Margherita', 'Calabresa', 'Portuguesa', 'Mussarela', 'Napolitana',
    'Frango com Catupiry', 'Bacon', 'Pepperoni', 'Quatro Queijos',
    'Vegetariana', 'Atum', 'Romana'
  ];

  bordaOptions = [
    { value: 'chedar', label: 'Cheddar' },
    { value: 'catupiry', label: 'Catupiry' },
    { value: 'chocolate', label: 'Chocolate' }
  ];
  bebidaOptions = [
    { tipo: 'sprite', label: 'Sprite' },
    { tipo: 'agua_sem_gas', label: 'Água sem Gás' },
    { tipo: 'agua_com_gas', label: 'Água com Gás' }
  ];

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private cartService: CartService,
    private router: Router,
    private dialog: MatDialog,
    private formatService: FormatService,
    @Optional() private dialogRef: MatDialogRef<OrderComponent>
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  onTamanhoPizzaChange(): void {
    this.maxSabores = this.tamanhoMaxSaboresMap[this.tamanho as keyof typeof this.tamanhoMaxSaboresMap] || 0;
    this.sabores = [];
    this.saboresAnterior = [];
    this.mensagemMaximoSabores = false;
  }

  onSaborChange(): void {
    if (this.sabores.length > this.maxSabores) {
      // Restaura o estado anterior se exceder o limite
      this.sabores = [...this.saboresAnterior];
      this.mensagemMaximoSabores = true;
    } else {
      this.saboresAnterior = [...this.sabores];
      this.mensagemMaximoSabores = this.sabores.length === this.maxSabores && this.maxSabores > 0;
    }
  }

  private initForm(): void {
    this.orderForm = this.fb.group({
      nome: ['', [Validators.required]],
      tamanho: ['', [Validators.required]],
      sabores: [[], [Validators.required]],
      borda: [''],
      bebida: [[]],
      observacoes: [''],
      cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      rua: ['', Validators.required],
      number: ['', Validators.required],
      complemento: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required]
    });
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  abrirFormularioEndereco(): void {
    const dialogRef = this.dialog.open(AddressFormComponent, {
      width: '500px',
      data: this.endereco,
      panelClass: 'address-form-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.endereco = result;
        this.enderecoSalvo = true;
      }
    });
  }

  confirmarPedido(): void {
    if (this.enderecoSalvo && this.endereco) {
      const cartItem: CartItem = {
        nome: this.nome,
        tamanho: this.formatService.formatarTamanho(this.tamanho),
        sabores: this.sabores,
        borda: this.borda as any,
        bebida: this.bebida as any,
        observacoes: this.observacoes,
        cep: this.endereco.cep,
        rua: this.endereco.rua,
        number: this.endereco.numero,
        complemento: this.endereco.complemento,
        bairro: this.endereco.bairro,
        cidade: this.endereco.cidade,
        id: '',
        quantidade: 1,
        valor: 29.90,
        data: new Date(),
        endereco: this.endereco
      };

      this.cartService.addToCart(cartItem);
      
      if (this.dialogRef) {
        this.dialogRef.close(cartItem);
      }

      // Redirecionar para o carrinho após 500ms
      setTimeout(() => {
        this.router.navigate(['/view-cart']);
      }, 500);
    } else {
      alert('Por favor, cadastre um endereço antes de confirmar o pedido');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}