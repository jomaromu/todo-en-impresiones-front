import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { first, mergeMap, map, concatMap, take } from 'rxjs/operators';
import { AppState } from 'src/app/reducers/globarReducers';
import { formatDate } from '@angular/common';

import { SucursalService } from '../../services/sucursal.service';
import { UserService } from '../../services/user.service';
import { PedidoService } from '../../services/pedido.service';

import * as moment from 'moment';
moment.locale('en');

import Swal from 'sweetalert2';
import { isWeekDay } from 'moment-business';
import { Cliente } from '../../interfaces/clientes';
import { Usuario } from '../../interfaces/resp-worker';
import { Sucursal } from '../../interfaces/sucursales';
import { Router } from '@angular/router';
import { Pedido } from '../../interfaces/pedido';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss']
})
export class PedidosComponent implements OnInit {

  @ViewChild('placeHolderCliente', { static: true }) placeHolderCliente: ElementRef<HTMLElement>;
  @ViewChild('placeHolderClienteCel', { static: true }) placeHolderClienteCel: ElementRef<HTMLElement>;
  @ViewChild('wrapCreaciones', { static: true }) wrapCreaciones: ElementRef<HTMLElement>;
  @ViewChild('nombre', { static: true }) nombre: ElementRef<HTMLElement>;
  @ViewChild('cliente', { static: false }) cliente: ElementRef<HTMLElement>;


  forma: FormGroup;
  sucursales: Sucursal;
  fecha: string;
  weekdDay = 0;
  contadorDias = 0;
  isWeekDay: boolean;
  clientes: Array<any>;
  idCliente: string;

  constructor(
    private fb: FormBuilder,
    private sucursalService: SucursalService,
    private userService: UserService,
    private pedidoService: PedidoService,
    private store: Store<AppState>,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarFechaEntrega();
    this.crearFormulario();
    this.cargarSelects();
    this.ocultarPlaceHolders();
  }

  crearFormulario(): void {

    this.forma = this.fb.group({
      nombre: [null, [Validators.required]],
      sucursal: [null, [Validators.required]],
      telefono: [null, [Validators.required]],
      fecha: [formatDate(this.fecha, 'yyyy-MM-dd', 'en'), [Validators.required]],
    });
  }

  get checkNombre(): boolean {

    if (this.forma.controls.nombre.touched && this.forma.controls.nombre.status === 'INVALID') {
      return true;
    }

  }

  get checkSucursal(): boolean {

    if (this.forma.controls.sucursal.touched && this.forma.controls.sucursal.status === 'INVALID') {
      return true;
    }

  }

  get checkTelefono(): boolean {

    if (this.forma.controls.telefono.touched && this.forma.controls.telefono.status === 'INVALID') {
      return true;
    }

  }

  get checkFecha(): boolean {

    if (this.forma.controls.fecha.touched && this.forma.controls.fecha.status === 'INVALID') {
      return true;
    }

  }

  cargarSelects(): void {

    this.store.select('login').subscribe(usuario => {

      const sucursalesDB = this.sucursalService.obtenerSucursales(usuario.token);

      sucursalesDB.subscribe((sucursales: Sucursal) => {
        this.sucursales = sucursales;
        this.forma.controls.sucursal.setValue(usuario.usuario?.sucursal?._id);
      });

    });

  }

  cargarFechaEntrega(): void {

    this.isWeekDay = isWeekDay(moment().add(1, 'days'));

    while (this.weekdDay !== 3) {

      if (this.isWeekDay) {

        this.weekdDay++;
        this.contadorDias++;

        this.isWeekDay = isWeekDay(moment().add(this.contadorDias + 1, 'days'));

      } else {

        this.weekdDay += 0;
        this.contadorDias++;
        this.isWeekDay = isWeekDay(moment().add(this.contadorDias + 1, 'days'));

      }

    }

    this.fecha = moment().add(this.contadorDias, 'days').format('YYYY-MM-DD');

  }

  fechaEntregaManual(e: any): void {

    const fecha: any = document.getElementById('fecha');
    this.fecha = fecha.value;
  }

  buscarClienteNombre(e: any): void {

    this.idCliente = null;

    const placeHolderCliente = this.placeHolderCliente.nativeElement;
    const nombre = this.nombre.nativeElement;
    let objCliente = {};

    if (this.forma.controls.nombre.status === 'INVALID') {

      placeHolderCliente.style.display = 'none';
    }

    if (this.forma.controls.nombre.status === 'VALID') {

      // placeHolderCliente.style.display = 'block';

      this.store.select('login').pipe(first())
        .subscribe(worker => {

          const data = {
            token: worker.token,
            criterioNombre: this.forma.controls.nombre.value
          };

          this.userService.obtenerClienteCriterioNombre(data).subscribe((clientes: Cliente) => {

            if (clientes.ok === true && clientes.usuariosDB.length !== 0) {

              placeHolderCliente.style.display = 'block';

              const mapClientes = clientes.usuariosDB.map(cliente => {

                if (cliente.client_role === 'EmpresaRole' || cliente.client_role === 'EmpresaVIPRole') {

                  objCliente = {
                    nombre: cliente.nombre,
                    telefono: cliente.telefono,
                    sucursal: cliente.sucursal,
                    idCliente: cliente._id
                  };

                } else {

                  objCliente = {
                    nombre: `${cliente.nombre} ${cliente.apellido}`,
                    telefono: cliente.telefono,
                    sucursal: cliente.sucursal,
                    idCliente: cliente._id
                  };

                }

                return objCliente;

              });

              // console.log(mapClientes);
              this.clientes = mapClientes;

              // const placeHolderCliente = this.placeHolderCliente.nativeElement;

              if (this.clientes?.length === 0) {
                placeHolderCliente.style.display = 'none';
              }

            }


          });

        });


    }

    // console.log(this.forma.controls.nombre.value);

  }

