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
    },
    {
        path: 'menu',
        component: Menu
    },
    {
        path: 'contacts',
        component: Contacts
    },
    {
        path: 'history',
        component: Presentation
    },
    {
        path: "view-cart",
        component: ViewCartComponent
    }
];
