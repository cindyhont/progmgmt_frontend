import { EntityId } from "@reduxjs/toolkit";

const ActionTypes = {
    columnStartMoving:'columnStartMoving' as 'columnStartMoving',
    taskStartMoving:'taskStartMoving' as 'taskStartMoving',
    moving:'moving' as 'moving',
    drop:'drop' as 'drop',
    init:'init' as 'init',
}

export interface IboardView {
    columnIDs:EntityId[];
    itemsEachColumn:{
        [k:EntityId]:EntityId[];
    };
    columnMoving:EntityId;
    taskMoving:EntityId;
    columnIdx:number;
    taskIdx:number;
}

export interface IcolumnStartMovingAction {
    type:typeof ActionTypes.columnStartMoving;
    payload:EntityId;
}

export interface ItaskStartMovingAction {
    type:typeof ActionTypes.taskStartMoving;
    payload:EntityId;
}

export interface ImovingAction {
    type:typeof ActionTypes.moving;
    payload:{
        columnIdx:number;
        taskIdx:number;
    };
}

export interface IdropAction {
    type:typeof ActionTypes.drop;
    payload:undefined;
}

export interface IinitAction {
    type:typeof ActionTypes.init;
    payload:IboardView;
}

export type Iaction = IcolumnStartMovingAction
    | ItaskStartMovingAction
    | ImovingAction
    | IdropAction
    | IinitAction

const 
    initialState:IboardView = {
        columnIDs:[],
        itemsEachColumn:{},
        columnMoving:'',
        taskMoving:'',
        columnIdx:-1,
        taskIdx:-1,
    },
    reducer = (state:IboardView,{type,payload}:Iaction) => {
        switch (type) {
            case ActionTypes.columnStartMoving:
                return {...state,columnMoving:payload,taskMoving:'',columnIdx:-1,taskIdx:-1}
            case ActionTypes.taskStartMoving:
                return {...state,taskMoving:payload,columnMoving:'',columnIdx:-1,taskIdx:-1}
            case ActionTypes.init:
                return {...state,...payload}
            case ActionTypes.drop:
                return {...state,columnMoving:'',taskMoving:'',columnIdx:-1,taskIdx:-1}
            case ActionTypes.moving:
                if (!!state.columnMoving){
                    let newColumns = state.columnIDs.filter(e=>e!==state.columnMoving)

                    const {columnIdx} = payload
                    if (columnIdx===0) newColumns = [state.columnMoving,...newColumns]
                    else if (columnIdx===state.columnIDs.length - 1) newColumns = [...newColumns,state.columnMoving]
                    else newColumns = [...newColumns.slice(0,columnIdx),state.columnMoving,...newColumns.slice(columnIdx)]

                    return {...state,columnIDs:[...newColumns],taskIdx:-1}
                } else if (!!state.taskMoving){
                    const 
                        newTaskObj = state.columnIDs
                            .map((e,i)=>{
                                const originalTaskIDs = Array.from(state.itemsEachColumn[e])
                                if (i!==payload.columnIdx) return {[e]:originalTaskIDs.filter(e=>e!==state.taskMoving)}
                                else {
                                    let newTaskIDs = originalTaskIDs.filter(f=>f!==state.taskMoving)
                                    const {taskIdx} = payload
                                    if (taskIdx===0) newTaskIDs = [state.taskMoving,...newTaskIDs]
                                    else if (taskIdx===originalTaskIDs.length-1 && originalTaskIDs.length!==newTaskIDs.length || taskIdx===originalTaskIDs.length && originalTaskIDs.length===newTaskIDs.length) newTaskIDs = [...newTaskIDs,state.taskMoving]
                                    else newTaskIDs = [...newTaskIDs.slice(0,taskIdx),state.taskMoving,...newTaskIDs.slice(taskIdx)]
                                    return {[e]:newTaskIDs}
                                }
                            }),
                        finalTaskObj = newTaskObj.length === 1 ? newTaskObj[0] : newTaskObj.reduce((a,b)=>({...a,...b}))

                    return {
                        ...state,
                        itemsEachColumn:finalTaskObj,
                        columnIdx:payload.columnIdx,
                        taskIdx:payload.taskIdx
                    }
                }
        }
    },
    columnStartMoving = (payload:EntityId) => ({
        type:ActionTypes.columnStartMoving,
        payload
    }),
    taskStartMoving = (payload:EntityId) => ({
        type:ActionTypes.taskStartMoving,
        payload
    }),
    moving = (payload:{columnIdx:number;taskIdx:number}) => ({
        type:ActionTypes.moving,
        payload
    }),
    drop = {
        type:ActionTypes.drop,
        payload:undefined
    },
    init = (payload:IboardView) => ({
        type:ActionTypes.init,
        payload
    })

export {
    initialState,
    reducer,
    columnStartMoving,
    taskStartMoving,
    moving,
    drop,
    init,
}