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
import { UsuarioWorker } from '../../interfaces/resp-worker';
import { SucursalService } from '../../services/sucursal.service';
import { SucursalesDB } from '../../interfaces/sucursales';
import * as loadingActions from '../../reducers/loading/loading.actions';
import * as modalActions from '../../reducers/modal/modal.actions';
import Swal from 'sweetalert2';
import { ProductoService } from '../../services/producto.service';
import { ProductoPedidoService } from '../../services/producto-pedido.service';
import { Productospedido, ProductoPedido } from '../../interfaces/producto-pedido';
import { Producto } from 'src/app/interfaces/producto';
import { ProductoDB } from '../../interfaces/producto';

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
  objTotal = {
    subtotal: null,
    itbms: null,
    total: null
  };
  loadModal = false;

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
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.obtenerPedido();
    this.cargarFormulario();
    // this.cargarProductos();
    // this.cagarUsuarioEtapa();
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

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        const data = {
          token: worker.token,
          idPedido
        };

        this.pedidoService.obtenerPedido(data).pipe(first())
          .subscribe((pedido: Pedido) => {
            // console.log(pedido);
            this.pedido = pedido.pedidoDB;
            this.cargarSelects();
            this.cargarProductosPedidos(pedido.pedidoDB);

            const checkItbms: any = this.checkItbms.nativeElement;
            checkItbms.checked = pedido.pedidoDB.itbms;
          });
      });
  }

  cargarSelects(): void {

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        const cargarFechaEntrega = () => {
          this.forma.controls.fechaEntrega.setValue(this.pedido.fecha_entrega);
        };

        const cargarPrioridad = () => {
          this.http.get('../../../assets/prioridad.json')
            .pipe().subscribe((data: any) => {
              this.prioridadesPedido = data;
              this.forma.controls.prioridad.setValue(this.pedido.prioridad_pedido);
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
        };



        const cargarOrigen = () => {

          this.origenPedidoService.obtenerOrigenes(worker.token).subscribe(data => {
            this.origenes = data;
            this.forma.controls.origenVenta.setValue(this.pedido.origen_pedido?._id); // Hacer populate en la DB
          });

        };

        const cargarDiseniador = () => {

          this.userService.obtenerUsuariosRole(worker.token, 'DiseniadorRole')
            .subscribe((data: any) => {
              this.diseniadores = data.usuariosDB;
              this.forma.controls.diseniador.setValue(data.usuariosDB[0]._id);
            });

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
            });
        };

        cargarPrioridad();
        cargarEtapa();
        cargarEstado();
        cargarOrigen();
        cargarDiseniador();
        cargarVendedor();
        cargarSucursales();
        cargarFechaEntrega();

      });
  }

  cargarDistribucion(): void {

    this.store.dispatch(modalActions.cargarModal({ tipo: 'ver-diseniadores', estado: true }));
  }

  actualizarInfo(): void {

    this.store.dispatch(loadingActions.cargarLoading());

    if (this.forma.status === 'VALID') {

      // console.log(this.pedido._id);

      const data = {
        id: this.pedido._id,
        sucursal: this.forma.controls.sucursal.value,
        etapa_pedido: this.forma.controls.etapaPedido.value,
        prioridad_pedido: this.forma.controls.prioridad.value,
        asignado_a: this.forma.controls.diseniador.value,
        estado_pedido: this.forma.controls.estadoPedido.value,
        fecha_entrega: this.forma.controls.fechaEntrega.value,
        origen_pedido: this.forma.controls.origenVenta.value,
      };

      if (data.etapa_pedido === 1 && data.asignado_a === null) {

        Swal.fire(
          'Mensaje',
          `Debe asignar el pedido a un diseñador`,
          'error'
        );

        return;
      }

      this.store.select('login').pipe(first())
        .subscribe(worker => {
          this.pedidoService.editarPedido(data, worker.token)
            .subscribe((pedidoDB: any) => {

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
          pedido: pedido._id,
          producto: idProducto,
          token: worker.token,
          cantidad: this.forma.controls.cantidad.value,
          precio: this.forma.controls.precio.value,
          comentario: this.forma.controls.comentario.value,
          // itbms: pedido.itbms
        };

        this.productoPedidoService.crearProductoPedido(data)
          .subscribe((pedidoDB: Pedido) => {
            this.cargarProductosPedidos(pedidoDB.pedidoDB);
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
            this.costoDelPedido(this.productosPedidos, pedido.itbms);

            if (this.productosPedidos.length === 0) {
              this.forma.controls.itbms.disable();
            } else {
              this.forma.controls.itbms.enable();
            }
          });
      });
  }

  costoDelPedido(productoPedido: Array<Productospedido>, itbms: boolean): void {

    if (productoPedido.length === 0) {
      this.objTotal.subtotal = 0;
      this.objTotal.itbms = 0;
      this.objTotal.total = 0;
      return;
    }

    // console.log(itbms);


    // console.log(productoPedido, itbms);
    // return;
    if (itbms === false || !itbms) {

      const mapSubtotal = productoPedido.map(productoPed => {
        return productoPed.total;
      });

      const subtotal = mapSubtotal.reduce((acc, current) => {
        return acc + current;
      });

      // itbms
      const itmbs = (subtotal * 0);

      // total
      const total = subtotal + itmbs;

      this.objTotal.subtotal = subtotal.toFixed(2);
      this.objTotal.itbms = itmbs.toFixed(2);
      this.objTotal.total = (subtotal + itmbs).toFixed(2);

    }

    if (itbms === true) {

      const mapSubtotal = productoPedido.map(productoPed => {
        return productoPed.total;
      });

      const subtotal = mapSubtotal.reduce((acc, current) => {
        return acc + current;
      });

      // itbms
      const itmbs = (subtotal * 0.07);

      // total
      const total = subtotal + itmbs;

      this.objTotal.subtotal = subtotal.toFixed(2);
      this.objTotal.itbms = itmbs.toFixed(2);
      this.objTotal.total = (subtotal + itmbs).toFixed(2);
    }
  }

  detectarItbms(e: any, pedido: PedidoDB): void {
    const itbmsChecked = e.target.checked;

    const data = {
      itbms: itbmsChecked,
      id: pedido._id
    };

    this.store.select('login').pipe(first())
      .subscribe(worker => {
        this.pedidoService.editarPedido(data, worker.token)
          .subscribe((pedidoDB: Pedido) => {
            this.costoDelPedido(pedidoDB.pedidoDB.productos_pedidos, pedidoDB.pedidoDB.itbms);
          });
      });
  }

  actualizarProducto(): void {
    console.log(this.forma);
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
    this.store.dispatch(modalActions.cargarModal({ tipo: 'subir-archivos', estado: true }));
  }

}
