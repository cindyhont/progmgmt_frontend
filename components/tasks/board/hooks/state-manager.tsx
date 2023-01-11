import { Dispatch, useMemo, useEffect } from "react";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { useStore } from "react-redux";
import useFuncWithTimeout from "hooks/counter/function-with-timeout";
import { Iaction, IboardView, init } from "../reducer";
import { taskFieldSelector, taskSelector } from "@components/tasks/reducers/slice";
import { Ioption } from "..";
import taskApi, { useTaskMovedInBoardMutation } from "@components/tasks/reducers/api";

const useStateManager = (
    boardViewState:IboardView,
    boardViewDispatch:Dispatch<Iaction>,
    boardColumnFieldID:EntityId
) => {
    const 
        boardColumnOrderFieldID = useAppSelector(state=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='order_in_board_column').id),
        boardColumnIDsSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.options as Ioption[],
            (options:Ioption[])=>{
                const len = options.length
                if (!len) return []
                else if (len===1) return [options[0].id]
                else return Array.from(options).sort((a,b)=>a.order - b.order).map(({id})=>id)
            }
        ),[]),
        boardColumnIDs = useAppSelector(state => boardColumnIDsSelector(state)),
        columnTaskIdSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state,
            (state:ReduxState)=>{
                if (!boardColumnIDs.length) return '{}'
                const 
                    tasks = taskSelector.selectAll(state),
                    uid = state.misc.uid,
                    objs = boardColumnIDs.map(e=>{
                        const 
                            tasksOfThisColumn = tasks.filter(t=>{
                                const {isGroupTask} = t
                                return t[boardColumnFieldID]===e && (isGroupTask ? [...t.supervisors,...t.participants,...t.viewers,t.owner,t.assignee].includes(uid) : t.owner===uid)
                            }),
                            len = tasksOfThisColumn.length,
                            value = !len ? [] : len===1 ? [tasksOfThisColumn[0].id] : tasksOfThisColumn.sort((a,b)=>a[boardColumnOrderFieldID] - b[boardColumnOrderFieldID]).map(({id})=>id)
                        return {[e]:value}
                    })
                return boardColumnIDs.length===1 ? JSON.stringify(objs[0]) : JSON.stringify(objs.reduce((a,b)=>({...a,...b})))
            }
        ),[boardColumnFieldID,boardColumnIDs,boardColumnOrderFieldID]),
        columnTaskIDs = useAppSelector(state => columnTaskIdSelector(state)),
        
        store = useStore(),
        dispatch = useAppDispatch(),
        [taskMovedInBoard] = useTaskMovedInBoardMutation(),
        dispatchTaskMovedInBoard = (taskID:EntityId,newColumnID:EntityId,newIdxInColumn:number) => {
            taskMovedInBoard({taskID,newColumnID,newIdxInColumn,active:true})
        },
        [updateTaskInBoard] = useFuncWithTimeout(dispatchTaskMovedInBoard,1000),
        taskJustMoved = () => updateTaskInBoard(
            boardViewState.taskMoving,
            boardViewState.columnIDs[boardViewState.columnIdx],
            boardViewState.taskIdx,
        ),
        dispatchColumnIDs = () => {
            const 
                s = store.getState() as ReduxState,
                fieldType = 'board_column',
                boardColumnFieldObj = taskFieldSelector.selectAll(s).find(e=>e.fieldType===fieldType),
                details = boardColumnFieldObj.details,
                options = details.options as Ioption[],
                len = options.length,
                originalIDs = !len ? [] : len===1 ? [options[0].id] : Array.from(options).sort((a,b)=>a.order - b.order).map(({id})=>id)

            if (boardViewState.columnIDs.length === len && boardViewState.columnIDs.every((e,i)=>originalIDs.indexOf(e)===i)) return

            const newOptions:Ioption[] = boardViewState.columnIDs.map((columnID,i)=>({
                id:columnID,
                name:options.find(opt=>opt.id===columnID).name,
                order:i
            }))

            dispatch(taskApi.endpoints.editCustomField.initiate({
                id:boardColumnFieldID,
                f:{
                    name:boardColumnFieldObj.fieldName,
                    fieldType,
                    defaultValues:{[fieldType]:details.default},
                    options:{[fieldType]:newOptions}
                }
            }))
        },
        [updateColumnChange] = useFuncWithTimeout(dispatchColumnIDs,500),
        checkSameOrderFromState = () => {
            const 
                s = store.getState() as ReduxState,
                uid = s.misc.uid,
                columns = taskFieldSelector.selectAll(s).find(e=>e.fieldType==='board_column').details.options as Ioption[]
            if (columns.length !== boardViewState.columnIDs.length) return false
            const sameColumnOrder = columns.every((e,i)=>boardViewState.columnIDs.indexOf(e.id)==i)
            if (!sameColumnOrder) return false

            const 
                len = columns.length,
                tasks = taskSelector.selectAll(s)
            for (let i=0; i<len; i++){
                const 
                    thisColumnID = columns[i].id,
                    tasksOfThisColumn = tasks.filter(t=>{
                        const {isGroupTask} = t
                        return t[boardColumnFieldID]===thisColumnID && (isGroupTask ? [...t.supervisors,...t.participants,...t.viewers,t.owner,t.assignee].includes(uid) : t.owner===uid)
                    }),
                    l = tasksOfThisColumn.length
                if (l !== boardViewState.itemsEachColumn[thisColumnID].length) return false
                const
                    sortedTaskIDs = !l ? [] : l===1 ? [tasksOfThisColumn[0].id] : Array.from(tasksOfThisColumn).sort((a,b)=>a[boardColumnOrderFieldID] - b[boardColumnOrderFieldID]).map(({id})=>id),
                    allTasksSameOrder = sortedTaskIDs.every((e,j)=>boardViewState.itemsEachColumn[thisColumnID].indexOf(e)===j)
                if (!allTasksSameOrder) return false
            }
            return true
        }

    useEffect(()=>{
        if (!!boardViewState.columnIDs.length) updateColumnChange()
    },[boardViewState.columnIDs])

    useEffect(()=>{
        const sameAsPrev = checkSameOrderFromState()
        if (!sameAsPrev){
            boardViewDispatch(init({
                columnIDs:boardColumnIDs,
                taskMoving:boardViewState.taskMoving,
                columnMoving:boardViewState.columnMoving,
                itemsEachColumn:JSON.parse(columnTaskIDs),
                columnIdx:boardViewState.columnIdx,
                taskIdx:boardViewState.taskIdx
            }))
        }
    },[
        columnTaskIDs,
        boardColumnIDs
    ])

    useEffect(()=>{
        if (!!boardViewState.taskMoving && boardViewState.columnIdx !== -1 && boardViewState.taskIdx !== -1) taskJustMoved()
    },[
        boardViewState.taskMoving,
        boardViewState.columnIdx,
        boardViewState.taskIdx
    ])
}

export default useStateManager