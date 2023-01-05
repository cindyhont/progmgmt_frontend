import { Task, TaskField } from "@components/tasks/interfaces";
import { taskEditMultipleFields, taskFieldSelector, taskSelector } from "@components/tasks/reducers/slice";
import useFuncWithTimeout from "@hooks/counter/function-with-timeout";
import useNarrowBody from "@hooks/theme/narrow-body";
import IndexedDB from "@indexeddb";
import { LayoutOrderDispatchContext } from "@pages";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { createSelector, EntityId, Update } from "@reduxjs/toolkit";
import { Dispatch, useContext, useEffect, useMemo, useRef } from "react";
import { useStore } from "react-redux";
import { Iaction, setAllAction } from "../column-reducer";

const 
    createColumnListSelector = (wideScreen:boolean)=>createSelector(
        (state:ReduxState)=>state,
        (state:ReduxState)=>{
            const 
                key = wideScreen ? 'listWideScreenOrder' : 'listNarrowScreenOrder',
                fields = taskFieldSelector.selectAll(state).filter(e=>e[key]!==-1)
            return fields.length === 0 ? [] : fields.length === 1 ? [fields[0].id] : Array.from(fields).sort((a,b)=>a[key]-b[key]).map(({id})=>id)
        }
    ),
    useUpdateListColumnState = (stateFields:EntityId[],dispatch:Dispatch<Iaction>) => {
        const
            reduxDispatch = useAppDispatch(),
            narrowBody = useNarrowBody(),
            idb = useRef<IndexedDB>(),
            store = useStore(),
            {layoutOrderDispatch} = useContext(LayoutOrderDispatchContext),
            idsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectAll(state),
                (state:ReduxState)=>state.misc.uid,
                (tasks:Task[],uid:EntityId)=>{
                    const filteredTasks = tasks.filter(t=>{
                        const 
                            {isGroupTask} = t,
                            allRights = [t.owner],
                            arr = isGroupTask ? [...t.supervisors,...allRights,...t.participants,...t.viewers,t.assignee,t.owner] : allRights
                        return arr.includes(uid)
                    })
                    return filteredTasks.map(({id})=>id)
                }
            ),[]),
            ids = useAppSelector(state => idsSelector(state)),
            wideScreenColumnListSelector = useMemo(()=>createColumnListSelector(true),[]),
            narrowScreenColumnListSelector = useMemo(()=>createColumnListSelector(false),[]),
            listColumnsWideScreen = useAppSelector(state => wideScreenColumnListSelector(state)),
            listColumnsNarrowScreen = useAppSelector(state => narrowScreenColumnListSelector(state)),
            setFromRedux = (arr:EntityId[]) => {
                if (stateFields.length === arr.length && stateFields.every((e,i)=>arr.indexOf(e)===i)) return
                dispatch(setAllAction(arr))
            },
            updateReduxIDB = () => {
                const
                    state = store.getState() as ReduxState,
                    key = narrowBody ? 'listNarrowScreenOrder' : 'listWideScreenOrder',
                    fieldsInRedux = taskFieldSelector.selectAll(state).filter(e=>e.fieldType!=='order_in_board_column'),
                    fieldCount = fieldsInRedux.length

                let updates:Update<TaskField>[] = []

                for (let i=0; i<fieldCount; i++){
                    const 
                        field = fieldsInRedux[i],
                        {id} = field,
                        newPos = stateFields.indexOf(id)
                    if (newPos !== field[key]) updates = [...updates,{id,changes:{[key]:newPos}}]
                }
                if (!updates.length) return
                
                reduxDispatch(taskEditMultipleFields(updates))
                
                layoutOrderDispatch({payload:fieldsInRedux.map(
                    (
                        {
                            listWideScreenOrder,
                            listNarrowScreenOrder,
                            detailsSidebarOrder,
                            detailsSidebarExpand,
                            id
                        }
                    )=>({
                        listWideScreenOrder: narrowBody ? listWideScreenOrder : stateFields.indexOf(id),
                        listNarrowScreenOrder: narrowBody ? stateFields.indexOf(id) : listNarrowScreenOrder,
                        detailsSidebarOrder,
                        detailsSidebarExpand,
                        id
                    })
                )})
                
                idb.current.updateMultipleEntries(idb.current.storeNames.taskFields,updates)
            },
            [tempStateOnChange] = useFuncWithTimeout(updateReduxIDB,500)

        useEffect(()=>{
            idb.current = new IndexedDB((store.getState() as ReduxState).misc.uid.toString(),1)
        },[])

        useEffect(()=>{
            setFromRedux([...(narrowBody ? listColumnsNarrowScreen : listColumnsWideScreen)])
        },[narrowBody])

        useEffect(()=>{
            if (!narrowBody) setFromRedux(listColumnsWideScreen)
        },[listColumnsWideScreen])

        useEffect(()=>{
            if (narrowBody) setFromRedux(listColumnsNarrowScreen)
        },[listColumnsNarrowScreen])

        useEffect(()=>{
            if (stateFields.length) tempStateOnChange()
        },[stateFields])
    }

export default useUpdateListColumnState
