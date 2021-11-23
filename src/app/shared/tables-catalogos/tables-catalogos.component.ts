import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CatalogoShared } from '../../interfaces/catalogo-shared';

@Component({
  selector: 'app-tables-catalogos',
  templateUrl: './tables-catalogos.component.html',
  styleUrls: ['./tables-catalogos.component.scss']
})
export class TablesCatalogosComponent implements OnInit {

  @Input() catalogo: CatalogoShared;
  @Output() abrirAlertCat = new EventEmitter<any>();

  constructor(
  ) { }

  ngOnInit(): void {
  }

  alertCatalogo(tipo: string, idCat: string): void {

    const objCat = {
      tipo,
      idCat
    };

    this.abrirAlertCat.emit(objCat);
  }
}
