import { useTaskEditCustomFieldMutation } from "@components/tasks/reducers/api"
import { taskFieldSelector } from "@components/tasks/reducers/slice"
import { ReduxState } from "@reducers"
import { EntityId } from "@reduxjs/toolkit"
import { useStore } from "react-redux"
import { Ioption } from ".."

const useUpdateReduxColumnIDs = (
    columnIDs:EntityId[],
    boardColumnFieldID:EntityId,
) => {
    const 
        [editCustomField] = useTaskEditCustomFieldMutation(),
        store = useStore(),
        updateReduxColumnIDs = () => {
            const 
                s = store.getState() as ReduxState,
                fieldType = 'board_column',
                boardColumnFieldObj = taskFieldSelector.selectAll(s).find(e=>e.fieldType===fieldType),
                details = boardColumnFieldObj.details,
                options = details.options as Ioption[],
                len = options.length,
                originalIDs = !len ? [] : len===1 ? [options[0].id] : Array.from(options).sort((a,b)=>a.order - b.order).map(({id})=>id)

            if (columnIDs.length === len && columnIDs.every((e,i)=>originalIDs.indexOf(e)===i)) return

            const newOptions:Ioption[] = columnIDs.map((columnID,i)=>({
                id:columnID,
                name:options.find(opt=>opt.id===columnID).name,
                order:i
            }))

            editCustomField({
                id:boardColumnFieldID,
                f:{
                    name:boardColumnFieldObj.fieldName,
                    fieldType,
                    defaultValues:{[fieldType]:details.default},
                    options:{[fieldType]:newOptions}
                }
            })
        }
    return updateReduxColumnIDs
}

export default useUpdateReduxColumnIDs