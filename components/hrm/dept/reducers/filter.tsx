import { NIL as uuidNIL } from 'uuid'

export enum DeptFilterTypes {
    ADD = 'add',
    DELETE = 'delete'
}

export interface IhrmDeptFilterRdcr {
    ids:string[]
}

const
    initialState:IhrmDeptFilterRdcr = {ids:[uuidNIL]},
    filterReducer = (state:IhrmDeptFilterRdcr,{type,payload}:{type:string;payload:string}) => {
        switch (type) {
            case DeptFilterTypes.ADD:
                return {
                    ...state,
                    ids:[...state.ids,payload]
                }
            case DeptFilterTypes.DELETE:
                return {
                    ...state,
                    ids:state.ids.filter(id=>id !== payload)
                }
        }
    },
    addFilterAction = (payload:string) => ({
        type:DeptFilterTypes.ADD,
        payload
    }),
    deleteFilterAction = (payload:string) => ({
        type:DeptFilterTypes.DELETE,
        payload
    })

export {
    initialState,
    filterReducer,
    addFilterAction,
    deleteFilterAction
}