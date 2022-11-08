import { IidbTaskField } from "@indexeddb/interfaces";

export type IlayoutOrderKeys = 'listWideScreenOrder'|'listNarrowScreenOrder'|'detailsSidebarOrder'
export type IlayoutKeys = IlayoutOrderKeys | 'detailsSidebarExpand'

export interface Iaction {
    payload:IidbTaskField[];
}

export interface IlayoutOrder {
    list:IidbTaskField[]
}

const 
    initialState:IlayoutOrder = {
        list:[]
    },
    reducer = (state:IlayoutOrder,{payload}:Iaction) => ({...state,list:[...payload]})

export { initialState, reducer }