  buscarClienteTelefono(e: any): void {

    this.idCliente = null;

    const placeHolderClienteCel = this.placeHolderClienteCel.nativeElement;
    const nombre = this.nombre.nativeElement;
    let objCliente = {};

    if (this.forma.controls.telefono.status === 'INVALID') {

      placeHolderClienteCel.style.display = 'none';
    }

    if (this.forma.controls.telefono.status === 'VALID') {

      // placeHolderClienteCel.style.display = 'block';

      this.store.select('login').pipe(first())
        .subscribe(worker => {

          const data = {
            token: worker.token,
            telefono: this.forma.controls.telefono.value
          };

          this.userService.obtenerClienteCriterioTelefono(data).subscribe((clientes: Cliente) => {

            if (clientes.ok === true && clientes.usuariosDB.length !== 0) {

              placeHolderClienteCel.style.display = 'block';

              const mapClientes = clientes.usuariosDB.map(cliente => {

                if (cliente.client_role === 'EmpresaRole' || cliente.client_role === 'EmpresaVIPRole') {

                  objCliente = {
                    nombre: cliente.nombre,
                    telefono: cliente.telefono,
                    sucursal: cliente.sucursal,
                    idCliente: cliente._id
                  };

                } else {

                  objCliente = {
                    nombre: `${cliente.nombre} ${cliente.apellido}`,
                    telefono: cliente.telefono,
                    sucursal: cliente.sucursal,
                    idCliente: cliente._id
                  };

                }

                return objCliente;

              });

              // console.log(mapClientes);
              this.clientes = mapClientes;

              // const placeHolderClienteCel = this.placeHolderClienteCel.nativeElement;

              if (this.clientes?.length === 0) {
                placeHolderClienteCel.style.display = 'none';
              }

            }


          });

        });


    }

    // console.log(this.forma.controls.nombre.value);

  }

  detectarCliente(e: any): void {

    this.idCliente = e.idCliente;

    const placeHolderCliente = this.placeHolderCliente.nativeElement;
    const placeHolderClienteCel = this.placeHolderClienteCel.nativeElement;

    this.forma.controls.nombre.setValue(e.nombre);
    this.forma.controls.telefono.setValue(e.telefono);
    // this.forma.controls.sucursal.setValue(e.sucursal._id);

    placeHolderCliente.style.display = 'none';
    placeHolderClienteCel.style.display = 'none';
  }

  ocultarPlaceHolders(): void {

    const wrapCreaciones = this.wrapCreaciones.nativeElement;
    const placeHolderCliente = this.placeHolderCliente.nativeElement;
    const placeHolderClienteCel = this.placeHolderClienteCel.nativeElement;

    wrapCreaciones.addEventListener('click', () => {
      placeHolderCliente.style.display = 'none';
      placeHolderClienteCel.style.display = 'none';
    });

  }

  limpiarForma(): void {

    // this.forma.reset();
    this.forma.controls.nombre.reset();
    this.forma.controls.telefono.reset();
    this.forma.controls.sucursal.reset();
  }

  guardar(): void {

    this.forma.markAllAsTouched();

    if (this.forma.status === 'INVALID') {
      return;
    }

    if (this.forma.status === 'VALID') {

      if (this.idCliente === null) {

        Swal.fire(
          'Mensaje',
          `Cliente no existe en la base de datos`,
          'error'
        );

        return;

      }

      this.store.select('login').pipe(first())
        .subscribe(worker => {

          this.userService.obtenerClienteID(this.idCliente, worker.token)
            .subscribe((client: Usuario) => {

              if (client.ok === false) {

                Swal.fire(
                  'Mensaje',
                  `${client.mensaje}`,
                  'error'
                );

              } else {

                const data = {

                  cliente: this.idCliente,
                  sucursal: this.forma.controls.sucursal.value,
                  fecha_entrega: this.forma.controls.fecha.value,
                  token: worker.token,
                  vendedor: worker.usuario._id
                };


                // console.log(data);
                this.pedidoService.crearPedido(data)
                  .subscribe((pedido: Pedido) => {

                    if (pedido.ok === false) {

                      Swal.fire(
                        'Mensaje',
                        `${pedido.mensaje}`,
                        'error'
                      );

                    } else if (pedido.ok === true) {

                      // console.log(pedido);
                      this.router.navigate(['dashboard/pedido'], { queryParams: { id: pedido.pedidoDB._id } });

                      Swal.fire(
                        'Mensaje',
                        `${pedido.mensaje}`,
                        'info'
                      );

                      // Swal.fire({
                      //   title: 'Mensaje',
                      //   text: 'Pedido creado',
                      //   icon: 'info',
                      //   showCancelButton: false,
                      //   confirmButtonColor: '#3085d6',
                      //   cancelButtonColor: '#d33',
                      //   confirmButtonText: 'Ok',
                      //   cancelButtonText: 'Nuevo pedido'
                      // }).then((result) => {
                      //   if (result.isConfirmed) {
                      //     this.router.navigate(['dashboard/pedido'], { queryParams: { id: pedido.pedidoDB._id } });
                      //   }
                      //    else {
                      //     this.limpiarForma();
                      //   }
                      // });
                    } else {

                      Swal.fire(
                        'Mensaje',
                        `${pedido.mensaje}`,
                        'error'
                      );
                    }
                  });
              }
            });
        });

    }

  }

}
