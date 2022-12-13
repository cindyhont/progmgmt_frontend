const ActionTypes = {
    ADD: 'add' as 'add',
    DELETE: 'delete' as 'delete',
    UPDATE_LIST: 'update_list' as 'update_list',
    EDIT_NAME: 'edit_name' as 'edit_name',
    RESET: 'reset' as 'reset',
    TO_STEP: 'to_step' as 'to_step',
    POP_ERROR: 'pop_error' as 'pop_error',
    CLOSE_ERROR: 'close_error' as 'close_error',
}

export interface IchatNewGroupState {
    users:string[];
    step:number;
    popError:boolean;
    errorText:string;
}

export interface IaddAction {
    type:typeof ActionTypes.ADD;
    payload:string;
}

export interface IeditNameAction {
    type: typeof ActionTypes.EDIT_NAME;
    payload:string;
}

export interface IdeleteAction {
    type:typeof ActionTypes.DELETE;
    payload:string;
}

export interface IupdateListAction {
    type:typeof ActionTypes.UPDATE_LIST;
    payload:string[];
}

export interface IresetAction {
    type:typeof ActionTypes.RESET;
    payload:undefined;
}

export interface IstepAction {
    type:typeof ActionTypes.TO_STEP;
    payload:number;
}

export interface IpopErrorAction {
    type: typeof ActionTypes.POP_ERROR;
    payload:string;
}

export interface IcloseErrorAction {
    type: typeof ActionTypes.CLOSE_ERROR;
    payload:undefined;
}

export type Iactions = IaddAction 
    | IdeleteAction 
    | IeditNameAction 
    | IresetAction 
    | IstepAction 
    | IupdateListAction
    | IpopErrorAction
    | IcloseErrorAction

const 
    initialState:IchatNewGroupState = {
        users:[],
        step:0,
        popError:false,
        errorText:'',
    },
    reducer = (state:IchatNewGroupState,{type,payload}:Iactions) => {
        switch(type){
            case ActionTypes.ADD:
                return {
                    ...state,
                    users:[...state.users,payload]
                }
            case ActionTypes.DELETE:
                return {
                    ...state,
                    users:state.users.filter(id=>id !== payload)
                }
            case ActionTypes.EDIT_NAME:
                return {
                    ...state,
                    name:payload
                }
            case ActionTypes.UPDATE_LIST:
                return {
                    ...state,
                    users:[...payload]
                }
            case ActionTypes.TO_STEP:
                return {
                    ...state,
                    step:payload
                }
            case ActionTypes.RESET:
                return {...state,name:'',users:[],popError:false,errorText:''}
            case ActionTypes.POP_ERROR:
                return {
                    ...state,
                    popError:true,
                    errorText:payload
                }
            case ActionTypes.CLOSE_ERROR:
                return {
                    ...state,
                    popError:false,
                    errorText:''
                }
        }
    },
    addNewGroupUser = (payload:string) => ({
        type:ActionTypes.ADD,
        payload
    }),
    deleteNewGroupUser = (payload:string) => ({
        type:ActionTypes.DELETE,
        payload
    }),
    editNewGroupName = (payload:string) => ({
        type:ActionTypes.EDIT_NAME,
        payload
    }),
    newGroupMoveToStep = (payload:number) => ({
        type:ActionTypes.TO_STEP,
        payload
    }),
    updateNewGroupList = (payload:string[]) => ({
        type:ActionTypes.UPDATE_LIST,
        payload
    }),
    resetNewGroup = {
        type:ActionTypes.RESET,
        payload:undefined
    },
    popError = (payload:string) => ({
        type:ActionTypes.POP_ERROR,
        payload
    }),
    closeError = {
        type:ActionTypes.CLOSE_ERROR,
        payload:undefined
    }

export {
    initialState,
    reducer,
    addNewGroupUser,
    deleteNewGroupUser,
    editNewGroupName,
    newGroupMoveToStep,
    updateNewGroupList,
    resetNewGroup,
    popError,
    closeError,
}