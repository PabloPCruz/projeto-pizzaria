import { Routes } from '@angular/router';

// components
import { Menu } from './components/menu/menu';
import { Template } from './template/template';
import { Contacts } from './components/contacts/contacts';
import { Presentation } from './presentation/presentation';
import { ViewCartComponent } from './components/view-cart/view-cart.component';


export const routes: Routes = [
    {
        path: '',
        component: Template, // página única com todas as seções
        data: { animation: 'home' }
    },
    {
        path: 'menu',
        component: Menu,
        data: { animation: 'menu' }
    },
    {
        path: 'contacts',
        component: Contacts,
        data: { animation: 'contacts' }
    },
    {
        path: 'history',
        component: Presentation,
        data: { animation: 'history' }
    },
    {
        path: "view-cart",
        component: ViewCartComponent,
        data: { animation: 'cart' }
    }
];
