import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';

// Modulos externo
import { PagesModule } from './pages/pages.module';

// NGRX
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { globalReducerApp } from './reducers/globarReducers';

// Componentes
import { LoginComponent } from './pages/login/login.component';
import { EffectsModule } from '@ngrx/effects';
import { effectsArray } from './services/index';

// socket
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

const config: SocketIoConfig = { url: environment.url, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    PagesModule,
    HttpClientModule,
    EffectsModule.forRoot(effectsArray),
    StoreModule.forRoot(globalReducerApp, {}),
    StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production }),
    SocketIoModule.forRoot(config)
  ],
  providers: [],
  bootstrap: [AppComponent],
  exports: []
})
export class AppModule { }
