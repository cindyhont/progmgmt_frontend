import { taskEditMultipleFields, taskFieldSelector } from "@components/tasks/reducers/slice"
import { IidbTaskField } from "@indexeddb/interfaces"
import { ReduxState, useAppDispatch } from "@reducers"
import { useEffect, useRef } from "react"
import { useStore } from "react-redux"

const useBroadcastChannelMessenger = () => {
    const
        store = useStore(),
        dispatch = useAppDispatch(),
        bc = useRef<BroadcastChannel>(),
        handleBCmessage = (e:MessageEvent) => {
            const 
                list = e.data as IidbTaskField[],
                state = store.getState() as ReduxState,
                allFields = taskFieldSelector.selectAll(state).filter(e=>e.fieldType!=='order_in_board_column'),
                allSameAsStore = list.every(e=>{
                    const idx = allFields.findIndex(f=>f.id===e.id)
                    if (idx === -1) return false
                    const 
                        field = allFields[idx],
                        entries = Object.entries(e),
                        len = entries.length
                    for (let i=0; i<len; i++){
                        const p = entries[i]
                        if (p[1] !== field[p[0]]) return false
                    }
                    return true
                })
            if (!allSameAsStore) dispatch(taskEditMultipleFields(list.map(e=>({
                id:e.id,
                changes:{
                    ...Object.entries(e)
                        .filter(f=>f[0] !== 'id')
                        .map(f=>({[f[0]]:f[1]}))
                        .reduce((a,b)=>({...a,...b}))
                }
            }))))
        },
        dispatchBcMessage = (message:any) => bc.current.postMessage(message)

    useEffect(()=>{
        bc.current = new BroadcastChannel('taskLayouts')
        bc.current.addEventListener('message',handleBCmessage)
        
        return () => {
            bc.current.removeEventListener('message',handleBCmessage)
            bc.current.close()
        }
    },[])

    return dispatchBcMessage
}

export default useBroadcastChannelMessenger