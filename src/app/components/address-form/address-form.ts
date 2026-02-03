import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Address } from '../../interfaces/address.interface';
import { CepService } from '../../services/cep.service';

@Component({
  selector: 'app-address-form',
  templateUrl: './address-form.html',
  styleUrls: ['./address-form.css']
})
export class AddressFormComponent {
  @ViewChild('numeroInput') numeroInput!: ElementRef;

  cep: string = '';
  rua: string = '';
  numero: string = '';
  complemento: string = '';
  bairro: string = '';
  cidade: string = '';
  cepCarregando: boolean = false;
  cepErro: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddressFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Address | null,
    private cepService: CepService
  ) {
    if (data) {
      this.cep = data.cep;
      this.rua = data.rua;
      this.numero = data.numero;
      this.complemento = data.complemento || '';
      this.bairro = data.bairro;
      this.cidade = data.cidade;
    }
  }

  buscarCep(): void {
    if (!this.cep || this.cep.trim().length < 8) {
      return;
    }

    this.cepCarregando = true;
    this.cepErro = false;

    this.cepService.buscarCep(this.cep).subscribe((resultado) => {
      this.cepCarregando = false;

      if (resultado) {
        this.rua = resultado.logradouro;
        this.bairro = resultado.bairro;
        this.cidade = resultado.localidade;
        this.cepErro = false;

        // Dar foco no campo de número
        setTimeout(() => {
          this.numeroInput?.nativeElement?.focus();
        }, 100);
      } else {
        this.cepErro = true;
        this.rua = '';
        this.bairro = '';
        this.cidade = '';
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  confirmarEndereco(): void {
    if (this.isValid()) {
      const addressData: Address = {
        cep: this.cep,
        rua: this.rua,
        numero: this.numero,
        complemento: this.complemento,
        bairro: this.bairro,
        cidade: this.cidade
      };
      this.dialogRef.close(addressData);
    }
  }

  isValid(): boolean {
    return !!(
      this.cep.trim() &&
      this.rua.trim() &&
      this.numero.trim() &&
      this.bairro.trim() &&
      this.cidade.trim()
    );
  }
}
