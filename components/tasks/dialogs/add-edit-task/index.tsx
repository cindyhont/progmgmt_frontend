import React, { createContext, Dispatch, FormEvent, memo, useCallback, useContext, useEffect, useReducer, useRef, useMemo } from "react";
import Stack from '@mui/material/Stack';
import { Iactions, reducer, TaskEdit, upsertObjAction } from "./reducer";
import { ReduxState, useAppSelector } from "@reducers";
import { toggleDialogAction } from "@components/tasks/reducers/dialog-ctxmenu-status";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useAddTaskMutation } from "@components/tasks/reducers/api";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { taskFieldSelector } from "@components/tasks/reducers/slice";
import { v4 as uuidv4 } from 'uuid'
import MultiUserSelect from "./multi-users";
import DatePicker from "./date-picker";
import SingleUserSelect from "./single-user-select";
import AddEditTaskAccordion from "./accordion";
import Button from "@mui/material/Button";
import TextInput from "./text-field";
import NumericInput from "./numeric-input";
import ParentSelector from "./parent-selector";
import DropDown from "./drop-down";
import { DialogCtxMenuDispatchContext } from "@components/tasks/contexts";
import { TaskField } from "@components/tasks/interfaces";
import { shallowEqual } from "react-redux";
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { useTheme } from "@mui/material";
import Typography from '@mui/material/Typography'
import Description from "./description";

