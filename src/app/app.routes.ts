import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

/** 'contacts' e 'history' viram âncoras da home (mantém links antigos funcionando). */
const toHomeSection = (fragment: string) => () => inject(Router).createUrlTree(['/'], { fragment });

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Disk Pizza — Pizzaria Italiana',
    data: { animation: 'home' },
    loadChildren: () => import('./components/home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'cardapio',
    title: 'Cardápio — Disk Pizza',
    data: { animation: 'cardapio' },
    loadChildren: () => import('./components/menu/menu.module').then((m) => m.MenuModule),
  },
  {
    path: 'montar-pizza',
    title: 'Monte sua pizza — Disk Pizza',
    data: { animation: 'montar' },
    loadChildren: () => import('./components/builder/builder.module').then((m) => m.BuilderModule),
  },
  {
    path: 'carrinho',
    title: 'Carrinho — Disk Pizza',
    data: { animation: 'carrinho' },
    loadChildren: () => import('./components/cart/cart.module').then((m) => m.CartModule),
  },
  { path: 'menu', redirectTo: 'cardapio', pathMatch: 'full' },
  { path: 'view-cart', redirectTo: 'carrinho', pathMatch: 'full' },
  { path: 'contacts', canActivate: [toHomeSection('contatos')], children: [] },
  { path: 'history', canActivate: [toHomeSection('historia')], children: [] },
  {
    path: '**',
    title: 'Página não encontrada — Disk Pizza',
    data: { animation: 'nao-encontrada' },
    loadChildren: () => import('./components/not-found/not-found.module').then((m) => m.NotFoundModule),
  },
];
