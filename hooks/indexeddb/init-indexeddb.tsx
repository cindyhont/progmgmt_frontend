import { taskFieldSelector, taskEditMultipleFields } from "@components/tasks/reducers/slice"
import IndexedDB from "@indexeddb"
import { updateTaskFieldLayoutInRedux } from "@indexeddb/functions"
import { IidbTaskField } from "@indexeddb/interfaces"
import { ReduxState, useAppDispatch } from "@reducers"
import { indexeddbWorks } from "@reducers/misc"
import { useEffect, useRef, useState } from "react"
import { useStore } from "react-redux"

const useInitIDB = (startPageIsNotTask:boolean) => {
    const
        [show,setShow] = useState(startPageIsNotTask),
        idb = useRef<IndexedDB>(),
        store = useStore(),
        dispatch = useAppDispatch(),
        initIndexedDB = async() => {
            const 
                state = store.getState() as ReduxState,
                success = await idb.current.setupDB()
            if (!success) return
            dispatch(indexeddbWorks())

            const 
                idbTaskFieldList:IidbTaskField[] = await idb.current.getAll(idb.current.storeNames.taskFields),
                taskFields = taskFieldSelector.selectAll(state)

            if (!idbTaskFieldList.length) {
                setShow(true)
                idb.current.addMulitpleEntries(
                    idb.current.storeNames.taskFields,
                    taskFields.filter(e=>e.fieldType!=='order_in_board_column').map(({id,listWideScreenOrder,listNarrowScreenOrder,detailsSidebarOrder,detailsSidebarExpand})=>({
                        id,listWideScreenOrder,listNarrowScreenOrder,detailsSidebarOrder,detailsSidebarExpand
                    }))
                )
                return
            }
            const updates = updateTaskFieldLayoutInRedux(taskFields,idbTaskFieldList)
            if (!!updates.length) dispatch(taskEditMultipleFields(updates))
            setShow(true)
        }
    useEffect(()=>{
        const state = store.getState() as ReduxState
        idb.current = new IndexedDB(state.misc.uid.toString(),1)
        initIndexedDB()
    },[])

    return show
}

export default useInitIDB