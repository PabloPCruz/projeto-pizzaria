
import { Routes } from '@angular/router';

// components

import { Menu } from './menu/menu';
import { Contacts } from './contacts/contacts';
import { Presentation } from './presentation/presentation';
import { Template } from './template/template';
import { Header } from './header/header';
import { Flavors } from './flavors/flavors';

export const routes: Routes = [
    {
        path: '',
        component: Template,
        children: [
            { path: 'header', component: Header },
            { path: 'presentation', component: Presentation },
            { path: 'best-flavors', component: Flavors },
            { path: 'contacts', component: Contacts },
        ]
    },
    { path: 'menu', component: Menu },
];
