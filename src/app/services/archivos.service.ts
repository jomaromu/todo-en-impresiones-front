import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ArchivosService {

  constructor(
    private http: HttpClient
  ) { }

  subirArchivo(data: FormData, token: string, pedido: string): Observable<any> {

    const url = `${environment.url}/archivo/nuevoArchivo`;
    const header = new HttpHeaders({ token, pedido });

    return this.http.post(url, data, { headers: header })
      .pipe(map(resp => resp));
  }
}
