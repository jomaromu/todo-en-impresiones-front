import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../reducers/globarReducers';
import { first, take } from 'rxjs/operators';
import { Pedido, PedidoDB } from '../../interfaces/pedido';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { OrigenPedidoService } from '../../services/origen-pedido.service';
import { OrigenPedido } from '../../interfaces/origen-pedido';
import { UserService } from '../../services/user.service';
import { UsuarioWorker, Usuario } from '../../interfaces/resp-worker';
import { SucursalService } from '../../services/sucursal.service';
import { SucursalesDB } from '../../interfaces/sucursales';
import * as loadingActions from '../../reducers/loading/loading.actions';
import * as modalActions from '../../reducers/modal/modal.actions';
import Swal from 'sweetalert2';
import { ProductoService } from '../../services/producto.service';
import { ProductoPedidoService } from '../../services/producto-pedido.service';
import { Productospedido, ProductoPedido } from '../../interfaces/producto-pedido';
import { Producto } from '../../interfaces/producto';
import { ProductoDB } from '../../interfaces/producto';
import { ArchivosService } from '../../services/archivos.service';
import { Archivo } from '../../interfaces/archivo';
import { WebsocketsService } from '../../services/sockets/websockets.service';
import { ObjTotales } from '../../reducers/totales-pedido/totales.actions';
import * as totalesAction from '../../reducers/totales-pedido/totales.actions';
import { PagosService } from '../../services/pagos.service';
import { PagoDB } from '../../interfaces/pagos';

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.scss']
})
export class PedidoComponent implements OnInit {

  @ViewChild('usuarioEtapaView', { static: true }) usuarioEtapaView: ElementRef<HTMLElement>;
  @ViewChild('placeHolderProducto', { static: true }) placeHolderProducto: ElementRef<HTMLElement>;
  @ViewChild('checkItbms', { static: true }) checkItbms: ElementRef;
  @ViewChild('inputProducto', { static: true }) inputProducto: ElementRef<HTMLElement>;

  pedido: PedidoDB;
  pedidoCompleto: Pedido;
  forma: FormGroup;

  usuarioEtapa: string;
  usuariosEtapa: Array<UsuarioWorker>;
  fechaEntrega: string;
  prioridadesPedido: Array<any>;
  etapasPedido: Array<any>;
  estadosPedido: Array<any>;
  origenes: OrigenPedido;
  diseniadores: Array<UsuarioWorker>;
  vendedor: string;
  sucursales: Array<SucursalesDB>;
  loading = false;
  productosPedidos: Array<Productospedido>;
  productos: Array<ProductoDB>;
  producto: ProductoDB;
  objTotal: ObjTotales = {
    pedido: 0,
    subtotal: 0,
    itbms: 0,
    pagos: 0,
    total: 0
  };
  loadModal = false;
  archivo: Archivo;
  diseniadorFake = {
    _id: null,
    nombre: 'Seleccionar'
  };

  pagos: Array<PagoDB>;
  modalidad = [
    { id: 0, nombre: 'Abono' },
    { id: 1, nombre: 'Cancelación' },
    // { id: 2, nombre: 'Delivery' },
  ];

