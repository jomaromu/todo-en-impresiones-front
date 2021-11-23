import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, AfterContentChecked, Input, AfterViewInit } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';
import { AppState } from 'src/app/reducers/globarReducers';
import * as modalActions from '../../reducers/modal/modal.actions';
import { ModalReducerInterface } from '../../reducers/modal/modal.reducer';

@Component({
  selector: 'app-modal-data',
  templateUrl: './modal-data.component.html',
  styleUrls: ['./modal-data.component.scss']
})
export class ModalDataComponent implements OnInit {

  @ViewChild('modal', { static: true }) modal: any;

  mod: NgbModalOptions;
  data: ModalReducerInterface = {
    data: null,
    tipo: '',
    estado: null
  };

  constructor(
    private ngBModal: NgbModal,
    private store: Store<AppState>
  ) { }

  ngOnInit(): void {

    // this.cargarModal();
    this.cargarDataModal();
  }

  cargarModal(): void {

    const opts: NgbModalOptions = {
      backdrop: 'static'
    };

    this.store.select('modal')
      .subscribe(data => {

        const modal = this.modal;

        if (data.estado) {
          this.ngBModal.open(modal, opts);
        } else {
          this.ngBModal.dismissAll();
        }
      });
  }

  cargarDataModal(): void {

    this.store.select('modal')
      .subscribe(resp => {

        console.log(resp);

        switch (resp.tipo) {
          case 'subir-archivos':
            this.data = resp;
            break;
          case 'ver-productos':
            this.data = resp;
            break;
          case 'ver-diseniadores':
            this.data = resp;
            break;
          // default: this.data.tipo = '';
        }
      });

    this.cargarModal();
  }

  cerrarModal(): void {

    this.store.dispatch(modalActions.quitarModal());
  }

}
