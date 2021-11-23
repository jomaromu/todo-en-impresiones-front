import { ActionReducerMap } from '@ngrx/store';
import { loginReducer } from './login/login.reducer';
import { loadingReducer } from './loading/loading.reducer';
import { ayudaReducer } from './ayuda/ayuda.reducer';

import { Usuario } from '../interfaces/resp-worker';
import { AyudaDB } from '../interfaces/ayuda';
import { modalReducer, ModalReducerInterface } from './modal/modal.reducer';

export interface AppState {
    login: Usuario;
    loading: boolean;
    modal: ModalReducerInterface;
    ayuda: Array<AyudaDB>;
    // pedidos: Pedido;
}

export const globalReducerApp: ActionReducerMap<AppState> = {
    login: loginReducer,
    loading: loadingReducer,
    modal: modalReducer,
    ayuda: ayudaReducer,
    // pedidos: pedidoReducer
};