  role: string;

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
    private productoService: ProductoService,
    private origenPedidoService: OrigenPedidoService,
    private productoPedidoService: ProductoPedidoService,
    private userService: UserService,
    private sucursalService: SucursalService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private http: HttpClient,
    private archivoService: ArchivosService,
    private wsService: WebsocketsService,
    private pagoService: PagosService
  ) {
    // this.cdref.detectChanges();
  }

  ngOnInit(): void {

    this.escucharSocketsArchivos();
    this.obtenerPagosSocket();
    this.cargarFormulario();
    this.obtenerPedido();
    this.cargarArchivos();
  }

  cargarFormulario(): void {

    this.forma = this.fb.group({
      fechaRegistro: [null],
      fechaEntrega: [null],
      etapaPedido: [null],
      estadoPedido: [null],
      prioridad: [null],
      origenVenta: [null],
      diseniador: [null],
      vendedor: [null],
      sucursal: [null],

      producto: [null],
      comentario: [null],
      precio: [null],
      cantidad: [null],
      itbms: [null],
    });

    this.forma.controls.fechaRegistro.disable();
  }

  // informacion
  obtenerPedido(): void {

    const idPedido = this.route.snapshot.queryParamMap.get('id');

    this.store.select('login').pipe(take(3))
      .subscribe(worker => {

        this.role = worker?.usuario?.colaborador_role;

        const data = {
          token: worker.token,
          idPedido
        };

        this.pedidoService.obtenerPedido(data).pipe(take(3))
          .subscribe((pedido: Pedido) => {
            // console.log(pedido);
            this.pedido = pedido.pedidoDB;
            this.pedidoCompleto = pedido;
            this.cargarSelects();
            this.cargarProductosPedidos(pedido.pedidoDB);
            this.obtenerPagosPorPedido(pedido.pedidoDB._id);

            const checkItbms: any = this.checkItbms.nativeElement;
            checkItbms.checked = pedido.pedidoDB.itbms;
          });
      });
  }

  cargarSelects(): void {

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        const role = worker.usuario.colaborador_role;

        const cargarFechaEntrega = () => {
          this.forma.controls.fechaEntrega.setValue(this.pedido.fecha_entrega);
          // console.log(this.pedido);

          if (role === 'DiseniadorRole') {
            this.forma.controls.fechaEntrega.disable();
          }
        };

        const cargarPrioridad = () => {
          this.http.get('../../../assets/prioridad.json')
            .pipe().subscribe((data: any) => {
              this.prioridadesPedido = data;
              this.forma.controls.prioridad.setValue(this.pedido.prioridad_pedido);

              if (role === 'DiseniadorRole') {
                this.forma.controls.prioridad.disable();
              }
            });
        };

        const cargarEtapa = () => {
          this.http.get('../../../assets/etapas.json')
            .pipe().subscribe((data: any) => {
              this.etapasPedido = data;
              this.forma.controls.etapaPedido.setValue(this.pedido.etapa_pedido);
            });
        };

        const cargarEstado = () => {
          this.http.get('../../../assets/estados.json')
            .pipe().subscribe((data: any) => {
              this.estadosPedido = data;
              this.forma.controls.estadoPedido.setValue(this.pedido.estado_pedido);
            });

          if (role === 'DiseniadorRole') {
            this.forma.controls.estadoPedido.disable();
          }
        };



        const cargarOrigen = () => {

          this.origenPedidoService.obtenerOrigenes(worker.token).subscribe(data => {
            this.origenes = data;
            this.forma.controls.origenVenta.setValue(this.pedido.origen_pedido?._id); // Hacer populate en la DB

            if (role === 'DiseniadorRole') {
              this.forma.controls.origenVenta.disable();
            }
          });

        };

        const cargarDiseniadores = () => {

          this.userService.obtenerUsuariosRole(worker.token, 'DiseniadorRole')
            .subscribe((data: any) => {
              this.diseniadores = data.usuariosDB;
              // this.forma.controls.diseniador.setValue(data.usuariosDB[0]._id);
              // console.log(this.diseniadores);
            });

        };

        const cargarDiseniador = () => {

          if (!this.pedido.asignado_a) {
            this.forma.controls.diseniador.setValue(this.diseniadorFake._id);
          } else {
            this.forma.controls.diseniador.setValue(this.pedido.asignado_a._id);
          }

          if (role === 'DiseniadorRole') {
            this.forma.controls.diseniador.disable();
          }
        };

        const cargarVendedor = () => {

          this.userService.obtenerUsuarioID(this.pedido.idCreador._id, worker.token)
            .subscribe(data => {
              this.vendedor = `${data.usuario.nombre} ${data.usuario.apellido}`;
              this.forma.controls.vendedor.disable();
            });

        };

        const cargarSucursales = () => {

          this.sucursalService.obtenerSucursales(worker.token)
            .subscribe(data => {
              this.sucursales = data.sucursalesDB;
              this.forma.controls.sucursal.setValue(this.pedido.sucursal._id);

              if (role === 'DiseniadorRole') {
                this.forma.controls.sucursal.disable();
              }
            });
        };

        cargarFechaEntrega();
        cargarVendedor();
        cargarPrioridad();
        cargarEtapa();
        cargarEstado();
        cargarOrigen();
        cargarDiseniadores();
        cargarSucursales();
        cargarDiseniador();

      });
  }

  cargarDistribucion(): void {

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        this.userService.obtenerUsuariosRole(worker.token, 'DiseniadorRole')
          .subscribe((usuarios: Usuario) => {

            this.store.dispatch(modalActions.cargarModal({ tipo: 'ver-diseniadores', estado: true, data: usuarios }));
          });
      });

  }

  actualizarInfo(tipo: string): void {

    this.store.dispatch(loadingActions.cargarLoading());

    if (this.forma.status === 'VALID') {

      // console.log(this.pedido._id);

      const data = {
        tipo,
        id: this.pedido._id,
        sucursal: this.forma.controls.sucursal.value,
        etapa_pedido: parseInt(this.forma.controls.etapaPedido.value, 10),
        // etapa_pedido: this.forma.controls.etapaPedido.value,
        // prioridad_pedido: Number(this.forma.controls.prioridad.value),
        prioridad_pedido: this.forma.controls.prioridad.value,
        // tslint:disable-next-line: max-line-length
        // asignado_a: this.forma.controls.diseniador.value === 'null' || this.forma.controls.diseniador.value === null || this.forma.controls.diseniador.value === undefined ? this.forma.controls.diseniador.setValue(null) : this.forma.controls.diseniador.value,
        // estado_pedido: Number(this.forma.controls.estadoPedido.value),
        asignado_a: null,
        estado_pedido: this.forma.controls.estadoPedido.value,
        fecha_entrega: this.forma.controls.fechaEntrega.value,
        origen_pedido: this.forma.controls.origenVenta.value,
      };

      if (this.forma.controls.diseniador.value !== null) {
        data.asignado_a = this.forma.controls.diseniador.value;
      }

      if (data.etapa_pedido === 1 && !data.asignado_a) {

        Swal.fire(
          'Mensaje',
          `Debe asignar el pedido a un diseñador`,
          'error'
        );

        this.store.dispatch(loadingActions.quitarLoading());
      }
      //  else if (data.etapa_pedido !== 1 && (data.asignado_a === null || data.asignado_a === 'null')) {
      //   Swal.fire(
      //     'Mensaje',
      //     `Seleccione un diseñador`,
      //     'error'
      //   );

      //   this.store.dispatch(loadingActions.quitarLoading());

      // }
      else {
        // return;

        this.store.select('login').pipe(first())
          .subscribe(worker => {
            this.pedidoService.editarPedido(data, worker.token)
              .subscribe((pedidoDB: any) => {

                // console.log(pedidoDB);

                this.store.dispatch(loadingActions.quitarLoading());

                if (pedidoDB.ok === true) {
                  Swal.fire(
                    'Mensaje',
                    `${pedidoDB.mensaje}`,
                    'info'
                  );

                } else {

                  Swal.fire(
                    'Mensaje',
                    `${pedidoDB.mensaje}`,
                    'info'
                  );

                  this.store.dispatch(loadingActions.quitarLoading());

                }

              });
          });
      }
    }

  }

  // producto

  detectarProducto(e: Event | any): void {
    const placeHolderProducto = this.placeHolderProducto.nativeElement;

    e.target.addEventListener('blur', (ev) => {

      setTimeout(() => {
        placeHolderProducto.style.display = 'none';
      }, 200);
    });
    const valProd = e.target.value;

    if (valProd !== '') {

      this.store.select('login').pipe(first())
        .subscribe(worker => {

          const data = {
            token: worker.token,
            criterioNombre: valProd
          };

          this.productoService.obtenerProductoCriterioNombre(data)
            .subscribe((productos: Producto) => {

              this.productos = productos.productosDB;

              if (productos.productosDB.length === 0 || this.forma.controls.producto.value === '') {
                placeHolderProducto.style.display = 'none';

                this.producto = null;
                this.productos = [];
                this.forma.controls.comentario.setValue('');
                this.forma.controls.cantidad.setValue('');
                this.forma.controls.precio.setValue('');

              }

              if (productos.productosDB.length > 0) {
                placeHolderProducto.style.display = 'block';
              }
            });
        });

    } else {

      placeHolderProducto.style.display = 'none';
      this.producto = null;
      this.productos = [];
      this.forma.controls.comentario.setValue('');
      this.forma.controls.cantidad.setValue('');
      this.forma.controls.precio.setValue('');
    }

  }

  verPedidos(): void {
    this.store.dispatch(modalActions.cargarModal({ tipo: 'ver-productos', estado: true }));
  }

  btnAgregar(e: any, pedido: PedidoDB): void {

    const inputProducto = this.inputProducto.nativeElement;
    const idProducto = inputProducto.getAttribute('data-idProducto');

    if (idProducto === null) {

      Swal.fire(
        'Mensaje',
        'Debe agregar un pedido',
        'info'
      );
      return;
    }

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        const data = {
          tipo: 'producto',
          pedido: pedido._id,
          producto: idProducto,
          token: worker.token,
          cantidad: this.forma.controls.cantidad.value,
          precio: this.forma.controls.precio.value,
          comentario: this.forma.controls.comentario.value,
          // subtotalPedido: this.objTotal.subtotal,
          // totalPedido: this.objTotal.total
          // itbms: pedido.itbms
        };

        this.productoPedidoService.crearProductoPedido(data).pipe(first())
          .subscribe((pedidoDB: Pedido) => {

            if (pedidoDB.ok === false) {
              Swal.fire(
                'Mensaje',
                `${pedidoDB.mensaje}`,
                'error'
              );

            } else if (pedidoDB.ok === true) {
              this.cargarProductosPedidos(pedidoDB.pedidoDB);
            }
          });

      });

  }

  agregarProducto(producto: ProductoDB): void {

    this.forma.controls.producto.setValue(producto.nombre);
    this.forma.controls.comentario.setValue(producto.descripcion);
    this.forma.controls.cantidad.setValue(1);
    this.forma.controls.precio.setValue(producto.precio);

    this.producto = producto;

  }

  cargarProductosPedidos(pedido: PedidoDB): void {

    this.store.select('login').pipe(first())

      .subscribe(worker => {

        const data = {
          token: worker.token,
          pedido: pedido._id
        };

        this.productoPedidoService.obtenerProductosPedido(data)
          .pipe(first())
          .subscribe((pedidoDB: Pedido) => {
            this.productosPedidos = pedidoDB.pedidoDB.productos_pedidos;
            // console.log(pedido);
            this.costoDelPedido(pedidoDB);

            if (this.productosPedidos.length === 0) {
              this.forma.controls.itbms.disable();
            } else {
              this.forma.controls.itbms.enable();
            }
          });
      });
  }

  costoDelPedido(pedido: Pedido): void {

    const productoPedido: Array<any> = pedido?.pedidoDB?.productos_pedidos;
    const itbms = pedido?.pedidoDB?.itbms;

    // if (productoPedido.length === 0) {
    //   this.objTotal.pedido = 0;
    //   this.objTotal.itbms = 0;
    //   this.objTotal.subtotal = 0;
    //   this.objTotal.pagos = 0;
    //   this.objTotal.total = 0;

    // } else {


    const mapTotalPedido = productoPedido.map(productoPed => {
      return productoPed.total;
    });

    const totalPedido = mapTotalPedido.reduce((acc, current) => {
      return acc + current;
    }, 0);

    const mapPagos = pedido.pedidoDB.pagos_pedido.map(pago => {

      // if (pago.estado === false) {
      //   return 0;
      // }
      return pago.monto;
    });

    const totalPagos: number = mapPagos.reduce((acc, current) => {
      return acc + current;
    }, 0);

    // console.log(totalPagos);

    let itbm = 0;

    if (itbms === false || !itbms) {

      const subtotal = (totalPedido + itbm);
      const total = (subtotal - totalPagos);

      this.objTotal.pedido = totalPedido;
      this.objTotal.itbms = itbm;
      this.objTotal.subtotal = subtotal;
      this.objTotal.pagos = totalPagos;
      this.objTotal.total = total;

    }

    if (itbms === true) {

      itbm = totalPedido * 0.07;
      const subtotal = (totalPedido + itbm);
      const total = (subtotal - totalPagos);

      this.objTotal.pedido = totalPedido;
      this.objTotal.itbms = itbm;
      this.objTotal.subtotal = subtotal;
      this.objTotal.pagos = totalPagos;
      this.objTotal.total = total;
      // }

    }

    // tslint:disable-next-line: max-line-length
    this.store.dispatch(totalesAction.obtenerTotalesPedido({ pedido: this.objTotal.pedido, subtotal: this.objTotal.subtotal, itbms: this.objTotal.itbms, pagos: this.objTotal.pagos, total: this.objTotal.total }));

    this.store.select('login')
      // .pipe(first())
      .pipe(take(3))
      .subscribe(worker => {

        // console.log('ok');
        // Actualizar pedido
        const data = {
          tipo: 'general',
          subtotal: this.objTotal.subtotal,
          total: this.objTotal.total,
          id: this.pedido._id
        };

        this.pedidoService.editarPedido(data, worker.token).pipe(first()).subscribe(); // revisar first

      });
  }

  detectarItbms(e: any, pedido: PedidoDB): void {
    const itbmsChecked = e.target.checked;

    const data = {
      tipo: 'producto',
      itbms: itbmsChecked,
      id: pedido._id
    };

    this.store.select('login').pipe(first())
      .subscribe(worker => {
        this.pedidoService.editarPedido(data, worker.token)
          .subscribe((pedido1: Pedido) => {
            this.costoDelPedido(pedido1);
          });
      });
  }

  eliminarProductoPedido(productoPedido: Productospedido, pedido: PedidoDB): void {

    this.store.dispatch(loadingActions.cargarLoading());

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        const data = {
          token: worker.token,
          IdProductoPedido: productoPedido._id,
          pedido: pedido._id
        };



        Swal.fire({
          title: 'Mensaje',
          text: '¿Desea quitar este producto del pedido?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Quitar producto',
          cancelButtonAriaLabel: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {

            this.productoPedidoService.eliminarProductoPedido(data)
              .subscribe((pedidoDB: Pedido) => {

                if (pedidoDB.ok === false) {

                  this.store.dispatch(loadingActions.quitarLoading());

                  Swal.fire(
                    'Mensaje',
                    `${pedidoDB.mensaje}`,
                    'error'
                  );

                } else {

                  this.store.dispatch(loadingActions.quitarLoading());
                  this.cargarProductosPedidos(pedidoDB.pedidoDB);

                  Swal.fire(
                    'Mensaje',
                    'Se quitó el producto del pedido',
                    'success'
                  );
                }

              });

          } else {

            this.store.dispatch(loadingActions.quitarLoading());

          }
        });
      });

  }

  // Archivo
  addArchivo(): void {
    this.store.dispatch(modalActions.cargarModal({ tipo: 'subir-archivos', estado: true, data: this.pedido._id }));
  }

  cargarArchivos(): void {

    const idPedido = this.route.snapshot.queryParamMap.get('id');

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        this.archivoService.obtenerArchivosPorPedido(worker.token, idPedido)
          .subscribe((archivo: Archivo) => {
            this.archivo = archivo;
          });
      });
  }

  eliminarArchivo(idArchivo: string, idPedido: string): void {

    Swal.fire({
      title: 'Mensaje',
      text: '¿Desea eliminar este archivo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Eliminar archivo',
      cancelButtonText: 'Cancelar'

    }).then((result) => {
      if (result.isConfirmed) {

        this.store.dispatch(loadingActions.cargarLoading());

        this.store.select('login').pipe(first())
          .subscribe(worker => {

            const data = {
              id: idArchivo,
              pedido: idPedido,
              token: worker.token
            };

            this.archivoService.eliminarArchivos(data)
              .subscribe((archivo: Archivo) => {

                if (archivo.ok === true) {

                  this.store.dispatch(loadingActions.quitarLoading());

                  Swal.fire(
                    'Mensaje',
                    `${archivo.mensaje}`,
                    'info'
                  );

                } else {

                  this.store.dispatch(loadingActions.quitarLoading());

                  Swal.fire(
                    'Mensaje',
                    `${archivo.mensaje}`,
                    'error'
                  );
                }

              });

          });

      }
    });
  }

  escucharSocketsArchivos(): void {

    this.wsService.escuchar('recibir-archivos')
      .subscribe((data: any) => {
        // console.log(data);
        this.cargarArchivos();
      });
  }

  // seguimiento
  guardarSeguimiento(idProductoPedido: string, valueSeg: any, valueProd: any): void {

    this.store.dispatch(loadingActions.cargarLoading());

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        const data = {
          token: worker.token,
          id: idProductoPedido,
          seguimiento_disenio: valueSeg.value,
          seguimiento_produccion: valueProd.value
        };

        this.productoPedidoService.editarProductoPedido(data)
          .subscribe((productoPedido: ProductoPedido) => {

            if (productoPedido.ok === true) {

              Swal.fire(
                'Mensaje',
                `${productoPedido.mensaje}`,
                'info'
              );

              this.store.dispatch(loadingActions.quitarLoading());

            } else {
              Swal.fire(
                'Mensaje',
                `${productoPedido.mensaje}`,
                'error'
              );

              this.store.dispatch(loadingActions.quitarLoading());
            }
          });
      });

    // console.log(idProductoPedido, idPedido, valueSeg.value, valueProd.value);
  }

  detectarSeguimiento(value: Event, idProductoPedido: string, tipo: number): void {

    const val = (value.target as HTMLInputElement).value;

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        const data = {
          token: worker.token,
          id: idProductoPedido,
          // seguimiento_disenio: valueSeg.value,
          // seguimiento_produccion: valueProd.value
        };

        if (tipo === 0) {
          Object.assign(data, { seguimiento_disenio: val });
        } else if (tipo === 1) {
          Object.assign(data, { seguimiento_produccion: val });
        }

        this.productoPedidoService.editarProductoPedido(data)
          .subscribe((productoPedido: ProductoPedido) => {

            if (productoPedido.ok === false) {

              Swal.fire(
                'Mensaje',
                `${productoPedido.mensaje}`,
                'error'
              );

              this.store.dispatch(loadingActions.quitarLoading());
            }
          });
      });
  }

  // pagos
  addPago(): void {
    this.store.dispatch(modalActions.cargarModal({ tipo: 'crear-pago', estado: true, data: this.pedido._id }));
  }

  obtenerPagosPorPedido(idPedido: string): void {
    this.store.select('login').pipe(first())
      .subscribe(worker => {

        this.pagoService.obtenerPagosPorPedido(worker.token, idPedido)
          .pipe(first())
          .subscribe((pedido: Pedido) => {

            this.pagos = pedido.pedidoDB.pagos_pedido;
          });
      });
  }

  obtenerPagosSocket(): void {
    this.wsService.escuchar('recibir-pagos')
      // .pipe(take(3))
      .subscribe((pedido: Pedido) => {
        // console.log(pedido);
        this.costoDelPedido(pedido);
        this.pagos = pedido.pedidoDB.pagos_pedido;
      });
  }

  checkEstadoPago(e: Event, pago: string): void {

    const evento = (e.target as HTMLInputElement).checked;

    if (!evento) {
      this.store.dispatch(modalActions.cargarModal({ tipo: 'estado-pago', estado: true, data: { evento, pedido: this.pedido._id, pago } }));
    }

  }

  motivoPagoAlert(pago: any): void {

    Swal.fire(
      'Motivo',
      `${pago.motivo}`,
      'info'
    );
  }

}
