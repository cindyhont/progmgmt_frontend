import React, { KeyboardEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createEditRightSelector } from '.'
import { ReduxState, useAppSelector } from '@reducers'
import { createSelector, EntityId } from "@reduxjs/toolkit";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import { useStore } from "react-redux";
import TextField from '@mui/material/TextField'
import TextDisplayWrapper from "./text-display-wrapper";
import SimpleTextDisplay from "./simple-text-display";
import EditModeToggle from "./edit-mode-toggle-button";
import TextFieldSubmitButton from "./text-field-submit-button";
import { useTaskUpdateOneFieldMutation } from "@components/tasks/reducers/api";
import { taskSelector } from "@components/tasks/reducers/slice";
import { useRouter } from "next/router";

const 
    NumberElem = memo(({fieldID}:{fieldID:EntityId})=>{
        const 
            router = useRouter(),
            taskID = router.query.taskid as string,
            [editMode,setEditMode] = useState(false),
            valueSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>(taskSelector.selectById(state,taskID)[fieldID] as number).toString(),
                (e:string)=>e
            ),[taskID,fieldID]),
            value = useAppSelector(state => valueSelector(state)),
            editRightSelector = useMemo(()=>createEditRightSelector(fieldID,taskID),[fieldID,taskID]),
            hasEditRight = useAppSelector(state => editRightSelector(state)),
            editOnClick = useCallback(()=>setEditMode(true),[]),
            editModeOff = useCallback(()=>setEditMode(false),[])

        return (
            <TextDisplayWrapper {...{editMode}}>
                <>
                {!editMode && <TableRow>
                    <SimpleTextDisplay {...{content:value,nilTextColor:false}} />
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
            ref = useRef<HTMLInputElement>(),
            [updateField] = useTaskUpdateOneFieldMutation(),
            router = useRouter(),
            taskID = router.query.taskid as string,
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
            ref.current.value = (taskSelector.selectById(state,taskID)[fieldID] as number).toString() || ''
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
                        inputProps={{
                            inputMode: 'numeric', 
                            pattern: '[0-9]+([\.][0-9]+)?'
                        }}
                    />
                </TableCell>
                <TableCell>
                    <TextFieldSubmitButton {...{onSubmit}} />
                </TableCell>
            </TableRow>
        )
    })
NumberElem.displayName = 'NumberElem'
Editor.displayName = 'Editor'
export default NumberElem