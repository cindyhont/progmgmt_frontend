import React, { KeyboardEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReduxState, useAppSelector } from '@reducers'
import { createSelector, EntityId } from "@reduxjs/toolkit";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import { useStore } from "react-redux";
import TextField from '@mui/material/TextField'
import TextFieldSubmitButton from "./text-field-submit-button";
import EditModeToggle from "./edit-mode-toggle-button";
import SimpleTextDisplay from "./simple-text-display";
import TextDisplayWrapper from "./text-display-wrapper";
import { taskFieldSelector, taskSelector } from "@components/tasks/reducers/slice";
import { Task, TaskField } from "@components/tasks/interfaces";
import { useTaskUpdateOneFieldMutation } from "@components/tasks/reducers/api";
import { useRouter } from "next/router";

const 
    ShortText = memo(({fieldID}:{fieldID:EntityId})=>{
        const
            router = useRouter(),
            taskID = router.query.taskid as string,
            valueSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID)[fieldID] as string || '',
                (e:string)=>e
            ),[taskID,fieldID]),
            value = useAppSelector(state => valueSelector(state)),
            [editMode,setEditMode] = useState(false),
            editRightSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskFieldSelector.selectById(state,fieldID),
                (state:ReduxState)=>taskSelector.selectById(state,taskID),
                (state:ReduxState)=>state.misc.uid,
                (field:TaskField,t:Task,uid:EntityId)=>!!field && (
                    !!field.details
                    || !field.details && [...t.supervisors,t.owner].includes(uid)
                )
            ),[fieldID,taskID]),
            hasEditRight = useAppSelector(state => editRightSelector(state)),
            editOnClick = useCallback(()=>setEditMode(true),[]),
            editModeOff = useCallback(()=>setEditMode(false),[])

        return (
            <TextDisplayWrapper {...{editMode}}>
                <>
                {!editMode && <TableRow>
                    <SimpleTextDisplay {...{
                        nilTextColor:!value,
                        content:!!value ? value : 'N/A'
                    }} />
                    {hasEditRight && <EditModeToggle {...{onClick:editOnClick}} />}
                </TableRow>}
                {editMode && <Editor {...{fieldID,editModeOff}} />}
                </>
            </TextDisplayWrapper>
        )
    }),
    Editor = memo(({fieldID,editModeOff}:{fieldID:EntityId;editModeOff:()=>void;})=>{
        const
            store = useStore(),
            router = useRouter(),
            taskID = router.query.taskid as string,
            ref = useRef<HTMLInputElement>(),
            [updateField] = useTaskUpdateOneFieldMutation(),
            onSubmit = () => {
                updateField({
                    id:taskID,
                    field:fieldID,
                    value:ref.current.value
                })
                editModeOff()
            },
            onKeyPress = (e:KeyboardEvent) => {
                if (e.code === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
                    e.preventDefault()
                    onSubmit()
                }
            }

        useEffect(()=>{
            const state = store.getState() as ReduxState
            ref.current.value = taskSelector.selectById(state,taskID)[fieldID] || ''
            ref.current.focus()
        },[taskID,fieldID])

        return (
            <TableRow>
                <TableCell>
                    <TextField 
                        inputRef={ref}
                        fullWidth 
                        size='small' 
                        sx={{ml:1}} 
                        onKeyUp={onKeyPress}
                    />
                </TableCell>
                <TableCell>
                    <TextFieldSubmitButton {...{onSubmit}} />
                </TableCell>
            </TableRow>
        )
    })
ShortText.displayName = 'ShortText'
Editor.displayName = 'Editor'
export default ShortText