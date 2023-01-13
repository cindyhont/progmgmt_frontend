import { useMemo } from "react";
import { createSelector } from "@reduxjs/toolkit";
import { ReduxState, useAppSelector } from "@reducers";
import { taskFieldSelector } from "@components/tasks/reducers/slice";
import { Ioption } from "..";

const useSelectBoardColumnIDs = () => {
    const
        boardColumnIDsSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.options as Ioption[],
            (options:Ioption[])=>{
                const len = options.length
                if (!len) return []
                else if (len===1) return [options[0].id]
                else return Array.from(options).sort((a,b)=>a.order - b.order).map(({id})=>id)
            }
        ),[]),
        boardColumnIDs = useAppSelector(state => boardColumnIDsSelector(state))

    return boardColumnIDs
}

export default useSelectBoardColumnIDs