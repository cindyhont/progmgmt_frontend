import { Task } from "@components/tasks/interfaces"
import { taskSelector } from "@components/tasks/reducers/slice"
import { ReduxState, useAppSelector } from "@reducers"
import { createSelector, EntityId } from "@reduxjs/toolkit"
import { useMemo } from "react"

const useSelectTaskIDs = () => {
    const
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
        ids = useAppSelector(state => idsSelector(state))

    return ids
}

export default useSelectTaskIDs