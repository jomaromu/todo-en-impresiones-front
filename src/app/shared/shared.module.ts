import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BusquedaComponent } from './busqueda/busqueda.component';
import { TablesCatalogosComponent } from './tables-catalogos/tables-catalogos.component';
import { LoadingComponent } from './loading/loading.component';
import { TablaPedidosComponent } from './tabla-pedidos/tabla-pedidos.component';
import { ModalDataComponent } from './modal-data/modal-data.component';



@NgModule({
  declarations: [
    SidebarComponent,
    NotFoundComponent,
    BusquedaComponent,
    TablesCatalogosComponent,
    LoadingComponent,
    TablaPedidosComponent,
    ModalDataComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    SidebarComponent,
    BusquedaComponent,
    TablesCatalogosComponent,
    LoadingComponent,
    TablaPedidosComponent,
    ModalDataComponent
  ]
})
export class SharedModule { }
