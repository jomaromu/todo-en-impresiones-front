import { Component, ElementRef, Input, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';
import { AyudaDB } from 'src/app/interfaces/ayuda';
import { Pedido } from 'src/app/interfaces/pedido';
import { AppState } from 'src/app/reducers/globarReducers';
import * as loginActions from '../../reducers/login/login.actions';
import { PedidoService } from '../../services/pedido.service';
import { PedidoDB } from '../../interfaces/pedido';

@Component({
  selector: 'app-busqueda',
  templateUrl: './busqueda.component.html',
  styleUrls: ['./busqueda.component.scss']
})
export class BusquedaComponent implements OnInit {

  @ViewChild('fondo', { static: true }) fondo: ElementRef<HTMLElement>;
  @ViewChild('ayuda', { static: true }) ayuda: ElementRef<HTMLElement>;
  @Input() pedidos: Pedido;
  @Output() emitirPedidos = new EventEmitter<Array<PedidoDB>>();

  ayudas: Array<AyudaDB>;


  constructor(
    private store: Store<AppState>,
    private pedidoService: PedidoService
  ) { }

  ngOnInit(): void {

    this.cargarAyudas();
  }

  mostrarAyudas(): void {

    const fondo = this.fondo.nativeElement;
    const ayuda = this.ayuda.nativeElement;

    fondo.style.display = 'flex';

    ayuda.classList.remove('animate__flipOutX');
    ayuda.classList.add('animate__flipInX');
  }

  cerrarFondo(): void {

    const fondo = this.fondo.nativeElement;
    const ayuda = this.ayuda.nativeElement;

    ayuda.classList.remove('animate__flipInX');
    ayuda.classList.add('animate__flipOutX');

    setTimeout(() => {
      fondo.style.display = 'none';
    }, 800);


  }

  cargarAyudas(): void {

    const token = localStorage.getItem('token');
    this.store.select('login').pipe(first())
      .subscribe(worker => {
        this.store.dispatch(loginActions.obtenerToken({ token: worker.token }));
      });

    this.store.select('ayuda').subscribe((ayudas: Array<AyudaDB>) => {

      if (!ayudas) {
        return;
      } else {

        const filtroAyudas = ayudas.filter(ayuda => ayuda.estado !== false);

        this.ayudas = filtroAyudas;

      }


    });
  }

  buscarPedidos(e: Event): void {

    const criterio = (e.target as HTMLInputElement).value;

    // if (criterio === '' || !criterio) {
    //   return;
    // }

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        this.pedidoService.obtenerPedidos(worker.token)
          .subscribe((pedido: Pedido) => {

            const pedidos = pedido.pedidosDB.filter(pedidoDB => {
              // tslint:disable-next-line: max-line-length
              return pedidoDB.idReferencia === criterio || pedidoDB.Cliente[0].nombre === criterio || pedidoDB.Cliente[0].telefono === criterio;
            });

            if (pedidos.length === 0 || criterio === '') {
              this.emitirPedidos.emit(pedido.pedidosDB);
            } else {
              this.emitirPedidos.emit(pedidos);
            }

          });
      });



  }

}
