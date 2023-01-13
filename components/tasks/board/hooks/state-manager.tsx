import { Dispatch, useEffect } from "react";
import { EntityId } from "@reduxjs/toolkit";
import { useAppSelector } from "@reducers";
import useFuncWithTimeout from "hooks/counter/function-with-timeout";
import { Iaction, IboardView, init } from "../reducer";
import { taskFieldSelector } from "@components/tasks/reducers/slice";
import { useTaskMovedInBoardMutation } from "@components/tasks/reducers/api";
import useComparePrevCurrentLayout from "./compare-prev-curr-layout";
import useSelectColumnTaskIDs from "./select-column-task-id-string";
import useUpdateReduxColumnIDs from "./update-redux-column-ids";
import useSelectBoardColumnIDs from "./select-board-column-ids";

const useStateManager = (
    boardViewState:IboardView,
    boardViewDispatch:Dispatch<Iaction>,
    boardColumnFieldID:EntityId,
) => {
    const 
        boardColumnOrderFieldID = useAppSelector(state=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='order_in_board_column').id),
        boardColumnIDs = useSelectBoardColumnIDs(),
        columnTaskIDs = useSelectColumnTaskIDs(
            boardColumnIDs,
            boardColumnFieldID,
            boardColumnOrderFieldID,
        ),
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
        updateReduxColumnIDs = useUpdateReduxColumnIDs(boardViewState.columnIDs,boardColumnFieldID),
        [updateColumnChange] = useFuncWithTimeout(updateReduxColumnIDs,500),
        currentLayoutSameAsPrev = useComparePrevCurrentLayout(
            boardViewState,
            boardColumnFieldID,
            boardColumnOrderFieldID,
        ),
        checkSameOrderFromState = () => currentLayoutSameAsPrev()

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