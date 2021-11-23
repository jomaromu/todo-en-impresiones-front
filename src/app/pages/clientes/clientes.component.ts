import { Component, ElementRef, OnInit, ViewChild, AfterContentChecked } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { CatalogoShared } from '../../interfaces/catalogo-shared';
import { Cliente } from '../../interfaces/clientes';
import { Roles } from '../../interfaces/roles';
import { AppState } from '../../reducers/globarReducers';
import { UserService } from '../../services/user.service';
import { Usuario } from '../../interfaces/resp-worker';
import { first, map } from 'rxjs/operators';
import Swal from 'sweetalert2';
import * as loadingActions from '../../reducers/loading/loading.actions';
import { forkJoin } from 'rxjs';
import { Sucursal } from '../../interfaces/sucursales';
import { SucursalService } from '../../services/sucursal.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent implements OnInit, AfterContentChecked {

  @ViewChild('fondo', { static: true }) fondo: ElementRef<HTMLElement>;
  @ViewChild('wrapCreaciones', { static: true }) wrapCreaciones: ElementRef<HTMLElement>;

  catalogo: CatalogoShared;
  usuarios: Cliente;
  usuario: Cliente;
  objCat: any;
  crear = true;
  roles: Roles;
  sucursales: Sucursal;
  tituloBotonHeader = '';
  roleUsuario = '';

  forma: FormGroup;



  constructor(
    private store: Store<AppState>,
    private userService: UserService,
    private sucursalService: SucursalService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {

    this.obtenerUsuarios();
    this.crearFormulario();
  }

  ngAfterContentChecked(): void {

    this.catalogo = {

      tipo: 'clientes',
      iconoTituloHeader: 'fas fa-user-lock',
      tituloHeader: 'Información Clientes',
      tituloBotonHeader: 'Crear Cliente',
      iconoBotonHeader: 'fas fa-plus',
      tituloTabla: ['#', 'Nombre', 'Teléfono', 'Correo', 'Estado', 'Controles'],
      tablas: this.usuarios?.usuariosDB
    };

  }

  obtenerUsuarios(): void {

    this.store.select('login').pipe(first())
      .subscribe((worker: Usuario) => {

        this.userService.obtenerClientes(worker.token)
          .subscribe((usuarios: Cliente) => {
            // console.log(usuarios);

            if (usuarios.ok === false) {
              console.log('error');
            } else {
              this.usuarios = usuarios;
            }

          });
      });
  }

  abrirAlert(objCat: any): void {

    const fondo = this.fondo.nativeElement;
    const wrapCreaciones = this.wrapCreaciones.nativeElement;

    wrapCreaciones.classList.remove('animate__bounceOutUp');
    wrapCreaciones.classList.add('animate__bounceInDown');

    this.objCat = objCat;

    this.store.select('login')
      .pipe(first())
      .subscribe(async (worker: Usuario) => {

        if (objCat.tipo === 'crear') {

          fondo.style.display = 'flex';
          this.tituloBotonHeader = 'Creación Cliente';

          this.forma.reset();
          this.cargarSelects(worker.token);


          this.detectarRole();

          this.crear = true;
        } else if (objCat.tipo === 'editar') {

          fondo.style.display = 'flex';
          this.tituloBotonHeader = 'Editar/Ver Cliente';

          this.crear = false;
          this.cargarDatosUsuarios(objCat.idCat, worker.token);

          const usuario: Cliente = await this.userService.obtenerClienteID(objCat.idCat, worker.token).toPromise();
          this.roleUsuario = this.forma.controls.role.value;
          this.roleInputs(usuario.usuarioDB.client_role);

        } else if (objCat.tipo === 'eliminar') {

          this.fondo.nativeElement.style.display = 'none';

          Swal.fire({
            title: 'Mensaje',
            text: '¿Desea eliminar este cliente?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'

          }).then((result) => {

            if (result.isConfirmed) {

              this.userService.eliminarClienteID(objCat.idCat, worker.token)
                .subscribe((usuario: Cliente) => {

                  this.store.dispatch(loadingActions.cargarLoading());

                  if (usuario.ok === true) {

                    this.store.dispatch(loadingActions.quitarLoading());
                    this.obtenerUsuarios();

                    if (result.isConfirmed) {
                      Swal.fire(
                        'Mensaje',
                        `${usuario.mensaje}`,
                        'success'
                      );
                    }

                  } else {

                    this.store.dispatch(loadingActions.quitarLoading());

                    Swal.fire(
                      'Mensaje',
                      `${usuario.mensaje}`,
                      'info'
                    );

                  }

                });
            }


          });

        }
      });
  }

  get checkNombre(): boolean {

    if (this.forma.controls.nombre.touched && this.forma.controls.nombre.status === 'INVALID') {
      return true;
    }

  }

  get checkApellido(): boolean {

    if (this.forma.controls.apellido.touched && this.forma.controls.apellido.status === 'INVALID') {
      return true;
    }

  }

  get checkTelefono(): boolean {

    if (this.forma.controls.telefono.touched && this.forma.controls.telefono.status === 'INVALID') {
      return true;
    }

  }

  get checkIdentificacion(): boolean {

    if (this.forma.controls.identificacion.touched && this.forma.controls.identificacion.status === 'INVALID') {
      return true;
    }

  }

  get checkRuc(): boolean {

    if (this.forma.controls.ruc.touched && this.forma.controls.ruc.status === 'INVALID') {
      return true;
    }

  }

  get checkCorreo(): boolean {

    if (this.forma.controls.correo.touched && this.forma.controls.correo.status === 'INVALID') {
      return true;
    }

  }

  get checkRole(): boolean {

    if (this.forma.controls.role.touched && this.forma.controls.role.status === 'INVALID') {
      return true;
    }

  }

  get checkSucursal(): boolean {

    if (this.forma.controls.sucursal.touched && this.forma.controls.sucursal.status === 'INVALID') {
      return true;
    }

  }

  crearFormulario(): void {

    this.forma = this.fb.group({
      nombre: [null, [Validators.required]],
      apellido: [null, [Validators.required]],
      role: [null, [Validators.required]],
      sucursal: [null, [Validators.required]],
      telefono: [null, [Validators.required]],
      identificacion: [null, [Validators.required]],
      ruc: [null, [Validators.required]],
      correo: [null, [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')]],
      observacion: [null],
      estado: [true],
    });
  }

  cerrarCreacion(e: any): void {

    const fondo = this.fondo.nativeElement;
    const wrapCreaciones = this.wrapCreaciones.nativeElement;

    wrapCreaciones.classList.remove('animate__bounceInDown');
    wrapCreaciones.classList.add('animate__bounceOutUp');

    setTimeout(() => {
      fondo.style.display = 'none';
    }, 800);

  }

  cargarDatosUsuarios(idUsuario: string, token: string): void {

    const usuario = this.userService.obtenerClienteID(idUsuario, token);
    const sucursales = this.sucursalService.obtenerSucursales(token);
    const roles = this.userService.obtenerClienteRoles(token);

    forkJoin([usuario, sucursales, roles])
      .pipe(
        map((resp: Array<any>) => {

          const objResp: Clientes = {
            usuario: resp[0],
            sucursales: resp[1],
            roles: resp[2]
          };

          return objResp;
        })
      ).subscribe((data: Clientes) => {
        // console.log(data);
        this.roles = data.roles;
        this.sucursales = data.sucursales;

        this.usuario = data.usuario;

        // console.log(this.usuario.usuarioDB.sucursal);

        this.forma.controls.nombre.setValue(this.usuario.usuarioDB.nombre);
        this.forma.controls.apellido.setValue(this.usuario.usuarioDB.apellido);
        this.forma.controls.identificacion.setValue(this.usuario.usuarioDB.identificacion);
        this.forma.controls.ruc.setValue(this.usuario.usuarioDB.ruc);
        this.forma.controls.telefono.setValue(this.usuario.usuarioDB.telefono);
        this.forma.controls.correo.setValue(this.usuario.usuarioDB.correo);
        this.forma.controls.role.setValue(this.usuario.usuarioDB.client_role);
        this.forma.controls.sucursal.setValue(this.usuario.usuarioDB.sucursal._id); // obtener el nombre del populate
        this.forma.controls.observacion.setValue(this.usuario.usuarioDB.observacion);
        this.forma.controls.estado.setValue(this.usuario.usuarioDB.estado);

      });
  }

  cargarSelects(token: string): void {

    this.forma.controls.role.setValue('ComunRole');

    const sucursales = this.sucursalService.obtenerSucursales(token);
    const roles = this.userService.obtenerClienteRoles(token);

    forkJoin([sucursales, roles])
      .pipe(
        map((resp: Array<any>) => {

          const objResp: Clientes = {
            usuario: null,
            sucursales: resp[0],
            roles: resp[1]
          };

          return objResp;
        })
      ).subscribe((data: Clientes) => {
        // console.log(data.sucursales);
        this.roles = data.roles;
        this.sucursales = data.sucursales;
      });
  }

  detectarRole(): void {

    this.roleUsuario = this.forma.controls.role.value;
    this.roleInputs(this.roleUsuario);
  }

  roleInputs(role: string): void {

    if (role === 'ComunRole' || role === 'ComunVIPRole' || role === 'ComunFrecuenteRole') {

      this.forma.controls.apellido.enable();
      this.forma.controls.ruc.disable();
      this.forma.controls.identificacion.enable();
    }

    if (role === 'EmpresaVIPRole' || role === 'EmpresaRole') {

      this.forma.controls.apellido.disable();
      this.forma.controls.ruc.enable();
      this.forma.controls.identificacion.disable();
    }
  }

  guardar(): void {

    this.forma.markAllAsTouched();

    if (this.forma.status === 'VALID') {

      // cargar loading
      this.store.dispatch(loadingActions.cargarLoading());

      this.store.select('login').pipe(first())
        .subscribe((worker: Usuario) => {

          const estadoSuc = this.forma.controls.estado.value;
          let castEstado = '';

          if (estadoSuc === true) {
            castEstado = 'true';
          } else if (estadoSuc === false) {
            castEstado = 'false';
          }

          const data: any = {
            nombre: this.forma.controls.nombre.value,
            apellido: this.forma.controls.apellido.value,
            identificacion: this.forma.controls.identificacion.value,
            ruc: this.forma.controls.ruc.value,
            telefono: this.forma.controls.telefono.value,
            correo: this.forma.controls.correo.value,
            client_role: this.forma.controls.role.value,
            sucursal: this.forma.controls.sucursal.value,
            observacion: this.forma.controls.observacion.value,
            password: '12345678',
            estado: castEstado,
            //  falta observacion
            token: worker.token
          };

          if (this.objCat.tipo === 'editar') {

            // console.log(data.client_role);

            this.userService.editarClienteID(this.objCat.idCat, worker.token, data)
              .subscribe((usuario: Cliente) => {

                // console.log(usuario);

                if (usuario.ok === true) {

                  this.store.dispatch(loadingActions.quitarLoading());
                  this.obtenerUsuarios();

                  Swal.fire(
                    'Mensaje',
                    `${usuario.mensaje}`,
                    'info'
                  );

                  this.fondo.nativeElement.style.display = 'none';

                  this.forma.reset();

                } else {

                  this.store.dispatch(loadingActions.quitarLoading());

                  Swal.fire(
                    'Mensaje',
                    `${usuario.mensaje}`, // verificar las opciones
                    'error'
                  );
                }

              });

          } else if (this.objCat.tipo === 'crear') {

            this.userService.crearCliente(data)
              .subscribe((usuario: Cliente) => {

                if (usuario.ok === true) {

                  this.store.dispatch(loadingActions.quitarLoading());
                  this.obtenerUsuarios();

                  Swal.fire(
                    'Mensaje',
                    `${usuario.mensaje}`,
                    'info'
                  );

                  this.fondo.nativeElement.style.display = 'none';

                  this.forma.reset();


                } else {

                  this.store.dispatch(loadingActions.quitarLoading());

                  Swal.fire(
                    'Mensaje',
                    `${usuario.mensaje}`, // verificar opciones
                    'error'
                  );
                }
              });

          } else {

            return;

          }

        });

    }

  }

}

interface Clientes {

  usuario: Cliente;
  roles: Roles;
  sucursales: Sucursal;
}

type clientRole = 'ComunRole' | 'EmpresaRole' | 'EmpresaVIPRole' | 'ComunVIPRole' | 'ComunFrecuenteRole';
