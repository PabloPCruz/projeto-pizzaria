export interface Address {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
}

export interface AddressData extends Address {
  id?: string;
  padrao?: boolean;
}
