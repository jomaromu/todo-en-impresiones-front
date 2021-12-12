import { ActionReducerMap } from '@ngrx/store';
import { loginReducer } from './login/login.reducer';
import { loadingReducer } from './loading/loading.reducer';
import { ayudaReducer } from './ayuda/ayuda.reducer';

import { Usuario } from '../interfaces/resp-worker';
import { AyudaDB } from '../interfaces/ayuda';
import { modalReducer, ModalReducerInterface } from './modal/modal.reducer';
import { ObjTotales } from './totales-pedido/totales.actions';
import { totalesReducer } from './totales-pedido/totales.reducer';

export interface AppState {
    login: Usuario;
    loading: boolean;
    modal: ModalReducerInterface;
    ayuda: Array<AyudaDB>;
    totales: any;
    // pedidos: Pedido;
}

export const globalReducerApp: ActionReducerMap<AppState> = {
    login: loginReducer,
    loading: loadingReducer,
    modal: modalReducer,
    ayuda: ayudaReducer,
    totales: totalesReducer
    // pedidos: pedidoReducer
};
