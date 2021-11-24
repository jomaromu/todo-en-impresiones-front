import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/reducers/globarReducers';
import * as modalActions from '../../reducers/modal/modal.actions';
import { ModalReducerInterface } from '../../reducers/modal/modal.reducer';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ArchivosService } from '../../services/archivos.service';
import { first } from 'rxjs/operators';

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
    estado: null,
  };

  archivo: File;

  tipoArchivos = [
    { nombre: 'Normal', tipo: 0, default: 'checked' },
    { nombre: 'Corregir', tipo: 1, default: '' },
    { nombre: 'Aprobado', tipo: 2, default: '' }
  ];

  forma: FormGroup;


  constructor(
    private ngBModal: NgbModal,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private cdref: ChangeDetectorRef,
    private archivoService: ArchivosService
  ) { }

  ngOnInit(): void {

    this.cargarDataModal();
    this.cargarFormulario();
  }

  cargarModal(): void {

    const opts: NgbModalOptions = {
      backdrop: 'static',
      animation: true
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

        switch (resp.tipo) {
          case 'subir-archivos':
            this.data = resp;
            this.forma.controls.tipo.setValue(0);
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

    this.forma.controls.archivo.setValue(null);
    this.forma.controls.nombre.setValue(null);
  }

  cargarFormulario(): void {

    this.forma = this.fb.group({
      archivo: [null, [Validators.required]],
      nombre: [null, [Validators.required]],
      tipo: [0, [Validators.required]]
    });
  }

  cargarArchivo(e: Event): void {

    const file = (e.target as HTMLInputElement).files;

    if (file && file.length !== 0) {
      this.archivo = file[0];
      this.forma.get('archivo').setValue(file[0]);
    }

  }

  subirArchivos(): void {

    // if (this.forma.status === 'INVALID') {
    //   this.forma.markAllAsTouched();
    // return;
    // }

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        const fd = new FormData();

        fd.append('archivo', this.forma.get('archivo').value);
        fd.append('nombre', this.forma.controls.nombre.value);
        fd.append('tipo', this.forma.controls.tipo.value);

        // this.objArchivo.nombre = this.forma.controls.nombre.value;
        // this.objArchivo.tipo = this.forma.controls.tipo.value;
        // this.objArchivo.token = worker.token;

        this.archivoService.subirArchivo(fd, worker.token, this.data.data)
          .subscribe(resp => console.log(resp));

      });

    // console.log(this.objArchivo);
  }
}
