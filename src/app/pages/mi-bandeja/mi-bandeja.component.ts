import { Component, OnInit, AfterContentChecked, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { first, take } from 'rxjs/operators';
import { AppState } from '../../reducers/globarReducers';
import { SucursalService } from '../../services/sucursal.service';
import { Sucursal, SucursalesDB } from '../../interfaces/sucursales';
import { UserService } from '../../services/user.service';
import { UsuarioWorker, Usuario } from '../../interfaces/resp-worker';
import { PedidoService } from '../../services/pedido.service';
import { Pedido, PedidoDB } from '../../interfaces/pedido';

@Component({
  selector: 'app-mi-bandeja',
  templateUrl: './mi-bandeja.component.html',
  styleUrls: ['./mi-bandeja.component.scss']
})
export class MiBandejaComponent implements OnInit {

  @ViewChild('selectUser', { static: false }) selectUser: ElementRef<HTMLElement>;

  forma: FormGroup;
  role: string;
  optBandeja: Array<any>;
  sucursales: Sucursal;
  usuarios: Array<UsuarioWorker>;
  pedidos: Pedido;
  worker: Usuario;

  userFake = { id: 'null', nombre: 'Todas' };

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private sucursalService: SucursalService,
    private userService: UserService,
    private pedidoService: PedidoService
  ) { }

  ngOnInit(): void {
    this.formularioFake();
    this.crearFormulario();
  }

  crearFormulario(): void {

    this.store.select('login')
      .pipe(take(3))
      .subscribe(worker => {

        this.worker = worker;

        // console.log(this.worker);

        if (worker.ok === true && worker.usuario.colaborador_role === 'SuperRole') {
          this.role = worker.usuario.colaborador_role;
          this.formularioAdmin();
          this.cargarTodosPedidos();
        } else if (worker.ok === true && worker.usuario.colaborador_role === 'VendedorNormalRole') {
          this.cargarPedidosVendedor(worker);
        } else if (worker.ok === true && worker.usuario.colaborador_role === 'ProduccionNormalRole') {
          this.cargarPedidosProduccion(worker);
        } else if (worker.ok === true && worker.usuario.colaborador_role === 'DiseniadorRole') {
          this.cargarPedidosDiseniador(worker);
        }
      });
  }

  seleccionarBandeja(): void {

    this.optBandeja = [
      { nombre: 'Todas', id: 'null' },
      { nombre: 'Producción', id: 'prod' },
      { nombre: 'Vendedor', id: 'vend' },
      { nombre: 'Diseñador', id: 'dise' },
      { nombre: 'Admin', id: 'admin' }
    ];

    this.forma.controls.selBandeja.setValue(this.optBandeja[0].id);

  }

  cargarSucursales(): void {

    this.store.select('login').pipe(first())
      .subscribe(worker => {
        this.sucursalService.obtenerSucursales(worker.token).pipe(first())
          .subscribe((sucursales: Sucursal) => {
            this.sucursales = sucursales;
            const sucursalFake: SucursalesDB = {
              _id: 'null', nombre: 'Todas'
            };

            this.sucursales.sucursalesDB.unshift(sucursalFake);
            this.forma.controls.sucursal.setValue(sucursales.sucursalesDB[0]._id);
          });
      });
  }

  detectarUsuarios(): void {

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        let valBandeja = this.forma.controls.selBandeja.value;
        let valSucursal = this.forma.controls.sucursal.value;

        if (!valBandeja) {
          valBandeja = 'null';
        }

        if (!valSucursal) {
          valSucursal = 'null';
        }

        const data = {
          role: valBandeja,
          sucursal: valSucursal,
          token: worker.token
        };

        // console.log(valBandeja);

        this.userService.obtenerUsuarios(worker.token).pipe(first())
          .subscribe((resp: Usuario) => {

            // console.log(resp.usuarios);
            // return;
            if (resp.usuarios.length === 0) {
              this.forma.controls.usuarios.setValue('null');
            } else {

              switch (valBandeja) {
                case 'dise':

                  this.usuarios = resp.usuarios.filter(usuario => {
                    if (usuario.colaborador_role === 'DiseniadorRole') {
                      return usuario;
                    }
                  });
                  this.forma.controls.usuarios.setValue(this.usuarios[0]._id);
                  break;
                case 'vend':
                  this.usuarios = resp.usuarios.filter(usuario => {
                    if (usuario.colaborador_role === 'VendedorNormalRole' || usuario.colaborador_role === 'VendedorVIPRole') {
                      return usuario;
                    }
                  });
                  this.forma.controls.usuarios.setValue(this.usuarios[0]._id);
                  break;
                default:
                  this.forma.controls.usuarios.setValue('null');
                  this.usuarios = [];
              }
            }
          });
      });


  }

  formularioAdmin(): void {

    this.forma.controls.usuarios.setValue(this.userFake);

    this.forma = this.fb.group({
      selBandeja: ['null'],
      sucursal: ['null'],
      usuarios: ['null']
    });

    this.seleccionarBandeja();
    this.cargarSucursales();
    // this.cargarColaboradores();
  }

  cargarPedidosVendedor(worker: Usuario): void {
    // console.log(worker);

    const data = {
      token: worker.token,
      role: worker.usuario.colaborador_role,
      idSUcursalWorker: worker.usuario.sucursal._id
    };

    this.pedidoService.obtenerPedidosPorRole(data)
      .subscribe((pedidos: Pedido) => {
        // console.log(pedidos);
        this.pedidos = pedidos;
      });
  }

  cargarPedidosProduccion(worker: Usuario): void {
    // console.log(worker);

    const data = {
      token: worker.token,
      role: worker.usuario.colaborador_role,
      idSUcursalWorker: worker.usuario.sucursal._id
    };

    this.pedidoService.obtenerPedidosPorRole(data)
      .subscribe((pedidos: Pedido) => {
        // console.log(pedidos);
        this.pedidos = pedidos;
      });
  }

  cargarPedidosDiseniador(worker: Usuario): void {
    // console.log(worker);

    const data = {
      token: worker.token,
      role: worker.usuario.colaborador_role,
      idSUcursalWorker: worker.usuario.sucursal._id
    };

    this.pedidoService.obtenerPedidosPorRole(data)
      .subscribe((pedidos: Pedido) => {
        // console.log(pedidos);
        this.pedidos = pedidos;
      });
  }

  aplicarFiltro(usuario: Array<UsuarioWorker>): void {

    this.store.select('login').pipe(first())
      .subscribe(async colaborador => {

        const valBandeja = this.forma.controls.selBandeja.value;
        const valUser = this.forma.controls.usuarios.value;
        const valSucursal = this.forma.controls.sucursal.value;

        const data = {
          token: colaborador.token,
          bandejas: valBandeja,
          userID: valUser,
          colRole: valUser,
          sucursal: valSucursal
        };

        // console.log(data);

        if (data.bandejas !== 'null') {
          data.bandejas = valBandeja;
        }

        if (valUser !== 'null') {

          const dataUser = this.usuarios.find(user => {
            return user._id === valUser;
          });

          data.colRole = dataUser.colaborador_role;
          data.userID = dataUser._id;

        }


        if (data.sucursal !== 'null') {
          data.sucursal = valSucursal;
        }

        this.pedidoService.busquedaBandejas(data).pipe(first())
          .subscribe((resp: Pedido) => {
            this.pedidos = resp;
          });
      });

  }

  cargarTodosPedidos(): void {

    this.store.select('login').pipe(first())
      .subscribe(worker => {
        this.pedidoService.obtenerPedidos(worker.token)
          .subscribe((pedidos: Pedido) => {
            // console.log(pedidos);
            this.pedidos = pedidos;
          });
      });
  }

  limpiarForma(): void {

    // this.forma.reset();
    this.forma.controls.selBandeja.setValue('null');
    this.forma.controls.sucursal.setValue('null');
    this.forma.controls.usuarios.setValue('null');
    this.usuarios = [];

  }

  formularioFake(): void {
    this.forma = this.fb.group({
      selBandeja: ['null'],
      sucursal: ['null'],
      usuarios: ['null']
    });
  }

  recibirPedidos(pedidos: Array<PedidoDB>): void {
    this.pedidos.pedidosDB = pedidos;
  }
}
