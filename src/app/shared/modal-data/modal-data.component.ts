import { ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/reducers/globarReducers';
import * as modalActions from '../../reducers/modal/modal.actions';
import { first } from 'rxjs/operators';
import { ArchivosService } from '../../services/archivos.service';
import { WebsocketsService } from '../../services/sockets/websockets.service';
import { MetodoPagoService } from '../../services/metodo-pago.service';
import { MetodoPago } from 'src/app/interfaces/metodo-pago';
import { ModalReducerInterface } from '../../reducers/modal/modal.reducer';
import Swal from 'sweetalert2';
import validator from 'validator';
import { PagosService } from '../../services/pagos.service';
import * as loadingAction from '../../reducers/loading/loading.actions';
import { Pagos } from '../../interfaces/pagos';
import { CurrencyPipe } from '@angular/common';


@Component({
  selector: 'app-modal-data',
  templateUrl: './modal-data.component.html',
  styleUrls: ['./modal-data.component.scss']
})
export class ModalDataComponent implements OnInit {

  @ViewChild('modal', { static: true }) modal: ElementRef<HTMLElement>;
  @ViewChild('monto', { static: false }) monto: ElementRef<HTMLInputElement>;

  data: ModalReducerInterface = {
    data: null,
    tipo: '',
    estado: null,
  };

  archivo: File;
  porcentaje: any;

  tipoArchivos = [
    { nombre: 'Referencia', tipo: 0, default: 'checked' },
    { nombre: 'Aprobado', tipo: 1, default: '' },
    { nombre: 'Impreso', tipo: 2, default: '' },
    { nombre: 'Pagos', tipo: 3, default: '' }
  ];

  modalidad = [
    { id: 0, nombre: 'Abono' },
    { id: 1, nombre: 'Cancelación' },
    // { id: 2, nombre: 'Delivery' },
  ];

  metodos: MetodoPago;
  temp = '';

  forma: FormGroup;


  constructor(
    private store: Store<AppState>,
    private fb: FormBuilder,
    private cdref: ChangeDetectorRef,
    private archivoService: ArchivosService,
    private wsService: WebsocketsService,
    private metodoPagoService: MetodoPagoService,
    private pagoService: PagosService,
    private wbServices: WebsocketsService,
    private currentPipe: CurrencyPipe
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
          case 'crear-pago':
            this.data = resp;
            this.cargarMetodos();
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
      nombre: [null],
      tipo: [0, [Validators.required]],
      metodo: [null],  // REVISAR VALIDACIONES CON ARCHIVO
      modalidad: [1], // REVISAR VALIDACIONES CON ARCHIVO
      monto: [0], // REVISAR VALIDACIONES CON ARCHIVO
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

      // const arrayMime = file.type.split('/');
      // const mime = arrayMime[arrayMime.length - 1];

      const mime = file.type;

      // console.log(file);

      // tslint:disable-next-line: max-line-length
      if (mime !== 'text/plain' && mime !== 'image/png' && mime !== 'image/svg+xml' && mime !== 'image/tiff' && mime !== 'image/jpeg' && mime !== 'application/vnd.ms-powerpoint' && mime !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation' && mime !== 'application/pdf' && mime !== 'application/msword' && mime !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && mime !== 'text/pain' && mime !== 'application/vnd.ms-excel' && mime !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {

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

                this.wsService.emitir('cargar-archivos');

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

  // Pagos
  crearPago(): void {

    this.store.dispatch(loadingAction.cargarLoading());

    this.store.select('login').pipe(first())
      .subscribe(worker => {

        const data = {
          pedido: this.data.data,
          metodo: this.forma.controls.metodo.value,
          modalidad: Number(this.forma.controls.modalidad.value),
          monto: Number(this.forma.controls.monto.value),
          token: worker.token
        };


        Swal.fire({
          title: 'Mensaje',
          text: '¿Desea agregar un pago?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Agregar pago',
          cancelButtonAriaLabel: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {

            this.pagoService.crearPago(data).pipe(first())
              .subscribe((pago: Pagos) => {

                if (pago.ok === false) {

                  this.store.dispatch(loadingAction.quitarLoading());

                  Swal.fire(
                    'Mensaje',
                    `Error al crear el pago`,
                    'error'
                  );

                } else {

                  this.store.dispatch(modalActions.quitarModal());
                  this.store.dispatch(loadingAction.quitarLoading());
                  this.forma.controls.monto.reset();

                  Swal.fire(
                    'Mensaje',
                    'Pago creado',
                    'success'
                  );

                  this.wsService.emitir('cargar-pagos');

                }

              });

          } else {

            this.store.dispatch(loadingAction.quitarLoading());

          }
        });
      });
  }

  cargarMetodos(): void {
    this.store.pipe(first()).subscribe(
      reduxTotales => {
        this.metodoPagoService.obtenerMetodos(reduxTotales.login.token).subscribe((metodos: MetodoPago) => {
          // console.log(metodos?.metodosDB[0]._id);
          this.metodos = metodos;
          this.forma.controls.metodo.setValue(metodos.metodosDB[0]._id);
          // console.log(reduxTotales.totales);
          this.forma.controls.monto.setValue(this.currentPipe.transform(reduxTotales.totales.total, '', '', '', '' ));
        });
      }
    );
  }

  validarMonto(e: Event): void {

    const monto = this.monto.nativeElement;
    const valor = (e.target as HTMLInputElement).value;

    const checkNum = validator.isFloat(valor, { min: 0.00 });

    if (valor === '') {
      this.temp = '';
    }

    if (checkNum) {

      monto.value = valor;
      this.temp = valor;

    } else {
      monto.value = this.temp;
    }
  }
}
