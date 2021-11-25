import { ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/reducers/globarReducers';
import * as modalActions from '../../reducers/modal/modal.actions';
import { ModalReducerInterface } from '../../reducers/modal/modal.reducer';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ArchivosService } from '../../services/archivos.service';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-modal-data',
  templateUrl: './modal-data.component.html',
  styleUrls: ['./modal-data.component.scss']
})
export class ModalDataComponent implements OnInit {

  @ViewChild('modal', { static: true }) modal: ElementRef<HTMLElement>;

  data: ModalReducerInterface = {
    data: null,
    tipo: '',
    estado: null,
  };

  archivo: File;
  porcentaje: any;

  tipoArchivos = [
    { nombre: 'Normal', tipo: 0, default: 'checked' },
    { nombre: 'Corregir', tipo: 1, default: '' },
    { nombre: 'Aprobado', tipo: 2, default: '' }
  ];

  forma: FormGroup;


  constructor(
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

    this.store.select('modal')
      .subscribe(data => {

        if (data.estado) {
          this.entradaSalidaModal(data.estado);
        } else {
          this.entradaSalidaModal(data.estado);
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
    this.forma.controls.archivo.markAsUntouched();
    this.forma.controls.nombre.setValue(null);
  }

  cargarFormulario(): void {

    this.forma = this.fb.group({
      archivo: [null, [Validators.required]],
      nombre: [null,],
      tipo: [0, [Validators.required]]
    });
  }

  // archivos

  get checkArchivo(): boolean {

    if (this.forma.controls.archivo.touched && this.forma.controls.archivo.status === 'INVALID') {
      return true;
    }

  }

  cargarArchivo(e: Event): void {

    const file = (e.target as HTMLInputElement).files[0];

    if (file) {
      // this.archivo = file[0];
      // this.forma.controls.archivo.setValue(file[0]);

      const arrayMime = file.type.split('/');
      const mime = arrayMime[arrayMime.length - 1];

      // tslint:disable-next-line: max-line-length
      if (mime !== 'png' && mime !== 'jpeg' && mime !== 'svg' && mime !== 'tif' && mime !== 'tiff' && mime !== 'jpg' && mime !== 'ppt' && mime !== 'pdf') {

        Swal.fire(
          'Mensaje',
          'Archivo no permitido',
          'error'
        );

        this.forma.controls.archivo.setValue(null);
      } else {

        this.archivo = file;
      }
    }
  }

  subirArchivos(): void {

    if (this.forma.status === 'INVALID') {
      this.forma.markAllAsTouched();
      return;
    }

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        const fd = new FormData();

        fd.append('archivo', this.archivo);
        fd.append('nombre', this.forma.controls.nombre.value);
        fd.append('tipo', this.forma.controls.tipo.value);

        this.archivoService.subirArchivo(fd, worker.token, this.data.data)
          .subscribe(event => {

            const divProgres = document.getElementById('divProgres');
            const progress = document.getElementById('progress');
            const btnSubir = document.getElementById('btnSubir');

            if (event.type === HttpEventType.UploadProgress) {

              this.porcentaje = Math.round(event.loaded / event.total * 100);

              btnSubir.style.cursor = 'no-drop';
              btnSubir.innerText = 'Subiendo...';
              btnSubir.setAttribute('disabled', 'true');

              divProgres.style.display = 'flex';
              progress.style.width = `${this.porcentaje}%`;
            }

            if (event.body) {

              if (event.body.ok === true) {
                Swal.fire(
                  'Mensaje',
                  `${event.body.mensaje}`,
                  'info'
                );

              } else if (event.body.ok === false) {

                Swal.fire(
                  'Mensaje',
                  `${event.body.mensaje}`,
                  'error'
                );
              }

              btnSubir.style.cursor = 'pointer';
              btnSubir.innerText = 'Subir archivo';
              btnSubir.removeAttribute('disabled');

              divProgres.style.display = 'none';
              progress.style.width = `0%`;
              this.forma.controls.archivo.setValue(null);
              this.forma.controls.archivo.markAsUntouched();
              this.forma.controls.nombre.setValue(null);
              this.forma.controls.tipo.setValue(0);

              this.store.dispatch(modalActions.quitarModal());
            }
          });

      });
  }

  entradaSalidaModal(estado: boolean): void {

    const modal = this.modal.nativeElement;

    if (estado === true) {
      modal.style.display = 'flex';

      modal.classList.remove('animate__fadeOut');
      modal.classList.add('animate__fadeIn');

    } else {

      modal.classList.remove('animate__fadeIn');
      modal.classList.add('animate__fadeOut');

      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
  }
}
