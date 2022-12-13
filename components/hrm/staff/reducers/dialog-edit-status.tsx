const names = {
    filter:'filter' as 'filter',
    addDialog:'addDialog' as 'addDialog',
    deleteDialog:'deleteDialog' as 'deleteDialog',
    editMode:'editMode' as 'editMode',
    showHideColumnModalOn:'showHideColumnModalOn' as 'showHideColumnModalOn',
}

export interface IdialogStatus {
    filter:boolean;
    addDialog:boolean;
    deleteDialog:boolean;
    editMode:boolean;
    showHideColumnModalOn:boolean;
}

export interface ItoggleFilterAction {
    type: typeof names.filter | typeof names.addDialog | typeof names.deleteDialog | typeof names.editMode | typeof names.showHideColumnModalOn;
    payload:boolean;
}

const 
    initialState:IdialogStatus = {
        filter:false,
        addDialog:false,
        deleteDialog:false,
        editMode:false,
        showHideColumnModalOn:false,
    },
    reducer = (state:IdialogStatus,{type,payload}:ItoggleFilterAction) => ({
        ...state,
        [type]:payload
    })

export {
    initialState,
    reducer,
}