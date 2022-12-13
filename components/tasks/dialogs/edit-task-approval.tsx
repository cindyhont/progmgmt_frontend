import { interpolateColorString } from "@components/functions";
import { useTheme } from "@mui/material";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "react-redux";
import { TaskApproval } from "../interfaces";
import { taskApprovalItemSelector, taskEditSingleField } from "../reducers/slice";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTaskUpdateOneFieldMutation } from "../reducers/api";

const EditTaskApproval = memo(()=>{
    const
        theme = useTheme(),
        anchor = useRef<HTMLElement>(),
        menuReadySelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state.taskMgmt.ctxMenuFieldID,
            (state:ReduxState)=>state.taskMgmt.ctxMenuTaskID,
            (state:ReduxState)=>state.taskMgmt.editField,
            (field:EntityId,taskID:EntityId,editField:boolean) => !!field && !!taskID && editField && field==='approval'
        ),[]),
        menuReady = useAppSelector(state => menuReadySelector(state)),
        [menuOpen,setMenuOpen] = useState(false),
        dispatch = useAppDispatch(),
        onClose = () => {
            setMenuOpen(false)
            dispatch(taskEditSingleField(false))
        },
        menuOptionsSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskApprovalItemSelector.selectAll(state),
            (entries:TaskApproval[])=>Array.from(entries)
                .sort((a,b)=>+a.id - (+b.id))
                .map(a=>({
                    label:a.name,
                    value:a.id,
                    color:interpolateColorString(
                        theme.palette.error[theme.palette.mode],
                        theme.palette.primary[theme.palette.mode],
                        +a.id
                    ),
                    colorHover:interpolateColorString(
                        theme.palette.error.main,
                        theme.palette.primary.main,
                        +a.id
                    ),
                }))
        ),[theme.palette.mode]),
        menuOptions = useAppSelector(state => menuOptionsSelector(state)),
        [updateOneField] = useTaskUpdateOneFieldMutation(),
        store = useStore(),
        menuOnSelect = (e:EntityId) => () => {
            const state = store.getState() as ReduxState
            onClose()
            updateOneField({
                id:state.taskMgmt.ctxMenuTaskID,
                field:'approval',
                value:e
            })
        }

    useEffect(()=>{
        if (menuReady){
            const 
                state = store.getState() as ReduxState,
                taskID = state.taskMgmt.ctxMenuTaskID
            anchor.current = document.getElementById(`approval-${taskID}`)
            setMenuOpen(true)
        }
    },[menuReady])

    return (
        <Menu 
            open={menuOpen} 
            onClose={onClose} 
            anchorEl={anchor.current}
            anchorOrigin={{horizontal:'left',vertical:'bottom'}}
            transformOrigin={{vertical:'top',horizontal:'left'}}
            sx={{'.MuiList-root':{p:0}}}
        >
            {menuOptions.map(({label,value,color,colorHover})=>(
                <MenuItem 
                    key={value} 
                    value={value} 
                    sx={{
                        backgroundColor:color,
                        color:theme.palette.getContrastText(color),
                        textTransform:'capitalize',
                        '&:hover':{
                            backgroundColor:colorHover
                        }
                    }}
                    onClick={menuOnSelect(value)}
                >{label}</MenuItem>
            ))}
        </Menu>
    )
})
EditTaskApproval.displayName = 'EditTaskApproval'
export default EditTaskApproval