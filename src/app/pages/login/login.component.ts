import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { RespUser } from '../../interfaces/resp-worker';
import { AppState } from 'src/app/reducers/globarReducers';
import Swal from 'sweetalert2';
import * as userActions from '../../reducers/login/login.actions';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public formulario: FormGroup;

  @ViewChild('alertWarning', { static: true }) alertWarning: ElementRef<HTMLElement>;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private store: Store<AppState>,
    private router: Router,
  ) { }

  ngOnInit(): void {

    this.crearFormulario();
  }

  crearFormulario(): void {

    this.formulario = this.fb.group({
      correo: ['', [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')]],
      password: ['', [Validators.required]]
    });
  }

  get validarCorreo(): boolean {

    const status = this.formulario.controls.correo.status;

    if (status === 'INVALID') {
      return false;
    } else {
      return true;
    }
  }

  get validarPassword(): boolean {

    const status = this.formulario.controls.password.status;

    if (status === 'INVALID') {
      return false;
    } else {
      return true;
    }
  }

  entrar(): void {

    // console.log(this.formulario.controls.correo);

    if (!this.validarCorreo || !this.validarPassword) {

      const alertWarning = this.alertWarning.nativeElement;
      alertWarning.style.display = 'block';

      setTimeout(() => {
        alertWarning.style.display = 'none';
      }, 2000);

    } else {

      const correo: string = this.formulario.controls.correo.value;
      const password: string = this.formulario.controls.password.value;

      const usuario = {
        correo: correo.toLowerCase().trim(),
        password: password.toLowerCase().trim()
      };

      this.userService.login(usuario).subscribe((resp: RespUser) => {

        if (resp.ok === false) {

          // alert
          Swal.fire(
            'Notificación',
            `${resp.mensaje}`,
            'warning'
          );

        } else {
          // console.log(resp);
          this.store.dispatch(userActions.crearToken({ token: resp.token }));
          // this.router.navigateByUrl('/dashboard');
          this.router.navigateByUrl('/dashboard/mi-bandeja');
        }
      });
    }

  }

}
