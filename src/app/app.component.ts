import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastsComponent } from './core/toasts.component';
import { ModalsComponent } from './core/modals.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastsComponent, ModalsComponent],
  template: `
    <router-outlet />
    <app-toasts />
    <app-modals />
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f3f4f6;
      }
    `,
  ],
})
export class AppComponent {}
