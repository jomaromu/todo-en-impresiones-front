import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  constructor(
    private http: HttpClient
  ) { }

  crearPedido(data: any): Observable<any> {

    const url = `${environment.url}/pedidos/crearPedido`;

    const header = new HttpHeaders({ token: data.token, cliente: data.cliente, sucursal: data.sucursal, vendedor: data.vendedor });

    return this.http.post(url, data, { headers: header })
      .pipe(
        map((resp: any) => {
          return resp;
        })
      );

  }

  editarPedido(data: any, token: string): Observable<any> {

    const url = `${environment.url}/pedidos/editarPedido`;
    const header = new HttpHeaders({ token, id: data.id });

    return this.http.put(url, data, { headers: header })
      .pipe(
        map((pedido: any) => pedido)
      );
  }

  obtenerPedidos(token: string): Observable<any> {

    const url = `${environment.url}/pedidos/obtenerTodos`;
    const header = new HttpHeaders({ token });

    return this.http.get(url, { headers: header })
      .pipe(
        map((resp: Array<any>) => {
          return resp;
        })
      );
  }

  obtenerPedido(data: any): Observable<any> {

    const url = `${environment.url}/pedidos/obtenerPedidoID`;
    const header = new HttpHeaders({ token: data.token, id: data.idPedido });

    return this.http.get(url, { headers: header })
      .pipe(
        map((resp: Array<any>) => {
          return resp;
        })
      );
  }

  busquedaBandejas(data: any): Observable<any> {

    const url = `${environment.url}/pedidos/busquedaBandeja`;

    // tslint:disable-next-line: max-line-length
    const header = new HttpHeaders({ token: data.token, colRole: data.colRole, sucursal: data.sucursal, userID: data.userID, bandejas: data.bandejas });

    return this.http.get(url, { headers: header })
      .pipe(
        map((resp: Array<any>) => {
          return resp;
        })
      );

  }

  obtenerPedidosCriterio(data: any): Observable<any> {

    const url = `${environment.url}/pedidos/obtenerPedidosCriterio`;

    const header = new HttpHeaders({ token: data.token, criterio: data.criterio });

    return this.http.get(url, { headers: header })
      .pipe(map(resp => resp));
  }

  obtenerPedidosPorRole(data: any): Observable<any> {

    const url = `${environment.url}/pedidos/obtenerPedidosPorRole`;
    // tslint:disable-next-line: max-line-length
    const header = new HttpHeaders({ token: data.token, role: data.role, idSUcursalWorker: data.idSUcursalWorker, idUsuario: data.idUsuario });

    return this.http.get(url, { headers: header })
      .pipe(map(resp => resp));
  }

}
