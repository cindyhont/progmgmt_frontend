import { EntityId } from "@reduxjs/toolkit";
import { ReduxState } from "@reducers";
import { useStore } from "react-redux";
import { IboardView } from "../reducer";
import { taskFieldSelector, taskSelector } from "@components/tasks/reducers/slice";
import { Ioption } from "..";

const useComparePrevCurrentLayout = (
    boardViewState:IboardView,
    boardColumnFieldID:EntityId,
    boardColumnOrderFieldID:EntityId
) => {
    const 
        store = useStore(),
        currentSameAsPrev = () => {
            const 
                state = store.getState() as ReduxState,
                uid = state.misc.uid,
                columns = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.options as Ioption[]
            if (columns.length !== boardViewState.columnIDs.length) return false
            const sameColumnOrder = columns.every((e,i)=>boardViewState.columnIDs.indexOf(e.id)==i)
            if (!sameColumnOrder) return false

            const 
                len = columns.length,
                tasks = taskSelector.selectAll(state)
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

    return currentSameAsPrev
}

export default useComparePrevCurrentLayout