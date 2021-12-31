import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { first, take } from 'rxjs/operators';
import { AppState } from '../../reducers/globarReducers';
import * as loginActions from '../../reducers/login/login.actions';
import anime from 'animejs/lib/anime.es.js';
import { Router } from '@angular/router';
import { Usuario } from '../../interfaces/resp-worker';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})



export class SidebarComponent implements OnInit, AfterViewChecked {

  usuario: Usuario;
  role: string;
  roles = [
    {
      id: 'SuperRole',
      nombre: 'Super Usuario'
    },
    {
      id: 'AdminRole',
      nombre: 'Administrador'
    },
    {
      id: 'ProduccionNormalRole',
      nombre: 'Producción'
    },
    {
      id: 'ProduccionVIPRole',
      nombre: 'Producción VIP'
    },
    {
      id: 'VendedorNormalRole',
      nombre: 'Vendedor'
    },
    {
      id: 'VendedorVIPRole',
      nombre: 'Vendedor VIP'
    },
    {
      id: 'DiseniadorRole',
      nombre: 'Diseñador'
    },
  ];

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.cargarWorker();
    this.animacionRow();

  }

  ngAfterViewChecked(): void {

    this.store.select('login').pipe(take(2))
      .subscribe(worker => {
        this.usuario = worker;
        this.role = worker?.usuario?.colaborador_role;
      });
  }

  animacionRow(): void {

    if (this.role === 'AdminRole' || this.role === 'SuperRole') {

      const catalogo = document.getElementById('catalogo');
      const pedidos = document.getElementById('pedidos');

      catalogo.addEventListener('click', (e) => {

        const isShow = catalogo.getAttribute('aria-expanded');
        const rowCatalogo = document.getElementById('row-catalogo');

        if (isShow === 'true') {

          anime({
            targets: rowCatalogo,
            rotateZ: 90,
            easing: 'linear',
            duration: 200
          });

        } else {

          anime({
            targets: rowCatalogo,
            rotateZ: 0,
            easing: 'linear',
            duration: 200
          });
        }

      });

      pedidos.addEventListener('click', (e) => {

        const isShow = pedidos.getAttribute('aria-expanded');
        const rowPedidos = document.getElementById('row-pedidos');

        if (isShow === 'true') {

          anime({
            targets: rowPedidos,
            rotateZ: 90,
            easing: 'linear',
            duration: 200
          });

        } else {

          anime({
            targets: rowPedidos,
            rotateZ: 0,
            easing: 'linear',
            duration: 200
          });
        }

      });
    }
  }

  cargarWorker(): void {

    this.store.select('login').pipe(first())
      .subscribe(usuario => {
        this.store.dispatch(loginActions.obtenerToken({ token: usuario.token }));
      });
  }



  salir(): void {

    localStorage.clear();
    window.location.reload();

  }
}
