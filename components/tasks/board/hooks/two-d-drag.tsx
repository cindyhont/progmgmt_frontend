import useFuncWithTimeout from "@hooks/counter/function-with-timeout";
import { EntityId } from "@reduxjs/toolkit";
import { MutableRefObject, useRef } from "react";

const useTwoDimensionalDrag = (
    onColumnDragStart:(_i:EntityId)=>void,
    onTaskDragStart:(_i:EntityId)=>void,
    onDragEnter:(_i:number,_j:number)=>void,
    tableID:string,
    columnIDs:EntityId[],
    itemsEachColumn:{
        [k:EntityId]:EntityId[];
    },
    clonedElem:MutableRefObject<HTMLElement>,
) => {
    const
        columnIdDragging = useRef(''),
        taskIdDragging = useRef<EntityId>(''),
        handleColumnDragStart = (
            columnID:EntityId,
        ) => {
            document.body.style.overscrollBehavior = 'none'
            document.body.style.webkitUserSelect = 'none'
            document.body.style.userSelect = 'none'

            columnIdDragging.current = columnID.toString()
            
            onColumnDragStart(columnID)
            clonedElem.current.style.zIndex = '999'
            clonedElem.current.style.position = 'fixed'
            clonedElem.current.style.opacity = '0.7'
        },
        handleTaskDragStart = (
            taskID:EntityId,
            measurement:{
                left:number;
                top:number;
                width?:number;
                height?:number;
            },
        ) => {
            document.body.style.overscrollBehavior = 'none'
            document.body.style.webkitUserSelect = 'none'
            document.body.style.userSelect = 'none'

            taskIdDragging.current = taskID
            
            onTaskDragStart(taskID)

            clonedElem.current.style.position = 'fixed'
            clonedElem.current.style.left = `${measurement.left}px`
            clonedElem.current.style.top = `${measurement.top}px`
            if ('width' in measurement) clonedElem.current.style.width = `${measurement.width}px`
            if ('height' in measurement) clonedElem.current.style.height = `${measurement.height}px`
            clonedElem.current.style.zIndex = '999'
            clonedElem.current.style.opacity = '0.7'
            clonedElem.current.style.cursor = 'grabbing'
        },
        [execDragEnter] = useFuncWithTimeout(onDragEnter,20),
        handleDragMove = (x:number,y:number) => {
            const 
                table = document.getElementById(tableID),
                {left:tableLeft,right:tableRight,top:tableTop,bottom:tableBottom} = table.getBoundingClientRect()

            if (x < tableLeft || x > tableRight) return

            const columnCount = columnIDs.length

            for (let i=0; i<columnCount; i++){
                const
                    columnID = columnIDs[i],
                    column = document.getElementById(columnID.toString()), 
                    {left:columnLeft,right:columnRight} = column.getBoundingClientRect()
                if (x >= columnLeft && x <= columnRight) {
                    if (!!columnIdDragging.current) {
                        execDragEnter(i,0)
                        return
                    } else if (!!taskIdDragging.current && y >= tableTop && y <= tableBottom){
                        const 
                            taskIDs = itemsEachColumn[columnID],
                            taskCount = taskIDs.length

                        if (!taskCount) {
                            execDragEnter(i,0)
                            return
                        }
    
                        for (let j=0; j<taskCount; j++){
                            const
                                taskID = taskIDs[j],
                                taskCell = document.getElementById(`task-board-task-${taskID}`), 
                                {top:taskTop,bottom:taskBottom} = taskCell.getBoundingClientRect()

                            if (j===taskCount - 1 && y > taskBottom) {
                                execDragEnter(i,taskIDs.includes(taskIdDragging.current) ? taskCount - 1 : taskCount)
                                return
                            } else if (y >= taskTop && y <= taskBottom){
                                execDragEnter(i,j)
                                return
                            }
                        }
                    }
                }
            }
        },
        handleDragEnd = () => {
            document.body.style.overscrollBehavior = null
            document.body.style.webkitUserSelect = null
            document.body.style.userSelect = null

            columnIdDragging.current = ''
            taskIdDragging.current = ''
        }

    return {
        handleColumnDragStart,
        handleTaskDragStart,
        handleDragMove,
        handleDragEnd,
    }
}

export default useTwoDimensionalDrag