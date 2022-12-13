const names = {
    filter:'filter' as 'filter',
    addDialog:'addDialog' as 'addDialog',
    deleteDialog:'deleteDialog' as 'deleteDialog',
    'editMode':'editMode' as 'editMode',
}

export interface IdialogStatus {
    filter:boolean;
    addDialog:boolean;
    deleteDialog:boolean;
    editMode:boolean;
}

export interface ItoggleFilterAction {
    type: typeof names.filter | typeof names.addDialog | typeof names.deleteDialog | typeof names.editMode;
    payload:boolean;
}

const 
    initialState:IdialogStatus = {
        filter:false,
        addDialog:false,
        deleteDialog:false,
        editMode:false,
    },
    reducer = (state:IdialogStatus,{type,payload}:ItoggleFilterAction) => ({
        ...state,
        [type]:payload
    })

export {
    initialState,
    reducer,
}