import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService implements HttpInterceptor {

  constructor(
    private http: HttpClient
  ) { }

  obtenerCategorias(token: string): Observable<any> {

    const url = `${environment.urlCategoria}/categoria/obtenerTodasCategorias`;
    const header = new HttpHeaders({ token });

    return this.http.get(url, { headers: header })
      .pipe(
        map((resp: any) => {
          return resp;
        })
      );
  }

  crearCategoria(data: any): Observable<any> {

    const url = `${environment.urlCategoria}/categoria/crearCategoria`;
    const header = new HttpHeaders({ token: data.token });

    return this.http.post(url, data, { headers: header })
      .pipe(
        map((resp: any) => {
          return resp;
        })
      );

  }

  obtenerCategoriaID(id: string, token: string): Observable<any> {

    const url = `${environment.urlCategoria}/categoria/obtenerCategoriaID`;
    const header = new HttpHeaders({ id, token });

    return this.http.get(url, { headers: header })
      .pipe(
        map(resp => resp)
      );


  }

  editarCategoriaID(id: string, token: string, data: any): Observable<any> {

    const url = `${environment.urlCategoria}/categoria/editarCategoriaID`;
    const header = new HttpHeaders({ id, estado: data.estado, token });

    return this.http.put(url, data, { headers: header })
      .pipe(
        map(resp => resp)
      );

  }

  eliminarCategoriaID(id: string, token: string): Observable<any> {

    const url = `${environment.urlCategoria}/categoria/eliminarCategoriaID`;
    const header = new HttpHeaders({ id, token });

    return this.http.delete(url, { headers: header })
      .pipe(
        map(resp => resp)
      );

  }


  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const reqClone = req.clone();

    return next.handle(reqClone).pipe(catchError(this.manejaError));
  }

  manejaError(error: HttpErrorResponse): Observable<any> {
    Swal.fire(
      'Mensaje',
      `Error en uno o varios servicios: ${error.message}`,
      // `${error}`,
      'error'
    );

    return throwError('Error en categoria');

  }

}
