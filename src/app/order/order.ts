import { Component, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { OrderService } from '../services/order.service';
import { OrderData } from '../interfaces/order-data.interface';
import { Bebida, opcoesBebida } from '../interfaces/drinks.interface';

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
    @Optional() private dialogRef: MatDialogRef<OrderComponent>
  ) {}

  ngOnInit(): void {
    this.initForm();
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

  confirmarPedido(): void {
    if (this.orderForm.valid) {
      const orderData = {
        ...this.orderForm.value,
        bebidas: this.bebidasSelecionadas
      };
      this.orderService.setOrder(orderData);
      if (this.dialogRef) {
        this.dialogRef.close(orderData);
      }
    } else {
      this.markFormGroupTouched(this.orderForm);
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