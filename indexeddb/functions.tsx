import { TaskField } from "@components/tasks/interfaces"
import { IlayoutOrderKeys } from "@components/tasks/reducers/layout-order"
import { Update } from "@reduxjs/toolkit"
import { IidbTaskField } from "./interfaces"

const
    getSortedFieldIDs = (arr:TaskField[]|IidbTaskField[],key:IlayoutOrderKeys) => {
        const filteredArr = arr.filter(e=>e[key]!==-1)
        return filteredArr.length === 0 ? [] : filteredArr.length === 1 ? [filteredArr[0].id] : Array.from(filteredArr).sort((a,b)=>a[key]-b[key]).map(({id})=>id)
    },
    updateTaskFieldLayoutInRedux = (oldReduxArr:TaskField[],newIdbArr:IidbTaskField[]|TaskField[]) => {
        const
            overlaps = newIdbArr.filter(e=>oldReduxArr.findIndex(f=>f.id===e.id)!==-1),
            listWideScreenOrder = getSortedFieldIDs(overlaps,'listWideScreenOrder'),
            listNarrowScreenOrder = getSortedFieldIDs(overlaps,'listNarrowScreenOrder'),
            detailsSidebarOrder = getSortedFieldIDs(overlaps,'detailsSidebarOrder'),
            taskFieldCount = oldReduxArr.length

        let arr:Update<TaskField>[] = []
            
        for (let i=0; i<taskFieldCount; i++){
            const 
                taskField = oldReduxArr[i],
                {id} = taskField,
                itemInOverlaps = overlaps.find(f=>f.id===id)
            let changes = {}

            const idbListWideScreenOrder = listWideScreenOrder.indexOf(id)
            if (taskField.listWideScreenOrder !== idbListWideScreenOrder) changes = {...changes,listWideScreenOrder:idbListWideScreenOrder}

            const idbListNarrowScreenOrder = listNarrowScreenOrder.indexOf(id)
            if (taskField.listNarrowScreenOrder !== idbListNarrowScreenOrder) changes = {...changes,listNarrowScreenOrder:idbListNarrowScreenOrder}

            const idbDetailsSidebarOrder = detailsSidebarOrder.indexOf(id)
            if (taskField.detailsSidebarOrder !== idbDetailsSidebarOrder) changes = {...changes,detailsSidebarOrder:idbDetailsSidebarOrder}

            const idbDetailsSidebarExpand = !itemInOverlaps || itemInOverlaps.detailsSidebarExpand
            if (taskField.detailsSidebarExpand !== idbDetailsSidebarExpand) changes = {...changes,detailsSidebarExpand:idbDetailsSidebarExpand}

            if (!!Object.keys(changes).length) arr = [...arr,{id,changes}]
        }

        return arr
    }

export {
    getSortedFieldIDs,
    updateTaskFieldLayoutInRedux,
}