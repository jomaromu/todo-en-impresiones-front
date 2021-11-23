import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from './reducers/globarReducers';
import * as loginActions from './reducers/login/login.actions';
import * as moment from 'moment';
import { Subscription, timer } from 'rxjs';
import { UserService } from './services/user.service';
import { Usuario } from './interfaces/resp-worker';
import { first, take } from 'rxjs/operators';
import { Router } from '@angular/router';
moment().locale('es');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  contador = 0;
  once = false;
  idUsuario: string;
  worker: Usuario;
  token: string;

  resp1: Subscription;
  resp2: Subscription;
  public timer: Subscription;

  constructor(
    private store: Store<AppState>,
  ) { }

  ngOnInit(): void {

    this.cargarUsuario();
    this.refrescarToken();
    this.checkToken();

  }


  cargarUsuario(): void {

    this.store.select('login')
      .subscribe(data => {
        if (data.ok === null) { return; }
        this.worker = data;
      });
  }

  checkToken(): void {

    // return;
    this.timer = timer(0, 1000).subscribe(time => {
      if (!this.worker) { return; }

      const exp = this.worker.exp;

      const isExpired = moment.utc(new Date()).isAfter(new Date(exp * 1000));

      if (isExpired) {

        localStorage.clear();
        window.location.reload();
      }

    });
  }


  refrescarToken(): void {

    window.addEventListener('click', (e) => {

      if (this.contador > 4) {

        // refrescar token
        this.store.dispatch(loginActions.obtenerIdUsuario({ usuario: this.worker }));

        setTimeout(() => {

          // decodifico token
          this.store.dispatch(loginActions.obtenerToken({ token: localStorage.getItem('token') }));

        }, 300);

        // console.log(this.worker.token);

        this.contador = 0;
        this.once = true;


      } else if (this.contador < 5) {

        this.contador++;
        this.once = false;
      }

      // console.log(this.contador);


    }, { once: this.once });
  }
}
