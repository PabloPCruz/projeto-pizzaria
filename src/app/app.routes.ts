import { Routes } from '@angular/router';

// components
import { Menu } from './menu/menu';
import { Template } from './template/template';
import { Contacts } from './contacts/contacts';
import { Presentation } from './presentation/presentation';


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
    }
];
