import { EntityId } from "@reduxjs/toolkit";

export interface IidbStore {
    storeName:string;
    keyPath:string;
    indice:{name:string;unique:boolean}[];
}

export interface IidbTaskField {
    id:EntityId;
    listWideScreenOrder:number;
    listNarrowScreenOrder:number;
    detailsSidebarOrder:number;
    detailsSidebarExpand:boolean;
}