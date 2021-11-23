import { Component, Input, OnInit, AfterContentChecked, AfterViewInit, AfterViewChecked } from '@angular/core';
import { Pedido, PedidoDB } from '../../interfaces/pedido';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tabla-pedidos',
  templateUrl: './tabla-pedidos.component.html',
  styleUrls: ['./tabla-pedidos.component.scss']
})
export class TablaPedidosComponent implements OnInit, AfterViewChecked {

  @Input() pedidos: Pedido;

  prioridades: any;
  etapas: any;
  estados: any;

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.prioridadPedido();
    this.etapasPedido();
    this.estadosPedido();
  }

  ngAfterViewChecked(): void {
    // console.log(this.pedidos);
  }

  abrirPedido(pedido: PedidoDB): void {
    // console.log(pedido._id);
    this.router.navigate(['/dashboard/pedido'], { queryParams: { id: pedido._id } });
  }

  prioridadPedido(): void {
    this.http.get('../../../assets/prioridad.json').pipe().subscribe((prioridades: Array<any>) => {
      this.prioridades = prioridades;
    });
  }

  etapasPedido(): void {
    this.http.get('../../../assets/etapas.json').pipe().subscribe((etapas: Array<any>) => {
      this.etapas = etapas;
    });
  }

  estadosPedido(): void {
    this.http.get('../../../assets/estados.json').pipe().subscribe((estados: Array<any>) => {
      this.estados = estados;
    });
  }
}