const 
    initialState:TaskEdit = {
        id:uuidv4(),
        name:'',
        description:'',
        createDT:0,
        startDT:0,
        deadlineDT:0,
        owner:'',
        supervisors:[],
        participants:[],
        viewers:[],
        trackTime:false,
        hourlyRate:0,
        approval:25,
        fileIDs:[],
        filesToDelete:[],
        parents:[],
        parent:'',

        withTimeFrame:false,
        isGroupTask:false,

        hourlyRate_edit:'',
        assignee:'',

        startDT_edit:null,
        deadlineDT_edit:null,

        sent:false,

        hasFiles:false,
        files:[],
    },
    AddTaskDialog = memo((
        {
            open,
            addTaskDefaultObj
        }:{
            open:boolean;
            addTaskDefaultObj:{[k:string]:any};
        }
    ) => {
        const 
            [state,addEditTaskDispatch] = useReducer(reducer,initialState),
            extraFieldObjSelector = useMemo(()=>createSelector(
                (s:ReduxState)=>taskFieldSelector.selectAll(s).filter(e=>!!e.details && e.fieldType !== 'order_in_board_column').map(e=>({[e.id]:e.details.default})).reduce((p,c)=>({...p,...c})),
                (a:{ [x: string]: any; })=>a
            ),[]),
            boardColumnID = useAppSelector(s=>taskFieldSelector.selectAll(s).find(e=>e.fieldType==='board_column').id),
            extraFieldObj = useAppSelector(s=>extraFieldObjSelector(s),shallowEqual),
            extraFieldIDs = useAppSelector(s=>taskFieldSelector.selectAll(s).filter(e=>e.fieldType!=='board_column').map(({id})=>id)),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            updateDialogStatus = useCallback((e:boolean)=>dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'addTask',open:e})),[]),
            [addTask] = useAddTaskMutation(),
            formOnSubmit = async() => {
                updateDialogStatus(false)
                addTask(state)
            },
            uid = useAppSelector(state => state.misc.uid)

        useEffect(()=>{
            addEditTaskDispatch(upsertObjAction({
                ...initialState,
                assignee:uid,
                ...extraFieldObj,
                ...addTaskDefaultObj,
                id:uuidv4()
            }))
        },[])

        useEffect(()=>{
            if (open) addEditTaskDispatch(upsertObjAction({
                ...initialState,
                assignee:uid,
                ...extraFieldObj,
                ...addTaskDefaultObj,
                id:uuidv4()
            }))
        },[
            extraFieldObj,
            addTaskDefaultObj,
            open
        ])

        return <AddEditTaskDialog {...{
            state,
            addEditTaskDispatch,
            open,
            onClose:()=>updateDialogStatus(false),
            onOpen:()=>updateDialogStatus(true),
            formOnSubmit,
            boardColumnID,
            extraFieldIDs,
        }} />
    }),
    Context = createContext<{addEditTaskDispatch: Dispatch<Iactions>}>({addEditTaskDispatch:()=>{}}),
    AddEditTaskDialog = (
        {
            state,
            open,
            addEditTaskDispatch,
            onClose,
            onOpen,
            formOnSubmit,
            boardColumnID,
            extraFieldIDs,
        }:{
            state:TaskEdit;
            open:boolean;
            addEditTaskDispatch: Dispatch<Iactions>;
            onClose:()=>void;
            onOpen:()=>void;
            formOnSubmit:()=>void;
            boardColumnID:EntityId;
            extraFieldIDs:EntityId[];
        }
    ) => {
        const
            {zIndex:{drawer},palette:{mode}} = useTheme(),
            hiddenSubmitRef = useRef<HTMLInputElement>(),
            submitOnClick = () => hiddenSubmitRef.current.click(),
            onSubmit = (e:FormEvent) => {
                e.preventDefault()
                formOnSubmit()
            },
            topRef = useRef<HTMLDivElement>(),
            container = useRef<HTMLFormElement>(),
            sticky = (m:'light'|'dark',position:'sticky'|'fixed') => ({
                position,
                width:'100%',
                zIndex:drawer+3,
                ...(m==='light' ? {
                    backgroundColor:'#fff'
                } : {
                    backgroundImage:'linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15))',
                    backgroundColor:'#121212',
                })
            })

        useEffect(()=>{
            if (open) topRef.current.scrollIntoView()
            else {
                const 
                    wysiwygEnabledBtns = document.getElementsByClassName('tox-tbtn--enabled') as HTMLCollectionOf<HTMLButtonElement>,
                    len = wysiwygEnabledBtns.length
                
                for (let i=0; i<len; i++){
                    wysiwygEnabledBtns.item(i).click()
                }
            }
        },[open])

        return (
            <SwipeableDrawer
                open={open} 
                onClose={onClose} 
                onOpen={onOpen}
                anchor='right'
                swipeAreaWidth={open ? 20 : 0}
                keepMounted
                sx={{
                    zIndex:drawer+2,
                    position:'relative',
                    maxWidth:'100vw',
                }}
            >
                <div ref={topRef} />
                <Box
                    sx={{
                        ...sticky(mode,'sticky'),
                        top:'0px',
                    }}
                >
                    <Typography variant="h6" sx={{p:2,pb:1}}>Add Task</Typography>
                </Box>
                <Box component='form' onSubmit={onSubmit} ref={container}>
                    <Context.Provider value={{addEditTaskDispatch}}>
                        <Stack
                            direction='column'
                            spacing={2}
                            sx={{
                                px:2,
                                mb:2,
                                mt:1,
                                border:'none',
                                maxWidth:'100vw'
                            }}
                        >
                            <ComponentDivert {...{state,field:'name'}} />
                            <Description {...{
                                value:state.description,
                                field:'description',
                                label:'Description',
                                files:state.files,
                            }} />
                            <ParentSelector {...{open,field:'parent'}} />
                            <ComponentDivert {...{state,field:boardColumnID as string}} />
                        </Stack>
                        <AddEditTaskAccordion {...{
                            title:'Enable time frame',
                            field:'withTimeFrame',
                            expanded:state.withTimeFrame
                        }}>
                            <Grid container direction='row' pt={1} spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <DatePicker {...{
                                        label:"Task Start",
                                        field:'startDT',
                                        value:state.startDT_edit ?? null,
                                        maxDate:state.deadlineDT_edit ?? null,
                                        minDate:null
                                    }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DatePicker {...{
                                        label:"Task End",
                                        field:'deadlineDT',
                                        value:state.deadlineDT_edit ?? null,
                                        maxDate:null,
                                        minDate:state.startDT_edit ?? null
                                    }} />
                                </Grid>
                            </Grid>
                        </AddEditTaskAccordion>
                        <AddEditTaskAccordion {...{
                            title:'As group task',
                            field:'isGroupTask',
                            expanded:state.isGroupTask
                        }}>
                            <Stack direction='column' spacing={2} mt={1}>
                                <SingleUserSelect {...{
                                    label:"Assignee",
                                    field:'assignee',
                                    value:!!state.assignee ? state.assignee.toString() : '',
                                    required:state.isGroupTask
                                }} />
                                {['supervisors','participants','viewers'].map(field=>(
                                    <ComponentDivert {...{state,field}} key={field} />
                                ))}
                            </Stack>
                        </AddEditTaskAccordion>
                        <AddEditTaskAccordion {...{
                            title:'Track time',
                            field:'trackTime',
                            expanded:state.trackTime
                        }}>
                            <NumericInput {...{
                                label:'Hourly rate',
                                value:state.hourlyRate_edit,
                                field:'hourlyRate',
                                required:state.trackTime
                            }} />
                        </AddEditTaskAccordion>
                    </Context.Provider>
                    <input type='submit' hidden ref={hiddenSubmitRef} />
                    <Stack
                        sx={{
                            p:2,
                            visibility:'hidden'
                        }}
                        direction='row'
                    >
                        <Button disabled>OK</Button>
                    </Stack>
                </Box>
                <Stack
                    sx={{
                        ...sticky(mode,'fixed'),
                        bottom:'0px',
                        p:2
                    }}
                    direction='row'
                    spacing={2}
                >
                    <Button variant="contained" onClick={submitOnClick}>Submit</Button>
                    <Button onClick={onClose}>Cancel</Button>
                </Stack>
            </SwipeableDrawer>
        )
    },
    ComponentDivert = (
        {
            state,
            field
        }:{
            state:TaskEdit;
            field:string;
        }
    )=>{
        const
            fieldNameAndTypeSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskFieldSelector.selectById(state,field),
                (fieldObj:TaskField)=>({
                    fieldType:fieldObj?.fieldType || '',
                    label:fieldObj?.fieldName || ''
                })
            ),[field]),
            {fieldType,label} = useAppSelector(state => fieldNameAndTypeSelector(state))

        if (fieldType==='short_text') return (
            <TextInput {...{
                label,
                field,
                maxLength:100,
                value:state[field],
                required:field==='name'
            }} />
        )
        else if ((['board_column','dropdown'] as EntityId[]).includes(fieldType)) return (
            <DropDown {...{
                label,
                id:field,
                value:state[field]
            }} />
        )
        else if (fieldType==='people') return (
            <MultiUserSelect {...{
                label,
                field,
                value:state[field] as string[]
            }} />
        )
        else return <></>
    }

AddEditTaskDialog.displayName = 'AddEditTaskDialog'
AddTaskDialog.displayName = 'AddTaskDialog'
export {
    AddTaskDialog,
    Context
}