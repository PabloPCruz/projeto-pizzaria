import { Routes } from '@angular/router';

// components
import { Menu } from './menu/menu';
import { Template } from './template/template';


export const routes: Routes = [
    {
        path: '',
        component: Template, // página única com todas as seções
    },
    {
        path: 'menu',
        component: Menu
    }
];
