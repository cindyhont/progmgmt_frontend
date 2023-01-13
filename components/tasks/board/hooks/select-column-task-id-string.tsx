import { useMemo } from "react";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { ReduxState, useAppSelector } from "@reducers";
import { taskSelector } from "@components/tasks/reducers/slice";

const useSelectColumnTaskIDs = (
    boardColumnIDs:EntityId[],
    boardColumnFieldID:EntityId,
    boardColumnOrderFieldID:EntityId,
) => {
    const 
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
        columnTaskIDs = useAppSelector(state => columnTaskIdSelector(state))

    return columnTaskIDs
}

export default useSelectColumnTaskIDs