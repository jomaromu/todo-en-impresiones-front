import { Component, OnInit, AfterContentChecked, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { first, map } from 'rxjs/operators';
import { AppState } from 'src/app/reducers/globarReducers';
import { CatalogoShared } from '../../interfaces/catalogo-shared';
import { Usuario } from '../../interfaces/resp-worker';
import { UserService } from '../../services/user.service';
import Swal from 'sweetalert2';
import { Roles } from '../../interfaces/roles';
import * as loadingActions from '../../reducers/loading/loading.actions';
import { forkJoin } from 'rxjs';
import { SucursalService } from '../../services/sucursal.service';
import { Sucursal } from 'src/app/interfaces/sucursales';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit, AfterContentChecked {

  @ViewChild('fondo', { static: true }) fondo: ElementRef<HTMLElement>;
  @ViewChild('wrapCreaciones', { static: true }) wrapCreaciones: ElementRef<HTMLElement>;


  catalogo: CatalogoShared;
  usuarios: Usuario;
  usuario: Usuario;
  objCat: any;
  crear = true;
  roles: Roles;
  sucursales: Sucursal;
  tituloBotonHeader = '';

  forma: FormGroup;



  constructor(
    private store: Store<AppState>,
    private userService: UserService,
    private sucursalService: SucursalService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {

    this.obtenerUsuarios();
    // this.getRoles();
    this.crearFormulario();
  }

  ngAfterContentChecked(): void {

    this.catalogo = {

      tipo: 'usuarios',
      iconoTituloHeader: 'fas fa-user-lock',
      tituloHeader: 'Información Colaboradores',
      tituloBotonHeader: 'Crear Colaborador',
      iconoBotonHeader: 'fas fa-plus',
      tituloTabla: ['#', 'Nombre', 'Teléfono', 'Role', 'Estado', 'Controles'],
      tablas: this.usuarios?.usuarios
    };

  }

  obtenerUsuarios(): void {

    this.store.select('login').pipe(first())
      .subscribe((worker: Usuario) => {

        this.userService.obtenerUsuarios(worker.token)
          .subscribe((usuarios: Usuario) => {
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
      .subscribe((worker: Usuario) => {

        if (objCat.tipo === 'crear') {

          fondo.style.display = 'flex';
          this.tituloBotonHeader = 'Creación Colaborador';

          this.forma.reset();
          this.forma.controls.role.setValue('DiseniadorRole');
          this.forma.controls.sucursal.setValue('TEI');
          this.cargarSelects(worker.token);

          this.crear = true;
        } else if (objCat.tipo === 'editar') {

          fondo.style.display = 'flex';
          this.tituloBotonHeader = 'Editar/Ver Colaborador';

          this.crear = false;
          this.cargarDatosUsuarios(objCat.idCat, worker.token);

        } else if (objCat.tipo === 'eliminar') {

          this.fondo.nativeElement.style.display = 'none';

          Swal.fire({
            title: 'Mensaje',
            text: '¿Desea eliminar este usuario?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'

          }).then((result) => {

            if (result.isConfirmed) {

              this.userService.eliminarUsuarioID(objCat.idCat, worker.token)
                .subscribe((usuario: Usuario) => {

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
      correo: [null, [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')]],
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

    const usuario = this.userService.obtenerUsuarioID(idUsuario, token);
    const sucursales = this.sucursalService.obtenerSucursales(token);
    const roles = this.userService.obtenerRoles(token);

    forkJoin([usuario, sucursales, roles])
      .pipe(
        map((resp: Array<any>) => {

          const objResp: Colaboradores = {
            usuario: resp[0],
            sucursales: resp[1],
            roles: resp[2]
          };

          return objResp;
        })
      ).subscribe((data: Colaboradores) => {
        // console.log(data);
        this.roles = data.roles;
        this.sucursales = data.sucursales;

        this.usuario = data.usuario;

        console.log(this.usuario.usuario.sucursal);

        this.forma.controls.nombre.setValue(this.usuario.usuario.nombre);
        this.forma.controls.apellido.setValue(this.usuario.usuario.apellido);
        this.forma.controls.identificacion.setValue(this.usuario.usuario.identificacion);
        this.forma.controls.telefono.setValue(this.usuario.usuario.telefono);
        this.forma.controls.correo.setValue(this.usuario.usuario.correo);
        this.forma.controls.role.setValue(this.usuario.usuario.colaborador_role);
        this.forma.controls.sucursal.setValue(this.usuario.usuario.sucursal); // obtener el nombre del populate
        this.forma.controls.estado.setValue(this.usuario.usuario.estado);

      });
  }

  cargarSelects(token: string): void {

    const sucursales = this.sucursalService.obtenerSucursales(token);
    const roles = this.userService.obtenerRoles(token);

    forkJoin([sucursales, roles])
      .pipe(
        map((resp: Array<any>) => {

          const objResp: Colaboradores = {
            usuario: null,
            sucursales: resp[0],
            roles: resp[1]
          };

          return objResp;
        })
      ).subscribe((data: Colaboradores) => {
        // console.log(data);
        this.roles = data.roles;
        this.sucursales = data.sucursales;
      });
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
            telefono: this.forma.controls.telefono.value,
            correo: this.forma.controls.correo.value,
            colaborador_role: this.forma.controls.role.value,
            sucursal: this.forma.controls.sucursal.value,
            password: '12345678',
            estado: castEstado,
            token: worker.token
          };

          if (this.objCat.tipo === 'editar') {

            // console.log(data.pais);

            this.userService.editarUsuarioID(this.objCat.idCat, worker.token, data)
              .subscribe((usuario: Usuario) => {

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
                    `${usuario.err.message}`,
                    'error'
                  );
                }

              });

          } else if (this.objCat.tipo === 'crear') {

            this.userService.crearUsuario(data)
              .subscribe((usuario: Usuario) => {

                if (usuario.ok === true) {

                  this.store.dispatch(loadingActions.quitarLoading());
                  this.obtenerUsuarios();

                  Swal.fire(
                    'Mensaje',
                    `${usuario.mensaje}, Password: ${data.password}`,
                    'info'
                  );

                  this.fondo.nativeElement.style.display = 'none';

                  this.forma.reset();


                } else {

                  this.store.dispatch(loadingActions.quitarLoading());

                  Swal.fire(
                    'Mensaje',
                    `${usuario.err.message}`,
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


interface Colaboradores {

  usuario: Usuario;
  roles: Roles;
  sucursales: Sucursal;
}
