import React, { memo, useMemo } from "react";
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers'
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { taskSelector, updateCtxMenuIDs, taskEditSingleField } from "../../reducers/slice";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Link from '@mui/material/Link';
import TextDisplayWrapper from "./text-display-wrapper";
import SimpleTextDisplay from "./simple-text-display";
import EditModeToggle from "./edit-mode-toggle-button";
import { createEditRightSelector } from ".";
import { useRouter } from "next/router";

const LinkElem = memo(({fieldID}:{fieldID:EntityId})=>{
    const
        taskID = useRouter().query.taskid as string,
        editRightSelector = useMemo(()=>createEditRightSelector(fieldID,taskID),[fieldID,taskID]),
        hasEditRight = useAppSelector(state => editRightSelector(state)),
        valueSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskSelector.selectById(state,taskID)[fieldID],
            (e:any)=>e
        ),[taskID,fieldID]),
        value = useAppSelector(state => valueSelector(state)),
        dispatch = useAppDispatch(),
        editOnClick = () => {
            dispatch(updateCtxMenuIDs({
                field:fieldID,
                taskid:taskID
            }))
            dispatch(taskEditSingleField(true))
        }

    return (
        <TextDisplayWrapper editMode={false}>
            <TableRow>
                <TableCell>
                    {!!value?.url && <Link {...{
                        href:value.url,
                        target:'_blank',
                        rel:'noopener noreferrer',
                        ...(!value.text && {sx:{
                            textOverflow:'ellipsis',
                            overflow: 'hidden', 
                            whiteSpace: 'nowrap',
                        }})
                    }}>{value?.text || value?.url}</Link>}
                    {!value.url && <SimpleTextDisplay content='N/A' nilTextColor={true} />}
                </TableCell>
                {hasEditRight && <EditModeToggle onClick={editOnClick} />}
            </TableRow>
        </TextDisplayWrapper>
    )
})
LinkElem.displayName = 'LinkElem'
export default LinkElem