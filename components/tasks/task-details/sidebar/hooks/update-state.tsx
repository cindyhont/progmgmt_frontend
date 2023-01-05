import { TaskField } from "@components/tasks/interfaces"
import { taskCustomFieldTypesSelector, taskEditMultipleFields, taskFieldSelector } from "@components/tasks/reducers/slice"
import IndexedDB from "@indexeddb"
import { getSortedFieldIDs } from "@indexeddb/functions"
import { LayoutOrderDispatchContext } from "@pages"
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers"
import { createSelector, EntityId, Update } from "@reduxjs/toolkit"
import useFuncWithTimeout from "hooks/counter/function-with-timeout"
import { Dispatch, useContext, useEffect, useMemo, useRef } from "react"
import { useStore } from "react-redux"
import { Iaction, setAllAction } from "./../reducer"

const useUpdateSidebarState = (stateFields:EntityId[],dispatch:Dispatch<Iaction>) => {
    const
        fieldsSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskFieldSelector.selectAll(state).filter(e=>{
                const type = taskCustomFieldTypesSelector.selectById(state,e.fieldType)
                return !!type && type?.taskDetailsSidebar
            }),
            (f:TaskField[])=>getSortedFieldIDs(f,'detailsSidebarOrder')
        ),[]),
        fields = useAppSelector(state => fieldsSelector(state)),
        idb = useRef<IndexedDB>(),
        store = useStore(),
        initState = () => {
            const
                state = store.getState() as ReduxState,
                fields = fieldsSelector(state)
            dispatch(setAllAction(fields))
        },
        reduxDispatch = useAppDispatch(),
        {layoutOrderDispatch} = useContext(LayoutOrderDispatchContext),
        updateReduxIDB = () => {
            const 
                state = store.getState() as ReduxState,
                fieldsInRedux = taskFieldSelector.selectAll(state).filter(e=>e.fieldType!=='order_in_board_column'),
                fieldCount = fieldsInRedux.length

            let updates:Update<TaskField>[] = []

            for (let i=0; i<fieldCount; i++){
                const 
                    field = fieldsInRedux[i],
                    {id} = field,
                    newPos = stateFields.indexOf(id)
                if (newPos !== field.detailsSidebarOrder) updates = [...updates,{id,changes:{detailsSidebarOrder:newPos}}]
            }
            if (!updates.length) return

            reduxDispatch(taskEditMultipleFields(updates))
            
            layoutOrderDispatch({
                payload:fieldsInRedux.map(e=>({
                    listWideScreenOrder:e.listWideScreenOrder,
                    listNarrowScreenOrder:e.listNarrowScreenOrder,
                    detailsSidebarExpand:e.detailsSidebarExpand,
                    detailsSidebarOrder:stateFields.indexOf(e.id),
                    id:e.id
                }))
            })

            idb.current.updateMultipleEntries(idb.current.storeNames.taskFields,updates)
        },
        [tempStateOnChange] = useFuncWithTimeout(updateReduxIDB,500)

    useEffect(()=>{
        initState()
        const state = store.getState() as ReduxState
        idb.current = new IndexedDB(state.misc.uid.toString(),1)
    },[])

    useEffect(()=>{
        tempStateOnChange()
    },[stateFields])

    useEffect(()=>{
        dispatch(setAllAction(fields))
    },[fields])
}

export default useUpdateSidebarState