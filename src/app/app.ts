import { Component } from '@angular/core';

// COMPONENTE APP
@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'] // <- corrigido
  ,
})
export class App {
  protected title = 'projeto-pizzaria';
}